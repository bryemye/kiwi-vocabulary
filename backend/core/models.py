from django.db import models
from django.contrib.auth.models import User


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

    def __str__(self):
        return self.word


class ReadingPassage(models.Model):
    title = models.CharField(max_length=255)
    author_or_source = models.CharField(max_length=255)
    body = models.TextField()

    def __str__(self):
        return self.title


class Question(models.Model):
    SECTION_CHOICES = [
        ('MATH', 'Math'),
        ('READ', 'Reading'),
        ('VERB', 'Verbal'),
    ]

    section = models.CharField(max_length=10, choices=SECTION_CHOICES)
    passage = models.ForeignKey(ReadingPassage, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    prompt = models.TextField()
    graph_config = models.JSONField(blank=True, default=dict)
    choices = models.JSONField(default=dict)
    correct_answer = models.CharField(max_length=2)
    explanation = models.TextField(blank=True, default='')

    def __str__(self):
        return f"[{self.section}] {self.prompt[:50]}..."


class StudyLog(models.Model):
    ITEM_TYPE_CHOICES = [
        ('WORD', 'Vocabulary Word'),
        ('QUESTION', 'Question'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='study_logs')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    word = models.ForeignKey(VocabularyWord, on_delete=models.SET_NULL, null=True, blank=True, related_name='study_logs')
    question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True, blank=True, related_name='study_logs')
    is_correct = models.BooleanField(default=False)
    seconds_spent = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.item_type} - Correct: {self.is_correct} ({self.created_at})"
