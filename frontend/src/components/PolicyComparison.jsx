import React, { useState } from 'react';
import { computePolicyDiff, SAMPLE_POLICY_V1, SAMPLE_POLICY_V2 } from '../utils/policyDiff.js';

/**
 * Policy Comparison & Version Diff Component
 *
 * Compares two explicitly supplied policy text versions and highlights additions,
 * removals, and unchanged text.
 *
 * Acceptance Criteria & Invariants:
 * - Accepts two explicitly supplied policy text versions using existing textarea patterns.
 * - Shows additions, removals, and unchanged text clearly.
 * - Preserves original wording without hallucinating edits.
 * - Avoids claiming textual differences represent legal or privacy risk changes.
 * - Zero scraping, zero remote fetching, zero file uploads, zero persistence.
 */
export function PolicyComparison() {
  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'split'
  const [errorMessage, setErrorMessage] = useState(null);

  const MAX_CHARS = 50000;

  const handleCompare = () => {
    if (!versionA.trim() && !versionB.trim()) {
      setErrorMessage('Please provide policy text in at least one version to perform a comparison.');
      setDiffResult(null);
      return;
    }

    if (versionA.length > MAX_CHARS || versionB.length > MAX_CHARS) {
      setErrorMessage(`Policy versions cannot exceed ${MAX_CHARS.toLocaleString()} characters.`);
      setDiffResult(null);
      return;
    }

    setErrorMessage(null);
    const result = computePolicyDiff(versionA, versionB);
    setDiffResult(result);
  };

  const handleLoadSample = () => {
    setVersionA(SAMPLE_POLICY_V1);
    setVersionB(SAMPLE_POLICY_V2);
    setErrorMessage(null);
    const result = computePolicyDiff(SAMPLE_POLICY_V1, SAMPLE_POLICY_V2);
    setDiffResult(result);
  };

  const handleClear = () => {
    setVersionA('');
    setVersionB('');
    setDiffResult(null);
    setErrorMessage(null);
  };

  return (
    <section
      id="version-diff"
      className="policy-comparison-section"
      role="region"
      aria-labelledby="comparison-heading"
    >
      <div className="section-header">
        <div className="section-tag">Version Intelligence</div>
        <h3 id="comparison-heading" className="section-title">
          Policy Version Comparison &amp; Change Inspector
        </h3>
        <p className="section-description">
          Compare two versions of a privacy policy to inspect changes, new data practices, or removed user rights between revisions.
        </p>
      </div>

      {/* Prominent Educational & Legal Notice */}
      <div className="diff-notice-banner" role="note">
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
        <div className="diff-notice-text">
          <strong>Non-Legal Comparative Notice:</strong> Highlighted differences reflect textual wording changes between the two versions you supply.
          Textual alterations do not inherently denote changes in legal compliance, enforceability, or actual organization conduct.
          PrivacyLens performs automated text comparison and does not offer legal advice.
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="comparison-toolbar">
        <div className="toolbar-left">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLoadSample}
            id="btn-diff-load-sample"
          >
            Load Sample Comparison
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleClear}
            id="btn-diff-clear"
          >
            Clear Text
          </button>
        </div>
        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleCompare}
            id="btn-diff-compare"
          >
            Compare Versions
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="diff-error-banner" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Side-by-Side Input Workspace */}
      <div className="diff-input-grid">
        <div className="diff-input-pane">
          <div className="pane-header">
            <span className="pane-title">Version A (Baseline / Older)</span>
            <span className="pane-char-count">
              {versionA.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
            </span>
          </div>
          <textarea
            className="diff-textarea"
            value={versionA}
            onChange={(e) => setVersionA(e.target.value)}
            placeholder="Paste original or prior privacy policy text here..."
            rows={10}
            aria-label="Version A baseline privacy policy text"
          />
        </div>

        <div className="diff-input-pane">
          <div className="pane-header">
            <span className="pane-title">Version B (Updated / Newer)</span>
            <span className="pane-char-count">
              {versionB.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
            </span>
          </div>
          <textarea
            className="diff-textarea"
            value={versionB}
            onChange={(e) => setVersionB(e.target.value)}
            placeholder="Paste updated or current privacy policy text here..."
            rows={10}
            aria-label="Version B updated privacy policy text"
          />
        </div>
      </div>

      {/* Comparison Results Area */}
      {diffResult && (
        <div className="diff-results-card" aria-live="polite">
          <div className="diff-results-header">
            <div>
              <h4 className="results-title">Comparison Results</h4>
              <p className="results-subtitle">
                Textual changes detected between Version A and Version B.
              </p>
            </div>
            <div className="diff-view-toggle-group" role="group" aria-label="Diff view format">
              <button
                type="button"
                className={`btn-toggle-view ${viewMode === 'unified' ? 'active' : ''}`}
                onClick={() => setViewMode('unified')}
                aria-pressed={viewMode === 'unified'}
              >
                Unified View
              </button>
              <button
                type="button"
                className={`btn-toggle-view ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => setViewMode('split')}
                aria-pressed={viewMode === 'split'}
              >
                Side-by-Side View
              </button>
            </div>
          </div>

          {/* Diff Metrics Bar */}
          <div className="diff-metrics-bar">
            <div className="diff-metric-item metric-added">
              <span className="metric-label">Added Wording:</span>
              <span className="metric-val">+{diffResult.stats.addedWords} words</span>
            </div>
            <div className="diff-metric-item metric-removed">
              <span className="metric-label">Removed Wording:</span>
              <span className="metric-val">-{diffResult.stats.removedWords} words</span>
            </div>
            <div className="diff-metric-item metric-unchanged">
              <span className="metric-label">Unchanged Baseline:</span>
              <span className="metric-val">{diffResult.stats.unchangedWords} words</span>
            </div>
            <div className="diff-metric-item metric-similarity">
              <span className="metric-label">Textual Similarity:</span>
              <span className="metric-val">{diffResult.stats.similarityPercent}%</span>
            </div>
          </div>

          {/* Unified Diff View */}
          {viewMode === 'unified' && (
            <div className="diff-content-panel unified-diff-panel">
              <pre className="diff-pre-wrap">
                {diffResult.diffs.map((part, index) => {
                  if (part.type === 'added') {
                    return (
                      <ins key={index} className="diff-added" title="Added in Version B">
                        {part.text}
                      </ins>
                    );
                  }
                  if (part.type === 'removed') {
                    return (
                      <del key={index} className="diff-removed" title="Removed from Version A">
                        {part.text}
                      </del>
                    );
                  }
                  return <span key={index} className="diff-unchanged">{part.text}</span>;
                })}
              </pre>
            </div>
          )}

          {/* Side-by-Side Split Diff View */}
          {viewMode === 'split' && (
            <div className="split-diff-panel">
              <div className="split-pane split-pane-left">
                <div className="split-pane-header">Version A (Baseline with Deletions)</div>
                <pre className="diff-pre-wrap">
                  {diffResult.diffs.map((part, index) => {
                    if (part.type === 'removed') {
                      return <del key={index} className="diff-removed">{part.text}</del>;
                    }
                    if (part.type === 'unchanged') {
                      return <span key={index} className="diff-unchanged">{part.text}</span>;
                    }
                    return null;
                  })}
                </pre>
              </div>

              <div className="split-pane split-pane-right">
                <div className="split-pane-header">Version B (Updated with Insertions)</div>
                <pre className="diff-pre-wrap">
                  {diffResult.diffs.map((part, index) => {
                    if (part.type === 'added') {
                      return <ins key={index} className="diff-added">{part.text}</ins>;
                    }
                    if (part.type === 'unchanged') {
                      return <span key={index} className="diff-unchanged">{part.text}</span>;
                    }
                    return null;
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default PolicyComparison;

