import React, { useState } from 'react';
import {
  SIMULATOR_CATEGORIES,
  createDefaultSimulatorState,
  getReadableConsentSummary,
} from '../utils/cookieCatalogue.js';
import { CookiePreferenceChart } from './CookiePreferenceChart.jsx';

/**
 * Interactive Cookie Simulator Component (Phase 4B)
 *
 * An educational interactive simulation demonstrating modern cookie-consent configurations.
 *
 * Acceptance Criteria & Invariants:
 * - Essential cookies are visibly distinguished, labeled "Always Active / Required", and locked.
 * - Optional categories (Analytics, Advertising, Functional) toggle in real-time.
 * - Actions: "Accept All Optional", "Reject All Optional", and "Reset Demonstration".
 * - Current simulated consent is displayed in clear human-readable text and visual toggles.
 * - Prominently labeled as a demonstration; does NOT alter real browser cookies or send external network requests.
 * - Zero session persistence (in-memory React state only).
 * - Full accessibility with semantic switch roles, keyboard controls (Enter/Space), and screen-reader summaries.
 */
export function CookieSimulator() {
  const [preferences, setPreferences] = useState(createDefaultSimulatorState());

  const handleToggle = (categoryId) => {
    // Essential cookies cannot be disabled
    if (categoryId === 'essential') return;

    setPreferences((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      advertising: true,
      functional: true,
    });
  };

  const handleRejectAll = () => {
    setPreferences({
      essential: true,
      analytics: false,
      advertising: false,
      functional: false,
    });
  };

  const handleReset = () => {
    setPreferences(createDefaultSimulatorState());
  };

  const summary = getReadableConsentSummary(preferences);

  return (
    <div className="cookie-simulator-container" role="region" aria-label="Interactive Cookie Simulator">
      {/* Simulation Header */}
      <div className="simulator-header-group">
        <h4 className="simulator-title">Interactive Cookie Consent Simulator</h4>
        <p className="simulator-subtitle">
          Experience how modern consent management platforms categorize web cookies and how user choices impact data tracking.
        </p>
      </div>

      {/* Prominent Educational Simulation Notice */}
      <div className="simulator-notice-banner" role="note">
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
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div className="simulator-notice-text">
          <strong>Educational Demonstration Only:</strong> This simulator demonstrates consent architecture.
          Toggling categories here does <em>not</em> alter your browser cookies, communicate with external servers,
          or enforce preferences on third-party websites. No choices are saved to disk or persistent storage.
        </div>
      </div>

      {/* Simulator Control Action Buttons */}
      <div className="simulator-actions-bar" role="group" aria-label="Bulk consent actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAcceptAll}
          id="btn-sim-accept-all"
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Accept All Optional</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleRejectAll}
          id="btn-sim-reject-all"
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
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span>Reject All Optional</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleReset}
          id="btn-sim-reset"
          title="Reset back to default minimal settings"
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
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span>Reset Demonstration</span>
        </button>
      </div>

      {/* Real-time Readable Selection & Impact Box */}
      <div className="simulator-summary-card" aria-live="polite">
        <div className="summary-card-top">
          <span className="summary-tag">Current Simulated Consent</span>
          <span className="summary-status-pill">
            {summary.activeCount} of {summary.totalCategories} Categories Active
          </span>
        </div>
        <div className="summary-readable-text">{summary.readableSummary}</div>
        <p className="summary-impact-text">
          <strong>Simulated Impact:</strong> {summary.simulatedImpactText}
        </p>
      </div>

      {/* Interactive Categories List */}
      <div className="simulator-categories-list">
        {SIMULATOR_CATEGORIES.map((cat) => {
          const isEssential = cat.required;
          const isChecked = isEssential ? true : Boolean(preferences[cat.id]);

          return (
            <div
              key={cat.id}
              className={`simulator-category-row ${isEssential ? 'row-essential' : ''} ${isChecked ? 'row-active' : 'row-inactive'}`}
            >
              <div className="category-info-col">
                <div className="category-title-line">
                  <span className="category-name">{cat.name}</span>
                  <span className={`badge ${isEssential ? 'badge-essential' : isChecked ? 'badge-sim-active' : 'badge-sim-inactive'}`}>
                    {cat.badgeText}
                  </span>
                </div>
                <p className="category-description">{cat.description}</p>
                <div className="category-meta-row">
                  <span className="meta-label">Simulated Cookie Names:</span>
                  <div className="simulated-cookie-tags">
                    {cat.simulatedExamples.map((name) => (
                      <code key={name} className="cookie-name-tag">{name}</code>
                    ))}
                  </div>
                </div>
                <div className="category-impact-note">
                  <em>{isChecked ? cat.impactGranted : cat.impactDenied}</em>
                </div>
              </div>

              {/* Accessible Toggle Control */}
              <div className="category-toggle-col">
                <button
                  type="button"
                  role="switch"
                  id={`switch-${cat.id}`}
                  aria-checked={isChecked}
                  aria-disabled={isEssential}
                  aria-label={`${cat.name} consent switch. ${isEssential ? 'Locked as always active.' : isChecked ? 'Currently granted.' : 'Currently denied.'}`}
                  className={`sim-switch-btn ${isChecked ? 'switch-on' : 'switch-off'} ${isEssential ? 'switch-locked' : ''}`}
                  onClick={() => handleToggle(cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggle(cat.id);
                    }
                  }}
                  disabled={isEssential}
                >
                  <span className="switch-track">
                    <span className="switch-thumb" />
                  </span>
                  <span className="switch-label">
                    {isEssential ? 'Required' : isChecked ? 'Granted' : 'Denied'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Preference Chart & Accessible Matrix Table */}
      <CookiePreferenceChart preferences={preferences} />
    </div>
  );
}

export default CookieSimulator;

