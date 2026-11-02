from rest_framework import serializers
from .models import StudyLog, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class StudyLogSerializer(serializers.ModelSerializer):
    word_details = serializers.SerializerMethodField(read_only=True)
    word_id = serializers.IntegerField(required=False, allow_null=True)
    question_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = StudyLog
        fields = [
            'id', 'user', 'item_type', 'word', 'word_id', 'word_details',
            'question_id', 'section', 'is_correct', 'seconds_spent', 'metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']
        extra_kwargs = {
            'word': {'required': False, 'allow_null': True},
        }

    def get_word_details(self, obj):
        if not obj.word:
            return None
        from kiwi_vocab.serializers import VocabularyWordSimpleSerializer
        return VocabularyWordSimpleSerializer(obj.word).data

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        
        # Normalize word reference
        if 'word_id' in mutable_data and 'word' not in mutable_data:
            mutable_data['word'] = mutable_data['word_id']
        elif 'word' in mutable_data and 'word_id' not in mutable_data:
            mutable_data['word_id'] = mutable_data['word']

        # Normalize question reference
        if 'question' in mutable_data and 'question_id' not in mutable_data:
            mutable_data['question_id'] = mutable_data['question']

        # Auto-detect section if not provided
        if mutable_data.get('question_id') and not mutable_data.get('section'):
            try:
                from kiwi_reading.models import ReadingQuestion
                if ReadingQuestion.objects.filter(id=mutable_data['question_id']).exists():
                    mutable_data['section'] = 'READ'
            except Exception:
                pass
            if not mutable_data.get('section'):
                try:
                    from kiwi_math.models import MathQuestion
                    if MathQuestion.objects.filter(id=mutable_data['question_id']).exists():
                        mutable_data['section'] = 'MATH'
                except Exception:
                    pass

        return super().to_internal_value(mutable_data)
