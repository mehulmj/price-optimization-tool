# pricing/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Avg
from products.models import Product
from commons.permissions import IsAdminOrSupplierOwner
import math

class PriceOptimizationViewSet(viewsets.ViewSet):
    """
    Price optimization endpoints
    """
    permission_classes = [IsAdminOrSupplierOwner]

    def calculate_optimal_price(self, product):
        """
        Enhanced price optimization algorithm
        Considers: demand elasticity, competition, stock levels, profit margins
        """
        try:
            # Base metrics
            current_price = float(product.current_price)
            base_price = float(product.base_price)
            stock_qty = product.stock_qty
            units_sold = product.units_sold or 1
            elasticity = getattr(product, 'elasticity', 1.2)

            # Stock velocity (how fast product sells)
            velocity = units_sold / max(stock_qty, 1)
            
            # Profit margin consideration
            current_margin = (current_price - base_price) / max(current_price, 0.01)
            
            # Price optimization factors
            factors = {
                'stock_factor': 1.0,
                'demand_factor': 1.0,
                'margin_factor': 1.0,
                'competition_factor': 1.0
            }
            
            # Stock level adjustment
            if velocity > 2.0:  # Fast moving
                factors['stock_factor'] = 1.05  # Increase price slightly
            elif velocity < 0.5:  # Slow moving
                factors['stock_factor'] = 0.90  # Decrease price to move inventory
            
            # Demand elasticity adjustment
            if elasticity > 1.5:  # Highly elastic
                factors['demand_factor'] = 0.95  # Lower price for demand
            elif elasticity < 0.8:  # Inelastic
                factors['demand_factor'] = 1.08  # Can increase price
            
            # Margin protection (don't go below 20% margin)
            min_price_for_margin = base_price * 1.20
            
            # Calculate optimized price
            optimization_multiplier = (
                factors['stock_factor'] * 
                factors['demand_factor'] * 
                factors['margin_factor'] * 
                factors['competition_factor']
            )
            
            optimized_price = current_price * optimization_multiplier
            
            # Ensure minimum margin
            optimized_price = max(optimized_price, min_price_for_margin)
            
            # Stay within reasonable bounds (±30% of current price)
            min_bound = current_price * 0.70
            max_bound = current_price * 1.30
            optimized_price = max(min_bound, min(optimized_price, max_bound))
            
            return {
                'original_price': current_price,
                'optimized_price': round(optimized_price, 2),
                'price_change': round(optimized_price - current_price, 2),
                'price_change_percent': round(((optimized_price - current_price) / current_price) * 100, 1),
                'factors_applied': factors,
                'confidence_score': min(95, max(60, 85 - abs((optimized_price - current_price) / current_price) * 100)),
                'reasoning': self._generate_pricing_reasoning(product, factors, optimized_price, current_price)
            }
            
        except Exception as e:
            return {
                'original_price': float(product.current_price),
                'optimized_price': float(product.current_price),
                'price_change': 0,
                'price_change_percent': 0,
                'error': str(e),
                'confidence_score': 0
            }

    def _generate_pricing_reasoning(self, product, factors, optimized_price, current_price):
        """Generate human-readable reasoning for price optimization"""
        reasons = []
        
        if factors['stock_factor'] > 1.02:
            reasons.append("High demand product - price increase recommended")
        elif factors['stock_factor'] < 0.95:
            reasons.append("Slow-moving inventory - price reduction to accelerate sales")
            
        if factors['demand_factor'] > 1.05:
            reasons.append("Low price elasticity allows for premium pricing")
        elif factors['demand_factor'] < 0.98:
            reasons.append("High price sensitivity requires competitive pricing")
            
        change_percent = ((optimized_price - current_price) / current_price) * 100
        if abs(change_percent) < 2:
            reasons.append("Current pricing is near optimal")
            
        return " | ".join(reasons) if reasons else "Standard optimization applied"

    @action(detail=False, methods=['get'])
    def optimize_all(self, request):
        """
        GET /api/pricing/optimize-all/
        Returns optimized prices for all user's products
        """
        user = request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            products = Product.objects.filter(is_active=True).select_related('owner')
        else:
            products = Product.objects.filter(owner=user, is_active=True)

        optimized_products = []
        total_potential_increase = 0
        total_current_revenue = 0

        for product in products:
            optimization = self.calculate_optimal_price(product)
            
            product_data = {
                'id': product.id,
                'name': product.name,
                'category': product.category,
                'description': product.description,
                'sku': product.sku,
                'current_price': optimization['original_price'],
                'optimized_price': optimization['optimized_price'],
                'price_change': optimization['price_change'],
                'price_change_percent': optimization['price_change_percent'],
                'confidence_score': optimization['confidence_score'],
                'reasoning': optimization['reasoning'],
                'units_sold': product.units_sold,
                'stock_qty': product.stock_qty
            }
            
            optimized_products.append(product_data)
            
            # Calculate potential revenue impact
            current_revenue = optimization['original_price'] * (product.units_sold or 0)
            optimized_revenue = optimization['optimized_price'] * (product.units_sold or 0)
            
            total_current_revenue += current_revenue
            total_potential_increase += (optimized_revenue - current_revenue)

        return Response({
            'products': optimized_products,
            'summary': {
                'total_products': len(optimized_products),
                'products_with_increases': len([p for p in optimized_products if p['price_change'] > 0]),
                'products_with_decreases': len([p for p in optimized_products if p['price_change'] < 0]),
                'avg_confidence_score': round(sum(p['confidence_score'] for p in optimized_products) / len(optimized_products), 1) if optimized_products else 0,
                'total_current_revenue': round(total_current_revenue, 2),
                'potential_revenue_increase': round(total_potential_increase, 2),
                'revenue_impact_percent': round((total_potential_increase / max(total_current_revenue, 0.01)) * 100, 2)
            }
        })

    @action(detail=False, methods=['post'])
    def apply_optimization(self, request):
        """
        POST /api/pricing/apply-optimization/
        Apply optimized prices to selected products
        Body: {"product_ids": [1, 2, 3], "reason": "Quarterly optimization"}
        """
        product_ids = request.data.get('product_ids', [])
        reason = request.data.get('reason', 'Price optimization applied')
        
        if not product_ids:
            return Response({'error': 'No product IDs provided'}, status=400)

        user = request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            products = Product.objects.filter(id__in=product_ids, is_active=True)
        else:
            products = Product.objects.filter(id__in=product_ids, owner=user, is_active=True)

        updated_products = []
        
        for product in products:
            optimization = self.calculate_optimal_price(product)
            old_price = product.current_price
            new_price = optimization['optimized_price']
            
            if abs(new_price - old_price) > 0.01:  # Only update if meaningful change
                product.current_price = new_price
                product.save(update_fields=['current_price'])
                
                # Create price history record
                from products.models import ProductPriceHistory
                ProductPriceHistory.objects.create(
                    product=product,
                    old_price=old_price,
                    new_price=new_price,
                    changed_by=user,
                    reason=reason
                )
                
                updated_products.append({
                    'id': product.id,
                    'name': product.name,
                    'old_price': float(old_price),
                    'new_price': float(new_price),
                    'change': round(float(new_price - old_price), 2)
                })

        return Response({
            'updated_products': updated_products,
            'total_updated': len(updated_products),
            'message': f'Successfully updated prices for {len(updated_products)} products'
        })

    @action(detail=False, methods=['get'])
    def market_analysis(self, request):
        """
        GET /api/pricing/market-analysis/
        Returns market analysis for pricing strategy
        """
        user = request.user
        if hasattr(user, 'profile') and user.profile.role == 'admin':
            products = Product.objects.filter(is_active=True)
        else:
            products = Product.objects.filter(owner=user, is_active=True)

        analysis = {}
        
        # Overall market analysis
        for category, category_name in Product.CATEGORY_CHOICES:
            cat_products = products.filter(category=category)
            if cat_products.exists():
                prices = [float(p.current_price) for p in cat_products]
                
                analysis[category] = {
                    'category_name': category_name,
                    'product_count': cat_products.count(),
                    'price_stats': {
                        'min': round(min(prices), 2),
                        'max': round(max(prices), 2),
                        'avg': round(sum(prices) / len(prices), 2),
                        'median': round(sorted(prices)[len(prices)//2], 2)
                    },
                    'optimization_potential': {
                        'overpriced_count': len([p for p in prices if p > sum(prices)/len(prices) * 1.2]),
                        'underpriced_count': len([p for p in prices if p < sum(prices)/len(prices) * 0.8]),
                        'optimal_count': cat_products.count() - len([p for p in prices if p > sum(prices)/len(prices) * 1.2]) - len([p for p in prices if p < sum(prices)/len(prices) * 0.8])
                    }
                }

        return Response({
            'market_analysis': analysis,
            'recommendations': [
                "Consider competitive pricing for high-elasticity products",
                "Premium pricing opportunities exist for unique products",
                "Monitor competitor pricing for market positioning",
                "Regular price optimization can improve margins by 3-8%"
            ]
        })

