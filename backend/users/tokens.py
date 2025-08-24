from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import exceptions
from django.contrib.auth.tokens import PasswordResetTokenGenerator

# For login: add role in token
class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_active:
            raise exceptions.AuthenticationFailed(
                "Email not verified. Please verify your email.", code="user_inactive"
            )
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        role = getattr(getattr(user, "profile", None), "role", "buyer")
        token["role"] = role
        token["username"] = user.username
        return token

# For email verification
class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    pass

email_verification_token = EmailVerificationTokenGenerator()
