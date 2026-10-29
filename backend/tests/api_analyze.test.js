import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { MAX_POLICY_LENGTH } from '../src/constants/policyConstants.js';

describe('Policy Analysis API Integration Suite — POST /api/analyze', () => {
  const samplePolicyText = `1. INFORMATION COLLECTION
We collect your name, email address, and phone number when you register.
We also collect IP addresses and browser telemetry automatically.

2. THIRD PARTY SHARING
We share personal data with cloud infrastructure service providers under confidentiality agreements.
We do not sell personal data to data brokers.

3. COOKIES
We use first-party cookies to maintain your authenticated session.
Users can adjust cookie settings via browser preferences.

4. DATA RETENTION
We delete or anonymize personal identifiers within ninety (90) days following account closure.

5. USER RIGHTS
You may request access to a copy of your personal data or request deletion.
Contact privacy@example.com to exercise your rights within thirty (30) days.`;

  describe('Successful Analysis (HTTP 200)', () => {
    it('should accept valid policy text and return conforming structured report', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: samplePolicyText })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);

      const body = response.body;

      // Top-level structure verification
      assert.equal(body.success, true);
      assert.equal(typeof body.engine, 'object');
      assert.equal(body.engine.type, 'rule-based');
      assert.equal(body.engine.version, '1.0.0');

      // Metadata verification
      assert.equal(typeof body.metadata, 'object');
      assert.equal(body.metadata.characterCount, samplePolicyText.length);
      assert.ok(body.metadata.paragraphCount >= 5);
      assert.ok(body.metadata.segmentCount >= 8);
      assert.equal(typeof body.metadata.analyzedAt, 'string');

      // Summary verification
      assert.equal(typeof body.summary, 'object');
      assert.ok(body.summary.totalFindings > 0);
      assert.equal(typeof body.summary.categoryCounts, 'object');
      assert.equal(typeof body.summary.overallStatus, 'object');

      // Categories verification (all 5 required categories present)
      assert.ok(Array.isArray(body.categories));
      assert.equal(body.categories.length, 5);

      const categoryIds = body.categories.map((c) => c.id);
      assert.ok(categoryIds.includes('data_collection'));
      assert.ok(categoryIds.includes('data_sharing'));
      assert.ok(categoryIds.includes('cookies_tracking'));
      assert.ok(categoryIds.includes('data_retention'));
      assert.ok(categoryIds.includes('user_rights'));

      for (const cat of body.categories) {
        assert.ok(['found', 'unclear', 'not_found'].includes(cat.status));
        assert.equal(typeof cat.name, 'string');
        assert.equal(typeof cat.summary, 'string');
        assert.equal(typeof cat.explanation, 'string');
        assert.ok(Array.isArray(cat.findings));
      }

      // Findings verification
      assert.ok(Array.isArray(body.findings));
      assert.ok(body.findings.length >= 5);

      for (const finding of body.findings) {
        assert.ok(finding.id.startsWith('finding-'));
        assert.ok(finding.category);
        assert.ok(finding.ruleId);
        assert.ok(finding.title);
        assert.ok(finding.description);
        assert.ok(finding.evidence);
        assert.ok(finding.paragraphId);
        assert.ok(finding.segmentId);
        assert.equal(typeof finding.startOffset, 'number');
        assert.equal(typeof finding.endOffset, 'number');
        assert.ok(['strong', 'possible', 'unclear'].includes(finding.matchStrength));
        assert.ok(['affirmative', 'negative_disclosure', 'conditional', 'vague'].includes(finding.matchType));
        assert.ok(finding.limitation);

        // Verbatim slice check
        const sliced = samplePolicyText.slice(finding.startOffset, finding.endOffset);
        assert.equal(sliced, finding.evidence);
      }

      // Limitations verification
      assert.ok(Array.isArray(body.limitations));
      assert.ok(body.limitations.length >= 3);
    });
  });

  describe('Input Validation Rejection (HTTP 400)', () => {
    it('should return 400 for empty body object', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /Missing required field: "policyText"/);
    });

    it('should return 400 for whitespace-only policyText', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: '   \n\t  ' })
        .expect(400);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /cannot be empty or whitespace-only/);
    });

    it('should return 400 for non-string policyText', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: 99999 })
        .expect(400);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /must be a string/);
    });

    it('should return 400 for unexpected extra request fields', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: 'Valid text', unknownParam: 'injected' })
        .expect(400);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /Unexpected fields in request body/);
    });
  });

  describe('Payload Limit Enforcement (HTTP 413)', () => {
    it('should return 413 when policy text exceeds 50,000 characters', async () => {
      const oversizedText = 'A'.repeat(MAX_POLICY_LENGTH + 10);
      const response = await request(app)
        .post('/api/analyze')
        .send({ policyText: oversizedText })
        .expect(413);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /exceeds the maximum allowed limit/);
    });
  });

  describe('Content-Type Enforcement (HTTP 415)', () => {
    it('should return 415 when request Content-Type is text/plain', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .set('Content-Type', 'text/plain')
        .send('Raw policy string')
        .expect(415);

      assert.equal(response.body.success, false);
      assert.match(response.body.error.message, /Unsupported Content-Type/);
    });
  });
});
