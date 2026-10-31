# Kiwi Learning | SAT & ACT Diagnostic Mastery Studio

A full-stack diagnostic and test-preparation web platform featuring a headless Django REST backend and a modern React + Tailwind CSS frontend designed with a sharp, high-contrast geometric aesthetic (Swiss / Neo-brutalist grid architecture) and a dedicated Kiwi-themed color palette.

---

## Brand Architecture & Color Palette

- **Canvas / Base**: Pure White (`#FFFFFF`) with parchment/cream backing (`#FAFBF8`) and subtle Swiss grid pattern.
- **Contrast Solids & Structural Borders**: Jet Black (`#111410`) with crisp `border-2 border-[#111410]` and hard unblurred drop-shadows (`shadow-[4px_4px_0px_0px_#111410]`).
- **Kiwi Core Greens**:
  - **Vivid Kiwi** (`#7BB33B` / `#84C341`): Primary actions, active navigation states, function curves, and mastery progress meters.
  - **Deep Olive / Foliage** (`#2F441E`): Accent headings and prefix tag text.
  - **Soft Kiwi Tint** (`#EDF5E5`): Geometric badges and prefix tag backgrounds.
- **Earthy Brown Accents** (Kiwi skin/seeds):
  - **Deep Bark Brown** (`#42281D` / `#593627`): Morpheme root tags, flashcard shadows, secondary buttons.
  - **Warm Caramel / Cream** (`#C29B78` / `#EFE8DF`): Morpheme root containers and track meters.

---

## Component-Specific Architecture

### 1. Etymology Flashcard View
- **Heavy Geometric Token**: 2px Jet Black border with solid dark-brown offset shadow (`shadow-[6px_6px_0px_0px_#42281D]`).
- **Deconstructed Morpheme Blocks**:
  - **Prefixes**: Soft Kiwi background (`#EDF5E5`) with Deep Olive text (`#2F441E`) and 2px border.
  - **Roots / Stems**: Warm Cream background (`#EFE8DF`) with Deep Bark Brown text (`#42281D`) and 2px border.
  - **Suffixes**: Pure White background (`#FFFFFF`) with Jet Black text (`#111410`) and 2px border.
- **Action Buttons**:
  - **"I Knew It"**: Vivid Kiwi (`#7BB33B`) with bold black border and hard shadow.
  - **"Need Review"**: Deep Bark Brown (`#42281D`) with white text and hard shadow.

### 2. Math Graphing View
- **Swiss Drafting Grid**: Inverted high-contrast drafting plane with precise tick markers and monospaced coordinates.
- **Kiwi Green Function Curve**: High-visibility Vivid Kiwi (`#7BB33B`) with 3.5px stroke.
- **Solid Square Critical Points**: Solid geometric squares (`#84C341`) with 2px Jet Black borders.
- **Live Terminal Control Bar**: Monospaced formula input with angular **"Reset"** button.

### 3. Reading & Annotation View
- **Publication-Grade Split Grid**: Two-column layout with vertical rule separating text from questions.
- **Kiwi-Lime Wash Highlighting**: Translucent wash (`rgba(132, 195, 65, 0.35)`) with an underline (`border-b-2 border-[#7BB33B]`).
- **Geometric Option Blocks**: Monospaced square chips (A, B, C, D) with choice elimination strikethroughs.

### 4. Student Dashboard
- **Modular Bento Grid**: Pure white cards with jet-black borders, large monospaced metrics, and colored accent top bars.
- **Root Mastery Tree**: Linear progress meters in Vivid Kiwi against a soft cream track (`#EFE8DF`), grouped by Classical Greek vs. Latin origin blocks.

---

## Quickstart

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
Open **`http://localhost:5173`** in your browser.
