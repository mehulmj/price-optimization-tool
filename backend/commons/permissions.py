# backend/commons/permissions.py
from rest_framework import permissions

def get_role(user):
    """Return role from UserProfile if exists, else 'buyer'."""
    return getattr(getattr(user, "profile", None), "role", "buyer")

def is_admin_user(user):
    """Treat Django staff OR role=admin as admin."""
    return bool(getattr(user, "is_staff", False) or get_role(user) == "admin")

def is_owner(obj, user):
    """Check common patterns for ownership (owner/created_by)."""
    if hasattr(obj, "owner_id"):
        return getattr(obj, "owner_id", None) == getattr(user, "id", None)
    if hasattr(obj, "owner"):
        return getattr(getattr(obj, "owner", None), "id", None) == getattr(user, "id", None)
    if hasattr(obj, "created_by_id"):
        return getattr(obj, "created_by_id", None) == getattr(user, "id", None)
    if hasattr(obj, "created_by"):
        return getattr(getattr(obj, "created_by", None), "id", None) == getattr(user, "id", None)
    return False


# ----------------- Basic role checks -----------------

class IsAdmin(permissions.BasePermission):
    """Allow only admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) == "admin"


class IsSupplier(permissions.BasePermission):
    """Allow only supplier users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) == "supplier"


class IsBuyer(permissions.BasePermission):
    """Allow only buyer users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and get_role(request.user) == "buyer"


# ----------------- Useful combos -----------------

class IsAdminOrSelf(permissions.BasePermission):
    """
    Detail endpoints: allow admin or the user themselves.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if is_admin_user(request.user):
            return True
        return getattr(obj, "id", None) == getattr(request.user, "id", None)


class IsAdminOrSupplierOwner(permissions.BasePermission):
    """
    - Admin: full access
    - Supplier: can create/update/delete only their own objects
    - Buyer: read-only
    - Unauthenticated: no access (unless SAFE_METHODS allowed explicitly)
    """

    ALLOW_ANON_READ = False  # flip True if you want anonymous users to view products

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            # everyone can read if ALLOW_ANON_READ else only authenticated
            return True if self.ALLOW_ANON_READ else request.user.is_authenticated

        if not request.user or not request.user.is_authenticated:
            return False

        if is_admin_user(request.user):
            return True

        if get_role(request.user) == "supplier":
            # object-level will further check ownership
            return True

        return False

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True if self.ALLOW_ANON_READ else request.user.is_authenticated

        if not request.user or not request.user.is_authenticated:
            return False

        if is_admin_user(request.user):
            return True

        if get_role(request.user) == "supplier":
            return is_owner(obj, request.user)

        return False
