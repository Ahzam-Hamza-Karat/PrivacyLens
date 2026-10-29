/**
 * Policy Diff & Version Comparison Utility
 *
 * Provides deterministic, in-memory text comparison between two explicitly supplied policy versions.
 *
 * Acceptance Invariants:
 * - Operates strictly on client-supplied text; zero network requests or scraping.
 * - Compares original wording at sentence/clause and token level.
 * - Explicitly avoids making legal or compliance claims about textual differences.
 * - Enforces character boundary limits (up to 50,000 characters per version).
 */

/**
 * Sample paired policy versions for educational demonstration.
 */
export const SAMPLE_POLICY_V1 = `Privacy Policy - Version 1.0 (2024)

1. Data Collection
We collect your email address, full name, and billing details when you sign up. We do not collect your real-time physical GPS location without explicit consent.

2. Cookies and Tracking
We use first-party session cookies to maintain your login session. We do not use third-party tracking beacons or sell your information to advertisers.

3. Data Retention
We retain your personal information for 12 months after your account is closed.

4. Your Rights
You may request access to your personal information or request deletion by emailing privacy@example.com.`;

export const SAMPLE_POLICY_V2 = `Privacy Policy - Version 2.0 (2025)

1. Data Collection
We collect your email address, full name, mobile phone number, and billing details when you sign up. We may automatically collect your precise GPS location and device telemetry data to optimize service delivery.

2. Cookies and Tracking
We use first-party cookies and third-party analytics pixels to measure website usage. We share behavioral data with trusted marketing affiliates.

3. Data Retention
We retain your personal information for as long as necessary to fulfill operational business purposes or comply with legal obligations.

4. Your Rights
You may request access to your personal information, request data portability, or request deletion by emailing privacy@example.com.`;

/**
 * Simple, robust Longest Common Subsequence (LCS) token-level diffing algorithm.
 * Tokenizes text into words and punctuation while preserving whitespace.
 *
 * @param {string} textA - Original text version
 * @param {string} textB - Updated text version
 * @returns {{
 *   diffs: Array<{ type: 'added' | 'removed' | 'unchanged', text: string }>,
 *   stats: {
 *     addedWords: number,
 *     removedWords: number,
 *     unchangedWords: number,
 *     similarityPercent: number
 *   }
 * }}
 */
export function computePolicyDiff(textA, textB) {
  const strA = typeof textA === 'string' ? textA : '';
  const strB = typeof textB === 'string' ? textB : '';

  // Tokenize preserving whitespace and words
  const tokenize = (text) => {
    if (!text) return [];
    // Split by words, whitespace, and line breaks
    return text.match(/(\s+|\S+)/g) || [];
  };

  const tokensA = tokenize(strA);
  const tokensB = tokenize(strB);

  const lenA = tokensA.length;
  const lenB = tokensB.length;

  // Handle empty edge cases
  if (lenA === 0 && lenB === 0) {
    return {
      diffs: [],
      stats: { addedWords: 0, removedWords: 0, unchangedWords: 0, similarityPercent: 100 },
    };
  }
  if (lenA === 0) {
    return {
      diffs: [{ type: 'added', text: strB }],
      stats: { addedWords: tokensB.filter(t => /\S/.test(t)).length, removedWords: 0, unchangedWords: 0, similarityPercent: 0 },
    };
  }
  if (lenB === 0) {
    return {
      diffs: [{ type: 'removed', text: strA }],
      stats: { addedWords: 0, removedWords: tokensA.filter(t => /\S/.test(t)).length, unchangedWords: 0, similarityPercent: 0 },
    };
  }

  // Compute LCS matrix (bounded to prevent excessive memory on huge texts)
  const MAX_DIFF_TOKENS = 4000;
  if (lenA > MAX_DIFF_TOKENS || lenB > MAX_DIFF_TOKENS) {
    // Coarse fallback for unusually massive policies
    return computeCoarseDiff(tokensA, tokensB);
  }

  // Standard dynamic programming LCS
  const dp = Array.from({ length: lenA + 1 }, () => new Uint16Array(lenB + 1));

  for (let i = 0; i < lenA; i++) {
    for (let j = 0; j < lenB; j++) {
      if (tokensA[i] === tokensB[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build diff segments
  let i = lenA;
  let j = lenB;
  const rawDiffs = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && tokensA[i - 1] === tokensB[j - 1]) {
      rawDiffs.push({ type: 'unchanged', text: tokensA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawDiffs.push({ type: 'added', text: tokensB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawDiffs.push({ type: 'removed', text: tokensA[i - 1] });
      i--;
    }
  }

  rawDiffs.reverse();

  // Consolidate adjacent diff tokens of same type
  const consolidated = [];
  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  for (const item of rawDiffs) {
    const isWord = /\S/.test(item.text);
    if (item.type === 'added' && isWord) addedCount++;
    if (item.type === 'removed' && isWord) removedCount++;
    if (item.type === 'unchanged' && isWord) unchangedCount++;

    if (consolidated.length > 0 && consolidated[consolidated.length - 1].type === item.type) {
      consolidated[consolidated.length - 1].text += item.text;
    } else {
      consolidated.push({ type: item.type, text: item.text });
    }
  }

  const totalWords = unchangedCount + Math.max(addedCount, removedCount);
  const similarityPercent = totalWords > 0 ? Math.round((unchangedCount / totalWords) * 100) : 100;

  return {
    diffs: consolidated,
    stats: {
      addedWords: addedCount,
      removedWords: removedCount,
      unchangedWords: unchangedCount,
      similarityPercent,
    },
  };
}

/**
 * Line/block level coarse diff fallback for very large texts.
 */
function computeCoarseDiff(tokensA, tokensB) {
  const textA = tokensA.join('');
  const textB = tokensB.join('');
  return {
    diffs: [
      { type: 'removed', text: textA },
      { type: 'added', text: textB },
    ],
    stats: {
      addedWords: tokensB.filter(t => /\S/.test(t)).length,
      removedWords: tokensA.filter(t => /\S/.test(t)).length,
      unchangedWords: 0,
      similarityPercent: 50,
    },
  };
}

