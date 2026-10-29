import React, { useState } from 'react';
import CookieAssistant from './CookieAssistant';
import CookieSimulator from './CookieSimulator';

/**
 * Cookie Center Component (Phase 4)
 *
 * Unifies Phase 4A (Cookie Assistant) and Phase 4B (Interactive Cookie Simulator)
 * into a cohesive, accessible workspace.
 *
 * @param {{
 *   analysisReport?: object | null,
 *   policyText?: string,
 *   isStale?: boolean,
 *   onReanalyze?: () => void
 * }} props
 */
export function CookieCenter({
  analysisReport = null,
  policyText = '',
  isStale = false,
  onReanalyze = null,
}) {
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'simulator'

  const hasAnalyzed = Boolean(analysisReport);

  return (
    <section id="cookie-center" className="content-section" aria-labelledby="cookie-center-title">
      <div className="app-container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">INTERACTIVE PRIVACY MODULE</span>
          <h2 id="cookie-center-title" className="section-title">
            Cookie &amp; Tracking Intelligence Center
          </h2>
          <p className="section-subtitle">
            Understand complex tracking disclosures in your policy with the <strong>Cookie Assistant</strong>,
            and explore modern privacy consent choices with the <strong>Interactive Cookie Simulator</strong>.
          </p>
        </div>

        {/* Stale Document Alert Banner */}
        {hasAnalyzed && isStale && (
          <div className="stale-report-banner no-print" role="alert">
            <div className="stale-banner-content">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Document Edited:</strong> The policy text was modified after analysis.
                Cookie Assistant insights reflect the previous version until re-analyzed.
              </span>
            </div>
            {onReanalyze && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onReanalyze}
              >
                Refresh Analysis
              </button>
            )}
          </div>
        )}

        {/* Module Tab Switcher */}
        <div className="cookie-center-card">
          <div className="cookie-center-tabs" role="tablist" aria-label="Cookie center modules">
            <button
              type="button"
              role="tab"
              id="tab-cookie-assistant"
              aria-selected={activeTab === 'assistant'}
              aria-controls="panel-cookie-assistant"
              className={`cookie-tab-btn ${activeTab === 'assistant' ? 'active' : ''}`}
              onClick={() => setActiveTab('assistant')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>Cookie Assistant (Policy Disclosures)</span>
              {hasAnalyzed && (
                <span className="tab-pill-badge">Live Policy</span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              id="tab-cookie-simulator"
              aria-selected={activeTab === 'simulator'}
              aria-controls="panel-cookie-simulator"
              className={`cookie-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              <span>Interactive Consent Simulator</span>
              <span className="tab-pill-badge sim-badge">Demonstration</span>
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="cookie-center-body">
            {activeTab === 'assistant' && (
              <div
                id="panel-cookie-assistant"
                role="tabpanel"
                aria-labelledby="tab-cookie-assistant"
              >
                <CookieAssistant
                  analysisReport={analysisReport}
                  policyText={policyText}
                  hasAnalyzed={hasAnalyzed}
                  isStale={isStale}
                />
              </div>
            )}

            {activeTab === 'simulator' && (
              <div
                id="panel-cookie-simulator"
                role="tabpanel"
                aria-labelledby="tab-cookie-simulator"
              >
                <CookieSimulator />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CookieCenter;

