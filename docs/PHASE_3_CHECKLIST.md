# PrivacyLens — Phase 3 Requirements & Verification Checklist
## Milestone: Policy Text Ingestion, Normalization, Segmentation, and Offset Mapping

This document tracks all Phase 3 requirements, their technical implementation, and recorded verification evidence.

**Status Legend:**
- **PASS**: Verified successfully with automated tests and documented evidence.
- **FAIL**: Attempted but unsuccessful.
- **BLOCKED**: Blocked by external dependencies or environment constraints.
- **DEFERRED**: Scheduled for future milestones.

---

## 1. Request Contract & Ingestion Endpoint

| ID | Requirement | Status | Verification & Evidence |
|---|---|---|---|
| ING-01 | Dedicated analysis route (`POST /api/analyze`) | PASS | Implemented in `backend/src/routes/analysisRoutes.js` and mounted at `/api/analyze` in `backend/src/routes/index.js`. |
| ING-02 | JSON Content-Type contract enforcement | PASS | Verified in `api_analyze.test.js`: rejects non-JSON content types with HTTP 415. |
| ING-03 | Request payload bounds checking | PASS | `inputValidator.js` validates that body is an object and `policyText` is a non-empty string. |
| ING-04 | Maximum length limit enforcement (50,000 characters) | PASS | Verified in `phase3_ingestion.test.js` and `api_analyze.test.js`: exactly 50,000 code units passes; 50,001 returns HTTP 413. |
| ING-05 | Whitespace-only rejection | PASS | Rejects empty strings and whitespace-only submissions with HTTP 400. |
| ING-06 | Unexpected extra fields rejection | PASS | Prevents payload injection by rejecting unexpected body keys with HTTP 400. |
| ING-07 | Safe error responses | PASS | Error handler suppresses internal server details and stack traces in production responses. |

---

## 2. Text Normalization

| ID | Requirement | Status | Verification & Evidence |
|---|---|---|---|
| NORM-01 | Line ending standardization | PASS | `textNormalizer.js` standardizes CRLF (`\r\n`) and CR (`\r`) to LF (`\n`). Tested in `phase3_ingestion.test.js`. |
| NORM-02 | Non-breaking spaces and tabs | PASS | Replaces `\u00A0` and `\t` with standard space while collapsing extraneous horizontal whitespace. |
| NORM-03 | Smart quotes and unicode punctuation | PASS | Normalizes smart single/double quotes and unicode dashes (`–`, `—`) to standard ASCII equivalents. |
| NORM-04 | Unicode bullet glyphs | PASS | Standardizes bullet markers (`•`, `◦`, `▪`, etc.) into standard list markers. |
| NORM-05 | Meaning preservation & original text protection | PASS | Does not lowercase in place or mutate `originalText`. Maintains clean dual representation (`originalText` vs `normalizedText`). |
| NORM-06 | Negation & legal phrase retention | PASS | Retains all negations ("not", "never", "without", "unless", "except") without deletion or distortion. |

---

## 3. Paragraph & Clause Segmentation

| ID | Requirement | Status | Verification & Evidence |
|---|---|---|---|
| SEG-01 | Paragraph segmentation | PASS | `textSegmenter.js` recognizes double line breaks, preserves paragraph order, and assigns deterministic IDs (`p-0`, `p-1`, etc.). |
| SEG-02 | Clause & sentence boundary segmentation | PASS | Uses conservative boundary detection to segment paragraphs into clauses (`s-0-0`, `s-0-1`, etc.). |
| SEG-03 | Abbreviation protection | PASS | Does not split on common legal/business abbreviations (`e.g.`, `i.e.`, `Inc.`, `Co.`, `vs.`, `U.S.`, `etc.`). Tested in `phase3_ingestion.test.js`. |
| SEG-04 | Decimal & URL protection | PASS | Protects decimal numbers (`3.5 years`) and URLs (`https://...`) from spurious sentence splits. |
| SEG-05 | Bullet list item handling | PASS | Segments multi-line bullet points into distinct disclosure clauses. |
| SEG-06 | Verbatim source offset tracking | PASS | Tracks exact `startOffset` and `endOffset` inside `originalText`. Verified `policyText.slice(startOffset, endOffset) === segment.originalText` for all segments. |
| SEG-07 | Stable deterministic identifiers | PASS | Identifiers are derived deterministically from document position (`p-{pIndex}`, `s-{pIndex}-{sIndex}`), ensuring repeatable test runs. |

---

## 4. Phase 3 Test Suite Results

All 23 Phase 3 unit tests in `backend/tests/phase3_ingestion.test.js` pass with 100% success:
- 9 Input validation tests
- 5 Normalization tests
- 6 Segmentation and source offset tests
- Additional integration tests in `api_analyze.test.js`
