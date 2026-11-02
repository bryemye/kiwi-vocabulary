from django.urls import path
from .views import PlatformDashboardStatsView

urlpatterns = [
    path('stats/', PlatformDashboardStatsView.as_view(), name='platform-dashboard-stats'),
]
