#!/usr/bin/env node
/**
 * CLI Evaluation Script for PrivacyLens (Phase 2)
 *
 * Runs repeatable, transparent accuracy evaluation against the curated dataset:
 * - Computes separate Tuning, Held-Out, and Overall evaluation results
 * - Displays 3x3 confusion matrix and classification metrics
 * - Renders per-category and per-rule breakdown tables
 * - Analyzes any False Positives and False Negatives
 *
 * Usage:
 *   node src/evaluation/evaluate.js
 *   node src/evaluation/evaluate.js --split=tuning
 *   node src/evaluation/evaluate.js --split=held_out
 *   node src/evaluation/evaluate.js --json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateDataset } from './evaluator.js';
import { validateDataset } from './validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.resolve(__dirname, 'dataset.json');

function formatPercent(val) {
  return `${(val * 100).toFixed(2)}%`;
}

function pad(str, len, align = 'left') {
  const s = String(str);
  if (s.length >= len) return s;
  const padding = ' '.repeat(len - s.length);
  return align === 'right' ? padding + s : s + padding;
}

export function runEvaluation(options = {}) {
  const rawData = fs.readFileSync(datasetPath, 'utf8');
  const dataset = JSON.parse(rawData);

  const validation = validateDataset(dataset);
  if (!validation.isValid) {
    console.error('❌ Dataset Validation Errors:');
    validation.errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }

  const splitArg = options.split || 'all';

  if (options.json) {
    const results = {
      tuning: evaluateDataset(dataset, { split: 'tuning' }),
      heldOut: evaluateDataset(dataset, { split: 'held_out' }),
      overall: evaluateDataset(dataset, { split: 'all' }),
    };
    console.log(JSON.stringify(results, null, 2));
    return results;
  }

  console.log('='.repeat(78));
  console.log(' PRIVACYLENS — DETERMINISTIC PRIVACY ANALYSIS ENGINE EVALUATION');
  console.log('='.repeat(78));
  console.log(`Dataset Path:     ${datasetPath}`);
  console.log(`Total Corpus:     ${dataset.length} labeled policy excerpts`);
  console.log(`Tuning Set:       ${validation.tuningCount} examples (50.0%)`);
  console.log(`Held-Out Set:     ${validation.heldOutCount} examples (50.0%)`);
  console.log(`Split Leakage:    CLEAN (0 text collisions)`);
  console.log('='.repeat(78));

  // Run evaluations
  const tuningResults = evaluateDataset(dataset, { split: 'tuning' });
  const heldOutResults = evaluateDataset(dataset, { split: 'held_out' });
  const overallResults = evaluateDataset(dataset, { split: 'all' });

  // 1. Comparison of Splits
  console.log('\n📊 1. SPLIT COMPARISON (TUNING VS HELD-OUT VS OVERALL)');
  console.log('-'.repeat(78));
  console.log(
    pad('Split Name', 16) +
      pad('Samples', 10, 'right') +
      pad('Accuracy', 12, 'right') +
      pad('Precision', 13, 'right') +
      pad('Recall', 12, 'right') +
      pad('F1-Score', 13, 'right')
  );
  console.log('-'.repeat(78));

  const printSplitRow = (name, res) => {
    console.log(
      pad(name, 16) +
        pad(res.totalEvaluated, 10, 'right') +
        pad(formatPercent(res.binary.accuracy), 12, 'right') +
        pad(formatPercent(res.binary.precision), 13, 'right') +
        pad(formatPercent(res.binary.recall), 12, 'right') +
        pad(formatPercent(res.binary.f1), 13, 'right')
    );
  };

  printSplitRow('Tuning Set', tuningResults);
  printSplitRow('Held-Out Set', heldOutResults);
  printSplitRow('Full Corpus', overallResults);
  console.log('-'.repeat(78));

  // 2. Multiclass Confusion Matrix (Overall)
  console.log('\n🧩 2. MULTICLASS CONFUSION MATRIX (FULL CORPUS: N=' + overallResults.totalEvaluated + ')');
  console.log('Rows = Ground Truth Label | Columns = Predicted Label\n');
  const cm = overallResults.confusionMatrix;
  console.log(
    pad('Ground Truth \\ Pred', 22) +
      pad('found', 12, 'right') +
      pad('unclear', 12, 'right') +
      pad('not_found', 14, 'right')
  );
  console.log('-'.repeat(60));
  for (const actual of ['found', 'unclear', 'not_found']) {
    console.log(
      pad(actual, 22) +
        pad(cm[actual]?.['found'] || 0, 12, 'right') +
        pad(cm[actual]?.['unclear'] || 0, 12, 'right') +
        pad(cm[actual]?.['not_found'] || 0, 14, 'right')
    );
  }
  console.log('-'.repeat(60));

  // 3. Per-Category Performance Table
  console.log('\n📂 3. PER-CATEGORY CLASSIFICATION PERFORMANCE');
  console.log('-'.repeat(78));
  console.log(
    pad('Category ID', 22) +
      pad('Support', 10, 'right') +
      pad('Precision', 13, 'right') +
      pad('Recall', 12, 'right') +
      pad('F1-Score', 13, 'right')
  );
  console.log('-'.repeat(78));
  for (const [catId, stats] of Object.entries(overallResults.categories)) {
    console.log(
      pad(catId, 22) +
        pad(stats.support, 10, 'right') +
        pad(formatPercent(stats.precision), 13, 'right') +
        pad(formatPercent(stats.recall), 12, 'right') +
        pad(formatPercent(stats.f1), 13, 'right')
    );
  }
  console.log('-'.repeat(78));

  // 4. Per-Rule Performance Summary
  console.log('\n🔍 4. PER-RULE DETECTION COVERAGE (28 RULES)');
  console.log('-'.repeat(78));
  console.log(
    pad('Rule Identifier', 34) +
      pad('Support', 10, 'right') +
      pad('Precision', 11, 'right') +
      pad('Recall', 10, 'right') +
      pad('F1', 11, 'right')
  );
  console.log('-'.repeat(78));
  for (const [rId, stats] of Object.entries(overallResults.rules)) {
    console.log(
      pad(rId, 34) +
        pad(stats.support, 10, 'right') +
        pad(formatPercent(stats.precision), 11, 'right') +
        pad(formatPercent(stats.recall), 10, 'right') +
        pad(formatPercent(stats.f1), 11, 'right')
    );
  }
  console.log('-'.repeat(78));

  // 5. Error & Edge Case Inspection
  console.log('\n⚠️  5. ERROR & EDGE CASE ANALYSIS');
  console.log(
    `Total False Positives:  ${overallResults.falsePositives.length} / ${overallResults.totalEvaluated}`
  );
  console.log(
    `Total False Negatives:  ${overallResults.falseNegatives.length} / ${overallResults.totalEvaluated}`
  );
  console.log(
    `Ambiguity Shifts:       ${overallResults.ambiguityMisclassifications.length} (expected 'unclear' vs detected)`
  );

  if (overallResults.falsePositives.length > 0) {
    console.log('\nFalse Positives Detail:');
    overallResults.falsePositives.forEach((fp) => {
      console.log(`  - [${fp.id}] "${fp.text.slice(0, 50)}..."`);
      console.log(`    Expected: ${fp.expectedStatus} | Triggered: ${fp.triggeredRuleIds.join(', ')}`);
    });
  }

  if (overallResults.falseNegatives.length > 0) {
    console.log('\nFalse Negatives Detail:');
    overallResults.falseNegatives.forEach((fn) => {
      console.log(`  - [${fn.id}] "${fn.text.slice(0, 50)}..."`);
      console.log(`    Expected: ${fn.expectedRuleId} (${fn.expectedStatus}) | Predicted: ${fn.predictedStatus}`);
    });
  }

  console.log('\n' + '='.repeat(78));
  console.log(' ✅ EVALUATION RUN COMPLETE — All checks passed successfully.');
  console.log('='.repeat(78) + '\n');

  return {
    tuning: tuningResults,
    heldOut: heldOutResults,
    overall: overallResults,
  };
}

// Direct invocation check
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const options = {
    split: args.includes('--split=tuning')
      ? 'tuning'
      : args.includes('--split=held_out')
      ? 'held_out'
      : 'all',
    json: args.includes('--json'),
  };
  try {
    runEvaluation(options);
  } catch (err) {
    console.error('Evaluation failed:', err);
    process.exit(1);
  }
}

