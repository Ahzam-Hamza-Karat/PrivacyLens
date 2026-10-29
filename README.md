# PrivacyLens

> Plain-language explanations, evidence-backed findings, and transparent analysis for complicated privacy policies.

PrivacyLens is a modern web application designed to empower everyday consumers by translating convoluted terms of service and privacy policies into clear, verifiable explanations.

---

## 1. Project Overview & Current Status

- **Status:** **100% Implemented, Integrated, Audited & Academic Submission Ready**
- **Test Baseline:** **275 passed backend tests across 96 suites (0 failures)**
- **Accuracy Evaluation:** **96.88% overall accuracy on 64 labeled policy excerpts (100% precision, 98.08% F1-score)**
- **Production Build:** **Vite 6 build completes cleanly in ~1.28s**
- **Security Audit:** **0 dependency vulnerabilities (npm audit clean), defensive HTTP security headers enabled**

### Milestone Capabilities Summary
1. **Foundation & Development Architecture:** Decoupled Express REST API and React/Vite SPA with zero third-party UI framework bloat.
2. **Text Ingestion & Segmentation Pipeline:** 50,000-character payload validation, character counter, normalization, paragraph/clause segmentation, and exact character offset mapping.
3. **Deterministic 28-Rule Analysis Engine:** Transparent pattern matching across 5 core categories with contextual negation handling, disqualifiers, and verbatim evidence extraction.
4. **Exact Evidence Slicing Invariant:** Guaranteed parity: `policyText.slice(startOffset, endOffset) === finding.evidence`.
5. **Privacy Analysis Doughnut Chart:** Conserves strict 28-rule denominator ($F + U + N = 28$) with distinct *Pending Analysis* and *Stale Analysis* states.
6. **5-Dimension Simple-Language Explanations:** Comprehensive breakdowns covering *What the text declares*, *Why it matters*, *Conditions & limitations*, and *What the analyzer cannot conclude*.
7. **Interactive Cookie Center:**
   - **Cookie Assistant:** 5 deterministic cookie checks with plain-language explanations, verbatim quotes, honest absence disclaimers, and an interactive beginner glossary.
   - **Interactive Cookie Simulator:** Real-time consent toggles with a permanently locked Essential category, batch actions (*Accept All Optional*, *Reject All Optional*, *Reset Demonstration*), and educational non-enforcement guarantees.
   - **Cookie Preference Chart & Exposure Meter:** Visual simulated data tracking exposure level and an accessible semantic HTML table alternative (`<table className="sim-preference-table">`).
8. **Policy-Grounded AI Chatbot & Explanations:**
   - On-demand supplementary finding explanations via `/api/ai/explain`.
   - Conversational assistant via `/api/ai/chat` grounded strictly in analyzed policy text.
   - Verbatim quote verification (`evidenceVerifier.js`), prompt injection isolation, 30 req/min sliding-window rate limiting, and graceful fallback when unconfigured (`AI_CONFIG_MISSING`).
9. **Policy Version Comparison & Change Inspector:** Side-by-side and unified text diff comparing two explicitly supplied policy drafts to track wording additions and removals between revisions.
10. **Accuracy Evaluation Harness:** 64 curated policy excerpts (52 real-world, 12 synthetic fixtures), 50/50 tuning/held-out split, multiclass confusion matrix, and data leakage detection.
11. **MongoDB Persistence & Saved Analysis History:**
   - Optional audit report history using official MongoDB Node.js driver (`mongodb`).
   - Saved only upon explicit user action and informed consent dialog.
   - Privacy-first access control: indexed by SHA-256 hash of anonymous browser client tokens (`X-Client-Token`), preventing public directory enumeration.
   - Zero raw text storage: stores only summary statistics, rule findings, and brief quotations.
   - Complete permanent deletion action available at any time.
   - Graceful offline degradation: transient analysis remains 100% active when MongoDB is offline or unconfigured.

> [!NOTE]
> **Architectural Privacy Guarantee:** Real-time policy analysis operates statelessly in memory. Database persistence is strictly optional, requires explicit user consent, never persists raw text documents, and scopes access exclusively to the user's private browser token.

---

## 2. Technology Stack

- **Frontend:**
  - React 18 (SPA)
  - Vite 6 build tooling and dev proxy
  - Language: JavaScript (JSX) &mdash; *TypeScript is intentionally not used*
  - Styling: Vanilla CSS design system with custom CSS variables (dark design tokens)
- **Backend:**
  - Node.js (v24.21.0 or v20+)
  - Express 4.22.3 RESTful API
  - Module System: ES Modules (`"type": "module"`)
  - Testing: Node.js built-in test runner (`node:test`) + `supertest`
  - AI Client: Native global `fetch` targeting OpenAI API (`gpt-4o-mini`)
  - Database: Official MongoDB Node.js driver (`mongodb` v7.7.0)
- **Orchestration:**
  - `concurrently` (runs frontend and backend concurrently via root npm scripts)
- **Version Control:**
  - Git

---

## 3. Directory Layout

```
PrivacyLens/
  ├── frontend/
  │   ├── src/
  │   │   ├── components/         # UI components (Analyzer, Report, CookieCenter, Chatbot, Diff, etc.)
  │   │   ├── services/           # Frontend API client (api.js -> health, analyze, ai)
  │   │   ├── utils/              # Catalogues, constants, cookie data & policy diff algorithm
  │   │   ├── App.jsx             # Main application orchestrator
  │   │   ├── index.css           # Complete design system tokens, responsive grid & print stylesheet
  │   │   └── main.jsx            # React application entry point
  │   ├── package.json            # Frontend scripts & dependencies
  │   └── vite.config.js          # Vite config with /api proxy to port 5000
  │
  ├── backend/
  │   ├── src/
  │   │   ├── config/             # Server configuration
  │   │   ├── constants/          # Shared categories, match types & strengths
  │   │   ├── controllers/        # Request controllers (health, analysis, ai)
  │   │   ├── evaluation/         # Evaluation harness (dataset.json, evaluate.js, metrics.js, evaluator.js)
  │   │   ├── middleware/         # Security headers, rate limiting, 404, and safe error handler
  │   │   ├── routes/             # Express routes (health, analysis, ai)
  │   │   ├── services/           # Core logic (policy ingestion, 28-rule engine, AI client)
  │   │   ├── app.js              # Express app setup & security headers
  │   │   └── server.js           # Server listener
  │   ├── tests/                  # 260 automated test assertions across 89 suites
  │   └── package.json            # Backend scripts & dependencies
  │
  ├── docs/                       # Architectural specs, checklists & submission readiness report
  ├── package.json                # Root package manifest & task orchestrator
  └── README.md                   # Primary project documentation
```

---

## 4. Primary Workflows & Commands

All development and evaluation commands are executed from the project root:

| Command | Action |
| :--- | :--- |
| `npm run dev` | **Start both development servers** concurrently (Backend on `http://localhost:5000` + Frontend on `http://localhost:5173`) |
| `npm run dev:frontend` | Start **only** the Vite frontend development server (`http://localhost:5173`) |
| `npm run dev:backend` | Start **only** the Express backend API server (`http://localhost:5000`) |
| `npm test` | Run the **complete automated backend test suite** (275 tests across 96 suites) |
| `npm run evaluate` | Run the **deterministic accuracy evaluation harness** across the 64-item dataset |
| `npm run verify:mongodb` | Run the **live MongoDB verification suite** against the running local Community Server |
| `npm run build` | Compile the frontend for production into `frontend/dist/` |

---

## 5. Local MongoDB Setup & Persistence Verification

PrivacyLens supports persistence of saved privacy analysis reports to a local MongoDB Community Server instance with explicit user consent and privacy-preserving SHA-256 client token scoping.

### Verified Local Configuration

| Configuration Key | Value | Purpose |
| :--- | :--- | :--- |
| **Local MongoDB URI** | `mongodb://127.0.0.1:27017` | Direct IPv4 loopback connection to local MongoDB Community Server |
| **Target Database** | `privacylens` | Dedicated application database |
| **Target Collection** | `saved_reports` | Dedicated collection for user-consented audit reports |
| **MongoDB Compass** | Connects to `mongodb://127.0.0.1:27017` | GUI inspection of database documents |
| **Port** | `27017` (default MongoDB port) | Standard local service listener |

### Setting Up Environment Variables

Configure `backend/.env` with the local MongoDB settings:

```ini
PORT=5000
HOST=localhost
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Local MongoDB Community Server Configuration
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=privacylens
MONGODB_COLLECTION_NAME=saved_reports
MONGODB_CONNECT_TIMEOUT_MS=5000
```

### Persistence & Access Control Guarantees

1. **Explicit Consent Invariant:** Analysis reports are never saved automatically. Saving requires an explicit POST payload containing `consentGiven: true`. Requests with missing or false consent are rejected with HTTP 400 `CONSENT_REQUIRED`.
2. **Anonymous SHA-256 Client-Token Scoping:** Each browser session generates an anonymous client token sent via the `X-Client-Token` HTTP header. The backend stores only the SHA-256 hash (`clientTokenHash`). Raw tokens are never stored, and users can only list, view, or delete reports matching their own hashed token.
3. **Restart Persistence:** Reports stored in the `saved_reports` collection persist across backend server restarts, node crashes, and browser reloads.
4. **Permanent Deletion:** Users retain full control to permanently delete any saved report via `DELETE /api/saved-analyses/:id`.
5. **Zero Full-Text Retention:** To maintain user privacy, saved documents store only structured finding metadata, category counts, and short quotes &mdash; never the full text of submitted policies.
6. **Graceful Offline Degradation:** If MongoDB is offline or disconnected, all real-time in-memory policy analysis, cookie checks, and AI explanations remain 100% operational; only report persistence is temporarily disabled with HTTP 503 `DATABASE_UNAVAILABLE`.

### Verification Endpoints & Commands

- `npm run verify:mongodb` &mdash; Official automated test against your live local MongoDB Community Server.
- `GET http://localhost:5000/api/health` &mdash; Returns database connection status and collection metadata.
- `GET http://localhost:5000/api/saved-analyses/status` &mdash; Returns sanitized connection status without exposing sensitive credentials.

### Step-by-Step Local Setup & Execution Guide

1. **Verify MongoDB Service:** Ensure MongoDB Community Server is running on your machine:
   ```powershell
   Get-Service -Name "*mongo*"
   # If stopped: net start MongoDB
   ```
2. **Configure Backend Environment:**
   Copy `backend/.env.example` to `backend/.env` (if not already done). The default configuration points to `mongodb://127.0.0.1:27017` with database `privacylens` and collection `saved_reports`.
3. **Start the Application:**
   From the repository root, run:
   ```bash
   npm run dev
   ```
   This concurrently launches the Express API server on `http://localhost:5000` and the Vite React application on `http://localhost:5173`.
4. **Inspect in MongoDB Compass:**
   Open MongoDB Compass and connect to `mongodb://127.0.0.1:27017`. Select the `privacylens` database and `saved_reports` collection to visually inspect persisted records.
5. **Troubleshooting:**
   - *Database Offline Pill*: If the UI shows "Database Offline / Unconfigured", check that MongoDB service is running and listening on port 27017 (`netstat -ano | findstr 27017`).
   - *Port Conflict*: If port 5000 or 5173 is already in use, stop the existing node process or update the port in `backend/.env` and `frontend/vite.config.js`.

### Known Project Limitations (Academic Scope)

1. **User Authentication:** The Sign In and Create Account modal forms are intentionally **UI-only demonstrations** with client-side field validation. No server-side user tables, session cookies, or password hashes are maintained; PrivacyLens operates entirely in privacy-preserving anonymous mode.
2. **Client-Token Scoping:** Reports in MongoDB are scoped to an anonymous UUID stored in browser `localStorage`. If you clear your browser cookies and site storage or use Private/Incognito windows, a new token is created and past reports cannot be retrieved.
3. **Transient Analysis Invariant:** Analysis operates entirely in-memory. Full raw policy text is **never** saved to MongoDB, ensuring zero compliance risk for submitted proprietary policies.

---

## 6. Security & Invariant Safeguards

1. **Defensive HTTP Headers:** Express middleware sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-XSS-Protection: 0`.
2. **Payload Protection:** Strict 50,000-character input bounds with automatic HTTP 413 rejection; JSON parser capped at 1 MB.
3. **Privacy-Preserving MongoDB & No Real Cookie Mutation:** Real-time analysis is completely stateless. Optional database saving requires explicit user consent, stores only finding summaries (never full raw policy text), and scopes records strictly to hashed anonymous client tokens. The Cookie Simulator is strictly educational and never mutates browser cookies.
4. **Verbatim Evidence Fidelity:** Quotes and character offsets correspond 100% to the submitted text.
5. **AI Safety & Fallback:** API keys are server-side only; missing API keys return structured HTTP 503 `CONFIG_MISSING`, safely displaying deterministic explanations.

---

## 7. Academic Submission Documents

For detailed evaluation methodology, per-rule metrics, architecture checklists, and verification procedures, refer to:
- [`docs/SUBMISSION_READINESS.md`](docs/SUBMISSION_READINESS.md) &mdash; Consolidated submission readiness & audit report.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) &mdash; Comprehensive architecture specification.
- [`docs/EVALUATION.md`](docs/EVALUATION.md) &mdash; Evaluation dataset provenance, metrics, and methodology.
