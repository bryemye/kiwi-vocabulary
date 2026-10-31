from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Q, Avg, Sum
from django.contrib.auth.models import User

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


class VocabularyWordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VocabularyWord.objects.select_related('root').all()
    serializer_class = VocabularyWordSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        root_id = self.request.query_params.get('root')
        connotation = self.request.query_params.get('connotation')
        if root_id:
            queryset = queryset.filter(root_id=root_id)
        if connotation:
            queryset = queryset.filter(connotation=connotation)
        return queryset


class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.select_related('passage').all()
    serializer_class = QuestionSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        section = self.request.query_params.get('section')
        if section:
            queryset = queryset.filter(section=section.upper())
        return queryset


class ReadingPassageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReadingPassage.objects.prefetch_related('questions').all()
    serializer_class = ReadingPassageSerializer


class StudyLogViewSet(viewsets.ModelViewSet):
    queryset = StudyLog.objects.select_related('word', 'question', 'word__root').all()
    serializer_class = StudyLogSerializer

    def get_queryset(self):
        # Allow filtering by user or item_type
        queryset = super().get_queryset()
        item_type = self.request.query_params.get('item_type')
        if item_type:
            queryset = queryset.filter(item_type=item_type.upper())
        return queryset

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        if not user:
            # Associate with default demo student if anonymous
            user, _ = User.objects.get_or_create(username='demo_student', defaults={'first_name': 'SAT', 'last_name': 'Scholar'})
        serializer.save(user=user)


class DashboardStatsView(APIView):
    def get(self, request):
        # We compute stats over study logs
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
            
            # Words in this root mastered (at least 1 correct attempt and latest attempt correct)
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
