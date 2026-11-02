from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # 1. Platform Core (Auth, Activity, Dashboard)
    path('api/platform/auth/', include('platform_core.auth_urls')),
    path('api/platform/dashboard/', include('platform_core.dashboard_urls')),
    path('api/platform/', include('platform_core.urls')),

    # 2. Standalone Educational Products
    # Kiwi Vocabulary (Primary Flagship - ACTIVE)
    path('api/vocab/', include('kiwi_vocab.urls')),

    # Kiwi Math (DORMANT / DISABLED)
    # path('api/math/', include('kiwi_math.urls')),

    # Kiwi Reading (DORMANT / DISABLED)
    # path('api/reading/', include('kiwi_reading.urls')),

    # 3. Backwards-compatibility aliases for legacy clients and test suites
    path('api/auth/', include('platform_core.auth_urls')),
    path('api/dashboard/', include('platform_core.dashboard_urls')),
    path('api/study-logs/', include('platform_core.studylog_urls')),
    path('api/roots/', include('kiwi_vocab.root_urls')),
    path('api/words/', include('kiwi_vocab.word_urls')),
    # path('api/questions/', include('kiwi_math.question_urls')),
    # path('api/reading-passages/', include('kiwi_reading.passage_urls')),
]
