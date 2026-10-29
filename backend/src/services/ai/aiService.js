/**
 * AI Coordination Service (Phase 6)
 * High-level service orchestrating prompt assembly, AI completions,
 * evidence verification, and safe output formatting.
 */

import config from '../../config/index.js';
import { isAiConfigured, sendChatCompletion } from './aiClient.js';
import { buildChatPrompt, buildFindingExplanationPrompt } from './promptBuilder.js';
import { verifyEvidenceList } from './evidenceVerifier.js';
import { validatePolicyContext, validateChatQuestion, validateFindingContext } from './aiInputValidator.js';
import { AI_ERROR_CODES } from './aiConstants.js';

/**
 * Returns current AI service operational status and model metadata.
 * Never leaks the actual API key.
 *
 * @returns {{ configured: boolean, model: string }}
 */
export function getAiStatus() {
  return {
    configured: isAiConfigured(),
    model: config.openaiModel || 'gpt-4o-mini',
  };
}

/**
 * Parses and sanitizes a raw JSON string returned by the model.
 * Handles cases where the model wraps JSON in markdown code fences.
 *
 * @param {string} rawText
 * @returns {object} Parsed JSON object
 */
function parseModelJson(rawText) {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    throw new Error('Model returned an empty response.');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if present e.g. ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const parseError = new Error('AI provider returned a response that could not be parsed as valid JSON.');
    parseError.code = AI_ERROR_CODES.VALIDATION_FAILED;
    parseError.statusCode = 502;
    throw parseError;
  }
}

/**
 * Processes a policy-grounded question using the AI provider.
 *
 * @param {object} params
 * @param {string} params.policyText - Current analyzed policy text
 * @param {string} params.question - User's question
 * @param {Array<object>} [params.conversationHistory] - Previous conversation messages
 * @param {object} [params.findingsSummary] - Summary of deterministic analysis
 * @returns {Promise<{
 *   success: boolean,
 *   data?: {
 *     answer: string,
 *     insufficientEvidence: boolean,
 *     evidenceReferences: Array<object>,
 *     limitations: string,
 *     model: string
 *   },
 *   error?: object
 * }>}
 */
export async function chatWithPolicy({ policyText, question, conversationHistory = [], findingsSummary = null }) {
  // Step 1: Input Validation
  const policyVal = validatePolicyContext(policyText);
  if (!policyVal.isValid) {
    return { success: false, error: policyVal.error };
  }

  const questionVal = validateChatQuestion(question);
  if (!questionVal.isValid) {
    return { success: false, error: questionVal.error };
  }

  // Step 2: Check AI Configuration
  if (!isAiConfigured()) {
    return {
      success: false,
      error: {
        message: 'AI assistant is currently offline because the server API key is not configured.',
        statusCode: 503,
        code: AI_ERROR_CODES.CONFIG_MISSING,
      },
    };
  }

  // Step 3: Build bounded prompt
  const messages = buildChatPrompt({
    policyText: policyVal.policyText,
    question: questionVal.question,
    conversationHistory,
    findingsSummary,
  });

  // Step 4: Send to AI Provider
  const completion = await sendChatCompletion(messages, {
    temperature: 0.1,
  });

  // Step 5: Parse and validate model output
  const parsed = parseModelJson(completion.content);

  const answer = typeof parsed.answer === 'string' && parsed.answer.trim().length > 0
    ? parsed.answer.trim()
    : 'No clear answer could be determined from the provided policy text.';

  const insufficientEvidence = Boolean(parsed.insufficientEvidence);
  const rawQuotes = Array.isArray(parsed.evidenceQuotes) ? parsed.evidenceQuotes : [];

  // Step 6: Verify evidence citations against original policy text
  // Strictly ensures only exact verbatim substrings are returned as verified citations
  const verifiedCitations = verifyEvidenceList(policyVal.policyText, rawQuotes);

  const limitations = typeof parsed.limitations === 'string' ? parsed.limitations.trim() : '';

  return {
    success: true,
    data: {
      answer,
      insufficientEvidence,
      evidenceReferences: verifiedCitations,
      limitations,
      model: completion.rawResponse?.model || config.openaiModel,
    },
  };
}

/**
 * Generates an AI-assisted supplementary explanation for a specific deterministic finding.
 *
 * @param {object} params
 * @param {string} params.policyText - Original policy text
 * @param {object} params.finding - Deterministic finding object
 * @param {object} [params.deterministicExplanation] - Phase 5 explanation catalogue entry
 * @returns {Promise<{
 *   success: boolean,
 *   data?: {
 *     explanation: string,
 *     practicalImpact: string,
 *     conditionsAndExceptions: string,
 *     cannotConclude: string,
 *     limitations: string,
 *     model: string
 *   },
 *   error?: object
 * }>}
 */
export async function explainFindingWithAi({ policyText, finding, deterministicExplanation = null }) {
  // Step 1: Input Validation
  const policyVal = validatePolicyContext(policyText);
  if (!policyVal.isValid) {
    return { success: false, error: policyVal.error };
  }

  const findingVal = validateFindingContext(finding, policyVal.policyText);
  if (!findingVal.isValid) {
    return { success: false, error: findingVal.error };
  }

  // Step 2: Check AI Configuration
  if (!isAiConfigured()) {
    return {
      success: false,
      error: {
        message: 'AI explanation is currently unavailable because the server API key is not configured.',
        statusCode: 503,
        code: AI_ERROR_CODES.CONFIG_MISSING,
      },
    };
  }

  // Step 3: Build Prompt
  const messages = buildFindingExplanationPrompt({
    policyText: policyVal.policyText,
    finding: findingVal.finding,
    deterministicExplanation,
  });

  // Step 4: Send to Provider
  const completion = await sendChatCompletion(messages, {
    temperature: 0.1,
  });

  // Step 5: Parse Output
  const parsed = parseModelJson(completion.content);

  const explanation = typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0
    ? parsed.explanation.trim()
    : 'Supplementary explanation unavailable.';

  return {
    success: true,
    data: {
      explanation,
      practicalImpact: typeof parsed.practicalImpact === 'string' ? parsed.practicalImpact.trim() : '',
      conditionsAndExceptions: typeof parsed.conditionsAndExceptions === 'string' ? parsed.conditionsAndExceptions.trim() : '',
      cannotConclude: typeof parsed.cannotConclude === 'string' ? parsed.cannotConclude.trim() : '',
      limitations: typeof parsed.limitations === 'string' ? parsed.limitations.trim() : '',
      model: completion.rawResponse?.model || config.openaiModel,
    },
  };
}
