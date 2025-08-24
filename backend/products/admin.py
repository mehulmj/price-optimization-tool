# products/admin.py
from django.contrib import admin
from .models import Product, ProductPriceHistory

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "sku", "category", "current_price", "stock_qty", "owner", "updated_at")
    list_filter = ("category", "is_active")
    search_fields = ("name", "sku", "owner__username")

@admin.register(ProductPriceHistory)
class ProductPriceHistoryAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "old_price", "new_price", "changed_by", "changed_at")
    search_fields = ("product__name", "product__sku", "changed_by__username")
