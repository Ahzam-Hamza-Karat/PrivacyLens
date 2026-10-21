import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

describe('PrivacyLens Backend API Test Suite', () => {
  describe('GET /api/health', () => {
    it('should return HTTP 200 with service health metadata', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      assert.equal(response.body.success, true);
      assert.equal(response.body.service, 'PrivacyLens API');
      assert.equal(response.body.status, 'healthy');
      assert.equal(typeof response.body.version, 'string');
      assert.equal(typeof response.body.timestamp, 'string');
      assert.equal(typeof response.body.uptimeSeconds, 'number');
    });
  });

  describe('Route Not Found Handling (404)', () => {
    it('should return HTTP 404 with consistent JSON structure for unknown routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect('Content-Type', /json/)
        .expect(404);

      assert.equal(response.body.success, false);
      assert.ok(response.body.error);
      assert.equal(response.body.error.statusCode, 404);
      assert.match(response.body.error.message, /Route not found/);
    });
  });

  describe('CORS and Request Headers', () => {
    it('should include CORS headers for allowed client origin', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      assert.equal(response.headers['access-control-allow-origin'], 'http://localhost:5173');
    });
  });
});
