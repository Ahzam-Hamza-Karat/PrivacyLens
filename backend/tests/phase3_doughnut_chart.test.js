import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../src/services/analyzer/ruleRegistry.js';
import { CATEGORIES } from '../src/constants/policyConstants.js';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import {
  TOTAL_RULES_COUNT,
  RULES_CATALOGUE,
  CHECK_STATUS,
  CHECK_STATUS_LABELS,
  computeRuleDistribution,
} from '../../frontend/src/utils/rulesCatalogue.js';

describe('Phase 3 — Privacy Analysis Doughnut Chart & Distribution Engine', () => {
  // =========================================================================
  // 1. Rule Catalogue Invariants & Denominator Guarantee
  // =========================================================================
  describe('Rule Registry & Denominator Invariants', () => {
    it('should have strictly 28 rules in both frontend catalogue and backend registry', () => {
      assert.equal(TOTAL_RULES_COUNT, 28);
      assert.equal(RULES_CATALOGUE.length, 28);
      assert.equal(RULES.length, 28);
    });

    it('should match all 28 rule identifiers between frontend and backend registries verbatim', () => {
      const frontendIds = RULES_CATALOGUE.map((r) => r.id).sort();
      const backendIds = RULES.map((r) => r.id).sort();
      assert.deepEqual(frontendIds, backendIds);
    });

    it('should partition the 28 rules across exactly 5 categories with correct cardinality', () => {
      const counts = {
        [CATEGORIES.DATA_COLLECTION]: 0,
        [CATEGORIES.DATA_SHARING]: 0,
        [CATEGORIES.COOKIES_TRACKING]: 0,
        [CATEGORIES.DATA_RETENTION]: 0,
        [CATEGORIES.USER_RIGHTS]: 0,
      };

      RULES_CATALOGUE.forEach((r) => {
        assert.ok(counts[r.category] !== undefined, `Unknown category ${r.category}`);
        counts[r.category]++;
      });

      assert.equal(counts[CATEGORIES.DATA_COLLECTION], 7);
      assert.equal(counts[CATEGORIES.DATA_SHARING], 6);
      assert.equal(counts[CATEGORIES.COOKIES_TRACKING], 5);
      assert.equal(counts[CATEGORIES.DATA_RETENTION], 4);
      assert.equal(counts[CATEGORIES.USER_RIGHTS], 6);

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      assert.equal(total, 28);
    });

    it('should have required display metadata on every rule definition', () => {
      RULES_CATALOGUE.forEach((rule) => {
        assert.ok(typeof rule.id === 'string' && rule.id.length > 0);
        assert.ok(typeof rule.title === 'string' && rule.title.length > 0);
        assert.ok(typeof rule.category === 'string' && rule.category.length > 0);
        assert.ok(typeof rule.categoryName === 'string' && rule.categoryName.length > 0);
        assert.ok(typeof rule.description === 'string' && rule.description.length > 0);
        assert.ok(typeof rule.limitation === 'string' && rule.limitation.length > 0);
      });
    });
  });

  // =========================================================================
  // 2. Mathematical Aggregation & Denominator Conservation
  // =========================================================================
  describe('Mathematical Aggregation & Conservation of 28 Denominator', () => {
    it('should distinguish unperformed analysis from completed analysis (No-Analysis State)', () => {
      const pendingResult = computeRuleDistribution([], { hasAnalyzed: false });
      assert.equal(pendingResult.denominator, 28);
      assert.equal(pendingResult.hasAnalyzed, false);
      assert.equal(pendingResult.counts.found, 0);
      assert.equal(pendingResult.counts.unclear, 0);
      assert.equal(pendingResult.counts.not_found, 0); // Must NOT claim 28 Not Detected before analysis!
      assert.equal(pendingResult.evaluatedRules.length, 28);
      assert.ok(pendingResult.evaluatedRules.every((r) => r.status === CHECK_STATUS.PENDING));
      assert.ok(pendingResult.evaluatedRules.every((r) => r.statusLabel === CHECK_STATUS_LABELS[CHECK_STATUS.PENDING]));
    });

    it('should conserve denominator = 28 when analysis is completed with empty findings', () => {
      const result = computeRuleDistribution([], { hasAnalyzed: true });
      assert.equal(result.denominator, 28);
      assert.equal(result.hasAnalyzed, true);
      assert.equal(result.counts.found, 0);
      assert.equal(result.counts.unclear, 0);
      assert.equal(result.counts.not_found, 28);
      assert.equal(result.counts.total, 28);
      assert.equal(result.percentages.found, 0.0);
      assert.equal(result.percentages.unclear, 0.0);
      assert.equal(result.percentages.not_found, 100.0);
      assert.equal(result.isEmpty, true);
    });

    it('should conserve denominator = 28 when input is null or undefined', () => {
      const fromNull = computeRuleDistribution(null);
      assert.equal(fromNull.denominator, 28);
      assert.equal(fromNull.counts.total, 28);
      assert.equal(fromNull.counts.not_found, 28);

      const fromUndef = computeRuleDistribution(undefined);
      assert.equal(fromUndef.denominator, 28);
      assert.equal(fromUndef.counts.total, 28);
      assert.equal(fromUndef.counts.not_found, 28);
    });

    it('should preserve invariant: found + unclear + not_found === 28 under all circumstances', () => {
      // Test with artificial synthetic finding mix
      const mockFindings = [
        { ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'email' },
        { ruleId: 'COLLECT_LOCATION', matchStrength: 'strong', matchType: 'affirmative', evidence: 'GPS' },
        { ruleId: 'RETENTION_VAGUE_DURATION', matchStrength: 'unclear', matchType: 'vague', evidence: 'as long as necessary' },
      ];

      const res = computeRuleDistribution(mockFindings);
      assert.equal(res.denominator, 28);
      assert.equal(res.counts.found, 2);
      assert.equal(res.counts.unclear, 1);
      assert.equal(res.counts.not_found, 25);
      assert.equal(res.counts.found + res.counts.unclear + res.counts.not_found, 28);
    });

    it('should correctly document and execute 1-decimal rounding on proportions', () => {
      // 1 / 28 = 0.035714... -> 3.6%
      const oneFinding = [{ ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'email' }];
      const res = computeRuleDistribution(oneFinding);

      assert.equal(res.percentages.found, 3.6);
      assert.equal(res.percentageStrings.found, '3.6%');

      // 27 / 28 = 0.964285... -> 96.4%
      assert.equal(res.percentages.not_found, 96.4);
      assert.equal(res.percentageStrings.not_found, '96.4%');
    });

    it('should not double-count rules when multiple findings trigger for the same rule', () => {
      const duplicateRuleFindings = [
        { ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'We collect your name.' },
        { ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'We collect your email.' },
        { ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'We collect your phone.' },
      ];

      const res = computeRuleDistribution(duplicateRuleFindings);
      assert.equal(res.counts.found, 1); // Strictly 1 rule check found, not 3
      assert.equal(res.counts.not_found, 27);
      assert.equal(res.counts.found + res.counts.unclear + res.counts.not_found, 28);

      const contactRule = res.evaluatedRules.find((r) => r.id === 'COLLECT_DIRECT_CONTACT');
      assert.equal(contactRule.matchCount, 3);
      assert.equal(contactRule.status, CHECK_STATUS.FOUND);
    });
  });

  // =========================================================================
  // 3. Status Classification & Ambiguity Handling
  // =========================================================================
  describe('Status Classification (Found vs Unclear vs Not Detected)', () => {
    it('should classify affirmative matches as Found', () => {
      const findings = [
        { ruleId: 'SHARE_SERVICE_PROVIDERS', matchStrength: 'strong', matchType: 'affirmative', evidence: 'We share with vendors.' },
      ];
      const res = computeRuleDistribution(findings);
      const rule = res.evaluatedRules.find((r) => r.id === 'SHARE_SERVICE_PROVIDERS');
      assert.equal(rule.status, CHECK_STATUS.FOUND);
      assert.equal(rule.statusLabel, CHECK_STATUS_LABELS[CHECK_STATUS.FOUND]);
    });

    it('should classify vague retention matches as Unclear', () => {
      const findings = [
        { ruleId: 'RETENTION_VAGUE_DURATION', matchStrength: 'unclear', matchType: 'vague', evidence: 'We retain data as long as needed.' },
      ];
      const res = computeRuleDistribution(findings);
      const rule = res.evaluatedRules.find((r) => r.id === 'RETENTION_VAGUE_DURATION');
      assert.equal(rule.status, CHECK_STATUS.UNCLEAR);
      assert.equal(rule.statusLabel, CHECK_STATUS_LABELS[CHECK_STATUS.UNCLEAR]);
    });

    it('should classify unmentioned rules as Not Detected', () => {
      const findings = [
        { ruleId: 'RIGHTS_ACCESS_REQUEST', matchStrength: 'strong', matchType: 'affirmative', evidence: 'You can request data.' },
      ];
      const res = computeRuleDistribution(findings);
      const rule = res.evaluatedRules.find((r) => r.id === 'RIGHTS_DELETION_ERASURE');
      assert.equal(rule.status, CHECK_STATUS.NOT_DETECTED);
      assert.equal(rule.statusLabel, CHECK_STATUS_LABELS[CHECK_STATUS.NOT_DETECTED]);
      assert.equal(rule.evidenceExcerpt, null);
    });

    it('should distinguish vague rule triggers from standard affirmative rule triggers', () => {
      // Vague rule triggers yield unclear status
      const vagueFindings = [
        { ruleId: 'RETENTION_VAGUE_DURATION', matchStrength: 'unclear', matchType: 'vague', evidence: 'for as long as needed' },
      ];
      const vagueRes = computeRuleDistribution(vagueFindings);
      const vagueRule = vagueRes.evaluatedRules.find((r) => r.id === 'RETENTION_VAGUE_DURATION');
      assert.equal(vagueRule.status, CHECK_STATUS.UNCLEAR);

      // Affirmative rule triggers yield found status
      const affFindings = [
        { ruleId: 'COLLECT_DIRECT_CONTACT', matchStrength: 'strong', matchType: 'affirmative', evidence: 'email' },
      ];
      const affRes = computeRuleDistribution(affFindings);
      const affRule = affRes.evaluatedRules.find((r) => r.id === 'COLLECT_DIRECT_CONTACT');
      assert.equal(affRule.status, CHECK_STATUS.FOUND);
    });
  });

  // =========================================================================
  // 4. Real Engine End-to-End Evaluation Integration
  // =========================================================================
  describe('End-to-End Policy Analysis Report Integration', () => {
    it('should evaluate a multi-category policy text and maintain 28-rule invariant', () => {
      const policyText = `
        We collect your name and email address when you register.
        We also collect device IP addresses and browser telemetry.
        We do not sell your personal information.
        We use first-party cookies for session management.
        We retain your data for as long as necessary to provide services.
        You may request access to your personal data or opt out of marketing.
      `;

      const report = analyzePolicyDocument(policyText);
      assert.ok(report.findings.length > 0);

      const res = computeRuleDistribution(report.findings);
      assert.equal(res.denominator, 28);
      assert.equal(res.counts.total, 28);
      assert.equal(res.counts.found + res.counts.unclear + res.counts.not_found, 28);

      // Verify specific expected rules
      assert.ok(res.counts.found >= 4);
      assert.ok(res.counts.unclear >= 1); // RETENTION_VAGUE_DURATION triggered
      assert.ok(res.counts.not_found >= 1);

      // Verify percentages calculate cleanly
      const sumPercentages = res.percentages.found + res.percentages.unclear + res.percentages.not_found;
      assert.ok(sumPercentages >= 99.8 && sumPercentages <= 100.2, `Sum was ${sumPercentages}`);
    });

    it('should strictly avoid outputting arbitrary scores, letter grades, or safety indexes', () => {
      const res = computeRuleDistribution([]);
      assert.equal(res.score, undefined);
      assert.equal(res.grade, undefined);
      assert.equal(res.complianceScore, undefined);
      assert.equal(res.safetyIndex, undefined);
    });
  });
});

