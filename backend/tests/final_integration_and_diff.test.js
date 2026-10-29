import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { computePolicyDiff, SAMPLE_POLICY_V1, SAMPLE_POLICY_V2 } from '../../frontend/src/utils/policyDiff.js';
import { SIMULATOR_CATEGORIES, createDefaultSimulatorState } from '../../frontend/src/utils/cookieCatalogue.js';
import { RULES } from '../src/services/analyzer/ruleRegistry.js';
import { CATEGORIES } from '../src/constants/policyConstants.js';

describe('Final Integration & Policy Comparison Test Suite', () => {
  describe('Security Headers & Environment Protections', () => {
    it('should enforce defensive HTTP security headers on all API responses', async () => {
      const response = await request(app).get('/api/health').expect(200);

      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(response.headers['x-frame-options'], 'DENY');
      assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
      assert.equal(response.headers['x-xss-protection'], '0');
    });

    it('should include CORS allow-origin header matching clientOrigin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    it('should reject payload exceeding 50,000 chars with HTTP 413 on /api/analyze', async () => {
      const hugeText = 'a'.repeat(50001);
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: hugeText })
        .expect(413);

      assert.equal(response.body.success, false);
      assert.equal(response.body.error.statusCode, 413);
    });
  });

  describe('Policy Version Diff & Comparison Algorithm', () => {
    it('should return 100% similarity and 0 added/removed words for identical versions', () => {
      const text = 'We collect your name and email address for account authentication.';
      const result = computePolicyDiff(text, text);

      assert.equal(result.stats.similarityPercent, 100);
      assert.equal(result.stats.addedWords, 0);
      assert.equal(result.stats.removedWords, 0);
      assert.equal(result.stats.unchangedWords, 10);
      assert.equal(result.diffs.length, 1);
      assert.equal(result.diffs[0].type, 'unchanged');
    });

    it('should detect added words when Version B introduces new disclosures', () => {
      const versionA = 'We collect your name';
      const versionB = 'We collect your name and email address';
      const result = computePolicyDiff(versionA, versionB);

      assert.ok(result.stats.addedWords >= 3); // 'and', 'email', 'address'
      assert.equal(result.stats.removedWords, 0);
      assert.ok(result.stats.similarityPercent < 100);

      const addedParts = result.diffs.filter((d) => d.type === 'added');
      assert.ok(addedParts.length > 0);
      assert.match(addedParts.map((p) => p.text).join(' '), /email address/);
    });

    it('should detect removed words when Version B deletes user rights or disclosures', () => {
      const versionA = 'You have the right to request deletion and data portability';
      const versionB = 'You have the right to request deletion';
      const result = computePolicyDiff(versionA, versionB);

      assert.ok(result.stats.removedWords >= 3); // 'and', 'data', 'portability'
      assert.equal(result.stats.addedWords, 0);
      assert.ok(result.stats.similarityPercent < 100);

      const removedParts = result.diffs.filter((d) => d.type === 'removed');
      assert.ok(removedParts.length > 0);
      assert.match(removedParts.map((p) => p.text).join(' '), /data portability/);
    });

    it('should gracefully handle empty or invalid inputs', () => {
      const emptyResult = computePolicyDiff('', '');
      assert.equal(emptyResult.stats.similarityPercent, 100);
      assert.equal(emptyResult.diffs.length, 0);

      const oneSidedResult = computePolicyDiff('Some policy clause', '');
      assert.equal(oneSidedResult.stats.removedWords, 3);
      assert.equal(oneSidedResult.stats.addedWords, 0);
      assert.equal(oneSidedResult.stats.similarityPercent, 0);

      const nullResult = computePolicyDiff(null, undefined);
      assert.equal(nullResult.stats.similarityPercent, 100);
    });

    it('should correctly diff the educational SAMPLE_POLICY_V1 and SAMPLE_POLICY_V2 fixtures', () => {
      const result = computePolicyDiff(SAMPLE_POLICY_V1, SAMPLE_POLICY_V2);

      assert.ok(result.stats.addedWords > 0);
      assert.ok(result.stats.removedWords > 0);
      assert.ok(result.stats.unchangedWords > 0);
      assert.ok(result.stats.similarityPercent > 40 && result.stats.similarityPercent < 95);

      // Verify addition of device telemetry and analytics pixels
      const addedText = result.diffs
        .filter((d) => d.type === 'added')
        .map((d) => d.text)
        .join(' ');
      assert.match(addedText, /device telemetry/);
      assert.match(addedText, /analytics pixels/);

      // Verify removal of non-collection commitment and 12 months retention
      const removedText = result.diffs
        .filter((d) => d.type === 'removed')
        .map((d) => d.text)
        .join(' ');
      assert.match(removedText, /real-time physical/);
      assert.match(removedText, /12 months/);
    });
  });

  describe('Cookie Simulator & Preference Chart Invariants', () => {
    it('should lock Strictly Essential category as required under all default and reset states', () => {
      const defaultState = createDefaultSimulatorState();
      assert.equal(defaultState.essential, true);
      assert.equal(defaultState.analytics, false);
      assert.equal(defaultState.advertising, false);
      assert.equal(defaultState.functional, false);

      const essentialDef = SIMULATOR_CATEGORIES.find((c) => c.id === 'essential');
      assert.ok(essentialDef);
      assert.equal(essentialDef.required, true);
    });

    it('should define exactly 4 simulated cookie consent categories with required metadata', () => {
      assert.equal(SIMULATOR_CATEGORIES.length, 4);
      for (const cat of SIMULATOR_CATEGORIES) {
        assert.ok(cat.id);
        assert.ok(cat.name);
        assert.ok(cat.description);
        assert.ok(cat.badgeText);
        assert.ok(Array.isArray(cat.simulatedExamples) && cat.simulatedExamples.length > 0);
        assert.ok(cat.impactGranted);
        assert.ok(cat.impactDenied);
      }
    });
  });

  describe('Architectural Invariants & Rule Denominator', () => {
    it('should strictly conserve the 28-rule denominator across 5 categories in backend registry', () => {
      assert.equal(RULES.length, 28);
      const categoryKeys = Object.keys(CATEGORIES);
      assert.equal(categoryKeys.length, 5);

      const uniqueRuleIds = new Set(RULES.map((r) => r.id));
      assert.equal(uniqueRuleIds.size, 28);
    });
  });
});
