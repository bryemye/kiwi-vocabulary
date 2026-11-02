from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RootViewSet,
    VocabularyWordViewSet,
    QuestionViewSet,
    ReadingPassageViewSet,
    StudyLogViewSet,
    DashboardStatsView,
    RequestMagicLinkView,
    VerifyMagicLinkView,
    CurrentUserView,
    LogoutView,
)

router = DefaultRouter()
router.register(r'roots', RootViewSet, basename='root')
router.register(r'words', VocabularyWordViewSet, basename='word')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'reading-passages', ReadingPassageViewSet, basename='readingpassage')
router.register(r'study-logs', StudyLogViewSet, basename='studylog')

urlpatterns = [
    # Magic link authentication & session management
    path('auth/magic-link/', RequestMagicLinkView.as_view(), name='auth-magic-link'),
    path('auth/verify-magic-link/', VerifyMagicLinkView.as_view(), name='auth-verify-magic-link'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),

    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
