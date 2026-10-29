/**
 * Text Normalization Utility
 * Standardizes formatting, line breaks, unicode punctuation, and spacing for consistent rule matching
 * while strictly preserving the integrity of original policy text for verifiable evidence citations.
 */

/**
 * Normalizes text for processing and pattern matching without altering original meaning.
 * - Standardizes CRLF and CR to LF
 * - Replaces non-breaking spaces (\u00A0) with standard spaces
 * - Replaces unicode curly quotes and apostrophes with ASCII equivalents
 * - Replaces unicode em-dashes and en-dashes with standard hyphens
 * - Replaces bullet glyphs with standard list markers
 * - Collapses consecutive whitespace (excluding intentional line breaks)
 *
 * @param {string} text - Raw input text
 * @returns {string} Normalized text for rule evaluation
 */
export function normalizeForProcessing(text) {
  if (typeof text !== 'string') return '';

  return (
    text
      // Standardize carriage returns
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Non-breaking spaces and other invisible spaces
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      // Smart single quotes and apostrophes
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      // Smart double quotes
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      // En-dashes, em-dashes, and horizontal bars
      .replace(/[\u2012\u2013\u2014\u2015]/g, '-')
      // Unicode bullet symbols
      .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25B8]/g, ' - ')
      // Horizontal tab characters
      .replace(/\t/g, ' ')
      // Collapse multiple horizontal spaces to single space
      .replace(/[^\S\n]+/g, ' ')
  );
}

/**
 * Normalizes an individual segment string for rule evaluation:
 * - Trims leading/trailing whitespace
 * - Standardizes internal spacing
 * - Standardizes unicode characters
 *
 * @param {string} segmentText - Extracted text segment
 * @returns {string} Clean normalized string
 */
export function normalizeSegment(segmentText) {
  if (typeof segmentText !== 'string') return '';
  return normalizeForProcessing(segmentText).trim();
}

export default {
  normalizeForProcessing,
  normalizeSegment,
};
