/**
 * Dataset Schema & Integrity Validator (Phase 2)
 *
 * Ensures dataset entries adhere to rigorous academic standards:
 * - Strict schema validation
 * - Valid category & status domain checking
 * - Explicit distinction between real-world and synthetic examples
 * - Verification of source URLs and retrieval dates for real-world excerpts
 * - Cross-split leakage detection (tuning vs held-out)
 */

import { CATEGORIES, STATUS } from '../constants/policyConstants.js';

export const VALID_CATEGORIES = new Set([...Object.values(CATEGORIES), null]);
export const VALID_STATUSES = new Set(Object.values(STATUS));
export const VALID_SPLITS = new Set(['tuning', 'held_out']);
export const VALID_ORIGINS = new Set(['real_world', 'synthetic_adversarial']);

/**
 * Validates a single dataset item.
 *
 * @param {any} item
 * @param {number} index
 * @returns {{ isValid: boolean, errors: Array<string> }}
 */
export function validateDatasetItem(item, index = 0) {
  const errors = [];

  if (!item || typeof item !== 'object') {
    return { isValid: false, errors: [`Item at index ${index} is not an object.`] };
  }

  // 1. ID check
  if (typeof item.id !== 'string' || item.id.trim().length === 0) {
    errors.push(`Item at index ${index} missing required 'id' string.`);
  }

  // 2. Text check
  if (typeof item.text !== 'string' || item.text.trim().length === 0) {
    errors.push(`Item ${item.id || index} missing required non-empty 'text'.`);
  }

  // 3. Expected Status check
  if (!VALID_STATUSES.has(item.expectedStatus)) {
    errors.push(
      `Item ${item.id || index} has invalid expectedStatus '${item.expectedStatus}'. Expected one of: ${[...VALID_STATUSES].join(', ')}.`
    );
  }

  // 4. Expected Category check
  if (item.expectedCategory !== null && !VALID_CATEGORIES.has(item.expectedCategory)) {
    errors.push(
      `Item ${item.id || index} has invalid expectedCategory '${item.expectedCategory}'. Expected one of: ${[...VALID_CATEGORIES].filter(Boolean).join(', ')} or null.`
    );
  }

  // 5. Split check
  if (!VALID_SPLITS.has(item.split)) {
    errors.push(
      `Item ${item.id || index} has invalid split '${item.split}'. Expected 'tuning' or 'held_out'.`
    );
  }

  // 6. Origin check
  if (!VALID_ORIGINS.has(item.origin)) {
    errors.push(
      `Item ${item.id || index} has invalid origin '${item.origin}'. Expected 'real_world' or 'synthetic_adversarial'.`
    );
  }

  // 7. Provenance requirements for real_world items
  if (item.origin === 'real_world') {
    if (typeof item.sourceUrl !== 'string' || item.sourceUrl.trim().length === 0) {
      errors.push(`Real-world item ${item.id || index} missing required 'sourceUrl'.`);
    }
    if (typeof item.retrievalDate !== 'string' || item.retrievalDate.trim().length === 0) {
      errors.push(`Real-world item ${item.id || index} missing required 'retrievalDate'.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an entire dataset collection and checks for cross-split data leakage.
 *
 * @param {Array<object>} dataset
 * @returns {{
 *   isValid: boolean,
 *   total: number,
 *   tuningCount: number,
 *   heldOutCount: number,
 *   errors: Array<string>,
 *   warnings: Array<string>
 * }}
 */
export function validateDataset(dataset) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(dataset) || dataset.length === 0) {
    return {
      isValid: false,
      total: 0,
      tuningCount: 0,
      heldOutCount: 0,
      errors: ['Dataset is empty or not an array.'],
      warnings: [],
    };
  }

  const seenIds = new Set();
  const tuningTexts = new Map();
  const heldOutTexts = new Map();

  let tuningCount = 0;
  let heldOutCount = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const itemResult = validateDatasetItem(item, i);
    if (!itemResult.isValid) {
      errors.push(...itemResult.errors);
      continue;
    }

    // Unique ID check
    if (seenIds.has(item.id)) {
      errors.push(`Duplicate ID detected: '${item.id}' at index ${i}.`);
    } else {
      seenIds.add(item.id);
    }

    const normalizedSnippet = item.text.trim().toLowerCase().replace(/\s+/g, ' ');

    if (item.split === 'tuning') {
      tuningCount++;
      tuningTexts.set(normalizedSnippet, item.id);
    } else if (item.split === 'held_out') {
      heldOutCount++;
      heldOutTexts.set(normalizedSnippet, item.id);
    }
  }

  // Cross-split leakage check: ensure no identical text appears in both splits
  for (const [snippet, tuningId] of tuningTexts.entries()) {
    if (heldOutTexts.has(snippet)) {
      const heldOutId = heldOutTexts.get(snippet);
      errors.push(
        `Cross-split data leakage detected! Identical text found in tuning item '${tuningId}' and held-out item '${heldOutId}'.`
      );
    }
  }

  if (tuningCount === 0) {
    warnings.push('Dataset contains 0 tuning items.');
  }
  if (heldOutCount === 0) {
    warnings.push('Dataset contains 0 held-out items.');
  }

  return {
    isValid: errors.length === 0,
    total: dataset.length,
    tuningCount,
    heldOutCount,
    errors,
    warnings,
  };
}

