# products/serializers.py - Updated to include all CSV fields
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Product, ProductPriceHistory

User = get_user_model()

class ProductSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source="owner.username", read_only=True)
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    
    # Computed fields for frontend
    profit_margin = serializers.ReadOnlyField()
    stock_velocity = serializers.ReadOnlyField()
    revenue_potential = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "owner", "owner_id", "owner_username",
            "name", "category", "description",
            
            # Price fields
            "base_price", "current_price", "min_price", "max_price",
            "optimized_price",  # From CSV
            
            # Stock and sales
            "stock_qty", "units_sold",
            
            # Analytics from CSV
            "customer_rating",  # From CSV
            "demand_forecast",  # From CSV
            "elasticity",
            
            # Computed fields
            "profit_margin", "stock_velocity", "revenue_potential",
            
            # Status and dates
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = [
            "owner", "owner_id", "owner_username", 
            "created_at", "updated_at",
            "profit_margin", "stock_velocity", "revenue_potential"
        ]

    def validate(self, attrs):
        """Validate price relationships and ratings"""
        min_p = attrs.get("min_price", getattr(self.instance, "min_price", 0))
        max_p = attrs.get("max_price", getattr(self.instance, "max_price", 0))
        cur_p = attrs.get("current_price", getattr(self.instance, "current_price", 0))
        rating = attrs.get("customer_rating", getattr(self.instance, "customer_rating", 0))
        
        # Price validation
        if min_p > 0 and max_p > 0 and min_p > max_p:
            raise serializers.ValidationError({"min_price": "min_price cannot be greater than max_price"})
        if min_p > 0 and max_p > 0 and not (min_p <= cur_p <= max_p):
            raise serializers.ValidationError({"current_price": "current_price must be within [min_price, max_price]"})
        
        # Rating validation (0-5 stars)
        if rating < 0 or rating > 5:
            raise serializers.ValidationError({"customer_rating": "Customer rating must be between 0 and 5"})
            
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Never allow owner change via payload
        validated_data.pop("owner", None)
        return super().update(instance, validated_data)


class ProductPriceHistorySerializer(serializers.ModelSerializer):
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    changed_by_username = serializers.CharField(source="changed_by.username", read_only=True)

    class Meta:
        model = ProductPriceHistory
        fields = [
            "id", "product", "product_sku", "product_name",
            "old_price", "new_price",
            "changed_by", "changed_by_username",
            "reason", "changed_at"
        ]
        read_only_fields = ["changed_at", "changed_by"]