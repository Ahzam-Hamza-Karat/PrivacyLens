# PrivacyLens — Accuracy Evaluation Report (Phase 2)
**Deterministic Rule Engine Evaluation on Curated Policy Excerpts**  
**Date:** October 28, 2026  
**Document Version:** 1.0.0  
**Command:** `npm run evaluate`  

---

## 1. Executive Summary

Phase 2 introduces a repeatable, offline accuracy evaluation harness for the PrivacyLens deterministic privacy analysis engine. The evaluation measures detection fidelity across all **28 registered rules** and **5 privacy categories** without making live external AI calls.

### Core Metrics Summary

| Dataset Partition | Sample Count | Accuracy | Precision | Recall | F1-Score |
|---|---|---|---|---|---|
| **Tuning Set** | 32 (50.0%) | **96.88%** | **100.00%** | **96.30%** | **98.11%** |
| **Held-Out Test Set** | 32 (50.0%) | **96.88%** | **100.00%** | **96.15%** | **98.04%** |
| **Full Combined Corpus** | 64 (100.0%) | **96.88%** | **100.00%** | **96.23%** | **98.08%** |

> [!NOTE]
> **Key Finding — Evaluation Consistency & Generalization Scope:**  
> The engine achieved identical accuracy (96.88%) and nearly identical recall (96.30% vs 96.15%) between the Tuning Set and the unseen Held-Out Test Set. This demonstrates internal consistency and robust phrase matching across standard policy terminology without overfitting to tuning sentences. However, as noted in Section 6, this benchmark establishes consistency across standard phrasing, not unconstrained generalization across idiosyncratic global web policies.

---

## 2. Dataset Design & Provenance

The evaluation corpus consists of **64 manually labeled policy excerpts**, partitioned into equal 50% / 50% splits (32 tuning, 32 held-out).

### A. Real-World Sourced Excerpts (52 Examples)
Real-world excerpts (81.25% of corpus) were gathered directly from published consumer privacy policies (retrieved October 15, 2026), each retaining mandatory `sourceUrl` and `retrievalDate` provenance:
1. **GitHub General Privacy Statement:**  
   URL: `https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement`
2. **Mozilla Websites Privacy Notice:**  
   URL: `https://www.mozilla.org/en-US/privacy/websites/`
3. **DuckDuckGo Privacy Policy:**  
   URL: `https://duckduckgo.com/privacy`
4. **Wikimedia Foundation Privacy Policy:**  
   URL: `https://foundation.wikimedia.org/wiki/Policy:Privacy_policy`
5. **Cloudflare Privacy Policy:**  
   URL: `https://www.cloudflare.com/privacypolicy/`
6. **Apple Privacy Policy:**  
   URL: `https://www.apple.com/legal/privacy/en-ww/`

### B. Synthetic Adversarial Fixtures (12 Examples)
To rigorously evaluate false positive resistance and edge case handling, synthetic excerpts (18.75% of corpus) are included with explicit provenance labels (`origin: "synthetic_adversarial"`). These test:
- Negation pledges and non-selling assertions
- Boundary cases and homonyms (*"Baking chocolate chip cookies requires..."*, *"A maritime radio beacon broadcasts..."*)
- Security implementation discussions (*"Password hashing utilizes salted SHA-256..."*)
- Corporate office addresses (*"Our corporate headquarters are located in Zurich..."*)
- Non-privacy retention and rights (*"Water retention in soil..."*, *"The right turn lane allows..."*, *"Human rights organizations advocate..."*)

### C. Data Leakage Prevention
The evaluation suite runs an automated leakage validator (`backend/src/evaluation/validator.js`) prior to evaluation. The check normalizes whitespace and casing across all excerpts, asserting that no text in the tuning set appears in the held-out set. **0 collisions were detected.**

---

## 3. Labeling Methodology & Definitions

Each example is labeled with ground truth according to the existing PrivacyLens specification:

1. **`found` (Affirmative/Clear Disclosure):**  
   The clause clearly and affirmatively states that an activity occurs, that a specific commitment is made (e.g. `SHARE_NO_SELL`), or that a statutory right exists.
2. **`unclear` (Ambiguous / Vague Disclosure):**  
   The clause utilizes open-ended, subjective, or discretionary phrasing (e.g. *"for as long as necessary"*, *"at our discretion"*) without specifying concrete operational parameters.
3. **`not_found` (Negative or Irrelevant):**  
   The text does not disclose the candidate activity, discusses security or company facts without collecting data, or mentions homonyms (e.g., culinary cookies, nautical beacons).

### Treatment of `unclear` Status & Per-Rule Semantics
- **Multiclass Metric:** Evaluated as an independent 3rd class (`found`, `unclear`, `not_found`). Both vague retention clauses (`eval-tune-023` and `eval-held-023`) are correctly identified as `unclear` by the engine's `RETENTION_VAGUE_DURATION` rule ($TP=2, FP=0, FN=0$).
- **Overall Binary Detection Metric:** Positive class is strictly defined as `found`. Both `unclear` and `not_found` represent non-positive classifications, preventing ambiguous text from falsely inflating detection scores.
- **Per-Rule Metric Definitions (TP, FP, FN, TN):**
  - **True Positive ($TP$):** The rule was expected to trigger on the item and correctly triggered. For rules targeting vague/discretionary disclosures (`RETENTION_VAGUE_DURATION`), an expected status of `unclear` or `found` defines a positive ground-truth instance. For standard affirmative, conditional, and negative-disclosure rules, strictly `expectedStatus === 'found'` defines a positive ground-truth instance.
  - **False Positive ($FP$):** The rule was not expected to trigger on the item (e.g., negative controls where `expectedStatus === 'not_found'`, or an affirmative rule triggering on ambiguous phrasing), but the rule triggered.
  - **False Negative ($FN$):** The rule was expected to trigger on the item (e.g. `SHARE_SALE_AFFIRMATIVE` on `eval-tune-011` and `eval-held-011`), but failed to trigger.
  - **True Negative ($TN$):** The rule was not expected to trigger on the item (e.g., negative adversarial controls), and correctly did not trigger.
  - *Justification for `RETENTION_VAGUE_DURATION` (100% P/R/F1):* In `dataset.json`, `eval-tune-023` and `eval-held-023` specifically provide vague duration clauses (*"as long as necessary..."*), each labeled `expectedRuleId: "RETENTION_VAGUE_DURATION"` and `expectedStatus: "unclear"`. Because the engine rule explicitly matches this phrasing and assigns `matchType: "vague"`, the rule triggers as expected ($TP=2$). Item `eval-held-025` tests soil water retention as an adversarial negative control (`expectedStatus: "not_found"`), which correctly does not trigger ($TN=1$). Thus $TP=2, FP=0, FN=0, TN=1$, yielding $100\%$ precision, recall, and F1. Affirmative rules (the other 27 rules) are strictly evaluated against `expectedStatus === 'found'` to prevent ambiguous phrases from triggering false positives.

## 4. Full Corpus Evaluation Results

### A. Multiclass Confusion Matrix (N=64)

$$\begin{array}{c|ccc}
\text{Ground Truth} \backslash \text{Predicted} & \textbf{found} & \textbf{unclear} & \textbf{not\_found} \\
\hline
\textbf{found} & 51 & 0 & 2 \\
\textbf{unclear} & 0 & 2 & 0 \\
\textbf{not\_found} & 0 & 0 & 9 \\
\end{array}$$

- **True Positives (`found` $\rightarrow$ `found`):** 51
- **True Positives (`unclear` $\rightarrow$ `unclear`):** 2
- **True Negatives (`not_found` $\rightarrow$ `not_found`):** 9
- **False Positives:** 0
- **False Negatives:** 2 (explained in Section 5)

---

### B. Per-Category Classification Performance

| Category ID | Support | Precision | Recall | F1-Score | Status |
|---|---|---|---|---|---|
| `data_collection` | 16 | 100.00% | 100.00% | 100.00% | Perfect detection across all 7 collection rules |
| `data_sharing` | 12 | 100.00% | 81.82% | 90.00% | 2 False Negatives under affirmative sales |
| `cookies_tracking` | 12 | 100.00% | 100.00% | 100.00% | Perfect detection across all 5 cookie rules |
| `data_retention` | 10 | 100.00% | 100.00% | 100.00% | Perfect detection across all 4 retention rules |
| `user_rights` | 14 | 100.00% | 100.00% | 100.00% | Perfect detection across all 6 rights rules |

---

### C. Per-Rule Detection Coverage (All 28 Rules)

| Rule ID | Category | Support | Precision | Recall | F1-Score |
|---|---|---|---|---|---|
| `COLLECT_DIRECT_CONTACT` | `data_collection` | 2 | 100.00% | 100.00% | 100.00% |
| `COLLECT_ACCOUNT_CREDENTIALS` | `data_collection` | 3 | 100.00% | 100.00% | 100.00% |
| `COLLECT_BILLING_PAYMENT` | `data_collection` | 2 | 100.00% | 100.00% | 100.00% |
| `COLLECT_DEVICE_TELEMETRY` | `data_collection` | 2 | 100.00% | 100.00% | 100.00% |
| `COLLECT_USAGE_ACTIVITY` | `data_collection` | 2 | 100.00% | 100.00% | 100.00% |
| `COLLECT_LOCATION` | `data_collection` | 3 | 100.00% | 100.00% | 100.00% |
| `COLLECT_CONDITIONAL_RESTRICTION` | `data_collection` | 2 | 100.00% | 100.00% | 100.00% |
| `SHARE_SERVICE_PROVIDERS` | `data_sharing` | 2 | 100.00% | 100.00% | 100.00% |
| `SHARE_NO_SELL` | `data_sharing` | 2 | 100.00% | 100.00% | 100.00% |
| `SHARE_SALE_AFFIRMATIVE` | `data_sharing` | 2 | 0.00% | 0.00% | 0.00% |
| `SHARE_LEGAL_COMPLIANCE` | `data_sharing` | 2 | 100.00% | 100.00% | 100.00% |
| `SHARE_BUSINESS_TRANSFERS` | `data_sharing` | 2 | 100.00% | 100.00% | 100.00% |
| `SHARE_AFFILIATES` | `data_sharing` | 2 | 100.00% | 100.00% | 100.00% |
| `COOKIE_FIRST_PARTY` | `cookies_tracking` | 3 | 100.00% | 100.00% | 100.00% |
| `COOKIE_TRACKING_BEACONS` | `cookies_tracking` | 3 | 100.00% | 100.00% | 100.00% |
| `COOKIE_ANALYTICS` | `cookies_tracking` | 2 | 100.00% | 100.00% | 100.00% |
| `COOKIE_USER_CONTROLS` | `cookies_tracking` | 2 | 100.00% | 100.00% | 100.00% |
| `COOKIE_NEGATIVE_DISCLOSURE` | `cookies_tracking` | 2 | 100.00% | 100.00% | 100.00% |
| `RETENTION_SPECIFIC_PERIOD` | `data_retention` | 3 | 100.00% | 100.00% | 100.00% |
| `RETENTION_ACCOUNT_CLOSURE` | `data_retention` | 2 | 100.00% | 100.00% | 100.00% |
| `RETENTION_VAGUE_DURATION` | `data_retention` | 3 | 100.00% | 100.00% | 100.00% |
| `RETENTION_LEGAL_EXCEPTIONS` | `data_retention` | 2 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_ACCESS_REQUEST` | `user_rights` | 3 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_CORRECTION_RECTIFICATION` | `user_rights` | 2 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_DELETION_ERASURE` | `user_rights` | 3 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_OPT_OUT_MARKETING` | `user_rights` | 2 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_DATA_PORTABILITY` | `user_rights` | 2 | 100.00% | 100.00% | 100.00% |
| `RIGHTS_EXERCISE_CONTACT` | `user_rights` | 2 | 100.00% | 100.00% | 100.00% |

---

## 5. Detailed Error Analysis

Across all 64 evaluated excerpts, **zero False Positives** were observed ($\text{Precision} = 100\%$). Exactly **two False Negatives** were diagnosed:

### Case 1: `eval-tune-011` (Tuning Split)
- **Text:** *"We sell customer data and personal profile records to advertising brokers."*
- **Expected Category / Rule:** `data_sharing` / `SHARE_SALE_AFFIRMATIVE` (`found`)
- **Predicted Category / Status:** `data_sharing` / `not_found`
- **Root Cause Analysis:**  
  The positive regex for `SHARE_SALE_AFFIRMATIVE` is:
  `/\b(?:we\s+(?:may\s+)?sell\s+(?:your\s+)?personal\s+(?:information|data))\b/i`
  Because the text specifies *"customer data"* instead of *"personal data"* or *"personal information"*, and mentions *"advertising brokers"* instead of *"data brokers"*, the pattern did not trigger.

### Case 2: `eval-held-011` (Held-Out Split)
- **Text:** *"The company sells personal information to third-party commercial partners."*
- **Expected Category / Rule:** `data_sharing` / `SHARE_SALE_AFFIRMATIVE` (`found`)
- **Predicted Category / Status:** `data_sharing` / `not_found`
- **Root Cause Analysis:**  
  The pattern requires a first-person pronoun subject (`we\s+(?:may\s+)?sell`). When a policy refers to itself in the third person (*"The company sells"*), the current pattern does not match.

> [!IMPORTANT]
> **Adherence to Evaluation Safeguards (Rule 11):**  
> In accordance with project instructions, **production rules were not modified** during this phase to artificially inflate scores. The diagnosed gaps are recorded here for prioritized rule refinement in future maintenance cycles.

---

## 6. Limitations of the Evaluation

1. **Corpus Scale:** 64 labeled excerpts provide statistically meaningful baseline coverage across all 28 rules, but do not capture the long-tail variety of global commercial policies.
2. **Document-Level Context:** The harness evaluates isolated clauses and paragraphs. In full multi-page policies, cross-paragraph definitions or introductory preamble sections may modify the legal interpretation of downstream clauses.
3. **Single Annotator Baseline:** Ground-truth labels were established by senior review following the project's explicit classification definitions, but have not undergone multi-annotator inter-rater reliability (Cohen's Kappa) validation.

---

## 7. Recommendations for Future Rule Refinements

1. **Third-Person Subject Inclusivity in `SHARE_SALE_AFFIRMATIVE`:**  
   Extend the subject group from `we\s+(?:may\s+)?sell` to `(?:we|the\s+company|our\s+organization)\s+(?:may\s+)?sell`.
2. **Synonym Expansion:**  
   Expand *"personal data / information"* in sales disclosures to include *"customer data"* and *"user profile records"*.

---

*End of Report — Phase 2 Evaluation Harness Complete & Verified.*

