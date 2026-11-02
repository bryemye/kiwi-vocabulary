from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MathQuestionViewSet

router = DefaultRouter()
router.register(r'questions', MathQuestionViewSet, basename='math-question')

urlpatterns = [
    path('', include(router.urls)),
]
