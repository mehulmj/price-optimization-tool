# backend/forecast/views.py
import math
import random
from django.db.models import Avg, Sum, Count
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from commons.permissions import IsAdminOrSupplierOwner
from products.models import Product
from .models import DemandForecast
from .serializers import (
    DemandForecastSerializer, 
    ForecastRequestSerializer, 
    ForecastSummarySerializer
)

class DemandForecastService:
    """Service class for demand forecasting algorithms"""
    
    @staticmethod
    def generate_historical_simulation(product, years=5):
        """Generate historical demand simulation based on product data"""
        base_demand = product.demand_forecast or (product.units_sold * 0.018) or 100
        start_year = 2025 - years
        
        # Create realistic historical trends
        forecast_data = []
        for i, year in enumerate(range(start_year, 2025)):
            # Different growth patterns based on product category
            if product.category == "electronics":
                # Tech products: rapid early growth, then plateau
                growth_factor = 1.0 + (0.15 * math.exp(-i * 0.3))
            elif product.category == "other":
                # Other products: steady moderate growth
                growth_factor = 1.0 + (i * 0.05)
            else:
                # Default: slight growth with some volatility
                growth_factor = 1.0 + (i * 0.03) + (random.uniform(-0.1, 0.1))
            
            # Add some seasonality
            seasonal_factor = 1 + 0.1 * math.sin((i * 2 * math.pi) / 4)
            
            year_demand = int(base_demand * growth_factor * seasonal_factor)
            forecast_data.append({
                "year": year,
                "demand": max(0, year_demand)
            })
        
        return forecast_data
    
    @staticmethod
    def generate_demand_price_curve(product):
        """Generate demand vs price curve for linear plot"""
        base_price = float(product.current_price)
        base_demand = product.demand_forecast or (product.units_sold * 0.018) or 100
        
        # Price elasticity based on category
        elasticity_map = {
            "electronics": -1.5,  # Elastic
            "other": -1.0,        # Unit elastic
        }
        elasticity = elasticity_map.get(product.category, -1.2)
        
        # Generate price points (±50% of current price)
        price_points = []
        for i in range(11):  # 11 points for smooth curve
            price_multiplier = 0.5 + (i * 0.1)  # 0.5 to 1.5
            price = base_price * price_multiplier
            
            # Demand = base_demand * (price_ratio ^ elasticity)
            price_ratio = price / base_price
            demand = base_demand * (price_ratio ** elasticity)
            
            price_points.append({
                "price": round(price, 2),
                "demand": max(0, int(demand))
            })
        
        return price_points

class DemandForecastViewSet(viewsets.ModelViewSet):
    """API endpoints for demand forecasting"""
    queryset = DemandForecast.objects.all()
    serializer_class = DemandForecastSerializer
    permission_classes = [IsAdminOrSupplierOwner]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Filter by user role
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            return qs
        else:
            # Suppliers see only forecasts for their products
            return qs.filter(product__owner=user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        POST /api/forecast/generate/
        Generate demand forecasts for specified products
        Body: {"product_ids": [1, 2, 3], "method": "historical_simulation", "years": 5}
        """
        serializer = ForecastRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        product_ids = serializer.validated_data['product_ids']
        method = serializer.validated_data['method']
        years = serializer.validated_data['years']
        
        # Filter products by user permissions
        user = request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            products = Product.objects.filter(id__in=product_ids, is_active=True)
        else:
            products = Product.objects.filter(id__in=product_ids, owner=user, is_active=True)
        
        if not products.exists():
            return Response(
                {"detail": "No accessible products found with the provided IDs"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        generated_forecasts = []
        service = DemandForecastService()
        
        for product in products:
            # Generate forecast data
            if method == "historical_simulation":
                forecast_data = service.generate_historical_simulation(product, years)
            else:
                # Fallback to historical simulation for now
                forecast_data = service.generate_historical_simulation(product, years)
            
            # Generate demand vs price curve
            demand_price_curve = service.generate_demand_price_curve(product)
            
            # Calculate summary statistics
            total_demand = sum(item['demand'] for item in forecast_data)
            
            # Create or update forecast record
            forecast, created = DemandForecast.objects.update_or_create(
                product=product,
                forecast_method=method,
                defaults={
                    'created_by': user,
                    'version': 1,
                    'start_year': 2025 - years,
                    'end_year': 2024,
                    'forecast_data': forecast_data,
                    'demand_price_curve': demand_price_curve,
                    'total_forecasted_demand': total_demand,
                    'confidence_score': 0.85,  # Default confidence
                }
            )
            
            generated_forecasts.append(DemandForecastSerializer(forecast).data)
        
        return Response({
            'message': f'Generated forecasts for {len(generated_forecasts)} products',
            'forecasts': generated_forecasts
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        GET /api/forecast/overview/
        Get forecast overview/summary for dashboard
        """
        user = request.user
        
        # Filter forecasts by user permissions
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            forecasts = DemandForecast.objects.all()
        else:
            forecasts = DemandForecast.objects.filter(product__owner=user)
        
        if not forecasts.exists():
            return Response({
                'total_products': 0,
                'total_forecasted_demand': 0,
                'average_confidence': 0,
                'forecast_by_category': {},
                'recent_forecasts': []
            })
        
        # Calculate summary statistics
        total_products = forecasts.values('product').distinct().count()
        total_demand = forecasts.aggregate(Sum('total_forecasted_demand'))['total_forecasted_demand'] or 0
        avg_confidence = forecasts.aggregate(Avg('confidence_score'))['confidence_score'] or 0
        
        # Group by category
        category_data = {}
        for forecast in forecasts.select_related('product'):
            category = forecast.product.category
            if category not in category_data:
                category_data[category] = {
                    'product_count': 0,
                    'total_demand': 0,
                    'avg_confidence': 0
                }
            category_data[category]['product_count'] += 1
            category_data[category]['total_demand'] += forecast.total_forecasted_demand
        
        # Recent forecasts
        recent_forecasts = forecasts.order_by('-created_at')[:5]
        
        summary_data = {
            'total_products': total_products,
            'total_forecasted_demand': total_demand,
            'average_confidence': round(avg_confidence, 2),
            'forecast_by_category': category_data,
            'recent_forecasts': DemandForecastSerializer(recent_forecasts, many=True).data
        }
        
        return Response(summary_data)

    @action(detail=False, methods=['get'])
    def chart_data(self, request):
        """
        GET /api/forecast/chart-data/
        Get formatted data for frontend charts
        """
        user = request.user
        product_ids = request.query_params.get('product_ids', '').split(',')
        
        # Filter forecasts
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            forecasts_qs = DemandForecast.objects.all()
        else:
            forecasts_qs = DemandForecast.objects.filter(product__owner=user)
        
        if product_ids and product_ids != ['']:
            try:
                product_ids = [int(pid) for pid in product_ids if pid.strip()]
                forecasts_qs = forecasts_qs.filter(product_id__in=product_ids)
            except ValueError:
                return Response(
                    {"detail": "Invalid product IDs"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get latest forecasts for each product
        forecasts = forecasts_qs.select_related('product').order_by('product_id', '-created_at').distinct('product_id')[:4]
        
        if not forecasts.exists():
            return Response({
                'historical_data': [],
                'demand_price_curves': []
            })
        
        # Format historical data for line chart
        years = set()
        for forecast in forecasts:
            for item in forecast.forecast_data:
                years.add(item['year'])
        
        years = sorted(years)
        historical_data = []
        
        for year in years:
            year_data = {'year': year}
            for forecast in forecasts:
                product_name = forecast.product.name
                # Find demand for this year
                year_demand = 0
                for item in forecast.forecast_data:
                    if item['year'] == year:
                        year_demand = item['demand']
                        break
                year_data[product_name] = year_demand
            historical_data.append(year_data)
        
        # Format demand vs price curves
        demand_price_curves = []
        for forecast in forecasts:
            demand_price_curves.append({
                'product_id': forecast.product.id,
                'product_name': forecast.product.name,
                'curve_data': forecast.demand_price_curve
            })
        
        return Response({
            'historical_data': historical_data,
            'demand_price_curves': demand_price_curves
        })