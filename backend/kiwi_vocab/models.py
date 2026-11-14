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
    root = models.ForeignKey(Root, on_delete=models.CASCADE, related_name='words')
    prefix = models.CharField(max_length=50, blank=True, default='')
    suffix = models.CharField(max_length=50, blank=True, default='')
    definition = models.TextField()
    sat_sentence = models.TextField()
    connotation = models.CharField(max_length=20, choices=CONNOTATION_CHOICES, default='neutral')
    pronunciation = models.CharField(max_length=100, blank=True, default='')
    part_of_speech = models.CharField(max_length=50, blank=True, default='adjective')
    mnemonic = models.TextField(blank=True, default='')
    review = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.word
