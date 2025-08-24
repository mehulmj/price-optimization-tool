# users/views.py - Updated PublicRegisterView

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenBlacklistView

from .serializers import (
    PublicRegisterSerializer,
    MeSerializer,
    SupplierRequestSerializer,
    AdminSupplierRequestUpdateSerializer,
)
from .models import SupplierRequest, UserProfile
from .mailer import send_verification_email  # ✅ Add this import

User = get_user_model()


# ---------------- AUTH ----------------

class PublicRegisterView(generics.CreateAPIView):
    serializer_class = PublicRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """✅ FIXED: Send verification email after user creation"""
        user = serializer.save()
        
        # Send verification email
        try:
            verify_url = send_verification_email(user)
            print(f"📧 Verification email sent to {user.email}")
            print(f"🔗 Verification URL: {verify_url}")
        except Exception as e:
            print(f"❌ Failed to send verification email: {e}")
            # Don't fail the registration, just log the error
        
        return user

    def create(self, request, *args, **kwargs):
        """✅ Return success message after registration"""
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == 201:  # Success
            return Response({
                "message": "Registration successful! Please check your email to verify your account.",
                "email": response.data.get("email")
            }, status=status.HTTP_201_CREATED)
        
        return response


class RoleTokenView(APIView):
    """
    Login with username OR email.
    Returns JWT tokens if verified.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = request.data.get("username") or request.data.get("email")
        password = request.data.get("password") or ""
        if not identifier or not password:
            return Response({"detail": "Username/Email and password required"}, status=400)

        try:
            user = User.objects.get(Q(username__iexact=identifier) | Q(email__iexact=identifier))
        except User.DoesNotExist:
            return Response({"detail": "No active account found with the given credentials"}, status=401)

        # check password
        if not user.check_password(password):
            return Response({"detail": "No active account found with the given credentials"}, status=401)

        # inactive = not verified
        if not user.is_active:
            return Response({"detail": "Email not verified. Please verify your email."}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })


class LogoutView(TokenBlacklistView):
    """Blacklist refresh token on logout"""
    permission_classes = [permissions.IsAuthenticated]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


# ---------------- EMAIL VERIFY ----------------

from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator

class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            print(f"🔍 Verifying user: {user.email}")
        except Exception as e:
            print(f"❌ Invalid verification link: {e}")
            return Response({"detail": "Invalid verification link"}, status=400)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.save(update_fields=["is_active"])
            print(f"✅ Email verified successfully for: {user.email}")
            return Response({"detail": "Email verified successfully! You can now login."})
        else:
            print(f"❌ Invalid or expired token for: {user.email}")
            return Response({"detail": "Invalid or expired verification token"}, status=400)


class ResendVerificationView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email is required"}, status=400)
            
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if user.is_active:
            return Response({"detail": "User already verified"}, status=400)

        # ✅ Send verification email using our mailer
        try:
            verify_url = send_verification_email(user)
            print(f"📧 Resent verification email to {user.email}")
            print(f"🔗 Verification URL: {verify_url}")
            return Response({"detail": "Verification email resent successfully"})
        except Exception as e:
            print(f"❌ Failed to resend verification email: {e}")
            return Response({"detail": "Failed to send verification email"}, status=500)


# ---------------- SUPPLIER REQUEST ----------------

class SupplierRequestView(APIView):
    """
    Buyer can create + view their own supplier request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sr = SupplierRequest.objects.filter(user=request.user).first()
        if not sr:
            return Response({"exists": False})
        return Response({"exists": True, "request": SupplierRequestSerializer(sr).data})

    def post(self, request):
        if SupplierRequest.objects.filter(user=request.user).exists():
            return Response({"detail": "You already submitted a request"}, status=400)
        sr = SupplierRequest.objects.create(
            user=request.user,
            company=request.data.get("company", ""),
            reason=request.data.get("reason", ""),
        )
        return Response(SupplierRequestSerializer(sr).data, status=201)


# ---------------- ADMIN SUPPLIER REQUESTS ----------------

class AdminSupplierRequestListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = SupplierRequestSerializer
    queryset = SupplierRequest.objects.all().select_related("user").order_by("-created_at")


class AdminSupplierRequestDetailView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminSupplierRequestUpdateSerializer
    queryset = SupplierRequest.objects.all().select_related("user")
    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        instance: SupplierRequest = self.get_object()
        new_status = request.data.get("status")
        if new_status not in ("approved", "rejected"):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)

        instance.status = new_status
        instance.save(update_fields=["status"])

        if new_status == "approved":
            profile = getattr(instance.user, "profile", None)
            if profile:
                profile.role = "supplier"
                profile.save(update_fields=["role"])

        return Response(SupplierRequestSerializer(instance).data, status=200)