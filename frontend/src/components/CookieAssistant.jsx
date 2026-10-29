import React, { useState } from 'react';
import {
  COOKIE_GLOSSARY,
  extractCookieDisclosures,
} from '../utils/cookieCatalogue.js';
import { explainFindingWithAi } from '../services/api.js';

/**
 * Cookie Assistant Component (Phase 4A)
 *
 * Explains cookie and tracking disclosures in clear, beginner-friendly language,
 * grounded strictly in actual policy analysis findings and evidence.
 *
 * Invariants & Guarantees:
 * - Distinguishes Found, Unclear, and Not Detected outcomes honestly.
 * - When no match is found, clearly states no disclosure was detected; does NOT claim site has no cookies.
 * - Zero hallucination of cookie names, lifespans, or unmentioned third-party trackers.
 * - Reuses existing /api/ai/explain endpoint with seamless deterministic fallback when AI is unconfigured.
 * - Full accessibility with keyboard controls, semantic headings, and ARIA attributes.
 *
 * @param {{
 *   analysisReport?: object | null,
 *   policyText?: string,
 *   hasAnalyzed?: boolean,
 *   isStale?: boolean
 * }} props
 */
export function CookieAssistant({
  analysisReport = null,
  policyText = '',
  hasAnalyzed = true,
  isStale = false,
}) {
  const [expandedCards, setExpandedCards] = useState({});
  const [activeGlossaryTab, setActiveGlossaryTab] = useState(null);
  const [aiExplanations, setAiExplanations] = useState({});

  const cookieDisclosures = extractCookieDisclosures(analysisReport, hasAnalyzed);

  const toggleCard = (ruleId) => {
    setExpandedCards((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const handleRequestAiExplanation = async (item) => {
    if (!item.finding || !policyText) return;

    setAiExplanations((prev) => ({
      ...prev,
      [item.ruleId]: { loading: true, data: null, error: null },
    }));

    const response = await explainFindingWithAi({
      policyText,
      finding: item.finding,
      deterministicExplanation: item.deterministicExplanation,
    });

    if (response.success && response.data) {
      setAiExplanations((prev) => ({
        ...prev,
        [item.ruleId]: { loading: false, data: response.data, error: null },
      }));
    } else {
      // Graceful fallback: record error message while deterministic explanation remains visible
      setAiExplanations((prev) => ({
        ...prev,
        [item.ruleId]: {
          loading: false,
          data: null,
          error:
            response.code === 'CONFIG_MISSING' || response.code === 'AI_CONFIG_MISSING'
              ? 'AI supplementary provider is unconfigured. Showing verified deterministic explanation below.'
              : response.error || 'Failed to fetch AI explanation. Showing verified deterministic explanation below.',
        },
      }));
    }
  };

  return (
    <div className="cookie-assistant-container" role="region" aria-label="Cookie & Tracking Assistant">
      {/* Intro Header */}
      <div className="cookie-assistant-intro">
        <h4 className="cookie-assistant-title">Cookie &amp; Tracking Disclosures Assistant</h4>
        <p className="cookie-assistant-subtitle">
          Plain-language interpretations of cookie disclosures found in your policy, backed by verbatim citations and transparent pattern detection.
        </p>
      </div>

      {/* Disclosures Cards Grid */}
      <div className="cookie-disclosures-grid">
        {cookieDisclosures.map((item) => {
          const isExpanded = Boolean(expandedCards[item.ruleId]);
          const aiState = aiExplanations[item.ruleId];
          const isFound = item.status === 'found';
          const isUnclear = item.status === 'unclear';
          const isNotDetected = item.status === 'not_found';
          const isPending = item.status === 'pending';

          let statusBadgeClass = 'badge-pending';
          if (isFound) statusBadgeClass = 'badge-found';
          if (isUnclear) statusBadgeClass = 'badge-unclear';
          if (isNotDetected) statusBadgeClass = 'badge-not-detected';

          return (
            <article
              key={item.ruleId}
              className={`cookie-disclosure-card status-${item.status}`}
              aria-labelledby={`cookie-card-title-${item.ruleId}`}
            >
              {/* Card Header */}
              <div className="cookie-card-header">
                <div className="cookie-card-title-group">
                  <span className="cookie-rule-code">{item.ruleId}</span>
                  <h5 id={`cookie-card-title-${item.ruleId}`} className="cookie-card-title">
                    {item.shortName}
                  </h5>
                </div>
                <span className={`status-badge ${statusBadgeClass}`}>
                  <span className="badge-dot" aria-hidden="true" />
                  {item.statusLabel}
                </span>
              </div>

              {/* User Friendly Question */}
              <div className="cookie-user-question">
                <span className="question-icon" aria-hidden="true">?</span>
                <span className="question-text">{item.userQuestion}</span>
              </div>

              {/* Outcome Content */}
              {isFound && (
                <div className="cookie-outcome-body">
                  <p className="cookie-meaning-text">
                    <strong>What was detected:</strong> {item.description}
                  </p>

                  {/* Verifiable Verbatim Citation */}
                  {item.evidence && (
                    <div className="cookie-evidence-box">
                      <div className="cookie-evidence-header">
                        <span className="evidence-tag">Verbatim Policy Citation</span>
                        {item.startOffset !== null && item.endOffset !== null && (
                          <span className="offset-tag">
                            Characters {item.startOffset}&ndash;{item.endOffset}
                          </span>
                        )}
                      </div>
                      <blockquote className="cookie-evidence-quote">
                        &ldquo;{item.evidence}&rdquo;
                      </blockquote>
                    </div>
                  )}

                  {/* Plain Language Interpretation */}
                  {item.deterministicExplanation && (
                    <div className="cookie-plain-explanation">
                      <p>
                        <strong>Simple Meaning:</strong> {item.deterministicExplanation.simpleMeaning}
                      </p>
                      <p>
                        <strong>Why It Matters:</strong> {item.deterministicExplanation.whyItMatters}
                      </p>
                    </div>
                  )}

                  {/* AI Explanation Trigger & Output */}
                  <div className="cookie-ai-actions">
                    {!aiState?.data && !aiState?.loading && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs ai-explain-btn"
                        onClick={() => handleRequestAiExplanation(item)}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                        <span>Ask AI for Supplementary Explanation</span>
                      </button>
                    )}

                    {aiState?.loading && (
                      <div className="ai-loading-pill" aria-live="polite">
                        <span className="spinner-dots" aria-hidden="true" />
                        <span>Generating grounded AI explanation...</span>
                      </div>
                    )}

                    {aiState?.error && (
                      <div className="ai-notice-fallback" role="note">
                        <small>{aiState.error}</small>
                      </div>
                    )}

                    {aiState?.data && (
                      <div className="cookie-ai-response-box" role="region" aria-label="AI Explanation">
                        <div className="ai-box-badge">Supplementary AI Explanation</div>
                        <p className="ai-summary">{aiState.data.summary}</p>
                        {aiState.data.keyTakeaway && (
                          <p className="ai-takeaway">
                            <strong>Key Takeaway:</strong> {aiState.data.keyTakeaway}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isUnclear && (
                <div className="cookie-outcome-body outcome-unclear">
                  <p className="cookie-meaning-text">
                    <strong>Ambiguous / Discretionary Disclosure:</strong> The analyzed text uses conditional or open-ended language regarding this tracking practice.
                  </p>
                  {item.evidence && (
                    <div className="cookie-evidence-box">
                      <div className="cookie-evidence-header">
                        <span className="evidence-tag">Flagged Clause</span>
                      </div>
                      <blockquote className="cookie-evidence-quote">
                        &ldquo;{item.evidence}&rdquo;
                      </blockquote>
                    </div>
                  )}
                  <p className="unclear-notice">
                    Operational durations, specific cookie names, or tracking partners are left unspecified in the policy.
                  </p>
                </div>
              )}

              {isNotDetected && (
                <div className="cookie-outcome-body outcome-not-detected">
                  <p className="cookie-not-detected-msg">
                    <strong>No Matching Disclosure Detected:</strong> No clauses in the analyzed document matched PrivacyLens&rsquo;s pattern set for this check.
                  </p>
                  <p className="not-detected-disclaimer">
                    <em>Important:</em> The absence of a detected disclosure does <strong>not</strong> guarantee that the website does not use this tracking technology. Some websites use trackers without documenting them in their public text, or document them in separate cookie banners.
                  </p>
                </div>
              )}

              {isPending && (
                <div className="cookie-outcome-body outcome-pending">
                  <p className="cookie-pending-msg">
                    Awaiting policy analysis. Enter policy text in the analyzer above and click &ldquo;Analyze Policy&rdquo; to evaluate this check.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Educational Terminology Glossary Accordion */}
      <div className="cookie-glossary-section">
        <h5 className="glossary-header-title">Cookie &amp; Tracking Educational Glossary</h5>
        <p className="glossary-header-subtitle">
          Essential concepts to help you navigate privacy policies and browser tracking mechanisms.
        </p>

        <div className="glossary-cards-grid">
          {COOKIE_GLOSSARY.map((g, idx) => {
            const isOpen = activeGlossaryTab === idx;
            return (
              <div key={idx} className={`glossary-card ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="glossary-toggle-btn"
                  onClick={() => setActiveGlossaryTab(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <span className="glossary-term">{g.term}</span>
                  <span className="glossary-chevron" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="glossary-content-body">
                    <p><strong>What it is:</strong> {g.simpleDefinition}</p>
                    <p><strong>Why it matters:</strong> {g.whyItMatters}</p>
                    <p className="glossary-risk"><strong>Privacy Impact:</strong> {g.riskLevel}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CookieAssistant;

