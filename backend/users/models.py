from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("buyer", "Buyer"),
        ("supplier", "Supplier"),
        ("admin", "Admin"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="buyer")

    def __str__(self):
        return f"{self.user.username} ({self.role})"


class SupplierRequest(models.Model):
    PENDING, APPROVED, REJECTED = "pending", "approved", "rejected"
    STATUS_CHOICES = [(PENDING, "Pending"), (APPROVED, "Approved"), (REJECTED, "Rejected")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="supplier_request")
    company = models.CharField(max_length=200, blank=True)
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self):
        return f"{self.user.username} request ({self.status})"
