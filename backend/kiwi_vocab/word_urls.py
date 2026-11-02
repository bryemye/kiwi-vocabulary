from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VocabularyWordViewSet, VocabSessionView

router = DefaultRouter()
router.register(r'', VocabularyWordViewSet, basename='word')

urlpatterns = [
    path('session/', VocabSessionView.as_view(), name='word-session-alias'),
    path('', include(router.urls)),
]
