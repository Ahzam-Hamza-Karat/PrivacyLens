# PrivacyLens — Comprehensive UI/UX Visual & Interaction Redesign Specification

**Date:** October 29, 2026  
**Design Philosophy:** Modern, high-density, accessible, evidence-grounded software intelligence (inspired by Linear, Stripe, Apple, NN/g, W3C WAI).  
**Core Goal:** Transform PrivacyLens from a generic single-column page into a purposeful, multi-surface privacy analysis studio and command dashboard.

---

## 1. Design System & Aesthetic Tokens

### A. Color Palette & Surface Tokens
- **Background Root:** Deep rich slate navy (`#090d16` and `#0b1120`).
- **Surface Elevation 1 (Cards & Sidebars):** Translucent elevated slate (`rgba(15, 23, 42, 0.75)` / `#0f172a`).
- **Surface Elevation 2 (Active Panels & Controls):** Deep obsidian blue (`rgba(30, 41, 59, 0.65)` / `#1e293b`).
- **Borders & Dividers:** Subtle luminous slate borders (`rgba(148, 163, 184, 0.12)` with `:hover` state `rgba(56, 189, 248, 0.3)`).
- **Primary Accent:** Radiant cyan (`#38bdf8`) with glowing focus rings (`box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.3)`).
- **Secondary Accent:** Cobalt sapphire (`#2563eb` and `#1d4ed8`).
- **Semantic Status Tokens:**
  - *Disclosed / Clear (Found):* Emerald green (`#10b981`, badge text `#34d399`, bg `rgba(16, 185, 129, 0.12)`).
  - *Ambiguous / Discretionary (Unclear):* Amber warning (`#f59e0b`, badge text `#fbbf24`, bg `rgba(245, 158, 11, 0.12)`).
  - *Not Detected:* Slate neutral (`#64748b`, badge text `#94a3b8`, bg `rgba(100, 116, 139, 0.12)`).
  - *Stale Context:* Vibrant warning amber with pulsing alert dot.

### B. Typography & Spacing
- **Font Stack:** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif`.
- **Code / Monospace Stack:** `ui-monospace, "SFMono-Regular", "Cascadia Code", "Fira Code", monospace`.
- **Typographic Scale:**
  - Display Title: 2.75rem (44px), tracking -0.03em, weight 800.
  - Section Headings: 1.75rem (28px), tracking -0.02em, weight 700.
  - Card Headings: 1.15rem (18px), tracking -0.01em, weight 600.
  - Body Text: 0.95rem (15.2px), line-height 1.6, weight 400.
  - Labels & Badges: 0.75rem (12px), uppercase tracking 0.06em, weight 600.

---

## 2. Screen-by-Screen Redesign Blueprint

### Screen 1: Header Navigation (`Navbar.jsx`)
- **Composition:** Floating, backdrop-blurred frosted navigation bar with glowing border.
- **Brand Identity:** Optic lens logo + "PrivacyLens" typography + engine pill badge (`v1.0 • 28 Rules`).
- **Navigation:** Segmented anchor links (`Analyzer`, `Findings`, `Cookie Intelligence`, `Version Diff`, `Chatbot`, `Architecture`).
- **Quick Actions:** Live API health indicator dot (pulsing green) + "Analyze a Policy" action button.
- **Mobile Drawer:** Accessible slide-down menu with large touch targets.

### Screen 2: Hero Section & Live Clause Inspector (`Hero.jsx`)
- **Composition:** Asymmetric / centered split-hero layout.
- **Hero Left:** Luminous pill tag (`Deterministic Rule-Based Intelligence • 100% Verbatim Grounding`), bold headline (*"Instant clarity for impenetrable privacy policies"*), concise value proposition, primary CTA (*"Start Policy Analysis"*), secondary CTA (*"Try Sample Policy"*), and privacy guarantee micro-copy (*Zero database persistence • No account required*).
- **Hero Right (Interactive Showcase Demo):** Interactive visual simulation of PrivacyLens in action! Shows sample clause inspection card with highlighted text, category badge, rule identifier tag, verbatim offset citation, and plain-language interpretation. Includes 3 toggleable sample clauses (*Geolocation Tracking*, *Third-Party Sale*, *Tracking Cookies*), clearly marked as an illustrative demo.
- **Consolidated Capabilities Bento Grid (Replacing repetitive TrustSection):** 5 high-impact visual bento cards demonstrating:
  1. 28 Transparent Deterministic Rules (with category breakdown).
  2. Verbatim Evidence Offset Slicing (`policyText.slice(start, end) === evidence`).
  3. Strict 28-Denominator Doughnut Conservation.
  4. Cookie Intelligence & Consent Simulator.
  5. Version Revision Diffing & Grounded Chatbot.
- **Scope Disclaimer:** Restrained banner affirming informational educational scope.

### Screen 3: Policy Analyzer Workspace (`PolicyAnalyzer.jsx`)
- **Composition:** Studio editor canvas.
- **Header:** Step indicator (`01 / Ingestion`), instructions, and document format guide.
- **Toolbar:** "Try Sample Policy" action pill, "Clear Text" button, sample document switcher.
- **Editor:** Monospace-friendly textarea with line-height polish, comfortable padding, and `Ctrl + Enter` shortcut hint.
- **Footer:** Circular/linear capacity progress meter ($0$ to $50{,}000$ characters), live counter, and prominent "Run Deterministic Analysis" button with animated scanner icon.
- **Progress State:** Visual 4-step progress animation during analysis (*Normalizing text... Running 28 rules... Slicing offsets... Generating explanations...*).

### Screen 4: Results Command Center Dashboard (`ReportPreview.jsx` + `PrivacyAnalysisDoughnutChart.jsx`)
- **Composition:** Multi-surface dashboard that transforms the analysis results into a structured command center.
- **Top Metrics Ribbon:** Document stats (Characters, Words, Paragraphs, Timestamp) + 3 Metric Cards:
  - *Disclosed (Clear)* in emerald green.
  - *Ambiguous (Vague)* in amber warning.
  - *Not Detected* in slate neutral.
- **Visualization Panel:** Doughnut distribution chart mathematically conserving 28 rules + per-category distribution bars.
- **Command Toolbar:** Real-time keyword search, 5 category filter pills with counts, outcome selector, and **View Mode Toggle** (Card Grid View vs Dense Table View).
- **Findings Presentation:**
  - *Card View:* Expandable 5-dimension explanations, category tags, rule ID pills, verbatim evidence quotes with exact character offsets (`Chars X to Y`), and on-demand AI explanation button.
  - *Dense Table View:* Fast auditing table with columns for Rule, Category, Outcome, Offsets, and Evidence Quote.

### Screen 5: Cookie Intelligence Center (`CookieCenter.jsx`, `CookieAssistant.jsx`, `CookieSimulator.jsx`, `CookiePreferenceChart.jsx`)
- **Composition:** Tabbed module container with segmented pill controller (`Cookie Assistant` vs `Interactive Simulator`).
- **Cookie Assistant:** 5 disclosure evaluation cards with citations, plus an interactive searchable Cookie Glossary.
- **Cookie Simulator:** Visual mock of modern consent management with interactive switches, strictly locked Strictly Essential category, batch actions (*Accept All*, *Reject Optional*, *Reset*), dynamic exposure progress meter, and accessible HTML matrix table.

### Screen 6: Policy Version Comparison (`PolicyComparison.jsx`)
- **Composition:** Dual-input comparative studio.
- **Inputs:** Version A (Baseline) and Version B (Revision) panes with char counters and "Load Sample Comparison" action.
- **Results:** Added words metric (+green), removed words metric (-red), unchanged words, similarity %.
- **Diff Views:** Unified Diff view with highlighted inline `<ins>` and `<del>` + Side-by-Side dual synchronized panes.

### Screen 7: Policy Chatbot Assistant (`PolicyChatbot.jsx`)
- **Composition:** Conversational interface with chat stream, suggested prompt chips, message input bar, and deterministic fallback banner with zero hallucination guarantee.

### Screen 8: How It Works & System Architecture (`HowItWorks.jsx`)
- **Composition:** 4-stage connected pipeline visualizer (Ingestion -> 28 Rules -> Verbatim Evidence -> Grounded AI).

### Screen 9: System Health & Diagnostics (`DiagnosticCard.jsx`)
- **Composition:** Parallel cards for Express REST API health and AI Provider status with refresh action.

### Screen 10: Print & Responsive Modes
- **Responsive:** Full grid collapse across desktop ($>1024\text{px}$), tablet ($768\text{px}$–$1024\text{px}$), and mobile ($<768\text{px}$).
- **Print:** Clean 13-page black-on-white layout with zero UI chrome and page-break rules.

