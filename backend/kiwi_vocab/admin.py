from django.contrib import admin
from .models import Root, VocabularyWord, WordRoot


class WordRootInline(admin.TabularInline):
    model = WordRoot
    extra = 1
    raw_id_fields = ('root',)
    ordering = ('order', 'id')


@admin.register(Root)
class RootAdmin(admin.ModelAdmin):
    list_display = ('morpheme', 'language', 'thematic_cluster', 'sat_tier', 'core_meaning')
    list_filter = ('language', 'thematic_cluster', 'sat_tier')
    search_fields = ('morpheme', 'core_meaning', 'mnemonic')
    ordering = ('morpheme',)


@admin.register(VocabularyWord)
class VocabularyWordAdmin(admin.ModelAdmin):
    list_display = ('word', 'root', 'prefix', 'prefix_root', 'suffix', 'suffix_root', 'part_of_speech', 'connotation', 'is_published')
    list_editable = ('prefix', 'suffix', 'part_of_speech', 'connotation', 'is_published')
    list_filter = ('is_published', 'connotation', 'part_of_speech', 'root__language', 'root__thematic_cluster')
    search_fields = ('word', 'definition', 'mnemonic', 'prefix', 'suffix', 'root__morpheme', 'roots__morpheme')
    ordering = ('word',)
    raw_id_fields = ('root', 'prefix_root', 'suffix_root')
    inlines = [WordRootInline]
