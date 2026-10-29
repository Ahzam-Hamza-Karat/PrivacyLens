import { normalizeSegment } from '../policy/textNormalizer.js';
import { MATCH_TYPE } from '../../constants/policyConstants.js';

/**
 * Coordinate and contrastive clause boundary delimiters in privacy policies.
 * Matches semicolons (with optional conjunctive adverbs) and contrastive
 * coordinating conjunctions (with or without preceding commas).
 */
/**
 * Coordinate and contrastive clause boundary delimiters in privacy policies.
 * Matches semicolons (with optional conjunctive adverbs) and contrastive
 * coordinating conjunctions (with or without preceding commas), as well as
 * negative coordinating conjunctions ("nor", coordinate "and" + negation).
 */
const CLAUSE_DELIMITER_REGEX =
  /(?:;\s*(?:however|furthermore|moreover|therefore|nevertheless|nonetheless)?\s*|,\s*(?:but|yet|although|while|though|whereas|nor|except\s+that)\s+|\s+(?:but|yet|although|though)\s+|,\s*and\s+(?=(?:we\s+)?(?:do\s+not|will\s+not|never|cannot)\b))/gi;

/**
 * Initial subordinating contrastive conjunctions (e.g., "While...", "Although...").
 */
const INITIAL_SUBORDINATE_REGEX = /^(?:while|although|even though|though)\s+/i;

/**
 * Regex identifying the transition from an initial subordinate clause to the main clause.
 */
const MAIN_CLAUSE_SUBJECT_REGEX =
  /,\s*(?=(?:we|you|users?|the\s+company|our|it|they|neither|no\s+data|personal\s+data|information)\b)/gi;

/**
 * Splits a sentence into candidate coordinate or contrasting clauses
 * while tracking verbatim start and end offsets relative to the segment text.
 *
 * @param {string} text - Segment original text
 * @returns {Array<{ text: string, start: number, end: number }>}
 */
export function splitIntoCandidateClauses(text) {
  if (typeof text !== 'string' || text.length < 20) {
    return [{ text, start: 0, end: text.length }];
  }

  // Handle sentences beginning with subordinating contrastive conjunctions
  // e.g. "While we share personal information with service providers, we do not sell it."
  if (INITIAL_SUBORDINATE_REGEX.test(text)) {
    let splitMatch = null;
    MAIN_CLAUSE_SUBJECT_REGEX.lastIndex = 0;
    let sm;
    while ((sm = MAIN_CLAUSE_SUBJECT_REGEX.exec(text)) !== null) {
      const c1 = text.slice(0, sm.index).trim();
      const c2 = text.slice(sm.index + 1).trim();
      if (c1.length >= 15 && c2.length >= 12) {
        splitMatch = sm;
      }
    }

    if (splitMatch) {
      const commaIdx = splitMatch.index;
      const c1 = text.slice(0, commaIdx).trim();
      const c2 = text.slice(commaIdx + 1).trim();
      const c2Start = text.indexOf(c2, commaIdx);
      return [
        { text: c1, start: 0, end: c1.length },
        { text: c2, start: c2Start, end: c2Start + c2.length },
      ];
    } else {
      const commaCount = (text.match(/,/g) || []).length;
      if (commaCount === 1) {
        const commaIdx = text.indexOf(',');
        const c1 = text.slice(0, commaIdx).trim();
        const c2 = text.slice(commaIdx + 1).trim();
        if (c1.length >= 15 && c2.length >= 12) {
          const c2Start = text.indexOf(c2, commaIdx);
          return [
            { text: c1, start: 0, end: c1.length },
            { text: c2, start: c2Start, end: c2Start + c2.length },
          ];
        }
      }
    }
  }

  const clauses = [];
  let lastIndex = 0;
  let match;

  CLAUSE_DELIMITER_REGEX.lastIndex = 0;

  while ((match = CLAUSE_DELIMITER_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = CLAUSE_DELIMITER_REGEX.lastIndex;

    const priorClause = text.slice(lastIndex, matchStart).trim();
    if (priorClause.length > 0) {
      const leadingWs = text.slice(lastIndex).indexOf(priorClause);
      const start = lastIndex + leadingWs;
      const end = start + priorClause.length;
      clauses.push({ text: priorClause, start, end });
    }

    // Determine where the succeeding clause begins.
    // If the delimiter includes a contrastive or coordinate conjunction (e.g. "but", "however", "nor", "and"),
    // preserve the conjunction with the succeeding clause so contextual flow
    // and pronoun connectivity remain clear.
    const rawDelim = match[0];
    const conjMatch = rawDelim.match(
      /\b(but|yet|although|while|though|whereas|nor|and|however|furthermore|moreover|nevertheless|nonetheless|except\s+that)\b/i
    );

    let nextStart = matchEnd;
    if (conjMatch) {
      nextStart = matchStart + rawDelim.indexOf(conjMatch[0]);
    }

    lastIndex = nextStart;
  }

  if (lastIndex < text.length) {
    const trailing = text.slice(lastIndex).trim();
    if (trailing.length > 0) {
      const leadingWs = text.slice(lastIndex).indexOf(trailing);
      const start = lastIndex + leadingWs;
      const end = start + trailing.length;
      clauses.push({ text: trailing, start, end });
    }
  }

  return clauses.length > 0 ? clauses : [{ text, start: 0, end: text.length }];
}

/**
 * Refines a finding's evidence excerpt to the smallest clear, verbatim excerpt
 * that supports the specific rule interpretation, wherever this can be done safely.
 *
 * Safety Invariants:
 * 1. originalPolicyText.slice(startOffset, endOffset) === evidence
 * 2. If isolating a sub-clause would make a pronoun ambiguous or strip an
 *    essential condition, the full segment is safely retained.
 * 3. Exactly one sub-clause must independently satisfy the rule's positive patterns
 *    and not trigger any negative disqualifiers.
 *
 * @param {object} segment - Full segment metadata from text segmenter
 * @param {object} rule - Registered rule definition
 * @param {string} originalPolicyText - Verbatim document text
 * @returns {{ evidence: string, startOffset: number, endOffset: number }}
 */
export function refineEvidenceExcerpt(segment, rule, originalPolicyText) {
  const fallback = {
    evidence: segment.originalText,
    startOffset: segment.startOffset,
    endOffset: segment.endOffset,
  };

  if (!segment || !rule || typeof segment.originalText !== 'string') {
    return fallback;
  }

  const clauses = splitIntoCandidateClauses(segment.originalText);

  // If sentence cannot be split into multiple clauses, retain full segment
  if (clauses.length <= 1) {
    return fallback;
  }

  const matchingClauses = [];

  for (const clause of clauses) {
    // Sub-clause must be sufficiently substantive
    if (clause.text.length < 8) continue;

    const norm = normalizeSegment(clause.text);

    // Negative pattern disqualification
    if (rule.negativePatterns && rule.negativePatterns.length > 0) {
      const isDisqualified = rule.negativePatterns.some((np) => np.test(norm));
      if (isDisqualified) continue;
    }

    // Positive pattern validation
    const matchesPositive = rule.positivePatterns && rule.positivePatterns.some((pp) => pp.test(norm));
    if (!matchesPositive) continue;

    // Semantic match-type fidelity:
    // If rule represents a negative disclosure, the sub-clause must preserve the negation
    if (rule.expectedMatchType === MATCH_TYPE.NEGATIVE_DISCLOSURE) {
      const hasNegation = /\b(?:do not|does not|will not|cannot|never|not|without)\b/i.test(norm);
      if (!hasNegation) continue;
    }

    matchingClauses.push(clause);
  }

  // Only safely refine if exactly ONE candidate clause matches this rule
  if (matchingClauses.length === 1) {
    const selected = matchingClauses[0];
    const startOffset = segment.startOffset + selected.start;
    const endOffset = segment.startOffset + selected.end;

    // Safety verification: confirm verbatim slice matches original text
    const sliced = originalPolicyText.slice(startOffset, endOffset);
    if (sliced === selected.text) {
      return {
        evidence: selected.text,
        startOffset,
        endOffset,
      };
    }
  }

  // Safe fallback to full segment
  return fallback;
}

export default {
  splitIntoCandidateClauses,
  refineEvidenceExcerpt,
};
