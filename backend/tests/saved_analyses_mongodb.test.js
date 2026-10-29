import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { ObjectId } from 'mongodb';
import app from '../src/app.js';
import { setMockDb, closeDatabaseConnection } from '../src/services/db/mongoClient.js';

/**
 * Creates an in-memory mock collection simulating MongoDB collection operations.
 */
function createMockCollection() {
  const store = new Map();

  return {
    async insertOne(doc) {
      const _id = doc._id || new ObjectId();
      const stored = { ...doc, _id };
      store.set(_id.toString(), stored);
      return { insertedId: _id, acknowledged: true };
    },
    find(query = {}) {
      let results = Array.from(store.values());

      if (query.clientTokenHash) {
        results = results.filter((d) => d.clientTokenHash === query.clientTokenHash);
      }

      return {
        project(fields) {
          return this;
        },
        sort(sortSpec) {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return this;
        },
        limit(n) {
          results = results.slice(0, n);
          return this;
        },
        async toArray() {
          return results.map((d) => ({ ...d }));
        },
      };
    },
    async findOne(query = {}) {
      for (const doc of store.values()) {
        let match = true;
        if (query._id && doc._id.toString() !== query._id.toString()) {
          match = false;
        }
        if (query.clientTokenHash && doc.clientTokenHash !== query.clientTokenHash) {
          match = false;
        }
        if (match) return { ...doc };
      }
      return null;
    },
    async deleteOne(query = {}) {
      for (const [key, doc] of store.entries()) {
        let match = true;
        if (query._id && doc._id.toString() !== query._id.toString()) {
          match = false;
        }
        if (query.clientTokenHash && doc.clientTokenHash !== query.clientTokenHash) {
          match = false;
        }
        if (match) {
          store.delete(key);
          return { deletedCount: 1, acknowledged: true };
        }
      }
      return { deletedCount: 0, acknowledged: true };
    },
    async createIndex() {
      return 'index_created';
    },
    _getStore() {
      return store;
    },
  };
}

describe('MongoDB Persistence & Saved Analyses Test Suite', () => {
  const CLIENT_A = 'test-client-token-uuid-1111-aaaa-2222';
  const CLIENT_B = 'test-client-token-uuid-3333-bbbb-4444';

  let mockCollection;
  let mockDb;

  beforeEach(() => {
    mockCollection = createMockCollection();
    mockDb = {
      collection(name) {
        if (name === 'saved_analyses') return mockCollection;
        throw new Error(`Unexpected collection name: ${name}`);
      },
    };
    setMockDb(mockDb);
  });

  afterEach(async () => {
    await closeDatabaseConnection();
  });

  describe('1. Database Diagnostic Endpoint (GET /api/saved-analyses/status)', () => {
    it('should return database connection status without leaking credentials', async () => {
      const res = await request(app)
        .get('/api/saved-analyses/status')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.connected, true);
      assert.equal(typeof res.body.data.databaseName, 'string');
      assert.equal(res.body.data.uri, undefined); // Never leak URI or password
    });

    it('should reflect database status in overall health endpoint', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(res.body.database);
      assert.equal(res.body.database.connected, true);
    });
  });

  describe('2. Save Analysis Report (POST /api/saved-analyses)', () => {
    it('should reject saving if client token is missing (401)', async () => {
      const res = await request(app)
        .post('/api/saved-analyses')
        .send({
          consentGiven: true,
          title: 'My Saved Policy',
          summary: { totalRules: 28, foundCount: 15, unclearCount: 5, notDetectedCount: 8 },
          findings: [],
        })
        .expect(401);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'CLIENT_TOKEN_REQUIRED');
    });

    it('should reject saving if explicit consent is not provided (400)', async () => {
      const res = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: false,
          title: 'Unconsented Save',
          summary: { totalRules: 28, foundCount: 15, unclearCount: 5, notDetectedCount: 8 },
          findings: [],
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'CONSENT_REQUIRED');
    });

    it('should reject saving if summary object is missing (400)', async () => {
      const res = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Missing Summary',
        })
        .expect(400);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_SUMMARY');
    });

    it('should successfully save analysis when valid consent and payload are provided (201)', async () => {
      const sampleFindings = [
        {
          ruleId: 'DATA_COLL_EMAIL',
          ruleName: 'Email Collection',
          category: 'Data Collection',
          status: 'found',
          confidence: 'HIGH',
          explanation: 'We collect your email address for account authentication.',
          evidence: 'we collect your email address',
          evidenceOffset: { start: 10, end: 38 },
        },
      ];

      const res = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Acme SaaS Privacy Policy',
          policyLength: 4500,
          summary: {
            totalRules: 28,
            foundCount: 20,
            unclearCount: 8,
            notDetectedCount: 0,
            categorySummary: { dataCollection: { found: 5, unclear: 1, notFound: 0 } },
          },
          findings: sampleFindings,
        })
        .expect(201);

      assert.equal(res.body.success, true);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.title, 'Acme SaaS Privacy Policy');
      assert.equal(res.body.data.findingsCount, 1);
      assert.equal(res.body.data.summary.totalRules, 28);

      // Verify record stored in mock database
      const stored = mockCollection._getStore().get(res.body.data.id);
      assert.ok(stored);
      assert.equal(stored.consentGiven, true);
      assert.ok(stored.clientTokenHash);
      // Ensure raw client token is NOT stored in plain text
      assert.notEqual(stored.clientTokenHash, CLIENT_A);
    });
  });

  describe('3. List Saved Analyses & Access Control (GET /api/saved-analyses)', () => {
    it('should list only analyses belonging to requesting client token', async () => {
      // Save 2 items for Client A
      await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Client A Policy 1',
          summary: { totalRules: 28, foundCount: 10, unclearCount: 5, notDetectedCount: 13 },
          findings: [],
        });

      await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Client A Policy 2',
          summary: { totalRules: 28, foundCount: 12, unclearCount: 4, notDetectedCount: 12 },
          findings: [],
        });

      // Save 1 item for Client B
      await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_B)
        .send({
          consentGiven: true,
          title: 'Client B Private Policy',
          summary: { totalRules: 28, foundCount: 5, unclearCount: 2, notDetectedCount: 21 },
          findings: [],
        });

      // Client A should see exactly 2 policies
      const resA = await request(app)
        .get('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .expect(200);

      assert.equal(resA.body.success, true);
      assert.equal(resA.body.data.length, 2);
      assert.equal(resA.body.data.some((d) => d.title === 'Client B Private Policy'), false);

      // Client B should see exactly 1 policy
      const resB = await request(app)
        .get('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_B)
        .expect(200);

      assert.equal(resB.body.success, true);
      assert.equal(resB.body.data.length, 1);
      assert.equal(resB.body.data[0].title, 'Client B Private Policy');
    });

    it('should reject listing if client token is missing (401)', async () => {
      const res = await request(app)
        .get('/api/saved-analyses')
        .expect(401);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'CLIENT_TOKEN_REQUIRED');
    });
  });

  describe('4. Retrieve Saved Analysis by ID (GET /api/saved-analyses/:id)', () => {
    it('should reject invalid ObjectId format with HTTP 400', async () => {
      const res = await request(app)
        .get('/api/saved-analyses/invalid-id-format')
        .set('X-Client-Token', CLIENT_A)
        .expect(400);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'INVALID_ID');
    });

    it('should return 404 if record belongs to a different client token', async () => {
      // Create record for Client A
      const createRes = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Confidential Policy of A',
          summary: { totalRules: 28, foundCount: 20, unclearCount: 8, notDetectedCount: 0 },
          findings: [],
        });

      const recordId = createRes.body.data.id;

      // Client B attempts to fetch Client A's record
      const res = await request(app)
        .get(`/api/saved-analyses/${recordId}`)
        .set('X-Client-Token', CLIENT_B)
        .expect(404);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'NOT_FOUND');
    });

    it('should return full analysis when requested by the owner client token', async () => {
      const createRes = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Audit Report for Retrieval',
          summary: { totalRules: 28, foundCount: 20, unclearCount: 8, notDetectedCount: 0 },
          findings: [
            {
              ruleId: 'SEC_ENCRYPTION_TRANSIT',
              ruleName: 'Encryption in Transit',
              category: 'Security & Cookies',
              status: 'found',
              confidence: 'HIGH',
              explanation: 'Uses TLS 1.3 encryption.',
              evidence: 'we encrypt data in transit',
            },
          ],
        });

      const recordId = createRes.body.data.id;

      const res = await request(app)
        .get(`/api/saved-analyses/${recordId}`)
        .set('X-Client-Token', CLIENT_A)
        .expect(200);

      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, recordId);
      assert.equal(res.body.data.title, 'Audit Report for Retrieval');
      assert.equal(res.body.data.findings.length, 1);
      assert.equal(res.body.data.findings[0].ruleId, 'SEC_ENCRYPTION_TRANSIT');
    });
  });

  describe('5. Delete Saved Analysis (DELETE /api/saved-analyses/:id)', () => {
    it('should return 404 when attempting to delete another client\'s record', async () => {
      const createRes = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Protected Record',
          summary: { totalRules: 28, foundCount: 10, unclearCount: 0, notDetectedCount: 18 },
          findings: [],
        });

      const recordId = createRes.body.data.id;

      // Client B attempts deletion
      const deleteRes = await request(app)
        .delete(`/api/saved-analyses/${recordId}`)
        .set('X-Client-Token', CLIENT_B)
        .expect(404);

      assert.equal(deleteRes.body.success, false);
      assert.equal(deleteRes.body.error.code, 'NOT_FOUND');

      // Verify record still exists
      assert.ok(mockCollection._getStore().has(recordId));
    });

    it('should successfully delete record when requested by owner client token', async () => {
      const createRes = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Record To Be Deleted',
          summary: { totalRules: 28, foundCount: 10, unclearCount: 0, notDetectedCount: 18 },
          findings: [],
        });

      const recordId = createRes.body.data.id;

      const deleteRes = await request(app)
        .delete(`/api/saved-analyses/${recordId}`)
        .set('X-Client-Token', CLIENT_A)
        .expect(200);

      assert.equal(deleteRes.body.success, true);
      assert.match(deleteRes.body.message, /permanently deleted/i);

      // Verify record is gone
      assert.equal(mockCollection._getStore().has(recordId), false);
    });
  });

  describe('6. Database Failure Handling & Transient Analysis Invariant', () => {
    it('should return HTTP 503 DATABASE_UNAVAILABLE when database is disconnected', async () => {
      // Disconnect DB mock
      setMockDb(null);

      const res = await request(app)
        .post('/api/saved-analyses')
        .set('X-Client-Token', CLIENT_A)
        .send({
          consentGiven: true,
          title: 'Attempt Save Offline',
          summary: { totalRules: 28, foundCount: 20, unclearCount: 8, notDetectedCount: 0 },
          findings: [],
        })
        .expect(503);

      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'DATABASE_UNAVAILABLE');
    });

    it('should preserve transient policy analysis even when MongoDB is offline', async () => {
      // Ensure DB is disconnected
      setMockDb(null);

      const policySnippet = `1. INFORMATION COLLECTION
We collect your name, email address, and phone number when you register.
We use first-party cookies to maintain your authenticated session.
We delete personal identifiers within ninety (90) days following account closure.`;

      const res = await request(app)
        .post('/api/analyze')
        .send({
          policyText: policySnippet,
        })
        .expect(200);

      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.findings));
      assert.ok(res.body.findings.length > 0);
      assert.equal(res.body.engine.type, 'rule-based');
    });
  });
});
