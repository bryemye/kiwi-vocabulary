from django.db import transaction
from rest_framework import serializers
from .models import Root, VocabularyWord


class RootSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Root
        fields = [
            'id', 'morpheme', 'language', 'core_meaning', 'mnemonic',
            'thematic_cluster', 'sat_tier'
        ]


class OrderedRootIDListField(serializers.ListField):
    """Writable list of Root IDs preserving WordRoot ordering."""

    def get_attribute(self, instance):
        return instance.get_ordered_roots()


class VocabularyWordSimpleSerializer(serializers.ModelSerializer):
    root_details = RootSimpleSerializer(source='root', read_only=True)
    roots = OrderedRootIDListField(
        child=serializers.PrimaryKeyRelatedField(read_only=True),
        read_only=True,
    )
    roots_details = serializers.SerializerMethodField()
    prefix_root_details = RootSimpleSerializer(source='prefix_root', read_only=True)
    suffix_root_details = RootSimpleSerializer(source='suffix_root', read_only=True)

    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'root', 'root_details', 'roots', 'roots_details',
            'prefix', 'prefix_root', 'prefix_root_details',
            'suffix', 'suffix_root', 'suffix_root_details',
            'definition', 'sat_sentence', 'connotation', 'pronunciation',
            'part_of_speech', 'mnemonic', 'review', 'is_published'
        ]

    def get_roots_details(self, obj):
        return RootSimpleSerializer(obj.get_ordered_roots(), many=True).data


class RootSerializer(serializers.ModelSerializer):
    words = VocabularyWordSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Root
        fields = [
            'id', 'morpheme', 'language', 'core_meaning', 'mnemonic',
            'thematic_cluster', 'sat_tier', 'words'
        ]


class VocabularyWordSerializer(serializers.ModelSerializer):
    root = serializers.PrimaryKeyRelatedField(
        queryset=Root.objects.all(),
        required=False,
    )
    root_details = RootSimpleSerializer(source='root', read_only=True)
    roots = OrderedRootIDListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Root.objects.all()),
        required=False,
    )
    roots_details = serializers.SerializerMethodField()
    prefix_root = serializers.PrimaryKeyRelatedField(
        queryset=Root.objects.all(),
        allow_null=True,
        required=False,
    )
    prefix_root_details = RootSimpleSerializer(source='prefix_root', read_only=True)
    suffix_root = serializers.PrimaryKeyRelatedField(
        queryset=Root.objects.all(),
        allow_null=True,
        required=False,
    )
    suffix_root_details = RootSimpleSerializer(source='suffix_root', read_only=True)

    class Meta:
        model = VocabularyWord
        fields = [
            'id', 'word', 'root', 'root_details', 'roots', 'roots_details',
            'prefix', 'prefix_root', 'prefix_root_details',
            'suffix', 'suffix_root', 'suffix_root_details',
            'definition', 'sat_sentence', 'connotation', 'pronunciation',
            'part_of_speech', 'mnemonic', 'review', 'is_published'
        ]

    def get_roots_details(self, obj):
        return RootSimpleSerializer(obj.get_ordered_roots(), many=True).data

    @staticmethod
    def _dedupe_roots(root_list):
        deduped = []
        seen_ids = set()
        for r in root_list:
            if r and r.id not in seen_ids:
                seen_ids.add(r.id)
                deduped.append(r)
        return deduped

    def validate(self, attrs):
        ordered_roots = attrs.get('roots')
        if ordered_roots is not None:
            deduped = self._dedupe_roots(ordered_roots)
            if not deduped:
                raise serializers.ValidationError({'roots': 'A vocabulary word must have at least one root.'})
            attrs['roots'] = deduped
        elif self.instance is None and not attrs.get('root'):
            raise serializers.ValidationError({'roots': 'At least one root is required.'})
        return attrs

    def create(self, validated_data):
        with transaction.atomic():
            ordered_roots = validated_data.pop('roots', None)
            if ordered_roots:
                validated_data['root'] = ordered_roots[0]
            elif validated_data.get('root'):
                ordered_roots = [validated_data['root']]
            instance = super().create(validated_data)
            if ordered_roots:
                instance.set_ordered_roots(ordered_roots)
            return instance

    def update(self, instance, validated_data):
        with transaction.atomic():
            ordered_roots = validated_data.pop('roots', None)
            if ordered_roots is not None:
                validated_data['root'] = ordered_roots[0]
            elif 'root' in validated_data and validated_data['root'] is not None:
                existing = instance.get_ordered_roots()
                new_primary = validated_data['root']
                ordered_roots = [new_primary] + [r for r in existing if r.id != new_primary.id]
            instance = super().update(instance, validated_data)
            if ordered_roots is not None:
                instance.set_ordered_roots(ordered_roots)
            return instance
