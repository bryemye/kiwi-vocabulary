"""
Compatibility aliases for legacy code importing from core.models.
All core domain models are now modularly housed in their respective platform apps:
- platform_core: User, MagicLoginToken, StudyLog
- kiwi_vocab: Root, VocabularyWord
- kiwi_math: MathQuestion (aliased as Question)
- kiwi_reading: ReadingPassage, ReadingQuestion
"""

from platform_core.models import User, MagicLoginToken, StudyLog
from kiwi_vocab.models import Root, VocabularyWord
from kiwi_math.models import MathQuestion as Question
from kiwi_reading.models import ReadingPassage

__all__ = [
    'User',
    'MagicLoginToken',
    'StudyLog',
    'Root',
    'VocabularyWord',
    'Question',
    'ReadingPassage',
]
