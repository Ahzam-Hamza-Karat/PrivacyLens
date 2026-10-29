import React, { useState, useEffect } from 'react';
import {
  listSavedAnalyses,
  getSavedAnalysis,
  deleteSavedAnalysis,
  getDatabaseStatus,
} from '../services/api';

/**
 * Saved Analyses Section Component
 * Displays MongoDB-persisted privacy policy analysis history with privacy disclosures,
 * client-token access scoping, permanent deletion controls, and dashboard re-loading.
 */
export function SavedAnalysesSection({ onLoadSavedReport, refreshTrigger }) {
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ connected: false, loading: true });
  const [actionMessage, setActionMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    const [dbResult, reportsResult] = await Promise.all([
      getDatabaseStatus(),
      listSavedAnalyses(),
    ]);

    if (dbResult.success && dbResult.data) {
      setDbStatus({ connected: dbResult.data.connected, loading: false });
    } else {
      setDbStatus({ connected: false, loading: false });
    }

    if (reportsResult.success && Array.isArray(reportsResult.data)) {
      setSavedReports(reportsResult.data);
    } else {
      setSavedReports([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" from the database?`)) {
      return;
    }

    setDeletingId(id);
    setActionMessage(null);

    const result = await deleteSavedAnalysis(id);
    setDeletingId(null);

    if (result.success) {
      setSavedReports((prev) => prev.filter((r) => r.id !== id));
      setActionMessage({
        type: 'success',
        text: `Report "${title}" was permanently deleted from MongoDB.`,
      });
      setTimeout(() => setActionMessage(null), 5000);
    } else {
      setActionMessage({
        type: 'error',
        text: result.error || 'Failed to delete saved report.',
      });
    }
  };

  const handleLoad = async (id) => {
    setLoadingId(id);
    setActionMessage(null);

    const result = await getSavedAnalysis(id);
    setLoadingId(null);

    if (result.success && result.data) {
      // Reconstitute into report preview format
      const reportData = {
        metadata: {
          characterCount: result.data.policyLength || 0,
          paragraphCount: 1,
          segmentCount: result.data.findings?.length || 0,
          analyzedAt: result.data.createdAt,
          isRetrievedFromDatabase: true,
          savedTitle: result.data.title,
        },
        summary: {
          totalFindings: result.data.findings?.length || 0,
          categoriesWithFindingsCount: Object.values(result.data.summary?.categorySummary || {}).filter(
            (c) => (c.found || 0) > 0
          ).length,
          categoriesWithoutFindingsCount: Object.values(result.data.summary?.categorySummary || {}).filter(
            (c) => (c.found || 0) === 0
          ).length,
          overallStatus: {
            found: result.data.summary?.foundCount || 0,
            unclear: result.data.summary?.unclearCount || 0,
            notFound: result.data.summary?.notDetectedCount || 0,
          },
          categoryCounts: result.data.summary?.categorySummary || {},
          keyObservations: [
            `Loaded from MongoDB persistence record (${result.data.title}).`,
            `Originally saved on ${new Date(result.data.createdAt).toLocaleDateString()}.`,
          ],
        },
        findings: (result.data.findings || []).map((f, idx) => ({
          id: `finding-${idx + 1}`,
          ruleId: f.ruleId,
          title: f.ruleName,
          category: f.category,
          status: f.status,
          matchType: f.status === 'unclear' ? 'vague' : 'affirmative',
          confidence: f.confidence || 'MODERATE',
          description: f.explanation,
          evidence: f.evidence,
          startOffset: f.evidenceOffset?.start ?? 0,
          endOffset: f.evidenceOffset?.end ?? (f.evidence?.length || 0),
        })),
        categories: [
          { id: 'data_collection', name: 'Data Collection', status: 'found', summary: 'Personal data items collection', explanation: '', findings: [] },
          { id: 'data_sharing', name: 'Data Sharing & Disclosure', status: 'found', summary: 'Third-party disclosure terms', explanation: '', findings: [] },
          { id: 'cookies_tracking', name: 'Cookies & Tracking', status: 'found', summary: 'Web tracking and cookies', explanation: '', findings: [] },
          { id: 'data_retention', name: 'Data Retention & Deletion', status: 'found', summary: 'Retention duration commitments', explanation: '', findings: [] },
          { id: 'user_rights', name: 'User Rights & Control', status: 'found', summary: 'Access, erasure and opt-out rights', explanation: '', findings: [] },
        ],
      };

      if (onLoadSavedReport) {
        onLoadSavedReport(reportData);
      }
      setActionMessage({
        type: 'success',
        text: `Loaded "${result.data.title}" into the Results Dashboard.`,
      });
      setTimeout(() => setActionMessage(null), 4000);
    } else {
      setActionMessage({
        type: 'error',
        text: result.error || 'Failed to retrieve saved report details.',
      });
    }
  };

  return (
    <section id="saved-reports" className="content-section" aria-labelledby="saved-reports-title">
      <div className="app-container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-step-indicator">
            <span className="step-label">MY SAVED REPORTS</span>
          </div>
          <h2 id="saved-reports-title" className="section-title">
            Saved Analysis Reports
          </h2>
          <p className="section-subtitle">
            Review, inspect, or reload analysis reports you have saved to database history. Records are scoped strictly to an anonymous cryptographic token stored in your browser session, with full deletion control.
          </p>
          <div className="token-storage-notice" style={{ marginTop: 'var(--space-2)', fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-2) var(--space-3)', maxWidth: '720px' }}>
            🔒 <strong>Client-Token Scoping:</strong> Reports are associated with an anonymous identifier in your browser&rsquo;s <code>localStorage</code> rather than a user account. If you clear your browser site data or browse in incognito mode, a new token is generated and previously saved reports will no longer be accessible.
          </div>
        </div>

        {/* Database Status Ribbon & Disclosure */}
        <div className="saved-reports-toolbar">
          <div className="saved-reports-status">
            {dbStatus.loading ? (
              <span className="status-pill loading" role="status">
                <span className="status-dot" />
                Checking MongoDB...
              </span>
            ) : dbStatus.connected ? (
              <span className="status-pill healthy" role="status">
                <span className="status-dot" />
                MongoDB Connected (History Active)
              </span>
            ) : (
              <span className="status-pill warning" role="status">
                <span className="status-dot" />
                Database Offline / Unconfigured
              </span>
            )}
            <span className="saved-reports-count-badge">
              {savedReports.length} {savedReports.length === 1 ? 'Report' : 'Reports'} Saved
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchReports}
            disabled={loading}
            title="Refresh saved reports from MongoDB"
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
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh History'}</span>
          </button>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            className={`status-alert ${actionMessage.type === 'error' ? 'error' : 'success'}`}
            style={{ marginBottom: 'var(--space-4)' }}
            role="alert"
          >
            <strong>{actionMessage.type === 'error' ? 'Notice:' : 'Success:'}</strong> {actionMessage.text}
          </div>
        )}

        {/* Offline Disclaimer Banner if disconnected */}
        {!dbStatus.loading && !dbStatus.connected && (
          <div className="diag-notice-box" style={{ marginBottom: 'var(--space-4)' }}>
            <small>
              <strong>Persistence Notice:</strong> The MongoDB database service is currently unconfigured or offline.
              Real-time policy analysis is fully functional, but saving new audit snapshots to the database is temporarily disabled.
            </small>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          <div className="card text-center" style={{ padding: 'var(--space-8)' }}>
            <span className="status-pill loading">Loading saved reports from MongoDB...</span>
          </div>
        ) : savedReports.length === 0 ? (
          <div className="card empty-state-card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ margin: '0 auto var(--space-4)', width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}>No Saved Analyses Yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '520px', margin: '0 auto var(--space-4)' }}>
              Run a privacy audit in the Analyzer Studio above, then click <strong>&ldquo;Save to Database&rdquo;</strong> in the Results Dashboard to preserve an audit snapshot here.
            </p>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <a href="#analyzer" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Analyze a Policy Now</span>
              </a>
            </div>
            <div className="privacy-disclosure-tagline" style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)' }}>
              🔒 <strong>Privacy Guarantee:</strong> Analyses are saved only upon explicit user consent and scoped to your anonymous client token. Raw policy texts are never stored.
            </div>
          </div>
        ) : (
          <div className="saved-reports-grid">
            {savedReports.map((report) => (
              <div key={report.id} className="card saved-report-card" id={`saved-report-${report.id}`}>
                <div className="saved-report-header">
                  <div>
                    <h3 className="saved-report-title">{report.title}</h3>
                    <span className="saved-report-date">
                      {new Date(report.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="metric-pill status-found">Saved</span>
                </div>

                <div className="saved-report-metrics">
                  <div className="saved-metric-badge found">
                    <strong>{report.summary?.foundCount || 0}</strong> Disclosed
                  </div>
                  <div className="saved-metric-badge unclear">
                    <strong>{report.summary?.unclearCount || 0}</strong> Ambiguous
                  </div>
                  <div className="saved-metric-badge not-detected">
                    <strong>{report.summary?.notDetectedCount || 0}</strong> Undetected
                  </div>
                </div>

                <div className="saved-report-footer">
                  <span className="saved-report-meta-chars">
                    {report.policyLength ? `${report.policyLength.toLocaleString()} characters` : 'Policy Excerpt'}
                  </span>
                  <div className="saved-report-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleLoad(report.id)}
                      disabled={loadingId === report.id}
                      id={`btn-load-saved-${report.id}`}
                      title="Load this report into the Results Dashboard"
                    >
                      {loadingId === report.id ? 'Loading...' : 'Load Report'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(report.id, report.title)}
                      disabled={deletingId === report.id}
                      id={`btn-delete-saved-${report.id}`}
                      title="Permanently delete this report from MongoDB"
                    >
                      {deletingId === report.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default SavedAnalysesSection;

