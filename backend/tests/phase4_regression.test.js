import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import { CATEGORIES, STATUS, MATCH_TYPE, MATCH_STRENGTH } from '../src/constants/policyConstants.js';
import request from 'supertest';
import app from '../src/app.js';

describe('Phase 4 — Remediation Regression Test Suite', () => {
  describe('Case E — Pronoun-Based Negation & Non-Sale Commitments', () => {
    it('should detect service providers and non-sale commitment without generating affirmative sale from "We share personal information with service providers but do not sell it."', () => {
      const text = 'We share personal information with service providers but do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      assert.ok(provider, 'Must detect service provider sharing');

      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');
      assert.ok(noSell, 'Must detect commitment not to sell ("do not sell it")');
      assert.equal(noSell.matchType, MATCH_TYPE.NEGATIVE_DISCLOSURE);

      const affirmativeSale = report.findings.find((f) => f.ruleId === 'SHARE_SALE_AFFIRMATIVE');
      assert.equal(affirmativeSale, undefined, 'Must NEVER generate affirmative sale finding from negative clause');
    });

    it('should resolve direct pronoun "them" referring to records in the same clause', () => {
      const text = 'We disclose user records to operational contractors under strict confidentiality, but we will not sell them.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');
      const affirmativeSale = report.findings.find((f) => f.ruleId === 'SHARE_SALE_AFFIRMATIVE');

      assert.ok(provider);
      assert.ok(noSell);
      assert.equal(affirmativeSale, undefined);
    });

    it('should not treat ambiguous occurrences of "it" as data sale', () => {
      const text = 'The software is fast and users enjoy it.';
      const report = analyzePolicyDocument(text);
      assert.equal(report.findings.length, 0);
    });
  });

  describe('Case G — Vague Retention Wording & Intervening Modifiers', () => {
    it('should detect vague retention duration disclosure with intervening modifier "reasonably"', () => {
      const text = 'We may retain information for as long as reasonably necessary.';
      const report = analyzePolicyDocument(text);

      const vagueFinding = report.findings.find((f) => f.ruleId === 'RETENTION_VAGUE_DURATION');
      assert.ok(vagueFinding, 'Must detect vague retention duration');
      assert.equal(vagueFinding.matchType, MATCH_TYPE.VAGUE);
      assert.equal(vagueFinding.matchStrength, MATCH_STRENGTH.UNCLEAR);

      const specificFinding = report.findings.find((f) => f.ruleId === 'RETENTION_SPECIFIC_PERIOD');
      assert.equal(specificFinding, undefined, 'Must not claim explicit retention period exists');

      const retentionCat = report.categories.find((c) => c.id === CATEGORIES.DATA_RETENTION);
      assert.equal(retentionCat.status, STATUS.UNCLEAR);
    });

    it('should detect vague retention with other common legal qualifiers (strictly, deemed, appropriate)', () => {
      const variations = [
        'Data is stored as long as strictly necessary.',
        'We keep records for as long as deemed needed for compliance.',
        'Information is retained for as long as appropriate.',
      ];

      for (const v of variations) {
        const rep = analyzePolicyDocument(v);
        const f = rep.findings.find((x) => x.ruleId === 'RETENTION_VAGUE_DURATION');
        assert.ok(f, `Must detect vague duration in: "${v}"`);
      }
    });

    it('should not match unrelated statements about necessity', () => {
      const text = 'It is necessary to maintain clean office spaces.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'RETENTION_VAGUE_DURATION');
      assert.equal(f, undefined);
    });
  });

  describe('Case H — Account-Closure Deletion with Scope & Legal Exceptions', () => {
    it('should detect specific 30-day timeline, account-closure deletion, and legal retention exception', () => {
      const text = 'We delete eligible account data within 30 days after account closure, subject to legal retention obligations.';
      const report = analyzePolicyDocument(text);

      const specific = report.findings.find((f) => f.ruleId === 'RETENTION_SPECIFIC_PERIOD');
      assert.ok(specific, 'Must detect 30-day timeline');
      assert.match(specific.evidence, /within 30 days/);

      const closure = report.findings.find((f) => f.ruleId === 'RETENTION_ACCOUNT_CLOSURE');
      assert.ok(closure, 'Must detect account-closure deletion');
      assert.match(closure.evidence, /after account closure/);

      const legal = report.findings.find((f) => f.ruleId === 'RETENTION_LEGAL_EXCEPTIONS');
      assert.ok(legal, 'Must detect legal retention exception');
      assert.match(legal.evidence, /legal retention obligations/);

      // Verbatim evidence preserves scope limitation "eligible"
      assert.ok(closure.evidence.includes('eligible account data'));
    });

    it('should handle common account closure phrasing variants', () => {
      const variants = [
        'We purge account data after account closure.',
        'When you close your account, we delete personal identifiers.',
        'Following account termination, personal data is erased within 60 days.',
      ];

      for (const variant of variants) {
        const rep = analyzePolicyDocument(variant);
        const closureFinding = rep.findings.find((f) => f.ruleId === 'RETENTION_ACCOUNT_CLOSURE');
        assert.ok(closureFinding, `Must detect account closure in: "${variant}"`);
      }
    });
  });

  describe('Case I — General Cookie Usage & Separate Controls', () => {
    it('should detect general cookie usage and cookie controls without requiring "first-party" or inferring advertising', () => {
      const text = 'Our website uses cookies. You can manage certain cookie preferences in your browser.';
      const report = analyzePolicyDocument(text);

      const cookieUsage = report.findings.find((f) => f.ruleId === 'COOKIE_FIRST_PARTY');
      assert.ok(cookieUsage, 'Must detect general cookie usage');

      const cookieControls = report.findings.find((f) => f.ruleId === 'COOKIE_USER_CONTROLS');
      assert.ok(cookieControls, 'Must detect browser cookie preferences control');

      // Crucial: Must NOT infer advertising or tracking beacons
      const adTracking = report.findings.find((f) => f.ruleId === 'COOKIE_NEGATIVE_DISCLOSURE');
      const beacons = report.findings.find((f) => f.ruleId === 'COOKIE_TRACKING_BEACONS');
      assert.equal(adTracking, undefined);
      assert.equal(beacons, undefined);
    });

    it('should not match baked goods or non-web cookie statements', () => {
      const text = 'Fresh cookies were baked for the holiday reception.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'COOKIE_FIRST_PARTY');
      assert.equal(f, undefined);
    });
  });

  describe('Case J — User Rights Negation & Non-Presumption', () => {
    it('should not trigger affirmative access request right from negative statement', () => {
      const text = 'We explain your rights in this policy, but the company does not provide an access-request process in this section.';
      const report = analyzePolicyDocument(text);

      const accessFinding = report.findings.find((f) => f.ruleId === 'RIGHTS_ACCESS_REQUEST');
      assert.equal(accessFinding, undefined, 'Negative statement must not generate affirmative access right');
    });
  });

  describe('False Positive Defect Remediation Suite', () => {
    it('should NOT trigger direct contact collection for "The company name is Acme Corp."', () => {
      const text = 'The company name is Acme Corp.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'COLLECT_DIRECT_CONTACT');
      assert.equal(f, undefined);
    });

    it('should NOT trigger service-provider data sharing for generic vendor mentions', () => {
      const statements = [
        'The vendor market is competitive.',
        'We procure hardware from third-party vendors.',
        'Office supply contractors provide building maintenance.',
      ];

      for (const stmt of statements) {
        const report = analyzePolicyDocument(stmt);
        const f = report.findings.find((x) => x.ruleId === 'SHARE_SERVICE_PROVIDERS');
        assert.equal(f, undefined, `Must not trigger SHARE_SERVICE_PROVIDERS for: "${stmt}"`);
      }
    });

    it('should NOT trigger business transfer data sharing for generic merger mentions', () => {
      const text = 'Merger and acquisition activity increased this quarter.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'SHARE_BUSINESS_TRANSFERS');
      assert.equal(f, undefined);
    });

    it('should NOT trigger affiliate data sharing for affiliate marketing strategies', () => {
      const text = 'Affiliate marketing is a popular strategy.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'SHARE_AFFILIATES');
      assert.equal(f, undefined);
    });

    it('should NOT trigger credential collection for security discussions about password hashing', () => {
      const text = 'Password hashing uses modern cryptography.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'COLLECT_ACCOUNT_CREDENTIALS');
      assert.equal(f, undefined);
    });

    it('should NOT trigger telemetry collection for definition of IP address', () => {
      const text = 'An IP address consists of four numbers separated by dots.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'COLLECT_DEVICE_TELEMETRY');
      assert.equal(f, undefined);
    });
  });

  describe('User Rights Pronoun and Determiner Inclusivity', () => {
    it('should detect access request with "their personal data"', () => {
      const text = 'Users can request access to their personal data.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'RIGHTS_ACCESS_REQUEST');
      assert.ok(f, 'Must detect access request');
    });

    it('should detect rectification with "rectify their data"', () => {
      const text = 'Users can rectify their data.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'RIGHTS_CORRECTION_RECTIFICATION');
      assert.ok(f, 'Must detect rectification');
    });

    it('should detect deletion with "delete their personal information"', () => {
      const text = 'Users may request that we delete their personal information.';
      const report = analyzePolicyDocument(text);
      const f = report.findings.find((x) => x.ruleId === 'RIGHTS_DELETION_ERASURE');
      assert.ok(f, 'Must detect deletion/erasure');
    });
  });

  describe('Source Offset Invariant & API Integration Verification', () => {
    it('should strictly preserve originalPolicyText.slice(startOffset, endOffset) === evidence for all findings', () => {
      const policy = `PRIVACY POLICY NOTICE\r\n\r\n1. DATA COLLECTION\r\nWe collect your full name, email address, and phone number when you register.\r\nWe automatically collect device telemetry: IP address and browser type.\r\n\r\n2. SHARING & TRANSFERS\r\nWe share personal information with service providers but do not sell it.\r\nIn the event of a merger, acquisition, or sale of assets, data may be transferred.\r\n\r\n3. RETENTION & CLOSURE\r\nWe delete eligible account data within 30 days after account closure, subject to legal retention obligations.\r\nWe may retain information for as long as reasonably necessary.\r\n\r\n4. COOKIES\r\nOur website uses cookies. You can manage certain cookie preferences in your browser.\r\n\r\n5. YOUR RIGHTS\r\nUsers can request access to their personal data.\r\nUsers can rectify their data.\r\nUsers may request that we delete their personal information.`;

      const report = analyzePolicyDocument(policy);
      assert.ok(report.findings.length >= 10);

      for (const finding of report.findings) {
        const sliced = policy.slice(finding.startOffset, finding.endOffset);
        assert.equal(sliced, finding.evidence, `Offset slice must match verbatim evidence for rule ${finding.ruleId}`);
      }
    });

    it('should return conforming HTTP 200 via POST /api/analyze with all remediated findings', async () => {
      const policyText = 'Our website uses cookies. We share personal information with service providers but do not sell it.';
      const response = await request(app)
        .post('/api/analyze')
        .set('Content-Type', 'application/json')
        .send({ policyText });

      assert.equal(response.status, 200);
      assert.equal(response.body.success, true);
      assert.ok(Array.isArray(response.body.findings));

      const cookieFinding = response.body.findings.find((f) => f.ruleId === 'COOKIE_FIRST_PARTY');
      const providerFinding = response.body.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSellFinding = response.body.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(cookieFinding);
      assert.ok(providerFinding);
      assert.ok(noSellFinding);

      // Invariant check on API response
      for (const f of response.body.findings) {
        assert.equal(policyText.slice(f.startOffset, f.endOffset), f.evidence);
      }
    });
  });

  describe('Targeted Evidence Quality & Smallest Verbatim Excerpt Refinement', () => {
    it('should cite smallest clear verbatim excerpt for SHARE_SERVICE_PROVIDERS and SHARE_NO_SELL in "We share personal information with service providers but do not sell it."', () => {
      const text = 'We share personal information with service providers but do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider, 'Must detect SHARE_SERVICE_PROVIDERS');
      assert.ok(noSell, 'Must detect SHARE_NO_SELL');

      // Provider portion: "We share personal information with service providers"
      assert.equal(provider.evidence, 'We share personal information with service providers');
      assert.equal(provider.startOffset, 0);
      assert.equal(provider.endOffset, 52);
      assert.ok(!provider.evidence.includes('sell'), 'Provider excerpt must not contain data-sale clause');

      // No-sell portion: "but do not sell it."
      assert.equal(noSell.evidence, 'but do not sell it.');
      assert.equal(noSell.startOffset, 53);
      assert.equal(noSell.endOffset, 72);
      assert.ok(!noSell.evidence.includes('service providers'), 'No-sell excerpt must not contain service provider clause');
      assert.match(noSell.evidence, /do not sell it/, 'No-sell excerpt must retain negation and pronoun');

      // Invariant checks: exact slices from original submitted string
      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in comma-separated mixed disclosure with full subject clause', () => {
      const text = 'We may share information with service providers under confidentiality, but we do not sell your personal data.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'We may share information with service providers under confidentiality');
      assert.equal(noSell.evidence, 'but we do not sell your personal data.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in mixed cookies and tracking negative disclosure', () => {
      const text = 'Our website uses cookies, but we do not employ third-party advertising trackers.';
      const report = analyzePolicyDocument(text);

      const cookie = report.findings.find((f) => f.ruleId === 'COOKIE_FIRST_PARTY');
      const tracker = report.findings.find((f) => f.ruleId === 'COOKIE_NEGATIVE_DISCLOSURE');

      assert.ok(cookie);
      assert.ok(tracker);

      assert.equal(cookie.evidence, 'Our website uses cookies');
      assert.equal(tracker.evidence, 'but we do not employ third-party advertising trackers.');

      assert.equal(text.slice(cookie.startOffset, cookie.endOffset), cookie.evidence);
      assert.equal(text.slice(tracker.startOffset, tracker.endOffset), tracker.evidence);
    });

    it('should refine evidence in contrastive mixed statement with "while"', () => {
      const text = 'We collect your email address when you register, while we do not sell it.';
      const report = analyzePolicyDocument(text);

      const contact = report.findings.find((f) => f.ruleId === 'COLLECT_DIRECT_CONTACT');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(contact);
      assert.ok(noSell);

      assert.equal(contact.evidence, 'We collect your email address when you register');
      assert.equal(noSell.evidence, 'while we do not sell it.');

      assert.equal(text.slice(contact.startOffset, contact.endOffset), contact.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should retain larger excerpt when separating would compromise conditions or scope limitations', () => {
      const text = 'We delete eligible account data within 30 days after account closure, subject to legal retention obligations.';
      const report = analyzePolicyDocument(text);

      const specific = report.findings.find((f) => f.ruleId === 'RETENTION_SPECIFIC_PERIOD');
      const closure = report.findings.find((f) => f.ruleId === 'RETENTION_ACCOUNT_CLOSURE');
      const legal = report.findings.find((f) => f.ruleId === 'RETENTION_LEGAL_EXCEPTIONS');

      assert.ok(specific);
      assert.ok(closure);
      assert.ok(legal);

      // In this qualified statement, all findings safely retain the full sentence
      assert.equal(specific.evidence, text);
      assert.equal(closure.evidence, text);
      assert.equal(legal.evidence, text);

      assert.ok(closure.evidence.includes('eligible'));
      assert.ok(closure.evidence.includes('subject to legal retention obligations'));
    });

    it('should refine evidence in mixed disclosure with "though"', () => {
      const text = 'We share personal information with service providers, though we do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'We share personal information with service providers');
      assert.equal(noSell.evidence, 'though we do not sell it.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in mixed disclosure with initial "Although" clause', () => {
      const text = 'Although we share personal information with service providers, we do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'Although we share personal information with service providers');
      assert.equal(noSell.evidence, 'we do not sell it.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in mixed disclosure with initial "While" clause', () => {
      const text = 'While we share personal information with service providers, we do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'While we share personal information with service providers');
      assert.equal(noSell.evidence, 'we do not sell it.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in mixed disclosure with "yet"', () => {
      const text = 'We share personal data with vendors, yet we do not sell it.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'We share personal data with vendors');
      assert.equal(noSell.evidence, 'yet we do not sell it.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should refine evidence in mixed disclosure with coordinate "and" + negation', () => {
      const text = 'We share data with service providers under confidentiality, and we do not sell your personal data.';
      const report = analyzePolicyDocument(text);

      const provider = report.findings.find((f) => f.ruleId === 'SHARE_SERVICE_PROVIDERS');
      const noSell = report.findings.find((f) => f.ruleId === 'SHARE_NO_SELL');

      assert.ok(provider);
      assert.ok(noSell);

      assert.equal(provider.evidence, 'We share data with service providers under confidentiality');
      assert.equal(noSell.evidence, 'and we do not sell your personal data.');

      assert.equal(text.slice(provider.startOffset, provider.endOffset), provider.evidence);
      assert.equal(text.slice(noSell.startOffset, noSell.endOffset), noSell.evidence);
    });

    it('should retain larger excerpt when sentence contains conditional negation restriction', () => {
      const text = 'We do not collect precise location data unless you enable the feature.';
      const report = analyzePolicyDocument(text);

      const finding = report.findings.find((f) => f.ruleId === 'COLLECT_CONDITIONAL_RESTRICTION');
      assert.ok(finding);

      // Separating condition from negative statement would distort meaning
      assert.equal(finding.evidence, text);
      assert.equal(text.slice(finding.startOffset, finding.endOffset), finding.evidence);
    });
  });
});
