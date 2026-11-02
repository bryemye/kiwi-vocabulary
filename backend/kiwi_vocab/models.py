from django.db import models


class Root(models.Model):
    LANGUAGE_CHOICES = [
        ('Latin', 'Latin'),
        ('Greek', 'Greek'),
    ]

    morpheme = models.CharField(max_length=50)
    language = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, default='Latin')
    core_meaning = models.CharField(max_length=200)
    mnemonic = models.TextField(blank=True, default='')

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
    review = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.word
