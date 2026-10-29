import { MATCH_TYPE } from '../../constants/policyConstants.js';

/**
 * Context & Negation Analyzer
 * Inspects clause text for negation indicators, conditional qualifications,
 * and vagueness to prevent reversing the meaning of negative or conditional disclosures.
 */

// Negation patterns: "do not sell", "never share", "without consent", etc.
const NEGATION_PATTERNS = [
  /\b(?:do not|does not|did not|will not|would not|cannot|never|we don't|we do not|neither|nor)\b/i,
  /\b(?:not\s+(?:sell|share|rent|disclose|collect|retain|track|use))\b/i,
  /\b(?:without\s+(?:your\s+)?(?:prior\s+)?(?:express\s+)?(?:consent|permission|authorization))\b/i,
  /\b(?:no\s+(?:personal\s+data|personal\s+information|cookies|tracking))\b/i,
];

// Conditional / exception patterns: "unless you enable", "except where required", "if applicable"
const CONDITIONAL_PATTERNS = [
  /\b(?:unless|except\s+(?:where|when|as)|subject\s+to|provided\s+that|only\s+if|where\s+permitted|if\s+you\s+(?:choose|opt|enable|consent))\b/i,
  /\b(?:to\s+the\s+extent\s+permitted\s+by\s+law|as\s+required\s+by\s+law)\b/i,
];

// Vague / indefinite timeline patterns: "as long as necessary", "as needed", etc.
const VAGUE_PATTERNS = [
  /\b(?:for\s+)?as\s+long\s+as\s+(?:(?:reasonably|strictly|deemed)\s+)?(?:necessary|needed|required|appropriate)\b/i,
  /\b(?:for\s+as\s+long\s+as\s+(?:your\s+account\s+(?:remains?|is)\s+active|necessary|needed))\b/i,
  /\b(?:reasonable\s+(?:period|timeframe|duration))\b/i,
  /\b(?:from\s+time\s+to\s+time)\b/i,
  /\b(?:as\s+needed\s+(?:for\s+legitimate\s+business\s+purposes?|to\s+provide\s+you\s+(?:with\s+)?services))\b/i,
];

/**
 * Analyzes the semantic context of a normalized text segment.
 *
 * @param {string} text - Normalized segment text
 * @returns {{
 *   isNegated: boolean,
 *   isConditional: boolean,
 *   isVague: boolean,
 *   matchType: string,
 *   negationMatches: string[],
 *   conditionalMatches: string[]
 * }}
 */
export function analyzeContext(text) {
  if (typeof text !== 'string') {
    return {
      isNegated: false,
      isConditional: false,
      isVague: false,
      matchType: MATCH_TYPE.AFFIRMATIVE,
      negationMatches: [],
      conditionalMatches: [],
    };
  }

  const negationMatches = [];
  for (const pattern of NEGATION_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      negationMatches.push(m[0]);
    }
  }

  const conditionalMatches = [];
  for (const pattern of CONDITIONAL_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      conditionalMatches.push(m[0]);
    }
  }

  const isVague = VAGUE_PATTERNS.some((p) => p.test(text));
  const isNegated = negationMatches.length > 0;
  const isConditional = conditionalMatches.length > 0;

  let matchType = MATCH_TYPE.AFFIRMATIVE;
  if (isNegated) {
    matchType = isConditional ? MATCH_TYPE.CONDITIONAL : MATCH_TYPE.NEGATIVE_DISCLOSURE;
  } else if (isConditional) {
    matchType = MATCH_TYPE.CONDITIONAL;
  } else if (isVague) {
    matchType = MATCH_TYPE.VAGUE;
  }

  return {
    isNegated,
    isConditional,
    isVague,
    matchType,
    negationMatches,
    conditionalMatches,
  };
}

export default {
  analyzeContext,
};
