from rest_framework import serializers
from .models import ReadingPassage, ReadingQuestion


class ReadingQuestionSerializer(serializers.ModelSerializer):
    section = serializers.SerializerMethodField()

    class Meta:
        model = ReadingQuestion
        fields = [
            'id', 'section', 'passage', 'prompt',
            'choices', 'correct_answer', 'explanation'
        ]

    def get_section(self, obj):
        return 'READ'


class ReadingPassageSerializer(serializers.ModelSerializer):
    questions = ReadingQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = ReadingPassage
        fields = ['id', 'title', 'author_or_source', 'body', 'questions']
