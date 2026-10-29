import { validatePolicyInput } from '../services/policy/inputValidator.js';
import { analyzePolicyDocument } from '../services/analyzer/policyEngine.js';

/**
 * Express Controller for Policy Analysis
 * Endpoint: POST /api/analyze
 */
export async function analyzePolicy(req, res, next) {
  try {
    const contentType = req.headers['content-type'];
    const validation = validatePolicyInput(req.body, contentType);

    if (!validation.isValid) {
      return res.status(validation.error.statusCode).json({
        success: false,
        error: {
          message: validation.error.message,
          statusCode: validation.error.statusCode,
        },
      });
    }

    // Process and analyze the validated policy text
    const report = analyzePolicyDocument(validation.policyText);

    return res.status(200).json(report);
  } catch (err) {
    // Forward unexpected errors to the centralized errorHandler
    next(err);
  }
}

export default {
  analyzePolicy,
};
