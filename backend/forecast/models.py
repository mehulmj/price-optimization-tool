# backend/forecast/models.py
from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

class DemandForecast(models.Model):
    """Store demand forecast data for products"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="forecasts")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Forecast metadata
    forecast_method = models.CharField(max_length=50, default="historical_simulation")
    version = models.PositiveIntegerField(default=1)
    
    # Time period
    start_year = models.PositiveIntegerField(default=2020)
    end_year = models.PositiveIntegerField(default=2024)
    
    # Forecast data stored as JSON
    # Format: [{"year": 2020, "demand": 100}, {"year": 2021, "demand": 120}, ...]
    forecast_data = models.JSONField(default=list)
    
    # Demand vs Price data for linear plot
    # Format: [{"price": 10.0, "demand": 80}, {"price": 15.0, "demand": 60}, ...]
    demand_price_curve = models.JSONField(default=list)
    
    # Summary statistics
    total_forecasted_demand = models.PositiveIntegerField(default=0)
    confidence_score = models.FloatField(default=0.85)  # 0-1 scale
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["created_by"]),
            models.Index(fields=["forecast_method"]),
        ]
        
    def __str__(self):
        return f"Forecast for {self.product.name} ({self.forecast_method})"