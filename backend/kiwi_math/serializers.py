from rest_framework import serializers
from .models import MathQuestion


class MathQuestionSerializer(serializers.ModelSerializer):
    section = serializers.SerializerMethodField()

    class Meta:
        model = MathQuestion
        fields = [
            'id', 'section', 'prompt', 'graph_config',
            'choices', 'correct_answer', 'explanation'
        ]

    def get_section(self, obj):
        return 'MATH'
