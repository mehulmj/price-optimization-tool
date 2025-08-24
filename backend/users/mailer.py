# users/mailer.py - Fixed to point to frontend
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .tokens import email_verification_token

def send_verification_email(user):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    
    # Point to frontend instead of backend
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verify_url = f"{frontend_url}/verify-email/{uidb64}/{token}/"
    print(f"🔗 Generated verification URL: {verify_url}")  # Debug line

    subject = "Verify your email — Price Optimization Tool"
    text_body = f"""
Hi {user.username},

Thanks for signing up. Please verify your email by clicking the link below:
{verify_url}

If you didn't create this account, you can ignore this email.
"""
    html_body = f"""
<p>Hi <b>{user.username}</b>,</p>
<p>Thanks for signing up. Please verify your email by clicking the button below:</p>
<p><a href="{verify_url}" style="display:inline-block;padding:10px 16px;
background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
<p>Or open this link: <a href="{verify_url}">{verify_url}</a></p>
<p><small>If the link doesn't work, copy and paste it into your browser.</small></p>
"""

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)
    return verify_url