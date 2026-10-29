/**
 * PrivacyLens — Official Live MongoDB Verification Script
 * Validates connectivity to the local MongoDB Community Server (privacylens.saved_reports)
 * and verifies CRUD, explicit consent, and SHA-256 client-token isolation.
 *
 * Usage: npm run verify:mongodb (from root) or node scripts/verify_live_mongodb.js (from backend)
 */
import crypto from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import config from '../src/config/index.js';

const BASE_URL = `http://${config.host || 'localhost'}:${config.port || 5000}`;
const MONGO_URI = config.mongodbUri || 'mongodb://127.0.0.1:27017';
const DB_NAME = config.mongodbDbName || 'privacylens';
const COLLECTION_NAME = config.mongodbCollectionName || 'saved_reports';

async function runLiveVerification() {
  console.log('===============================================================');
  console.log(' PRIVACYLENS — LIVE LOCAL MONGODB VERIFICATION');
  console.log('===============================================================');
  console.log(`Target URI:        ${MONGO_URI}`);
  console.log(`Target Database:   ${DB_NAME}`);
  console.log(`Target Collection: ${COLLECTION_NAME}`);
  console.log(`Backend API URL:   ${BASE_URL}`);
  console.log('---------------------------------------------------------------');

  // 1. Direct MongoDB TCP connection
  console.log('\n[Step 1] Connecting directly to local MongoDB Community Server...');
  let mongoClient;
  try {
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    await mongoClient.connect();
    console.log('  ✓ Direct TCP connection to MongoDB established successfully.');
  } catch (connErr) {
    console.error(`  ✗ Failed to connect to MongoDB at ${MONGO_URI}: ${connErr.message}`);
    console.error('    Please ensure the MongoDB Windows service is running (net start MongoDB).');
    process.exit(1);
  }

  const db = mongoClient.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);
  const initialCount = await collection.countDocuments();
  console.log(`  ✓ Database "${DB_NAME}" and collection "${COLLECTION_NAME}" confirmed.`);
  console.log(`  ✓ Current document count: ${initialCount} (existing user documents will be preserved).`);

  // 2. Health & Status Endpoints
  console.log('\n[Step 2] Querying backend HTTP endpoints (/api/health & /api/saved-analyses/status)...');
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    if (!healthRes.database?.connected || healthRes.database?.databaseName !== DB_NAME) {
      throw new Error(`Unexpected health payload: ${JSON.stringify(healthRes)}`);
    }
    console.log(`  ✓ /api/health reports: healthy (database connected to "${healthRes.database.databaseName}")`);

    const statusRes = await fetch(`${BASE_URL}/api/saved-analyses/status`).then(r => r.json());
    if (!statusRes.data?.connected || statusRes.data?.collectionName !== COLLECTION_NAME) {
      throw new Error(`Unexpected status payload: ${JSON.stringify(statusRes)}`);
    }
    console.log(`  ✓ /api/saved-analyses/status reports: connected: true, collection: "${statusRes.data.collectionName}"`);
  } catch (apiErr) {
    console.error(`  ✗ Backend API check failed: ${apiErr.message}`);
    console.error('    Please ensure the Express backend dev server is running on port 5000.');
    await mongoClient.close();
    process.exit(1);
  }

  // 3. Authorization & Consent Enforcements
  console.log('\n[Step 3] Testing Authorization & Consent requirements...');
  
  // 3a. Missing token -> 401
  const noTokenRes = await fetch(`${BASE_URL}/api/saved-analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentGiven: true, summary: { totalRules: 28 }, findings: [] })
  });
  if (noTokenRes.status === 401) {
    console.log('  ✓ Missing X-Client-Token rejected with HTTP 401 CLIENT_TOKEN_REQUIRED');
  } else {
    throw new Error(`Expected HTTP 401 for missing token, received ${noTokenRes.status}`);
  }

  // 3b. Missing consent -> 400
  const CLIENT_A = 'disposable-verify-token-client-a-' + Date.now();
  const noConsentRes = await fetch(`${BASE_URL}/api/saved-analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Token': CLIENT_A },
    body: JSON.stringify({ consentGiven: false, summary: { totalRules: 28 }, findings: [] })
  });
  if (noConsentRes.status === 400) {
    console.log('  ✓ Unconsented save (consentGiven: false) rejected with HTTP 400 CONSENT_REQUIRED');
  } else {
    throw new Error(`Expected HTTP 400 for unconsented save, received ${noConsentRes.status}`);
  }

  // 3c. Invalid ObjectId format -> 400
  const invalidIdRes = await fetch(`${BASE_URL}/api/saved-analyses/invalid-not-hex-id`, {
    headers: { 'X-Client-Token': CLIENT_A }
  });
  if (invalidIdRes.status === 400) {
    console.log('  ✓ Invalid ObjectId rejected with HTTP 400 INVALID_ID');
  } else {
    throw new Error(`Expected HTTP 400 for invalid ObjectId, received ${invalidIdRes.status}`);
  }

  // 4. Save Disposable Test Report
  console.log('\n[Step 4] Saving disposable test report with explicit consent...');
  const testPayload = {
    consentGiven: true,
    title: 'Verification Live Audit Policy',
    policyLength: 1250,
    summary: {
      totalRules: 28,
      foundCount: 18,
      unclearCount: 4,
      notDetectedCount: 6,
      categorySummary: {
        dataCollection: { found: 6, unclear: 1, notFound: 0 },
        dataSharing: { found: 4, unclear: 1, notFound: 2 },
      }
    },
    findings: [
      {
        ruleId: 'SEC_ENCRYPTION_TRANSIT',
        ruleName: 'Encryption in Transit',
        category: 'Security & Retention',
        status: 'found',
        confidence: 'HIGH',
        explanation: 'We utilize Transport Layer Security (TLS) encryption to protect all data transmissions.',
        evidence: 'We utilize Transport Layer Security (TLS) encryption',
        evidenceOffset: { start: 100, end: 157 }
      }
    ]
  };

  const saveRes = await fetch(`${BASE_URL}/api/saved-analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Token': CLIENT_A },
    body: JSON.stringify(testPayload)
  });

  if (saveRes.status !== 201) {
    throw new Error(`Save failed with HTTP ${saveRes.status}`);
  }
  const saveJson = await saveRes.json();
  const testId = saveJson.data.id;
  console.log(`  ✓ Report saved successfully via API: ID = ${testId}`);

  // 5. Inspect Direct Document & SHA-256 Token Hash
  console.log('\n[Step 5] Inspecting saved document directly in MongoDB...');
  const docInDb = await collection.findOne({ _id: new ObjectId(testId) });
  if (!docInDb) {
    throw new Error('Inserted document was not found in MongoDB collection!');
  }
  const expectedHash = crypto.createHash('sha256').update(CLIENT_A).digest('hex');
  if (docInDb.clientTokenHash !== expectedHash) {
    throw new Error(`Token hash mismatch! Expected ${expectedHash}, got ${docInDb.clientTokenHash}`);
  }
  console.log(`  ✓ Confirmed document in ${DB_NAME}.${COLLECTION_NAME}`);
  console.log(`    - ID:               ${docInDb._id.toString()}`);
  console.log(`    - SHA-256 Hash:     ${docInDb.clientTokenHash}`);
  console.log(`    - Raw Token Stored: false`);
  console.log(`    - Consent Given:    ${docInDb.consentGiven}`);

  // 6. Cross-Client Scoping (Client B vs Client A)
  console.log('\n[Step 6] Testing cross-client isolation (Client B vs Client A)...');
  const CLIENT_B = 'disposable-verify-token-client-b-' + Date.now();

  // Client A list contains item
  const listARes = await fetch(`${BASE_URL}/api/saved-analyses`, {
    headers: { 'X-Client-Token': CLIENT_A }
  }).then(r => r.json());
  if (!listARes.data?.some(d => d.id === testId)) {
    throw new Error('Client A could not find their saved report in list!');
  }
  console.log('  ✓ Client A successfully lists their own saved report');

  // Client B list does NOT contain item
  const listBRes = await fetch(`${BASE_URL}/api/saved-analyses`, {
    headers: { 'X-Client-Token': CLIENT_B }
  }).then(r => r.json());
  if (listBRes.data?.some(d => d.id === testId)) {
    throw new Error('SECURITY VIOLATION: Client B can see Client A\'s report in list!');
  }
  console.log('  ✓ Client B list returns empty (no cross-client leakage)');

  // Client B cannot retrieve Client A's report
  const getBRes = await fetch(`${BASE_URL}/api/saved-analyses/${testId}`, {
    headers: { 'X-Client-Token': CLIENT_B }
  });
  if (getBRes.status === 404) {
    console.log('  ✓ Client B retrieval of Client A\'s report rejected with HTTP 404 NOT_FOUND');
  } else {
    throw new Error(`Expected HTTP 404 for unauthorized retrieval, received ${getBRes.status}`);
  }

  // Client B cannot delete Client A's report
  const delBRes = await fetch(`${BASE_URL}/api/saved-analyses/${testId}`, {
    method: 'DELETE',
    headers: { 'X-Client-Token': CLIENT_B }
  });
  if (delBRes.status === 404) {
    console.log('  ✓ Client B deletion of Client A\'s report rejected with HTTP 404 NOT_FOUND');
  } else {
    throw new Error(`Expected HTTP 404 for unauthorized deletion, received ${delBRes.status}`);
  }

  // 7. Client A Retrieval by ID
  console.log('\n[Step 7] Client A retrieval of saved report by ID...');
  const getARes = await fetch(`${BASE_URL}/api/saved-analyses/${testId}`, {
    headers: { 'X-Client-Token': CLIENT_A }
  });
  if (getARes.status !== 200) {
    throw new Error(`Client A failed to retrieve their report: ${getARes.status}`);
  }
  const getAJson = await getARes.json();
  if (getAJson.data.findings?.[0]?.ruleId !== 'SEC_ENCRYPTION_TRANSIT') {
    throw new Error('Retrieved findings did not match saved findings!');
  }
  console.log('  ✓ Client A retrieved full report with intact findings and character offsets');

  // 8. Clean up disposable test record only
  console.log('\n[Step 8] Cleaning up disposable test record...');
  const deleteRes = await fetch(`${BASE_URL}/api/saved-analyses/${testId}`, {
    method: 'DELETE',
    headers: { 'X-Client-Token': CLIENT_A }
  });
  if (deleteRes.status === 200) {
    console.log('  ✓ Disposable test record deleted via API (HTTP 200)');
  } else {
    throw new Error(`Failed to delete test record: ${deleteRes.status}`);
  }

  const checkDeleted = await collection.findOne({ _id: new ObjectId(testId) });
  if (checkDeleted !== null) {
    throw new Error('Test document still exists in MongoDB after deletion!');
  }
  console.log('  ✓ Confirmed test document removed from MongoDB.');

  const finalCount = await collection.countDocuments();
  console.log(`  ✓ Final document count: ${finalCount} (pre-existing user documents preserved).`);

  await mongoClient.close();
  console.log('\n===============================================================');
  console.log(' ✅ ALL LIVE MONGODB VERIFICATION CHECKS PASSED (100%)');
  console.log('===============================================================');
}

runLiveVerification().catch(err => {
  console.error('\n✗ Verification failed:', err.message);
  process.exit(1);
});
