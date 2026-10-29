import React, { useState, useEffect } from 'react';
import { checkBackendHealth, getAiStatus, getDatabaseStatus } from '../services/api';

/**
 * Diagnostic & System Health Component
 * Monitors backend API connectivity, external AI configuration, and MongoDB persistence status,
 * ensuring all architecture layers and graceful degradation states are transparently visible.
 */
export function DiagnosticCard() {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const [aiStatus, setAiStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const [dbStatus, setDbStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const performHealthChecks = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true, error: null }));
    setAiStatus((prev) => ({ ...prev, loading: true, error: null }));
    setDbStatus((prev) => ({ ...prev, loading: true, error: null }));

    // Run parallel checks
    const [healthResult, aiResult, dbResult] = await Promise.all([
      checkBackendHealth(),
      getAiStatus(),
      getDatabaseStatus(),
    ]);

    if (healthResult.success) {
      setHealthStatus({
        loading: false,
        data: healthResult.data,
        error: null,
      });
    } else {
      setHealthStatus({
        loading: false,
        data: null,
        error: healthResult.error,
      });
    }

    if (aiResult.success) {
      setAiStatus({
        loading: false,
        data: aiResult.data,
        error: null,
      });
    } else {
      setAiStatus({
        loading: false,
        data: null,
        error: aiResult.error,
      });
    }

    if (dbResult.success) {
      setDbStatus({
        loading: false,
        data: dbResult.data,
        error: null,
      });
    } else {
      setDbStatus({
        loading: false,
        data: null,
        error: dbResult.error,
      });
    }
  };

  useEffect(() => {
    performHealthChecks();
  }, []);

  return (
    <section id="diagnostic" className="content-section" aria-labelledby="diag-title">
      <div className="app-container">
        <div className="section-header">
          <span className="section-tag">TECHNICAL SPECIFICATIONS</span>
          <h2 id="diag-title" className="section-title">
            System Architecture &amp; Service Health
          </h2>
          <p className="section-subtitle">
            Real-time status of the Express API backend, MongoDB persistence layer, and external AI configuration.
          </p>
        </div>

        <div className="diagnostic-grid-container">
          {/* Card 1: Backend REST API Health */}
          <div className="diagnostic-card">
            <div className="diagnostic-header">
              <div>
                <h3 className="diagnostic-title">
                  Backend REST API Service
                </h3>
                <p className="diagnostic-subtitle">
                  Express API on port 5000 with defensive security headers, input bounds, and deterministic rule evaluation.
                </p>
              </div>

              <div>
                {healthStatus.loading && (
                  <span className="status-pill loading" role="status">
                    <span className="status-dot" />
                    Checking API...
                  </span>
                )}
                {!healthStatus.loading && healthStatus.data && (
                  <span className="status-pill healthy" role="status">
                    <span className="status-dot" />
                    Backend Healthy
                  </span>
                )}
                {!healthStatus.loading && healthStatus.error && (
                  <span className="status-pill error" role="status">
                    <span className="status-dot" />
                    Connection Offline
                  </span>
                )}
              </div>
            </div>

            {healthStatus.data && (
              <div className="diagnostic-meta-grid">
                <div className="diag-meta-item">
                  <span className="diag-meta-label">Service:</span>
                  <span className="diag-meta-val">{healthStatus.data.service || 'PrivacyLens API'}</span>
                </div>
                <div className="diag-meta-item">
                  <span className="diag-meta-label">Version:</span>
                  <span className="diag-meta-val">v{healthStatus.data.version || '1.0.0'}</span>
                </div>
                <div className="diag-meta-item">
                  <span className="diag-meta-label">Environment:</span>
                  <span className="diag-meta-val">{healthStatus.data.environment || 'development'}</span>
                </div>
                <div className="diag-meta-item">
                  <span className="diag-meta-label">Uptime:</span>
                  <span className="diag-meta-val">{healthStatus.data.uptimeSeconds ? `${healthStatus.data.uptimeSeconds}s` : 'Active'}</span>
                </div>
              </div>
            )}

            {healthStatus.error && (
              <div className="status-alert error" role="alert">
                <strong>Backend Connection Error:</strong> {healthStatus.error}. Ensure the Express server is running on port 5000.
              </div>
            )}
          </div>

          {/* Card 2: AI Provider & Fallback Status */}
          <div className="diagnostic-card">
            <div className="diagnostic-header">
              <div>
                <h3 className="diagnostic-title">
                  AI Insight Provider
                </h3>
                <p className="diagnostic-subtitle">
                  Supplementary explanations and grounded chat. Fallback mode active when unconfigured.
                </p>
              </div>

              <div>
                {aiStatus.loading && (
                  <span className="status-pill loading" role="status">
                    <span className="status-dot" />
                    Checking AI...
                  </span>
                )}
                {!aiStatus.loading && aiStatus.data?.configured && (
                  <span className="status-pill healthy" role="status">
                    <span className="status-dot" />
                    AI Connected ({aiStatus.data.model || 'gpt-4o-mini'})
                  </span>
                )}
                {!aiStatus.loading && !aiStatus.data?.configured && (
                  <span className="status-pill warning" role="status">
                    <span className="status-dot" />
                    Fallback Mode Active
                  </span>
                )}
              </div>
            </div>

            <div className="diagnostic-meta-grid">
              <div className="diag-meta-item">
                <span className="diag-meta-label">Deterministic Analysis:</span>
                <span className="diag-meta-val" style={{ color: 'var(--color-success)' }}>100% Active (Local)</span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">AI Chat &amp; Insights:</span>
                <span className="diag-meta-val">
                  {aiStatus.data?.configured ? 'Live AI Enabled' : 'Deterministic Fallback Active'}
                </span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">Model Target:</span>
                <span className="diag-meta-val">{aiStatus.data?.model || 'gpt-4o-mini'}</span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">External Transmission:</span>
                <span className="diag-meta-val">
                  {aiStatus.data?.configured ? 'On explicit button click only' : 'Zero external API calls'}
                </span>
              </div>
            </div>

            <div className="diag-notice-box">
              <small>
                <strong>Architecture Notice:</strong> The 28 deterministic privacy rules, evidence offset slicing, doughnut distribution chart, cookie simulator, and policy diff operate entirely locally in Node.js/React. External AI is strictly supplementary for on-demand inquiries.
              </small>
            </div>
          </div>

          {/* Card 3: MongoDB Persistence Database */}
          <div className="diagnostic-card">
            <div className="diagnostic-header">
              <div>
                <h3 className="diagnostic-title">
                  MongoDB Persistence Service
                </h3>
                <p className="diagnostic-subtitle">
                  Optional report history with explicit user consent and hashed client-token access control.
                </p>
              </div>

              <div>
                {dbStatus.loading && (
                  <span className="status-pill loading" role="status">
                    <span className="status-dot" />
                    Checking Database...
                  </span>
                )}
                {!dbStatus.loading && dbStatus.data?.connected && (
                  <span className="status-pill healthy" role="status">
                    <span className="status-dot" />
                    MongoDB Connected
                  </span>
                )}
                {!dbStatus.loading && !dbStatus.data?.connected && (
                  <span className="status-pill warning" role="status">
                    <span className="status-dot" />
                    Database Offline / Unconfigured
                  </span>
                )}
              </div>
            </div>

            <div className="diagnostic-meta-grid">
              <div className="diag-meta-item">
                <span className="diag-meta-label">Storage Engine:</span>
                <span className="diag-meta-val">MongoDB Official Driver</span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">Target Database:</span>
                <span className="diag-meta-val">{dbStatus.data?.databaseName || 'privacylens'}</span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">Persistence Model:</span>
                <span className="diag-meta-val">Optional (Explicit Consent Required)</span>
              </div>
              <div className="diag-meta-item">
                <span className="diag-meta-label">Access Control:</span>
                <span className="diag-meta-val" style={{ color: 'var(--color-primary)' }}>
                  Hashed Client Token (Zero Public Leakage)
                </span>
              </div>
            </div>

            <div className="diag-notice-box">
              <small>
                <strong>Graceful Degradation:</strong> If MongoDB is offline or unconfigured, real-time transient analysis remains 100% active. Analysis report saving is temporarily disabled until the database is available.
              </small>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
          <button
            id="btn-recheck-health"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={performHealthChecks}
            disabled={healthStatus.loading || aiStatus.loading || dbStatus.loading}
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
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{healthStatus.loading ? 'Checking System...' : 'Re-check All Diagnostics'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export default DiagnosticCard;
