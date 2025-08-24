# backend/forecast/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DemandForecastViewSet

router = DefaultRouter()
router.register(r'', DemandForecastViewSet, basename='forecast')

urlpatterns = [
    path('', include(router.urls)),
]

# This creates these endpoints:
# GET /api/forecast/ - List all forecasts
# POST /api/forecast/ - Create new forecast  
# GET /api/forecast/{id}/ - Get specific forecast
# PUT/PATCH /api/forecast/{id}/ - Update forecast
# DELETE /api/forecast/{id}/ - Delete forecast

# Custom endpoints:
# POST /api/forecast/generate/ - Generate new forecasts
# GET /api/forecast/overview/ - Get summary statistics
# GET /api/forecast/chart-data/ - Get data for charts