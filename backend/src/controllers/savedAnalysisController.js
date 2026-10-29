import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import config from '../config/index.js';
import { getDb, isDbConnected, getDbStatus } from '../services/db/mongoClient.js';

/**
 * Validates and hashes a client token using SHA-256 for privacy-preserving access control.
 * @param {string} token
 * @returns {string | null}
 */
function hashClientToken(token) {
  if (!token || typeof token !== 'string') return null;
  const trimmed = token.trim();
  if (trimmed.length < 8 || trimmed.length > 128) return null;
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

/**
 * Validates a 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id
 * @returns {boolean}
 */
function isValidObjectId(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Resolves the configured MongoDB collection name for saved reports.
 * Defaults to 'saved_reports' to match database specification.
 * @returns {string}
 */
function getCollectionName() {
  return config.mongodbCollectionName || 'saved_reports';
}

/**
 * GET /api/saved-analyses/status
 * Diagnostic endpoint for database persistence status.
 */
export const getDatabaseHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    data: getDbStatus(),
  });
};

/**
 * POST /api/saved-analyses
 * Saves an analysis report after explicit user consent.
 */
export const saveAnalysis = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB service is currently unavailable. Analysis saving is temporarily disabled.',
        },
      });
    }

    const clientToken = req.headers['x-client-token'];
    const clientTokenHash = hashClientToken(clientToken);
    if (!clientTokenHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'CLIENT_TOKEN_REQUIRED',
          message: 'A valid client access token is required in the X-Client-Token header to save records.',
        },
      });
    }

    const { consentGiven, title, summary, findings, policyLength } = req.body || {};

    // Explicit consent validation
    if (consentGiven !== true) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONSENT_REQUIRED',
          message: 'Explicit user consent is mandatory before an analysis report can be saved to the database.',
        },
      });
    }

    // Input sanitization and validation
    const sanitizedTitle = typeof title === 'string' && title.trim().length > 0
      ? title.trim().slice(0, 120)
      : `Privacy Policy Audit - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SUMMARY',
          message: 'A valid analysis summary object is required.',
        },
      });
    }

    if (!Array.isArray(findings)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FINDINGS',
          message: 'Findings must be provided as an array.',
        },
      });
    }

    // Cap findings array to prevent oversized documents
    const sanitizedFindings = findings.slice(0, 100).map((f) => ({
      ruleId: String(f.ruleId || '').slice(0, 50),
      ruleName: String(f.ruleName || '').slice(0, 100),
      category: String(f.category || '').slice(0, 50),
      status: String(f.status || 'not_found'),
      confidence: String(f.confidence || 'MODERATE'),
      explanation: typeof f.explanation === 'string' ? f.explanation.slice(0, 500) : '',
      evidence: typeof f.evidence === 'string' ? f.evidence.slice(0, 300) : '',
      evidenceOffset: f.evidenceOffset && typeof f.evidenceOffset === 'object'
        ? {
            start: Number.isInteger(f.evidenceOffset.start) ? f.evidenceOffset.start : 0,
            end: Number.isInteger(f.evidenceOffset.end) ? f.evidenceOffset.end : 0,
          }
        : null,
    }));

    const docToInsert = {
      clientTokenHash,
      title: sanitizedTitle,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: true,
      consentTimestamp: new Date(),
      policyLength: Number.isInteger(policyLength) ? Math.min(policyLength, 50000) : 0,
      summary: {
        totalRules: Number(summary.totalRules) || 28,
        foundCount: Number(summary.foundCount) || 0,
        unclearCount: Number(summary.unclearCount) || 0,
        notDetectedCount: Number(summary.notDetectedCount) || 0,
        categorySummary: typeof summary.categorySummary === 'object' ? summary.categorySummary : {},
      },
      findings: sanitizedFindings,
    };

    const db = getDb();
    const result = await db.collection(getCollectionName()).insertOne(docToInsert);

    return res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        title: docToInsert.title,
        createdAt: docToInsert.createdAt.toISOString(),
        summary: docToInsert.summary,
        findingsCount: sanitizedFindings.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/saved-analyses
 * Lists all saved analyses belonging strictly to the requesting client token.
 */
export const listSavedAnalyses = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB service is currently unavailable.',
        },
      });
    }

    const clientToken = req.headers['x-client-token'];
    const clientTokenHash = hashClientToken(clientToken);
    if (!clientTokenHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'CLIENT_TOKEN_REQUIRED',
          message: 'A valid client access token is required in the X-Client-Token header.',
        },
      });
    }

    const db = getDb();
    const cursor = db
      .collection(getCollectionName())
      .find({ clientTokenHash })
      .project({
        _id: 1,
        title: 1,
        createdAt: 1,
        summary: 1,
        policyLength: 1,
      })
      .sort({ createdAt: -1 })
      .limit(50);

    const docs = await cursor.toArray();

    const formatted = docs.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
      summary: doc.summary,
      policyLength: doc.policyLength,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/saved-analyses/:id
 * Retrieves a single saved analysis report if owned by the requesting client token.
 */
export const getSavedAnalysisById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB service is currently unavailable.',
        },
      });
    }

    const clientToken = req.headers['x-client-token'];
    const clientTokenHash = hashClientToken(clientToken);
    if (!clientTokenHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'CLIENT_TOKEN_REQUIRED',
          message: 'A valid client access token is required in the X-Client-Token header.',
        },
      });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The requested analysis ID is not a valid 24-character hexadecimal identifier.',
        },
      });
    }

    const db = getDb();
    const doc = await db.collection(getCollectionName()).findOne({
      _id: new ObjectId(id),
      clientTokenHash,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Saved analysis not found or access denied.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: doc._id.toString(),
        title: doc.title,
        createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
        summary: doc.summary,
        findings: doc.findings,
        policyLength: doc.policyLength,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/saved-analyses/:id
 * Permanently deletes a saved analysis report if owned by the requesting client token.
 */
export const deleteSavedAnalysis = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB service is currently unavailable.',
        },
      });
    }

    const clientToken = req.headers['x-client-token'];
    const clientTokenHash = hashClientToken(clientToken);
    if (!clientTokenHash) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'CLIENT_TOKEN_REQUIRED',
          message: 'A valid client access token is required in the X-Client-Token header.',
        },
      });
    }

    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'The requested analysis ID is not a valid 24-character hexadecimal identifier.',
        },
      });
    }

    const db = getDb();
    const result = await db.collection(getCollectionName()).deleteOne({
      _id: new ObjectId(id),
      clientTokenHash,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Saved analysis not found or already deleted.',
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Saved analysis permanently deleted from database.',
    });
  } catch (err) {
    next(err);
  }
};

