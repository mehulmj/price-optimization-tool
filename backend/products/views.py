from django.contrib.auth import get_user_model
from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from commons.permissions import IsAdminOrSupplierOwner, is_admin_user
from .models import Product, ProductPriceHistory
from .serializers import ProductSerializer, ProductPriceHistorySerializer

User = get_user_model()

class ProductViewSet(viewsets.ModelViewSet):
    """
    - Buyer: SAFE_METHODS allowed (list/detail)
    - Supplier: CRUD allowed but only on their own products
    - Admin: full access
    """
    queryset = Product.objects.all().select_related("owner").order_by("-updated_at")
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrSupplierOwner]

    # search/order support
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "category"]
    ordering_fields = ["updated_at", "current_price", "stock_qty", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            # if you want anonymous SAFE reads, toggle in permission
            return qs.none()
        role = getattr(getattr(user, "profile", None), "role", "buyer")
        # Buyers see only active products; suppliers/admin see all
        if role == "buyer":
            return qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        """
        Supplier => owner=self
        Admin => owner can be set via payload 'owner' (user id). If invalid/missing, fallback to admin self.
        """
        user = self.request.user
        if is_admin_user(user) and self.request.data.get("owner"):
            owner_id = self.request.data.get("owner")
            owner = User.objects.filter(pk=owner_id).first()
            serializer.save(owner=owner or user)
        else:
            serializer.save(owner=user)

    def perform_update(self, serializer):
        """
        Save and create ProductPriceHistory if current_price changed.
        """
        instance = self.get_object()
        old_price = instance.current_price
        obj = serializer.save()
        new_price = obj.current_price
        if old_price != new_price:
            ProductPriceHistory.objects.create(
                product=obj,
                old_price=old_price,
                new_price=new_price,
                changed_by=self.request.user,
                reason=self.request.data.get("reason", "")
            )

    @action(detail=True, methods=["get"], url_path="price-history")
    def price_history(self, request, pk=None):
        product = self.get_object()
        ph = product.price_history.all().order_by("-changed_at")  # newest first
        data = ProductPriceHistorySerializer(ph, many=True).data
        return Response(data)

    @action(detail=False, methods=["get"], url_path="mine", permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """Suppliers get only their products (paginated)."""
        qs = self.get_queryset().filter(owner=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return Response(ser.data)
