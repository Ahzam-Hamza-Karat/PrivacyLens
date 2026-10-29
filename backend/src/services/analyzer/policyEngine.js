import {
  CATEGORIES,
  CATEGORY_DEFINITIONS,
  STATUS,
  MATCH_STRENGTH,
  MATCH_TYPE,
  ENGINE_METADATA,
  GLOBAL_LIMITATIONS,
} from '../../constants/policyConstants.js';
import { segmentPolicyText } from '../policy/textSegmenter.js';
import { analyzeContext } from './contextHandler.js';
import { RULES } from './ruleRegistry.js';
import { refineEvidenceExcerpt } from './evidenceRefiner.js';
import { getRuleExplanation, generateKeyObservations } from './explanationCatalogue.js';

/**
 * Evaluates candidate rules against a segmented policy text.
 * Enforces deterministic matching, context & negation safety,
 * verbatim source tracking, and non-presumptive categorization.
 *
 * @param {string} originalPolicyText - Raw policy text
 * @returns {object} Structured analysis report conforming to API contract
 */
export function analyzePolicyDocument(originalPolicyText) {
  // Step 1: Segment policy into ordered paragraphs and deterministic clauses
  const { paragraphs, segments } = segmentPolicyText(originalPolicyText);

  const findings = [];
  const categoryFindingsMap = {
    [CATEGORIES.DATA_COLLECTION]: [],
    [CATEGORIES.DATA_SHARING]: [],
    [CATEGORIES.COOKIES_TRACKING]: [],
    [CATEGORIES.DATA_RETENTION]: [],
    [CATEGORIES.USER_RIGHTS]: [],
  };

  let findingCounter = 1;

  // Step 2: Evaluate segments against registered deterministic rules
  for (const segment of segments) {
    const { normalizedText } = segment;
    const context = analyzeContext(normalizedText);

    // Track rules matched in this segment to avoid duplicates
    const matchedRuleIds = new Set();

    for (const rule of RULES) {
      if (matchedRuleIds.has(rule.id)) continue;

      // Check negative patterns (disqualifiers)
      if (rule.negativePatterns && rule.negativePatterns.length > 0) {
        const hasNegativeMatch = rule.negativePatterns.some((np) => np.test(normalizedText));
        if (hasNegativeMatch) {
          continue; // Rule disqualified by negative pattern
        }
      }

      // Check positive patterns
      const positiveMatched = rule.positivePatterns.some((pp) => pp.test(normalizedText));
      if (!positiveMatched) continue;

      matchedRuleIds.add(rule.id);

      // Determine match type and strength
      let matchType = rule.expectedMatchType || context.matchType;
      if (rule.expectedMatchType === MATCH_TYPE.VAGUE || context.isVague) {
        matchType = MATCH_TYPE.VAGUE;
      } else if (context.isConditional) {
        matchType = MATCH_TYPE.CONDITIONAL;
      } else if (rule.expectedMatchType === MATCH_TYPE.NEGATIVE_DISCLOSURE) {
        matchType = MATCH_TYPE.NEGATIVE_DISCLOSURE;
      }

      let matchStrength = rule.defaultStrength || MATCH_STRENGTH.STRONG;
      if (matchType === MATCH_TYPE.VAGUE) {
        matchStrength = MATCH_STRENGTH.UNCLEAR;
      } else if (matchType === MATCH_TYPE.CONDITIONAL && matchStrength === MATCH_STRENGTH.STRONG) {
        matchStrength = MATCH_STRENGTH.POSSIBLE;
      }

      // Refine evidence to the smallest clear verbatim excerpt supporting this specific rule
      const refined = refineEvidenceExcerpt(segment, rule, originalPolicyText);

      const finding = {
        id: `finding-${findingCounter++}`,
        category: rule.category,
        ruleId: rule.id,
        title: rule.title,
        description: rule.description,
        evidence: refined.evidence,
        paragraphId: segment.paragraphId,
        segmentId: segment.id,
        startOffset: refined.startOffset,
        endOffset: refined.endOffset,
        matchStrength,
        matchType,
        limitation: rule.limitation,
        explanation: getRuleExplanation(rule.id),
      };

      findings.push(finding);
      if (categoryFindingsMap[rule.category]) {
        categoryFindingsMap[rule.category].push(finding);
      }
    }
  }

  // Step 3: Construct category-level summaries and status classifications
  const categoryResults = [];
  const categoryCounts = {};
  const overallStatus = {};

  for (const catKey of Object.values(CATEGORIES)) {
    const catDef = CATEGORY_DEFINITIONS[catKey];
    const catFindings = categoryFindingsMap[catKey] || [];
    const count = catFindings.length;

    categoryCounts[catKey] = count;

    let status = STATUS.NOT_FOUND;
    let summary = '';
    let explanation = '';

    if (count === 0) {
      status = STATUS.NOT_FOUND;
      summary = catDef.notFoundNotice;
      explanation =
        'No candidate disclosures were identified in the provided text matching the deterministic rule set. The absence of detected disclosures in this text is not evidence that the organization does not perform this activity.';
    } else {
      const allUnclear = catFindings.every(
        (f) => f.matchStrength === MATCH_STRENGTH.UNCLEAR || f.matchType === MATCH_TYPE.VAGUE
      );

      if (allUnclear) {
        status = STATUS.UNCLEAR;
        summary = `Identified ${count} conditional or indefinite disclosure(s) requiring clarification.`;
        explanation =
          'The analyzed text contains conditional, ambiguous, or discretionary language without precise operational specifications.';
      } else {
        status = STATUS.FOUND;
        const titles = [...new Set(catFindings.map((f) => f.title))].slice(0, 3).join(', ');
        summary = `Identified ${count} verifiable candidate disclosure(s), including: ${titles}.`;
        explanation =
          'Candidate disclosures were identified matching transparent deterministic patterns and supported by exact verbatim quotations.';
      }
    }

    overallStatus[catKey] = status;

    categoryResults.push({
      id: catDef.id,
      name: catDef.name,
      shortName: catDef.shortName,
      status,
      findingCount: count,
      summary,
      explanation,
      findings: catFindings.map((f) => f.id),
      limitations: catDef.description,
    });
  }

  // Step 4: Assemble finalized JSON response structure
  return {
    success: true,
    engine: {
      ...ENGINE_METADATA,
    },
    metadata: {
      characterCount: originalPolicyText.length,
      paragraphCount: paragraphs.length,
      segmentCount: segments.length,
      analyzedAt: new Date().toISOString(),
    },
    summary: {
      totalFindings: findings.length,
      categoryCounts,
      overallStatus,
      categoriesWithFindingsCount: Object.values(categoryCounts).filter((c) => c > 0).length,
      categoriesWithoutFindingsCount: Object.values(categoryCounts).filter((c) => c === 0).length,
      keyObservations: generateKeyObservations(findings, categoryResults),
    },
    categories: categoryResults,
    findings,
    limitations: GLOBAL_LIMITATIONS,
  };
}

export default {
  analyzePolicyDocument,
};
