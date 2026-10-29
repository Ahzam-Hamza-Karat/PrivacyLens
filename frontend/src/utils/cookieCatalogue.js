/**
 * Cookie Assistant & Simulator Catalogue (Phase 4)
 *
 * Defines domain metadata for cookie and tracking analysis,
 * educational terminology breakdowns, and interactive consent simulation models.
 *
 * Scope Safeguard: Purely analytical and educational in-memory models.
 * Zero real browser cookie mutation, zero external website tracking interception.
 */

import { EXPLANATION_CATALOGUE } from './explanationCatalogue.js';

/**
 * The 5 deterministic cookie and tracking rules evaluated by PrivacyLens
 */
export const COOKIE_RULES = [
  {
    id: 'COOKIE_FIRST_PARTY',
    title: 'First-Party Cookies & Essential Session Management',
    shortName: 'First-Party Cookies',
    description: 'Discloses cookies set directly by the visited website for login sessions, security tokens, or remembering preferences.',
    userQuestion: 'Does this website use first-party cookies to keep me logged in?',
    simulatedCategory: 'essential',
  },
  {
    id: 'COOKIE_TRACKING_BEACONS',
    title: 'Web Beacons & Local Storage Technologies',
    shortName: 'Tracking Pixels & Beacons',
    description: 'Discloses 1x1 transparent tracking pixels, web beacons, or HTML5 browser storage used to monitor user navigation.',
    userQuestion: 'Does this policy mention web beacons, pixels, or local storage?',
    simulatedCategory: 'advertising',
  },
  {
    id: 'COOKIE_ANALYTICS',
    title: 'Aggregated Traffic & Platform Analytics',
    shortName: 'Analytics Cookies',
    description: 'Discloses cookies and scripts used to measure visitor numbers, popular pages, navigation flow, and technical performance.',
    userQuestion: 'Does this site use analytics cookies to track visitor traffic?',
    simulatedCategory: 'analytics',
  },
  {
    id: 'COOKIE_USER_CONTROLS',
    title: 'Cookie Configuration & Browser Opt-Out Controls',
    shortName: 'Cookie Opt-Out Controls',
    description: 'Discloses settings, cookie banners, or browser options that allow users to reject or manage cookie categories.',
    userQuestion: 'Does the policy explain how I can configure or opt out of cookies?',
    simulatedCategory: 'functional',
  },
  {
    id: 'COOKIE_NEGATIVE_DISCLOSURE',
    title: 'Commitment Not to Use Advertising Trackers',
    shortName: 'No-Advertising Commitment',
    description: 'Discloses an explicit organizational commitment not to use advertising, cross-site, or behavioral tracking cookies.',
    userQuestion: 'Does the company affirmatively state that it does not use ad cookies?',
    simulatedCategory: 'advertising',
  },
];

/**
 * Beginner-friendly educational glossary for cookie concepts
 */
export const COOKIE_GLOSSARY = [
  {
    term: 'What is a Cookie?',
    simpleDefinition: 'A small text file saved on your computer or phone by a website you visit.',
    whyItMatters: 'Cookies let websites remember that you are logged in, what items are in your cart, or what language you prefer across page reloads.',
    riskLevel: 'Low (when strictly used for essential functionality).',
  },
  {
    term: 'First-Party vs. Third-Party Cookies',
    simpleDefinition: 'First-party cookies come from the website you typed into your address bar. Third-party cookies come from outside vendors (like ad networks or analytics services) embedded on that page.',
    whyItMatters: 'Third-party cookies can track your browsing activity across many different unrelated websites, building an advertising profile about your habits.',
    riskLevel: 'Medium to High (third-party tracking cookies follow you across the web).',
  },
  {
    term: 'Web Beacons (Tracking Pixels)',
    simpleDefinition: 'Tiny, invisible 1x1 pixel images loaded inside web pages or emails.',
    whyItMatters: 'When your browser requests the image file, the server records your IP address, browser type, and the exact time you opened the page or email.',
    riskLevel: 'Medium (frequently used in commercial emails and advertising measurement).',
  },
  {
    term: 'Analytics Cookies',
    simpleDefinition: 'Cookies that count how many people visit a site, what pages they click on, and how long they stay.',
    whyItMatters: 'Website owners use analytics to fix broken pages and improve design. When properly configured, analytics data is aggregated and does not personally identify you.',
    riskLevel: 'Low to Medium (depending on whether data is shared with external ad platforms).',
  },
  {
    term: 'Consent Banners & Opt-Outs',
    simpleDefinition: 'Popups or notices that ask for your permission before placing non-essential cookies on your browser.',
    whyItMatters: 'Under privacy laws like GDPR and CCPA, websites must obtain your freely given consent before loading optional tracking or advertising scripts.',
    riskLevel: 'Consumer Protection Mechanism.',
  },
];

/**
 * Simulated Cookie Categories for the Interactive Demonstration (Phase 4B)
 */
export const SIMULATOR_CATEGORIES = [
  {
    id: 'essential',
    name: 'Strictly Necessary (Essential)',
    shortName: 'Essential',
    required: true,
    badgeText: 'Always Active (Required)',
    description: 'Required for core platform security, user authentication, and basic navigation.',
    simulatedExamples: ['session_id', 'csrf_token', 'load_balancer_route'],
    impactGranted: 'Platform operates securely. You stay logged in as you navigate between pages.',
    impactDenied: 'Cannot be disabled. Without these cookies, web applications cannot maintain sessions or process transactions.',
  },
  {
    id: 'analytics',
    name: 'Analytics & Performance',
    shortName: 'Analytics',
    required: false,
    badgeText: 'Optional',
    description: 'Measures traffic volume, popular site pathways, and system load to help improve platform performance.',
    simulatedExamples: ['_ga_traffic', '_pk_session_metrics', 'page_load_timing'],
    impactGranted: 'Website receives aggregated performance metrics. Helps developers fix bugs and optimize page load speeds.',
    impactDenied: 'Website cannot measure your visit in traffic statistics. Platform functionality is unimpaired.',
  },
  {
    id: 'advertising',
    name: 'Advertising & Cross-Site Tracking',
    shortName: 'Advertising',
    required: false,
    badgeText: 'Optional',
    description: 'Collects browsing habits to display personalized commercial advertisements and measure marketing campaigns.',
    simulatedExamples: ['ad_profile_id', 'retargeting_beacon', 'partner_sync'],
    impactGranted: 'Ad networks build a behavioral profile across partner sites to serve targeted promotions.',
    impactDenied: 'Cross-site behavioral profiling is blocked. You may still see ads, but they will be contextual rather than personalized.',
  },
  {
    id: 'functional',
    name: 'Functional & Preferences',
    shortName: 'Functional',
    required: false,
    badgeText: 'Optional',
    description: 'Remembers non-essential user settings such as theme color, display density, or audio volume.',
    simulatedExamples: ['theme_dark_mode', 'preferred_view_mode', 'cookie_dismissed'],
    impactGranted: 'Your custom interface settings are remembered for future visits.',
    impactDenied: 'The platform reverts to standard default settings on each visit.',
  },
];

/**
 * Creates the default initial state for the cookie simulator.
 * Invariant: Essential cookies are strictly true.
 *
 * @returns {Record<string, boolean>}
 */
export function createDefaultSimulatorState() {
  return {
    essential: true, // Strictly required, cannot be turned off
    analytics: false,
    advertising: false,
    functional: false,
  };
}

/**
 * Returns human-readable text summarizing current simulated consent settings.
 *
 * @param {Record<string, boolean>} state
 * @returns {{
 *   readableSummary: string,
 *   activeCount: number,
 *   totalCategories: number,
 *   optionalActiveCount: number,
 *   simulatedImpactText: string
 * }}
 */
export function getReadableConsentSummary(state = {}) {
  const safeState = {
    essential: true, // Always enforced
    analytics: Boolean(state.analytics),
    advertising: Boolean(state.advertising),
    functional: Boolean(state.functional),
  };

  const activeCategories = [];
  const deniedCategories = [];

  SIMULATOR_CATEGORIES.forEach((cat) => {
    if (safeState[cat.id]) {
      activeCategories.push(cat.shortName);
    } else {
      deniedCategories.push(cat.shortName);
    }
  });

  const activeCount = activeCategories.length;
  const totalCategories = SIMULATOR_CATEGORIES.length;
  const optionalActiveCount = activeCount - 1; // Subtract essential

  let readableSummary = '';
  if (optionalActiveCount === 0) {
    readableSummary = 'Strictly Essential Only (All optional tracking rejected)';
  } else if (optionalActiveCount === 3) {
    readableSummary = 'Full Consent (All optional categories accepted)';
  } else {
    readableSummary = `Custom Configuration (${activeCategories.join(', ')})`;
  }

  // Generate impact prose
  let simulatedImpactText = '';
  if (safeState.advertising) {
    simulatedImpactText = 'Behavioral advertising cookies are permitted. Third-party marketing networks would be allowed to sync tracking identifiers across sites.';
  } else if (safeState.analytics) {
    simulatedImpactText = 'Performance analytics cookies are permitted for site measurement, while commercial cross-site ad tracking is blocked.';
  } else if (safeState.functional) {
    simulatedImpactText = 'Custom display preferences are remembered, while all marketing and analytics tracking is blocked.';
  } else {
    simulatedImpactText = 'Maximum privacy simulation: Only core security and session cookies are enabled. Zero tracking or telemetry is permitted.';
  }

  return {
    readableSummary,
    activeCount,
    totalCategories,
    optionalActiveCount,
    simulatedImpactText,
    safeState,
  };
}

/**
 * Extracts and categorizes cookie and tracking disclosures from an analysis report.
 *
 * @param {object | null} analysisReport
 * @param {boolean} hasAnalyzed
 * @returns {Array<{
 *   ruleId: string,
 *   title: string,
 *   shortName: string,
 *   description: string,
 *   userQuestion: string,
 *   status: 'found' | 'unclear' | 'not_found' | 'pending',
 *   statusLabel: string,
 *   finding: object | null,
 *   evidence: string | null,
 *   startOffset: number | null,
 *   endOffset: number | null,
 *   deterministicExplanation: object | null
 * }>}
 */
export function extractCookieDisclosures(analysisReport, hasAnalyzed = true) {
  const findings = analysisReport?.findings || [];

  return COOKIE_RULES.map((rule) => {
    if (!hasAnalyzed) {
      return {
        ruleId: rule.id,
        title: rule.title,
        shortName: rule.shortName,
        description: rule.description,
        userQuestion: rule.userQuestion,
        status: 'pending',
        statusLabel: 'Pending Analysis',
        finding: null,
        evidence: null,
        startOffset: null,
        endOffset: null,
        deterministicExplanation: EXPLANATION_CATALOGUE[rule.id] || null,
      };
    }

    const matchedFindings = findings.filter((f) => f && f.ruleId === rule.id);

    if (matchedFindings.length === 0) {
      return {
        ruleId: rule.id,
        title: rule.title,
        shortName: rule.shortName,
        description: rule.description,
        userQuestion: rule.userQuestion,
        status: 'not_found',
        statusLabel: 'Not Detected',
        finding: null,
        evidence: null,
        startOffset: null,
        endOffset: null,
        deterministicExplanation: EXPLANATION_CATALOGUE[rule.id] || null,
      };
    }

    const firstMatch = matchedFindings[0];
    const isUnclear = matchedFindings.every(
      (f) => f.matchStrength === 'unclear' || f.matchType === 'vague'
    );
    const status = isUnclear ? 'unclear' : 'found';
    const statusLabel = isUnclear ? 'Unclear / Vague' : 'Found (Disclosed)';

    return {
      ruleId: rule.id,
      title: rule.title,
      shortName: rule.shortName,
      description: rule.description,
      userQuestion: rule.userQuestion,
      status,
      statusLabel,
      finding: firstMatch,
      evidence: firstMatch.evidence || null,
      startOffset: firstMatch.startOffset ?? null,
      endOffset: firstMatch.endOffset ?? null,
      deterministicExplanation: EXPLANATION_CATALOGUE[rule.id] || null,
    };
  });
}

