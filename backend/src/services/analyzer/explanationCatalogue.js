/**
 * Deterministic Explanation Catalogue for PrivacyLens (Phase 5)
 *
 * Maps all 28 registered deterministic rules to structured, plain-language explanations.
 * For every applicable finding, provides:
 * 1. whatItSays: Direct summary of the disclosed clause.
 * 2. simpleMeaning: Plain English translation using short sentences and familiar words.
 * 3. whyItMatters: Why the disclosure may matter to a consumer.
 * 4. conditionsOrLimitations: Key caveats, qualifiers, or conditions in the text.
 * 5. cannotConclude: Neutral boundary of what this text alone cannot prove.
 *
 * Grounding Invariant:
 * Explanations must strictly reflect the evidence without fabricating organizational practices,
 * scores, or legal compliance guarantees.
 */

export const EXPLANATION_CATALOGUE = {
  // ==========================================
  // CATEGORY A: DATA COLLECTION
  // ==========================================
  COLLECT_DIRECT_CONTACT: {
    whatItSays: 'The policy states that the organization collects personal contact information provided directly by users.',
    simpleMeaning: 'The company collects contact details (such as your name, email address, phone number, or address) that you submit.',
    whyItMatters: 'Contact details can directly identify you in the real world and may be used for account verification, service updates, or communications.',
    conditionsOrLimitations: 'Applies to information submitted directly by the user, rather than automated background logging.',
    cannotConclude: 'This text does not indicate whether additional unlisted fields are collected, nor does it reveal how long your contact information will be retained.',
  },

  COLLECT_ACCOUNT_CREDENTIALS: {
    whatItSays: 'The policy discloses the collection and storage of user authentication details, usernames, or passwords.',
    simpleMeaning: 'The service stores your login information and profile credentials so you can access your account.',
    whyItMatters: 'Credentials protect your private account; poor security practices could lead to unauthorized account access.',
    conditionsOrLimitations: 'Applies specifically to users who create an account or authenticate on the platform.',
    cannotConclude: 'This disclosure confirms credentials are collected, but does not independently verify cryptographic hashing standards or password strength enforcement.',
  },

  COLLECT_BILLING_PAYMENT: {
    whatItSays: 'The policy states that payment card data, billing addresses, or commercial transaction history are collected.',
    simpleMeaning: 'When you purchase products or services, the company or its payment processor records your payment method and billing details.',
    whyItMatters: 'Financial information is highly sensitive and requires strict security safeguards to prevent fraud and unauthorized charges.',
    conditionsOrLimitations: 'Collection occurs during commercial transactions and is frequently delegated to third-party payment gateways.',
    cannotConclude: 'The text does not reveal whether full payment details are stored directly on company servers or tokenized securely by an external processor.',
  },

  COLLECT_DEVICE_TELEMETRY: {
    whatItSays: 'The policy states that technical device telemetry, such as IP addresses, browser types, operating systems, or device identifiers, is collected automatically.',
    simpleMeaning: 'When you use the website or app, technical details about your phone, computer, or internet connection are automatically logged.',
    whyItMatters: 'Device identifiers and IP addresses can approximate your location and track your device across different visits.',
    conditionsOrLimitations: 'Data generation is automated and occurs via standard network protocols whenever your browser connects to platform servers.',
    cannotConclude: 'The text alone does not confirm whether server access logs are regularly purged or linked directly to your named account profile.',
  },

  COLLECT_USAGE_ACTIVITY: {
    whatItSays: 'The policy states that user interactions, visited pages, clickstream patterns, or features used are tracked.',
    simpleMeaning: 'The company monitors what you click, how long you stay on pages, and how you navigate through the service.',
    whyItMatters: 'Usage tracking reveals your personal interests, browsing habits, and behavioral patterns within the application.',
    conditionsOrLimitations: 'Tracking occurs during active navigation and is often aggregated to evaluate feature popularity.',
    cannotConclude: 'This clause does not specify whether your behavioral history remains strictly internal or is shared with outside analytics services.',
  },

  COLLECT_LOCATION: {
    whatItSays: 'The policy states that geographic location data (approximate or precise) is collected from your device or connection.',
    simpleMeaning: 'The service collects information about your geographic location or regional area.',
    whyItMatters: 'Location data can range from broad regional location (such as city or country from an IP address) to precise real-time coordinates if GPS is accessed.',
    conditionsOrLimitations: 'Collection methods vary; approximate location is often derived from network data, while precise location typically requires device-level permission.',
    cannotConclude: 'Unless the excerpt explicitly specifies "precise" or "GPS" tracking, this text does not prove whether the service monitors exact real-time coordinates or only general regions.',
  },

  COLLECT_CONDITIONAL_RESTRICTION: {
    whatItSays: 'The policy states that certain sensitive or location data is not collected unless you explicitly enable a feature or grant permission.',
    simpleMeaning: 'The company agrees not to collect this data by default, but will collect it if you choose to turn on a specific feature.',
    whyItMatters: 'Conditional restrictions give you control over whether sensitive categories of information are ingested.',
    conditionsOrLimitations: 'Protection is conditional: enabling a related feature or accepting a prompt may activate data collection.',
    cannotConclude: 'The policy text cannot verify whether the software defaults to the disabled state prior to user configuration.',
  },

  // ==========================================
  // CATEGORY B: DATA SHARING & THIRD PARTIES
  // ==========================================
  SHARE_SERVICE_PROVIDERS: {
    whatItSays: 'The policy discloses that personal data is shared with third-party service providers, operational contractors, or hosting vendors.',
    simpleMeaning: 'The company shares information with outside companies that help operate their servers, customer support, or software infrastructure.',
    whyItMatters: 'When outside contractors receive your records, your privacy depends on both the primary organization and its external partners.',
    conditionsOrLimitations: 'Disclosures to service providers are generally described for business operations or hosting, though specific vendor duties depend on underlying contracts.',
    cannotConclude: 'Policies rarely list all third-party sub-processors by name, nor do they specify where external servers are physically located.',
  },

  SHARE_NO_SELL: {
    whatItSays: 'The policy states that the organization does not sell personal information to third parties or data brokers.',
    simpleMeaning: 'The company states in writing that it does not sell your personal data for money.',
    whyItMatters: 'This statement tells readers that the organization says it will not sell their personal information to data brokers. The analyzer cannot independently verify whether the organization follows this commitment.',
    conditionsOrLimitations: 'This statement specifically addresses data sales; it does not prohibit sharing information with operational service providers or analytics partners.',
    cannotConclude: 'A textual declaration against selling data does not constitute an independent financial or technical audit of the organization\'s actual business practices.',
  },

  SHARE_SALE_AFFIRMATIVE: {
    whatItSays: 'The policy discloses that personal data may be sold, rented, or transferred commercially to third parties.',
    simpleMeaning: 'The company reserves the right to sell or exchange your personal information with outside commercial parties.',
    whyItMatters: 'Affirmative data sales mean your personal information may be transferred to external advertisers or commercial data brokers.',
    conditionsOrLimitations: 'Sales may be subject to statutory opt-out rights depending on your jurisdiction (such as under CCPA/CPRA).',
    cannotConclude: 'The text does not reveal the commercial pricing, identity of purchasing parties, or precise scope of databases sold.',
  },

  SHARE_LEGAL_COMPLIANCE: {
    whatItSays: 'The policy states that personal data may be disclosed to government authorities, law enforcement, or courts under legal process.',
    simpleMeaning: 'The company will hand over your records if presented with a valid subpoena, court order, or statutory legal demand.',
    whyItMatters: 'Disclosures under statutory compulsion bypass ordinary account privacy controls and can result in government access to your records.',
    conditionsOrLimitations: 'Disclosures are conditioned on statutory necessity, subpoenas, court warrants, or urgent life-safety threats.',
    cannotConclude: 'The policy does not indicate whether the company challenges overly broad warrants or notifies affected individuals prior to disclosure.',
  },

  SHARE_BUSINESS_TRANSFERS: {
    whatItSays: 'The policy states that user information may be transferred in connection with a corporate merger, acquisition, asset sale, or bankruptcy.',
    simpleMeaning: 'If the company is acquired, merges with another business, or goes bankrupt, customer accounts and databases will transfer to the new owner.',
    whyItMatters: 'A successor corporate owner may adopt different commercial strategies or alter privacy practices in the future.',
    conditionsOrLimitations: 'Transfer occurs only if an underlying corporate transaction (such as a merger, takeover, or asset liquidation) takes place.',
    cannotConclude: 'The analyzer cannot determine whether a future acquiring corporation will maintain the current policy terms without modification.',
  },

  SHARE_AFFILIATES: {
    whatItSays: 'The policy states that personal data is shared across corporate affiliates, parent entities, and subsidiary organizations.',
    simpleMeaning: 'Your information can be accessed across other businesses owned by the same parent corporate group.',
    whyItMatters: 'Sharing across a corporate family enables sister companies to build unified behavioral profiles about your activity.',
    conditionsOrLimitations: 'Sharing is restricted to entities within the organization\'s common corporate ownership structure.',
    cannotConclude: 'The policy text alone does not enumerate every subsidiary company or international branch that participates in group sharing.',
  },

  // ==========================================
  // CATEGORY C: COOKIES & TRACKING
  // ==========================================
  COOKIE_FIRST_PARTY: {
    whatItSays: 'The policy mentions the use of cookies or browser storage technologies on the website.',
    simpleMeaning: 'The website places small data files on your device or browser when you use the service.',
    whyItMatters: 'Cookies can be used for session management, remembering settings, or basic site operation, and they can distinguish your browser across visits.',
    conditionsOrLimitations: 'The specific purpose depends on how the site deploys cookies; browser settings may allow you to inspect or block them.',
    cannotConclude: 'Unless the excerpt explicitly states their function, this disclosure does not prove whether the cookies are strictly necessary, keep you logged in, or how long they persist.',
  },

  COOKIE_TRACKING_BEACONS: {
    whatItSays: 'The policy mentions the use of web beacons, tracking pixels, or browser storage technologies.',
    simpleMeaning: 'The service mentions digital tracking elements (such as web beacons, pixel tags, or local storage) alongside standard cookies.',
    whyItMatters: 'In general web technology, web beacons are tiny graphic images that can record when a page or email is viewed, along with technical details like your IP address.',
    conditionsOrLimitations: 'Their technical operation typically depends on loading remote image assets or scripts through your browser or email client.',
    cannotConclude: 'The text alone does not verify whether beacons are used in emails or web pages, what specific events are logged, or whether third parties receive the data.',
  },

  COOKIE_ANALYTICS: {
    whatItSays: 'The policy states that analytics cookies or measurement tools are used to monitor website traffic or user engagement.',
    simpleMeaning: 'The organization uses cookies or measurement tools to collect data on how visitors navigate and interact with the service.',
    whyItMatters: 'Analytics tools help site operators evaluate site performance and popular content. In general, analytics measurements can track individual devices unless anonymized.',
    conditionsOrLimitations: 'These disclosures are often described as aggregate or performance metrics, though underlying logs may still include technical device identifiers.',
    cannotConclude: 'Unless explicitly named in the excerpt, this disclosure does not prove whether analytics are handled internally or by outside providers, nor whether IP addresses are masked.',
  },

  COOKIE_USER_CONTROLS: {
    whatItSays: 'The policy explains that you can manage, reject, or disable cookies using browser preferences or on-site settings.',
    simpleMeaning: 'You have the option to block or delete cookies through your web browser controls.',
    whyItMatters: 'Knowing how to disable cookies gives you direct power to limit tracking on your own device.',
    conditionsOrLimitations: 'Disabling essential cookies may break login sessions, shopping carts, or interactive site features.',
    cannotConclude: 'The text cannot guarantee that browser-level cookie blocking will prevent non-cookie tracking methods like device fingerprinting.',
  },

  COOKIE_NEGATIVE_DISCLOSURE: {
    whatItSays: 'The policy states that the website does not deploy third-party advertising cookies or cross-site tracking tools.',
    simpleMeaning: 'The organization states in writing that it does not use third-party advertising trackers.',
    whyItMatters: 'This statement indicates that the organization says it does not permit third-party advertising tracking on the site. The analyzer cannot independently verify technical tracking behavior.',
    conditionsOrLimitations: 'A statement against advertising cookies does not necessarily restrict first-party cookies, functional cookies, or statistical analytics.',
    cannotConclude: 'This written statement does not verify whether third-party embedded content (such as videos, fonts, or scripts) transmits technical data to external servers.',
  },

  // ==========================================
  // CATEGORY D: DATA RETENTION
  // ==========================================
  RETENTION_SPECIFIC_PERIOD: {
    whatItSays: 'The policy provides an explicit numerical timeframe (e.g., 30 days, 90 days, 12 months) for data retention or deletion.',
    simpleMeaning: 'The company sets a clear, measurable deadline for how long your records are kept before being removed.',
    whyItMatters: 'Measurable time limits prevent personal records from lingering indefinitely on backup servers.',
    conditionsOrLimitations: 'Defined periods often apply to specific data subsets (such as server logs or closed accounts) rather than all collected data.',
    cannotConclude: 'An explicit timeframe does not prove that automated deletion scripts execute reliably on the exact promised date.',
  },

  RETENTION_ACCOUNT_CLOSURE: {
    whatItSays: 'The policy states that account records and personal identifiers are purged or anonymized following account termination.',
    simpleMeaning: 'When you close or delete your account, the company states that it will delete or anonymize your personal profile.',
    whyItMatters: 'Account closure deletion allows you to cut ties with a platform without leaving your profile data behind.',
    conditionsOrLimitations: 'Deletion is conditioned on formal account termination, and processing times across active systems and backup archives may vary.',
    cannotConclude: 'The written statement alone does not verify whether backup archives are purged simultaneously or whether de-identified data could be re-associated with users.',
  },

  RETENTION_VAGUE_DURATION: {
    whatItSays: 'The policy uses open-ended wording stating data is retained "for as long as necessary" or "as needed for business purposes."',
    simpleMeaning: 'The company does not specify an exact expiration date, deciding internally how long to keep your data.',
    whyItMatters: 'Vague retention gives the company wide discretion to store your records for months, years, or indefinitely.',
    conditionsOrLimitations: 'Subject to shifting internal business definitions of what is "necessary" or "appropriate."',
    cannotConclude: 'Because no numerical timeframe is stated, neither the consumer nor the analyzer can determine when deletion will occur.',
  },

  RETENTION_LEGAL_EXCEPTIONS: {
    whatItSays: 'The policy states that data may be retained beyond standard deletion dates to satisfy legal, tax, or regulatory duties.',
    simpleMeaning: 'Even if you delete your account, the company keeps certain records if required by tax or corporate compliance laws.',
    whyItMatters: 'Legal retention exceptions explain why financial or contractual records cannot be erased immediately upon request.',
    conditionsOrLimitations: 'Applies strictly to records covered by statutory accounting, dispute resolution, or regulatory mandates.',
    cannotConclude: 'The text does not enumerate the specific statutory retention periods mandated by applicable tax or commercial codes.',
  },

  // ==========================================
  // CATEGORY E: USER RIGHTS & CHOICES
  // ==========================================
  RIGHTS_ACCESS_REQUEST: {
    whatItSays: 'The policy discloses your right to request access to and obtain copies of the personal data held about you.',
    simpleMeaning: 'You have the right to ask the company for a copy of all the personal records they have collected on you.',
    whyItMatters: 'Access requests let you see exactly what information an organization possesses about you.',
    conditionsOrLimitations: 'Companies generally require you to verify your identity before releasing personal records.',
    cannotConclude: 'The disclosure confirms the right exists on paper, but cannot measure whether the company fulfills requests smoothly.',
  },

  RIGHTS_CORRECTION_RECTIFICATION: {
    whatItSays: 'The policy discloses your right to update, modify, or rectify inaccurate or incomplete personal information.',
    simpleMeaning: 'If the company has wrong or outdated information about you, you have the right to have it corrected.',
    whyItMatters: 'Inaccurate records can cause billing errors, account lockouts, or incorrect administrative decisions.',
    conditionsOrLimitations: 'May require submitting official supporting documentation if modifying legal names or financial identifiers.',
    cannotConclude: 'The text does not indicate whether corrections synchronize automatically across all downstream vendor databases.',
  },

  RIGHTS_DELETION_ERASURE: {
    whatItSays: 'The policy discloses your right to request deletion or erasure of your personal data ("Right to Be Forgotten").',
    simpleMeaning: 'You can formally request that the company permanently erase your personal data from their systems.',
    whyItMatters: 'The right to erasure is a cornerstone of modern privacy legislation (such as GDPR and CCPA/CPRA).',
    conditionsOrLimitations: 'Deletion rights are not absolute; they remain subject to legal retention obligations and fraud-prevention exemptions.',
    cannotConclude: 'The policy text cannot verify whether backup tapes and cold storage archives are scrubbed simultaneously.',
  },

  RIGHTS_OPT_OUT_MARKETING: {
    whatItSays: 'The policy explains how to opt out of promotional emails and direct marketing communications.',
    simpleMeaning: 'You can stop promotional marketing emails by clicking the "unsubscribe" link included in every message.',
    whyItMatters: 'Direct marketing opt-outs let you reduce digital clutter and stop unwanted commercial solicitations.',
    conditionsOrLimitations: 'Opting out of marketing does not stop critical transactional emails (such as password resets or receipts).',
    cannotConclude: 'The policy does not specify how many business days it takes for an unsubscribe request to propagate across all mailing lists.',
  },

  RIGHTS_DATA_PORTABILITY: {
    whatItSays: 'The policy discloses your right to receive your personal data in a structured, commonly used, and machine-readable format.',
    simpleMeaning: 'You can download your data in a portable computer format (such as JSON or CSV) to move it to another service.',
    whyItMatters: 'Data portability prevents platform lock-in by allowing you to take your files and history with you.',
    conditionsOrLimitations: 'Generally applies to information you provided directly or that was processed under contract or consent.',
    cannotConclude: 'The text does not guarantee that the exported file format will be directly compatible with every competing application.',
  },

  RIGHTS_EXERCISE_CONTACT: {
    whatItSays: 'The policy designates specific contact channels (such as a privacy email) and response timelines (e.g., 30 days) for rights requests.',
    simpleMeaning: 'The company tells you exactly where to send privacy requests and how long they have to answer you.',
    whyItMatters: 'A dedicated contact channel and clear deadline make it realistic for users to exercise their legal rights.',
    conditionsOrLimitations: 'The statutory response period (often 30 days) may be extended for complex or numerous requests where permitted by law.',
    cannotConclude: 'The analyzer cannot evaluate whether the designated privacy inbox is promptly monitored by human personnel.',
  },
};

/**
 * Safe fallback explanation for unknown, missing, or dynamically added rules.
 */
export const FALLBACK_EXPLANATION = {
  whatItSays: 'The policy text contains a disclosure matching standard privacy terminology.',
  simpleMeaning: 'This clause addresses an operational privacy practice outlined by the organization.',
  whyItMatters: 'Understanding how the organization manages information helps you make informed privacy decisions.',
  conditionsOrLimitations: 'Refer directly to the verbatim quote for specific limitations, conditions, or exceptions.',
  cannotConclude: 'The analyzer cannot independently determine the operational implementation of this clause beyond the stated text.',
};

/**
 * Retrieves the deterministic structured explanation for a given rule identifier.
 * Returns a safe, neutral fallback if the ruleId is not recognized.
 *
 * @param {string} ruleId - Registered rule identifier
 * @returns {{
 *   whatItSays: string,
 *   simpleMeaning: string,
 *   whyItMatters: string,
 *   conditionsOrLimitations: string,
 *   cannotConclude: string
 * }}
 */
export function getRuleExplanation(ruleId) {
  if (typeof ruleId === 'string' && EXPLANATION_CATALOGUE[ruleId]) {
    return EXPLANATION_CATALOGUE[ruleId];
  }
  return FALLBACK_EXPLANATION;
}

/**
 * Deterministically derives high-level key observations from verified findings.
 * Does not fabricate claims; derives only what is explicitly supported by findings.
 *
 * @param {Array<object>} findings - List of verified findings
 * @param {Array<object>} categories - List of evaluated categories
 * @returns {Array<string>} List of neutral observation bullet points
 */
export function generateKeyObservations(findings = [], categories = []) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return [
      'No matching disclosures were detected across the five standard privacy categories in the submitted text.',
      'The absence of detected text does not prove that the organization does not perform these activities; the analyzed text may be an incomplete excerpt.',
    ];
  }

  const observations = [];
  const ruleIds = new Set(findings.map((f) => f.ruleId));

  // Data Sharing observations
  if (ruleIds.has('SHARE_NO_SELL')) {
    observations.push('Affirmative Non-Sale Commitment: The policy explicitly commits not to sell personal data to data brokers or third parties.');
  }
  if (ruleIds.has('SHARE_SERVICE_PROVIDERS')) {
    observations.push('Third-Party Operational Sharing: Personal data is disclosed to outside service providers, hosting vendors, or contractors under confidentiality.');
  }
  if (ruleIds.has('SHARE_SALE_AFFIRMATIVE')) {
    observations.push('Commercial Sale Disclosure: The policy discloses that personal information may be sold or shared for commercial consideration.');
  }

  // Retention observations
  if (ruleIds.has('RETENTION_SPECIFIC_PERIOD')) {
    observations.push('Defined Storage Timeline: An explicit numerical retention or deletion timeframe is specified.');
  }
  if (ruleIds.has('RETENTION_VAGUE_DURATION') && !ruleIds.has('RETENTION_SPECIFIC_PERIOD')) {
    observations.push('Discretionary Retention Period: Retention duration uses open-ended wording (e.g. "as long as necessary") without an explicit numerical day count.');
  }
  if (ruleIds.has('RETENTION_ACCOUNT_CLOSURE')) {
    observations.push('Account Termination Deletion: The policy outlines data deletion or anonymization following account closure.');
  }

  // Rights observations
  if (ruleIds.has('RIGHTS_ACCESS_REQUEST') || ruleIds.has('RIGHTS_DELETION_ERASURE')) {
    observations.push('User Control Mechanisms: Consumer rights to access, copy, and request erasure of personal data are explicitly recognized.');
  }

  // Cookie observations
  if (ruleIds.has('COOKIE_USER_CONTROLS')) {
    observations.push('Tracking Controls: Instructions or browser preferences for managing or rejecting cookies are disclosed.');
  }
  if (ruleIds.has('COOKIE_NEGATIVE_DISCLOSURE')) {
    observations.push('Advertising Tracker Pledge: The policy declares that third-party advertising trackers or commercial cookies are not used.');
  }

  // If few specific highlights matched, generate high-level category count summary
  if (observations.length === 0) {
    const disclosedCats = categories.filter((c) => c.status === 'found').map((c) => c.name);
    if (disclosedCats.length > 0) {
      observations.push(`Disclosures were identified in ${disclosedCats.length} category/categories: ${disclosedCats.join(', ')}.`);
    }
  }

  // Note any category completely not detected
  const missingCats = categories.filter((c) => c.status === 'not_found').map((c) => c.name);
  if (missingCats.length > 0) {
    observations.push(`No matching disclosures were detected in: ${missingCats.join(', ')}. (Absence in text does not prove non-performance).`);
  }

  return observations;
}

export default {
  EXPLANATION_CATALOGUE,
  FALLBACK_EXPLANATION,
  getRuleExplanation,
  generateKeyObservations,
};
