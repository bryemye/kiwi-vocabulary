from django.db import models


class MathQuestion(models.Model):
    """
    Decoupled question model for Kiwi Math graphing & algebra lab.
    """
    prompt = models.TextField()
    graph_config = models.JSONField(blank=True, default=dict)
    choices = models.JSONField(default=dict)
    correct_answer = models.CharField(max_length=2)
    explanation = models.TextField(blank=True, default='')

    def __str__(self):
        return f"[MATH] {self.prompt[:50]}..."


# Compatibility alias
Question = MathQuestion
