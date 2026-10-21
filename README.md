# PrivacyLens

> Plain-language explanations, evidence-backed findings, and AI-powered insights for complicated privacy policies.

PrivacyLens is a modern web application designed to empower everyday consumers by translating convoluted terms of service and privacy policies into clear, verifiable explanations.

---

## 1. Project Phase & Status

- **Current Stage:** **Phase 1 of 10 — Project Setup & Architecture**
- **Status:** **Completed & Verified**
- **Phase 1 Goal:** Establish a robust, secure, decoupled frontend/backend foundation with Vite proxy integration, structured API routes, error handling, automated tests, and comprehensive documentation.

> [!NOTE]
> **Database & AI Notice:** MongoDB database integration and external AI model providers are intentionally deferred to Phase 5 and Phase 6. No database server or AI API credentials are required to run this phase.

---

## 2. Technology Stack

- **Frontend:**
  - React 18
  - Vite 6
  - Language: JavaScript (JSX) &mdash; *TypeScript is intentionally not used*
  - Styling: Vanilla CSS
- **Backend:**
  - Node.js (v20+ or v24+)
  - Express 4
  - Module System: ES Modules (`"type": "module"`)
  - Testing: Node.js built-in test runner (`node:test`) + `supertest`
- **Orchestration:**
  - `concurrently` (runs frontend and backend concurrently via root npm scripts)
- **Version Control:**
  - Git

---

## 3. Directory Layout

```
PrivacyLens/
  ├── frontend/
  │   ├── public/             # Static public assets
  │   ├── src/
  │   │   ├── components/     # Reusable UI components (Phase 2+)
  │   │   ├── pages/          # Application views/screens (Phase 2+)
  │   │   ├── services/       # API integration client (api.js)
  │   │   ├── hooks/          # Custom React hooks (Phase 2+)
  │   │   ├── utils/          # Client utilities (Phase 2+)
  │   │   ├── App.jsx         # Starter smoke-test component
  │   │   ├── index.css       # Starter page styling
  │   │   └── main.jsx        # React application entry point
  │   ├── .env.example        # Frontend environment template
  │   ├── .gitignore          # Frontend ignore rules
  │   ├── index.html          # HTML template
  │   ├── package.json        # Frontend dependencies & scripts
  │   └── vite.config.js      # Vite config with dev proxy
  │
  ├── backend/
  │   ├── src/
  │   │   ├── config/         # Environment configuration (index.js)
  │   │   ├── controllers/    # Request controllers (healthController.js)
  │   │   ├── middleware/     # Error & 404 middleware
  │   │   ├── routes/         # Express route handlers
  │   │   ├── services/       # Business logic (Phase 3+)
  │   │   ├── utils/          # Backend utilities (Phase 3+)
  │   │   ├── app.js          # Express app configuration & middleware
  │   │   └── server.js       # HTTP listener & process lifecycle
  │   ├── tests/              # Backend test suite (health.test.js)
  │   ├── .env.example        # Backend environment template
  │   ├── .gitignore          # Backend ignore rules
  │   └── package.json        # Backend dependencies & scripts
  │
  ├── docs/
  │   ├── ARCHITECTURE.md     # System architecture specification
  │   └── PHASE_1_CHECKLIST.md# Requirement verification checklist
  │
  ├── .gitignore              # Root gitignore
  ├── package.json            # Root scripts & dev orchestrator
  └── README.md               # Main project documentation
```

---

## 4. Prerequisites

Before running PrivacyLens, ensure the following are installed on your machine:

- **Node.js**: `v20.0.0` or newer (`v24.21.0` verified).
- **npm**: `v10.0.0` or newer (`v11.19.0` verified).
- **Git**: Installed for version control (`v2.55.0` verified).

---

## 5. Installation Instructions

1. Clone or navigate to the project directory:
   ```bash
   cd c:\Users\ahzam\Desktop\PrivacyLens
   ```

2. Install all root, backend, and frontend dependencies in one command:
   ```bash
   npm run install:all
   ```

   *Alternatively, install each subproject manually:*
   ```bash
   npm install
   npm --prefix backend install
   npm --prefix frontend install
   ```

3. Configure environment files:
   - For backend: copy `backend/.env.example` to `backend/.env` (defaults are pre-configured for local development).
   - For frontend: copy `frontend/.env.example` to `frontend/.env` (defaults are pre-configured for local development).

---

## 6. Development & Execution Commands

All primary workflows can be executed directly from the project root:

| Command | Action |
|---|---|
| `npm run dev` | **Start both development servers** (Express backend on `5000` + Vite frontend on `5173`) |
| `npm run dev:frontend` | Start **only** the Vite frontend development server |
| `npm run dev:backend` | Start **only** the Express backend API server |
| `npm run test` | Run the automated backend test suite (`node:test` + `supertest`) |
| `npm run build` | Build the frontend for production into `frontend/dist/` |

---

## 7. Local Development URLs & Ports

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)
- **Direct Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Proxied Health Check Endpoint:** [http://localhost:5173/api/health](http://localhost:5173/api/health)

---

## 8. Frontend-Backend Communication & Development Proxy

During local development, the browser talks to the Express API via **Vite's built-in development proxy**:

1. In the frontend code (`frontend/src/services/api.js`), requests use relative paths:
   ```javascript
   fetch('/api/health')
   ```
2. Vite's development server (`frontend/vite.config.js`) intercepts any path starting with `/api` and forwards it to the backend running at `http://localhost:5000`.
3. This eliminates browser CORS complications and avoids hardcoded backend hostnames in frontend client code.

---

## 9. Environment Variable Reference

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `5000` | Port for the Express HTTP server |
| `HOST` | No | `localhost` | Network interface to bind to |
| `NODE_ENV` | No | `development` | Runtime mode (`development` or `production`) |
| `CLIENT_ORIGIN` | No | `http://localhost:5173`| Allowed origin for CORS headers |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `VITE_PORT` | No | `5173` | Local Vite dev server port |
| `VITE_API_TARGET` | No | `http://localhost:5000` | Backend target URL for the `/api` proxy |

> [!CAUTION]
> Never place database credentials, API secrets, or private tokens in `frontend/.env` or any file starting with `VITE_`. Vite embeds public environment variables into client-side JavaScript bundles.

---

## 10. Troubleshooting & Common Questions

### Issue: Port 5000 or 5173 is already in use
- **Cause:** Another process is holding port 5000 (Express) or 5173 (Vite).
- **Resolution:**
  - On Windows: check listening ports with `netstat -ano | findstr :5000` and stop the conflicting process, or change `PORT=5001` in `backend/.env` and `VITE_API_TARGET=http://localhost:5001` in `frontend/.env`.

### Issue: Frontend displays "Connection Failed"
- **Cause:** The backend server is not running or is listening on a different port than the proxy target.
- **Resolution:** Start the backend with `npm run dev:backend` or run both together with `npm run dev`. Verify that [http://localhost:5000/api/health](http://localhost:5000/api/health) responds.

---

## 11. Testing and Verification Evidence

- **Automated Test Results:**
  ```text
  ▶ PrivacyLens Backend API Test Suite
    ✔ should return HTTP 200 with service health metadata (51.7ms)
    ✔ should return HTTP 404 with consistent JSON structure for unknown routes (9.8ms)
    ✔ should include CORS headers for allowed client origin (6.3ms)
  ✔ PrivacyLens Backend API Test Suite (71.1ms)
  ℹ tests 3, pass 3, fail 0
  ```
- **Vite Build Verification:**
  ```text
  ✓ 28 modules transformed.
  dist/index.html                   0.58 kB │ gzip:  0.37 kB
  dist/assets/index-BQs3SxOy.css    3.12 kB │ gzip:  1.16 kB
  dist/assets/index-Df0qfs-0.js   148.95 kB │ gzip: 47.88 kB
  ✓ built in 948ms
  ```
