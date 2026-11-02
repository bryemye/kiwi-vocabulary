from rest_framework import serializers
from .models import Root, VocabularyWord


class VocabularyWordSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'prefix', 'suffix', 'definition',
            'sat_sentence', 'connotation', 'pronunciation', 'part_of_speech',
            'review'
        ]


class RootSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Root
        fields = ['id', 'morpheme', 'language', 'core_meaning', 'mnemonic']


class RootSerializer(serializers.ModelSerializer):
    words = VocabularyWordSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Root
        fields = ['id', 'morpheme', 'language', 'core_meaning', 'mnemonic', 'words']


class VocabularyWordSerializer(serializers.ModelSerializer):
    root_details = RootSimpleSerializer(source='root', read_only=True)

    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'root', 'root_details', 'prefix', 'suffix',
            'definition', 'sat_sentence', 'connotation', 'pronunciation', 'part_of_speech',
            'review'
        ]
