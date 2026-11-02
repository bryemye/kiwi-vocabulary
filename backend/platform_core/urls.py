from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StudyLogViewSet,
    PlatformDashboardStatsView,
)

router = DefaultRouter()
router.register(r'study-logs', StudyLogViewSet, basename='platform-studylog')
router.register(r'activity', StudyLogViewSet, basename='platform-activity')

urlpatterns = [
    path('auth/', include('platform_core.auth_urls')),
    path('dashboard/', include('platform_core.dashboard_urls')),
    path('', include(router.urls)),
]
