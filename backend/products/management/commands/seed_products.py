# backend/products/management/commands/seed_products.py - Fixed imports
import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.contrib.auth import get_user_model
from django.db import models  # ✅ Add this import

from products.models import Product, ProductPriceHistory

User = get_user_model()

CSV_HEADERS = [
    "product_id", "name", "description", "cost_price", "selling_price",
    "category", "stock_available", "units_sold", "customer_rating",
    "demand_forecast", "optimized_price",
]

CATEGORY_MAP = {
    "electronics": "electronics",
    "grocery": "grocery", 
    "stationery": "stationery",
    "stationary": "stationery",  # Handle common typo
    "outdoor & sports": "other",
    "apparel": "other",
    "home automation": "electronics",
    "transportation": "other",
    "wearables": "electronics",
}

def to_decimal(value, default="0"):
    """Convert value to Decimal, handling empty/invalid values"""
    if value is None or str(value).strip() == "":
        value = default
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal(str(default))

def to_int(value, default=0):
    """Convert value to int, handling decimals and invalid values"""
    try:
        return int(float(str(value)))  # Handle "131244.0" format
    except Exception:
        return default

def normalize_category(raw):
    """Map CSV categories to our model choices"""
    if not raw:
        return "other"
    key = str(raw).strip().lower()
    return CATEGORY_MAP.get(key, "other")

def make_sku(row):
    """Generate SKU from product_id or name"""
    pid = str(row.get("product_id") or "").strip()
    name = str(row.get("name") or "").strip()
    if pid:
        return f"CSV-{pid}"
    # Fallback: from name
    base = "".join(ch for ch in name.upper() if ch.isalnum())
    return f"CSV-{base or 'UNKNOWN'}"

class Command(BaseCommand):
    help = "Import products from CSV with ALL fields: optimized_price, demand_forecast, customer_rating, etc."

    def add_arguments(self, parser):
        parser.add_argument("--path", required=True, help="Path to product_data.csv")
        parser.add_argument("--owner", required=True, help="Username of supplier/admin owner")
        parser.add_argument("--dry-run", action="store_true", help="Parse only; don't write to DB")
        parser.add_argument("--preview", action="store_true", help="Show first 5 parsed rows")

    def handle(self, *args, **opts):
        csv_path = Path(opts["path"])
        if not csv_path.exists():
            raise CommandError(f"CSV not found: {csv_path}")

        owner = User.objects.filter(username__iexact=opts["owner"]).first()
        if not owner:
            raise CommandError(f"Owner user '{opts['owner']}' not found")

        # Read CSV
        with csv_path.open("r", newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise CommandError("CSV has no header row.")
            
            self.stdout.write(f"📁 CSV Headers Found: {list(reader.fieldnames)}")
            rows = list(reader)
            self.stdout.write(f"📊 Found {len(rows)} data rows")

        created = 0
        updated = 0
        price_changed = 0
        preview = []

        try:
            with transaction.atomic():
                for i, raw in enumerate(rows, start=1):
                    # Case-insensitive field mapping
                    row = {k.strip().lower(): v for k, v in raw.items() if k}

                    # Basic product info
                    sku = make_sku(row)
                    name = (row.get("name") or "").strip()
                    description = (row.get("description") or "").strip()
                    category = normalize_category(row.get("category"))

                    # Parse ALL numeric fields from CSV
                    base_price = to_decimal(row.get("cost_price"), "0")  # cost_price -> base_price
                    current_price = to_decimal(row.get("selling_price"), "0")  # selling_price -> current_price
                    optimized_price = to_decimal(row.get("optimized_price"), "0")  # ✅ From CSV
                    
                    # Stock and sales data
                    stock_qty = to_int(row.get("stock_available"), 0)
                    units_sold = to_int(row.get("units_sold"), 0)
                    
                    # Analytics fields
                    customer_rating = to_int(row.get("customer_rating"), 0)  # ✅ From CSV
                    demand_forecast = to_int(row.get("demand_forecast"), 0)  # ✅ From CSV

                    # Set price bounds
                    prices = [p for p in [base_price, current_price, optimized_price] if p > 0]
                    min_price = min(prices) if prices else Decimal("0")
                    max_price = max(prices) if prices else current_price

                    # Ensure we have a valid current_price
                    if current_price <= 0:
                        current_price = base_price if base_price > 0 else Decimal("1.00")

                    payload = {
                        "owner": owner,
                        "name": name,
                        "description": description,
                        "category": category,
                        "base_price": base_price,
                        "current_price": current_price,
                        "min_price": min_price,
                        "max_price": max_price,
                        "optimized_price": optimized_price,  # ✅ Save optimized_price from CSV
                        "stock_qty": stock_qty,
                        "units_sold": units_sold,
                        "customer_rating": max(0, min(5, customer_rating)),  # Ensure 0-5 range
                        "demand_forecast": demand_forecast,  # ✅ Save demand_forecast from CSV
                        "elasticity": 1.2,  # Default elasticity
                        "is_active": True,
                    }

                    # Preview data
                    if opts["preview"] and len(preview) < 5:
                        preview.append({
                            "sku": sku,
                            "name": name,
                            "category": category,
                            "base_price": f"${base_price}",
                            "current_price": f"${current_price}",
                            "optimized_price": f"${optimized_price}",  # ✅ Show in preview
                            "stock_qty": f"{stock_qty:,}",
                            "units_sold": f"{units_sold:,}",
                            "customer_rating": f"{customer_rating}/5",
                            "demand_forecast": f"{demand_forecast:,}",  # ✅ Show in preview
                        })

                    # Create or update product
                    try:
                        obj = Product.objects.get(sku=sku)
                        old_price = obj.current_price
                        
                        # Update all fields
                        for k, v in payload.items():
                            setattr(obj, k, v)
                        obj.save()
                        updated += 1

                        # Track price changes
                        if old_price != obj.current_price:
                            ProductPriceHistory.objects.create(
                                product=obj,
                                old_price=old_price,
                                new_price=obj.current_price,
                                changed_by=owner,
                                reason="CSV import/update",
                            )
                            price_changed += 1

                    except Product.DoesNotExist:
                        Product.objects.create(sku=sku, **payload)
                        created += 1

                if opts["dry_run"]:
                    self.stdout.write(
                        self.style.WARNING(
                            f"🔍 DRY RUN - Would create={created}, update={updated}, price_changed={price_changed}"
                        )
                    )
                    if preview:
                        self.stdout.write(self.style.HTTP_INFO("📋 Preview of data to import:"))
                        for item in preview:
                            self.stdout.write(f"  • {item}")
                    raise CommandError("Dry run completed - no data saved")

        except CommandError:
            raise

        # Success summary
        self.stdout.write(
            self.style.SUCCESS(
                f"✅ Import completed! Created={created}, Updated={updated}, PriceChanged={price_changed}"
            )
        )

        if preview:
            self.stdout.write(self.style.HTTP_INFO("📋 Sample imported products:"))
            for item in preview:
                self.stdout.write(f"  • {item}")

        # Database summary - ✅ Fixed imports
        from django.db.models import Sum, Avg, Count
        stats = Product.objects.aggregate(
            total_products=Count('id'),
            total_units_sold=Sum('units_sold'),
            total_demand_forecast=Sum('demand_forecast'),
            avg_rating=Avg('customer_rating'),
            avg_optimized_savings=Avg(models.F('current_price') - models.F('optimized_price'))
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"📊 Database Summary:\n"
                f"  • Total Products: {stats['total_products']:,}\n"
                f"  • Total Units Sold: {stats['total_units_sold']:,}\n"
                f"  • Total Demand Forecast: {stats['total_demand_forecast']:,}\n"
                f"  • Average Customer Rating: {stats['avg_rating']:.1f}/5\n"
                f"  • Average Optimization Savings: ${stats['avg_optimized_savings']:.2f}"
            )
        )