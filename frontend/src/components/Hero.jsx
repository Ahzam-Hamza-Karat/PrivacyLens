import React, { useState } from 'react';

/**
 * Interactive Sample Clauses for Consumer Demonstration
 */
const DEMO_INSPECTOR_CLAUSES = [
  {
    id: 'geo',
    label: 'Location Tracking',
    category: 'Data Collection',
    categoryClass: 'badge-collection',
    status: 'Disclosed Practice',
    statusClass: 'status-found',
    summaryLabel: 'Device GPS Telemetry',
    fullText: 'We automatically collect your precise GPS location, nearby Wi-Fi access points, and cell tower telemetry whenever location-based services are activated in the application.',
    highlightText: 'collect your precise GPS location, nearby Wi-Fi access points, and cell tower telemetry',
    explanation: 'The company explicitly records your exact physical location using hardware GPS and mobile network signals when location features are enabled.',
  },
  {
    id: 'sale',
    label: 'Non-Selling Pledge',
    category: 'Data Sharing',
    categoryClass: 'badge-sharing',
    status: 'Privacy Commitment',
    statusClass: 'status-found',
    summaryLabel: 'No Third-Party Sale',
    fullText: 'We share data with infrastructure service providers strictly to operate our platform. We do not sell, rent, or trade your personal information to third parties for commercial compensation.',
    highlightText: 'We do not sell, rent, or trade your personal information to third parties for commercial compensation',
    explanation: 'Contains an explicit promise not to sell, rent, or trade your personal information to commercial brokers or advertisers.',
  },
  {
    id: 'beacons',
    label: 'Web Tracking Beacons',
    category: 'Cookies & Tracking',
    categoryClass: 'badge-cookies',
    status: 'Tracking Technology',
    statusClass: 'status-found',
    summaryLabel: 'Cross-Site Pixels',
    fullText: 'We and our analytics partners deploy persistent web beacons, pixel tags, and local storage scripts to track your cross-site browsing behavior across external websites.',
    highlightText: 'deploy persistent web beacons, pixel tags, and local storage scripts to track your cross-site browsing behavior',
    explanation: 'Discloses third-party tracking pixels and scripts that monitor what other websites you visit across the internet.',
  },
];

/**
 * Consumer-Facing Hero Component
 * Features clean visual hierarchy, clear product messaging, focused CTAs,
 * an interactive clause demonstration, and a streamlined capabilities overview.
 */
export function Hero({ onStartAnalyzing, onLoadSample }) {
  const [activeClauseIndex, setActiveClauseIndex] = useState(0);
  const activeClause = DEMO_INSPECTOR_CLAUSES[activeClauseIndex];

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="app-container">
        {/* Top Product Messaging */}
        <div className="hero-header-block">
          <div className="hero-pill-badge" role="status">
            <span className="pill-dot" />
            <span>Plain-Language Privacy Intelligence</span>
          </div>

          <h1 id="hero-title" className="hero-main-title">
            Understand the privacy policies <span className="gradient-text">you agree to.</span>
          </h1>

          <p className="hero-lead-text">
            PrivacyLens translates complex digital agreements into plain, understandable language.
            See what data companies collect, who they share it with, and what rights you have &mdash; backed
            by exact quotes from the original text.
          </p>

          <div className="hero-action-toolbar">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onStartAnalyzing}
              id="hero-btn-start"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Analyze a Policy</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onLoadSample}
              id="hero-btn-sample"
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Try a Sample Policy</span>
            </button>
          </div>
        </div>

        {/* Product Demonstration: Interactive Clause Showcase */}
        <div className="hero-showcase-container" aria-label="Interactive Clause Demonstration">
          <div className="showcase-window">
            <div className="showcase-titlebar">
              <div className="showcase-doc-tab">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Interactive Demonstration</span>
              </div>

              <div className="showcase-sample-switcher" role="tablist" aria-label="Sample clause selector">
                {DEMO_INSPECTOR_CLAUSES.map((clause, idx) => (
                  <button
                    key={clause.id}
                    type="button"
                    role="tab"
                    aria-selected={activeClauseIndex === idx}
                    className={`switcher-pill ${activeClauseIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveClauseIndex(idx)}
                  >
                    {clause.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="showcase-body">
              {/* Left Pane: Original Policy Text with Highlight */}
              <div className="showcase-text-pane">
                <div className="pane-label-bar">
                  <span className="pane-subheading">Original Policy Wording</span>
                  <span className="pane-citation-pill">Source Excerpt</span>
                </div>
                <div className="policy-sample-reader">
                  <p>
                    {activeClause.fullText.split(activeClause.highlightText)[0]}
                    <mark className="verbatim-highlight" title="Original text highlighted as evidence">
                      {activeClause.highlightText}
                    </mark>
                    {activeClause.fullText.split(activeClause.highlightText)[1]}
                  </p>
                </div>
              </div>

              {/* Right Pane: Plain-Language Interpretation */}
              <div className="showcase-finding-pane">
                <div className="pane-label-bar">
                  <span className="pane-subheading">Plain-Language Translation</span>
                  <span className={`status-chip ${activeClause.statusClass}`}>{activeClause.status}</span>
                </div>

                <div className="finding-meta-row">
                  <span className={`category-tag ${activeClause.categoryClass}`}>{activeClause.category}</span>
                  <span className="finding-topic-pill">{activeClause.summaryLabel}</span>
                </div>

                <div className="finding-explanation-box">
                  <p className="expl-box-text">{activeClause.explanation}</p>
                </div>

                <div className="finding-invariant-note">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Verified Direct Quote from Original Text</span>
                </div>
              </div>
            </div>

            <div className="showcase-footer-disclaimer">
              <span className="disclaimer-indicator">Example Preview</span>
              <span>This demonstration illustrates how PrivacyLens highlights original evidence and translates it into clear terms. Paste any policy below to analyze your own document.</span>
            </div>
          </div>
        </div>

        {/* Capability Overview: 6 Core User Benefits (Clickable Navigation Cards) */}
        <div className="capabilities-bento-grid" role="region" aria-label="Key Features & Capabilities">
          <a href="#analyzer" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3 className="bento-title">5-Domain Policy Analysis</h3>
            <p className="bento-text">
              Examines personal data collection, sharing, tracking cookies, retention, and statutory consumer rights.
            </p>
          </a>

          <a href="#analyzer" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="bento-title">Exact Verbatim Evidence</h3>
            <p className="bento-text">
              Every finding is anchored directly to the exact sentence in the original text, ensuring verifiable citations.
            </p>
          </a>

          <a href="#cookie-center" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
            <h3 className="bento-title">Cookie Center &amp; Simulator</h3>
            <p className="bento-text">
              Understand tracking technologies and explore an interactive consent simulator with real-time feedback.
            </p>
          </a>

          <a href="#version-diff" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="bento-title">Policy Version Comparison</h3>
            <p className="bento-text">
              Compare two privacy policy drafts side by side to see what clauses were added, removed, or changed.
            </p>
          </a>

          <a href="#chatbot" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="bento-title">Policy Q&amp;A Assistant</h3>
            <p className="bento-text">
              Ask natural-language questions about the analyzed agreement with answers grounded in the policy text.
            </p>
          </a>

          <a href="#saved-reports" className="bento-card bento-card-link">
            <div className="bento-icon-wrapper" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="bento-title">Private Saved Reports</h3>
            <p className="bento-text">
              Save analysis snapshots to MongoDB with consent. Scoped to your browser with permanent deletion control.
            </p>
          </a>
        </div>

        {/* Consumer Trust & Educational Scope Banner */}
        <div className="hero-scope-banner" role="note">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="scope-banner-text">
            <strong>Educational &amp; Informational Service:</strong> PrivacyLens is designed to help consumers understand digital agreements. It does not provide legal advice, audit certifications, or compliance guarantees. Findings labeled &ldquo;Not Detected&rdquo; indicate that no matching statement was found in the text, not that the organization does not engage in that practice.
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
