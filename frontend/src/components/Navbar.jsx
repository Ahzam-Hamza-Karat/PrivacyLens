import React, { useState, useEffect } from 'react';
import { checkBackendHealth } from '../services/api';

/**
 * Professional Consumer-Facing Navigation Bar
 * Features clean brand identity, prioritized user journeys (Analyze, My Reports, Features, How It Works),
 * a single prominent primary CTA button, and an accessible responsive mobile drawer.
 */
export function Navbar({ onNavigateToAnalyzer }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false);
  const [apiHealthy, setApiHealthy] = useState(null);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth()
      .then((res) => {
        if (isMounted) {
          setApiHealthy(Boolean(res.success && res.data?.status === 'healthy'));
        }
      })
      .catch(() => {
        if (isMounted) setApiHealthy(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setFeaturesDropdownOpen(false);
  };

  const handleAnalyzerClick = (e) => {
    closeMobileMenu();
    if (onNavigateToAnalyzer) {
      e.preventDefault();
      onNavigateToAnalyzer();
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="site-header" role="banner">
        <div className="app-container">
          <div className="header-content">
            {/* Brand Logo & Name */}
            <a href="#" className="brand-link" aria-label="PrivacyLens Home">
              <div className="brand-icon-wrapper" aria-hidden="true">
                <svg
                  width="20"
                  height="20"
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

            {/* Desktop Navigation Links */}
            <nav className="nav-desktop" aria-label="Main Navigation">
              <a href="#analyzer" className="nav-link" onClick={handleAnalyzerClick}>
                Analyze
              </a>
              <a href="#saved-reports" className="nav-link">
                My Reports
              </a>

              {/* Features Menu */}
              <div
                className="nav-dropdown-wrapper"
                onMouseEnter={() => setFeaturesDropdownOpen(true)}
                onMouseLeave={() => setFeaturesDropdownOpen(false)}
              >
                <button
                  type="button"
                  className="nav-link nav-dropdown-trigger"
                  aria-expanded={featuresDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setFeaturesDropdownOpen((prev) => !prev)}
                >
                  <span>Features</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`dropdown-chevron ${featuresDropdownOpen ? 'open' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {featuresDropdownOpen && (
                  <div className="nav-dropdown-menu" role="menu">
                    <a
                      href="#cookie-center"
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      <div className="dropdown-item-title">Cookie Center &amp; Simulator</div>
                      <div className="dropdown-item-desc">Understand tracking disclosures and test simulated consent.</div>
                    </a>
                    <a
                      href="#version-diff"
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      <div className="dropdown-item-title">Policy Version Comparison</div>
                      <div className="dropdown-item-desc">Track wording changes, additions, and removals between drafts.</div>
                    </a>
                    <a
                      href="#chatbot"
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      <div className="dropdown-item-title">Policy Q&amp;A Assistant</div>
                      <div className="dropdown-item-desc">Ask questions grounded directly in the analyzed document.</div>
                    </a>
                  </div>
                )}
              </div>

              <a href="#how-it-works" className="nav-link">
                How It Works
              </a>
            </nav>

            {/* Quick Actions & Primary CTA */}
            <div className="header-actions">
              <button
                type="button"
                className="btn btn-primary nav-cta-btn"
                onClick={handleAnalyzerClick}
                id="nav-btn-analyze"
              >
                <svg
                  width="16"
                  height="16"
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
                <span>Analyze a Policy</span>
              </button>

              <button
                type="button"
                className="mobile-menu-toggle"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Accessible Mobile Menu Drawer */}
          {mobileMenuOpen && (
            <nav className="mobile-menu-drawer" aria-label="Mobile Navigation">
              <a href="#analyzer" className="mobile-nav-link" onClick={handleAnalyzerClick}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Analyze a Policy</span>
              </a>
              <a href="#saved-reports" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>My Saved Reports</span>
              </a>
              <a href="#cookie-center" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="8" cy="9" r="1.5" />
                  <circle cx="15" cy="11" r="1.5" />
                  <circle cx="10" cy="15" r="1.5" />
                </svg>
                <span>Cookie Center &amp; Simulator</span>
              </a>
              <a href="#version-diff" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Policy Version Diff</span>
              </a>
              <a href="#chatbot" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Policy Q&amp;A Assistant</span>
              </a>
              <a href="#how-it-works" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <span>How It Works</span>
              </a>
              <a href="#diagnostic" className="mobile-nav-link" onClick={closeMobileMenu}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Technical Specifications &amp; System Health</span>
              </a>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}

export default Navbar;
