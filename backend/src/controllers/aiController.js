/**
 * Express Controller for AI Integration & Policy Chatbot (Phase 6)
 * Handles /api/ai/status, /api/ai/explain, and /api/ai/chat
 */

import { getAiStatus, chatWithPolicy, explainFindingWithAi } from '../services/ai/aiService.js';

/**
 * Returns AI feature configuration status.
 * Endpoint: GET /api/ai/status
 */
export async function handleGetAiStatus(req, res, next) {
  try {
    const status = getAiStatus();
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Generates an AI-assisted supplementary explanation for a specific finding.
 * Endpoint: POST /api/ai/explain
 */
export async function handleExplainFinding(req, res, next) {
  try {
    const { policyText, finding, deterministicExplanation } = req.body || {};

    const result = await explainFindingWithAi({
      policyText,
      finding,
      deterministicExplanation,
    });

    if (!result.success) {
      const statusCode = result.error?.statusCode || 400;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'An error occurred while generating the AI explanation.',
        statusCode,
        code: err.code || 'AI_ERROR',
      },
    });
  }
}

/**
 * Handles policy-grounded conversational Q&A queries.
 * Endpoint: POST /api/ai/chat
 */
export async function handleChatQuery(req, res, next) {
  try {
    const { policyText, question, conversationHistory, findingsSummary } = req.body || {};

    const result = await chatWithPolicy({
      policyText,
      question,
      conversationHistory,
      findingsSummary,
    });

    if (!result.success) {
      const statusCode = result.error?.statusCode || 400;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: {
        message: err.message || 'An error occurred while processing the chat query.',
        statusCode,
        code: err.code || 'AI_ERROR',
      },
    });
  }
}

export default {
  handleGetAiStatus,
  handleExplainFinding,
  handleChatQuery,
};
