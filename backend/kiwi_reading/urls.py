from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadingPassageViewSet, ReadingQuestionViewSet

router = DefaultRouter()
router.register(r'passages', ReadingPassageViewSet, basename='reading-passage')
router.register(r'questions', ReadingQuestionViewSet, basename='reading-question')

urlpatterns = [
    path('', include(router.urls)),
]
