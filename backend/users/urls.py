# users/urls.py
from django.urls import path
from .views import (
    # Auth core
    PublicRegisterView,
    RoleTokenView,            # login
    LogoutView,               # logout (blacklist refresh)
    MeView,                   # /auth/me
    VerifyEmailView,          # GET verify link
    ResendVerificationView,   # POST resend

    # Supplier request (buyer self-service)
    SupplierRequestView,

    # Admin supplier-requests
    AdminSupplierRequestListView,
    AdminSupplierRequestDetailView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ---------- Auth ----------
    path("register/", PublicRegisterView.as_view(), name="auth-register"),
    path("login/", RoleTokenView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Email verification
    path("verify-email/<uidb64>/<token>/", VerifyEmailView.as_view(), name="auth-verify-email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="auth-resend-verification"),

    # ---------- Supplier Request (buyer) ----------
    # POST -> create request
    # GET  -> get my request + status
    # PATCH (optional) -> allow updating company/reason (if you implemented)
    path("supplier-request/", SupplierRequestView.as_view(), name="supplier-request"),

    # ---------- Admin: Supplier Requests ----------
    # GET (paginated list)
    path("admin/supplier-requests/", AdminSupplierRequestListView.as_view(), name="admin-sr-list"),
    # PATCH {status: approved|rejected}
    path("admin/supplier-requests/<int:pk>/", AdminSupplierRequestDetailView.as_view(), name="admin-sr-detail"),
]
