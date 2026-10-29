import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  safeDivide,
  calculateBinaryMetrics,
  buildConfusionMatrix,
  calculateMulticlassMetrics,
} from '../src/evaluation/metrics.js';
import {
  validateDatasetItem,
  validateDataset,
} from '../src/evaluation/validator.js';
import { evaluateDataset } from '../src/evaluation/evaluator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, '../src/evaluation/dataset.json');

describe('Phase 2 — Accuracy Evaluation Harness Test Suite', () => {
  // =========================================================================
  // 1. Safe Division & Numerical Edge Cases
  // =========================================================================
  describe('Mathematical Metric Calculations & Zero Denominators', () => {
    it('should return fallback (0.0) when dividing by zero', () => {
      assert.equal(safeDivide(5, 0), 0.0);
      assert.equal(safeDivide(0, 0), 0.0);
      assert.equal(safeDivide(0, 0, 1.0), 1.0);
    });

    it('should return fallback when encountering NaN or non-number types', () => {
      assert.equal(safeDivide(NaN, 10), 0.0);
      assert.equal(safeDivide(10, NaN), 0.0);
      assert.equal(safeDivide('10', 5), 0.0);
      assert.equal(safeDivide(null, 5), 0.0);
    });

    it('should handle zero TP, FP, FN gracefully in calculateBinaryMetrics', () => {
      const metrics = calculateBinaryMetrics({ tp: 0, fp: 0, fn: 0, tn: 0 });
      assert.equal(metrics.precision, 0.0);
      assert.equal(metrics.recall, 0.0);
      assert.equal(metrics.f1, 0.0);
      assert.equal(metrics.accuracy, 0.0);
      assert.equal(metrics.total, 0);
    });

    it('should calculate accurate metrics for known confusion numbers', () => {
      // TP=8, FP=2, FN=2, TN=8 -> Precision = 8/10 = 0.8, Recall = 8/10 = 0.8, F1 = 0.8, Acc = 16/20 = 0.8
      const metrics = calculateBinaryMetrics({ tp: 8, fp: 2, fn: 2, tn: 8 });
      assert.equal(metrics.precision, 0.8);
      assert.equal(metrics.recall, 0.8);
      assert.equal(metrics.f1, 0.8);
      assert.equal(metrics.accuracy, 0.8);
      assert.equal(metrics.total, 20);
    });
  });

  // =========================================================================
  // 2. Multiclass Confusion Matrix & Macro Averages
  // =========================================================================
  describe('Multiclass Confusion Matrix & Macro Metrics', () => {
    it('should construct accurate 3x3 matrix from classifications', () => {
      const items = [
        { expected: 'found', predicted: 'found' },
        { expected: 'found', predicted: 'unclear' },
        { expected: 'unclear', predicted: 'unclear' },
        { expected: 'not_found', predicted: 'not_found' },
        { expected: 'not_found', predicted: 'found' },
      ];
      const cm = buildConfusionMatrix(items);
      assert.equal(cm['found']['found'], 1);
      assert.equal(cm['found']['unclear'], 1);
      assert.equal(cm['found']['not_found'], 0);
      assert.equal(cm['unclear']['unclear'], 1);
      assert.equal(cm['not_found']['found'], 1);
      assert.equal(cm['not_found']['not_found'], 1);
    });

    it('should compute per-class and macro-averaged metrics correctly', () => {
      const matrix = {
        found: { found: 10, unclear: 0, not_found: 0 },
        unclear: { found: 0, unclear: 10, not_found: 0 },
        not_found: { found: 0, unclear: 0, not_found: 10 },
      };
      const res = calculateMulticlassMetrics(matrix);
      assert.equal(res.perClass['found'].precision, 1.0);
      assert.equal(res.perClass['found'].recall, 1.0);
      assert.equal(res.perClass['found'].f1, 1.0);
      assert.equal(res.macro.precision, 1.0);
      assert.equal(res.macro.recall, 1.0);
      assert.equal(res.macro.f1, 1.0);
      assert.equal(res.totalSamples, 30);
    });
  });

  // =========================================================================
  // 3. Dataset Schema & Integrity Validation
  // =========================================================================
  describe('Dataset Schema Validation & Data Leakage Prevention', () => {
    it('should reject items missing required ID or text', () => {
      const noId = validateDatasetItem({ text: 'Some text', expectedStatus: 'found', split: 'tuning', origin: 'synthetic_adversarial' });
      assert.equal(noId.isValid, false);
      assert.match(noId.errors[0], /missing required 'id'/i);

      const noText = validateDatasetItem({ id: 'test-1', text: '   ', expectedStatus: 'found', split: 'tuning', origin: 'synthetic_adversarial' });
      assert.equal(noText.isValid, false);
      assert.match(noText.errors[0], /missing required non-empty 'text'/i);
    });

    it('should reject items with invalid status, category, split, or origin', () => {
      const invalidStatus = validateDatasetItem({
        id: 'test-2',
        text: 'Valid text.',
        expectedCategory: 'data_collection',
        expectedStatus: 'invalid_status',
        split: 'tuning',
        origin: 'synthetic_adversarial',
      });
      assert.equal(invalidStatus.isValid, false);
      assert.match(invalidStatus.errors[0], /invalid expectedStatus/i);

      const invalidSplit = validateDatasetItem({
        id: 'test-3',
        text: 'Valid text.',
        expectedCategory: 'data_collection',
        expectedStatus: 'found',
        split: 'train_set', // Not 'tuning' or 'held_out'
        origin: 'synthetic_adversarial',
      });
      assert.equal(invalidSplit.isValid, false);
      assert.ok(invalidSplit.errors.some((e) => e.includes('invalid split')));
    });

    it('should require sourceUrl and retrievalDate for real-world items', () => {
      const realWorldMissingProvenance = validateDatasetItem({
        id: 'test-4',
        text: 'We collect your email.',
        expectedCategory: 'data_collection',
        expectedStatus: 'found',
        split: 'tuning',
        origin: 'real_world',
      });
      assert.equal(realWorldMissingProvenance.isValid, false);
      assert.ok(realWorldMissingProvenance.errors.some((e) => e.includes('sourceUrl')));
      assert.ok(realWorldMissingProvenance.errors.some((e) => e.includes('retrievalDate')));
    });

    it('should detect and reject duplicate IDs across the dataset', () => {
      const duplicateDataset = [
        { id: 'dup-1', text: 'First text.', expectedCategory: 'data_collection', expectedStatus: 'found', split: 'tuning', origin: 'synthetic_adversarial' },
        { id: 'dup-1', text: 'Second text.', expectedCategory: 'data_collection', expectedStatus: 'found', split: 'tuning', origin: 'synthetic_adversarial' },
      ];
      const res = validateDataset(duplicateDataset);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Duplicate ID')));
    });

    it('should detect cross-split data leakage between tuning and held-out sets', () => {
      const leakedDataset = [
        {
          id: 'item-tune',
          text: 'We collect your name and email address.',
          expectedCategory: 'data_collection',
          expectedStatus: 'found',
          split: 'tuning',
          origin: 'synthetic_adversarial',
        },
        {
          id: 'item-held',
          text: 'We collect your name and email address.', // Leaked copy in held-out!
          expectedCategory: 'data_collection',
          expectedStatus: 'found',
          split: 'held_out',
          origin: 'synthetic_adversarial',
        },
      ];
      const res = validateDataset(leakedDataset);
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Cross-split data leakage detected')));
    });
  });

  // =========================================================================
  // 4. Production Dataset Integrity & Evaluator Execution
  // =========================================================================
  describe('Production Dataset Execution & Split Independence', () => {
    it('should validate the production dataset.json cleanly with zero errors', () => {
      const raw = fs.readFileSync(datasetPath, 'utf8');
      const data = JSON.parse(raw);
      const res = validateDataset(data);
      assert.equal(res.isValid, true);
      assert.equal(res.errors.length, 0);
      assert.equal(res.total, 64);
      assert.equal(res.tuningCount, 32);
      assert.equal(res.heldOutCount, 32);
    });

    it('should handle evaluation with empty dataset without throwing', () => {
      const result = evaluateDataset([], { split: 'all' });
      assert.equal(result.totalEvaluated, 0);
      assert.equal(result.binary.precision, 0.0);
      assert.equal(result.binary.recall, 0.0);
      assert.equal(result.binary.f1, 0.0);
    });

    it('should run evaluation on the production tuning split and verify clean execution', () => {
      const raw = fs.readFileSync(datasetPath, 'utf8');
      const data = JSON.parse(raw);
      const res = evaluateDataset(data, { split: 'tuning' });
      assert.equal(res.split, 'tuning');
      assert.equal(res.totalEvaluated, 32);
      assert.equal(res.binary.precision, 1.0);
      assert.ok(res.binary.recall > 0.9);
      assert.ok(res.binary.f1 > 0.9);
    });

    it('should run evaluation on the production held-out split independently', () => {
      const raw = fs.readFileSync(datasetPath, 'utf8');
      const data = JSON.parse(raw);
      const res = evaluateDataset(data, { split: 'held_out' });
      assert.equal(res.split, 'held_out');
      assert.equal(res.totalEvaluated, 32);
      assert.equal(res.binary.precision, 1.0);
      assert.ok(res.binary.recall > 0.9);
      assert.ok(res.binary.f1 > 0.9);
    });
  });
});
