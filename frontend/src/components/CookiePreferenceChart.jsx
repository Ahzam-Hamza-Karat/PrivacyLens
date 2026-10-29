import React from 'react';
import { SIMULATOR_CATEGORIES } from '../utils/cookieCatalogue.js';

/**
 * Cookie Preference Chart Component
 *
 * Visual distribution and accessible tabular breakdown of simulated cookie consent preferences.
 * Integrates directly with CookieSimulator without duplicating consent state.
 *
 * Invariants:
 * - Operates strictly as a presentation layer reading preferences from CookieSimulator.
 * - Updates instantly when any preference switch or bulk action toggles.
 * - Provides both a visual meter/breakdown and an accessible semantic HTML table alternative.
 * - Prominently states that metrics represent educational simulated preferences, not real-world tracking.
 */
export function CookiePreferenceChart({ preferences }) {
  const categories = SIMULATOR_CATEGORIES;

  // Calculate simulated active counts
  const totalCategories = categories.length;
  const activeCount = categories.filter((c) => (c.required ? true : Boolean(preferences[c.id]))).length;
  const optionalCategories = categories.filter((c) => !c.required);
  const activeOptionalCount = optionalCategories.filter((c) => Boolean(preferences[c.id])).length;

  const activePercent = Math.round((activeCount / totalCategories) * 100);

  // Simulated Exposure Level
  let exposureLevel = 'Minimal (Strictly Necessary Only)';
  let exposureDescription = 'Zero non-essential data collection or cross-site tracking is simulated.';
  let exposureColor = '#10b981'; // green

  if (activeOptionalCount === 1) {
    exposureLevel = 'Low Exposure';
    exposureDescription = 'Aggregated usage telemetry simulated. Cross-site advertising cookies remain blocked.';
    exposureColor = '#0ea5e9'; // blue
  } else if (activeOptionalCount === 2) {
    exposureLevel = 'Moderate Exposure';
    exposureDescription = 'Telemetry and persistent functional preferences simulated. Targeted ads may be active if enabled.';
    exposureColor = '#f59e0b'; // amber
  } else if (activeOptionalCount === 3) {
    exposureLevel = 'Full Exposure';
    exposureDescription = 'All optional tracking tiers enabled, including behavioral profiling and third-party ad networks.';
    exposureColor = '#ef4444'; // red
  }

  return (
    <div className="cookie-preference-chart-card" role="region" aria-label="Simulated Cookie Preference Chart">
      <div className="chart-card-header">
        <div>
          <h5 className="chart-title">Simulated Preference Distribution & Exposure Meter</h5>
          <p className="chart-subtitle">
            Visual breakdown of simulated consent choices and hypothetical tracking exposure level.
          </p>
        </div>
        <span
          className="badge-sim-exposure"
          style={{ borderColor: exposureColor, color: exposureColor }}
          aria-live="polite"
        >
          {exposureLevel}
        </span>
      </div>

      {/* Visual Preference Meter */}
      <div className="preference-meter-container" aria-hidden="true">
        <div className="meter-meta-row">
          <span className="meter-label">Simulated Active Categories</span>
          <span className="meter-value">
            {activeCount} of {totalCategories} active ({activePercent}%)
          </span>
        </div>
        <div className="meter-progress-track">
          <div
            className="meter-progress-fill"
            style={{
              width: `${activePercent}%`,
              backgroundColor: exposureColor,
            }}
          />
        </div>
        <p className="meter-caption">{exposureDescription}</p>
      </div>

      {/* Category Pills Visual Breakdown */}
      <div className="category-status-pills-row" aria-hidden="true">
        {categories.map((cat) => {
          const isEssential = cat.required;
          const isGranted = isEssential ? true : Boolean(preferences[cat.id]);

          return (
            <div
              key={cat.id}
              className={`preference-pill ${isGranted ? 'pill-active' : 'pill-denied'}`}
            >
              <div className="pill-dot" />
              <div className="pill-info">
                <span className="pill-name">{cat.name}</span>
                <span className="pill-status">
                  {isEssential ? 'Required' : isGranted ? 'Granted' : 'Denied'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Tabular Alternative for Screen Readers & High-Contrast Users */}
      <div className="table-responsive sim-preference-table-wrap">
        <table className="sim-preference-table" aria-label="Detailed matrix of simulated cookie consent preferences">
          <caption className="sr-only">Detailed matrix of simulated cookie consent preferences</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Tier Type</th>
              <th scope="col">Simulated Consent</th>
              <th scope="col">Example Identifiers</th>
              <th scope="col">Simulated Functional Impact</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const isEssential = cat.required;
              const isGranted = isEssential ? true : Boolean(preferences[cat.id]);

              return (
                <tr key={cat.id} className={isGranted ? 'tr-active' : 'tr-denied'}>
                  <th scope="row" className="td-category-name">
                    {cat.name}
                  </th>
                  <td>
                    <span className={`badge ${isEssential ? 'badge-essential' : 'badge-sim-inactive'}`}>
                      {isEssential ? 'Required' : 'Optional'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-status-dot ${isGranted ? 'dot-granted' : 'dot-denied'}`}
                      aria-label={isEssential ? 'Always Active (Required)' : isGranted ? 'Consent Granted' : 'Consent Denied'}
                    >
                      {isEssential ? 'Always Active' : isGranted ? 'Granted' : 'Denied'}
                    </span>
                  </td>
                  <td className="td-cookies">
                    <code>{cat.simulatedExamples.join(', ')}</code>
                  </td>
                  <td className="td-impact">
                    {isGranted ? cat.impactGranted : cat.impactDenied}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Non-Enforcement Footer Notice */}
      <div className="chart-disclaimer-note">
        <small>
          <em>Note:</em> This preference chart is an educational simulation. Changing preferences above does not inspect,
          store, transmit, or alter real cookies in your browser or on any remote website.
        </small>
      </div>
    </div>
  );
}

export default CookiePreferenceChart;

