from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MathQuestionViewSet

router = DefaultRouter()
router.register(r'', MathQuestionViewSet, basename='questions-alias')

urlpatterns = [
    path('', include(router.urls)),
]
