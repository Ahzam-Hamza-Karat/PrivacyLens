/**
 * Core Evaluation Runner Engine (Phase 2)
 *
 * Executes the deterministic policy engine against curated evaluation datasets:
 * - Runs without any external AI or network calls
 * - Evaluates tuning, held-out, and overall splits
 * - Computes multiclass confusion matrix and binary detection metrics
 * - Gathers per-category and per-rule precision, recall, and F1
 * - Identifies detailed error cases (false positives and false negatives)
 */

import { analyzePolicyDocument } from '../services/analyzer/policyEngine.js';
import { CATEGORIES, STATUS, MATCH_TYPE } from '../constants/policyConstants.js';
import { RULES } from '../services/analyzer/ruleRegistry.js';
import {
  calculateBinaryMetrics,
  buildConfusionMatrix,
  calculateMulticlassMetrics,
} from './metrics.js';
import { validateDataset } from './validator.js';

/**
 * Evaluates a dataset or a specific split of a dataset.
 *
 * @param {Array<object>} dataset
 * @param {object} [options]
 * @param {'all' | 'tuning' | 'held_out'} [options.split='all']
 * @returns {{
 *   split: string,
 *   totalEvaluated: number,
 *   multiclass: object,
 *   binary: object,
 *   confusionMatrix: Record<string, Record<string, number>>,
 *   categories: Record<string, object>,
 *   rules: Record<string, object>,
 *   falsePositives: Array<object>,
 *   falseNegatives: Array<object>,
 *   ambiguityMisclassifications: Array<object>
 * }}
 */
export function evaluateDataset(dataset, options = {}) {
  const { split = 'all' } = options;

  if (Array.isArray(dataset) && dataset.length === 0) {
    return {
      split,
      totalEvaluated: 0,
      multiclass: { perClass: {}, macro: { precision: 0, recall: 0, f1: 0 }, totalSamples: 0 },
      binary: calculateBinaryMetrics({ tp: 0, fp: 0, fn: 0, tn: 0 }),
      confusionMatrix: buildConfusionMatrix([]),
      categories: {},
      rules: {},
      falsePositives: [],
      falseNegatives: [],
      ambiguityMisclassifications: [],
    };
  }

  // Validate dataset first
  const validation = validateDataset(dataset);
  if (!validation.isValid) {
    const error = new Error(`Dataset validation failed: ${validation.errors.join('; ')}`);
    error.errors = validation.errors;
    throw error;
  }

  // Filter by split if requested
  const items = split === 'all' ? dataset : dataset.filter((d) => d.split === split);

  if (items.length === 0) {
    return {
      split,
      totalEvaluated: 0,
      multiclass: { perClass: {}, macro: { precision: 0, recall: 0, f1: 0 }, totalSamples: 0 },
      binary: calculateBinaryMetrics({ tp: 0, fp: 0, fn: 0, tn: 0 }),
      confusionMatrix: buildConfusionMatrix([]),
      categories: {},
      rules: {},
      falsePositives: [],
      falseNegatives: [],
      ambiguityMisclassifications: [],
    };
  }

  const classifications = [];
  const falsePositives = [];
  const falseNegatives = [];
  const ambiguityMisclassifications = [];

  let binaryTp = 0;
  let binaryFp = 0;
  let binaryFn = 0;
  let binaryTn = 0;

  // Track per-category counts
  const categoryCounts = {};
  for (const cat of Object.values(CATEGORIES)) {
    categoryCounts[cat] = { tp: 0, fp: 0, fn: 0, tn: 0, support: 0 };
  }

  // Track per-rule counts
  const ruleCounts = {};

  for (const item of items) {
    const report = analyzePolicyDocument(item.text);

    // Determine predicted status for target category or overall
    let predictedStatus = STATUS.NOT_FOUND;
    let targetCatFindings = [];

    if (item.expectedCategory) {
      const catReport = report.categories.find((c) => c.id === item.expectedCategory);
      predictedStatus = catReport ? catReport.status : STATUS.NOT_FOUND;
      targetCatFindings = report.findings.filter((f) => f.category === item.expectedCategory);
    } else {
      // General/Cross-cutting negative control item
      if (report.findings.length > 0) {
        const allUnclear = report.findings.every(
          (f) => f.matchStrength === 'unclear' || f.matchType === 'vague'
        );
        predictedStatus = allUnclear ? STATUS.UNCLEAR : STATUS.FOUND;
      } else {
        predictedStatus = STATUS.NOT_FOUND;
      }
      targetCatFindings = report.findings;
    }

    const expectedStatus = item.expectedStatus;
    classifications.push({ expected: expectedStatus, predicted: predictedStatus });

    // Binary evaluation: positive class = 'found'
    const isExpectedFound = expectedStatus === STATUS.FOUND;
    const isPredictedFound = predictedStatus === STATUS.FOUND;

    if (isExpectedFound && isPredictedFound) {
      binaryTp++;
    } else if (!isExpectedFound && isPredictedFound) {
      binaryFp++;
      falsePositives.push({
        id: item.id,
        text: item.text,
        expectedStatus,
        predictedStatus,
        expectedRuleId: item.expectedRuleId,
        triggeredRuleIds: report.findings.map((f) => f.ruleId),
        origin: item.origin,
        notes: item.notes,
      });
    } else if (isExpectedFound && !isPredictedFound) {
      binaryFn++;
      falseNegatives.push({
        id: item.id,
        text: item.text,
        expectedStatus,
        predictedStatus,
        expectedRuleId: item.expectedRuleId,
        triggeredRuleIds: report.findings.map((f) => f.ruleId),
        origin: item.origin,
        notes: item.notes,
      });
    } else {
      binaryTn++;
    }

    // Track ambiguity misclassifications specifically
    if (
      (expectedStatus === STATUS.UNCLEAR && predictedStatus !== STATUS.UNCLEAR) ||
      (expectedStatus !== STATUS.UNCLEAR && predictedStatus === STATUS.UNCLEAR)
    ) {
      ambiguityMisclassifications.push({
        id: item.id,
        text: item.text,
        expectedStatus,
        predictedStatus,
        notes: item.notes,
      });
    }

    // Per-Category statistics
    if (item.expectedCategory && categoryCounts[item.expectedCategory]) {
      categoryCounts[item.expectedCategory].support++;
      if (expectedStatus === STATUS.FOUND && predictedStatus === STATUS.FOUND) {
        categoryCounts[item.expectedCategory].tp++;
      } else if (expectedStatus !== STATUS.FOUND && predictedStatus === STATUS.FOUND) {
        categoryCounts[item.expectedCategory].fp++;
      } else if (expectedStatus === STATUS.FOUND && predictedStatus !== STATUS.FOUND) {
        categoryCounts[item.expectedCategory].fn++;
      } else {
        categoryCounts[item.expectedCategory].tn++;
      }
    }

    // Per-Rule statistics
    if (item.expectedRuleId) {
      const rId = item.expectedRuleId;
      if (!ruleCounts[rId]) {
        ruleCounts[rId] = { tp: 0, fp: 0, fn: 0, tn: 0, support: 0 };
      }
      ruleCounts[rId].support++;
      const ruleTriggered = report.findings.some((f) => f.ruleId === rId);

      // Determine if this specific rule is expected to trigger for this item:
      // - Rules targeting vague/ambiguous disclosures (e.g. RETENTION_VAGUE_DURATION)
      //   are expected to trigger when expectedStatus is UNCLEAR or FOUND.
      // - Affirmative, conditional, or negative-disclosure rules are expected to trigger
      //   strictly when expectedStatus is FOUND.
      // - Negative controls (NOT_FOUND) never expect any rule to trigger.
      const ruleDef = RULES.find((r) => r.id === rId);
      const isVagueRule = ruleDef?.expectedMatchType === MATCH_TYPE.VAGUE;
      const isExpectedRuleTrigger = isVagueRule
        ? (item.expectedStatus === STATUS.UNCLEAR || item.expectedStatus === STATUS.FOUND)
        : (item.expectedStatus === STATUS.FOUND);

      if (isExpectedRuleTrigger && ruleTriggered) {
        ruleCounts[rId].tp++;
      } else if (!isExpectedRuleTrigger && ruleTriggered) {
        ruleCounts[rId].fp++;
      } else if (isExpectedRuleTrigger && !ruleTriggered) {
        ruleCounts[rId].fn++;
      } else {
        ruleCounts[rId].tn++;
      }
    }
  }

  // Calculate confusion matrix and multiclass metrics
  const confusionMatrix = buildConfusionMatrix(classifications);
  const multiclassMetrics = calculateMulticlassMetrics(confusionMatrix);
  const binaryMetrics = calculateBinaryMetrics({
    tp: binaryTp,
    fp: binaryFp,
    fn: binaryFn,
    tn: binaryTn,
  });

  // Assemble per-category metrics
  const categoryMetrics = {};
  for (const [catKey, counts] of Object.entries(categoryCounts)) {
    categoryMetrics[catKey] = {
      ...calculateBinaryMetrics(counts),
      support: counts.support,
    };
  }

  // Assemble per-rule metrics
  const ruleMetrics = {};
  for (const [ruleId, counts] of Object.entries(ruleCounts)) {
    ruleMetrics[ruleId] = {
      ...calculateBinaryMetrics(counts),
      support: counts.support,
    };
  }

  return {
    split,
    totalEvaluated: items.length,
    multiclass: multiclassMetrics,
    binary: binaryMetrics,
    confusionMatrix,
    categories: categoryMetrics,
    rules: ruleMetrics,
    falsePositives,
    falseNegatives,
    ambiguityMisclassifications,
  };
}
