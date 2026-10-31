from rest_framework import serializers
from .models import Root, VocabularyWord, ReadingPassage, Question, StudyLog


class VocabularyWordSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'prefix', 'suffix', 'definition',
            'sat_sentence', 'connotation', 'pronunciation', 'part_of_speech'
        ]


class RootSerializer(serializers.ModelSerializer):
    words = VocabularyWordSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Root
        fields = ['id', 'morpheme', 'language', 'core_meaning', 'mnemonic', 'words']


class RootSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Root
        fields = ['id', 'morpheme', 'language', 'core_meaning', 'mnemonic']


class VocabularyWordSerializer(serializers.ModelSerializer):
    root_details = RootSimpleSerializer(source='root', read_only=True)

    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'root', 'root_details', 'prefix', 'suffix',
            'definition', 'sat_sentence', 'connotation', 'pronunciation', 'part_of_speech'
        ]


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'section', 'passage', 'prompt', 'graph_config',
            'choices', 'correct_answer', 'explanation'
        ]


class ReadingPassageSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = ReadingPassage
        fields = ['id', 'title', 'author_or_source', 'body', 'questions']


class StudyLogSerializer(serializers.ModelSerializer):
    word_details = VocabularyWordSimpleSerializer(source='word', read_only=True)
    question_details = QuestionSerializer(source='question', read_only=True)
    word_id = serializers.PrimaryKeyRelatedField(
        queryset=VocabularyWord.objects.all(),
        source='word',
        required=False,
        allow_null=True
    )
    question_id = serializers.PrimaryKeyRelatedField(
        queryset=Question.objects.all(),
        source='question',
        required=False,
        allow_null=True
    )

    class Meta:
        model = StudyLog
        fields = [
            'id', 'user', 'item_type', 'word', 'word_id', 'word_details',
            'question', 'question_id', 'question_details', 'is_correct', 'seconds_spent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'user']
        extra_kwargs = {
            'word': {'required': False, 'allow_null': True},
            'question': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        # Support both word_id and word, question_id and question
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'word_id' in mutable_data and 'word' not in mutable_data:
            mutable_data['word'] = mutable_data['word_id']
        if 'question_id' in mutable_data and 'question' not in mutable_data:
            mutable_data['question'] = mutable_data['question_id']
        return super().to_internal_value(mutable_data)
