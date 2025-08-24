# products/models.py - Updated with auto-optimization for new products
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Product(models.Model):
    CATEGORY_CHOICES = [
        ("stationery", "Stationery"),
        ("electronics", "Electronics"),
        ("grocery", "Grocery"),
        ("other", "Other"),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="products")
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=64, unique=True)
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default="other")
    description = models.TextField(blank=True, default="")

    # Price fields
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)     # cost_price from CSV
    current_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # selling_price from CSV
    min_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    optimized_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # From CSV or calculated

    # Stock and sales data
    stock_qty = models.PositiveIntegerField(default=0)  # stock_available from CSV
    units_sold = models.PositiveIntegerField(default=0)  # units_sold from CSV
    
    # Analytics fields
    customer_rating = models.PositiveIntegerField(default=0)  # From CSV (1-5 rating)
    demand_forecast = models.PositiveIntegerField(default=0)  # From CSV
    elasticity = models.FloatField(default=1.2)  # Price elasticity for optimization

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["sku"]),
            models.Index(fields=["category"]),
            models.Index(fields=["owner"]),
            models.Index(fields=["demand_forecast"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    def calculate_optimized_price(self):
        """
        Calculate optimized price for new products based on business logic.
        CSV imported products keep their original optimized_price.
        """
        current_price = float(self.current_price or 0)
        cost_price = float(self.base_price or 0)
        
        if current_price == 0:
            return 0
        
        # Start with current price
        optimized = current_price
        
        # Factor 1: Stock velocity analysis
        if self.stock_qty and self.units_sold:
            velocity = self.units_sold / self.stock_qty
            
            if velocity > 2.0:  # Fast moving product
                # High demand, can increase price by 5%
                optimized = current_price * 1.05
            elif velocity < 0.5:  # Slow moving product
                # Low demand, reduce price by 5% to move inventory
                optimized = current_price * 0.95
            # else: normal velocity, keep current price
        
        # Factor 2: Category-based adjustments
        if self.category == "electronics":
            # Electronics can handle premium pricing
            optimized = optimized * 1.02
        elif self.category == "grocery":
            # Grocery is price-sensitive
            optimized = optimized * 0.98
        
        # Factor 3: Rating-based adjustment
        if self.customer_rating >= 4:
            # High-rated products can command higher prices
            optimized = optimized * 1.03
        elif self.customer_rating <= 2:
            # Low-rated products need competitive pricing
            optimized = optimized * 0.97
        
        # Constraint 1: Maintain minimum margin (cost + 20%)
        if cost_price > 0:
            min_price = cost_price * 1.20
            optimized = max(optimized, min_price)
        
        # Constraint 2: Don't exceed maximum increase (current + 30%)
        max_price = current_price * 1.30
        optimized = min(optimized, max_price)
        
        # Constraint 3: Don't go below reasonable minimum (current - 20%)
        min_allowed = current_price * 0.80
        optimized = max(optimized, min_allowed)
        
        return round(float(optimized), 2)

    def save(self, *args, **kwargs):
        # Auto-generate SKU if not provided
        if not self.sku:
            import uuid
            self.sku = f"SKU{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate optimized_price ONLY for new products (not CSV imports)
        # CSV products already have optimized_price set during import
        if not self.optimized_price or self.optimized_price == 0:
            self.optimized_price = self.calculate_optimized_price()
        
        super().save(*args, **kwargs)

    @property
    def profit_margin(self):
        """Calculate profit margin percentage"""
        if self.current_price > 0:
            return ((self.current_price - self.base_price) / self.current_price) * 100
        return 0

    @property
    def stock_velocity(self):
        """Calculate how fast product sells (units_sold / stock_qty)"""
        if self.stock_qty > 0:
            return self.units_sold / self.stock_qty
        return 0

    @property
    def revenue_potential(self):
        """Calculate potential revenue from demand forecast"""
        return float(self.optimized_price * self.demand_forecast)

    @property
    def optimization_savings(self):
        """Calculate potential savings/increase from optimization"""
        return float(self.optimized_price - self.current_price)

    @property
    def optimization_percentage(self):
        """Calculate optimization percentage change"""
        if self.current_price > 0:
            return ((self.optimized_price - self.current_price) / self.current_price) * 100
        return 0


class ProductPriceHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="price_history")
    old_price = models.DecimalField(max_digits=10, decimal_places=2)
    new_price = models.DecimalField(max_digits=10, decimal_places=2)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at"]