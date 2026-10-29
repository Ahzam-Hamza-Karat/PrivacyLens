import {
  CATEGORIES,
  MATCH_STRENGTH,
  MATCH_TYPE,
} from '../../constants/policyConstants.js';

/**
 * Rule Registry for Deterministic Policy Analysis
 * Each rule defines explicit positive match patterns, negative disqualifiers,
 * match strength, limitation notes, and semantic context interpretation.
 */
export const RULES = [
  // ==========================================
  // CATEGORY A: DATA COLLECTION
  // ==========================================
  {
    id: 'COLLECT_DIRECT_CONTACT',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Direct Contact Information Collection',
    description: 'Discloses collection of personal contact identifiers provided directly by users (e.g., name, email, phone, physical address).',
    positivePatterns: [
      /\b(?:contact\s+information|postal\s+address|mailing\s+address)\b/i,
      /\b(?:your|user|full|first|last)\s+name\b/i,
      /\b(?:first\s+and\s+last\s+name|first\s+name,\s+last\s+name)\b/i,
      /\buser's\s+name\b/i,
      /\bname,\s*(?:email|phone|postal|mailing|address)\b/i,
      /\b(?:email\s+addresses?|phone\s+numbers?)\b/i,
      /\b(?:information\s+you\s+provide\s+directly|when\s+you\s+(?:create\s+an\s+account|register|contact\s+us))\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+collect|never\s+collect)\b/i,
      /\b(?:company\s+name|brand\s+name|domain\s+name|in\s+the\s+name\s+of)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies standard contact field disclosures; does not verify whether additional unlisted fields are collected.',
  },
  {
    id: 'COLLECT_ACCOUNT_CREDENTIALS',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Account Credentials & Profile Data',
    description: 'Discloses collection and storage of user authentication details, usernames, passwords, or profile credentials.',
    positivePatterns: [
      /\b(?:account\s+credentials|login\s+credentials|login\s+information|authentication\s+details)\b/i,
      /\b(?:usernames?\s+(?:and|or)\s+passwords?|(?:your|user|account)\s+passwords?|choose\s+a\s+password)\b/i,
      /\b(?:profile\s+information|account\s+registration\s+details)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+collect|never\s+collect)\b/i,
      /\bpassword\s+hashing\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies declared credential collection; encryption and security practices are evaluated separately.',
  },
  {
    id: 'COLLECT_BILLING_PAYMENT',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Payment & Financial Information Collection',
    description: 'Discloses collection of payment card data, billing addresses, or commercial transaction history.',
    positivePatterns: [
      /\b(?:payment\s+card|credit\s+card|debit\s+card|billing\s+information|billing\s+address|transaction\s+history|financial\s+information)\b/i,
      /\b(?:pci-dss|payment\s+gateways?)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+collect|do\s+not\s+store\s+credit\s+card)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies financial disclosure clauses; third-party processor handoff may govern actual storage.',
  },
  {
    id: 'COLLECT_DEVICE_TELEMETRY',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Automated Device & Technical Telemetry',
    description: 'Discloses automated collection of hardware, network, and system telemetry such as IP address, browser type, and device identifiers.',
    positivePatterns: [
      /\b(?:unique\s+device\s+identifiers?|device\s+identifiers?|mac\s+address|hardware\s+model)\b/i,
      /\bip\s+address(?:es)?(?:\s*(?:,|and)\s*(?:browser\s+type|operating\s+system|device|system\s+information))\b/i,
      /\b(?:automatically\s+collect(?:ed)?|we\s+(?:automatically\s+)?collect|server\s+logs?)\s+(?:[a-z\s]{0,20})?(?:technical\s+data|ip\s+address|device\s+(?:telemetry|id|identifier)|telemetry|browser\s+type)\b/i,
      /\b(?:technical\s+data|usage\s+telemetry|telemetry\s+data|device\s+telemetry)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+collect\s+ip|never\s+log\s+ip)\b/i,
      /\b(?:consists\s+of|definition\s+of|is\s+defined\s+as)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Reflects disclosed device telemetry; passive network-level logging may occur beyond documented items.',
  },
  {
    id: 'COLLECT_USAGE_ACTIVITY',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Platform Usage & Behavioral Activity',
    description: 'Discloses monitoring of on-platform user behavior, including pages viewed, clickstream data, search queries, and session duration.',
    positivePatterns: [
      /\b(?:pages\s+visited|time\s+spent|clickstream(?:\s+patterns)?|referring\s+urls?|browsing\s+(?:history|activity)|search\s+queries)\b/i,
      /\b(?:when\s+you\s+navigate\s+our\s+platform|usage\s+data)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.POSSIBLE,
    limitation: 'Detects stated behavioral telemetry disclosures without measuring session recording granularity.',
  },
  {
    id: 'COLLECT_LOCATION',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Location Information Collection',
    description: 'Discloses collection of user physical location, GPS coordinates, or IP-derived geographical data.',
    positivePatterns: [
      /\b(?:geolocation|gps|precise\s+location|approximate\s+location|location\s+information|location\s+data)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+collect\s+precise\s+location|never\s+track\s+location)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Distinguishes between general regional location from IP addresses and precise GPS sensor coordinates.',
  },
  {
    id: 'COLLECT_CONDITIONAL_RESTRICTION',
    category: CATEGORIES.DATA_COLLECTION,
    title: 'Conditional Data Collection Restriction',
    description: 'Discloses conditional limitations or opt-in requirements for specific data collection categories (e.g., location or biometric data).',
    positivePatterns: [
      /\b(?:do\s+not\s+collect\s+(?:precise\s+location|sensitive|biometric)|only\s+with\s+your\s+(?:express\s+)?consent)\b/i,
      /\b(?:unless\s+you\s+(?:enable|opt-in|choose\s+to\s+provide))\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.CONDITIONAL,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Reflects conditional exemptions disclosed in the text; depends on individual user configuration.',
  },

  // ==========================================
  // CATEGORY B: DATA SHARING & THIRD PARTIES
  // ==========================================
  {
    id: 'SHARE_SERVICE_PROVIDERS',
    category: CATEGORIES.DATA_SHARING,
    title: 'Disclosures to Third-Party Service Providers',
    description: 'Discloses sharing of personal information with operational service providers, cloud infrastructure, or customer support vendors.',
    positivePatterns: [
      /\b(?:service\s+providers?|sub-processors?|third-party\s+contractors?)\b/i,
      /\b(?:third-party\s+vendors?|vendors?\s+under\s+(?:strict\s+)?confidentiality)\b/i,
      /\b(?:share|disclose|transfer|provide)\s+(?:personal\s+)?(?:data|information)\s+(?:with|to)\s+(?:our\s+)?(?:vendors?|processors?|contractors?)\b/i,
      /\b(?:cloud\s+infrastructure|hosting(?:\s+providers?)?|email\s+delivery|customer\s+support\s+software)\b/i,
      /\b(?:under\s+strict\s+confidentiality|confidentiality\s+obligations?)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+(?:share|disclose)\s+(?:with|to)\s+(?:service\s+providers|third\s+parties)|never\s+share\s+with\s+service\s+providers)\b/i,
      /\b(?:vendor\s+market|procure\s+hardware|office\s+leases?)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Discloses that vendors receive data; policies rarely enumerate all specific third-party companies by name.',
  },
  {
    id: 'SHARE_NO_SELL',
    category: CATEGORIES.DATA_SHARING,
    title: 'Affirmative Commitment Not to Sell Data',
    description: 'Explicit disclosure stating that the organization does not sell personal information to data brokers or third parties.',
    positivePatterns: [
      /\b(?:do\s+not\s+sell|does\s+not\s+sell|never\s+sell|will\s+not\s+sell|not\s+sell)\s+(?:it|them|(?:your\s+)?(?:such\s+)?(?:personal\s+)?(?:data|information))\b/i,
      /\b(?:not\s+sell\s+(?:your\s+)?personal\s+(?:data|information)\s+to\s+data\s+brokers)\b/i,
      /\b(?:we\s+do\s+not\s+rent\s+or\s+sell)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.NEGATIVE_DISCLOSURE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies an explicit textual declaration against selling data; does not audit commercial data exchange practices.',
  },
  {
    id: 'SHARE_SALE_AFFIRMATIVE',
    category: CATEGORIES.DATA_SHARING,
    title: 'Commercial Sale or Exchange of Data',
    description: 'Discloses that personal information may be sold, rented, or transferred commercially to third parties.',
    positivePatterns: [
      /\b(?:we\s+(?:may\s+)?sell\s+(?:your\s+)?personal\s+(?:information|data))\b/i,
      /\b(?:share\s+for\s+(?:monetary|commercial)\s+consideration|data\s+brokers?)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+sell|never\s+sell|will\s+not\s+sell|not\s+in\s+the\s+business\s+of\s+selling)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Matches affirmative sale disclosures; excludes policies that affirmatively pledge not to sell.',
  },
  {
    id: 'SHARE_LEGAL_COMPLIANCE',
    category: CATEGORIES.DATA_SHARING,
    title: 'Disclosures Required by Law & Regulatory Mandates',
    description: 'Discloses sharing of user data in response to subpoenas, court orders, warrants, or statutory enforcement requests.',
    positivePatterns: [
      /\b(?:subpoena|court\s+order|warrant|statutory\s+mandates?|applicable\s+law|legal\s+compliance|law\s+enforcement)\b/i,
      /\b(?:when\s+required\s+by\s+law|comply\s+with\s+(?:a\s+)?legal\s+obligation)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Represents standard statutory disclosure clauses common across modern terms.',
  },
  {
    id: 'SHARE_BUSINESS_TRANSFERS',
    category: CATEGORIES.DATA_SHARING,
    title: 'Corporate Transfers & Business Transactions',
    description: 'Discloses that personal data may be transferred in connection with a corporate merger, acquisition, financing, or sale of assets.',
    positivePatterns: [
      /\b(?:business\s+transfers?|financing\s+transaction|bankruptcy)\b/i,
      /\b(?:in\s+connection\s+with|in\s+the\s+event\s+of)\s+(?:any\s+)?(?:merger|acquisition|sale\s+of\s+(?:company\s+)?assets)\b/i,
      /\b(?:merger,\s+acquisition,\s+or\s+sale\s+of\s+assets)\b/i,
      /\b(?:transfer|disclose)\s+(?:personal\s+)?(?:data|information|assets)\s+(?:during|in)\s+(?:a\s+)?(?:merger|acquisition)\b/i,
    ],
    negativePatterns: [
      /\bmerger\s+and\s+acquisition\s+activity\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Discloses asset transfer conditions; user rights following an acquisition are governed by successor policies.',
  },
  {
    id: 'SHARE_AFFILIATES',
    category: CATEGORIES.DATA_SHARING,
    title: 'Intra-Group Sharing with Corporate Affiliates',
    description: 'Discloses data sharing across parent companies, subsidiaries, sister brands, and affiliated corporate entities.',
    positivePatterns: [
      /\b(?:corporate\s+affiliates?|sister\s+companies|parent\s+company|corporate\s+group)\b/i,
      /\b(?:share|disclose|transfer)\s+(?:personal\s+)?(?:data|information)?\s+(?:with|to)\s+(?:our\s+)?(?:affiliates|subsidiaries)\b/i,
      /\b(?:subsidiaries\s+and\s+affiliates|affiliates\s+and\s+subsidiaries)\b/i,
      /\bwithin\s+our\s+family\s+of\s+companies\b/i,
    ],
    negativePatterns: [
      /\baffiliate\s+(?:marketing|program|links?|networks?)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.POSSIBLE,
    limitation: 'Identifies corporate group sharing; affiliated entities may operate in diverse jurisdictions.',
  },

  // ==========================================
  // CATEGORY C: COOKIES & TRACKING
  // ==========================================
  {
    id: 'COOKIE_FIRST_PARTY',
    category: CATEGORIES.COOKIES_TRACKING,
    title: 'First-Party Cookies & Essential Session Management',
    description: 'Discloses utilization of cookies and local storage to maintain authenticated user sessions and remember interface preferences.',
    positivePatterns: [
      /\b(?:first-party\s+cookies?|session\s+cookies?|maintain\s+your\s+authenticated\s+session|essential\s+cookies?|strictly\s+necessary\s+cookies?)\b/i,
      /\b(?:(?:our\s+)?(?:website|platform|site|service)\s+uses\s+cookies?|(?:we\s+)?(?:use|utilize|deploy|place)\s+cookies?)\b/i,
      /\b(?:use\s+of\s+cookies?|cookies?\s+are\s+used)\b/i,
      /\b(?:cookies?,\s+web\s+beacons,\s+and\s+local\s+storage)\b/i,
      /\b(?:remember\s+(?:user\s+)?(?:interface\s+)?preferences)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+use\s+cookies|never\s+use\s+cookies)\b/i,
      /\bcookies\s+were\s+baked\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Focuses on functional session maintenance; distinct from cross-site advertising trackers.',
  },
  {
    id: 'COOKIE_TRACKING_BEACONS',
    category: CATEGORIES.COOKIES_TRACKING,
    title: 'Web Beacons & Local Storage Technologies',
    description: 'Discloses deployment of pixel tags, tracking beacons, or browser local storage alongside traditional HTTP cookies.',
    positivePatterns: [
      /\b(?:web\s+beacons?|tracking\s+pixels?|pixel\s+tags?|clear\s+gifs?|local\s+storage|indexeddb)\b/i,
    ],
    negativePatterns: [
      /\b(?:do\s+not\s+use\s+web\s+beacons|no\s+tracking\s+pixels)\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies transparent tracking technologies that operate invisibly within web pages or emails.',
  },
  {
    id: 'COOKIE_ANALYTICS',
    category: CATEGORIES.COOKIES_TRACKING,
    title: 'Aggregated Traffic & Platform Analytics',
    description: 'Discloses using analytics cookies or telemetry providers to measure traffic volume and user engagement metrics.',
    positivePatterns: [
      /\b(?:measure\s+aggregated\s+traffic|traffic\s+analytics|user\s+engagement|google\s+analytics|analytics\s+cookies?)\b/i,
      /\b(?:performance\s+cookies?|usage\s+metrics|analytics\s+partners?)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Covers aggregate analytics; specific retention periods for analytical logs are evaluated under Data Retention.',
  },
  {
    id: 'COOKIE_USER_CONTROLS',
    category: CATEGORIES.COOKIES_TRACKING,
    title: 'Cookie Configuration & Browser Opt-Out Controls',
    description: 'Informs users how to adjust browser settings, disable cookies, or submit Do Not Track preferences.',
    positivePatterns: [
      /\b(?:adjust\s+cookie\s+settings|browser\s+preferences|disabling\s+(?:essential\s+)?cookies|cookie\s+settings|do\s+not\s+track)\b/i,
      /\b(?:manage\s+(?:certain\s+)?cookie\s+preferences|manage\s+cookies|opt-out\s+of\s+cookies|cookie\s+banner)\b/i,
      /\b(?:cookie\s+preferences\s+in\s+(?:your\s+)?browser)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Documents available consumer controls; disabling essential cookies may degrade service functionality.',
  },
  {
    id: 'COOKIE_NEGATIVE_DISCLOSURE',
    category: CATEGORIES.COOKIES_TRACKING,
    title: 'Commitment Not to Use Advertising Trackers',
    description: 'Discloses that the organization does not utilize tracking cookies or third-party behavioral advertising scripts.',
    positivePatterns: [
      /\b(?:do\s+not\s+use\s+cookies\s+for\s+advertising|do\s+not\s+employ\s+third-party\s+(?:advertising\s+)?trackers?|never\s+use\s+tracking\s+pixels)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.NEGATIVE_DISCLOSURE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies explicit commitments against advertising tracking.',
  },

  // ==========================================
  // CATEGORY D: DATA RETENTION
  // ==========================================
  {
    id: 'RETENTION_SPECIFIC_PERIOD',
    category: CATEGORIES.DATA_RETENTION,
    title: 'Specified Data Retention or Deletion Timeframe',
    description: 'Discloses explicit numeric timelines for deleting, anonymizing, or archiving user data.',
    positivePatterns: [
      /\b(?:within\s+(?:thirty|sixty|ninety|\d+)\s*\(\d+\)\s*days|within\s+\d+\s+days|within\s+\d+\s+(?:months|years))\b/i,
      /\b(?:retain(?:ed)?\s+for\s+(?:\d+|one|two|three|five|seven)\s+(?:days|months|years))\b/i,
      /\b(?:delete\s+or\s+anonymize\s+personal\s+identifiers\s+within)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Reflects specified schedules in policy text; actual backend purging cycles cannot be verified independently.',
  },
  {
    id: 'RETENTION_ACCOUNT_CLOSURE',
    category: CATEGORIES.DATA_RETENTION,
    title: 'Account Closure & Termination Deletion Policy',
    description: 'Discloses procedures and timelines for removing personal data following user account closure or contract termination.',
    positivePatterns: [
      /\b(?:request\s+account\s+closure|upon\s+account\s+closure|after\s+account\s+closure|when\s+you\s+close\s+your\s+account|following\s+(?:account\s+)?termination)\b/i,
      /\b(?:delete|purge|erase|anonymize)\s+(?:eligible\s+)?account\s+(?:data|information|records)\b/i,
      /\b(?:delete\s+or\s+anonymize\s+personal\s+identifiers|purge\s+account\s+data)\b/i,
    ],
    negativePatterns: [
      /\bstore\s+closure\b/i,
    ],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Covers post-closure deletion commitments; backup restoration cycles may delay permanent destruction.',
  },
  {
    id: 'RETENTION_VAGUE_DURATION',
    category: CATEGORIES.DATA_RETENTION,
    title: 'Indefinite or Discretionary Retention Period',
    description: 'Discloses retention duration using open-ended phrasing such as "for as long as necessary" without specific numeric limits.',
    positivePatterns: [
      /\b(?:(?:for\s+)?as\s+long\s+as\s+(?:(?:reasonably|strictly|deemed)\s+)?(?:necessary|needed|required|appropriate|your\s+account\s+remains?\s+active))\b/i,
      /\b(?:as\s+needed\s+to\s+provide\s+you\s+(?:with\s+)?services|legitimate\s+business\s+purposes?)\b/i,
      /\b(?:retain\s+information\s+for\s+as\s+long\s+as)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.VAGUE,
    defaultStrength: MATCH_STRENGTH.POSSIBLE,
    limitation: 'Highlights discretionary language that leaves exact storage duration undefined.',
  },
  {
    id: 'RETENTION_LEGAL_EXCEPTIONS',
    category: CATEGORIES.DATA_RETENTION,
    title: 'Statutory & Regulatory Retention Exceptions',
    description: 'Discloses retention beyond standard deletion schedules to satisfy statutory, tax, dispute resolution, or regulatory mandates.',
    positivePatterns: [
      /\b(?:except\s+where\s+longer\s+retention\s+is\s+mandated|legal,\s+tax,\s+or\s+regulatory\s+obligations?)\b/i,
      /\b(?:subject\s+to\s+legal\s+retention\s+obligations?|legal\s+retention\s+obligations?)\b/i,
      /\b(?:resolve\s+disputes|enforce\s+our\s+agreements|regulatory\s+compliance)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.CONDITIONAL,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Standard legal exception permitting extended storage under statutory obligations.',
  },

  // ==========================================
  // CATEGORY E: USER RIGHTS & CHOICES
  // ==========================================
  {
    id: 'RIGHTS_ACCESS_REQUEST',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Right to Access Personal Information',
    description: 'Discloses the consumer right to request confirmation and copies of personal data held by the organization.',
    positivePatterns: [
      /\b(?:access:\s*request\s+a\s+copy|request\s+(?:a\s+copy|access\s+to)\s+(?:of\s+)?(?:the|your|their)?\s*personal\s+data)\b/i,
      /\b(?:right\s+to\s+access|obtain\s+a\s+copy\s+of\s+(?:your|their)\s+data)\b/i,
      /\b(?:request\s+access\s+to\s+(?:your|their|personal)\s*(?:personal\s+)?data)\b/i,
      /\b(?:users?\s+can\s+request\s+access\s+to\s+(?:their|personal)\s*data)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies stated access rights; identity verification requirements may apply before fulfillment.',
  },
  {
    id: 'RIGHTS_CORRECTION_RECTIFICATION',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Right to Rectify & Correct Inaccurate Data',
    description: 'Discloses mechanisms allowing individuals to correct or update inaccurate or incomplete personal records.',
    positivePatterns: [
      /\b(?:correction:\s*request\s+correction|request\s+correction\s+of\s+inaccurate|right\s+to\s+rectif(?:y|ication))\b/i,
      /\b(?:rectify\s+(?:their|your|personal)?\s*data)\b/i,
      /\b(?:update\s+inaccurate\s+or\s+incomplete|modify\s+your\s+personal\s+information)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Identifies correction procedures; some data points may require formal verification.',
  },
  {
    id: 'RIGHTS_DELETION_ERASURE',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Right to Deletion & Erasure ("Right to Be Forgotten")',
    description: 'Discloses the user right to request permanent deletion or erasure of personal information.',
    positivePatterns: [
      /\b(?:deletion:\s*request\s+erasure|request\s+erasure\s+of\s+(?:your|their)\s+personal\s+data|right\s+to\s+(?:deletion|erasure|be\s+forgotten))\b/i,
      /\b(?:subject\s+to\s+lawful\s+exceptions|request\s+that\s+we\s+delete\s+(?:your|their)\s+personal\s+(?:information|data))\b/i,
      /\b(?:request\s+(?:the\s+)?deletion\s+of\s+(?:your|their)\s+personal\s+(?:information|data))\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Deletion rights remain subject to statutory data retention exceptions.',
  },
  {
    id: 'RIGHTS_OPT_OUT_MARKETING',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Right to Opt Out of Direct Marketing',
    description: 'Discloses mechanisms for opting out of promotional emails, marketing campaigns, and commercial communications.',
    positivePatterns: [
      /\b(?:opt-out:\s*opt\s+out\s+of\s+marketing|opt\s+out\s+of\s+marketing\s+communications|unsubscribe\s+link\s+in\s+emails)\b/i,
      /\b(?:email\s+preferences|manage\s+communication\s+preferences)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Marketing opt-outs typically do not halt essential administrative or transactional service notifications.',
  },
  {
    id: 'RIGHTS_DATA_PORTABILITY',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Right to Data Portability',
    description: 'Discloses the ability to export personal data in a structured, commonly used, machine-readable format.',
    positivePatterns: [
      /\b(?:data\s+portability|structured,\s+commonly\s+used|machine-readable\s+format|transfer\s+your\s+data)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Portability is typically restricted to data directly submitted by the user or processed under contract.',
  },
  {
    id: 'RIGHTS_EXERCISE_CONTACT',
    category: CATEGORIES.USER_RIGHTS,
    title: 'Rights Exercise Mechanism & Response Timelines',
    description: 'Designates official contact channels and statutory response deadlines (e.g., 30 days) for fulfilling consumer rights.',
    positivePatterns: [
      /\b(?:to\s+exercise\s+these\s+rights,\s+contact|respond\s+to\s+verified\s+requests\s+within\s+(?:thirty|30)\s+days)\b/i,
      /\b(?:contact\s+(?:our\s+)?privacy\s+(?:officer|team|compliance)|privacy@)\b/i,
    ],
    negativePatterns: [],
    expectedMatchType: MATCH_TYPE.AFFIRMATIVE,
    defaultStrength: MATCH_STRENGTH.STRONG,
    limitation: 'Specifies the communication conduit and timeline for statutory response.',
  },
];

export default RULES;
