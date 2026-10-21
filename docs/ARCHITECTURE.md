# PrivacyLens — System Architecture (Phase 1)

## 1. System Overview

PrivacyLens is an intelligent privacy policy analysis platform designed to help everyday consumers understand complex legal agreements through plain-language explanations, evidence-backed findings, risk classifications, and conversational Q&A.

Phase 1 establishes the baseline architecture, decoupled client-server structure, development proxy, and automated testing baseline. Future capabilities such as database persistence (MongoDB) and artificial intelligence services will be layered onto this foundation in subsequent phases.

```
+-------------------------------------------------------------------------------+
|                                  Client Browser                               |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                  PrivacyLens React Application (SPA)                  |   |
|   |         (Vite Dev Server @ http://localhost:5173 - Port 5173)         |   |
|   +-----------------------------------+-----------------------------------+   |
+---------------------------------------|---------------------------------------+
                                        | Relative HTTP Requests
                                        | (e.g., fetch('/api/health'))
                                        v
+-------------------------------------------------------------------------------+
|                            Vite Development Proxy                             |
|              Routes matching '/api/*' forwarded to backend target             |
|              http://localhost:5000 (configurable via VITE_API_TARGET)         |
+---------------------------------------+---------------------------------------+
                                        | Forwarded HTTP Request
                                        v
+-------------------------------------------------------------------------------+
|                              Express API Server                               |
|                 (Node.js Runtime @ http://localhost:5000)                     |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   | 1. CORS Middleware (restricted to clientOrigin)                      |   |
|   | 2. JSON Body Parser (1 MB limit)                                      |   |
|   | 3. URL-Encoded Body Parser (1 MB limit)                               |   |
|   | 4. Route Dispatcher (/api -> /api/health)                             |   |
|   | 5. 404 Route Not Found Handler                                        |   |
|   | 6. Centralized Error Handler (no stack traces in production)          |   |
|   +-----------------------------------+-----------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 2. Component Responsibilities

### 2.1 Frontend (`frontend/`)

- **Role:** Single Page Application (SPA) delivering user interfaces and coordinating client-side state.
- **Technology:** React 18 with Vite build tooling, written in standard JavaScript (ES Modules) with JSX.
- **Styling:** Plain Vanilla CSS for Phase 1; design tokens and structured UI components are scheduled for Phase 2.
- **Communication:** Relative path HTTP JSON queries routed through the Vite proxy.
- **Current Scope:**
  - Displays application branding, phase status, and architecture summary.
  - Executes real-time health connectivity checks against the backend.
  - Displays backend response data or diagnostics cleanly in the UI.

### 2.2 Backend (`backend/`)

- **Role:** RESTful HTTP API service.
- **Technology:** Node.js runtime with Express 4 framework, structured with ES Modules (`type: "module"`).
- **Separation of Concerns:**
  - `src/app.js`: Configures middleware (CORS, body parsers), registers route handlers, defines 404 catch-alls, and hooks the centralized error handler. Exports the configured Express application instance.
  - `src/server.js`: Imports `app.js` and `src/config/index.js`, binds to the designated network interface and port, and handles lifecycle events (startup errors, SIGINT/SIGTERM graceful shutdown).
- **Current Scope:**
  - `GET /api/health`: Provides uptime, system status, API version, and timestamp.
  - Rejection and 404 handling for invalid or unrecognized routes.
  - Safe error formatting without leaking server internals or stack traces in production.

---

## 3. Current API Specification

### Endpoint: Health Check
- **Path:** `/api/health`
- **Method:** `GET`
- **Request Headers:**
  - `Accept: application/json`
- **Response Status:** `200 OK`
- **Response Headers:**
  - `Content-Type: application/json; charset=utf-8`
- **Response Payload Schema:**
  ```json
  {
    "success": true,
    "service": "PrivacyLens API",
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-10-21T15:00:00.000Z",
    "uptimeSeconds": 14,
    "environment": "development"
  }
  ```

### Catch-All: Route Not Found
- **Path:** Unmatched `/api/*` or `/*`
- **Method:** `ANY`
- **Response Status:** `404 Not Found`
- **Response Payload Schema:**
  ```json
  {
    "success": false,
    "error": {
      "message": "Route not found: GET /api/unmatched-endpoint",
      "statusCode": 404
    }
  }
  ```

---

## 4. Request and Data Flow

1. The browser loads the React application from Vite dev server at `http://localhost:5173`.
2. The React client issues `fetch('/api/health')` using a relative path.
3. The Vite development server inspects the request path:
   - Matches `/api`.
   - Proxies the request internally to `http://localhost:5000/api/health`.
4. The Express server processes the request:
   - CORS validation verifies the request origin.
   - Body parsers process any payload within strict limits.
   - `healthRoutes` dispatches the request to `healthController.getHealth`.
   - The controller generates the structured JSON payload.
5. The response travels back through the Vite proxy to the browser.
6. The React component renders the real response metadata directly on screen.

---

## 5. Architectural Roadmap & Future Modules

| Phase | Module | Target Directory | Description |
|---|---|---|---|
| Phase 2 | Design System & UI Components | `frontend/src/components/` | Custom accessible UI components, theme variables, layout templates |
| Phase 3 | Policy Ingestion & Parser | `frontend/src/pages/`, `backend/src/services/policy/` | Raw text pasting, PDF/URL ingestion, sanitation |
| Phase 4 | Rule-based Clause Extractor | `backend/src/services/extractor/` | Deterministic pattern matching and clause categorization |
| Phase 5 | AI Summary & Explanation Engine | `backend/src/services/ai/` | LLM client for simplified clause explanations and risk assessments |
| Phase 6 | Database Persistence | `backend/src/models/`, `backend/src/config/db.js` | MongoDB connection with Mongoose ODM schemas |
| Phase 7 | Authentication & User Management | `backend/src/controllers/authController.js` | Session/JWT authentication and saved policy report history |
| Phase 8 | Interactive Policy Chatbot | `frontend/src/components/chat/`, `backend/src/routes/chatRoutes.js` | RAG-based context-aware Q&A on ingested policy text |
| Phase 9 | Comparative Scoring & Benchmarking | `backend/src/services/scoring/` | Privacy risk scoring metrics and side-by-side policy comparisons |
| Phase 10 | Security Hardening & Production Deploy | Root / DevOps | Rate limiting, Helm/Docker or cloud deployment recipes |

> [!NOTE]
> In accordance with Phase 1 constraints, database connections, AI providers, and authentication modules have **not** been implemented and are strictly reserved for their respective phases.
