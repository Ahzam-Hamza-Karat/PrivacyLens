import { MongoClient } from 'mongodb';
import config from '../../config/index.js';

let client = null;
let dbInstance = null;
let isConnected = false;
let mockDbInstance = null;

/**
 * Initializes and connects the MongoDB client.
 * Fails gracefully without throwing if connection cannot be established or if URI is not provided.
 * @param {string} [uri] Optional override URI for testing
 * @returns {Promise<{connected: boolean, error?: string}>}
 */
export async function connectToDatabase(uri = config.mongodbUri) {
  // If a mock DB is injected (for automated unit/integration testing)
  if (mockDbInstance) {
    dbInstance = mockDbInstance;
    isConnected = true;
    return { connected: true };
  }

  if (!uri || uri.trim() === '') {
    isConnected = false;
    dbInstance = null;
    return {
      connected: false,
      error: 'MONGODB_URI is not configured in environment variables.',
    };
  }

  try {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignore close errors on reconnect
      }
    }

    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: config.mongodbConnectTimeoutMs || 3000,
      connectTimeoutMS: config.mongodbConnectTimeoutMs || 3000,
    });

    await client.connect();
    dbInstance = client.db(config.mongodbDbName || 'privacylens');
    isConnected = true;

    // Ensure appropriate indexes exist on saved_analyses collection
    try {
      const collection = dbInstance.collection('saved_analyses');
      await collection.createIndex({ clientTokenHash: 1, createdAt: -1 });
    } catch (idxErr) {
      console.warn('MongoDB index creation notice:', idxErr.message);
    }

    return { connected: true };
  } catch (err) {
    isConnected = false;
    dbInstance = null;
    client = null;
    return {
      connected: false,
      error: err.message || 'Failed to establish MongoDB connection',
    };
  }
}

/**
 * Returns the active MongoDB database instance, or null if disconnected.
 * @returns {import('mongodb').Db | null}
 */
export function getDb() {
  if (mockDbInstance) {
    return mockDbInstance;
  }
  return isConnected ? dbInstance : null;
}

/**
 * Checks whether the database is actively connected.
 * @returns {boolean}
 */
export function isDbConnected() {
  return Boolean(mockDbInstance || (isConnected && dbInstance));
}

/**
 * Safe status descriptor that never exposes sensitive credentials.
 * @returns {{connected: boolean, configured: boolean, databaseName: string}}
 */
export function getDbStatus() {
  const configured = Boolean(config.mongodbUri && config.mongodbUri.trim().length > 0);
  return {
    connected: isDbConnected(),
    configured,
    databaseName: config.mongodbDbName || 'privacylens',
  };
}

/**
 * Closes the active database connection.
 */
export async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
    } catch {
      // Ignore
    }
    client = null;
  }
  isConnected = false;
  dbInstance = null;
  mockDbInstance = null;
}

/**
 * Injects a mock or in-memory DB implementation for testing.
 * @param {object | null} mock
 */
export function setMockDb(mock) {
  mockDbInstance = mock;
  isConnected = Boolean(mock);
}

