/**
 * Metrics Calculation Engine for PrivacyLens Accuracy Evaluation (Phase 2)
 *
 * Implements mathematically sound classification and information retrieval metrics:
 * - Binary and Multiclass Confusion Matrices
 * - Precision, Recall, F1-Score (safe against zero denominators)
 * - Macro and Weighted Averages
 * - Explicit treatment of ambiguous ('unclear') classifications
 */

/**
 * Safely computes division, returning fallback value on division by zero or NaN.
 *
 * @param {number} numerator
 * @param {number} denominator
 * @param {number} [fallback=0.0]
 * @returns {number}
 */
export function safeDivide(numerator, denominator, fallback = 0.0) {
  if (typeof numerator !== 'number' || typeof denominator !== 'number') {
    return fallback;
  }
  if (denominator === 0 || isNaN(denominator) || isNaN(numerator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? fallback : result;
}

/**
 * Calculates binary classification metrics from TP, FP, FN, TN counts.
 *
 * @param {{ tp: number, fp: number, fn: number, tn: number }} counts
 * @returns {{
 *   precision: number,
 *   recall: number,
 *   f1: number,
 *   accuracy: number,
 *   tp: number,
 *   fp: number,
 *   fn: number,
 *   tn: number,
 *   total: number
 * }}
 */
export function calculateBinaryMetrics({ tp = 0, fp = 0, fn = 0, tn = 0 }) {
  const precision = safeDivide(tp, tp + fp, 0.0);
  const recall = safeDivide(tp, tp + fn, 0.0);
  const f1 = safeDivide(2 * (precision * recall), precision + recall, 0.0);
  const total = tp + fp + fn + tn;
  const accuracy = safeDivide(tp + tn, total, 0.0);

  return {
    precision: roundMetric(precision),
    recall: roundMetric(recall),
    f1: roundMetric(f1),
    accuracy: roundMetric(accuracy),
    tp,
    fp,
    fn,
    tn,
    total,
  };
}

/**
 * Rounds a float metric to 4 decimal places for clean reporting.
 *
 * @param {number} val
 * @returns {number}
 */
export function roundMetric(val) {
  if (typeof val !== 'number' || isNaN(val)) return 0.0;
  return Math.round(val * 10000) / 10000;
}

/**
 * Builds a 3x3 multiclass confusion matrix for ['found', 'unclear', 'not_found'].
 * Rows = Ground Truth, Columns = Predicted
 *
 * @param {Array<{ expected: string, predicted: string }>} classifications
 * @param {Array<string>} [classes=['found', 'unclear', 'not_found']]
 * @returns {Record<string, Record<string, number>>}
 */
export function buildConfusionMatrix(classifications, classes = ['found', 'unclear', 'not_found']) {
  const matrix = {};
  for (const actual of classes) {
    matrix[actual] = {};
    for (const pred of classes) {
      matrix[actual][pred] = 0;
    }
  }

  for (const item of classifications) {
    const actual = classes.includes(item.expected) ? item.expected : 'not_found';
    const pred = classes.includes(item.predicted) ? item.predicted : 'not_found';
    if (matrix[actual] && matrix[actual][pred] !== undefined) {
      matrix[actual][pred]++;
    }
  }

  return matrix;
}

/**
 * Computes per-class and macro-averaged metrics from a multiclass confusion matrix.
 *
 * @param {Record<string, Record<string, number>>} matrix
 * @param {Array<string>} [classes=['found', 'unclear', 'not_found']]
 * @returns {{
 *   perClass: Record<string, { precision: number, recall: number, f1: number, support: number }>,
 *   macro: { precision: number, recall: number, f1: number },
 *   totalSamples: number
 * }}
 */
export function calculateMulticlassMetrics(matrix, classes = ['found', 'unclear', 'not_found']) {
  const perClass = {};
  let macroP = 0;
  let macroR = 0;
  let macroF1 = 0;
  let totalSamples = 0;

  for (const cls of classes) {
    const tp = matrix[cls]?.[cls] || 0;

    // False Positives: sum of all column values where actual != cls
    let fp = 0;
    for (const actual of classes) {
      if (actual !== cls) {
        fp += matrix[actual]?.[cls] || 0;
      }
    }

    // False Negatives: sum of all row values where predicted != cls
    let fn = 0;
    for (const pred of classes) {
      if (pred !== cls) {
        fn += matrix[cls]?.[pred] || 0;
      }
    }

    // Support: total ground-truth instances of cls
    let support = 0;
    for (const pred of classes) {
      support += matrix[cls]?.[pred] || 0;
    }
    totalSamples += support;

    const precision = safeDivide(tp, tp + fp, 0.0);
    const recall = safeDivide(tp, tp + fn, 0.0);
    const f1 = safeDivide(2 * (precision * recall), precision + recall, 0.0);

    perClass[cls] = {
      precision: roundMetric(precision),
      recall: roundMetric(recall),
      f1: roundMetric(f1),
      support,
    };

    macroP += precision;
    macroR += recall;
    macroF1 += f1;
  }

  const numClasses = classes.length;
  return {
    perClass,
    macro: {
      precision: roundMetric(safeDivide(macroP, numClasses, 0.0)),
      recall: roundMetric(safeDivide(macroR, numClasses, 0.0)),
      f1: roundMetric(safeDivide(macroF1, numClasses, 0.0)),
    },
    totalSamples,
  };
}

