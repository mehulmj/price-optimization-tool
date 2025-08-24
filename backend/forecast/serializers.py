# backend/forecast/serializers.py
from rest_framework import serializers
from products.models import Product
from .models import DemandForecast

class DemandForecastSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_category = serializers.CharField(source="product.category", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = DemandForecast
        fields = [
            "id", "product", "product_name", "product_category",
            "forecast_method", "version", "start_year", "end_year",
            "forecast_data", "demand_price_curve", 
            "total_forecasted_demand", "confidence_score",
            "created_by", "created_by_username", "created_at", "updated_at"
        ]
        read_only_fields = ["created_by", "created_by_username", "created_at", "updated_at"]

class ForecastRequestSerializer(serializers.Serializer):
    """Serializer for forecast generation requests"""
    product_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of product IDs to generate forecasts for"
    )
    method = serializers.ChoiceField(
        choices=[
            ("historical_simulation", "Historical Simulation"),
            ("price_elasticity", "Price Elasticity Model"),
            ("trend_analysis", "Trend Analysis")
        ],
        default="historical_simulation"
    )
    years = serializers.IntegerField(default=5, min_value=1, max_value=10)

class ForecastSummarySerializer(serializers.Serializer):
    """Serializer for forecast overview/summary"""
    total_products = serializers.IntegerField()
    total_forecasted_demand = serializers.IntegerField()
    average_confidence = serializers.FloatField()
    forecast_by_category = serializers.JSONField()
    recent_forecasts = DemandForecastSerializer(many=True)