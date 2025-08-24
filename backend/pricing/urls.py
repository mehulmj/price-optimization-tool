# pricing/urls.py  
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PriceOptimizationViewSet

router = DefaultRouter()
router.register(r'', PriceOptimizationViewSet, basename='pricing')

urlpatterns = [
    path('', include(router.urls)),
]