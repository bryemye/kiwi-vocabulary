from rest_framework import viewsets, permissions
from .models import ReadingPassage, ReadingQuestion
from .serializers import ReadingPassageSerializer, ReadingQuestionSerializer


class ReadingPassageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Decoupled API endpoint for Kiwi Reading passages: /api/reading/passages/
    """
    queryset = ReadingPassage.objects.prefetch_related('questions').all()
    serializer_class = ReadingPassageSerializer
    permission_classes = [permissions.AllowAny]


class ReadingQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Decoupled API endpoint for Kiwi Reading questions: /api/reading/questions/
    """
    queryset = ReadingQuestion.objects.select_related('passage').all()
    serializer_class = ReadingQuestionSerializer
    permission_classes = [permissions.AllowAny]
