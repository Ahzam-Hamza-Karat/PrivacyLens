import React, { useState, useMemo } from 'react';
import { DEMO_REPORT_CATEGORIES } from '../utils/constants';
import { getClientRuleExplanation } from '../utils/explanationCatalogue';
import { explainFindingWithAi, saveAnalysisReport } from '../services/api';
import PrivacyAnalysisDoughnutChart from './PrivacyAnalysisDoughnutChart';

/**
 * Redesigned Results Command Center Dashboard for PrivacyLens
 * Provides a structured analysis dashboard with outcome metrics, doughnut chart,
 * category breakdown, real-time search & filtering, dual view mode (Cards vs Dense Table),
 * verbatim evidence citation offsets, and print stylesheet optimization.
 */
export function ReportPreview({ analysisReport, policyText, isStale, onReanalyze, onSaveSuccess }) {
  // View mode: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

  // Track expanded state for progressive disclosure in findings
  const [expandedFindings, setExpandedFindings] = useState({});
  // Track expanded state for technical citation details (rule ID & exact offsets)
  const [expandedTechDetails, setExpandedTechDetails] = useState({});
  // Track on-demand supplementary AI explanations: { [findingId]: { loading, data, error } }
  const [aiExplanations, setAiExplanations] = useState({});

  const toggleTechDetails = (id) => {
    setExpandedTechDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Save to MongoDB Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time findings search & filtering state (declared at top before any early returns)
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const findings = analysisReport?.findings || [];

  // Filtered findings based on live search and category/outcome filters
  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      // Category filter
      if (categoryFilter !== 'all' && finding.category !== categoryFilter) {
        return false;
      }
      // Outcome filter (found vs unclear)
      if (outcomeFilter === 'found' && finding.matchType === 'vague') {
        return false;
      }
      if (outcomeFilter === 'unclear' && finding.matchType !== 'vague') {
        return false;
      }
      // Keyword search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = finding.title?.toLowerCase().includes(query);
        const ruleMatch = finding.ruleId?.toLowerCase().includes(query);
        const evidenceMatch = finding.evidence?.toLowerCase().includes(query);
        const simpleMeaningMatch = (finding.explanation?.simpleMeaning || '').toLowerCase().includes(query);
        if (!titleMatch && !ruleMatch && !evidenceMatch && !simpleMeaningMatch) {
          return false;
        }
      }
      return true;
    });
  }, [findings, categoryFilter, outcomeFilter, searchQuery]);

  const hasActiveFilters = searchQuery.trim() !== '' || categoryFilter !== 'all' || outcomeFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setOutcomeFilter('all');
  };

  const handleRequestAiExplanation = async (finding, expl) => {
    if (!policyText) return;

    setAiExplanations((prev) => ({
      ...prev,
      [finding.id]: { loading: true, data: null, error: null },
    }));

    const response = await explainFindingWithAi({
      policyText,
      finding,
      deterministicExplanation: expl,
    });

    if (response.success && response.data) {
      setAiExplanations((prev) => ({
        ...prev,
        [finding.id]: { loading: false, data: response.data, error: null },
      }));
    } else {
      setAiExplanations((prev) => ({
        ...prev,
        [finding.id]: {
          loading: false,
          data: null,
          error: response.error || 'Failed to generate AI supplementary explanation.',
        },
      }));
    }
  };

  const toggleFinding = (id) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  };

  // State 1: Awaiting Document Analysis
  if (!analysisReport) {
    return (
      <section id="preview" className="content-section" aria-labelledby="preview-title">
        <div className="app-container">
          <div className="section-header">
            <div className="section-step-indicator">
              <span className="step-number">02</span>
              <span className="step-label">FINDINGS INTELLIGENCE</span>
            </div>
            <h2 id="preview-title" className="section-title">
              Analysis Results &amp; Findings Dashboard
            </h2>
            <p className="section-subtitle">
              Paste a policy agreement in the workspace above and click <strong>&ldquo;Run Deterministic Analysis&rdquo;</strong> to inspect data collection, sharing, cookies, retention, and statutory rights.
            </p>
          </div>

          <div className="awaiting-analysis-card">
            <div className="awaiting-icon-wrapper" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <h3 className="awaiting-title">No Document Analyzed Yet</h3>
            <p className="awaiting-desc">
              Your results dashboard will populate here with 28 deterministic checks, verbatim offset quotations,
              and 5-dimension plain-language explanations once analysis is triggered.
            </p>

            {/* Doughnut Chart in Pending State */}
            <div className="awaiting-doughnut-preview">
              <PrivacyAnalysisDoughnutChart findings={[]} hasAnalyzed={false} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // State 2: Live Completed Analysis Dashboard
  const { metadata, summary, categories = [] } = analysisReport;
  const categoriesWithFindings = summary?.categoriesWithFindingsCount ?? categories.filter((c) => c.status === 'found').length;
  const categoriesWithoutFindings = summary?.categoriesWithoutFindingsCount ?? categories.filter((c) => c.status === 'not_found').length;
  const keyObservations = summary?.keyObservations || [];

  // Group counts
  const foundCount = findings.filter((f) => f.matchType !== 'vague').length;
  const unclearCount = findings.filter((f) => f.matchType === 'vague').length;
  const notDetectedCount = Math.max(0, 28 - (foundCount + unclearCount));

  const handleSaveToDatabase = async () => {
    if (!consentChecked) {
      setSaveError('You must check the explicit consent box to confirm saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const payload = {
      consentGiven: true,
      title: saveTitle.trim() || 'Privacy Policy Audit',
      policyLength: policyText ? policyText.length : (metadata?.characterCount || 0),
      summary: {
        totalRules: 28,
        foundCount,
        unclearCount,
        notDetectedCount: Math.max(0, 28 - (foundCount + unclearCount)),
        categorySummary: summary?.categoryCounts || {},
      },
      findings: findings.map((f) => ({
        ruleId: f.ruleId,
        ruleName: f.title,
        category: f.category,
        status: f.matchType === 'vague' ? 'unclear' : 'found',
        confidence: f.confidence || 'MODERATE',
        explanation: f.description || '',
        evidence: f.evidence || '',
        evidenceOffset: {
          start: f.startOffset ?? 0,
          end: f.endOffset ?? (f.evidence?.length || 0),
        },
      })),
    };

    const res = await saveAnalysisReport(payload);
    setIsSaving(false);

    if (res.success) {
      setSaveSuccess(true);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      setTimeout(() => {
        setIsSaveModalOpen(false);
        const savedSec = document.getElementById('saved-reports');
        if (savedSec) {
          savedSec.scrollIntoView({ behavior: 'smooth' });
        }
      }, 1500);
    } else {
      setSaveError(res.error || 'Failed to save analysis to database.');
    }
  };

  return (
    <section id="preview" className="content-section report-printable-root" aria-labelledby="live-report-title">
      <div className="app-container">
        {/* Dashboard Top Header */}
        <div className="results-dashboard-header">
          <div className="dashboard-header-text">
            <div className="section-step-indicator">
              <span className="step-label">ANALYSIS RESULTS</span>
            </div>
            <h2 id="live-report-title" className="section-title">
              Policy Disclosure Findings
            </h2>
            <p className="section-subtitle">
              What this policy explicitly discloses, ambiguous statements, and topics not mentioned in the text.
            </p>
          </div>

          <div className="dashboard-actions-bar no-print">
            <button
              type="button"
              className="btn btn-primary btn-sm save-action-btn"
              onClick={() => {
                setIsSaveModalOpen(true);
                setSaveTitle(
                  metadata?.savedTitle ||
                  `Privacy Policy Audit - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                );
                setConsentChecked(false);
                setSaveError(null);
                setSaveSuccess(false);
              }}
              id="btn-save-analysis"
              title="Save this analysis report to MongoDB database history"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>Save to Database</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm print-action-btn"
              onClick={handlePrint}
              id="btn-print-report"
              title="Print formatted findings report or export to PDF"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Export Report (PDF)</span>
            </button>
          </div>
        </div>

        {/* Stale Report Alert Banner */}
        {isStale && (
          <div className="stale-report-banner no-print" role="alert">
            <div className="stale-banner-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>
                <strong>Document Edited:</strong> The policy text in the editor was modified after this analysis was generated. Click &ldquo;Refresh Analysis&rdquo; to re-run the 28 deterministic checks.
              </span>
            </div>
            {onReanalyze && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onReanalyze}
                id="btn-refresh-report"
              >
                Refresh Analysis
              </button>
            )}
          </div>
        )}

        {/* Executive Metrics Ribbon (4 Balanced Outcome Cards) */}
        <div className="dashboard-metrics-ribbon">
          <div className="metric-card metric-card-found">
            <div className="metric-header-row">
              <span className="metric-title">Disclosed Practices</span>
              <span className="metric-pill status-found">Clear Match</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-large-num">{foundCount}</span>
              <span className="metric-unit">findings</span>
            </div>
            <div className="metric-desc">
              Statements that clearly identify active data practices or user rights.
            </div>
          </div>

          <div className="metric-card metric-card-unclear">
            <div className="metric-header-row">
              <span className="metric-title">Ambiguous Disclosures</span>
              <span className="metric-pill status-unclear">Discretionary</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-large-num">{unclearCount}</span>
              <span className="metric-unit">qualifiers</span>
            </div>
            <div className="metric-desc">
              Open-ended wording (*"as necessary"*, *"at our discretion"*).
            </div>
          </div>

          <div className="metric-card metric-card-not-detected">
            <div className="metric-header-row">
              <span className="metric-title">Not Detected</span>
              <span className="metric-pill status-neutral">{notDetectedCount} of 28 Rules</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-large-num">{notDetectedCount}</span>
              <span className="metric-unit">rules</span>
            </div>
            <div className="metric-desc">
              Privacy checks with no matching clause detected in the submitted text.
            </div>
          </div>

          <div className="metric-card metric-card-document">
            <div className="metric-header-row">
              <span className="metric-title">Document Scope</span>
              <span className="metric-pill status-neutral">{categoriesWithFindings}/5 Categories</span>
            </div>
            <div className="metric-value-row">
              <span className="metric-large-num">{metadata?.characterCount?.toLocaleString() || 0}</span>
              <span className="metric-unit">chars</span>
            </div>
            <div className="metric-desc">
              {metadata?.segmentCount || 0} clauses analyzed across 5 core privacy domains.
            </div>
          </div>
        </div>

        {/* Visual Intelligence Section: Doughnut Chart (28 Rules) */}
        <div className="dashboard-visual-intelligence">
          <PrivacyAnalysisDoughnutChart
            findings={findings}
            hasAnalyzed={true}
            isStale={isStale}
            onReanalyze={onReanalyze}
          />
        </div>

        {/* Key Observations Panel */}
        {keyObservations.length > 0 && (
          <div className="dashboard-observations-card" role="region" aria-label="Key Observations">
            <div className="observations-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <h3 className="observations-title">Key Deterministic Observations</h3>
            </div>
            <ul className="observations-grid">
              {keyObservations.map((obs, idx) => (
                <li key={idx} className="observation-pill">
                  <span className="obs-dot" aria-hidden="true" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Findings Command Bar: Search, Category Filters, Outcome Filters, View Mode Toggle */}
        <div className="findings-command-center no-print" role="region" aria-label="Findings Filters and Controls">
          <div className="command-search-row">
            <div className="filter-search-box">
              <svg
                className="search-icon"
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search findings by keyword, rule ID, or clause text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search findings by keyword"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn-clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search input"
                >
                  &times;
                </button>
              )}
            </div>

            {/* View Mode Toggle: Cards vs Dense Table */}
            <div className="view-mode-toggle-group" role="group" aria-label="Findings view layout">
              <button
                type="button"
                id="btn-view-cards"
                className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Switch to detailed Card view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Cards</span>
              </button>
              <button
                type="button"
                id="btn-view-table"
                className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Switch to dense Audit Table view"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span>Audit Table</span>
              </button>
            </div>
          </div>

          <div className="command-filters-row">
            <div className="filter-controls-group">
              <div className="filter-select-wrapper">
                <label htmlFor="category-select" className="filter-label">Category:</label>
                <select
                  id="category-select"
                  className="filter-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All 5 Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-select-wrapper">
                <label htmlFor="outcome-select" className="filter-label">Outcome:</label>
                <select
                  id="outcome-select"
                  className="filter-select"
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                >
                  <option value="all">All Outcomes</option>
                  <option value="found">Disclosed (Clear)</option>
                  <option value="unclear">Ambiguous (Unclear)</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm btn-reset-filters"
                  onClick={resetFilters}
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="filter-results-count" aria-live="polite">
              Showing <strong>{filteredFindings.length}</strong> of {findings.length} findings
            </div>
          </div>
        </div>

        {/* View Mode 1: Detailed Cards View */}
        {viewMode === 'cards' && (
          <div className="report-grid">
            <div className="report-categories-list">
              {categories.map((cat) => {
                const catFindings = filteredFindings.filter((f) => f.category === cat.id);
                const totalCatFindings = findings.filter((f) => f.category === cat.id);

                if (categoryFilter !== 'all' && cat.id !== categoryFilter) {
                  return null;
                }

                const isFound = cat.status === 'found';
                const isUnclear = cat.status === 'unclear';

                return (
                  <article key={cat.id} className="category-card" aria-labelledby={`cat-title-${cat.id}`}>
                    <div className="category-header">
                      <div className="category-title-group">
                        <h3 id={`cat-title-${cat.id}`} className="category-title">
                          {cat.name}
                        </h3>
                        <span className="badge badge-accent">
                          {catFindings.length} of {totalCatFindings.length} {totalCatFindings.length === 1 ? 'FINDING' : 'FINDINGS'}
                        </span>
                      </div>

                      {isFound && <span className="badge badge-success">DISCLOSED</span>}
                      {isUnclear && <span className="badge badge-warning">AMBIGUOUS / UNCLEAR</span>}
                      {!isFound && !isUnclear && (
                        <span className="badge badge-neutral">NO MATCHING DISCLOSURES DETECTED</span>
                      )}
                    </div>

                    <p className="category-summary">{cat.summary}</p>

                    {/* Findings list */}
                    {catFindings.length > 0 ? (
                      <div className="category-findings-list">
                        {catFindings.map((finding) => {
                          const isExpanded = !!expandedFindings[finding.id];
                          const expl = finding.explanation || getClientRuleExplanation(finding.ruleId);
                          const aiState = aiExplanations[finding.id] || {};

                          return (
                            <div key={finding.id} className="finding-card">
                              <div className="finding-header">
                                <div className="finding-title-row">
                                  <span className="finding-title">{finding.title}</span>
                                </div>
                                <span className={`status-chip ${finding.matchType === 'vague' ? 'status-unclear' : 'status-found'}`}>
                                  {finding.matchType === 'vague' ? 'Ambiguous' : 'Disclosed'}
                                </span>
                              </div>

                              {/* Plain Language Summary */}
                              <div className="finding-plain-summary">
                                <strong>What this means:</strong> {expl?.simpleMeaning || finding.title}
                              </div>

                              {/* Verbatim Evidence Citation */}
                              {finding.evidence && (
                                <div className="finding-evidence-box">
                                  <div className="evidence-header-row">
                                    <span className="evidence-label">Original Policy Citation</span>
                                  </div>
                                  <blockquote className="evidence-quote">
                                    &ldquo;{finding.evidence}&rdquo;
                                  </blockquote>
                                </div>
                              )}

                              {/* Action Controls */}
                              <div className="finding-actions-row no-print">
                                <button
                                  type="button"
                                  className="btn-text-action"
                                  onClick={() => toggleFinding(finding.id)}
                                  aria-expanded={isExpanded}
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'Plain-Language Breakdown'}</span>
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </button>

                                <button
                                  type="button"
                                  className="btn-text-action"
                                  onClick={() => toggleTechDetails(finding.id)}
                                  aria-expanded={!!expandedTechDetails[finding.id]}
                                >
                                  <span>{expandedTechDetails[finding.id] ? 'Hide Technical Details' : 'Technical Details'}</span>
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{ transform: expandedTechDetails[finding.id] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                                  >
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </button>

                                <button
                                  type="button"
                                  className="btn-ai-explain"
                                  onClick={() => handleRequestAiExplanation(finding, expl)}
                                  disabled={aiState.loading}
                                >
                                  {aiState.loading ? (
                                    <span>Generating Insights...</span>
                                  ) : (
                                    <>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                      </svg>
                                      <span>Explain with AI</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Expanded Technical Citation Details */}
                              {expandedTechDetails[finding.id] && (
                                <div className="finding-tech-details-box">
                                  <div className="tech-meta-row">
                                    <span className="tech-meta-label">Rule Identifier:</span>
                                    <code className="tech-meta-code">{finding.ruleId}</code>
                                  </div>
                                  {finding.startOffset !== undefined && finding.endOffset !== undefined && (
                                    <div className="tech-meta-row">
                                      <span className="tech-meta-label">Character Offsets:</span>
                                      <span className="tech-meta-val">Chars {finding.startOffset} to {finding.endOffset}</span>
                                    </div>
                                  )}
                                  <div className="tech-meta-row">
                                    <span className="tech-meta-label">Classification Strength:</span>
                                    <span className="tech-meta-val">{finding.confidence || 'MODERATE'}</span>
                                  </div>
                                </div>
                              )}

                              {/* Expanded 5-Dimension Explanation */}
                              {isExpanded && expl && (
                                <div className="finding-expanded-details">
                                  {expl.consumerAction && (
                                    <div className="detail-item">
                                      <span className="detail-label">What to look out for:</span>
                                      <p className="detail-text">{expl.consumerAction}</p>
                                    </div>
                                  )}
                                  {expl.summary && (
                                    <div className="detail-item">
                                      <span className="detail-label">Operational Context:</span>
                                      <p className="detail-text">{expl.summary}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Supplementary AI Explanation Result */}
                              {aiState.data && (
                                <div className="finding-ai-box">
                                  <div className="ai-box-header">
                                    <span className="ai-badge">AI SUPPLEMENTARY INSIGHT</span>
                                    <span className="ai-guardrail-tag">Verbatim Quote Verified</span>
                                  </div>
                                  <p className="ai-box-text">{aiState.data.explanation}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="category-empty-findings">
                        <span>No disclosures matching current filter criteria in this category.</span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {/* Sidebar Overview */}
            <aside className="report-sidebar">
              <div className="sidebar-card">
                <h4 className="sidebar-title">Audit Denominator</h4>
                <p className="sidebar-desc">
                  PrivacyLens tests 28 predefined deterministic checks across all documents.
                </p>
                <div className="sidebar-stat-row">
                  <span>Total Rules Evaluated:</span>
                  <strong>28 Rules</strong>
                </div>
                <div className="sidebar-stat-row">
                  <span>Categories Scanned:</span>
                  <strong>5 Categories</strong>
                </div>
              </div>

              <div className="sidebar-card">
                <h4 className="sidebar-title">Evidence Slicing Invariant</h4>
                <p className="sidebar-desc">
                  Every evidence quote is anchored to original document offsets:
                </p>
                <code className="sidebar-code-pill">
                  text.slice(start, end) === evidence
                </code>
              </div>
            </aside>
          </div>
        )}

        {/* View Mode 2: Dense Audit Table View */}
        {viewMode === 'table' && (
          <div className="findings-table-container" role="region" aria-label="Dense Findings Audit Table">
            <table className="dense-audit-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Rule ID</th>
                  <th>Finding Title</th>
                  <th>Status</th>
                  <th>Character Offsets</th>
                  <th>Verbatim Evidence Quote</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((finding) => (
                  <tr key={finding.id} className="audit-tbody-row">
                    <td>
                      <span className="table-cat-pill">{finding.category}</span>
                    </td>
                    <td>
                      <code className="table-rule-code">{finding.ruleId}</code>
                    </td>
                    <td className="table-td-title">
                      <strong>{finding.title}</strong>
                    </td>
                    <td>
                      <span className={`status-chip ${finding.matchType === 'vague' ? 'status-unclear' : 'status-found'}`}>
                        {finding.matchType === 'vague' ? 'Ambiguous' : 'Disclosed'}
                      </span>
                    </td>
                    <td className="table-td-offsets">
                      {finding.startOffset !== undefined && finding.endOffset !== undefined ? (
                        <code className="evidence-offsets">{finding.startOffset}–{finding.endOffset}</code>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="table-td-quote">
                      <span className="evidence-quote">&ldquo;{finding.evidence}&rdquo;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Save Analysis to MongoDB Modal */}
        {isSaveModalOpen && (
          <div className="save-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="save-modal-title">
            <div className="save-modal-card">
              <div className="save-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <h3 id="save-modal-title" className="save-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
                    Save Analysis Snapshot to MongoDB
                  </h3>
                </div>
                <button
                  type="button"
                  className="save-modal-close"
                  onClick={() => setIsSaveModalOpen(false)}
                  aria-label="Close save dialog"
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>

              <div className="save-modal-body" style={{ padding: '1.25rem 0' }}>
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label htmlFor="save-report-title-input" style={{ display: 'block', fontSize: '0.9rem', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                    Report Title / Policy Name
                  </label>
                  <input
                    id="save-report-title-input"
                    type="text"
                    className="input-field"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    maxLength={120}
                    placeholder="e.g. Acme SaaS Privacy Policy"
                    style={{ width: '100%', padding: '0.75rem 1rem', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div className="save-disclosure-card" style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: 'var(--space-4)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', margin: '0 0 0.4rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🔒 Privacy &amp; Data Storage Disclosure
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>
                    <strong>What will be stored:</strong> Report title, analysis creation date, summary outcome counts (Found: {foundCount}, Unclear: {unclearCount}), 28-rule disclosure findings, and brief evidence quotations.
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-secondary)' }}>
                    <strong>What is NEVER stored:</strong> Full raw policy text is not saved. Your report is linked strictly to an anonymous browser client token. No other user can access or list your saved analyses.
                  </p>
                  <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                    <strong>Your control:</strong> You can permanently delete this record from the database at any time from the Saved Reports section below.
                  </p>
                </div>

                <div className="save-consent-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 'var(--space-4)' }}>
                  <input
                    id="checkbox-save-consent"
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    style={{ marginTop: '0.25rem', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="checkbox-save-consent" style={{ fontSize: '0.875rem', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                    <strong>I give explicit consent</strong> to store this analysis summary and finding citations in the MongoDB database according to the disclosure above.
                  </label>
                </div>

                {saveError && (
                  <div className="status-alert error" style={{ marginBottom: 'var(--space-4)' }} role="alert">
                    <strong>Error:</strong> {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="status-alert success" style={{ marginBottom: 'var(--space-4)' }} role="alert">
                    <strong>Success:</strong> Analysis report saved to MongoDB! You can view and reload it in the Saved Reports section below.
                  </div>
                )}
              </div>

              <div className="save-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsSaveModalOpen(false)}
                >
                  {saveSuccess ? 'Close' : 'Cancel'}
                </button>
                {!saveSuccess && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveToDatabase}
                    disabled={!consentChecked || isSaving}
                    id="btn-confirm-save-analysis"
                  >
                    {isSaving ? 'Saving to Database...' : 'Confirm & Save Report'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default ReportPreview;

