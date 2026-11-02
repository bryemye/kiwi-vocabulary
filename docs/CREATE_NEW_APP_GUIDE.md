# Kiwi Platform: New Educational Product Creation Guide & LLM Prompt Template

This specification defines the architectural standards, code patterns, and copy-paste prompt template for adding new standalone educational products to the **Kiwi Platform** (e.g., **Kiwi Linear Algebra**, **Kiwi Physics**, **Kiwi Chemistry**).

---

## 1. Architecture Overview

Kiwi Platform is a modular educational ecosystem structured into:
- **`platform_core` (Shared Infrastructure)**:
  - Custom `User` model (`AUTH_USER_MODEL = 'platform_core.User'`)
  - Passwordless magic-link authentication (`/api/platform/auth/`)
  - Centralized study telemetry & activity logging (`StudyLog` model, `/api/platform/study-logs/`)
  - Platform dashboard telemetry (`/api/platform/dashboard/stats/`)
- **Standalone Educational Products (Decoupled Apps)**:
  - Primary Flagship: `kiwi_vocab` (Etymology flashcards & spaced repetition)
  - Secondary Modules: `kiwi_math`, `kiwi_reading`
  - Any new product (e.g., `kiwi_linalg`) must follow the exact same isolated, decoupled architecture.
- **Frontend App Suite (React + Vite + Tailwind CSS)**:
  - Global `KIWI.PLATFORM` header with unified auth and product switcher (`Navbar.jsx`)
  - Standalone product workspace component (`<ProductName>View.jsx`)
  - Unified logging of study attempts via `logStudyAttempt()` in `api.js`

---

## 2. Neo-Brutalist Design System Rules

All new UI components MUST adhere strictly to the **Kiwi Swiss-Grid / Neo-Brutalist Design System**:

| Design Token | Hex Code | Purpose | Tailwind Class |
|---|---|---|---|
| **Canvas White** | `#FFFFFF` | Primary card background | `bg-white` |
| **Soft Tint** | `#FAFBF8` | Page background / subtle backing | `bg-[#FAFBF8]` |
| **Jet Black** | `#111410` | Structural borders & high-contrast text | `border-2 border-[#111410] text-[#111410]` |
| **Vivid Kiwi Green** | `#7BB33B` | Primary actions, success, mastery progress | `bg-[#7BB33B] hover:bg-[#84C341]` |
| **Soft Kiwi Tint** | `#EDF5E5` | Active badges, light highlight pill | `bg-[#EDF5E5] text-[#2F441E]` |
| **Deep Bark Brown** | `#42281D` | Secondary actions, roots, math elements | `bg-[#42281D] hover:bg-[#593627] text-white` |
| **Warm Cream** | `#EFE8DF` | Track backgrounds, neutral tags | `bg-[#EFE8DF] text-[#42281D]` |
| **Drop Shadows** | Solid unblurred | Geometric offset depth | `shadow-[3px_3px_0px_0px_#111410]` |
| **Active Press** | 1px or 2px offset | Tactile mechanical feel | `active:translate-x-[2px] active:translate-y-[2px]` |

### Typography Guidelines
- **Headings & Badges**: Sans-serif, bold/black weight, uppercase, tight tracking (`font-sans font-black uppercase tracking-tight`).
- **Telemetry & Numbers**: Monospace font (`font-mono font-bold uppercase`).
- **Academic Context / Definitions**: Serif font (`font-serif italic`).

---

## 3. Step-by-Step Implementation Guide (Example: Kiwi Linear Algebra)

### Step 1: Create the Backend Django App
1. Create folder `backend/kiwi_linalg/`:
   ```
   backend/kiwi_linalg/
     ├── __init__.py
     ├── apps.py
     ├── models.py
     ├── serializers.py
     ├── views.py
     ├── urls.py
     ├── admin.py
     ├── tests.py
     ├── fixtures/
     │     └── linalg_seed.json
     └── management/
           ├── __init__.py
           └── commands/
                 ├── __init__.py
                 └── seed_linalg.py
   ```
2. Configure `apps.py`:
   ```python
   from django.apps import AppConfig

   class KiwiLinalgConfig(AppConfig):
       default_auto_field = 'django.db.models.BigAutoField'
       name = 'kiwi_linalg'
       verbose_name = 'Kiwi Linear Algebra Product'
   ```
3. Register in `backend/config/settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       'platform_core',
       'kiwi_vocab',
       'kiwi_math',
       'kiwi_reading',
       'kiwi_linalg',  # <-- Add new app
   ]
   ```

### Step 2: Define Domain Models & Serializers
1. Create `models.py`:
   ```python
   from django.db import models

   class MatrixProblem(models.Model):
       TOPIC_CHOICES = [
           ('TRANSFORM', '2D/3D Linear Transformations'),
           ('EIGEN', 'Eigenvalues & Eigenvectors'),
           ('DETERMINANT', 'Determinants & Inverses'),
           ('SYSTEMS', 'Systems of Linear Equations'),
       ]

       topic = models.CharField(max_length=30, choices=TOPIC_CHOICES)
       prompt = models.TextField()
       matrix_data = models.JSONField(default=dict, blank=True) # e.g. [[a, b], [c, d]]
       vector_data = models.JSONField(default=dict, blank=True)
       choices = models.JSONField(default=dict)
       correct_answer = models.CharField(max_length=10)
       explanation = models.TextField(blank=True, default='')

       def __str__(self):
           return f"[{self.topic}] {self.prompt[:40]}..."
   ```
2. Create `serializers.py`:
   ```python
   from rest_framework import serializers
   from .models import MatrixProblem

   class MatrixProblemSerializer(serializers.ModelSerializer):
       class Meta:
           model = MatrixProblem
           fields = '__all__'
   ```

### Step 3: API ViewSet & Namespaced URLs
1. Create `views.py`:
   ```python
   from rest_framework import viewsets, permissions
   from .models import MatrixProblem
   from .serializers import MatrixProblemSerializer

   class MatrixProblemViewSet(viewsets.ReadOnlyModelViewSet):
       queryset = MatrixProblem.objects.all()
       serializer_class = MatrixProblemSerializer
       permission_classes = [permissions.AllowAny]

       def get_queryset(self):
           qs = super().get_queryset()
           topic = self.request.query_params.get('topic')
           if topic:
               qs = qs.filter(topic=topic.upper())
           return qs
   ```
2. Create `backend/kiwi_linalg/urls.py`:
   ```python
   from django.urls import path, include
   from rest_framework.routers import DefaultRouter
   from .views import MatrixProblemViewSet

   router = DefaultRouter()
   router.register(r'problems', MatrixProblemViewSet, basename='linalg-problem')

   urlpatterns = [
       path('', include(router.urls)),
   ]
   ```
3. Register route in `backend/config/urls.py`:
   ```python
   path('api/linalg/', include('kiwi_linalg.urls')),
   ```

### Step 4: Migrations & Seed Command
1. Generate and apply migrations:
   ```powershell
   python manage.py makemigrations kiwi_linalg
   python manage.py migrate
   ```
2. Create `seed_linalg.py` management command so the app comes pre-populated with high quality interactive curriculum data.

### Step 5: Frontend API Integration
Add queries in `frontend/src/services/api.js`:
```javascript
export async function fetchMatrixProblems(topic = '') {
  const query = topic ? `?topic=${topic}` : '';
  const res = await fetch(`${API_BASE}/linalg/problems/${query}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch linear algebra problems');
  return res.json();
}
```

### Step 6: Register in App Switcher & App Router
1. In `frontend/src/components/Navbar.jsx`, add to the `apps` array:
   ```javascript
   {
     id: 'linalg',
     name: 'Kiwi Linear Algebra',
     badge: 'MODULE',
     tagline: 'Interactive Matrix Transformations & Vector Spaces',
     icon: Grid, // or Matrix/Binary from lucide-react
     color: '#42281D',
     accentBg: '#FAFBF8',
   }
   ```
2. Create `frontend/src/components/LinearAlgebraView.jsx` following the Neo-Brutalist design tokens.
3. Wire study attempts to centralized logging:
   ```javascript
   await logStudyAttempt({
     item_type: 'QUESTION',
     section: 'LINALG',
     question_id: problem.id,
     is_correct: isCorrect,
     seconds_spent: secondsSpent,
     metadata: { topic: problem.topic }
   });
   ```
4. Render in `frontend/src/App.jsx` when `activeApp === 'linalg'`.

---

## 4. Turnkey Copy-Paste LLM Prompt Template

Use the prompt below whenever requesting an LLM to add a new educational product to Kiwi Platform:

````markdown
You are an expert full-stack developer working on the **Kiwi Platform**—a modular educational app suite built with a headless Django REST backend and a React + Vite + Tailwind CSS frontend.

### GOAL:
Implement a new standalone educational product named: **{{PRODUCT_NAME}}** (App ID: `kiwi_{{APP_ID}}`), for example: **Kiwi Linear Algebra** (`kiwi_linalg`).

### ARCHITECTURAL REQUIREMENTS:
1. **Backend Decoupling (Django)**:
   - Create a new dedicated app directory: `backend/kiwi_{{APP_ID}}/`.
   - Register `'kiwi_{{APP_ID}}'` in `backend/config/settings.py` inside `INSTALLED_APPS`.
   - Implement domain models in `backend/kiwi_{{APP_ID}}/models.py`.
   - Implement DRF serializers in `backend/kiwi_{{APP_ID}}/serializers.py`.
   - Implement ViewSets in `backend/kiwi_{{APP_ID}}/views.py`.
   - Namespace all product URLs under `/api/{{APP_ID}}/` in `backend/config/urls.py`.
   - Add a seed command `management/commands/seed_{{APP_ID}}.py` with 3-5 authentic seed problems/lessons.
   - Run migrations cleanly (`makemigrations` and `migrate`).

2. **Telemetry & Activity Logging**:
   - Every time a user completes an exercise or problem in this new product, log the attempt to the central platform endpoint:
     `POST /api/platform/study-logs/` with payload:
     ```json
     {
       "item_type": "QUESTION",
       "section": "{{SECTION_CODE}}",
       "question_id": 1,
       "is_correct": true,
       "seconds_spent": 25,
       "metadata": {}
     }
     ```

3. **Frontend Integration (React + Tailwind)**:
   - Add API fetch functions in `frontend/src/services/api.js`.
   - Register the product in `frontend/src/components/Navbar.jsx` inside the `apps` array so it appears in the **App Switcher** with a Lucide icon and `MODULE` badge.
   - Build `frontend/src/components/{{COMPONENT_NAME}}View.jsx` (e.g., `LinearAlgebraView.jsx`).
   - Register the view in `frontend/src/App.jsx` under `activeApp === '{{APP_ID}}'`.

4. **Neo-Brutalist Design System Compliance**:
   - Canvas White (`#FFFFFF`) cards and Soft Tint (`#FAFBF8`) backing.
   - Strict Jet Black borders: `border-2 border-[#111410]`.
   - Vivid Kiwi Green (`#7BB33B`) for primary actions and correct states.
   - Deep Bark Brown (`#42281D`) for secondary actions and mathematical chips.
   - Solid unblurred geometric drop shadows: `shadow-[3px_3px_0px_0px_#111410]` or `shadow-[4px_4px_0px_0px_#111410]`.
   - Tactile active translations: `active:translate-x-[2px] active:translate-y-[2px]`.
   - Sans headings with monospaced telemetry values (`font-mono`).

5. **Verification**:
   - Provide command to run migrations.
   - Provide unit test suite in `backend/kiwi_{{APP_ID}}/tests.py`.
   - Ensure `npm run build` compiles without syntax or JSX errors.
````
