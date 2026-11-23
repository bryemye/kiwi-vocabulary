from django.db import models


class Root(models.Model):
    LANGUAGE_CHOICES = [
        ('Latin', 'Latin'),
        ('Greek', 'Greek'),
        ('French', 'French'),
        ('Old French', 'Old French'),
        ('German', 'German'),
        ('Old English', 'Old English'),
        ('Old Norse', 'Old Norse'),
        ('Arabic', 'Arabic'),
        ('Sanskrit', 'Sanskrit'),
        ('Tamil / Indian', 'Tamil / Indian'),
        ('Latin / Greek', 'Latin / Greek'),
        ('Greek / Latin', 'Greek / Latin'),
        ('Latin / Old French', 'Latin / Old French'),
        ('Old English / Old Norse', 'Old English / Old Norse'),
    ]

    THEMATIC_CLUSTERS = [
        ('Motion & Travel', 'Motion & Travel'),
        ('Force & Transformation', 'Force & Transformation'),
        ('Position & Holding', 'Position & Holding'),
        ('Senses & Perception', 'Senses & Perception'),
        ('Communication', 'Communication'),
        ('Cognition', 'Cognition'),
        ('Emotion', 'Emotion'),
        ('Power & Conflict', 'Power & Conflict'),
        ('Law & Morality', 'Law & Morality'),
        ('Form & Nature', 'Form & Nature'),
        ('Quantity & Relation', 'Quantity & Relation'),
    ]

    SAT_TIERS = [
        ('Tier 1 High-Yield', 'Tier 1 High-Yield'),
        ('Tier 2 Multipliers', 'Tier 2 Multipliers'),
        ('Tier 3 Advanced', 'Tier 3 Advanced'),
    ]

    morpheme = models.CharField(max_length=50)
    language = models.CharField(max_length=50, choices=LANGUAGE_CHOICES, default='Latin')
    core_meaning = models.CharField(max_length=200)
    mnemonic = models.TextField(blank=True, default='')
    thematic_cluster = models.CharField(
        max_length=100,
        choices=THEMATIC_CLUSTERS,
        default='Motion & Travel',
        blank=True
    )
    sat_tier = models.CharField(
        max_length=50,
        choices=SAT_TIERS,
        default='Tier 1 High-Yield',
        blank=True
    )

    def __str__(self):
        return f"{self.morpheme} ({self.language}) - {self.core_meaning}"


class VocabularyWord(models.Model):
    CONNOTATION_CHOICES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('neutral', 'Neutral'),
    ]

    word = models.CharField(max_length=100, unique=True)
    root = models.ForeignKey(Root, on_delete=models.CASCADE, related_name='primary_words')
    roots = models.ManyToManyField(Root, through='WordRoot', related_name='words')
    prefix = models.CharField(max_length=120, blank=True, default='')
    prefix_root = models.ForeignKey(
        Root,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='prefix_words',
    )
    suffix = models.CharField(max_length=120, blank=True, default='')
    suffix_root = models.ForeignKey(
        Root,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='suffix_words',
    )
    definition = models.TextField()
    sat_sentence = models.TextField()
    connotation = models.CharField(max_length=20, choices=CONNOTATION_CHOICES, default='neutral')
    pronunciation = models.CharField(max_length=100, blank=True, default='')
    part_of_speech = models.CharField(max_length=50, blank=True, default='adjective')
    mnemonic = models.TextField(blank=True, default='')
    review = models.JSONField(default=dict, blank=True)
    is_published = models.BooleanField(default=True, db_index=True)

    def save(self, *args, **kwargs):
        skip_root_sync = kwargs.pop('_skip_root_sync', False)
        super().save(*args, **kwargs)
        if not skip_root_sync and self.root_id and not self.word_roots.exists():
            WordRoot.objects.get_or_create(
                word=self,
                root_id=self.root_id,
                defaults={'order': 0},
            )

    def get_ordered_roots(self):
        """Return ordered Root instances for this word, using prefetch cache when available."""
        prefetched = getattr(self, '_prefetched_objects_cache', {})
        if 'word_roots' in prefetched:
            word_roots = sorted(self.word_roots.all(), key=lambda wr: (wr.order, wr.id or 0))
        else:
            word_roots = list(self.word_roots.select_related('root').order_by('order', 'id'))
        if word_roots:
            return [wr.root for wr in word_roots]
        return [self.root] if self.root_id else []

    def set_ordered_roots(self, ordered_roots):
        """Sync ordered WordRoot entries and primary root FK."""
        deduped = []
        seen_ids = set()
        for r in ordered_roots:
            if r and r.id not in seen_ids:
                seen_ids.add(r.id)
                deduped.append(r)
        if not deduped:
            return
        if self.root_id != deduped[0].id:
            self.root = deduped[0]
            super(VocabularyWord, self).save(update_fields=['root'])
        WordRoot.objects.filter(word=self).delete()
        WordRoot.objects.bulk_create([
            WordRoot(word=self, root=r, order=idx)
            for idx, r in enumerate(deduped)
        ])

    def __str__(self):
        return self.word


class WordRoot(models.Model):
    word = models.ForeignKey(VocabularyWord, on_delete=models.CASCADE, related_name='word_roots')
    root = models.ForeignKey(Root, on_delete=models.CASCADE, related_name='root_words')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']
        unique_together = [('word', 'root')]

    def __str__(self):
        return f"{self.word.word} -> {self.root.morpheme} (#{self.order})"
