import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import { SAMPLE_POLICY } from '../../frontend/src/utils/constants.js';
import {
  COOKIE_RULES,
  COOKIE_GLOSSARY,
  SIMULATOR_CATEGORIES,
  createDefaultSimulatorState,
  getReadableConsentSummary,
  extractCookieDisclosures,
} from '../../frontend/src/utils/cookieCatalogue.js';

describe('Phase 4 — Cookie Assistant & Interactive Cookie Simulator Test Suite', () => {
  // =========================================================================
  // 1. Domain Constants & Catalogue Integrity
  // =========================================================================
  describe('Catalogue Integrity & Definitions', () => {
    it('should define exactly 5 deterministic cookie rules matching the policy engine', () => {
      assert.equal(COOKIE_RULES.length, 5);
      const expectedIds = [
        'COOKIE_FIRST_PARTY',
        'COOKIE_TRACKING_BEACONS',
        'COOKIE_ANALYTICS',
        'COOKIE_USER_CONTROLS',
        'COOKIE_NEGATIVE_DISCLOSURE',
      ];
      assert.deepEqual(COOKIE_RULES.map((r) => r.id), expectedIds);
    });

    it('should provide beginner-friendly questions and descriptions for all 5 rules', () => {
      COOKIE_RULES.forEach((rule) => {
        assert.ok(typeof rule.title === 'string' && rule.title.length > 0);
        assert.ok(typeof rule.shortName === 'string' && rule.shortName.length > 0);
        assert.ok(typeof rule.description === 'string' && rule.description.length > 0);
        assert.ok(typeof rule.userQuestion === 'string' && rule.userQuestion.endsWith('?'));
      });
    });

    it('should include comprehensive glossary terms explaining core tracking concepts', () => {
      assert.ok(COOKIE_GLOSSARY.length >= 5);
      COOKIE_GLOSSARY.forEach((item) => {
        assert.ok(typeof item.term === 'string' && item.term.length > 0);
        assert.ok(typeof item.simpleDefinition === 'string' && item.simpleDefinition.length > 0);
        assert.ok(typeof item.whyItMatters === 'string' && item.whyItMatters.length > 0);
        assert.ok(typeof item.riskLevel === 'string' && item.riskLevel.length > 0);
      });
    });
  });

  // =========================================================================
  // 2. Cookie Assistant — Disclosure Extraction & Evidence Fidelity
  // =========================================================================
  describe('Cookie Assistant Disclosure Extraction', () => {
    it('should mark all 5 rules as pending when analysis has not run', () => {
      const disclosures = extractCookieDisclosures(null, false);
      assert.equal(disclosures.length, 5);
      disclosures.forEach((d) => {
        assert.equal(d.status, 'pending');
        assert.equal(d.statusLabel, 'Pending Analysis');
        assert.equal(d.finding, null);
        assert.equal(d.evidence, null);
      });
    });

    it('should mark rules as not_found when analysis is complete with empty findings', () => {
      const emptyReport = { findings: [] };
      const disclosures = extractCookieDisclosures(emptyReport, true);
      assert.equal(disclosures.length, 5);
      disclosures.forEach((d) => {
        assert.equal(d.status, 'not_found');
        assert.equal(d.statusLabel, 'Not Detected');
        assert.equal(d.finding, null);
        assert.equal(d.evidence, null);
      });
    });

    it('should accurately detect affirmative cookie disclosures with verbatim evidence', () => {
      const mockFinding = {
        id: 'finding-cookie-1',
        ruleId: 'COOKIE_FIRST_PARTY',
        category: 'cookies_tracking',
        matchStrength: 'strong',
        matchType: 'affirmative',
        evidence: 'We utilize first-party and third-party cookies.',
        startOffset: 100,
        endOffset: 147,
      };

      const disclosures = extractCookieDisclosures({ findings: [mockFinding] }, true);
      const fp = disclosures.find((d) => d.ruleId === 'COOKIE_FIRST_PARTY');

      assert.equal(fp.status, 'found');
      assert.equal(fp.statusLabel, 'Found (Disclosed)');
      assert.equal(fp.evidence, 'We utilize first-party and third-party cookies.');
      assert.equal(fp.startOffset, 100);
      assert.equal(fp.endOffset, 147);
    });

    it('should distinguish vague cookie disclosures as unclear', () => {
      const mockVagueFinding = {
        id: 'finding-cookie-2',
        ruleId: 'COOKIE_TRACKING_BEACONS',
        category: 'cookies_tracking',
        matchStrength: 'unclear',
        matchType: 'vague',
        evidence: 'We may use various web technologies as needed.',
        startOffset: 200,
        endOffset: 246,
      };

      const disclosures = extractCookieDisclosures({ findings: [mockVagueFinding] }, true);
      const beacon = disclosures.find((d) => d.ruleId === 'COOKIE_TRACKING_BEACONS');

      assert.equal(beacon.status, 'unclear');
      assert.equal(beacon.statusLabel, 'Unclear / Vague');
    });

    it('should attach deterministic explanations to every extracted rule item', () => {
      const disclosures = extractCookieDisclosures({ findings: [] }, true);
      disclosures.forEach((d) => {
        assert.ok(d.deterministicExplanation !== null, `Missing explanation for ${d.ruleId}`);
        assert.ok(typeof d.deterministicExplanation.simpleMeaning === 'string');
        assert.ok(typeof d.deterministicExplanation.whyItMatters === 'string');
      });
    });
  });

  // =========================================================================
  // 3. Interactive Cookie Simulator — State Transitions & Invariants
  // =========================================================================
  describe('Cookie Simulator State & Bulk Actions', () => {
    it('should initialize with Essential=true and all optional categories=false', () => {
      const initial = createDefaultSimulatorState();
      assert.deepEqual(initial, {
        essential: true,
        analytics: false,
        advertising: false,
        functional: false,
      });
    });

    it('should strictly enforce that essential cookies cannot be disabled in summary', () => {
      // Even if state attempted to pass essential: false, helper must enforce true
      const summary = getReadableConsentSummary({ essential: false, analytics: true });
      assert.equal(summary.safeState.essential, true);
      assert.equal(summary.activeCount, 2); // Essential + Analytics
    });

    it('should provide accurate human-readable text for minimal consent (Strictly Essential)', () => {
      const summary = getReadableConsentSummary(createDefaultSimulatorState());
      assert.equal(summary.activeCount, 1);
      assert.equal(summary.optionalActiveCount, 0);
      assert.equal(
        summary.readableSummary,
        'Strictly Essential Only (All optional tracking rejected)'
      );
      assert.match(summary.simulatedImpactText, /Maximum privacy simulation/i);
    });

    it('should provide accurate readable text for full consent (Accept All Optional)', () => {
      const fullConsentState = {
        essential: true,
        analytics: true,
        advertising: true,
        functional: true,
      };
      const summary = getReadableConsentSummary(fullConsentState);
      assert.equal(summary.activeCount, 4);
      assert.equal(summary.optionalActiveCount, 3);
      assert.equal(
        summary.readableSummary,
        'Full Consent (All optional categories accepted)'
      );
      assert.match(summary.simulatedImpactText, /Behavioral advertising cookies are permitted/i);
    });

    it('should provide accurate readable text for custom partial configurations', () => {
      const customState = {
        essential: true,
        analytics: true,
        advertising: false,
        functional: false,
      };
      const summary = getReadableConsentSummary(customState);
      assert.equal(summary.activeCount, 2);
      assert.equal(summary.optionalActiveCount, 1);
      assert.equal(summary.readableSummary, 'Custom Configuration (Essential, Analytics)');
      assert.match(summary.simulatedImpactText, /Performance analytics cookies are permitted/i);
    });

    it('should define simulated cookie examples for all categories without altering real browser cookies', () => {
      SIMULATOR_CATEGORIES.forEach((cat) => {
        assert.ok(cat.simulatedExamples.length >= 2);
        cat.simulatedExamples.forEach((name) => {
          assert.ok(typeof name === 'string' && name.length > 0);
        });
      });
    });
  });

  // =========================================================================
  // 4. End-to-End Real Policy Ingestion & Offset Invariant
  // =========================================================================
  describe('End-to-End Real Policy Analysis Integration', () => {
    it('should analyze SAMPLE_POLICY and extract real cookie findings with verbatim offsets', () => {
      const report = analyzePolicyDocument(SAMPLE_POLICY);
      assert.ok(report.success);

      const disclosures = extractCookieDisclosures(report, true);
      const foundDisclosures = disclosures.filter((d) => d.status === 'found');

      // SAMPLE_POLICY discloses first-party, tracking beacons, analytics, and user controls
      assert.ok(foundDisclosures.length >= 3);

      foundDisclosures.forEach((d) => {
        assert.ok(d.startOffset !== null);
        assert.ok(d.endOffset !== null);
        const sliced = SAMPLE_POLICY.slice(d.startOffset, d.endOffset);
        assert.equal(
          sliced,
          d.evidence,
          `Evidence offset mismatch for ${d.ruleId}: sliced "${sliced}" vs evidence "${d.evidence}"`
        );
      });
    });

    it('should not fabricate cookie disclosures when a policy discusses non-cookie topics', () => {
      const nonCookiePolicy = `
        We collect your name and email address when you create an account.
        We do not sell personal data to commercial partners.
        You may request access to your data or request deletion by contacting support.
      `;
      const report = analyzePolicyDocument(nonCookiePolicy);
      const disclosures = extractCookieDisclosures(report, true);

      // None of the 5 cookie rules should match this text
      const foundOrUnclear = disclosures.filter((d) => d.status === 'found' || d.status === 'unclear');
      assert.equal(foundOrUnclear.length, 0);

      const notDetected = disclosures.filter((d) => d.status === 'not_found');
      assert.equal(notDetected.length, 5);
    });
  });
});

