import React from 'react';

/**
 * How It Works Section Component
 * Illustrates the PrivacyLens end-to-end analysis methodology.
 */
export function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Input & Ingestion',
      desc: 'Users paste policy text up to 50,000 characters into our bounded editor for client-side normalization, segmentation, and character-offset indexing.',
      badge: 'Step 1: Ingestion',
    },
    {
      number: '2',
      title: 'Deterministic Rule Engine',
      desc: '28 transparent pattern-matching rules evaluate data collection, third-party sharing, cookies, retention durations, and user rights.',
      badge: 'Step 2: 28 Rules',
    },
    {
      number: '3',
      title: 'Verbatim Evidence Slicing',
      desc: 'Every finding attaches exact numeric character offsets ([start–end]) verifying that quotes match the original text with 100% fidelity.',
      badge: 'Step 3: Verification',
    },
    {
      number: '4',
      title: 'Plain Explanations & AI Insights',
      desc: 'Technical terms are translated into 5-part plain summaries, interactive cookie simulations, version diffing, and grounded AI inquiries.',
      badge: 'Step 4: Intelligence',
    },
  ];

  return (
    <section id="how-it-works" className="content-section" aria-labelledby="how-it-works-title">
      <div className="app-container">
        <div className="section-header">
          <span className="section-tag">METHODOLOGY</span>
          <h2 id="how-it-works-title" className="section-title">
            How PrivacyLens Works
          </h2>
          <p className="section-subtitle">
            A transparent four-stage pipeline designed to translate legal complexity into accessible, evidence-backed consumer intelligence.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.number} className="step-card">
              <div className="step-number" aria-hidden="true">
                {step.number}
              </div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {step.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
