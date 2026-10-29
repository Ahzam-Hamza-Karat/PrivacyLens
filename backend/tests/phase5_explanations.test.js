import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/services/analyzer/ruleRegistry.js';
import {
  EXPLANATION_CATALOGUE,
  FALLBACK_EXPLANATION,
  getRuleExplanation,
  generateKeyObservations,
} from '../src/services/analyzer/explanationCatalogue.js';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import { CATEGORIES } from '../src/constants/policyConstants.js';

describe('Phase 5 — Simple-Language Explanations & Report Test Suite', () => {
  describe('Explanation Catalogue Coverage & Structure', () => {
    it('should verify all 28 registered rules have an entry in EXPLANATION_CATALOGUE', () => {
      assert.equal(RULES.length, 28, 'Rule registry must contain 28 rules');
      for (const rule of RULES) {
        assert.ok(
          EXPLANATION_CATALOGUE[rule.id],
          `Rule ${rule.id} must have an explanation in EXPLANATION_CATALOGUE`
        );
      }
    });

    it('should verify every explanation defines all 5 required structured dimensions', () => {
      const requiredFields = [
        'whatItSays',
        'simpleMeaning',
        'whyItMatters',
        'conditionsOrLimitations',
        'cannotConclude',
      ];

      for (const [ruleId, explanation] of Object.entries(EXPLANATION_CATALOGUE)) {
        for (const field of requiredFields) {
          assert.equal(
            typeof explanation[field],
            'string',
            `Rule ${ruleId} field ${field} must be a string`
          );
          assert.ok(
            explanation[field].trim().length > 15,
            `Rule ${ruleId} field ${field} must be substantive (>15 chars)`
          );
        }
      }
    });

    it('should return safe fallback explanation for unknown rule IDs without throwing', () => {
      const unknownIds = ['NON_EXISTENT_RULE', '', null, undefined, 12345];
      for (const id of unknownIds) {
        const expl = getRuleExplanation(id);
        assert.deepEqual(expl, FALLBACK_EXPLANATION);
        assert.ok(expl.whatItSays);
        assert.ok(expl.simpleMeaning);
        assert.ok(expl.whyItMatters);
        assert.ok(expl.conditionsOrLimitations);
        assert.ok(expl.cannotConclude);
      }
    });
  });

  describe('Finding Explanation Attachment & Slicing Invariant', () => {
    it('should attach structured explanation to every finding in an analyzed document', () => {
      const samplePolicy = `2. INFORMATION WE COLLECT
We collect your full name, email address, and phone number when you register.
We automatically collect device telemetry: IP address and browser type.

3. COOKIES AND TRACKING TECHNOLOGIES
Our website uses cookies to maintain your authenticated session.
You can manage cookie preferences in your browser settings.

4. HOW WE SHARE YOUR INFORMATION
We share personal information with service providers but do not sell it.

5. DATA RETENTION
We delete personal data within thirty (30) days following account closure.

6. YOUR RIGHTS AND CHOICES
You have the right to request access to your personal data.
To exercise these rights, contact privacy@example.com.`;

      const report = analyzePolicyDocument(samplePolicy);
      assert.equal(report.success, true);
      assert.ok(report.findings.length >= 7, 'Should produce at least 7 findings');

      for (const finding of report.findings) {
        // Offset slicing invariant check
        const sliced = samplePolicy.slice(finding.startOffset, finding.endOffset);
        assert.equal(
          sliced,
          finding.evidence,
          `Evidence for ${finding.ruleId} must match verbatim slice`
        );

        // Explanation presence check
        assert.ok(finding.explanation, `Finding ${finding.id} must contain explanation`);
        assert.ok(finding.explanation.whatItSays, 'whatItSays must be populated');
        assert.ok(finding.explanation.simpleMeaning, 'simpleMeaning must be populated');
        assert.ok(finding.explanation.whyItMatters, 'whyItMatters must be populated');
        assert.ok(finding.explanation.conditionsOrLimitations, 'conditionsOrLimitations must be populated');
        assert.ok(finding.explanation.cannotConclude, 'cannotConclude must be populated');
      }
    });
  });

  describe('Report Overview Metrics & Key Observations', () => {
    it('should accurately calculate categoriesWithFindingsCount and categoriesWithoutFindingsCount', () => {
      // Document with findings only in Data Sharing
      const text = 'We share personal information with service providers but do not sell it.';
      const report = analyzePolicyDocument(text);

      assert.equal(report.summary.categoriesWithFindingsCount, 1);
      assert.equal(report.summary.categoriesWithoutFindingsCount, 4);
      assert.equal(
        report.summary.categoriesWithFindingsCount + report.summary.categoriesWithoutFindingsCount,
        5
      );
    });

    it('should generate honest, non-fabricated key observations for detected findings', () => {
      const text = 'We share personal information with service providers but do not sell it.';
      const report = analyzePolicyDocument(text);

      assert.ok(Array.isArray(report.summary.keyObservations));
      assert.ok(report.summary.keyObservations.length >= 2);

      const obsText = report.summary.keyObservations.join(' ');
      assert.match(obsText, /Non-Sale Commitment/i);
      assert.match(obsText, /service providers/i);
      assert.match(obsText, /No matching disclosures were detected in/i);
    });

    it('should generate neutral disclaimer observations when text contains zero findings', () => {
      const text = 'The weather in the mountains is crisp and pleasant in late October.';
      const report = analyzePolicyDocument(text);

      assert.equal(report.findings.length, 0);
      assert.equal(report.summary.categoriesWithFindingsCount, 0);
      assert.equal(report.summary.categoriesWithoutFindingsCount, 5);

      assert.ok(Array.isArray(report.summary.keyObservations));
      const obsText = report.summary.keyObservations.join(' ');
      assert.match(obsText, /No matching disclosures were detected/i);
      assert.match(obsText, /absence of detected text does not prove/i);
    });
  });

  describe('Status Differentiation & Absence of Fabrication', () => {
    it('should never claim company does not perform an activity when status is not_found', () => {
      const text = 'Our website uses cookies for session management.';
      const report = analyzePolicyDocument(text);

      const retentionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_RETENTION);
      assert.equal(retentionCat.status, 'not_found');
      assert.ok(
        !retentionCat.summary.includes('does not retain'),
        'Must not claim company does not retain data'
      );
      assert.match(retentionCat.explanation, /absence of detected disclosures in this text is not evidence/i);
    });

    it('should never output arbitrary privacy scores or compliance letter grades', () => {
      const text = 'We collect your name and email address.';
      const report = analyzePolicyDocument(text);

      assert.equal(report.privacyScore, undefined, 'Must not output privacyScore');
      assert.equal(report.letterGrade, undefined, 'Must not output letterGrade');
      assert.equal(report.riskRating, undefined, 'Must not output riskRating');
      assert.equal(report.complianceScore, undefined, 'Must not output complianceScore');
    });
  });

  describe('Security & XSS Injection Safety', () => {
    it('should safely ingest policy text containing script tags and preserve raw characters without executing', () => {
      const xssPolicy = `<script>alert('xss')</script> We share personal information with service providers but do not sell it.`;
      const report = analyzePolicyDocument(xssPolicy);

      assert.equal(report.success, true);
      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      assert.ok(provider);

      // Verbatim slicing invariant check: original text preserved exactly
      const sliced = xssPolicy.slice(provider.startOffset, provider.endOffset);
      assert.equal(sliced, provider.evidence);
      assert.ok(provider.evidence.includes("<script>alert('xss')</script>"));
    });
  });

  describe('Explanation Accuracy & Evidence Fidelity Audit', () => {
    it('should not claim COOKIE_FIRST_PARTY definitely keeps users logged in or remembers settings', () => {
      const expl = EXPLANATION_CATALOGUE.COOKIE_FIRST_PARTY;
      assert.ok(expl, 'COOKIE_FIRST_PARTY must exist');
      // Must not state as an absolute fact that cookies store login sessions or settings
      assert.ok(!expl.simpleMeaning.includes('so you remain logged in and your settings are remembered'));
      assert.ok(expl.cannotConclude.includes('Unless the excerpt explicitly states their function'));
    });

    it('should distinguish general technical web beacon context from claims about what this organization does in COOKIE_TRACKING_BEACONS', () => {
      const expl = EXPLANATION_CATALOGUE.COOKIE_TRACKING_BEACONS;
      assert.ok(expl, 'COOKIE_TRACKING_BEACONS must exist');
      // Must not claim with certainty that beacons are in emails or that marketing networks receive pingbacks
      assert.ok(!expl.whatItSays.includes('embedded in web pages or email communications'));
      assert.ok(expl.cannotConclude.includes('The text alone does not verify whether beacons are used in emails'));
    });

    it('should not claim outside analytics services collect data in COOKIE_ANALYTICS unless supported by evidence', () => {
      const expl = EXPLANATION_CATALOGUE.COOKIE_ANALYTICS;
      assert.ok(expl, 'COOKIE_ANALYTICS must exist');
      // Must not fabricate specific third-party providers like Google Analytics in whatItSays
      assert.ok(!expl.whatItSays.includes('such as Google Analytics'));
      assert.ok(!expl.simpleMeaning.startsWith('Outside analytics services collect'));
      assert.ok(expl.cannotConclude.includes('Unless explicitly named in the excerpt'));
    });

    it('should maintain neutral non-presumption language in COOKIE_NEGATIVE_DISCLOSURE and SHARE_NO_SELL', () => {
      const noSell = EXPLANATION_CATALOGUE.SHARE_NO_SELL;
      assert.ok(!noSell.whyItMatters.includes('clear written assurance'));
      assert.ok(!noSell.whyItMatters.includes('not being monetized'));
      assert.ok(noSell.whyItMatters.includes('cannot independently verify'));

      const noTrack = EXPLANATION_CATALOGUE.COOKIE_NEGATIVE_DISCLOSURE;
      assert.ok(!noTrack.whyItMatters.includes('means you should not see retargeted advertisements'));
      assert.ok(noTrack.whyItMatters.includes('cannot independently verify technical tracking behavior'));
    });
  });
});
