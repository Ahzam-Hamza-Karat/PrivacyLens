import React, { useState, useEffect, forwardRef } from 'react';
import { MAX_POLICY_LENGTH, WARNING_POLICY_LENGTH, SAMPLE_POLICY } from '../utils/constants';

/**
 * Redesigned Policy Analyzer Workspace Component
 * Studio-grade text input, real-time character counter, keyboard shortcuts,
 * progress feedback during analysis, and clear validation messaging.
 */
export const PolicyAnalyzer = forwardRef(function PolicyAnalyzer(
  { policyText, onTextChange, onLoadSample, onClearText, onAnalyze, isAnalyzing, analysisError },
  ref
) {
  const [validationState, setValidationState] = useState({
    type: null, // 'error' | 'warning' | 'info' | 'success' | null
    title: '',
    message: '',
  });

  const charCount = policyText ? policyText.length : 0;
  const isWarning = charCount >= WARNING_POLICY_LENGTH && charCount < MAX_POLICY_LENGTH;
  const isError = charCount > MAX_POLICY_LENGTH;
  const percentage = Math.min(100, Math.round((charCount / MAX_POLICY_LENGTH) * 100));

  // Sync external analysis error from API into the alert view
  useEffect(() => {
    if (analysisError) {
      setValidationState({
        type: 'error',
        title: 'Analysis Execution Error',
        message: analysisError,
      });
    }
  }, [analysisError]);

  // When sample is loaded
  useEffect(() => {
    if (policyText === SAMPLE_POLICY) {
      setValidationState({
        type: 'info',
        title: 'Sample Policy Loaded (3,128 characters)',
        message:
          'Demonstration privacy agreement inserted. Review or customize the text, then click "Run Deterministic Analysis" (or press Ctrl + Enter).',
      });
    }
  }, [policyText]);

  const handleInputChange = (e) => {
    onTextChange(e.target.value);
    if (validationState.type === 'error') {
      setValidationState({ type: null, title: '', message: '' });
    }
  };

  const handleClear = () => {
    if (policyText && policyText.length > 200) {
      if (!window.confirm('Are you sure you want to clear the policy text? Your entered agreement will be removed.')) {
        return;
      }
    }
    onClearText();
    setValidationState({
      type: null,
      title: '',
      message: '',
    });
  };

  const handleLoadSampleClick = () => {
    onLoadSample();
    setValidationState({
      type: 'info',
      title: 'Sample Policy Loaded (3,128 characters)',
      message:
        'Demonstration privacy agreement inserted. Review or customize the text, then click "Run Deterministic Analysis" (or press Ctrl + Enter).',
    });
  };

  const handleAnalyzeClick = () => {
    const trimmed = policyText ? policyText.trim() : '';

    if (!trimmed) {
      setValidationState({
        type: 'error',
        title: 'Input Document Required',
        message:
          'Please paste or enter privacy agreement text before running analysis. Empty submissions cannot be analyzed.',
      });
      return;
    }

    if (charCount > MAX_POLICY_LENGTH) {
      setValidationState({
        type: 'error',
        title: 'Payload Limit Exceeded',
        message: `Your document contains ${charCount.toLocaleString()} characters, exceeding the strict ${MAX_POLICY_LENGTH.toLocaleString()} character ceiling. Please reduce the length before submitting.`,
      });
      return;
    }

    setValidationState({ type: null, title: '', message: '' });

    if (onAnalyze) {
      onAnalyze(policyText);
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run analysis
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isAnalyzing) {
        handleAnalyzeClick();
      }
    }
  };

  return (
    <section id="analyzer" className="content-section analyzer-section-root" aria-labelledby="analyzer-title">
      <div className="app-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-step-indicator">
            <span className="step-label">POLICY ANALYZER</span>
          </div>
          <h2 id="analyzer-title" className="section-title">
            Analyze a Privacy Policy
          </h2>
          <p className="section-subtitle">
            PrivacyLens evaluates the wording of any privacy agreement or terms of service against 28 deterministic pattern-matching rules. Results reflect disclosures detected in the supplied text, not independently verified company behavior.
          </p>
        </div>

        {/* Studio Editor Card */}
        <div className="analyzer-studio-card">
          {/* Editor Header Toolbar */}
          <div className="studio-toolbar">
            <div className="toolbar-left-group">
              <span className="editor-tab-badge active">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Text Input
              </span>
              <span className="editor-format-guide">
                Plain text • Up to {MAX_POLICY_LENGTH.toLocaleString()} characters
              </span>
            </div>

            <div className="toolbar-right-group">
              <button
                type="button"
                className="studio-btn studio-btn-secondary"
                onClick={handleLoadSampleClick}
                disabled={isAnalyzing}
                id="btn-load-sample"
                title="Load a demonstration privacy policy"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>Load Sample Policy</span>
              </button>

              <button
                type="button"
                className="studio-btn studio-btn-outline"
                onClick={handleClear}
                disabled={!policyText || isAnalyzing}
                id="btn-clear-text"
                title="Clear current text"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Clear Text</span>
              </button>
            </div>
          </div>

          {/* Main Textarea Input */}
          <div className="studio-editor-wrapper">
            <label htmlFor="policy-textarea" className="visually-hidden">
              Privacy Policy Text Input
            </label>
            <textarea
              id="policy-textarea"
              ref={ref}
              className={`studio-textarea ${isError ? 'has-error' : isWarning ? 'has-warning' : ''}`}
              placeholder="Paste the full text of any privacy policy, terms of service, or user consent agreement here..."
              value={policyText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={14}
              disabled={isAnalyzing}
              aria-describedby="counter-text"
              aria-invalid={isError ? 'true' : 'false'}
            />

            {/* Keyboard shortcut hint overlay */}
            <div className="textarea-shortcut-hint" aria-hidden="true">
              <span>Press <strong>Ctrl + Enter</strong> to analyze</span>
            </div>
          </div>

          {/* Studio Footer Bar: Capacity Meter & Primary Action */}
          <div className="studio-footer-bar">
            {/* Left: Capacity Counter & Progress Track */}
            <div className="studio-capacity-meter">
              <div
                id="counter-text"
                className={`capacity-row ${isError ? 'error' : isWarning ? 'warning' : ''}`}
                aria-live="polite"
              >
                <span className="capacity-numbers">
                  <strong>{charCount.toLocaleString()}</strong> / {MAX_POLICY_LENGTH.toLocaleString()} characters
                  {isError && ' (Limit Exceeded)'}
                  {isWarning && ' (Approaching Limit)'}
                </span>
                <span className="capacity-percent">{percentage}% capacity</span>
              </div>

              <div className="capacity-track" aria-hidden="true">
                <div
                  className={`capacity-fill ${isError ? 'error' : isWarning ? 'warning' : ''}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Right: Primary Action Button */}
            <div className="studio-action-cell">
              <button
                type="button"
                className="btn btn-primary btn-lg studio-btn-analyze"
                onClick={handleAnalyzeClick}
                disabled={isAnalyzing || !policyText || !policyText.trim() || isError}
                id="btn-analyze-policy"
              >
                {isAnalyzing ? (
                  <>
                    <svg
                      className="btn-spinner"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                    <span>Evaluating 28 Rules...</span>
                  </>
                ) : (
                  <>
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
                    <span>Analyze Privacy Policy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time In-Progress Indicator during analysis */}
          {isAnalyzing && (
            <div className="analysis-progress-panel" role="status" aria-live="polite">
              <div className="progress-status-indicator">
                <span className="step-spinner" aria-hidden="true" />
                <span>Evaluating document against 28 deterministic pattern-matching rules across 5 categories...</span>
              </div>
            </div>
          )}

          {/* Validation & Information Alerts */}
          {validationState.type && !isAnalyzing && (
            <div
              className={`status-alert ${validationState.type}`}
              role={validationState.type === 'error' ? 'alert' : 'status'}
            >
              <div className="status-icon" aria-hidden="true">
                {validationState.type === 'error' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {validationState.type === 'info' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>
              <div className="status-content">
                <div className="status-title">{validationState.title}</div>
                <div className="status-message">{validationState.message}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
});

export default PolicyAnalyzer;
