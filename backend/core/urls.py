from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RootViewSet,
    VocabularyWordViewSet,
    QuestionViewSet,
    ReadingPassageViewSet,
    StudyLogViewSet,
    DashboardStatsView
)

router = DefaultRouter()
router.register(r'roots', RootViewSet, basename='root')
router.register(r'words', VocabularyWordViewSet, basename='word')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'reading-passages', ReadingPassageViewSet, basename='readingpassage')
router.register(r'study-logs', StudyLogViewSet, basename='studylog')

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]
