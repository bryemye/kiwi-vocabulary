from rest_framework import viewsets, permissions
from .models import MathQuestion
from .serializers import MathQuestionSerializer


class MathQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Decoupled API endpoint for Kiwi Math questions & graphing configurations: /api/math/questions/
    """
    queryset = MathQuestion.objects.all()
    serializer_class = MathQuestionSerializer
    permission_classes = [permissions.AllowAny]
