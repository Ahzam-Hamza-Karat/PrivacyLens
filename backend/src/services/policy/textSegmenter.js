import { normalizeSegment } from './textNormalizer.js';

/**
 * Common abbreviations found in privacy policies and legal agreements
 * that should not trigger sentence boundary splits.
 */
const ABBREVIATIONS = new Set([
  'e.g',
  'i.e',
  'inc',
  'co',
  'corp',
  'ltd',
  'llc',
  'vs',
  'v',
  'u.s',
  'u.k',
  'e.u',
  'al',
  'etc',
  'approx',
  'no',
  'vol',
  'dr',
  'mr',
  'mrs',
  'ms',
  'jan',
  'feb',
  'mar',
  'apr',
  'jun',
  'jul',
  'aug',
  'sep',
  'sept',
  'oct',
  'nov',
  'dec',
]);

/**
 * Checks if a period at position `idx` in `text` is part of an abbreviation,
 * decimal number, or URL/domain.
 *
 * @param {string} text - The text being inspected
 * @param {number} idx - Index of the period in text
 * @returns {boolean} True if this period is NOT a sentence terminator
 */
function isProtectedPeriod(text, idx) {
  // Check decimal numbers: digit before and digit after (e.g. "3.14" or "1.5")
  const prevChar = text[idx - 1];
  const nextChar = text[idx + 1];
  if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
    return true;
  }

  // Check URLs and emails: letter/symbol before and letter after without space (e.g. "example.com" or "privacy@acme-example.com")
  if (/[a-zA-Z0-9_-]/.test(prevChar) && /[a-zA-Z0-9_-]/.test(nextChar)) {
    return true;
  }

  // Check section numbering (e.g. "2.1" or "Section 3.4")
  if (/\d/.test(prevChar) && /\d/.test(nextChar)) {
    return true;
  }

  // Look back to find the preceding word token
  let tokenStart = idx - 1;
  while (tokenStart >= 0 && /[a-zA-Z0-9.]/.test(text[tokenStart])) {
    tokenStart--;
  }
  const token = text.slice(tokenStart + 1, idx).toLowerCase();

  // If token is a known abbreviation (e.g. "inc", "e.g", "etc")
  if (ABBREVIATIONS.has(token)) {
    return true;
  }

  // If token is a single letter (e.g. "U. S. A." or initial "J. Smith")
  if (token.length === 1 && /[a-zA-Z]/.test(token)) {
    return true;
  }

  return false;
}

/**
 * Splits a paragraph's text into sentence/clause spans while tracking original offsets.
 *
 * @param {string} fullText - Entire policy text
 * @param {number} paraStart - Start offset of this paragraph in fullText
 * @param {number} paraEnd - End offset of this paragraph in fullText
 * @returns {Array<{ startOffset: number, endOffset: number, text: string }>}
 */
function extractSentencesFromParagraph(fullText, paraStart, paraEnd) {
  const paraText = fullText.slice(paraStart, paraEnd);
  const segments = [];

  // Check if paragraph is composed of bullet points or list items
  const lines = paraText.split(/\r?\n/);
  const hasMultipleLines = lines.length > 1;
  const isBulletList = lines.some((l) => /^\s*[-*•\u2022\u25E6\u25AA\u25B8]/.test(l));

  if (hasMultipleLines && isBulletList) {
    // Treat each bulleted line or distinct non-empty line as a distinct clause
    let currentLineOffset = paraStart;
    for (const rawLine of lines) {
      const lineLen = rawLine.length;
      const trimmedLine = rawLine.trim();

      if (trimmedLine.length > 0) {
        const leadingWhitespace = rawLine.indexOf(trimmedLine);
        const start = currentLineOffset + leadingWhitespace;
        const end = start + trimmedLine.length;

        segments.push({
          startOffset: start,
          endOffset: end,
          text: fullText.slice(start, end),
        });
      }
      // Advance offset including newline character(s)
      currentLineOffset += lineLen + 1;
      if (currentLineOffset < fullText.length && fullText[currentLineOffset - 1] === '\r' && fullText[currentLineOffset] === '\n') {
        currentLineOffset += 1;
      }
    }

    if (segments.length > 0) {
      return segments;
    }
  }

  // Standard prose: sentence boundary scanner
  let sentenceStartInPara = 0;
  const len = paraText.length;

  for (let i = 0; i < len; i++) {
    const char = paraText[i];
    const isPeriod = char === '.';
    const isExclamation = char === '!';
    const isQuestion = char === '?';
    const isSemicolon = char === ';';

    let isBoundary = false;

    if (isPeriod) {
      if (!isProtectedPeriod(paraText, i)) {
        // Boundary if followed by whitespace or end of paragraph
        if (i + 1 >= len || /\s/.test(paraText[i + 1])) {
          isBoundary = true;
        }
      }
    } else if (isExclamation || isQuestion) {
      if (i + 1 >= len || /\s/.test(paraText[i + 1])) {
        isBoundary = true;
      }
    } else if (isSemicolon) {
      // Split on semicolon if followed by whitespace and clause is sufficiently long
      const currentClauseLen = i - sentenceStartInPara;
      if (currentClauseLen > 30 && (i + 1 >= len || /\s/.test(paraText[i + 1]))) {
        isBoundary = true;
      }
    }

    if (isBoundary || i === len - 1) {
      const sentenceEndInPara = isBoundary ? i + 1 : len;
      const rawSentence = paraText.slice(sentenceStartInPara, sentenceEndInPara);
      const trimmed = rawSentence.trim();

      if (trimmed.length > 0) {
        const leadingWs = rawSentence.indexOf(trimmed);
        const segStart = paraStart + sentenceStartInPara + leadingWs;
        const segEnd = segStart + trimmed.length;

        segments.push({
          startOffset: segStart,
          endOffset: segEnd,
          text: fullText.slice(segStart, segEnd),
        });
      }

      sentenceStartInPara = sentenceEndInPara;
      // Skip whitespace to start of next sentence
      while (sentenceStartInPara < len && /\s/.test(paraText[sentenceStartInPara])) {
        sentenceStartInPara++;
      }
      i = sentenceStartInPara - 1;
    }
  }

  // Fallback: If no segments were generated, return the whole paragraph
  if (segments.length === 0 && paraText.trim().length > 0) {
    const trimmed = paraText.trim();
    const leadingWs = paraText.indexOf(trimmed);
    const segStart = paraStart + leadingWs;
    const segEnd = segStart + trimmed.length;
    segments.push({
      startOffset: segStart,
      endOffset: segEnd,
      text: fullText.slice(segStart, segEnd),
    });
  }

  return segments;
}

/**
 * Segments policy text into ordered paragraphs and deterministic sentence/clause segments.
 *
 * Each paragraph and segment receives:
 * - Deterministic, stable IDs (e.g. `p-0`, `s-0-0`, `s-0-1`)
 * - Verbatim substring references to the original policy text
 * - Accurate startOffset and endOffset bounding coordinates
 * - Normalized text representation for deterministic rule matching
 *
 * @param {string} originalPolicyText - Verbatim user-provided policy text
 * @returns {{
 *   paragraphs: Array<{ id: string, index: number, originalText: string, startOffset: number, endOffset: number }>,
 *   segments: Array<{ id: string, paragraphId: string, segmentIndex: number, originalText: string, normalizedText: string, startOffset: number, endOffset: number }>
 * }}
 */
export function segmentPolicyText(originalPolicyText) {
  if (typeof originalPolicyText !== 'string' || originalPolicyText.length === 0) {
    return { paragraphs: [], segments: [] };
  }

  const paragraphs = [];
  const segments = [];

  // Match paragraphs separated by 2 or more newlines (with optional whitespace)
  const paragraphRegex = /\r?\n\s*\r?\n+/g;
  let match;
  let lastIndex = 0;
  let pIndex = 0;

  while ((match = paragraphRegex.exec(originalPolicyText)) !== null) {
    const rawParagraph = originalPolicyText.slice(lastIndex, match.index);
    const trimmed = rawParagraph.trim();

    if (trimmed.length > 0) {
      const leadingWs = rawParagraph.indexOf(trimmed);
      const startOffset = lastIndex + leadingWs;
      const endOffset = startOffset + trimmed.length;
      const pId = `p-${pIndex}`;

      paragraphs.push({
        id: pId,
        index: pIndex,
        originalText: originalPolicyText.slice(startOffset, endOffset),
        startOffset,
        endOffset,
      });

      const sentenceSpans = extractSentencesFromParagraph(originalPolicyText, startOffset, endOffset);
      sentenceSpans.forEach((span, sIndex) => {
        segments.push({
          id: `s-${pIndex}-${sIndex}`,
          paragraphId: pId,
          segmentIndex: sIndex,
          originalText: span.text,
          normalizedText: normalizeSegment(span.text),
          startOffset: span.startOffset,
          endOffset: span.endOffset,
        });
      });

      pIndex++;
    }

    lastIndex = paragraphRegex.lastIndex;
  }

  // Final paragraph after last double newline
  if (lastIndex < originalPolicyText.length) {
    const rawParagraph = originalPolicyText.slice(lastIndex);
    const trimmed = rawParagraph.trim();

    if (trimmed.length > 0) {
      const leadingWs = rawParagraph.indexOf(trimmed);
      const startOffset = lastIndex + leadingWs;
      const endOffset = startOffset + trimmed.length;
      const pId = `p-${pIndex}`;

      paragraphs.push({
        id: pId,
        index: pIndex,
        originalText: originalPolicyText.slice(startOffset, endOffset),
        startOffset,
        endOffset,
      });

      const sentenceSpans = extractSentencesFromParagraph(originalPolicyText, startOffset, endOffset);
      sentenceSpans.forEach((span, sIndex) => {
        segments.push({
          id: `s-${pIndex}-${sIndex}`,
          paragraphId: pId,
          segmentIndex: sIndex,
          originalText: span.text,
          normalizedText: normalizeSegment(span.text),
          startOffset: span.startOffset,
          endOffset: span.endOffset,
        });
      });
    }
  }

  return { paragraphs, segments };
}

export default {
  segmentPolicyText,
};
