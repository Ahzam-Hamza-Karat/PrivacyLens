/**
 * PrivacyLens Policy Analysis Constants
 * Shared constants for backend validation, segmentation, and rule classification.
 */

export const MAX_POLICY_LENGTH = 50000;
export const MIN_POLICY_LENGTH = 10;

export const CATEGORIES = {
  DATA_COLLECTION: 'data_collection',
  DATA_SHARING: 'data_sharing',
  COOKIES_TRACKING: 'cookies_tracking',
  DATA_RETENTION: 'data_retention',
  USER_RIGHTS: 'user_rights',
};

export const CATEGORY_DEFINITIONS = {
  [CATEGORIES.DATA_COLLECTION]: {
    id: CATEGORIES.DATA_COLLECTION,
    name: 'Data Collection',
    shortName: 'Collection',
    description: 'Disclosures regarding types of personal data, device telemetry, and automated information collected.',
    notFoundNotice: 'The engine did not identify explicit data collection disclosures in the provided text. This does not guarantee that data is not collected.',
  },
  [CATEGORIES.DATA_SHARING]: {
    id: CATEGORIES.DATA_SHARING,
    name: 'Data Sharing & Third Parties',
    shortName: 'Sharing',
    description: 'Disclosures regarding third-party vendors, service providers, corporate transfers, and sales of personal data.',
    notFoundNotice: 'The engine did not identify disclosures concerning third-party sharing or data transfers in the provided text. Absence of detected text is not proof that sharing does not occur.',
  },
  [CATEGORIES.COOKIES_TRACKING]: {
    id: CATEGORIES.COOKIES_TRACKING,
    name: 'Cookies & Tracking',
    shortName: 'Tracking',
    description: 'Disclosures regarding cookies, web beacons, tracking pixels, analytics, and browser tracking controls.',
    notFoundNotice: 'The engine did not identify explicit disclosures regarding cookies or online tracking technologies in the provided text. This does not confirm that tracking technologies are absent.',
  },
  [CATEGORIES.DATA_RETENTION]: {
    id: CATEGORIES.DATA_RETENTION,
    name: 'Data Retention',
    shortName: 'Retention',
    description: 'Disclosures concerning how long data is retained, account closure deletion timelines, and storage duration criteria.',
    notFoundNotice: 'The engine did not identify disclosures specifying data retention durations or deletion schedules in the provided text. This does not prove that data is discarded immediately.',
  },
  [CATEGORIES.USER_RIGHTS]: {
    id: CATEGORIES.USER_RIGHTS,
    name: 'User Rights & Choices',
    shortName: 'Rights',
    description: 'Disclosures regarding consumer access, correction, deletion, opt-outs, and mechanisms to exercise privacy rights.',
    notFoundNotice: 'The engine did not identify disclosures describing user access, deletion, or privacy choice mechanisms in the provided text. This does not imply that statutory rights are unavailable.',
  },
};

export const STATUS = {
  FOUND: 'found',
  UNCLEAR: 'unclear',
  NOT_FOUND: 'not_found',
};

export const MATCH_STRENGTH = {
  STRONG: 'strong',
  POSSIBLE: 'possible',
  UNCLEAR: 'unclear',
};

export const MATCH_TYPE = {
  AFFIRMATIVE: 'affirmative',
  NEGATIVE_DISCLOSURE: 'negative_disclosure',
  CONDITIONAL: 'conditional',
  VAGUE: 'vague',
};

export const ENGINE_METADATA = {
  name: 'PrivacyLens Rule-Based Policy Analysis Engine',
  type: 'rule-based',
  version: '1.0.0',
};

export const GLOBAL_LIMITATIONS = [
  'Deterministic Rule-Based Engine: Analysis is performed via deterministic pattern matching and heuristic classification without artificial intelligence or machine learning interpretation.',
  'Informational Purpose Only: Findings highlight stated disclosures for user awareness and do not constitute formal legal counsel, compliance certifications, or regulatory guarantees.',
  'Absence is Not Proof: The absence of detected text in any category indicates that relevant patterns were not identified in the submitted text, not that the organization does not engage in that practice.',
  'Bounded Scope: Analysis is limited strictly to the text provided within the maximum limit of 50,000 characters and does not evaluate linked external policies or terms.',
];
