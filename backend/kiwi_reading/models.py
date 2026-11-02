from django.db import models


class ReadingPassage(models.Model):
    """
    Decoupled reading passage model for Kiwi Reading annotation & comprehension.
    """
    title = models.CharField(max_length=255)
    author_or_source = models.CharField(max_length=255)
    body = models.TextField()

    def __str__(self):
        return self.title


class ReadingQuestion(models.Model):
    """
    Questions linked to reading passages.
    """
    passage = models.ForeignKey(ReadingPassage, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    choices = models.JSONField(default=dict)
    correct_answer = models.CharField(max_length=2)
    explanation = models.TextField(blank=True, default='')

    def __str__(self):
        return f"[READ] {self.prompt[:50]}..."
