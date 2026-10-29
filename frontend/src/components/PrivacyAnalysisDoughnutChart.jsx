import React, { useState } from 'react';
import {
  TOTAL_RULES_COUNT,
  CHECK_STATUS,
  computeRuleDistribution,
} from '../utils/rulesCatalogue';

/**
 * Privacy Analysis Doughnut Chart Component (Phase 3)
 *
 * Visualizes the deterministic execution outcomes of all 28 predefined policy checks
 * across three non-judgmental categories: Found, Unclear, and Not Detected.
 *
 * Distinguishes three distinct application states:
 * 1. No Analysis: Informative state indicating analysis is pending; does NOT report 28 Not Detected.
 * 2. Completed Analysis: Displays actual outcomes across the 28 checks, conserving denominator = 28.
 * 3. Stale Analysis: Indicates policy text was modified and results need to be refreshed.
 *
 * @param {{
 *   findings?: Array<object>,
 *   hasAnalyzed?: boolean,
 *   isStale?: boolean,
 *   onReanalyze?: () => void
 * }} props
 */
export function PrivacyAnalysisDoughnutChart({
  findings = [],
  hasAnalyzed = true,
  isStale = false,
  onReanalyze = null,
}) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'found' | 'unclear' | 'not_found' | 'pending'
  const [viewMode, setViewMode] = useState('split'); // 'split' (chart + summary) | 'table' (full table view)

  const distribution = computeRuleDistribution(findings, { hasAnalyzed });
  const { counts, percentages, percentageStrings, evaluatedRules } = distribution;

  // Filter rules based on keyboard-accessible selection
  const filteredRules = evaluatedRules.filter((rule) => {
    if (activeFilter === 'all') return true;
    return rule.status === activeFilter;
  });

  // Pure SVG Doughnut geometry calculations
  const radius = 75;
  const circumference = 2 * Math.PI * radius; // ~471.2389
  const denominator = TOTAL_RULES_COUNT; // 28

  // Dash length calculations (when analysis has completed)
  const foundDash = hasAnalyzed ? (counts.found / denominator) * circumference : 0;
  const unclearDash = hasAnalyzed ? (counts.unclear / denominator) * circumference : 0;
  const notFoundDash = hasAnalyzed ? (counts.not_found / denominator) * circumference : 0;

  // Dash offset calculations (starting at 12 o'clock, clockwise)
  const foundOffset = 0;
  const unclearOffset = -foundDash;
  const notFoundOffset = -(foundDash + unclearDash);

  return (
    <section
      className="doughnut-chart-section"
      aria-labelledby="doughnut-chart-title"
      role="region"
    >
      <div className="doughnut-chart-card">
        {/* Header with Title and Denominator */}
        <div className="doughnut-card-header">
          <div className="doughnut-title-group">
            <span className="section-tag">
              {hasAnalyzed ? 'RULE EXECUTION METRICS' : 'ANALYSIS PENDING'}
            </span>
            <h3 id="doughnut-chart-title" className="doughnut-card-title">
              Automated Privacy Checks Breakdown
            </h3>
            <p className="doughnut-card-subtitle">
              {hasAnalyzed
                ? `Outcomes across all ${denominator} deterministic privacy rules evaluated against the provided policy text.`
                : `Enter or load policy text in the analyzer above and click "Analyze Policy" to run all ${denominator} automated checks.`}
            </p>
          </div>

          <div className="doughnut-header-badges">
            {hasAnalyzed ? (
              <span className="badge badge-denominator" title="Total evaluated rules">
                {denominator} Checks Evaluated
              </span>
            ) : (
              <span className="badge badge-pending-header" title="Awaiting document analysis">
                {denominator} Checks Awaiting Analysis
              </span>
            )}

            {hasAnalyzed && isStale && (
              <span className="badge badge-stale" title="Policy text was modified">
                Stale (Document Edited)
              </span>
            )}
          </div>
        </div>

        {/* Stale Analysis Alert Banner */}
        {hasAnalyzed && isStale && (
          <div className="doughnut-stale-banner no-print" role="alert">
            <div className="doughnut-stale-content">
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
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Document Edited — Stale Results:</strong> The policy text was modified after
                this analysis was run. Results may be outdated.
              </span>
            </div>
            {onReanalyze && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onReanalyze}
                title="Re-run analysis on modified document"
              >
                Refresh Analysis
              </button>
            )}
          </div>
        )}

        {/* Explicit Non-Scoring & Informational Disclaimer */}
        <div className="doughnut-disclaimer-banner" role="note">
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
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div className="doughnut-disclaimer-text">
            <strong>Informational Summary — Not a Privacy Score:</strong> This breakdown reflects
            the deterministic pattern match outcomes of PrivacyLens&rsquo;s 28 automated checks (Found, Unclear,
            Not Detected). It does <em>not</em> represent a compliance score, legal grade, safety rating,
            or risk index. High detection indicates explicit disclosures in the text, not necessarily user-favorable practices.
          </div>
        </div>

        {/* View Mode Switcher (Accessible Tabs) */}
        <div className="doughnut-view-controls no-print" role="tablist" aria-label="Chart display options">
          <button
            type="button"
            role="tab"
            id="tab-chart-view"
            aria-selected={viewMode === 'split'}
            aria-controls="panel-chart-view"
            className={`btn-view-toggle ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Doughnut &amp; Summary</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-table-view"
            aria-selected={viewMode === 'table'}
            aria-controls="panel-table-view"
            className={`btn-view-toggle ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
            <span>Detailed Table Alternative ({denominator} Checks)</span>
          </button>
        </div>

        {/* Split View: Doughnut Chart + Summary */}
        {viewMode === 'split' && (
          <div id="panel-chart-view" role="tabpanel" aria-labelledby="tab-chart-view">
            <div className="doughnut-main-layout">
              {/* Left Column: Pure SVG Doughnut */}
              <div className="doughnut-visual-wrapper">
                <svg
                  className="doughnut-svg"
                  viewBox="0 0 240 240"
                  width="220"
                  height="220"
                  role="img"
                  aria-label={
                    hasAnalyzed
                      ? `Doughnut chart of 28 policy checks: ${counts.found} Found (${percentageStrings.found}), ${counts.unclear} Unclear (${percentageStrings.unclear}), ${counts.not_found} Not Detected (${percentageStrings.not_found})`
                      : 'Empty doughnut chart awaiting policy analysis across 28 checks'
                  }
                >
                  <title>Privacy Analysis Checks Distribution</title>
                  <desc>
                    {hasAnalyzed
                      ? `A doughnut chart showing the distribution of ${denominator} automated checks: ${counts.found} Found, ${counts.unclear} Unclear, ${counts.not_found} Not Detected.`
                      : `Awaiting policy analysis across all ${denominator} checks.`}
                  </desc>

                  {/* Background Track Circle */}
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    className="doughnut-track"
                    fill="none"
                    strokeWidth="22"
                  />

                  {/* SVG Segments Group (Rotated to start at 12 o'clock) */}
                  {hasAnalyzed ? (
                    <g transform="rotate(-90 120 120)">
                      {/* Found Segment (Green) */}
                      {counts.found > 0 && (
                        <circle
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="none"
                          className="doughnut-segment segment-found"
                          strokeWidth="22"
                          strokeDasharray={`${foundDash} ${circumference - foundDash}`}
                          strokeDashoffset={foundOffset}
                        />
                      )}

                      {/* Unclear Segment (Amber) */}
                      {counts.unclear > 0 && (
                        <circle
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="none"
                          className="doughnut-segment segment-unclear"
                          strokeWidth="22"
                          strokeDasharray={`${unclearDash} ${circumference - unclearDash}`}
                          strokeDashoffset={unclearOffset}
                        />
                      )}

                      {/* Not Detected Segment (Slate/Muted) */}
                      {counts.not_found > 0 && (
                        <circle
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="none"
                          className="doughnut-segment segment-not-detected"
                          strokeWidth="22"
                          strokeDasharray={`${notFoundDash} ${circumference - notFoundDash}`}
                          strokeDashoffset={notFoundOffset}
                        />
                      )}
                    </g>
                  ) : (
                    /* Pending State: Subtle Dashed Ring */
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      fill="none"
                      className="doughnut-segment-pending"
                      strokeWidth="22"
                      strokeDasharray="6 6"
                    />
                  )}

                  {/* Doughnut Center Typography */}
                  <text
                    x="120"
                    y="114"
                    textAnchor="middle"
                    className="doughnut-center-number"
                  >
                    {hasAnalyzed ? denominator : '0'}
                  </text>
                  <text
                    x="120"
                    y="134"
                    textAnchor="middle"
                    className="doughnut-center-label"
                  >
                    {hasAnalyzed ? 'Checks Evaluated' : 'Checks Run'}
                  </text>
                </svg>

                {!hasAnalyzed && (
                  <p className="doughnut-empty-caption">
                    Awaiting analysis &mdash; submit policy text above to evaluate all {denominator} checks.
                  </p>
                )}
              </div>

              {/* Right Column: Dynamic Content Based on Application State */}
              <div className="doughnut-metrics-column">
                {hasAnalyzed ? (
                  /* Completed State: 3 Interactive Metric Cards */
                  <>
                    {/* Found Card */}
                    <div
                      className={`doughnut-metric-card card-found ${activeFilter === CHECK_STATUS.FOUND ? 'active-filter' : ''}`}
                      onClick={() => setActiveFilter(activeFilter === CHECK_STATUS.FOUND ? 'all' : CHECK_STATUS.FOUND)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveFilter(activeFilter === CHECK_STATUS.FOUND ? 'all' : CHECK_STATUS.FOUND);
                        }
                      }}
                      aria-pressed={activeFilter === CHECK_STATUS.FOUND}
                      aria-label={`Filter by Found checks: ${counts.found} of ${denominator} checks, ${percentageStrings.found}`}
                    >
                      <div className="metric-card-top">
                        <span className="status-indicator indicator-found" aria-hidden="true" />
                        <span className="metric-card-name">Found (Disclosed)</span>
                        <span className="metric-card-percentage">{percentageStrings.found}</span>
                      </div>
                      <div className="metric-card-count">
                        <strong>{counts.found}</strong>
                        <span className="denominator-label"> / {denominator} checks</span>
                      </div>
                      <p className="metric-card-desc">
                        Affirmative or clear policy clauses matched by transparent patterns.
                      </p>
                    </div>

                    {/* Unclear Card */}
                    <div
                      className={`doughnut-metric-card card-unclear ${activeFilter === CHECK_STATUS.UNCLEAR ? 'active-filter' : ''}`}
                      onClick={() => setActiveFilter(activeFilter === CHECK_STATUS.UNCLEAR ? 'all' : CHECK_STATUS.UNCLEAR)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveFilter(activeFilter === CHECK_STATUS.UNCLEAR ? 'all' : CHECK_STATUS.UNCLEAR);
                        }
                      }}
                      aria-pressed={activeFilter === CHECK_STATUS.UNCLEAR}
                      aria-label={`Filter by Unclear checks: ${counts.unclear} of ${denominator} checks, ${percentageStrings.unclear}`}
                    >
                      <div className="metric-card-top">
                        <span className="status-indicator indicator-unclear" aria-hidden="true" />
                        <span className="metric-card-name">Unclear (Discretionary)</span>
                        <span className="metric-card-percentage">{percentageStrings.unclear}</span>
                      </div>
                      <div className="metric-card-count">
                        <strong>{counts.unclear}</strong>
                        <span className="denominator-label"> / {denominator} checks</span>
                      </div>
                      <p className="metric-card-desc">
                        Vague, open-ended, or conditional terms (e.g. &ldquo;as long as needed&rdquo;).
                      </p>
                    </div>

                    {/* Not Detected Card */}
                    <div
                      className={`doughnut-metric-card card-not-detected ${activeFilter === CHECK_STATUS.NOT_DETECTED ? 'active-filter' : ''}`}
                      onClick={() => setActiveFilter(activeFilter === CHECK_STATUS.NOT_DETECTED ? 'all' : CHECK_STATUS.NOT_DETECTED)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveFilter(activeFilter === CHECK_STATUS.NOT_DETECTED ? 'all' : CHECK_STATUS.NOT_DETECTED);
                        }
                      }}
                      aria-pressed={activeFilter === CHECK_STATUS.NOT_DETECTED}
                      aria-label={`Filter by Not Detected checks: ${counts.not_found} of ${denominator} checks, ${percentageStrings.not_found}`}
                    >
                      <div className="metric-card-top">
                        <span className="status-indicator indicator-not-detected" aria-hidden="true" />
                        <span className="metric-card-name">Not Detected</span>
                        <span className="metric-card-percentage">{percentageStrings.not_found}</span>
                      </div>
                      <div className="metric-card-count">
                        <strong>{counts.not_found}</strong>
                        <span className="denominator-label"> / {denominator} checks</span>
                      </div>
                      <p className="metric-card-desc">
                        No matching clauses identified in this document for these rules.
                      </p>
                    </div>
                  </>
                ) : (
                  /* No Analysis State: Informative Candidate Rule Overview */
                  <div className="doughnut-no-analysis-overview">
                    <div className="no-analysis-header">
                      <h4 className="no-analysis-title">Analyze a Privacy Policy to View Results</h4>
                      <p className="no-analysis-prompt">
                        PrivacyLens will evaluate your policy against <strong>28 deterministic checks</strong> across 5 privacy categories:
                      </p>
                    </div>
                    <ul className="no-analysis-categories-list">
                      <li><strong>Data Collection</strong> &mdash; 7 checks (contact, credentials, payment, telemetry, activity, location, restrictions)</li>
                      <li><strong>Data Sharing</strong> &mdash; 6 checks (vendors, sale pledges, affirmative sales, legal mandates, mergers, affiliates)</li>
                      <li><strong>Cookies &amp; Tracking</strong> &mdash; 5 checks (session cookies, tracking beacons, analytics, user controls, non-tracking)</li>
                      <li><strong>Data Retention</strong> &mdash; 4 checks (specific timeframes, account closure, vague durations, legal exceptions)</li>
                      <li><strong>User Rights</strong> &mdash; 6 checks (access, rectification, erasure, opt-out, portability, contact channels)</li>
                    </ul>
                    <p className="no-analysis-footnote">
                      All checks are currently pending analysis. Submit text above to classify each check into Found, Unclear, or Not Detected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documented Rounding Methodology Note (Rendered only on completed analysis) */}
            {hasAnalyzed && (
              <div className="doughnut-rounding-footnote">
                <small>
                  * Percentages are calculated as <code>(count / {denominator}) &times; 100</code> and rounded to 1 decimal place. Individual percentages may sum to 99.9%&ndash;100.1% due to independent standard rounding.
                </small>
              </div>
            )}
          </div>
        )}

        {/* Filter Controls Bar (Visible on completed analysis) */}
        {hasAnalyzed ? (
          <div className="doughnut-filter-section no-print">
            <div className="filter-label-group">
              <span className="filter-label">Filter Rule Breakdown:</span>
              <span className="filter-showing-text">
                Showing <strong>{filteredRules.length}</strong> of {denominator} checks
              </span>
            </div>

            <div className="filter-pills-group" role="group" aria-label="Rule status filter">
              <button
                type="button"
                className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
                aria-pressed={activeFilter === 'all'}
              >
                All Checks ({denominator})
              </button>
              <button
                type="button"
                className={`filter-pill pill-found ${activeFilter === CHECK_STATUS.FOUND ? 'active' : ''}`}
                onClick={() => setActiveFilter(CHECK_STATUS.FOUND)}
                aria-pressed={activeFilter === CHECK_STATUS.FOUND}
              >
                Found ({counts.found})
              </button>
              <button
                type="button"
                className={`filter-pill pill-unclear ${activeFilter === CHECK_STATUS.UNCLEAR ? 'active' : ''}`}
                onClick={() => setActiveFilter(CHECK_STATUS.UNCLEAR)}
                aria-pressed={activeFilter === CHECK_STATUS.UNCLEAR}
              >
                Unclear ({counts.unclear})
              </button>
              <button
                type="button"
                className={`filter-pill pill-not-detected ${activeFilter === CHECK_STATUS.NOT_DETECTED ? 'active' : ''}`}
                onClick={() => setActiveFilter(CHECK_STATUS.NOT_DETECTED)}
                aria-pressed={activeFilter === CHECK_STATUS.NOT_DETECTED}
              >
                Not Detected ({counts.not_found})
              </button>
            </div>
          </div>
        ) : (
          <div className="doughnut-filter-section no-print pending-filter-section">
            <div className="filter-label-group">
              <span className="filter-label">Candidate Check Registry:</span>
              <span className="filter-showing-text">
                Showing <strong>{filteredRules.length}</strong> checks awaiting evaluation
              </span>
            </div>
            <span className="badge badge-pending">All 28 Checks Pending Analysis</span>
          </div>
        )}

        {/* Accessible Detailed Table Alternative */}
        <div
          id="panel-table-view"
          className="doughnut-table-wrapper"
          role="region"
          aria-label="Accessible 28 Rules Outcome Table"
        >
          <table className="checks-table" aria-describedby="checks-table-caption">
            <caption id="checks-table-caption" className="sr-only">
              {hasAnalyzed
                ? `Comprehensive outcome breakdown across all 28 deterministic privacy checks. Current filter: ${activeFilter}.`
                : 'Preview of all 28 deterministic privacy checks awaiting evaluation.'}
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '28%' }}>Rule Check</th>
                <th scope="col" style={{ width: '20%' }}>Privacy Category</th>
                <th scope="col" style={{ width: '16%' }}>Outcome Status</th>
                <th scope="col" style={{ width: '36%' }}>Evidence Excerpt / Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => {
                const isFound = rule.status === CHECK_STATUS.FOUND;
                const isUnclear = rule.status === CHECK_STATUS.UNCLEAR;
                const isNotDetected = rule.status === CHECK_STATUS.NOT_DETECTED;
                const isPending = rule.status === CHECK_STATUS.PENDING;

                let badgeClass = 'badge-pending';
                if (isFound) badgeClass = 'badge-found';
                if (isUnclear) badgeClass = 'badge-unclear';
                if (isNotDetected) badgeClass = 'badge-not-detected';

                return (
                  <tr key={rule.id} className={`rule-row status-${rule.status}`}>
                    <td className="rule-name-cell">
                      <div className="rule-title-text">{rule.title}</div>
                      <code className="rule-code-tag">{rule.id}</code>
                    </td>
                    <td className="rule-category-cell">
                      <span className="category-tag">{rule.categoryName}</span>
                    </td>
                    <td className="rule-status-cell">
                      <span className={`status-badge ${badgeClass}`}>
                        <span className="badge-dot" aria-hidden="true" />
                        {rule.statusLabel}
                      </span>
                    </td>
                    <td className="rule-evidence-cell">
                      {rule.evidenceExcerpt ? (
                        <blockquote className="table-evidence-quote">
                          &ldquo;{rule.evidenceExcerpt}&rdquo;
                        </blockquote>
                      ) : (
                        <span className="text-muted-italics">
                          {isPending
                            ? 'Awaiting policy analysis'
                            : 'No matching clause detected in this text'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default PrivacyAnalysisDoughnutChart;
