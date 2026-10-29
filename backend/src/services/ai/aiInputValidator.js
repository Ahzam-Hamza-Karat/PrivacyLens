/**
 * Input Validator for AI Service (Phase 6)
 * Validates request payloads for policy chatbot and finding explanation endpoints.
 */

import { AI_LIMITS, AI_ERROR_CODES } from './aiConstants.js';

/**
 * Validates policy text input for AI operations.
 *
 * @param {any} policyText
 * @returns {{ isValid: boolean, policyText?: string, error?: { message: string, statusCode: number, code: string } }}
 */
export function validatePolicyContext(policyText) {
  if (typeof policyText !== 'string' || policyText.trim().length === 0) {
    return {
      isValid: false,
      error: {
        message: 'A valid policy text is required to provide grounded AI answers. Please analyze a policy first.',
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  const trimmed = policyText.trim();

  if (trimmed.length > AI_LIMITS.MAX_POLICY_LENGTH) {
    return {
      isValid: false,
      error: {
        message: `Policy text exceeds the maximum permitted size of ${AI_LIMITS.MAX_POLICY_LENGTH.toLocaleString()} characters.`,
        statusCode: 413,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  return {
    isValid: true,
    policyText: trimmed,
  };
}

/**
 * Validates the user's question for policy chatbot queries.
 *
 * @param {any} question
 * @returns {{ isValid: boolean, question?: string, error?: { message: string, statusCode: number, code: string } }}
 */
export function validateChatQuestion(question) {
  if (typeof question !== 'string' || question.trim().length === 0) {
    return {
      isValid: false,
      error: {
        message: 'Question must be a non-empty string.',
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  const trimmed = question.trim();

  if (trimmed.length < AI_LIMITS.MIN_QUESTION_LENGTH) {
    return {
      isValid: false,
      error: {
        message: `Question must contain at least ${AI_LIMITS.MIN_QUESTION_LENGTH} characters.`,
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  if (trimmed.length > AI_LIMITS.MAX_QUESTION_LENGTH) {
    return {
      isValid: false,
      error: {
        message: `Question exceeds the maximum length of ${AI_LIMITS.MAX_QUESTION_LENGTH} characters. Please ask a more concise question.`,
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  return {
    isValid: true,
    question: trimmed,
  };
}

/**
 * Validates finding context for AI explanation generation.
 *
 * @param {any} finding
 * @param {string} originalPolicyText
 * @returns {{ isValid: boolean, finding?: object, error?: { message: string, statusCode: number, code: string } }}
 */
export function validateFindingContext(finding, originalPolicyText) {
  if (!finding || typeof finding !== 'object') {
    return {
      isValid: false,
      error: {
        message: 'A valid finding object is required to generate an AI explanation.',
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  const { ruleId, evidence, startOffset, endOffset } = finding;

  if (typeof ruleId !== 'string' || ruleId.trim().length === 0) {
    return {
      isValid: false,
      error: {
        message: 'Finding must contain a valid ruleId.',
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  if (typeof evidence !== 'string' || evidence.trim().length === 0) {
    return {
      isValid: false,
      error: {
        message: 'Finding must contain non-empty evidence excerpt text.',
        statusCode: 400,
        code: AI_ERROR_CODES.INVALID_INPUT,
      },
    };
  }

  // If startOffset and endOffset are provided, verify offset bounds
  if (typeof startOffset === 'number' && typeof endOffset === 'number') {
    if (startOffset < 0 || endOffset > originalPolicyText.length || startOffset >= endOffset) {
      return {
        isValid: false,
        error: {
          message: 'Finding source offsets are out of bounds for the supplied policy text.',
          statusCode: 400,
          code: AI_ERROR_CODES.INVALID_INPUT,
        },
      };
    }

    // Verify verbatim invariant: slice must match evidence
    const slice = originalPolicyText.slice(startOffset, endOffset);
    if (slice !== evidence) {
      return {
        isValid: false,
        error: {
          message: 'Finding evidence does not match the original policy text at the specified offsets.',
          statusCode: 400,
          code: AI_ERROR_CODES.INVALID_INPUT,
        },
      };
    }
  }

  return {
    isValid: true,
    finding,
  };
}
