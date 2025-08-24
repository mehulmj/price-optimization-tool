# users/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import SupplierRequest

User = get_user_model()


class PublicRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        value = (value or "").strip().lower()
        if not value:
            raise serializers.ValidationError("Email is required.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        # Profile creation signals se hoga (default role='buyer')
        user = User.objects.create_user(
            username=validated_data["username"].strip(),
            email=validated_data["email"].strip().lower(),
            password=validated_data["password"],
        )
        user.is_active = False  # email verify hone tak inactive
        user.save(update_fields=["is_active"])
        return user


class MeSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        profile = getattr(obj, "profile", None)
        return getattr(profile, "role", "buyer")


class SupplierRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SupplierRequest
        fields = [
            "id",
            "username",
            "email",
            "company",
            "reason",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]


class AdminSupplierRequestUpdateSerializer(serializers.ModelSerializer):
    # Admin ko sirf status update karna allow
    class Meta:
        model = SupplierRequest
        fields = ["status"]
        extra_kwargs = {
            "status": {"required": True}
        }
