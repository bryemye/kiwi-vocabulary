from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReadingPassageViewSet

router = DefaultRouter()
router.register(r'', ReadingPassageViewSet, basename='readingpassages-alias')

urlpatterns = [
    path('', include(router.urls)),
]
