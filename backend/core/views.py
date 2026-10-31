from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, Sum
from django.contrib.auth.models import User
import random

from .models import Root, VocabularyWord, ReadingPassage, Question, StudyLog
from .serializers import (
    RootSerializer,
    VocabularyWordSerializer,
    QuestionSerializer,
    ReadingPassageSerializer,
    StudyLogSerializer
)


class RootViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Root.objects.prefetch_related('words').all()
    serializer_class = RootSerializer
    permission_classes = [permissions.AllowAny]


class VocabularyWordViewSet(viewsets.ReadOnlyModelViewSet):
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
        """
        Return a balanced deck of words (default 15).
        Prioritizes:
        1. Unstudied words
        2. Words with past incorrect StudyLog entries
        3. Random selection to complete the count
        """
        try:
            count = max(1, min(100, int(request.query_params.get('count', 15))))
        except ValueError:
            count = 15

        base_qs = self.get_queryset()
        user = request.user if (request.user and request.user.is_authenticated) else User.objects.first()

        logs = StudyLog.objects.filter(item_type='WORD')
        if user:
            logs = logs.filter(user=user)

        studied_word_ids = set(logs.values_list('word_id', flat=True))

        # 1. Unstudied words
        unstudied_qs = base_qs.exclude(id__in=studied_word_ids).order_by('?')
        unstudied_words = list(unstudied_qs[:count])

        deck = list(unstudied_words)

        # 2. If deck has room, add words with incorrect attempts
        if len(deck) < count:
            remaining = count - len(deck)
            deck_ids = {w.id for w in deck}
            
            incorrect_ids = set(logs.filter(is_correct=False).values_list('word_id', flat=True))
            incorrect_qs = base_qs.filter(id__in=incorrect_ids).exclude(id__in=deck_ids).order_by('?')
            incorrect_words = list(incorrect_qs[:remaining])
            deck.extend(incorrect_words)

        # 3. If deck still has room, fill with random words from base_qs
        if len(deck) < count:
            remaining = count - len(deck)
            deck_ids = {w.id for w in deck}
            fill_qs = base_qs.exclude(id__in=deck_ids).order_by('?')
            fill_words = list(fill_qs[:remaining])
            deck.extend(fill_words)

        # Final shuffle for natural practice flow
        random.shuffle(deck)

        serializer = self.get_serializer(deck, many=True)
        return Response(serializer.data)


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.select_related('passage').all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section.upper())
        return queryset


class ReadingPassageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadingPassage.objects.prefetch_related('questions').all()
    serializer_class = ReadingPassageSerializer
    permission_classes = [permissions.AllowAny]


class StudyLogViewSet(viewsets.ModelViewSet):
    queryset = StudyLog.objects.select_related('word', 'question', 'word__root').all()
    serializer_class = StudyLogSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        item_type = self.request.query_params.get('item_type')
        if item_type:
            queryset = queryset.filter(item_type=item_type.upper())
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if (self.request.user and self.request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()
            if not user:
                user = User.objects.create_user(username='demo_student', email='scholar@example.com')
        serializer.save(user=user)


class DashboardStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        user = request.user if (request.user and request.user.is_authenticated) else None
        if not user:
            user = User.objects.first()

        # In single-user demo mode, query demo user logs or all records
        if user:
            logs = StudyLog.objects.filter(user=user).select_related('word', 'question', 'word__root').all()
            if not logs.exists():
                logs = StudyLog.objects.select_related('word', 'question', 'word__root').all()
        else:
            logs = StudyLog.objects.select_related('word', 'question', 'word__root').all()

        total_attempts = logs.count()
        total_correct = logs.filter(is_correct=True).count()
        overall_accuracy = round((total_correct / total_attempts * 100), 1) if total_attempts > 0 else 0.0

        total_seconds = logs.aggregate(total=Sum('seconds_spent'))['total'] or 0

        # Section breakdown
        # Vocab: item_type='WORD'
        vocab_logs = logs.filter(item_type='WORD')
        vocab_total = vocab_logs.count()
        vocab_correct = vocab_logs.filter(is_correct=True).count()
        vocab_accuracy = round((vocab_correct / vocab_total * 100), 1) if vocab_total > 0 else 0.0
        unique_words_reviewed = vocab_logs.values('word_id').distinct().count()

        # Math: item_type='QUESTION', question__section='MATH'
        math_logs = logs.filter(item_type='QUESTION', question__section='MATH')
        math_total = math_logs.count()
        math_correct = math_logs.filter(is_correct=True).count()
        math_accuracy = round((math_correct / math_total * 100), 1) if math_total > 0 else 0.0

        # Reading: item_type='QUESTION', question__section='READ'
        read_logs = logs.filter(item_type='QUESTION', question__section='READ')
        read_total = read_logs.count()
        read_correct = read_logs.filter(is_correct=True).count()
        read_accuracy = round((read_correct / read_total * 100), 1) if read_total > 0 else 0.0

        # Etymology Root Mastery index
        roots = Root.objects.prefetch_related('words').all()
        root_mastery_list = []
        
        for root in roots:
            root_words = root.words.all()
            total_root_words = root_words.count()
            
            # Logs for words belonging to this root
            root_logs = logs.filter(item_type='WORD', word__root=root)
            r_attempts = root_logs.count()
            r_correct = root_logs.filter(is_correct=True).count()
            r_accuracy = round((r_correct / r_attempts * 100), 1) if r_attempts > 0 else 0.0
            
            # Words in this root mastered (most recent attempt was correct)
            words_mastered_count = 0
            for w in root_words:
                w_logs = root_logs.filter(word=w).order_by('-created_at')
                if w_logs.exists() and w_logs.first().is_correct:
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
                        'is_mastered': (root_logs.filter(word=w).order_by('-created_at').first().is_correct if root_logs.filter(word=w).exists() else False)
                    }
                    for w in root_words
                ]
            })

        # Recommendations: roots with lowest accuracy or lowest mastery among attempted or unattempted
        recommended_roots = sorted(
            root_mastery_list,
            key=lambda r: (r['mastery_percentage'], r['accuracy_percentage'], -r['total_words'])
        )[:3]

        return Response({
            'overall': {
                'total_attempts': total_attempts,
                'total_correct': total_correct,
                'accuracy_percentage': overall_accuracy,
                'total_seconds_spent': total_seconds,
                'unique_words_reviewed': unique_words_reviewed,
            },
            'sections': {
                'vocab': {
                    'total': vocab_total,
                    'correct': vocab_correct,
                    'accuracy_percentage': vocab_accuracy,
                    'unique_reviewed': unique_words_reviewed,
                },
                'math': {
                    'total': math_total,
                    'correct': math_correct,
                    'accuracy_percentage': math_accuracy,
                },
                'reading': {
                    'total': read_total,
                    'correct': read_correct,
                    'accuracy_percentage': read_accuracy,
                }
            },
            'root_mastery': root_mastery_list,
            'recommendations': recommended_roots,
            'recent_logs': StudyLogSerializer(logs[:10], many=True).data
        })
