from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings

assets_dir = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets'

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

    # 4. Vite Frontend Assets Fallback
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': assets_dir}),

    # 5. SPA Catch-all: Serves React index.html for root and all client-side routes
    re_path(r'^(?!api/|admin/|static/|assets/).*$', TemplateView.as_view(template_name='index.html')),
]
