import React from 'react';

/**
 * Footer Component
 * Provides brand identity, section navigation, academic attribution, and legal disclaimer.
 */
export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="app-container">
        <div className="footer-top">
          <div>
            <a href="#" className="brand-link" aria-label="PrivacyLens — back to top" style={{ marginBottom: 'var(--space-2)' }}>
              <div className="brand-icon-wrapper" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <circle cx="11" cy="11" r="3" />
                </svg>
              </div>
              <span className="brand-name">PrivacyLens</span>
            </a>
            <p className="footer-brand-desc">
              Plain-language explanations, evidence-backed findings, and transparent privacy policy intelligence.
            </p>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-title">Navigation</div>
            <a href="#analyzer" className="footer-nav-link">
              Policy Analyzer
            </a>
            <a href="#preview" className="footer-nav-link">
              Findings Report
            </a>
            <a href="#cookie-center" className="footer-nav-link">
              Cookie Center
            </a>
            <a href="#chatbot" className="footer-nav-link">
              Policy Chatbot
            </a>
            <a href="#version-diff" className="footer-nav-link">
              Version Diff
            </a>
            <a href="#how-it-works" className="footer-nav-link">
              Methodology
            </a>
            <a href="#diagnostic" className="footer-nav-link">
              System Status
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p style={{ margin: 0 }}>
            &copy; {new Date().getFullYear()} PrivacyLens. Academic Web Technology Project.
          </p>
          <p style={{ margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            <strong>Legal Disclaimer:</strong> PrivacyLens is an informational and educational analysis platform. It does not provide formal legal advice, compliance certifications, or statutory audit ratings.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
