from django.contrib import admin
from .models import Root, VocabularyWord


@admin.register(Root)
class RootAdmin(admin.ModelAdmin):
    list_display = ('morpheme', 'language', 'thematic_cluster', 'sat_tier', 'core_meaning')
    list_filter = ('language', 'thematic_cluster', 'sat_tier')
    search_fields = ('morpheme', 'core_meaning', 'mnemonic')
    ordering = ('morpheme',)


@admin.register(VocabularyWord)
class VocabularyWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'root', 'prefix', 'suffix', 'part_of_speech', 'connotation')
    list_editable = ('prefix', 'suffix', 'part_of_speech', 'connotation')
    list_filter = ('connotation', 'part_of_speech', 'root__language', 'root__thematic_cluster')
    search_fields = ('word', 'definition', 'prefix', 'suffix', 'root__morpheme')
    ordering = ('word',)
    raw_id_fields = ('root',)
