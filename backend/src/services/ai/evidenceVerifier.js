/**
 * Evidence Verifier Service (Phase 6)
 * Validates AI-generated quotations against the original policy text.
 * Strictly enforces that only verbatim substrings of the original document
 * are presented as verified evidence citations with exact character offsets.
 */

/**
 * Searches for an exact verbatim match of candidate quotation text in the original policy.
 *
 * @param {string} originalPolicyText - Full original policy text
 * @param {string} candidateQuote - Candidate quotation text from AI response
 * @returns {{ isVerified: boolean, quote: string, startOffset?: number, endOffset?: number }}
 */
export function verifyQuoteAgainstPolicy(originalPolicyText, candidateQuote) {
  if (
    typeof originalPolicyText !== 'string' ||
    typeof candidateQuote !== 'string' ||
    candidateQuote.trim().length === 0
  ) {
    return { isVerified: false, quote: String(candidateQuote || '') };
  }

  const cleanedQuote = candidateQuote.trim();

  // 1. Direct exact search
  let offset = originalPolicyText.indexOf(cleanedQuote);

  // 2. If not found, try stripped quote without leading/trailing quotation marks
  if (offset === -1 && (cleanedQuote.startsWith('"') || cleanedQuote.startsWith('“'))) {
    const stripped = cleanedQuote.replace(/^["“](.*)["”]$/, '$1').trim();
    if (stripped.length > 0) {
      offset = originalPolicyText.indexOf(stripped);
      if (offset !== -1) {
        return {
          isVerified: true,
          quote: stripped,
          startOffset: offset,
          endOffset: offset + stripped.length,
        };
      }
    }
  }

  if (offset !== -1) {
    return {
      isVerified: true,
      quote: cleanedQuote,
      startOffset: offset,
      endOffset: offset + cleanedQuote.length,
    };
  }

  // Not a verbatim match in the original text
  return {
    isVerified: false,
    quote: cleanedQuote,
  };
}

/**
 * Validates a list of candidate quotes returned by AI and returns only verified citations.
 *
 * @param {string} originalPolicyText - Full original policy text
 * @param {Array<string>} candidateQuotes - List of quotes from AI
 * @returns {Array<{ quote: string, startOffset: number, endOffset: number, verified: true }>}
 */
export function verifyEvidenceList(originalPolicyText, candidateQuotes) {
  if (!Array.isArray(candidateQuotes) || typeof originalPolicyText !== 'string') {
    return [];
  }

  const verifiedCitations = [];

  for (const candidate of candidateQuotes) {
    const result = verifyQuoteAgainstPolicy(originalPolicyText, candidate);
    if (result.isVerified && result.startOffset !== undefined && result.endOffset !== undefined) {
      // Invariant check: originalPolicyText.slice(startOffset, endOffset) === quote
      const slice = originalPolicyText.slice(result.startOffset, result.endOffset);
      if (slice === result.quote) {
        verifiedCitations.push({
          quote: result.quote,
          startOffset: result.startOffset,
          endOffset: result.endOffset,
          verified: true,
        });
      }
    }
  }

  return verifiedCitations;
}
