from django.urls import path
from .views import (
    RequestMagicLinkView,
    VerifyMagicLinkView,
    CurrentUserView,
    LogoutView,
)

urlpatterns = [
    path('magic-link/', RequestMagicLinkView.as_view(), name='platform-auth-magic-link'),
    path('verify-magic-link/', VerifyMagicLinkView.as_view(), name='platform-auth-verify-magic-link'),
    path('me/', CurrentUserView.as_view(), name='platform-auth-me'),
    path('logout/', LogoutView.as_view(), name='platform-auth-logout'),
]
