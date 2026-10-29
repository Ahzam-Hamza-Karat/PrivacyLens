import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePolicyInput } from '../src/services/policy/inputValidator.js';
import { normalizeForProcessing, normalizeSegment } from '../src/services/policy/textNormalizer.js';
import { segmentPolicyText } from '../src/services/policy/textSegmenter.js';
import { MAX_POLICY_LENGTH } from '../src/constants/policyConstants.js';

describe('Phase 3 — Policy Ingestion, Normalization, and Segmentation Test Suite', () => {
  describe('Input Validation Unit Tests', () => {
    it('should reject missing or null request body', () => {
      const res1 = validatePolicyInput(null);
      assert.equal(res1.isValid, false);
      assert.equal(res1.error?.statusCode, 400);

      const res2 = validatePolicyInput(undefined);
      assert.equal(res2.isValid, false);
      assert.equal(res2.error?.statusCode, 400);

      const res3 = validatePolicyInput('not an object');
      assert.equal(res3.isValid, false);
      assert.equal(res3.error?.statusCode, 400);

      const res4 = validatePolicyInput([]);
      assert.equal(res4.isValid, false);
      assert.equal(res4.error?.statusCode, 400);
    });

    it('should reject missing policyText property', () => {
      const res = validatePolicyInput({});
      assert.equal(res.isValid, false);
      assert.equal(res.error?.statusCode, 400);
      assert.match(res.error?.message, /Missing required field: "policyText"/);
    });

    it('should reject non-string policyText', () => {
      const invalidTypes = [12345, true, false, {}, ['text'], null];
      for (const val of invalidTypes) {
        const res = validatePolicyInput({ policyText: val });
        assert.equal(res.isValid, false);
        assert.equal(res.error?.statusCode, 400);
        assert.match(res.error?.message, /must be a string/);
      }
    });

    it('should reject empty or whitespace-only policyText', () => {
      const emptySamples = ['', '   ', '\n\n\t  \r\n'];
      for (const val of emptySamples) {
        const res = validatePolicyInput({ policyText: val });
        assert.equal(res.isValid, false);
        assert.equal(res.error?.statusCode, 400);
        assert.match(res.error?.message, /cannot be empty or whitespace-only/);
      }
    });

    it('should reject unexpected extra fields in request body', () => {
      const res = validatePolicyInput({ policyText: 'Valid policy text', extraParam: 123 });
      assert.equal(res.isValid, false);
      assert.equal(res.error?.statusCode, 400);
      assert.match(res.error?.message, /Unexpected fields in request body/);
    });

    it('should reject unsupported Content-Type if provided', () => {
      const res = validatePolicyInput({ policyText: 'Valid policy text' }, 'text/plain');
      assert.equal(res.isValid, false);
      assert.equal(res.error?.statusCode, 415);
      assert.match(res.error?.message, /Unsupported Content-Type/);
    });

    it('should accept application/json Content-Type', () => {
      const res = validatePolicyInput(
        { policyText: 'Valid policy text' },
        'application/json; charset=utf-8'
      );
      assert.equal(res.isValid, true);
      assert.equal(res.policyText, 'Valid policy text');
    });

    it('should accept text at exact 50,000 character limit', () => {
      const text50k = 'a'.repeat(MAX_POLICY_LENGTH);
      assert.equal(text50k.length, 50000);
      const res = validatePolicyInput({ policyText: text50k });
      assert.equal(res.isValid, true);
      assert.equal(res.policyText?.length, 50000);
    });

    it('should reject text exceeding 50,000 character limit (HTTP 413)', () => {
      const textOverLimit = 'a'.repeat(MAX_POLICY_LENGTH + 1);
      assert.equal(textOverLimit.length, 50001);
      const res = validatePolicyInput({ policyText: textOverLimit });
      assert.equal(res.isValid, false);
      assert.equal(res.error?.statusCode, 413);
      assert.match(res.error?.message, /exceeds the maximum allowed limit/);
    });
  });

  describe('Text Normalization Unit Tests', () => {
    it('should standardize CRLF and CR line endings to LF', () => {
      const input = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const output = normalizeForProcessing(input);
      assert.equal(output.includes('\r'), false);
      assert.equal(output, 'Line 1\nLine 2\nLine 3\nLine 4');
    });

    it('should convert non-breaking spaces and tabs into standard spaces', () => {
      const input = 'Word1\u00A0Word2\tWord3';
      const output = normalizeForProcessing(input);
      assert.equal(output, 'Word1 Word2 Word3');
    });

    it('should normalize smart quotes and unicode dashes', () => {
      const input = '“Acme’s terms” – section 1 — updated';
      const output = normalizeForProcessing(input);
      assert.equal(output, '"Acme\'s terms" - section 1 - updated');
    });

    it('should normalize unicode bullets into standard dashes', () => {
      const input = '• Item 1\n◦ Item 2\n▪ Item 3';
      const output = normalizeForProcessing(input);
      assert.match(output, /- Item 1/);
      assert.match(output, /- Item 2/);
      assert.match(output, /- Item 3/);
    });

    it('should never mutate original text or lowercase in place', () => {
      const original = 'We Collect Personal Information From Users.';
      const normalized = normalizeSegment(original);
      assert.equal(original, 'We Collect Personal Information From Users.');
      assert.equal(normalized, 'We Collect Personal Information From Users.');
    });
  });

  describe('Segmentation and Source Mapping Unit Tests', () => {
    it('should handle a single-paragraph document', () => {
      const policy = 'This is a single paragraph policy with one sentence.';
      const { paragraphs, segments } = segmentPolicyText(policy);

      assert.equal(paragraphs.length, 1);
      assert.equal(paragraphs[0].id, 'p-0');
      assert.equal(paragraphs[0].originalText, policy);
      assert.equal(segments.length, 1);
      assert.equal(segments[0].id, 's-0-0');
      assert.equal(segments[0].originalText, policy);
      assert.equal(policy.slice(segments[0].startOffset, segments[0].endOffset), segments[0].originalText);
    });

    it('should preserve multi-paragraph order and stable identifiers', () => {
      const policy = 'First paragraph clause.\n\nSecond paragraph clause.\n\nThird paragraph clause.';
      const { paragraphs, segments } = segmentPolicyText(policy);

      assert.equal(paragraphs.length, 3);
      assert.equal(paragraphs[0].id, 'p-0');
      assert.equal(paragraphs[1].id, 'p-1');
      assert.equal(paragraphs[2].id, 'p-2');

      assert.equal(segments.length, 3);
      assert.equal(segments[0].id, 's-0-0');
      assert.equal(segments[1].id, 's-1-0');
      assert.equal(segments[2].id, 's-2-0');

      // Verify exact offset slicing
      for (const seg of segments) {
        assert.equal(policy.slice(seg.startOffset, seg.endOffset), seg.originalText);
      }
    });

    it('should not split on common abbreviations (e.g., i.e., Inc., Co., vs.)', () => {
      const policy = 'Acme Inc. collects user information, e.g. email addresses and phone numbers. We do not sell data to third parties.';
      const { segments } = segmentPolicyText(policy);

      assert.equal(segments.length, 2);
      assert.match(segments[0].originalText, /Acme Inc\. collects user information, e\.g\. email addresses and phone numbers\./);
      assert.match(segments[1].originalText, /We do not sell data to third parties\./);

      // Verify offset fidelity
      for (const seg of segments) {
        assert.equal(policy.slice(seg.startOffset, seg.endOffset), seg.originalText);
      }
    });

    it('should protect decimal numbers and URLs from false sentence splits', () => {
      const policy = 'Retention period is 3.5 years. Visit https://example.com/privacy or email support@example.com for requests.';
      const { segments } = segmentPolicyText(policy);

      assert.equal(segments.length, 2);
      assert.equal(segments[0].originalText, 'Retention period is 3.5 years.');
      assert.match(segments[1].originalText, /https:\/\/example\.com\/privacy/);
    });

    it('should handle bulleted lists as distinct segment clauses', () => {
      const policy = `We collect the following personal details:
- Contact information: Name and email.
- Technical information: IP address and device ID.
- Payment details: Credit card number.`;

      const { segments } = segmentPolicyText(policy);
      assert.ok(segments.length >= 3);

      // Verify each bullet excerpt matches verbatim in source text
      for (const seg of segments) {
        assert.equal(policy.slice(seg.startOffset, seg.endOffset), seg.originalText);
      }
    });

    it('should preserve identical sentences with distinct stable identifiers', () => {
      const policy = 'We do not sell your personal data.\n\nWe do not sell your personal data.';
      const { segments } = segmentPolicyText(policy);

      assert.equal(segments.length, 2);
      assert.notEqual(segments[0].id, segments[1].id);
      assert.equal(segments[0].id, 's-0-0');
      assert.equal(segments[1].id, 's-1-0');
      assert.notEqual(segments[0].startOffset, segments[1].startOffset);
    });
  });
});
