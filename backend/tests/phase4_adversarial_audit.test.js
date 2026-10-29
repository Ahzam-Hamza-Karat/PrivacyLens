import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePolicyDocument } from '../src/services/analyzer/policyEngine.js';
import { RULES } from '../src/services/analyzer/ruleRegistry.js';

/**
 * Phase 4 Adversarial Rule Audit Test Suite
 *
 * Systematic 84-case audit across all 28 registered deterministic rules:
 * - Case 1: Canonical positive disclosure (must trigger target rule)
 * - Case 2: Borderline / phrasing variation (must trigger target rule)
 * - Case 3: Irrelevant / adversarial negative disclosure (must NOT trigger target rule)
 *
 * In addition, every detected finding must strictly satisfy:
 *   originalText.slice(startOffset, endOffset) === finding.evidence
 */
describe('Phase 4 — 28 Rules / 84 Cases Adversarial Audit', () => {
  const AUDIT_CASES = [
    // 1. COLLECT_DIRECT_CONTACT
    {
      ruleId: 'COLLECT_DIRECT_CONTACT',
      canonical: 'We collect your name, email address, and phone number when you register.',
      borderline: 'Users provide their contact information including postal address and telephone number upon checkout.',
      adversarial: 'The company name is Acme Corp and its office address is published in the phone directory.',
    },
    // 2. COLLECT_ACCOUNT_CREDENTIALS
    {
      ruleId: 'COLLECT_ACCOUNT_CREDENTIALS',
      canonical: 'We collect account credentials such as username and password.',
      borderline: 'When creating an account, you must select login credentials and a security PIN.',
      adversarial: 'Password hashing uses modern cryptography and salted SHA-256.',
    },
    // 3. COLLECT_BILLING_PAYMENT
    {
      ruleId: 'COLLECT_BILLING_PAYMENT',
      canonical: 'We collect payment card information and billing details for order processing.',
      borderline: 'Transactions require credit card number, expiration date, and billing address.',
      adversarial: 'Our corporate payment terms with suppliers require 30-day invoice settlement.',
    },
    // 4. COLLECT_DEVICE_TELEMETRY
    {
      ruleId: 'COLLECT_DEVICE_TELEMETRY',
      canonical: 'We automatically collect device telemetry: IP address and browser type.',
      borderline: 'Our systems log MAC addresses, operating system version, and unique device identifiers.',
      adversarial: 'An IP address consists of four numbers separated by dots.',
    },
    // 5. COLLECT_USAGE_ACTIVITY
    {
      ruleId: 'COLLECT_USAGE_ACTIVITY',
      canonical: 'We track pages visited, time spent per page, and clickstream patterns.',
      borderline: 'Your browsing history and interaction history within our application are recorded.',
      adversarial: 'The history of the internet began with ARPANET in the late twentieth century.',
    },
    // 6. COLLECT_LOCATION
    {
      ruleId: 'COLLECT_LOCATION',
      canonical: 'We collect your precise geolocation data when navigation services are active.',
      borderline: 'GPS coordinates and latitude and longitude are recorded during route tracking.',
      adversarial: 'Our corporate headquarters are located in Zurich, Switzerland.',
    },
    // 7. COLLECT_CONDITIONAL_RESTRICTION
    {
      ruleId: 'COLLECT_CONDITIONAL_RESTRICTION',
      canonical: 'We do not collect precise location data unless you enable the feature.',
      borderline: 'We do not collect biometric data unless you opt-in to the feature.',
      adversarial: 'The service is available only if you have an active internet connection.',
    },
    // 8. SHARE_SERVICE_PROVIDERS
    {
      ruleId: 'SHARE_SERVICE_PROVIDERS',
      canonical: 'We share information with service providers under confidentiality obligations.',
      borderline: 'Sub-processors and operational contractors receive data necessary to deliver hosting.',
      adversarial: 'We procure hardware from third-party vendors for our on-premises server racks.',
    },
    // 9. SHARE_NO_SELL
    {
      ruleId: 'SHARE_NO_SELL',
      canonical: 'We do not sell personal data to data brokers or third parties.',
      borderline: 'We will not sell your information to advertisers.',
      adversarial: 'We sell subscription licenses directly to enterprise customers.',
    },
    // 10. SHARE_SALE_AFFIRMATIVE
    {
      ruleId: 'SHARE_SALE_AFFIRMATIVE',
      canonical: 'We may sell your personal information to third parties for commercial advertising.',
      borderline: 'We share for monetary consideration with commercial data brokers.',
      adversarial: 'We do not sell your personal data under any circumstances.',
    },
    // 11. SHARE_LEGAL_COMPLIANCE
    {
      ruleId: 'SHARE_LEGAL_COMPLIANCE',
      canonical: 'We may disclose personal data to comply with a court order, warrant, or subpoena.',
      borderline: 'Information is released when legally required by law enforcement authorities.',
      adversarial: 'Our company complies with building safety laws and municipal fire regulations.',
    },
    // 12. SHARE_BUSINESS_TRANSFERS
    {
      ruleId: 'SHARE_BUSINESS_TRANSFERS',
      canonical: 'In the event of a merger, acquisition, or sale of assets, user data will be transferred.',
      borderline: 'Customer databases may be assigned in connection with corporate restructuring or bankruptcy.',
      adversarial: 'Merger and acquisition activity increased across the tech industry this quarter.',
    },
    // 13. SHARE_AFFILIATES
    {
      ruleId: 'SHARE_AFFILIATES',
      canonical: 'We share personal data with our corporate affiliates, parent companies, and subsidiaries.',
      borderline: 'Information is accessible across our corporate group for unified account management.',
      adversarial: 'Affiliate marketing is a popular strategy in digital retail businesses.',
    },
    // 14. COOKIE_FIRST_PARTY
    {
      ruleId: 'COOKIE_FIRST_PARTY',
      canonical: 'Our website uses cookies to maintain your authenticated session.',
      borderline: 'We store essential cookies in your browser to remember login status.',
      adversarial: 'Fresh cookies were baked for the holiday reception.',
    },
    // 15. COOKIE_TRACKING_BEACONS
    {
      ruleId: 'COOKIE_TRACKING_BEACONS',
      canonical: 'We employ tracking pixels and web beacons to count page visits.',
      borderline: 'Clear GIFs and pixel tags in emails measure message open rates.',
      adversarial: 'A pixel is the smallest controllable element of a digital picture represented on a screen.',
    },
    // 16. COOKIE_ANALYTICS
    {
      ruleId: 'COOKIE_ANALYTICS',
      canonical: 'We utilize Google Analytics to evaluate aggregated user traffic patterns.',
      borderline: 'Traffic analytics tools measure audience engagement across site sections.',
      adversarial: 'Data analytics is an important capability for modern business intelligence analysts.',
    },
    // 17. COOKIE_USER_CONTROLS
    {
      ruleId: 'COOKIE_USER_CONTROLS',
      canonical: 'You can manage cookie preferences and disable cookies in your browser settings.',
      borderline: 'Users may block tracking cookies through browser controls or cookie settings.',
      adversarial: 'You can adjust monitor brightness and screen settings using the display controls.',
    },
    // 18. COOKIE_NEGATIVE_DISCLOSURE
    {
      ruleId: 'COOKIE_NEGATIVE_DISCLOSURE',
      canonical: 'We do not employ third-party advertising trackers on our website.',
      borderline: 'We never use tracking pixels on our platform.',
      adversarial: 'We use advertising cookies to measure ad campaign performance across the web.',
    },
    // 19. RETENTION_SPECIFIC_PERIOD
    {
      ruleId: 'RETENTION_SPECIFIC_PERIOD',
      canonical: 'We delete personal data within thirty (30) days following account closure.',
      borderline: 'Audit records are retained for 12 months before being securely destroyed.',
      adversarial: 'Our support desk is open 24 hours a day, 7 days a week for customer inquiries.',
    },
    // 20. RETENTION_ACCOUNT_CLOSURE
    {
      ruleId: 'RETENTION_ACCOUNT_CLOSURE',
      canonical: 'We purge account data when you terminate or close your account.',
      borderline: 'When you close your account, we delete personal identifiers.',
      adversarial: 'The store closure at 9 PM requires employees to lock the front doors.',
    },
    // 21. RETENTION_VAGUE_DURATION
    {
      ruleId: 'RETENTION_VAGUE_DURATION',
      canonical: 'We retain personal information for as long as reasonably necessary to fulfill these purposes.',
      borderline: 'User data is kept for as long as deemed needed for legitimate business operations.',
      adversarial: 'It is necessary to maintain clean office spaces and sanitary kitchens.',
    },
    // 22. RETENTION_LEGAL_EXCEPTIONS
    {
      ruleId: 'RETENTION_LEGAL_EXCEPTIONS',
      canonical: 'We retain records where subject to legal retention obligations.',
      borderline: 'Deletion is deferred except where longer retention is mandated by law.',
      adversarial: 'Our lawyers provide legal advice regarding intellectual property patents.',
    },
    // 23. RIGHTS_ACCESS_REQUEST
    {
      ruleId: 'RIGHTS_ACCESS_REQUEST',
      canonical: 'You have the right to request access to your personal data.',
      borderline: 'Users can request access to their personal data by contacting us.',
      adversarial: 'Building access requires an employee security keycard badge.',
    },
    // 24. RIGHTS_CORRECTION_RECTIFICATION
    {
      ruleId: 'RIGHTS_CORRECTION_RECTIFICATION',
      canonical: 'You may request correction of inaccurate personal data.',
      borderline: 'Users can rectify their data in account settings.',
      adversarial: 'The correction of the typographical error in the marketing flyer took ten minutes.',
    },
    // 25. RIGHTS_DELETION_ERASURE
    {
      ruleId: 'RIGHTS_DELETION_ERASURE',
      canonical: 'You have the right to erasure of your personal data.',
      borderline: 'Users may request that we delete their personal information from our systems.',
      adversarial: 'Pressing the backspace key on your keyboard will delete unwanted text characters.',
    },
    // 26. RIGHTS_OPT_OUT_MARKETING
    {
      ruleId: 'RIGHTS_OPT_OUT_MARKETING',
      canonical: 'You can opt out of marketing communications via the unsubscribe link in emails.',
      borderline: 'Users can manage communication preferences in their account profile.',
      adversarial: 'Employees may opt in to the optional dental insurance program during open enrollment.',
    },
    // 27. RIGHTS_DATA_PORTABILITY
    {
      ruleId: 'RIGHTS_DATA_PORTABILITY',
      canonical: 'You may request your personal data in a structured, commonly used, and machine-readable format.',
      borderline: 'We provide data export in a portable, machine-readable format upon request.',
      adversarial: 'The portable battery charger has a compact format and lightweight design.',
    },
    // 28. RIGHTS_EXERCISE_CONTACT
    {
      ruleId: 'RIGHTS_EXERCISE_CONTACT',
      canonical: 'To exercise these rights, contact privacy@example.com.',
      borderline: 'Contact our privacy team to submit requests and we respond to verified requests within 30 days.',
      adversarial: 'For product sales and wholesale purchase quotes, contact sales@example.com.',
    },
  ];

  it('should verify audit case coverage for exactly 28 registered rules', () => {
    assert.equal(RULES.length, 28);
    assert.equal(AUDIT_CASES.length, 28);
    const registeredIds = new Set(RULES.map((r) => r.id));
    for (const ac of AUDIT_CASES) {
      assert.ok(registeredIds.has(ac.ruleId), `Rule ${ac.ruleId} must be registered in ruleRegistry.js`);
    }
  });

  for (const ac of AUDIT_CASES) {
    describe(`Rule Audit: ${ac.ruleId}`, () => {
      it(`Canonical case must detect ${ac.ruleId} and preserve offset slicing`, () => {
        const rep = analyzePolicyDocument(ac.canonical);
        const f = rep.findings.find((x) => x.ruleId === ac.ruleId);
        assert.ok(f, `Canonical text must detect ${ac.ruleId}: "${ac.canonical}"`);
        assert.equal(ac.canonical.slice(f.startOffset, f.endOffset), f.evidence);
      });

      it(`Borderline variation must detect ${ac.ruleId} and preserve offset slicing`, () => {
        const rep = analyzePolicyDocument(ac.borderline);
        const f = rep.findings.find((x) => x.ruleId === ac.ruleId);
        assert.ok(f, `Borderline text must detect ${ac.ruleId}: "${ac.borderline}"`);
        assert.equal(ac.borderline.slice(f.startOffset, f.endOffset), f.evidence);
      });

      it(`Adversarial/irrelevant case must NOT detect ${ac.ruleId}`, () => {
        const rep = analyzePolicyDocument(ac.adversarial);
        const f = rep.findings.find((x) => x.ruleId === ac.ruleId);
        assert.equal(f, undefined, `Adversarial text must NOT trigger ${ac.ruleId}: "${ac.adversarial}"`);
      });
    });
  }
});
