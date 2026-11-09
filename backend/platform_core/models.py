import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings


class User(AbstractUser):
    """
    Unified Custom User model for Kiwi Platform.
    Handles global learner identity across all Kiwi products.
    """
    pass


class MagicLoginToken(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved by Mobile Device'),
        ('CONSUMED', 'Session Established on Initiating Device'),
        ('DENIED', 'Denied by User'),
        ('EXPIRED', 'Expired'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='magic_tokens'
    )
    token = models.CharField(max_length=512, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    session_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    device_secret = models.CharField(max_length=64, blank=True, default='')
    match_code = models.CharField(max_length=10, blank=True, default='')
    status = models.CharField(max_length=20, default='PENDING', choices=STATUS_CHOICES)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"MagicToken for {self.user.email} (used={self.is_used}, status={self.status})"


class StudyLog(models.Model):
    """
    Centralized activity log for user study events across all Kiwi platform products.
    Records vocabulary reviews, question attempts, and module interactions.
    """
    ITEM_TYPE_CHOICES = [
        ('WORD', 'Vocabulary Word'),
        ('QUESTION', 'Question'),
        ('MATH', 'Math Question'),
        ('READING', 'Reading Question'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='study_logs'
    )
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    word = models.ForeignKey(
        'kiwi_vocab.VocabularyWord',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='study_logs'
    )
    question_id = models.IntegerField(null=True, blank=True)
    section = models.CharField(max_length=20, blank=True, default='')
    is_correct = models.BooleanField(default=False)
    seconds_spent = models.IntegerField(default=0)
    metadata = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.item_type}] Correct: {self.is_correct} ({self.created_at})"
