/**
 * API Service for PrivacyLens Frontend
 * Uses relative URLs so that requests are routed through the Vite dev proxy to the Express backend.
 */

/**
 * Checks backend API health status.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('/api/health', {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `HTTP ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Failed to communicate with backend server',
    };
  }
}

/**
 * Submits privacy policy text for deterministic rule-based analysis.
 * Endpoint: POST /api/analyze
 *
 * @param {string} policyText - Raw text of the privacy policy
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function analyzePolicy(policyText) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ policyText }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage =
        responseData?.error?.message ||
        `Analysis failed: Server returned HTTP ${response.status} (${response.statusText})`;
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!responseData || !responseData.success) {
      return {
        success: false,
        error: 'Malformed analysis response received from server.',
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (err) {
    return {
      success: false,
      error:
        err.message ||
        'Network error: Unable to connect to the PrivacyLens analysis backend. Ensure the server is running.',
    };
  }
}

/**
 * Checks AI service configuration status.
 * Endpoint: GET /api/ai/status
 *
 * @returns {Promise<{success: boolean, data?: {configured: boolean, model: string}, error?: string}>}
 */
export async function getAiStatus() {
  try {
    const response = await fetch('/api/ai/status', {
      headers: { Accept: 'application/json' },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      return { success: false, error: result?.error?.message || 'Failed to check AI status' };
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message || 'Failed to connect to AI status endpoint' };
  }
}

/**
 * Sends a policy-grounded question to the chatbot endpoint.
 * Endpoint: POST /api/ai/chat
 *
 * @param {object} payload
 * @param {string} payload.policyText - Current analyzed policy text
 * @param {string} payload.question - User question
 * @param {Array<object>} [payload.conversationHistory]
 * @param {object} [payload.findingsSummary]
 * @returns {Promise<{success: boolean, data?: object, error?: string, code?: string}>}
 */
export async function askPolicyQuestion(payload) {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `Chat query failed (HTTP ${response.status})`,
        code: result?.error?.code || 'AI_ERROR',
      };
    }

    if (!result?.success) {
      return {
        success: false,
        error: result?.error?.message || 'Malformed AI response received from server.',
        code: result?.error?.code,
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error communicating with policy chatbot.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Requests an AI-assisted supplementary explanation for a specific deterministic finding.
 * Endpoint: POST /api/ai/explain
 *
 * @param {object} payload
 * @param {string} payload.policyText - Original policy text
 * @param {object} payload.finding - Deterministic finding object
 * @param {object} [payload.deterministicExplanation] - Phase 5 explanation
 * @returns {Promise<{success: boolean, data?: object, error?: string, code?: string}>}
 */
export async function explainFindingWithAi(payload) {
  try {
    const response = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `AI explanation failed (HTTP ${response.status})`,
        code: result?.error?.code || 'AI_ERROR',
      };
    }

    if (!result?.success) {
      return {
        success: false,
        error: result?.error?.message || 'Malformed AI explanation response received from server.',
        code: result?.error?.code,
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error requesting AI explanation.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Retrieves or generates an anonymous client access token for privacy-preserving record scoping.
 * @returns {string}
 */
export function getClientToken() {
  try {
    let token = localStorage.getItem('privacylens_client_token');
    if (!token) {
      token = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'client-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('privacylens_client_token', token);
    }
    return token;
  } catch {
    return 'ephemeral-browser-client-token';
  }
}

/**
 * Checks MongoDB connection and database persistence status.
 * Endpoint: GET /api/saved-analyses/status
 */
export async function getDatabaseStatus() {
  try {
    const response = await fetch('/api/saved-analyses/status', {
      headers: { Accept: 'application/json' },
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      return { success: false, error: result?.error?.message || 'Database status unavailable' };
    }
    return result;
  } catch (err) {
    return { success: false, error: err.message || 'Failed to connect to database status endpoint' };
  }
}

/**
 * Saves an analysis report after explicit user action and consent.
 * Endpoint: POST /api/saved-analyses
 */
export async function saveAnalysisReport(payload) {
  try {
    const token = getClientToken();
    const response = await fetch('/api/saved-analyses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Client-Token': token,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `Failed to save analysis (HTTP ${response.status})`,
        code: result?.error?.code || 'SAVE_ERROR',
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error saving analysis report to database.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Lists saved analyses belonging to the client's token.
 * Endpoint: GET /api/saved-analyses
 */
export async function listSavedAnalyses() {
  try {
    const token = getClientToken();
    const response = await fetch('/api/saved-analyses', {
      headers: {
        Accept: 'application/json',
        'X-Client-Token': token,
      },
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `Failed to retrieve saved analyses (HTTP ${response.status})`,
        code: result?.error?.code || 'FETCH_ERROR',
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error retrieving saved analyses from database.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Retrieves a single saved analysis by ID.
 * Endpoint: GET /api/saved-analyses/:id
 */
export async function getSavedAnalysis(id) {
  try {
    const token = getClientToken();
    const response = await fetch(`/api/saved-analyses/${encodeURIComponent(id)}`, {
      headers: {
        Accept: 'application/json',
        'X-Client-Token': token,
      },
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `Failed to retrieve saved analysis (HTTP ${response.status})`,
        code: result?.error?.code || 'FETCH_ERROR',
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error retrieving saved analysis record.',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Deletes a saved analysis by ID.
 * Endpoint: DELETE /api/saved-analyses/:id
 */
export async function deleteSavedAnalysis(id) {
  try {
    const token = getClientToken();
    const response = await fetch(`/api/saved-analyses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'X-Client-Token': token,
      },
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return {
        success: false,
        error: result?.error?.message || `Failed to delete saved analysis (HTTP ${response.status})`,
        code: result?.error?.code || 'DELETE_ERROR',
      };
    }

    return result;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Network error deleting saved analysis.',
      code: 'NETWORK_ERROR',
    };
  }
}

export default {
  checkBackendHealth,
  analyzePolicy,
  getAiStatus,
  askPolicyQuestion,
  explainFindingWithAi,
  getClientToken,
  getDatabaseStatus,
  saveAnalysisReport,
  listSavedAnalyses,
  getSavedAnalysis,
  deleteSavedAnalysis,
};
