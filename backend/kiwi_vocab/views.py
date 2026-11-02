import random
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Root, VocabularyWord
from .serializers import (
    RootSerializer,
    VocabularyWordSerializer,
)

User = get_user_model()


def get_vocab_session_deck(queryset, user=None, count=15):
    """
    Returns a balanced deck of vocabulary words (default 15).
    Prioritizes:
    1. Unstudied words
    2. Words with past incorrect StudyLog entries
    3. Random selection to complete the count
    """
    try:
        from platform_core.models import StudyLog
        logs = StudyLog.objects.filter(item_type='WORD')
        if user and user.is_authenticated:
            logs = logs.filter(user=user)
        studied_word_ids = set(logs.values_list('word_id', flat=True))
        incorrect_ids = set(logs.filter(is_correct=False).values_list('word_id', flat=True))
    except Exception:
        studied_word_ids = set()
        incorrect_ids = set()

    # 1. Unstudied words
    unstudied_qs = queryset.exclude(id__in=studied_word_ids).order_by('?')
    deck = list(unstudied_qs[:count])

    # 2. If deck has room, add words with incorrect attempts
    if len(deck) < count:
        remaining = count - len(deck)
        deck_ids = {w.id for w in deck}
        incorrect_qs = queryset.filter(id__in=incorrect_ids).exclude(id__in=deck_ids).order_by('?')
        deck.extend(list(incorrect_qs[:remaining]))

    # 3. If deck still has room, fill with random words from base queryset
    if len(deck) < count:
        remaining = count - len(deck)
        deck_ids = {w.id for w in deck}
        fill_qs = queryset.exclude(id__in=deck_ids).order_by('?')
        deck.extend(list(fill_qs[:remaining]))

    # Final shuffle
    random.shuffle(deck)
    return deck


class RootViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve etymological roots with associated vocabulary word families.
    """
    queryset = Root.objects.prefetch_related('words').all()
    serializer_class = RootSerializer
    permission_classes = [permissions.AllowAny]


class VocabularyWordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Explore and filter vocabulary words by root, origin language, connotation, or search query.
    """
    queryset = VocabularyWord.objects.select_related('root').all()
    serializer_class = VocabularyWordSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        root_id = self.request.query_params.get('root')
        language = self.request.query_params.get('language')
        search = self.request.query_params.get('search')
        connotation = self.request.query_params.get('connotation')

        if root_id:
            queryset = queryset.filter(root_id=root_id)
        if language and language.upper() != 'ALL':
            queryset = queryset.filter(root__language__iexact=language)
        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(word__icontains=search) | Q(definition__icontains=search)
            )
        if connotation:
            queryset = queryset.filter(connotation=connotation)

        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        limit = request.query_params.get('limit')
        offset = request.query_params.get('offset', 0)

        if limit is not None:
            try:
                limit = max(1, int(limit))
                offset = max(0, int(offset))
                queryset = queryset[offset:offset + limit]
            except ValueError:
                pass

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def session(self, request):
        try:
            count = max(1, min(100, int(request.query_params.get('count', 15))))
        except ValueError:
            count = 15

        user = request.user if (request.user and request.user.is_authenticated) else User.objects.first()
        deck = get_vocab_session_deck(self.get_queryset(), user=user, count=count)
        serializer = self.get_serializer(deck, many=True)
        return Response(serializer.data)


class VocabSessionView(APIView):
    """
    Dedicated endpoint for generating spaced-repetition flashcard sessions: /api/vocab/session/
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            count = max(1, min(100, int(request.query_params.get('count', 15))))
        except ValueError:
            count = 15

        user = request.user if (request.user and request.user.is_authenticated) else User.objects.first()
        qs = VocabularyWord.objects.select_related('root').all()
        root_id = request.query_params.get('root')
        language = request.query_params.get('language')
        if root_id:
            qs = qs.filter(root_id=root_id)
        if language and language.upper() != 'ALL':
            qs = qs.filter(root__language__iexact=language)

        deck = get_vocab_session_deck(qs, user=user, count=count)
        serializer = VocabularyWordSerializer(deck, many=True)
        return Response(serializer.data)


class VocabStatsView(APIView):
    """
    Dedicated stats for Kiwi Vocabulary: /api/vocab/stats/
    Provides root mastery rings, words learned, retention rate, and targeted review recommendations.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()

        try:
            from platform_core.models import StudyLog
            if user:
                logs = StudyLog.objects.filter(user=user, item_type='WORD').select_related('word', 'word__root')
                if not logs.exists():
                    logs = StudyLog.objects.filter(item_type='WORD').select_related('word', 'word__root')
            else:
                logs = StudyLog.objects.filter(item_type='WORD').select_related('word', 'word__root')
        except Exception:
            logs = []

        total_words_count = VocabularyWord.objects.count()
        roots = Root.objects.prefetch_related('words').all()
        total_roots_count = roots.count()

        vocab_total = logs.count() if hasattr(logs, 'count') else len(logs)
        vocab_correct = logs.filter(is_correct=True).count() if hasattr(logs, 'filter') else 0
        vocab_accuracy = round((vocab_correct / vocab_total * 100), 1) if vocab_total > 0 else 0.0
        unique_words_reviewed = logs.values('word_id').distinct().count() if hasattr(logs, 'values') else 0

        root_mastery_list = []
        for root in roots:
            root_words = root.words.all()
            total_root_words = root_words.count()
            root_logs = logs.filter(word__root=root) if hasattr(logs, 'filter') else []
            r_attempts = root_logs.count() if hasattr(root_logs, 'count') else 0
            r_correct = root_logs.filter(is_correct=True).count() if hasattr(root_logs, 'filter') else 0
            r_accuracy = round((r_correct / r_attempts * 100), 1) if r_attempts > 0 else 0.0

            words_mastered_count = 0
            for w in root_words:
                w_logs = root_logs.filter(word=w).order_by('-created_at') if hasattr(root_logs, 'filter') else []
                if hasattr(w_logs, 'exists') and w_logs.exists() and w_logs.first().is_correct:
                    words_mastered_count += 1

            mastery_percentage = round((words_mastered_count / total_root_words * 100), 1) if total_root_words > 0 else 0.0

            root_mastery_list.append({
                'id': root.id,
                'morpheme': root.morpheme,
                'language': root.language,
                'core_meaning': root.core_meaning,
                'mnemonic': root.mnemonic,
                'total_words': total_root_words,
                'mastered_words': words_mastered_count,
                'mastery_percentage': mastery_percentage,
                'accuracy_percentage': r_accuracy,
                'attempts': r_attempts,
                'words': [
                    {
                        'id': w.id,
                        'word': w.word,
                        'is_mastered': (root_logs.filter(word=w).order_by('-created_at').first().is_correct if hasattr(root_logs, 'filter') and root_logs.filter(word=w).exists() else False)
                    }
                    for w in root_words
                ]
            })

        recommendations = sorted(
            root_mastery_list,
            key=lambda r: (r['mastery_percentage'], r['accuracy_percentage'], -r['total_words'])
        )[:3]

        return Response({
            'total_roots': total_roots_count,
            'total_words': total_words_count,
            'words_reviewed': unique_words_reviewed,
            'retention_rate': vocab_accuracy,
            'total_attempts': vocab_total,
            'root_mastery': root_mastery_list,
            'recommendations': recommendations
        })
