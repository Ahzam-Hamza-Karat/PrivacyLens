import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from './services/api';

export function App() {
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    data: null,
    error: null,
  });

  const performHealthCheck = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true, error: null }));
    const result = await checkBackendHealth();
    if (result.success) {
      setHealthStatus({
        loading: false,
        data: result.data,
        error: null,
      });
    } else {
      setHealthStatus({
        loading: false,
        data: null,
        error: result.error,
      });
    }
  };

  useEffect(() => {
    performHealthCheck();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <span className="brand-icon" role="img" aria-label="PrivacyLens logo">🔍</span>
          <h1 className="brand-title">PrivacyLens</h1>
        </div>
        <p className="brand-tagline">
          Plain-language explanations, evidence-backed findings, and AI-powered privacy policy insights.
        </p>
        <span className="badge-phase">Phase 1: Project Setup &amp; Architecture</span>
      </header>

      <main>
        <section className="card" aria-labelledby="status-heading">
          <h2 id="status-heading" className="card-title">Development Status</h2>
          <p className="card-description">
            The application is currently in early foundation development. Core architecture,
            proxy routing, Express backend, and React starter application are initialized.
          </p>

          <div className="meta-grid">
            <div className="meta-item">
              <div className="meta-label">Current Phase</div>
              <div className="meta-value">Phase 1 of 10</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Frontend</div>
              <div className="meta-value">React + Vite (JavaScript)</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Backend</div>
              <div className="meta-value">Node.js + Express</div>
            </div>
            <div className="meta-item">
              <div className="meta-label">Database &amp; AI</div>
              <div className="meta-value">Deferred to Later Phases</div>
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="connectivity-heading">
          <h2 id="connectivity-heading" className="card-title">Backend Connectivity Verification</h2>
          <p className="card-description">
            Verifying that the frontend can communicate with the backend via the Vite development proxy
            (<code>GET /api/health</code>).
          </p>

          <button
            id="btn-recheck-health"
            className="button"
            onClick={performHealthCheck}
            disabled={healthStatus.loading}
          >
            {healthStatus.loading ? 'Checking Connection...' : 'Re-check Backend Health'}
          </button>

          {healthStatus.loading && (
            <div className="status-box loading" role="status">
              Connecting to backend via proxy...
            </div>
          )}

          {!healthStatus.loading && healthStatus.data && (
            <div className="status-box success" role="status">
              <strong>Connection Successful: Backend is Healthy</strong>
              <pre>{JSON.stringify(healthStatus.data, null, 2)}</pre>
            </div>
          )}

          {!healthStatus.loading && healthStatus.error && (
            <div className="status-box error" role="alert">
              <strong>Connection Failed:</strong> {healthStatus.error}
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Ensure the Express backend is running on port 5000 (<code>npm run dev:backend</code>).
              </p>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="roadmap-heading">
          <h2 id="roadmap-heading" className="card-title">Development Roadmap</h2>
          <p className="card-description">
            Upcoming phases will introduce the design system, policy text input, clause analysis,
            database storage, and chatbot interface.
          </p>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li><strong>Phase 2:</strong> Design System, UI Components, &amp; Layout</li>
            <li><strong>Phase 3:</strong> Policy Input &amp; Text Processing</li>
            <li><strong>Phase 4:</strong> Rule-based Clause Extraction &amp; Categorization</li>
            <li><strong>Phase 5:</strong> AI Summary Engine &amp; Explanation Generator</li>
            <li><strong>Phase 6:</strong> Database Integration (MongoDB &amp; Mongoose)</li>
            <li><strong>Phase 7:</strong> User Authentication &amp; Saved Reports</li>
            <li><strong>Phase 8:</strong> Interactive Chatbot Assistant</li>
            <li><strong>Phase 9:</strong> Policy Comparison &amp; Risk Scoring</li>
            <li><strong>Phase 10:</strong> Security Hardening &amp; Production Deployment</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        PrivacyLens &copy; {new Date().getFullYear()} &mdash; Phase 1 Technical Smoke-Test Interface
      </footer>
    </div>
  );
}

export default App;
