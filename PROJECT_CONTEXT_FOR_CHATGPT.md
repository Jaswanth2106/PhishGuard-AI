# PROJECT CONTEXT FOR CHATGPT

## ==================================================
## PROJECT OVERVIEW
## ==================================================

**Project Name:** PhishGuard AI – AI Powered Phishing Email Detection Platform
**Purpose:** An enterprise-grade, full-stack application designed to detect, analyze, and explain phishing and spam emails using advanced Machine Learning (Linear SVM + TF-IDF) and a modern, responsive web interface.
**Current Architecture:** A decoupled Full-Stack Web Application.
- **Frontend:** Next.js (React 19) App Router, Tailwind CSS (v4), shadcn/ui components, running on Node.js.
- **Backend:** FastAPI (Python 3.14), SQLAlchemy, scikit-learn for ML, running locally on uvicorn.
- **Machine Learning:** Pre-trained Linear Support Vector Machine (SVM) pipeline with a unified custom TF-IDF Vectorizer (word and character n-grams) and extensive metadata feature engineering.
- **Authentication:** Supabase Auth (JWT-based, Session persistence) replacing the legacy custom Python/SQLAlchemy auth.
- **Database:** Supabase PostgreSQL for users, profiles, and history (currently migrating from local SQLite).
- **Deployment Architecture:** Currently running locally via `npm run dev` and `uvicorn`, with Dockerization planned for Phase 11.

**Folder Structure:**
```
C:\Users\user\Desktop\Spam_Email_Detector
├── backend/
│   ├── app/
│   │   ├── api/ (FastAPI routers)
│   │   ├── core/ (Config, exceptions, security, logging)
│   │   ├── db/ (SQLAlchemy sessions, Supabase integration)
│   │   ├── engines/ (Parsing logic, OCR, report generation)
│   │   ├── middleware/ (Request logging, CORS)
│   │   ├── ml_models/ (model.pkl, vectorizer.pkl)
│   │   ├── models/ (Database models e.g., user.py)
│   │   ├── schemas/ (Pydantic schemas for requests/responses)
│   │   ├── services/ (ml_prediction_service.py, auth_service.py)
│   │   └── main.py (FastAPI entrypoint)
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── app/ (Next.js App Router: (auth), dashboard, landing pages)
│   │   ├── components/ (shadcn ui, landing components, layout elements)
│   │   ├── contexts/ (auth-context.tsx)
│   │   └── lib/ (backend-api.ts, supabase-client.ts, utils.ts)
│   ├── package.json
│   ├── tailwind.config / postcss / eslint
│   └── public/
├── ml/ (Training scripts, notebooks, datasets, model generation)
└── tests/ (Pytest backend tests)
```

## ==================================================
## IMPLEMENTED FEATURES
## ==================================================

### 1. Advanced Machine Learning Prediction
- **What it does:** Classifies emails as "phishing_or_spam" or "legitimate", outputs a confidence score (0-1), probability, and lists top signals (e.g. "contains 3 financial keywords").
- **Where:** `backend/app/services/ml_prediction_service.py`
- **Important Files:** `ml_models/model.pkl`, `ml_models/vectorizer.pkl`, `schemas/prediction.py`.
- **Dependencies:** `scikit-learn`, `pandas`, `joblib`.

### 2. FastAPI Backend Core
- **What it does:** Hosts the API, handles CORS, maps errors to structured JSON, provides health/readiness endpoints.
- **Where:** `backend/app/main.py`, `backend/app/core/exceptions.py`.
- **Dependencies:** `fastapi`, `uvicorn`, `pydantic`.

### 3. Frontend Landing Page & Layout
- **What it does:** Modern, animated landing page with Hero, Features, How-It-Works, and Testimonials sections. Dark/Light theme toggling.
- **Where:** `frontend/src/app/page.tsx`, `frontend/src/components/landing/*`.
- **Dependencies:** `framer-motion`, `next-themes`, `lucide-react`, `tailwindcss`.

### 4. Supabase Authentication Pipeline (Phase 5.1)
- **What it does:** Allows users to sign up, log in, reset passwords, and maintains session persistence across browser reloads via AuthContext.
- **Where:** `frontend/src/app/(auth)/*`, `frontend/src/contexts/auth-context.tsx`, `frontend/src/lib/supabase-client.ts`.
- **Dependencies:** `@supabase/supabase-js`.

### 5. Frontend Dashboard Skeleton
- **What it does:** Protected routes meant for authenticated users only, displaying navigation for analysis, chat, history, reports, and settings.
- **Where:** `frontend/src/app/dashboard/*`.

### 6. Backend API Integration Layer
- **What it does:** Standardized fetch wrapper to securely hit the FastAPI backend from the Next.js frontend, managing timeouts and standardizing errors.
- **Where:** `frontend/src/lib/backend-api.ts`.


## ==================================================
## CURRENT PROJECT STATUS
## ==================================================

**Completed Phases:**
- Phase 1 & 2: ML Dataset gathering, parsing, cleaning, feature engineering, and training (Linear SVM chosen over LightGBM).
- Phase 3: Backend API Integration (Phase 3.1 - 3.3).
- Phase 4: Frontend connection & UX (Phase 4.1 - 4.2).
- Phase 5.1: Supabase Authentication integration.

**Remaining Phases:**
- Phase 5.2: Profile Management
- Phase 5.3: Email Scan History
- Phase 5.4: Reports & Analytics
- Phase 6: AI Chat Assistant
- Phase 7: Settings & Preferences
- Phase 8: Performance Optimization
- Phase 9: Security Hardening
- Phase 10: Testing
- Phase 11: Deployment (Dockerization)
- Final Project Audit

**Current Phase:** Phase 5.2 (Profile Management) - Ready to begin.

**Overall Completion Percentage:** ~60%

## ==================================================
## FILES
## ==================================================

**Important Configuration Files:**
- `frontend/package.json`
- `backend/requirements.txt`
- `frontend/tsconfig.json`
- `frontend/src/lib/supabase-client.ts`
- `backend/app/core/config.py`

**Important Environment Variables:**
*(Frontend .env.local)*
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (points to FastAPI backend)

*(Backend .env)*
- `LOG_LEVEL`
- `CORS_ORIGINS`

## ==================================================
## BACKEND
## ==================================================

**API Endpoints:**
- `GET /health` & `GET /ready`: System health monitoring.
- `GET /version`: Returns API version info.
- `POST /api/v1/predict`: Main prediction endpoint. Expects email `subject`, `body`, and optional `metadata`.
- `POST /api/v1/auth/login` / `register`: Legacy auth endpoints (currently being phased out by Supabase on the frontend).

**Request Schemas (`schemas/prediction.py`):**
- `EmailPredictionRequest`: Contains `subject` (str), `body` (str), `metadata` (dict, optional).

**Response Schemas (`schemas/prediction.py`):**
- `EmailPredictionResponse`: Contains `prediction` (str), `label` (int), `confidence_score` (float), `probability_like_score` (float), `explanation` (dict with top_signals).

**Middleware & Logging:**
- `RequestLoggingMiddleware` injects UUIDs for tracing. Structured JSON logging configured in `core/logging_config.py`.

**Error Handling:**
- Registered exception handlers in `core/exceptions.py` map Python Exceptions (e.g. `ModelNotLoadedError`) to standardized RFC-like JSON errors with HTTP status codes (422, 500, 503).

**Prediction Service (`services/ml_prediction_service.py`):**
- Singleton loaded at FastAPI startup via `lifespan`.
- Normalizes text (NFKC), extracts URL/IP/Email/Hash tags, calculates character/word counts, and extracts keywords (Financial, Urgency, Login, Attachment).
- Uses `.decision_function()` mapped through a Sigmoid to generate probability-like scores.

## ==================================================
## FRONTEND
## ==================================================

**Pages & Routing (Next.js App Router):**
- `/`: Landing page.
- `/(auth)/login`, `/signup`, `/forgot-password`, `/reset-password`: Auth flows.
- `/dashboard/overview`: Dashboard landing.
- `/dashboard/analyse`: Main phishing scanner interface.
- `/dashboard/history`: Scan history (WIP).
- `/dashboard/reports`: Analytics (WIP).
- `/dashboard/chat`: AI Assistant (WIP).
- `/dashboard/settings`: Preferences (WIP).

**Components:**
- Extensively uses `shadcn/ui` (Radix UI primitives + Tailwind).
- `theme-provider.tsx` for Dark/Light mode support.

**Hooks & Providers:**
- `auth-context.tsx` provides `useAuth()` to manage Supabase session states (user, loading, login/logout functions).

**State Management & Error Handling:**
- React state (`useState`, `useEffect`).
- Errors are displayed using toast notifications or inline red-text alerts in forms.

## ==================================================
## AUTHENTICATION
## ==================================================

**Supabase Configuration:**
- Client initialized in `src/lib/supabase-client.ts` using `@supabase/supabase-js`.
- Configured to persist sessions in the browser (localStorage) and auto-refresh tokens.

**Flows:**
- **Signup:** User provides email/password, Supabase creates user, awaits email verification.
- **Login:** Authenticates against Supabase, sets session, redirects to `/dashboard/overview`.
- **Forgot Password:** Sends a reset link to the email.
- **Reset Password:** Captures URL hash, updates password in Supabase.
- **Protected Routes:** Next.js layouts/components check `useAuth()`. If `!user && !loading`, redirects to `/login`.
- **Logout:** Calls `supabase.auth.signOut()`, clears context, redirects to `/`.

## ==================================================
## ML
## ==================================================

**Model:** Linear Support Vector Machine (`LinearSVC`). Chosen because it strictly outperformed LightGBM in F1-score (0.9875 vs 0.9800), executes in <0.01ms, and uses ~0.38MB of RAM.
**Vectorizer:** Scikit-Learn `ColumnTransformer` wrapping TF-IDF (word n-grams 1-2, char n-grams 3-5) and a StandardScaler for numeric metadata.
**Preprocessing:** Drops empty emails, standardizes line endings (LF), normalizes Unicode, replaces sensitive strings with tokens (`<URL>`, `<IP>`).
**Feature Engineering:** Generates 21 numeric features (e.g., `average_word_length`, `exclamation_count`, `financial_keyword_count`).
**Prediction Pipeline:** Features fed to `vectorizer.transform()`, then to `model.predict()` and `model.decision_function()`.
**Confidence Calculation:** Uses a Sigmoid function on the SVM decision boundary distance to proxy probability.
**Top Signals:** The backend extracts human-readable text (e.g. "contains 3 financial keywords") based on the generated numeric vectors.

## ==================================================
## REPORTS
## ==================================================

- `ml/reports/cleaning_report.json`
- `ml/reports/feature_report.json`
- `ml/reports/leakage_report.json`
- `ml/reports/benchmark_results.csv`
- `ml/reports/benchmark_summary.json`
- `ml/reports/evaluation_report.json`
- `ml/reports/classification_report.txt`
- `ml/reports/confusion_matrix.png`
- `frontend_ux_report.json`
- `frontend_integration_report.json`

## ==================================================
## VERIFICATION
## ==================================================

- Extensively validated the ML model using a strict 10% hold-out test set (no leakage, no TF-IDF fitting on test data).
- Verified `LinearSVC` convergence.
- Verified Frontend-Backend Integration via `frontend_integration_report.json`.
- Verified UX rendering via `frontend_ux_report.json`.

## ==================================================
## KNOWN ISSUES
## ==================================================

- The backend currently still contains legacy SQLAlchemy user/auth models that overlap with the new Supabase frontend auth.
- The `history`, `reports`, `chat`, and `settings` dashboard routes exist as skeleton folders but have no implementation.
- The app lacks rate limiting, CSRF tokens, and security headers.
- Profile management is missing.

## ==================================================
## NEXT TASKS
## ==================================================

**Recommended Implementation Order:**
1. **Phase 5.1 Verification:** Do a deep-dive test of Supabase Auth routes. Fix any missing loading states or redirection bugs.
2. **Phase 5.2 (Profile Management):** Build the `/profile` page in the dashboard using Supabase `updateUser`.
3. **Phase 5.3 (Email History):** Setup Supabase Database tables for `scans` and link them to user IDs. Build the UI.
4. **Phase 5.4 (Reports):** Add Chart.js / Recharts to visualize scan data from the database.
5. **Phase 6 (Chat Assistant):** Integrate an LLM endpoint (e.g. OpenAI/Anthropic or local) into the backend, create `/api/v1/chat`, build the UI.
6. **Phase 7 (Settings):** Finalize user preferences UI.
7. **Phase 8 (Performance):** Audit Next.js bundle sizes and implement lazy loading.
8. **Phase 9 (Security):** Add `helmet`-like middleware to FastAPI, rate limiting, and validate CORS.
9. **Phase 10 (Testing):** Write Cypress/Playwright for frontend, Pytest for backend.
10. **Phase 11 (Deployment):** Write Dockerfiles, `docker-compose.yml`, and `FINAL_PROJECT_REPORT.md`.

## ==================================================
## IMPORTANT RULES
## ==================================================

- **DO NOT RETRAIN THE ML MODEL.** The `.pkl` files in `backend/app/ml_models` are final and highly optimized.
- **DO NOT RECREATE FILES.** Always use `view_file` to read existing Next.js / FastAPI layouts and append/modify them rather than replacing them.
- **DO NOT BREAK FRONTEND/BACKEND CONTRACTS.** The `EmailPredictionRequest` and `EmailPredictionResponse` formats are strictly defined and must remain untouched.
- **REUSE EXISTING CODE.** The project utilizes `shadcn/ui` components extensively. Do not build custom UI components if a `shadcn` primitive (like `button.tsx`) already exists.
- **PRESERVE THEME.** Maintain the existing Dark/Light mode tailwind configuration.
- **DO NOT ASK FOR APPROVAL.** Once the handoff AI begins, it must autonomously verify its own steps and push through to production readiness unless a fatal blocker occurs.
