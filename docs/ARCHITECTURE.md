# PrivacyLens — System Architecture (Phases 1–4)

## 1. System Overview

PrivacyLens is an intelligent, privacy-preserving policy analysis platform designed to help everyday consumers understand complex legal agreements through transparent clause extraction, evidence-backed findings, risk classifications, and consumer-focused summaries.

Phases 1 through 4 establish:
- **Phase 1:** Decoupled React/Express foundation, Vite proxy, and automated testing baseline.
- **Phase 2:** Design system, responsive UI components, character limits, and diagnostic card.
- **Phase 3:** Server-side input validation, text normalization, paragraph/clause segmentation, and exact source offset tracking.
- **Phase 4:** Deterministic rule-based analysis engine, negation/context handling, 5 privacy categories, verbatim evidence extraction, and live findings reporting.

```
+-------------------------------------------------------------------------------+
|                                  Client Browser                               |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                  PrivacyLens React Application (SPA)                  |   |
|   |         (Vite Dev Server @ http://localhost:5173 - Port 5173)         |   |
|   |                                                                       |   |
|   |  - PolicyAnalyzer: 50k char textarea, real-time counter, validation   |   |
|   |  - ReportPreview: Live metrics, category status badges, citations     |   |
|   |  - API Service: fetch('/api/analyze')                                 |   |
|   +-----------------------------------+-----------------------------------+   |
+---------------------------------------|---------------------------------------+
                                        | Relative HTTP Requests
                                        | (e.g., POST /api/analyze, GET /api/health)
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
|   | 4. Route Dispatcher (/api/health, /api/analyze)                       |   |
|   | 5. 404 Route Not Found Handler                                        |   |
|   | 6. Centralized Error Handler (no stack traces in production)          |   |
|   +-----------------------------------+-----------------------------------+   |
+-------------------------------------------------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+---------------------------------+           +---------------------------------+
|     Phase 3 Ingestion Pipeline  |           |     Phase 4 Analysis Engine     |
|                                 |           |                                 |
| 1. inputValidator.js            |           | 1. contextHandler.js            |
|    - Type checks, 50k limit     |           |    - Negation & conditionals    |
|    - Whitespace rejection       |           | 2. ruleRegistry.js              |
| 2. textNormalizer.js            |           |    - 5 Categories, 25 rules     |
|    - Line endings, spaces,      |---------->|    - Disqualifier patterns      |
|      unicode quotes & dashes    |           | 3. policyEngine.js              |
| 3. textSegmenter.js             |           |    - Verbatim evidence slicing  |
|    - Paragraphs & clauses       |           |    - Offset tracking            |
|    - Abbreviation protection    |           |    - Status: found / unclear /  |
|    - Source offset coordinates  |           |              not_found          |
+---------------------------------+           +---------------------------------+
```

---

## 2. API Specifications

### 2.1 Endpoint: Policy Analysis (`POST /api/analyze`)

- **Path:** `/api/analyze`
- **Method:** `POST`
- **Request Headers:**
  - `Content-Type: application/json`
  - `Accept: application/json`
- **Request Body Schema:**
  ```json
  {
    "policyText": "String (1 to 50,000 characters)"
  }
  ```

#### Response Payload Schema (HTTP 200 OK):
```json
{
  "success": true,
  "engine": {
    "name": "PrivacyLens Rule-Based Policy Analysis Engine",
    "type": "rule-based",
    "version": "1.0.0"
  },
  "metadata": {
    "characterCount": 4210,
    "paragraphCount": 12,
    "segmentCount": 38,
    "analyzedAt": "2026-10-22T09:30:00.000Z"
  },
  "summary": {
    "totalFindings": 14,
    "categoryCounts": {
      "data_collection": 4,
      "data_sharing": 3,
      "cookies_tracking": 2,
      "data_retention": 2,
      "user_rights": 3
    },
    "categoryCounts": {
      "data_collection": 4,
      "data_sharing": 2,
      "cookies_tracking": 2,
      "data_retention": 1,
      "user_rights": 3
    },
    "overallStatus": {
      "data_collection": "found",
      "data_sharing": "found",
      "cookies_tracking": "found",
      "data_retention": "found",
      "user_rights": "found"
    },
    "categoriesWithFindingsCount": 5,
    "categoriesWithoutFindingsCount": 0,
    "keyObservations": [
      "Affirmative Non-Sale Commitment: The policy explicitly commits not to sell personal data to data brokers or third parties.",
      "Third-Party Operational Sharing: Personal data is disclosed to outside service providers under confidentiality."
    ]
  },
  "categories": [
    {
      "id": "data_collection",
      "name": "Data Collection",
      "shortName": "Collection",
      "status": "found",
      "findingCount": 4,
      "summary": "Identified 4 verifiable candidate disclosure(s)...",
      "explanation": "Candidate disclosures were identified matching transparent deterministic patterns...",
      "findings": ["finding-1", "finding-2", "finding-3", "finding-4"],
      "limitations": "Disclosures regarding types of personal data..."
    }
  ],
  "findings": [
    {
      "id": "finding-1",
      "category": "data_collection",
      "ruleId": "COLLECT_DIRECT_CONTACT",
      "title": "Direct Contact Information Collection",
      "description": "Discloses collection of personal contact identifiers...",
      "evidence": "Name, email address, phone number, and postal address.",
      "paragraphId": "p-1",
      "segmentId": "s-1-0",
      "startOffset": 154,
      "endOffset": 210,
      "matchStrength": "strong",
      "matchType": "affirmative",
      "limitation": "Identifies standard contact field disclosures...",
      "explanation": {
        "whatItSays": "The policy states that the organization collects personal contact information provided directly by users.",
        "simpleMeaning": "When you sign up, fill out a form, or contact support, the company stores your personal details.",
        "whyItMatters": "Contact details can directly identify you in the real world.",
        "conditionsOrLimitations": "Collection typically occurs when you voluntarily submit the information.",
        "cannotConclude": "This text does not indicate whether additional unlisted fields are collected."
      }
    }
  ],
  "limitations": [
    "Deterministic Rule-Based Engine: Analysis is performed via deterministic pattern matching...",
    "Informational Purpose Only: Findings highlight stated disclosures for user awareness...",
    "Absence is Not Proof: The absence of detected text in any category indicates...",
    "Bounded Scope: Analysis is limited strictly to the text provided within 50,000 characters..."
  ]
}
```

#### Error Responses:
- **HTTP 400 Bad Request:** Missing, non-string, empty, whitespace-only `policyText`, or unexpected body fields.
- **HTTP 413 Payload Too Large:** `policyText.length > 50,000`.
- **HTTP 415 Unsupported Media Type:** Non-JSON `Content-Type`.
- **HTTP 500 Internal Server Error:** Unexpected processing failure (stack traces suppressed in production).

---

### 2.2 Endpoint: Health Check (`GET /api/health`)

- **Path:** `/api/health`
- **Method:** `GET`
- **Response Status:** `200 OK`
- **Payload Schema:**
  ```json
  {
    "success": true,
    "service": "PrivacyLens API",
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-10-22T09:30:00.000Z",
    "uptimeSeconds": 412,
    "environment": "development"
  }
  ```

---

## 3. Five Core Analysis Categories

1. **Data Collection (`data_collection`):** Direct contact identifiers, account credentials, payment/billing cards, hardware/IP telemetry, behavioral clickstreams, location sensors.
2. **Data Sharing & Third Parties (`data_sharing`):** Service providers, hosting processors, legal compliance, corporate transfers, and explicit commitments not to sell personal data (`SHARE_NO_SELL`).
3. **Cookies & Tracking (`cookies_tracking`):** First-party session cookies, tracking pixels, web beacons, telemetry analytics, and browser opt-out controls.
4. **Data Retention (`data_retention`):** Numeric deletion timelines (e.g. 90 days), account termination deletion, vague/indefinite durations, and statutory exceptions.
5. **User Rights & Choices (`user_rights`):** Right of access, rectification, deletion/erasure ("right to be forgotten"), data portability, marketing opt-outs, and statutory contact channels.

---

## 4. Status Model & Core Guarantees

- **`found`:** Substantive affirmative disclosures detected matching rule criteria.
- **`unclear`:** Terms detected, but phrasing is conditional, vague, or indefinite.
- **`not_found`:** No matching pattern identified in submitted text. **Guaranteed principle:** Absence of detected text is never communicated as proof that an activity does not occur.

### 2.3 Endpoints: MongoDB Persistence & Saved Analyses (`/api/saved-analyses`)

The MongoDB persistence layer provides optional analysis report history with strict client-side privacy controls.

- **`GET /api/saved-analyses/status`**
  - **Description:** Returns database connection status and configured database name without leaking credentials.
  - **Response (200):** `{ success: true, data: { connected: boolean, configured: boolean, databaseName: string } }`

- **`POST /api/saved-analyses`**
  - **Description:** Saves an analysis report after explicit user consent.
  - **Required Header:** `X-Client-Token: <UUIDv4>` (client token stored in browser `localStorage`).
  - **Required Body:**
    ```json
    {
      "consentGiven": true,
      "title": "Acme SaaS Privacy Policy",
      "policyLength": 4500,
      "summary": { "totalRules": 28, "foundCount": 20, "unclearCount": 8, "notDetectedCount": 0, "categorySummary": {} },
      "findings": [ ... ]
    }
    ```
  - **Response (201):** `{ success: true, data: { id: string, title: string, createdAt: string, summary: object, findingsCount: number } }`

- **`GET /api/saved-analyses`**
  - **Description:** Lists saved analyses belonging exclusively to the requesting client token.
  - **Required Header:** `X-Client-Token: <UUIDv4>`.
  - **Response (200):** `{ success: true, data: [ { id, title, createdAt, summary, policyLength } ] }`

- **`GET /api/saved-analyses/:id`**
  - **Description:** Retrieves full saved analysis report if owned by caller's token.
  - **Response (200):** `{ success: true, data: { id, title, createdAt, summary, findings, policyLength } }`

- **`DELETE /api/saved-analyses/:id`**
  - **Description:** Permanently deletes saved analysis report from MongoDB.
  - **Response (200):** `{ success: true, message: "Saved analysis permanently deleted from database." }`

### 2.4 MongoDB Document Schema & Privacy Architecture

```javascript
{
  _id: ObjectId("..."),
  clientTokenHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // SHA-256
  title: "Acme SaaS Privacy Policy",
  createdAt: ISODate("2026-10-29T..."),
  updatedAt: ISODate("2026-10-29T..."),
  consentGiven: true,
  consentTimestamp: ISODate("2026-10-29T..."),
  policyLength: 4500,
  summary: {
    totalRules: 28,
    foundCount: 20,
    unclearCount: 8,
    notDetectedCount: 0,
    categorySummary: { ... }
  },
  findings: [
    {
      ruleId: "COLLECT_DIRECT_CONTACT",
      ruleName: "Direct Contact Information Collection",
      category: "Data Collection",
      status: "found",
      confidence: "HIGH",
      explanation: "...",
      evidence: "...",
      evidenceOffset: { start: 10, end: 45 }
    }
  ]
}
```

**Privacy Guarantees:**
1. **Zero Raw Policy Persistence:** The full raw policy text (up to 50k chars) is never stored in the database.
2. **Cryptographic Token Scoping:** Saved records are indexed by SHA-256 hashes of anonymous browser client tokens (`X-Client-Token`). No global enumeration or public directory endpoint exists.
3. **Explicit Consent Gate:** A record is never inserted without `consentGiven: true`.
4. **Graceful Offline Degradation:** If MongoDB is offline or unconfigured, real-time transient analysis remains 100% active. Only history saving is temporarily paused (HTTP 503 `DATABASE_UNAVAILABLE`).

---

## 5. Architectural Roadmap & Milestone Status

| Phase / Milestone | Module | Target Directory | Status | Description |
|---|---|---|---|---|
| Phase 1 | Foundation & Development Proxy | `backend/`, `frontend/` | **COMPLETE** | Client-server architecture, dev proxy, automated tests |
| Phase 2 | Design System & UI Components | `frontend/src/components/` | **COMPLETE** | Accessible dark UI, character counter, sample loader |
| Phase 3 | Ingestion & Segmentation | `backend/src/services/policy/` | **COMPLETE** | 50k limit, normalization, paragraph/clause segmentation |
| Phase 4 | Deterministic Analysis Engine | `backend/src/services/analyzer/` | **COMPLETE** | 5 categories, 28 rules, context handling, exact citations |
| Phase 5 | Simple-Language Explanations & Report | `backend/src/services/analyzer/` | **COMPLETE** | 28 deterministic explanations, progressive disclosure, print layout |
| Phase 6 | AI Integration & Privacy Chatbot | `backend/src/services/ai/` | **COMPLETE** | Grounded conversational assistant with evidence citation validation |
| Evaluation Harness | Accuracy Evaluation Engine | `backend/src/evaluation/` | **COMPLETE** | 64-item corpus, split evaluator, 96.88% accuracy, 0 leakage |
| Doughnut Distribution Chart | Denominator Conservation Engine | `frontend/src/components/` | **COMPLETE** | Strictly conserves denominator = 28 across all states |
| Cookie Center & Simulator | Cookie Assistant & Simulator | `frontend/src/components/` | **COMPLETE** | 5 cookie checks, glossary, locked essential category, exposure chart |
| Policy Version Comparison | Text Diff & Change Inspector | `frontend/src/components/` | **COMPLETE** | Two-text diff, word additions/deletions, neutral non-legal context |
| Database Persistence (MongoDB) | Saved Analyses & History Engine | `backend/src/services/db/` | **COMPLETE** | Official MongoDB driver, explicit consent, scoped to hashed token, 0 public exposure |
| Authentication & Accounts | Zero-Account Client Architecture | N/A | **INTENTIONALLY EXCLUDED** | Excluded in favor of privacy-preserving anonymous client tokens |

