/**
 * Application constants for PrivacyLens Frontend
 */

export const MAX_POLICY_LENGTH = 50000;
export const WARNING_POLICY_LENGTH = 45000;

/**
 * Realistic fictional sample privacy policy for testing and demonstration.
 * Labeled clearly as synthetic demonstration content.
 */
export const SAMPLE_POLICY = `PRIVACY POLICY (SAMPLE DEMONSTRATION DOCUMENT)
Last Updated: January 15, 2026
Entity: Acme Digital Services Inc. ("Acme", "we", "our")

1. INTRODUCTION
This Sample Privacy Policy illustrates how Acme Digital Services Inc. handles personal data. This document is provided solely for interface testing and demonstration purposes within PrivacyLens.

2. INFORMATION WE COLLECT
We collect information you provide directly to us when you create an account, update your profile, or communicate with customer support:
- Contact information: Name, email address, phone number, and postal address.
- Account credentials: Username and encrypted passwords.
- Billing information: Payment card details and transaction history, processed via third-party PCI-DSS compliant payment gateways.

We also automatically collect device and usage information when you navigate our platform:
- Technical data: IP address, browser type, operating system version, and unique device identifiers.
- Usage telemetry: Pages visited, time spent per page, clickstream patterns, and referring URLs.

3. COOKIES AND TRACKING TECHNOLOGIES
We utilize first-party and third-party cookies, web beacons, and local storage mechanisms to:
- Maintain your authenticated session across visits.
- Remember user interface preferences and locale configurations.
- Measure aggregated traffic analytics and user engagement.
You can adjust cookie settings via your browser preferences. Disabling essential cookies may impair core platform features.

4. HOW WE SHARE YOUR INFORMATION
We do not sell your personal data to data brokers. We may share data under the following circumstances:
- Service Providers: Cloud infrastructure hosting (AWS), customer support software, and email delivery vendors under strict confidentiality obligations.
- Legal Compliance: When required by subpoena, court order, or applicable statutory mandates.
- Business Transfers: In connection with any merger, sale of company assets, or financing transaction.

5. DATA RETENTION
We retain your personal data for as long as your account remains active or as needed to provide you with services. If you request account closure, we delete or anonymize personal identifiers within ninety (90) days, except where longer retention is mandated by legal, tax, or regulatory obligations.

6. YOUR RIGHTS AND CHOICES
Depending on your jurisdiction (such as GDPR in the EU or CCPA/CPRA in California), you may have the following rights:
- Access: Request a copy of the personal data we hold about you.
- Correction: Request correction of inaccurate or incomplete personal information.
- Deletion: Request erasure of your personal data, subject to lawful exceptions.
- Opt-Out: Opt out of marketing communications at any time via the unsubscribe link in emails.

To exercise these rights, contact privacy@acme-example.com. We respond to verified requests within thirty (30) days.

7. SECURITY
We implement industry-standard administrative, physical, and technical safeguards, including TLS encryption in transit and AES-256 encryption at rest, designed to protect your personal data against unauthorized access.`;

/**
 * Demonstration report categories and preview findings
 * Labeled explicitly as illustrative demonstration content for Phase 2 UI preview.
 */
export const DEMO_REPORT_CATEGORIES = [
  {
    id: 'collection',
    title: 'Data Collection',
    category: 'Information Ingested',
    status: 'Disclosed',
    summary: 'Identifies explicit collection of contact info, account credentials, and automated device telemetry.',
    evidence: 'Section 2 specifies direct collection (name, email, phone, billing) and automated collection (IP address, browser type, device identifiers).',
    concerns: 'Device identifiers and telemetry are collected automatically upon navigation.',
  },
  {
    id: 'sharing',
    title: 'Data Sharing & Third Parties',
    category: 'Third-Party Disclosures',
    status: 'Disclosed with Limits',
    summary: 'Explicitly states data is not sold to data brokers; shared with infrastructure and payment vendors.',
    evidence: 'Section 4 notes sharing with cloud infrastructure hosting, customer support, and payment processors under confidentiality.',
    concerns: 'Broad category of "service providers" without naming specific sub-processors.',
  },
  {
    id: 'cookies',
    title: 'Cookies & Tracking',
    category: 'Browser Tracking',
    status: 'Disclosed',
    summary: 'Discloses first-party and third-party cookies for session management and aggregate analytics.',
    evidence: 'Section 3 confirms use of cookies, web beacons, and local storage with browser-level opt-out mechanisms.',
    concerns: 'Third-party analytics partners are mentioned without listing individual tracking domains.',
  },
  {
    id: 'retention',
    title: 'Data Retention Periods',
    category: 'Storage Duration',
    status: 'Partially Disclosed',
    summary: 'Specifies 90-day deletion/anonymization timeline following account termination.',
    evidence: 'Section 5 establishes: "we delete or anonymize personal identifiers within ninety (90) days" following account closure.',
    concerns: 'Does not state specific retention periods for logs and telemetry collected from non-registered visitors.',
  },
  {
    id: 'rights',
    title: 'User Rights & Choices',
    category: 'Consumer Control',
    status: 'Comprehensive',
    summary: 'Outlines standard access, correction, erasure, and marketing opt-out rights with a 30-day response window.',
    evidence: 'Section 6 details access, correction, deletion, and marketing opt-outs with contact address and 30-day timeline.',
    concerns: 'Requires email verification before requests are fulfilled.',
  },
];

/**
 * Example questions for the future chatbot assistant
 */
export const SUGGESTED_CHAT_QUESTIONS = [
  'What personal data does this policy say it collects?',
  'Does the policy disclose whether data is shared with third parties?',
  'How long does this company retain personal data after account deletion?',
  'What specific choices and rights do users have under this policy?',
  'Does this policy mention cookies or automated tracking technologies?',
];
