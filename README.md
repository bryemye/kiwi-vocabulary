# Aegis SAT/ACT Mastery Studio

A full-stack diagnostic and test-preparation web platform featuring a headless Django REST backend and a modern React + Tailwind CSS frontend with interactive data visualizations, etymological root decomposition, SVG graphing, and simulated digital SAT reading annotations.

---

## Architecture Overview

```
c:\kiwi-redux\
├── backend/
│   ├── config/             # Django project configuration (CORS, DRF settings, URLs)
│   ├── core/               # Django app with models, serializers, views, seed command
│   │   ├── models.py       # Root, VocabularyWord, ReadingPassage, Question, StudyLog
│   │   ├── serializers.py  # DRF serializers with nested relationships
│   │   ├── views.py        # ViewSets & custom /api/dashboard/stats/ endpoint
│   │   ├── urls.py         # REST router and custom stats routes
│   │   └── management/commands/seed_data.py # 9 roots (27 words), 4 math graphs, 1 passage (3 Qs)
│   ├── verify_study_modes.py # Automated test verifying 3 study modes & stats updating
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation, session timer, live accuracy pill
│   │   │   ├── VocabView.jsx     # 3D Flip Flashcards with morpheme breakdown tags & TTS
│   │   │   ├── MathView.jsx      # Split screen: prompts + interactive SVG coordinate plane
│   │   │   ├── ReadingView.jsx   # Two-column SAT split view with live text highlighter & strikethrough
│   │   │   └── DashboardView.jsx # Metric cards, Greek/Latin Root Matrix, recommendations
│   │   ├── services/api.js       # Fetch helpers for roots, words, questions, passages, logs, stats
│   │   ├── App.jsx               # Main state management and navigation controller
│   │   ├── index.css             # Tailwind utilities and 3D transform animations
│   │   └── main.jsx
│   ├── vite.config.js            # Vite config with /api reverse proxy to port 8000
│   ├── tailwind.config.js
│   └── package.json
```

---

## Key Features

### 1. Etymology-Driven Vocabulary Flashcards
- **Card Interface with 3D Flip Animation**: Smooth perspective rotation.
- **Front View**: Target word, phonetics (`/sir-kuhm-loh-KYOO-shun/`), part of speech, connotation badge, and Web Speech API audio pronunciation.
- **Middle / Reveal Morpheme Decomposition**: Visual breakdown tags:
  `[Prefix] + [Root Morpheme + Core Meaning] + [Suffix]` plus root mnemonic memory keys.
- **Back View**: Official SAT definition, exam context sentence, and connotation indicator.
- **Active Recall Controls**: "I Knew It" (green) and "Need Review" (amber) buttons sending study telemetry to `/api/study-logs/`.

### 2. Math Graphing & Coordinate Plane Lab
- **Left Side**: Problem prompt, formula badge, multiple-choice options with elimination indicators.
- **Right Side (SVG Coordinate Plane)**:
  - Responsive Cartesian grid with axis ticks and numbered coordinate labels.
  - Dynamically renders functions based on `graph_config` (parabolas $y=(x-2)^2-4$, linear functions $y=-0.5x+3$, systems of intersecting lines, absolute value curves $y=|x-1|-3$).
  - Animated pulsing key points (vertices, intercepts, intersections) with label callouts.
  - Interactive crosshair on mouse hover reporting exact `(x, y)` math coordinates.
- **Immediate Feedback**: Instant step-by-step mathematical rationale upon answer submission.

### 3. Reading & Highlighting View (Digital SAT Interface)
- **Two-Column Split Layout**: Modeled after the official digital SAT/ACT testing interface.
- **Left Pane (Passage & Highlighting)**: Full multi-paragraph reading passage with paragraph index badges. Selecting any text displays a floating tooltip to apply a persistent yellow highlight (`<mark>`). Includes font size controls (`A-`, `A`, `A+`) and a "Clear Highlights" button.
- **Right Pane (Question & Choice Elimination)**: Option strikethrough button for choices A/B/C/D allowing students to eliminate incorrect choices, radio selection, answer submission, and passage rationale explanation.

### 4. Student Analytics Dashboard
- **Metric Cards**: Total Words Reviewed, Math Accuracy %, Reading Accuracy %, Total Study Time.
- **Etymology Root Mastery Index**: Grouping roots by origin (Latin vs. Greek), displaying mastery progress bars (`3/3 words mastered (100%)`) and pill tags for every word in that morpheme family.
- **"Start Next Session" Recommendations**: Auto-detects lowest-scoring or unpracticed roots and provides a one-click button to jump directly into practicing that root family.

---

## Quickstart Instructions

### 1. Backend (Django)
```bash
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. All API requests are automatically proxied to Django on port 8000.

### 3. Running Verification
To verify that all 3 study modes persist logs and dynamically update dashboard stats:
```bash
cd backend
python verify_study_modes.py
```
