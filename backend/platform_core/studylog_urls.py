from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudyLogViewSet

router = DefaultRouter()
router.register(r'', StudyLogViewSet, basename='studylog')

urlpatterns = [
    path('', include(router.urls)),
]
