from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RootViewSet

router = DefaultRouter()
router.register(r'', RootViewSet, basename='root')

urlpatterns = [
    path('', include(router.urls)),
]
