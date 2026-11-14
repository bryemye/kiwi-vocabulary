import random
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response

import hashlib
from django.core.cache import cache
from django.utils import timezone
from .models import Root, VocabularyWord
from .serializers import (
    RootSerializer,
    VocabularyWordSerializer,
)

User = get_user_model()


def get_daily_guest_deck(count=15, date_str=None):
    """
    Returns a deterministic daily 15-word challenge deck for guest users.
    Changes daily at local midnight (based on client-provided date_str or local server date).
    Ensures maximum morpheme variety by selecting across distinct roots.
    """
    if not date_str:
        date_str = timezone.now().strftime('%Y-%m-%d')
    else:
        date_str = str(date_str).strip()[:10]

    cache_key = f"kiwi_daily_guest_deck_{date_str}_{count}"
    cached_deck = cache.get(cache_key)
    if cached_deck:
        return cached_deck

    seed_val = int(hashlib.md5(f"kiwi-daily-{date_str}".encode('utf-8')).hexdigest()[:8], 16)
    rng = random.Random(seed_val)

    # Fetch roots with their words preloaded
    roots = list(Root.objects.prefetch_related('words').filter(words__isnull=False).distinct())
    rng.shuffle(roots)

    selected_words = []
    used_word_ids = set()

    for r in roots:
        words = list(r.words.all())
        if words:
            chosen = rng.choice(words)
            if chosen.id not in used_word_ids:
                selected_words.append(chosen)
                used_word_ids.add(chosen.id)
        if len(selected_words) >= count:
            break

    # If roots ran out before count (should not happen with 175 roots), fill with remaining words
    if len(selected_words) < count:
        remaining_words = list(VocabularyWord.objects.exclude(id__in=used_word_ids).select_related('root'))
        rng.shuffle(remaining_words)
        selected_words.extend(remaining_words[:count - len(selected_words)])

    rng.shuffle(selected_words)
    # Cache for 24 hours (86400 seconds)
    cache.set(cache_key, selected_words, timeout=86400)
    return selected_words


def get_vocab_session_deck(queryset, user=None, count=15):
    """
    Returns a balanced, prioritized spaced-repetition deck of vocabulary words (default 15).
    Prioritizes:
    1. Words whose most recent study attempt was incorrect (needs review)
    2. Unstudied words
    3. Oldest reviewed words / random selection from base queryset
    """
    try:
        from platform_core.models import StudyLog
        if user and user.is_authenticated:
            user_logs = StudyLog.objects.filter(user=user, item_type='WORD').order_by('created_at')
        else:
            user_logs = StudyLog.objects.none()

        # Find status of each studied word (most recent result)
        word_latest_status = {}
        for entry in user_logs.values('word_id', 'is_correct', 'created_at'):
            word_latest_status[entry['word_id']] = entry['is_correct']

        incorrect_ids = [w_id for w_id, is_corr in word_latest_status.items() if not is_corr]
        studied_ids = set(word_latest_status.keys())
    except Exception:
        incorrect_ids = []
        studied_ids = set()

    deck = []
    deck_ids = set()

    # 1. High priority: words the user got wrong most recently
    if incorrect_ids:
        incorrect_qs = queryset.filter(id__in=incorrect_ids).order_by('?')
        for w in incorrect_qs[:count]:
            deck.append(w)
            deck_ids.add(w.id)

    # 2. Medium priority: unstudied words
    if len(deck) < count:
        remaining = count - len(deck)
        unstudied_qs = queryset.exclude(id__in=studied_ids).exclude(id__in=deck_ids).order_by('?')
        for w in unstudied_qs[:remaining]:
            deck.append(w)
            deck_ids.add(w.id)

    # 3. Low priority / fill: review words or random from base queryset
    if len(deck) < count:
        remaining = count - len(deck)
        fill_qs = queryset.exclude(id__in=deck_ids).order_by('?')
        for w in fill_qs[:remaining]:
            deck.append(w)
            deck_ids.add(w.id)

    # Final shuffle for natural variety
    random.shuffle(deck)
    return deck


class RootViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve etymological roots with associated vocabulary word families.
    Supports filtering by language, thematic_cluster, sat_tier, or search query.
    """
    queryset = Root.objects.prefetch_related('words').all()
    serializer_class = RootSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        cluster = self.request.query_params.get('cluster') or self.request.query_params.get('thematic_cluster')
        tier = self.request.query_params.get('tier') or self.request.query_params.get('sat_tier')
        language = self.request.query_params.get('language')
        search = self.request.query_params.get('search')

        if cluster and cluster.upper() != 'ALL':
            queryset = queryset.filter(thematic_cluster__iexact=cluster)
        if tier and tier.upper() != 'ALL':
            queryset = queryset.filter(sat_tier__iexact=tier)
        if language and language.upper() != 'ALL':
            queryset = queryset.filter(language__icontains=language.strip())
        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(morpheme__icontains=search) | Q(core_meaning__icontains=search)
            )
        return queryset


class VocabularyWordViewSet(viewsets.ModelViewSet):
    """
    Explore and filter vocabulary words by root, origin language, connotation, or search query.
    Allows staff/admin users to create, update, or patch word definitions, affixes, and metadata.
    """
    queryset = VocabularyWord.objects.select_related('root').all()
    serializer_class = VocabularyWordSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        root_id = self.request.query_params.get('root')
        language = self.request.query_params.get('language')
        cluster = self.request.query_params.get('cluster') or self.request.query_params.get('thematic_cluster')
        tier = self.request.query_params.get('tier') or self.request.query_params.get('sat_tier')
        prefix = self.request.query_params.get('prefix')
        suffix = self.request.query_params.get('suffix')
        search = self.request.query_params.get('search')
        connotation = self.request.query_params.get('connotation')

        if root_id:
            queryset = queryset.filter(root_id=root_id)
        if language and language.upper() != 'ALL':
            queryset = queryset.filter(root__language__icontains=language.strip())
        if cluster and cluster.upper() != 'ALL':
            queryset = queryset.filter(root__thematic_cluster__iexact=cluster)
        if tier and tier.upper() != 'ALL':
            queryset = queryset.filter(root__sat_tier__iexact=tier)
        if prefix:
            queryset = queryset.filter(prefix__icontains=prefix.strip())
        if suffix:
            queryset = queryset.filter(suffix__icontains=suffix.strip())
        if search:
            search = search.strip()
            queryset = queryset.filter(
                Q(word__icontains=search) |
                Q(definition__icontains=search) |
                Q(prefix__icontains=search) |
                Q(suffix__icontains=search) |
                Q(root__morpheme__icontains=search)
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

        is_daily = request.query_params.get('daily') in ['1', 'true', 'True']
        date_str = request.query_params.get('date')

        if is_daily:
            deck = get_daily_guest_deck(count=count, date_str=date_str)
        else:
            user = request.user if (request.user and request.user.is_authenticated) else None
            deck = get_vocab_session_deck(self.get_queryset(), user=user, count=count)

        serializer = self.get_serializer(deck, many=True)
        return Response(serializer.data)


class VocabSessionView(APIView):
    """
    Dedicated endpoint for generating flashcard sessions: /api/vocab/session/
    Supports:
    - `?daily=1&date=YYYY-MM-DD`: Returns deterministic daily 15 challenge deck for guests.
    - Authenticated users: Returns personalized spaced-repetition 15-word queue.
    - Query filters: root, language, prefix, suffix, count.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            count = max(1, min(100, int(request.query_params.get('count', 15))))
        except ValueError:
            count = 15

        is_daily = request.query_params.get('daily') in ['1', 'true', 'True']
        date_str = request.query_params.get('date')

        # If guest daily challenge requested, return the daily deterministic sequence
        if is_daily:
            deck = get_daily_guest_deck(count=count, date_str=date_str)
            serializer = VocabularyWordSerializer(deck, many=True)
            return Response(serializer.data)

        # Otherwise, prepare filtered queryset
        qs = VocabularyWord.objects.select_related('root').all()
        root_id = request.query_params.get('root')
        language = request.query_params.get('language')
        prefix = request.query_params.get('prefix')
        suffix = request.query_params.get('suffix')
        if root_id:
            qs = qs.filter(root_id=root_id)
        if language and language.upper() != 'ALL':
            qs = qs.filter(root__language__icontains=language.strip())
        if prefix:
            qs = qs.filter(prefix__icontains=prefix.strip())
        if suffix:
            qs = qs.filter(suffix__icontains=suffix.strip())

        user = request.user if (request.user and request.user.is_authenticated) else None
        # If user is not authenticated and did not specify filters, fallback to daily guest deck
        if not user and not any([root_id, language, prefix, suffix]):
            deck = get_daily_guest_deck(count=count, date_str=date_str)
        else:
            deck = get_vocab_session_deck(qs, user=user, count=count)

        serializer = VocabularyWordSerializer(deck, many=True)
        return Response(serializer.data)


def build_root_mastery_stats(vocab_logs):
    """
    Aggregate root-level mastery, accuracy, attempt counts, and most recent
    study timestamp (`last_worked_at`) from a StudyLog queryset of vocabulary logs.
    """
    roots = list(Root.objects.prefetch_related('words').all())
    vocab_log_entries = (
        list(
            vocab_logs.values('word_id', 'word__root_id', 'is_correct', 'created_at')
            .order_by('created_at')
        )
        if hasattr(vocab_logs, 'values')
        else []
    )

    latest_word_mastery = {}
    root_attempts = {}
    root_correct = {}
    root_last_worked = {}

    for entry in vocab_log_entries:
        w_id = entry['word_id']
        r_id = entry['word__root_id']
        created_at = entry['created_at']
        latest_word_mastery[w_id] = bool(entry['is_correct'])
        if r_id:
            root_attempts[r_id] = root_attempts.get(r_id, 0) + 1
            if entry['is_correct']:
                root_correct[r_id] = root_correct.get(r_id, 0) + 1
            if created_at and (r_id not in root_last_worked or created_at > root_last_worked[r_id]):
                root_last_worked[r_id] = created_at

    root_mastery_list = []
    for root in roots:
        root_words = root.words.all()
        total_root_words = len(root_words)
        r_attempts = root_attempts.get(root.id, 0)
        r_corr = root_correct.get(root.id, 0)
        r_accuracy = round((r_corr / r_attempts * 100), 1) if r_attempts > 0 else 0.0
        last_worked_dt = root_last_worked.get(root.id)

        words_data = []
        words_mastered_count = 0
        for w in root_words:
            is_m = latest_word_mastery.get(w.id, False)
            if is_m:
                words_mastered_count += 1
            words_data.append({
                'id': w.id,
                'word': w.word,
                'is_mastered': is_m
            })

        mastery_percentage = round((words_mastered_count / total_root_words * 100), 1) if total_root_words > 0 else 0.0

        root_mastery_list.append({
            'id': root.id,
            'morpheme': root.morpheme,
            'language': root.language,
            'core_meaning': root.core_meaning,
            'mnemonic': root.mnemonic,
            'thematic_cluster': getattr(root, 'thematic_cluster', 'Motion & Travel'),
            'sat_tier': getattr(root, 'sat_tier', 'Tier 1 High-Yield'),
            'total_words': total_root_words,
            'mastered_words': words_mastered_count,
            'mastery_percentage': mastery_percentage,
            'accuracy_percentage': r_accuracy,
            'attempts': r_attempts,
            'last_worked_at': last_worked_dt.isoformat() if last_worked_dt else None,
            'words': words_data
        })

    recommended_roots = sorted(
        root_mastery_list,
        key=lambda r: (r['mastery_percentage'], r['accuracy_percentage'], -r['total_words'])
    )[:3]

    return root_mastery_list, recommended_roots, len(roots)


class VocabStatsView(APIView):
    """
    Dedicated stats for Kiwi Vocabulary: /api/vocab/stats/
    Provides root mastery rings, words learned, retention rate, and targeted review recommendations.
    Optimized with single-pass in-memory dictionary aggregation to eliminate ~3,000 N+1 queries.
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
        vocab_total = logs.count() if hasattr(logs, 'count') else len(logs)
        vocab_correct = logs.filter(is_correct=True).count() if hasattr(logs, 'filter') else 0
        vocab_accuracy = round((vocab_correct / vocab_total * 100), 1) if vocab_total > 0 else 0.0
        unique_words_reviewed = logs.values('word_id').distinct().count() if hasattr(logs, 'values') else 0

        root_mastery_list, recommendations, total_roots_count = build_root_mastery_stats(logs)

        return Response({
            'total_roots': total_roots_count,
            'total_words': total_words_count,
            'words_reviewed': unique_words_reviewed,
            'retention_rate': vocab_accuracy,
            'total_attempts': vocab_total,
            'root_mastery': root_mastery_list,
            'recommendations': recommendations
        })
