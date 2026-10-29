import { MAX_POLICY_LENGTH } from '../../constants/policyConstants.js';

/**
 * Validates the incoming policy analysis request.
 * Enforces strict data types, non-empty content, and payload bounds.
 *
 * @param {object} body - Request body object
 * @param {string|undefined} contentType - Content-Type header
 * @returns {{ isValid: boolean, error?: { statusCode: number, message: string }, policyText?: string }}
 */
export function validatePolicyInput(body, contentType) {
  // Validate Content-Type if provided
  if (contentType && typeof contentType === 'string') {
    const isJson = contentType.toLowerCase().includes('application/json');
    if (!isJson) {
      return {
        isValid: false,
        error: {
          statusCode: 415,
          message: 'Unsupported Content-Type. Request body must be application/json.',
        },
      };
    }
  }

  // Request body must be an object
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      isValid: false,
      error: {
        statusCode: 400,
        message: 'Invalid request body. A JSON object with a "policyText" property is required.',
      },
    };
  }

  // Reject unexpected extra fields to prevent unintended payload leakage
  const allowedKeys = ['policyText'];
  const keys = Object.keys(body);
  const invalidKeys = keys.filter((k) => !allowedKeys.includes(k));
  if (invalidKeys.length > 0) {
    return {
      isValid: false,
      error: {
        statusCode: 400,
        message: `Unexpected fields in request body: ${invalidKeys.join(', ')}. Only "policyText" is permitted.`,
      },
    };
  }

  // policyText must exist
  if (!('policyText' in body)) {
    return {
      isValid: false,
      error: {
        statusCode: 400,
        message: 'Missing required field: "policyText".',
      },
    };
  }

  const { policyText } = body;

  // policyText must be a string
  if (typeof policyText !== 'string') {
    return {
      isValid: false,
      error: {
        statusCode: 400,
        message: 'Field "policyText" must be a string.',
      },
    };
  }

  // Empty or whitespace-only strings are rejected
  const trimmed = policyText.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: {
        statusCode: 400,
        message: 'Policy text cannot be empty or whitespace-only.',
      },
    };
  }

  // Enforce maximum length limit (50,000 code units)
  if (policyText.length > MAX_POLICY_LENGTH) {
    return {
      isValid: false,
      error: {
        statusCode: 413,
        message: `Policy text length (${policyText.length.toLocaleString()} characters) exceeds the maximum allowed limit of ${MAX_POLICY_LENGTH.toLocaleString()} characters.`,
      },
    };
  }

  return {
    isValid: true,
    policyText,
  };
}

export default validatePolicyInput;
