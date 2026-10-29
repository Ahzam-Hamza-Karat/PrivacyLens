/**
 * Rules Catalogue & Evaluation Distribution Engine for PrivacyLens (Phase 3)
 *
 * Defines the complete registry of 28 deterministic privacy checks across 5 categories
 * and provides mathematical aggregation helpers for the Privacy Analysis Doughnut Chart.
 *
 * Invariant: Denominator is strictly 28 checks under all conditions.
 * Rounding: Percentages are computed as (count / 28) * 100, rounded to 1 decimal place.
 */

export const TOTAL_RULES_COUNT = 28;

export const RULES_CATALOGUE = [
  // 1. Data Collection (7 rules)
  {
    id: 'COLLECT_DIRECT_CONTACT',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Direct Contact Information Collection',
    description: 'Discloses collection of personal contact identifiers provided directly by users (e.g., name, email, phone, physical address).',
    limitation: 'Identifies standard contact field disclosures; does not verify whether additional unlisted fields are collected.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COLLECT_ACCOUNT_CREDENTIALS',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Account Credentials & Profile Data',
    description: 'Discloses collection and storage of user authentication credentials, usernames, or passwords.',
    limitation: 'Matches credential storage disclosures; does not assess cryptographic hashing standards or password strength.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COLLECT_BILLING_PAYMENT',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Payment & Financial Information Collection',
    description: 'Discloses collection of payment card information, billing addresses, or commercial transaction details.',
    limitation: 'Identifies payment disclosures; does not confirm PCI-DSS compliance or distinguish tokenized storage from direct server storage.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COLLECT_DEVICE_TELEMETRY',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Automated Device & Technical Telemetry',
    description: 'Discloses automated collection of device identifiers, IP addresses, operating system versions, or browser specifications.',
    limitation: 'Identifies technical telemetry collection disclosures; does not determine whether IP addresses are truncated or anonymized.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COLLECT_USAGE_ACTIVITY',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Platform Usage & Behavioral Activity',
    description: 'Discloses tracking of user navigation, page views, clickstream data, or feature interactions.',
    limitation: 'Matches usage tracking disclosures; does not determine whether activity is linked to real-name identity or aggregated.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'possible',
  },
  {
    id: 'COLLECT_LOCATION',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Location Information Collection',
    description: 'Discloses collection of geographic location data, whether derived from IP address or device GPS.',
    limitation: 'Matches location disclosures; does not distinguish coarse regional location from high-precision coordinates unless explicitly stated.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COLLECT_CONDITIONAL_RESTRICTION',
    category: 'data_collection',
    categoryName: 'Data Collection',
    title: 'Conditional Data Collection Restriction',
    description: 'Discloses that certain data collection is restricted unless specific user consent, feature activation, or permission is granted.',
    limitation: 'Identifies conditional collection commitments; does not independently verify default system settings in software.',
    expectedMatchType: 'conditional',
    defaultStrength: 'strong',
  },

  // 2. Data Sharing (6 rules)
  {
    id: 'SHARE_SERVICE_PROVIDERS',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Disclosures to Third-Party Service Providers',
    description: 'Discloses transmission of personal data to third-party contractors, infrastructure vendors, or operational processors.',
    limitation: 'Matches vendor sharing disclosures; does not audit vendor contractual terms or list all specific sub-processors.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'SHARE_NO_SELL',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Affirmative Commitment Not to Sell Data',
    description: 'Discloses an explicit commitment that the organization does not sell personal data to data brokers or commercial third parties.',
    limitation: 'Reflects self-stated organizational commitments in policy text; does not constitute an independent forensic verification of practices.',
    expectedMatchType: 'negative_disclosure',
    defaultStrength: 'strong',
  },
  {
    id: 'SHARE_SALE_AFFIRMATIVE',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Commercial Sale or Exchange of Data',
    description: 'Discloses that personal information may be sold, rented, or transferred commercially to third parties.',
    limitation: 'Matches affirmative sale disclosures; excludes policies that affirmatively pledge not to sell.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'SHARE_LEGAL_COMPLIANCE',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Disclosures Required by Law & Regulatory Mandates',
    description: 'Discloses that data may be shared in response to subpoenas, warrants, regulatory requests, or legal processes.',
    limitation: 'Standard legal disclosure; presence does not indicate whether the company challenges or complies automatically with requests.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'SHARE_BUSINESS_TRANSFERS',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Corporate Transfers & Business Transactions',
    description: 'Discloses data transfer in connection with mergers, acquisitions, bankruptcy, or asset sales.',
    limitation: 'Matches standard corporate transaction terms; does not assess user notice provisions upon future asset transfer.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'SHARE_AFFILIATES',
    category: 'data_sharing',
    categoryName: 'Data Sharing & Third Parties',
    title: 'Intra-Group Sharing with Corporate Affiliates',
    description: 'Discloses sharing of personal data among corporate subsidiaries, parent companies, or affiliated business entities.',
    limitation: 'Matches intra-corporate sharing disclosures; does not determine legal boundaries between distinct corporate subsidiaries.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'possible',
  },

  // 3. Cookies & Tracking (5 rules)
  {
    id: 'COOKIE_FIRST_PARTY',
    category: 'cookies_tracking',
    categoryName: 'Cookies & Tracking',
    title: 'First-Party Cookies & Essential Session Management',
    description: 'Discloses use of cookies for authentication, session continuity, or basic platform functionality.',
    limitation: 'Matches cookie disclosures; does not perform technical inspection of browser storage expiration or security flags.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COOKIE_TRACKING_BEACONS',
    category: 'cookies_tracking',
    categoryName: 'Cookies & Tracking',
    title: 'Web Beacons & Local Storage Technologies',
    description: 'Discloses use of tracking pixels, web beacons, or HTML5 local storage technologies.',
    limitation: 'Identifies tracking beacon disclosures; does not verify server-side tracking mechanisms or browser fingerprinting.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COOKIE_ANALYTICS',
    category: 'cookies_tracking',
    categoryName: 'Cookies & Tracking',
    title: 'Aggregated Traffic & Platform Analytics',
    description: 'Discloses use of tracking technologies for audience measurement, usage analytics, or error diagnostics.',
    limitation: 'Matches analytics disclosures; does not evaluate whether analytics data is pseudonymized or shared with third-party ad networks.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COOKIE_USER_CONTROLS',
    category: 'cookies_tracking',
    categoryName: 'Cookies & Tracking',
    title: 'Cookie Configuration & Browser Opt-Out Controls',
    description: 'Discloses mechanisms for users to configure, reject, or delete cookies via browser settings or consent banners.',
    limitation: 'Matches documented control options; does not test effectiveness of consent management platforms or opt-out signals.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'COOKIE_NEGATIVE_DISCLOSURE',
    category: 'cookies_tracking',
    categoryName: 'Cookies & Tracking',
    title: 'Commitment Not to Use Advertising Trackers',
    description: 'Discloses an explicit organizational commitment not to use advertising, cross-site, or behavioral tracking cookies.',
    limitation: 'Reflects self-stated commitments in policy text; does not conduct real-time network inspection of tracking scripts.',
    expectedMatchType: 'negative_disclosure',
    defaultStrength: 'strong',
  },

  // 4. Data Retention (4 rules)
  {
    id: 'RETENTION_SPECIFIC_PERIOD',
    category: 'data_retention',
    categoryName: 'Data Retention Periods',
    title: 'Specified Data Retention or Deletion Timeframe',
    description: 'Discloses a concrete, identifiable retention timeline or scheduled deletion period (e.g., days, months, years).',
    limitation: 'Matches stated numerical or calendar timeframes; does not verify automated backend database deletion schedules.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RETENTION_ACCOUNT_CLOSURE',
    category: 'data_retention',
    categoryName: 'Data Retention Periods',
    title: 'Account Closure & Termination Deletion Policy',
    description: 'Discloses what happens to personal data upon account termination or user-requested closure.',
    limitation: 'Matches account closure terms; does not confirm whether residual backup copies are purged synchronously or on archive schedules.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RETENTION_VAGUE_DURATION',
    category: 'data_retention',
    categoryName: 'Data Retention Periods',
    title: 'Indefinite or Discretionary Retention Period',
    description: 'Discloses that data is retained "as long as necessary," "for business purposes," or at organizational discretion.',
    limitation: 'Highlights open-ended retention statements; flags discretionary phrasing that leaves operational duration undefined.',
    expectedMatchType: 'vague',
    defaultStrength: 'possible',
  },
  {
    id: 'RETENTION_LEGAL_EXCEPTIONS',
    category: 'data_retention',
    categoryName: 'Data Retention Periods',
    title: 'Statutory & Regulatory Retention Exceptions',
    description: 'Discloses that data may be retained beyond standard periods to satisfy tax, audit, statutory, or regulatory requirements.',
    limitation: 'Standard retention caveat; does not enumerate specific statutory limitation periods applicable across jurisdictions.',
    expectedMatchType: 'conditional',
    defaultStrength: 'strong',
  },

  // 5. User Rights (6 rules)
  {
    id: 'RIGHTS_ACCESS_REQUEST',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Right to Access Personal Information',
    description: 'Discloses user entitlement to request confirmation of data held or obtain copies of personal records.',
    limitation: 'Matches documented access rights; does not evaluate portal request usability or identity verification requirements.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RIGHTS_CORRECTION_RECTIFICATION',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Right to Rectify & Correct Inaccurate Data',
    description: 'Discloses user entitlement to update, modify, or correct inaccurate or incomplete personal records.',
    limitation: 'Matches rectification terms; does not assess self-service profile editor availability.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RIGHTS_DELETION_ERASURE',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Right to Deletion & Erasure ("Right to Be Forgotten")',
    description: 'Discloses user entitlement to request erasure, purge, or deletion of personal data.',
    limitation: 'Matches erasure disclosures; does not assess statutory exemptions or technical feasibility of complete anonymization.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RIGHTS_OPT_OUT_MARKETING',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Right to Opt Out of Direct Marketing',
    description: 'Discloses user entitlement to unsubscribe from marketing emails, promotional alerts, or commercial newsletters.',
    limitation: 'Matches marketing opt-out provisions; does not inspect transactional communication frequency or header opt-out links.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RIGHTS_DATA_PORTABILITY',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Right to Data Portability',
    description: 'Discloses user entitlement to receive personal data in a structured, commonly used, machine-readable format.',
    limitation: 'Matches portability commitments; does not verify export file formats (e.g., JSON, CSV) or download rate limits.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
  {
    id: 'RIGHTS_EXERCISE_CONTACT',
    category: 'user_rights',
    categoryName: 'User Rights & Choices',
    title: 'Rights Exercise Mechanism & Response Timelines',
    description: 'Discloses designated contact channels (e.g., privacy email, DPO address, web form) and response timeframes.',
    limitation: 'Matches contact channel information; does not test mailbox deliverability or response time compliance.',
    expectedMatchType: 'affirmative',
    defaultStrength: 'strong',
  },
];

/**
 * Status constants for check outcomes
 */
export const CHECK_STATUS = {
  FOUND: 'found',
  UNCLEAR: 'unclear',
  NOT_DETECTED: 'not_found',
  PENDING: 'pending',
};

export const CHECK_STATUS_LABELS = {
  [CHECK_STATUS.FOUND]: 'Found',
  [CHECK_STATUS.UNCLEAR]: 'Unclear',
  [CHECK_STATUS.NOT_DETECTED]: 'Not Detected',
  [CHECK_STATUS.PENDING]: 'Pending Analysis',
};

/**
 * Computes the distribution of outcomes across all 28 deterministic rules from an analysis findings array.
 *
 * Invariant: Denominator is strictly 28 checks for completed analyses.
 *
 * @param {Array<object>} [findings=[]] - Array of findings from analyzePolicyDocument
 * @param {object} [options={}] - Execution options
 * @param {boolean} [options.hasAnalyzed=true] - Whether an analysis was actually performed
 * @returns {{
 *   denominator: number,
 *   hasAnalyzed: boolean,
 *   counts: { found: number, unclear: number, not_found: number, total: number },
 *   percentages: { found: number, unclear: number, not_found: number },
 *   percentageStrings: { found: string, unclear: string, not_found: string },
 *   evaluatedRules: Array<{
 *     id: string,
 *     category: string,
 *     categoryName: string,
 *     title: string,
 *     description: string,
 *     limitation: string,
 *     status: 'found' | 'unclear' | 'not_found' | 'pending',
 *     statusLabel: string,
 *     matchCount: number,
 *     matchedFindings: Array<object>,
 *     evidenceExcerpt: string | null
 *   }>,
 *   isEmpty: boolean
 * }}
 */
export function computeRuleDistribution(findings = [], options = {}) {
  const { hasAnalyzed = true } = options;
  const safeFindings = Array.isArray(findings) ? findings : [];
  const denominator = TOTAL_RULES_COUNT; // Strictly 28 checks

  // If no analysis has been performed, represent rules as Pending rather than evaluated as Not Detected
  if (!hasAnalyzed) {
    const pendingRules = RULES_CATALOGUE.map((rule) => ({
      id: rule.id,
      category: rule.category,
      categoryName: rule.categoryName,
      title: rule.title,
      description: rule.description,
      limitation: rule.limitation,
      status: CHECK_STATUS.PENDING,
      statusLabel: CHECK_STATUS_LABELS[CHECK_STATUS.PENDING],
      matchCount: 0,
      matchedFindings: [],
      evidenceExcerpt: null,
    }));

    return {
      denominator,
      hasAnalyzed: false,
      counts: {
        found: 0,
        unclear: 0,
        not_found: 0,
        total: denominator,
      },
      percentages: {
        found: 0,
        unclear: 0,
        not_found: 0,
      },
      percentageStrings: {
        found: '0.0%',
        unclear: '0.0%',
        not_found: '0.0%',
      },
      evaluatedRules: pendingRules,
      isEmpty: true,
    };
  }

  let foundCount = 0;
  let unclearCount = 0;
  let notDetectedCount = 0;

  const evaluatedRules = RULES_CATALOGUE.map((rule) => {
    const matched = safeFindings.filter((f) => f && f.ruleId === rule.id);

    let status = CHECK_STATUS.NOT_DETECTED;
    let evidenceExcerpt = null;

    if (matched.length > 0) {
      // Check if all matched findings are vague or unclear
      const isAllUnclear = matched.every(
        (f) => f.matchStrength === 'unclear' || f.matchType === 'vague'
      );

      if (isAllUnclear) {
        status = CHECK_STATUS.UNCLEAR;
        unclearCount++;
      } else {
        status = CHECK_STATUS.FOUND;
        foundCount++;
      }

      // Collect concise evidence excerpt
      const excerpts = matched.map((m) => m.evidence).filter(Boolean);
      evidenceExcerpt = excerpts.length > 0 ? excerpts[0] : null;
    } else {
      status = CHECK_STATUS.NOT_DETECTED;
      notDetectedCount++;
    }

    return {
      id: rule.id,
      category: rule.category,
      categoryName: rule.categoryName,
      title: rule.title,
      description: rule.description,
      limitation: rule.limitation,
      status,
      statusLabel: CHECK_STATUS_LABELS[status],
      matchCount: matched.length,
      matchedFindings: matched,
      evidenceExcerpt,
    };
  });

  // Calculate percentages rounded to 1 decimal place
  const pctFound = Number(((foundCount / denominator) * 100).toFixed(1));
  const pctUnclear = Number(((unclearCount / denominator) * 100).toFixed(1));
  const pctNotDetected = Number(((notDetectedCount / denominator) * 100).toFixed(1));

  return {
    denominator,
    hasAnalyzed: true,
    counts: {
      found: foundCount,
      unclear: unclearCount,
      not_found: notDetectedCount,
      total: denominator,
    },
    percentages: {
      found: pctFound,
      unclear: pctUnclear,
      not_found: pctNotDetected,
    },
    percentageStrings: {
      found: `${pctFound.toFixed(1)}%`,
      unclear: `${pctUnclear.toFixed(1)}%`,
      not_found: `${pctNotDetected.toFixed(1)}%`,
    },
    evaluatedRules,
    isEmpty: safeFindings.length === 0,
  };
}

