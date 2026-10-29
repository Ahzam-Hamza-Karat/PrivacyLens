import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import { CATEGORIES, STATUS, MATCH_TYPE } from '../src/constants/policyConstants.js';

describe('Phase 4 — Rule-Based Policy Analysis Engine Test Suite', () => {
  describe('Category Rules & Disclosures', () => {
    it('should detect Category A (Data Collection) direct and automated disclosures', () => {
      const text = `We collect personal information: Name, email address, phone number, and postal address.
We automatically collect device telemetry: IP address and browser type.`;
      const report = analyzePolicyDocument(text);

      assert.equal(report.success, true);
      const collectionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_COLLECTION);
      assert.equal(collectionCat.status, STATUS.FOUND);
      assert.ok(collectionCat.findingCount >= 2);

      const contactFinding = report.findings.find((f) => f.ruleId === 'COLLECT_DIRECT_CONTACT');
      assert.ok(contactFinding);
      assert.match(contactFinding.evidence, /Name, email address/);

      const deviceFinding = report.findings.find((f) => f.ruleId === 'COLLECT_DEVICE_TELEMETRY');
      assert.ok(deviceFinding);
      assert.match(deviceFinding.evidence, /IP address and browser type/);
    });

    it('should not trigger Category A on irrelevant occurrences of "data"', () => {
      const text = 'Data is a cornerstone of modern computer science and algorithmic engineering.';
      const report = analyzePolicyDocument(text);

      const collectionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_COLLECTION);
      assert.equal(collectionCat.status, STATUS.NOT_FOUND);
      assert.match(collectionCat.summary, /did not identify explicit data collection/);
    });

    it('should detect Category B (Data Sharing) service providers and statutory disclosures', () => {
      const text = `We share information with service providers, including cloud infrastructure hosting and customer support vendors under strict confidentiality obligations.
We may disclose information when required by law or to comply with a court order or subpoena.`;
      const report = analyzePolicyDocument(text);

      const sharingCat = report.categories.find((c) => c.id === CATEGORIES.DATA_SHARING);
      assert.equal(sharingCat.status, STATUS.FOUND);

      const providerFinding = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      assert.ok(providerFinding);

      const legalFinding = report.findings.find((f) => f.ruleId === 'SHARE_LEGAL_COMPLIANCE');
      assert.ok(legalFinding);
    });

    it('should detect Category C (Cookies & Tracking) and distinguish controls from tracking', () => {
      const text = `We utilize first-party cookies and tracking pixels to measure aggregated traffic analytics.
You can adjust cookie settings via browser preferences.`;
      const report = analyzePolicyDocument(text);

      const cookieCat = report.categories.find((c) => c.id === CATEGORIES.COOKIES_TRACKING);
      assert.equal(cookieCat.status, STATUS.FOUND);

      const cookieFinding = report.findings.find((f) => f.ruleId === 'COOKIE_FIRST_PARTY');
      assert.ok(cookieFinding);

      const controlsFinding = report.findings.find((f) => f.ruleId === 'COOKIE_USER_CONTROLS');
      assert.ok(controlsFinding);
    });

    it('should detect Category D (Data Retention) both specific timelines and indefinite language', () => {
      const text = `We delete or anonymize personal identifiers within ninety (90) days following account closure.
We retain other telemetry for as long as your account remains active or as needed for legitimate business purposes.`;
      const report = analyzePolicyDocument(text);

      const retentionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_RETENTION);
      assert.equal(retentionCat.status, STATUS.FOUND);

      const specificFinding = report.findings.find((f) => f.ruleId === 'RETENTION_SPECIFIC_PERIOD');
      assert.ok(specificFinding);

      const vagueFinding = report.findings.find((f) => f.ruleId === 'RETENTION_VAGUE_DURATION');
      assert.ok(vagueFinding);
      assert.equal(vagueFinding.matchType, MATCH_TYPE.VAGUE);
    });

    it('should detect Category E (User Rights & Choices) access, deletion, and response deadlines', () => {
      const text = `You may request a copy of the personal data we hold about you.
You have the right to request erasure of your personal data.
To exercise these rights, contact privacy@example.com. We respond to verified requests within thirty (30) days.`;
      const report = analyzePolicyDocument(text);

      const rightsCat = report.categories.find((c) => c.id === CATEGORIES.USER_RIGHTS);
      assert.equal(rightsCat.status, STATUS.FOUND);

      const accessFinding = report.findings.find((f) => f.ruleId === 'RIGHTS_ACCESS_REQUEST');
      assert.ok(accessFinding);

      const deleteFinding = report.findings.find((f) => f.ruleId === 'RIGHTS_DELETION_ERASURE');
      assert.ok(deleteFinding);

      const contactFinding = report.findings.find((f) => f.ruleId === 'RIGHTS_EXERCISE_CONTACT');
      assert.ok(contactFinding);
    });
  });

  describe('Negation and Mixed Context Handling', () => {
    it('should classify "We do not sell personal data" as a commitment not to sell, NEVER an affirmative sale', () => {
      const text = 'We do not sell your personal data to data brokers.';
      const report = analyzePolicyDocument(text);

      const saleAffirmative = report.findings.find((f) => f.ruleId === 'SHARE_SALE_AFFIRMATIVE');
      assert.equal(saleAffirmative, undefined, 'Must not classify negated statement as affirmative sale');

      const noSellFinding = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');
      assert.ok(noSellFinding, 'Must identify commitment not to sell');
      assert.equal(noSellFinding.matchType, MATCH_TYPE.NEGATIVE_DISCLOSURE);
    });

    it('should handle mixed disclosures: "We may share with service providers, but we do not sell it"', () => {
      const text = 'We may share information with service providers under confidentiality, but we do not sell your personal data.';
      const report = analyzePolicyDocument(text);

      const providerFinding = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      assert.ok(providerFinding, 'Should identify service provider sharing');

      const noSellFinding = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');
      assert.ok(noSellFinding, 'Should identify commitment not to sell');

      const saleAffirmative = report.findings.find((f) => f.ruleId === 'SHARE_SALE_AFFIRMATIVE');
      assert.equal(saleAffirmative, undefined);
    });

    it('should handle conditional negation: "We do not collect precise location data unless you enable the feature"', () => {
      const text = 'We do not collect precise location data unless you enable the feature.';
      const report = analyzePolicyDocument(text);

      const finding = report.findings.find((f) => f.ruleId === 'COLLECT_CONDITIONAL_RESTRICTION');
      assert.ok(finding);
      assert.equal(finding.matchType, MATCH_TYPE.CONDITIONAL);
    });
  });

  describe('Status Differentiation & Evidence Fidelity', () => {
    it('should mark categories as not_found when text lacks disclosures and never claim company does not perform activity', () => {
      const text = 'This document only discusses website cookie settings and browser preferences.';
      const report = analyzePolicyDocument(text);

      const retentionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_RETENTION);
      assert.equal(retentionCat.status, STATUS.NOT_FOUND);
      assert.match(retentionCat.summary, /did not identify disclosures specifying data retention/);
      assert.match(retentionCat.explanation, /absence of detected disclosures in this text is not evidence/);
    });

    it('should ensure every finding matches original text verbatim at exact offsets', () => {
      const text = `PRIVACY POLICY NOTICE
We collect your email address when you register.
We do not sell personal data to third parties.
We retain data for as long as your account remains active.`;

      const report = analyzePolicyDocument(text);
      assert.ok(report.findings.length > 0);

      for (const finding of report.findings) {
        assert.ok(finding.id);
        assert.ok(finding.paragraphId);
        assert.ok(finding.segmentId);
        assert.ok(finding.startOffset >= 0);
        assert.ok(finding.endOffset > finding.startOffset);

        // Crucial: offset slicing MUST yield exact evidence string
        const sliced = text.slice(finding.startOffset, finding.endOffset);
        assert.equal(sliced, finding.evidence);
      }
    });

    it('should run successfully on the synthetic demonstration sample policy', () => {
      // Test against realistic multi-section policy
      const sample = `2. INFORMATION WE COLLECT
We collect information you provide directly to us: Name, email address, phone number.
We automatically collect IP address and browser type.

3. COOKIES AND TRACKING TECHNOLOGIES
We utilize cookies, web beacons, and local storage to maintain your authenticated session.
You can adjust cookie settings via browser preferences.

4. HOW WE SHARE YOUR INFORMATION
We do not sell your personal data to data brokers. We share data with cloud infrastructure hosting providers under strict confidentiality.

5. DATA RETENTION
We delete or anonymize personal identifiers within ninety (90) days following account closure.

6. YOUR RIGHTS AND CHOICES
You may request a copy of the personal data we hold about you. You may request erasure of your personal data.
To exercise these rights, contact privacy@example.com. We respond to verified requests within thirty (30) days.`;

      const report = analyzePolicyDocument(sample);
      assert.equal(report.success, true);
      assert.equal(report.categories.length, 5);

      // All 5 categories should be found in this rich policy
      for (const cat of report.categories) {
        assert.equal(cat.status, STATUS.FOUND);
        assert.ok(cat.findingCount > 0);
      }
      assert.ok(report.findings.length >= 7);
    });
  });
});
