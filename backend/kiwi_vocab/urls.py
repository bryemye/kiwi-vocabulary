from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RootViewSet,
    VocabularyWordViewSet,
    VocabSessionView,
    VocabStatsView,
)

router = DefaultRouter()
router.register(r'roots', RootViewSet, basename='vocab-root')
router.register(r'words', VocabularyWordViewSet, basename='vocab-word')

urlpatterns = [
    path('session/', VocabSessionView.as_view(), name='vocab-session'),
    path('stats/', VocabStatsView.as_view(), name='vocab-stats'),
    path('', include(router.urls)),
]
