/**
 * AI Provider HTTP Client (Phase 6)
 * Handles low-level network communication with the configured AI provider.
 * Enforces timeout constraints, bounded retries, test mocking, and strict secret protection.
 */

import config from '../../config/index.js';
import { AI_LIMITS, AI_ERROR_CODES } from './aiConstants.js';

let mockAdapter = null;

/**
 * Registers a mock adapter function for testing.
 * @param {(messages: Array<object>, options: object) => Promise<object> | null} adapter
 */
export function setMockAdapter(adapter) {
  mockAdapter = adapter;
}

/**
 * Resets the test mock adapter.
 */
export function resetMockAdapter() {
  mockAdapter = null;
}

/**
 * Checks if the AI provider is configured with an API key.
 * @returns {boolean}
 */
export function isAiConfigured() {
  return typeof config.openaiApiKey === 'string' && config.openaiApiKey.trim().length > 0;
}

/**
 * Executes a chat completion request against the AI provider.
 *
 * @param {Array<{ role: string, content: string }>} messages - Validated prompt messages
 * @param {object} [options]
 * @param {string} [options.model] - Model identifier
 * @param {number} [options.temperature] - Generation temperature (default: 0.1 for grounded answers)
 * @param {number} [options.maxTokens] - Max response tokens
 * @param {number} [options.timeoutMs] - Request timeout in milliseconds
 * @returns {Promise<{ content: string, rawResponse?: object }>}
 */
export async function sendChatCompletion(messages, options = {}) {
  // If a mock adapter is registered (for automated testing), invoke it directly
  if (typeof mockAdapter === 'function') {
    return await mockAdapter(messages, options);
  }

  // Verify server-side API key configuration
  if (!isAiConfigured()) {
    const error = new Error('AI features are currently unavailable because the server-side API key is not configured.');
    error.code = AI_ERROR_CODES.CONFIG_MISSING;
    error.statusCode = 503;
    throw error;
  }

  const model = options.model || config.openaiModel || 'gpt-4o-mini';
  const temperature = options.temperature ?? 0.1;
  const maxTokens = options.maxTokens || AI_LIMITS.MAX_OUTPUT_TOKENS;
  const timeoutMs = options.timeoutMs || config.aiRequestTimeoutMs || AI_LIMITS.DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? config.aiMaxRetries ?? AI_LIMITS.MAX_RETRIES;

  const endpoint = `${config.openaiBaseUrl.replace(/\/+$/, '')}/chat/completions`;

  const requestBody = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  };

  let attempts = 0;
  let lastError = null;

  while (attempts <= maxRetries) {
    attempts++;
    let controller = null;

    try {
      controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openaiApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP error statuses
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch (_) {
          // Response body was not JSON
        }

        const status = response.status;
        const providerMessage = errorData?.error?.message || response.statusText;

        if (status === 401) {
          const authError = new Error('AI provider authentication failed. Please verify server API key credentials.');
          authError.code = AI_ERROR_CODES.AUTH_FAILURE;
          authError.statusCode = 502;
          throw authError;
        }

        if (status === 429) {
          const rateError = new Error('AI provider rate limit reached. Please wait a moment before trying again.');
          rateError.code = AI_ERROR_CODES.RATE_LIMITED;
          rateError.statusCode = 429;
          
          // Retry on 429 if attempts remain
          if (attempts <= maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempts));
            lastError = rateError;
            continue;
          }
          throw rateError;
        }

        if (status >= 500 && status < 600) {
          const serverError = new Error('AI provider service temporarily unavailable.');
          serverError.code = AI_ERROR_CODES.PROVIDER_ERROR;
          serverError.statusCode = 502;

          if (attempts <= maxRetries) {
            await new Promise((r) => setTimeout(r, 1000 * attempts));
            lastError = serverError;
            continue;
          }
          throw serverError;
        }

        const clientError = new Error(`AI provider request failed: ${providerMessage}`);
        clientError.code = AI_ERROR_CODES.PROVIDER_ERROR;
        clientError.statusCode = 502;
        throw clientError;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (typeof content !== 'string' || content.trim().length === 0) {
        const emptyError = new Error('Empty response received from AI provider.');
        emptyError.code = AI_ERROR_CODES.VALIDATION_FAILED;
        emptyError.statusCode = 502;
        throw emptyError;
      }

      return {
        content: content.trim(),
        rawResponse: {
          id: data.id,
          model: data.model,
          usage: data.usage,
        },
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutError = new Error(`AI request timed out after ${timeoutMs}ms.`);
        timeoutError.code = AI_ERROR_CODES.TIMEOUT;
        timeoutError.statusCode = 504;
        throw timeoutError;
      }

      // Re-throw handled errors with explicit codes
      if (err.code) {
        throw err;
      }

      // Generic network / connection errors
      lastError = err;
      if (attempts <= maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * attempts));
        continue;
      }

      const networkError = new Error('Failed to communicate with the external AI provider.');
      networkError.code = AI_ERROR_CODES.NETWORK_ERROR;
      networkError.statusCode = 502;
      throw networkError;
    }
  }

  throw lastError || new Error('AI provider request failed.');
}
