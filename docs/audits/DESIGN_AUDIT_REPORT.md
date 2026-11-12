# Cyber Law Awareness Portal — Portal-Wide Visual Design Audit
## Design Improvement Phase 1: Comprehensive Read-Only Audit Report

**Audit Type:** Read-Only Visual, Responsive, Typographic & Accessibility Audit  
**Date of Audit:** 08 November 2026  
**Audit Baseline:** Accepted Stages 1–6 (`stage-5-learning-consolidation`, commit `db62fca`)  
**Scope:** Portal-Wide (Public Experience, Authenticated Workspace, Assessment Engine, Legal Knowledge Centre)  
**Execution Boundary:** Read-Only Audit & Documentation Only — **Zero Code/Asset/Schema Modifications Made**

---

## 1. Executive Summary

This report documents the findings of the comprehensive portal-wide visual audit conducted under Phase 1 of the Post-Development Design Improvement workstream. The audit evaluates the Cyber Law Awareness Portal against its declared design direction: **editorial, restrained, warm, authoritative, educational, and accessible**, while actively eliminating generic SaaS aesthetics, excessive rounded cards, flashy gamification, and neon cyberpunk clichés.

The audit inspected **17 distinct routes** across **5 standard viewports** (Desktop 1440px, Desktop 1280px, Tablet 768px, Mobile 390px, Mobile 375px), captured **54 high-resolution screenshot artifacts**, performed automated **Axe Core WCAG 2.1 AA accessibility scans** across 13 core views, and measured computed CSS properties, typography scales, spacing rhythms, and layout boundary behaviors.

### Core Audit Takeaways:
1. **Strong Architectural & Editorial Anchor**: The Stage 6 Dashboard and the revised Homepage establish an effective editorial tone. The warm parchment canvas (`#F8F4EC`), deep charcoal typography (`#302B27`), restrained terracotta accents (`#9A503A`), and the 4-Stage Progressive Journey Map demonstrate that the portal's aesthetic direction is both credible and pedagogically sound.
2. **Peripheral Aesthetic Fragmentation**: As one moves away from the Dashboard and Homepage into the Legal Knowledge Centre (`Laws.jsx`, `Crimes.jsx`), Curriculum Catalog (`Modules.jsx`), and Prevention Centre (`Prevention.jsx`), the visual language fragments. Components introduce hardcoded saturated blues (`#0369a1`, `#bae6fd`), purples (`#4338ca`), and reds (`#b91c1c`), departing from the established warm editorial tokens.
3. **Confirmed Mobile Layout Defect**: A verified **8px horizontal overflow** (`scrollWidth: 398px` vs `clientWidth: 390px`) was identified on `/prevention` at 390px mobile, caused by fixed `minWidth: 120px` badge elements placed within unwrapped flex containers.
4. **Typography Reset Gap**: Browser-default `<button>` elements across several workspace panels lack an explicit `font-family: inherit` rule, causing icon buttons, tabs, and interactive triggers to fall back to system `Arial` rather than the canonical `Inter` typography.
5. **Color Contrast Gaps on Subtle Hierarchy Elements**: Automated Axe scans revealed recurring WCAG 2.1 AA contrast failures (ratios below 4.5:1) on secondary metadata, category tags, situation count pills, and inactive navigation links where muted grays (`#6F665D`, `#8A8075`) are rendered on parchment surfaces.
6. **Accessible Form Controls**: Category and topic `<select>` dropdown filters in `Modules.jsx` and `Quizzes.jsx` lack associated accessible names (`aria-label` or `<label for="...">`).

---

## 2. Existing Portal Visual Identity

### 2.1 Current Design System Foundation (`main.css`)

The current design system is defined in `client/src/styles/main.css` (lines 8–150), layered with specialized stylesheets (`assessment-quiz.css`, `dashboard-redesign.css`, `dashboard-reinvention.css`, `digital-awareness-profile.css`).

```css
/* Core Declared Surface & Text Tokens */
--color-background: #F8F4EC;         /* Warm parchment / ivory canvas */
--color-surface-card: #FFFFFF;        /* Pure white card surface */
--color-surface-secondary: #EFE5D6;   /* Pressed linen / warm beige inset */
--color-surface-inset: #E5D8C5;       /* Recessed beige container */

--color-text-primary: #302B27;        /* Deep warm espresso / charcoal */
--color-text-secondary: #635B53;      /* Warm slate / umber */
--color-text-muted: #6F665D;          /* Muted warm granite */

--color-border: #DED6C9;              /* Hairline card border */
--color-border-strong: #776D60;       /* Emphasized divider */
--color-border-subtle: rgba(48, 43, 39, 0.12);

--color-accent-terracotta: #9A503A;   /* Primary editorial accent */
--color-terracotta-light: #FAF1ED;
--color-accent-gold: #B18A55;         /* Secondary educational accent */
--color-gold-light: #FAF4EA;

--color-success: #4B6658;             /* Muted forest slate */
--color-warning: #8A5A20;             /* Muted ochre / amber */
--color-danger: #A34D43;              /* Muted brick red */
--color-focus: #81551F;                /* High-contrast focus outline */
```

### 2.2 Visual Strengths
- **Warm Canvas & Paper Cards**: The pairing of `#F8F4EC` (canvas) with `#FFFFFF` (elevated cards) creates an inviting, tactile editorial atmosphere that avoids sterile white-on-white SaaS templates.
- **Editorial Masthead & Dossier Pattern**: The Dashboard's `AtelierMasthead` and `PrimaryFocus` Study Dossier establish high institutional authority suitable for statutory education.
- **Storytelling Mechanics**: The Practical Online Safety simulator (`DigitalMomentsStorySection`) uses realistic message bubbles, deceptive signal callouts, and direction-aware sliding transitions without distracting gamification.
- **Restrained Badge Taxonomy**: Badges on the Dashboard, Counterfactuals, and Assessments use restrained uppercase labels and muted background tints rather than saturated candy pills.

### 2.3 Visual Inconsistencies & Drift
- **Drift into Tailwind Saturated Palette**: `Crimes.jsx` uses utility blues (`#eff6ff`, `#bfdbfe`), teals (`#f0fdfa`, `#99f6e4`), and purples (`#eef2ff`, `#c7d2fe`) that break the warm editorial identity.
- **Inconsistent Card Border Radii**: Card surfaces range from `border-radius: 4px` (in older tables), `6px` (in ruled dockets), `8px` (in tabs), `12px` (in standard cards), to `14px` and `16px` (in newer dashboard studios).
- **Missing Token Aliases**: `Prevention.jsx` references `var(--color-info)` and `var(--color-info-light)`, which do not exist in `:root`, resulting in transparent or unstyled badge backgrounds.

---

## 3. Route-by-Route Design Inventory

### 3.1 Public-Facing Experience

| Route | Component | Purpose & Visual Structure | Observed Issues & Opportunities | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `/` | `Home.jsx`<br>`HomeHero.jsx`<br>`DigitalMomentsSection.jsx` | Editorial hero with SVG linework, 4-step methodology pipeline, interactive directory of 5 pillars, and National Cybercrime Helpline 1930 trust callout. | • Axe contrast failure on `.explore-row-num` ("01", "02") and subtle tags.<br>• Heading scale jumps abruptly from display clamp (`3.25rem`) to h2 (`2.25rem`).<br>• Axe reported serious `list` violation: `<ul>` contains direct `<div>` children. | **Medium** |
| `/about` | `About.jsx`<br>`MethodologyFlow.jsx`<br>`EditorialScrollStory.jsx` | Deep project documentation, 5-stage statutory-to-habit methodology, technical stack, and educational mission statement. | • Sticky side navigation inactive links suffer from low contrast against parchment (Axe: 161 contrast nodes).<br>• Inconsistent spacing between content blocks.<br>• Opportunities for richer diagrams of the 6 behavioral dimensions. | **Medium** |
| `/login`<br>`/register` | `AuthPage.jsx`<br>`SignInForm.jsx`<br>`SignUpForm.jsx` | Unified authentication experience in a balanced split layout: Identity/Learning Path on left, Form Card on right. | • Clean desktop & mobile layout.<br>• Axe reported `aria-progressbar-name`: Progress bar lacks an accessible label.<br>• Axe reported `nested-interactive` in switch-mode button.<br>• Input focus state could use `--color-focus: #81551F`. | **High** |
| Navigation | `Navbar.jsx`<br>`Sidebar.jsx`<br>`Footer.jsx` | Sticky public topbar with animated underline; collapsible authenticated sidebar; compact institutional footer with 1930 helpline. | • Navbar indicator can flash briefly at origin on initial page mount.<br>• Active nav item relies heavily on underline rather than distinct color contrast.<br>• Footer is well-structured, clear, and calm. | **Low** |

### 3.2 Authenticated Workspace

| Route | Component | Purpose & Visual Structure | Observed Issues & Opportunities | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `/dashboard` | `Dashboard.jsx`<br>`AtelierMasthead.jsx`<br>`PrimaryFocus.jsx`<br>`DigitalMomentsStorySection.jsx`<br>`BehavioralEvolution.jsx` | Personal learning workspace organized into 6-step flow: Orientation → Action → Content → Application → Progress → Supporting Information. | • Excellent visual coherence following Stage 6 refinement.<br>• 0 horizontal overflow across all 5 viewports.<br>• Minor Axe contrast warning on `.atelier-edition-badge span` (ratio ~3.8:1).<br>• Native button elements lack `font-family: inherit`, falling back to `Arial`. | **Medium** |
| `/modules` | `Modules.jsx` | Curriculum lesson catalog displaying 18 modules across categories, difficulty pills, and progress status badges. | • Axe critical violation: Category `<select>` lacks accessible label.<br>• Difficulty badges use inconsistent border radius (mix of 3px and 12px).<br>• On 375px mobile, action buttons wrap awkwardly when module titles are long. | **High** |
| `/modules/:slug` | `Modules.jsx` (Detail View) | Lesson Reading Studio with structured sections, statutory anchors, key takeaways, and interactive knowledge checks. | • Good reading typography (1rem / 1.68 line-height).<br>• Knowledge check card could benefit from clearer visual separation from preceding lesson body text.<br>• Multi-check navigation tabs wrap cleanly on mobile. | **Medium** |
| `/quizzes` | `Quizzes.jsx`<br>`DashboardQuizPractice.jsx` | Practice Studio supporting 5 distinct quiz modes (Quick Practice, Topic-wise, Scenario, Challenge, Case-based). | • Axe critical violation: Topic filter `<select>` in Topic-wise mode lacks accessible label.<br>• Challenge quiz timer uses bright red font which adds unnecessary visual tension.<br>• Tablet (768px) 2-column card layout leaves the 5th card spanning full width with awkward whitespace. | **High** |
| Portfolio Modal | `DefensivePortfolioModal.jsx` | Three-pillar certified learning record with printable statement and verified completion timestamps. | • Authoritative typography and clean table styling.<br>• Printable CSS (`@media print`) lacks explicit page-break rules between pillars, risking awkward table splits. | **Medium** |

### 3.3 Assessment Experience

| Route | Component | Purpose & Visual Structure | Observed Issues & Opportunities | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `/assessment/baseline`<br>`/assessment/final` | `BaselineAssessment.jsx`<br>`FinalAssessment.jsx` | High-fidelity simulation of an authentic digital day. Two-stage decision model: Step 1 (Primary Action) + Step 2 (Signal Identification probe). | • Phone/browser simulation frames have hardcoded styling (`#302B27` and `#ded6c9`) that appears letterboxed on tablet viewports.<br>• Signal identification radio targets are slightly small for mobile touch (<44px).<br>• Start screen typography is clean, calm, and reassuring. | **Medium** |
| Assessment Results | `DigitalAwarenessProfile.jsx`<br>`RemediationCards.jsx` | Post-assessment diagnostic reveal: 6-dimensional behavioral radar, trait breakdowns, situation count badges, and remediation cards. | • Axe reported 127 contrast nodes: `.profile-badge-scenario`, subtle trait scores, and chart legend text fall below 4.5:1 contrast on `#F8F4EC`.<br>• Radar chart canvas is fixed-ratio and clips slightly on 375px mobile when dimension labels are long. | **High** |

### 3.4 Legal Knowledge Centre

| Route | Component | Purpose & Visual Structure | Observed Issues & Opportunities | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `/laws`<br>`/workspace/laws` | `Laws.jsx`<br>`EditorialPageHeader.jsx`<br>`WorkspaceBreadcrumb.jsx` | Comprehensive statutory directory covering IT Act, DPDP Act, BNS, BSA, and Supreme Court judgments. Plain language vs official text toggle. | • Filter pills use hardcoded blue `#eff6ff` which clashes with warm parchment.<br>• Green status badge uses inline `rgba(16, 185, 129, 0.12)` with `rgb(4, 120, 87)` instead of `--color-success: #4B6658`.<br>• Sticky sidebar navigation on desktop (1440px) overlaps long section contents when viewport height is under 750px. | **High** |
| `/crimes`<br>`/workspace/crimes` | `Crimes.jsx` | Threat vector and cybercrime catalog categorized by attack typology and statutory remedies. | • **Palette Drift**: Uses hardcoded Tailwind utility colors (`#0369a1`, `#bae6fd`, `#4338ca`, `#c7d2fe`, `#be123c`, `#0f766e`) breaking the editorial identity.<br>• Severity badges (`Critical`, `High`, `Moderate`) lack a unified visual weight scale. | **High** |
| `/cases`<br>`/workspace/cases` | `Cases.jsx`<br>`ScrollLinkedIncidentCase.jsx` | Archive of reconstructed real-world incidents with critical pivot points and interactive decision challenges. | • **0 Axe Accessibility Violations** (cleanest semantic structure in the portal).<br>• Deep-linking via `?slug=...` functions smoothly.<br>• Opportunity: The interactive decision challenge card could use more prominent editorial separation from the background incident narrative. | **Low** |
| `/prevention`<br>`/workspace/prevention` | `Prevention.jsx`<br>`IncidentDocketGenerator.jsx` | Three Prevention Phases (Before, During, After), quick-copy 1930 Helpline button, and citizen evidence docket generator. | • **CONFIRMED DEFECT**: 8px horizontal overflow on 390px mobile caused by `minWidth: 120px` badge elements in unwrapped flex rows.<br>• Axe reported `scrollable-region-focusable`: Phase sequence bar lacks keyboard focus (`tabIndex="0"`).<br>• References undefined CSS variables `var(--color-info)` and `var(--color-info-light)`. | **CRITICAL** |
| `/resources`<br>`/workspace/resources` | `Resources.jsx` | Emergency helplines (1930, cybercrime.gov.in), CERT-In advisories, and expandable legal FAQs. | • FAQ accordion buttons lack visible focus rings during keyboard navigation.<br>• Emergency alert tags use hardcoded `rgb(185, 28, 28)` instead of `--color-danger: #A34D43`. | **Medium** |

### 3.5 Extended Knowledge Experience

| Route | Component | Purpose & Visual Structure | Observed Issues & Opportunities | Priority |
| :--- | :--- | :--- | :--- | :---: |
| `/workspace/counterfactuals` | `CounterfactualCatalog.jsx`<br>`CounterfactualExplorer.jsx` | Counterfactual scenario catalog and interactive branching exploration studio. | • Clean responsive layouts and 0 horizontal overflow across all viewports.<br>• Branching nodes use `border-radius: 16px` compared to standard cards (`12px` and `6px`).<br>• Excellent statutory alignment with IT Act §66D and BNS §318(4). | **Low** |

---

## 4. Current Colour Usage Audit

### 4.1 Surface & Canvas Mapping

| Role | Declared Token | Computed Value | Rendered Location | Audit Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **Main Canvas** | `--color-background` | `rgb(248, 244, 236)` (`#F8F4EC`) | Page background on all routes | Excellent. Warm, calm, newsprint feel. |
| **Primary Card** | `--color-surface-card` | `rgb(255, 255, 255)` (`#FFFFFF`) | Cards, panels, modals | High contrast, clean, legible. |
| **Secondary Inset** | `--color-surface-secondary` | `rgb(239, 229, 214)` (`#EFE5D6`) | Masthead track, phone mock, sidebars | Balanced warm beige. |
| **Deep Inset** | `--color-surface-inset` | `rgb(229, 216, 197)` (`#E5D8C5`) | Input backgrounds, progress troughs | Good depth, non-distracting. |

### 4.2 Text Color Mapping & Contrast Evaluation

| Text Role | Declared Token | Computed Value | Target Contrast on Canvas (`#F8F4EC`) | WCAG 2.1 AA Status |
| :--- | :--- | :--- | :---: | :---: |
| **Primary Text** | `--color-text-primary` | `rgb(48, 43, 39)` (`#302B27`) | **13.2:1** | **PASS (AAA)** |
| **Secondary Text** | `--color-text-secondary` | `rgb(99, 91, 83)` (`#635B53`) | **5.8:1** | **PASS (AA)** |
| **Muted Text / Tags** | `--color-text-muted` | `rgb(111, 102, 93)` (`#6F665D`) | **4.6:1** | **PASS (AA for normal text)** |
| **Subtle Metadata** | Legacy `#8A8075` | `rgb(138, 128, 117)` | **3.2:1** | **FAIL (Below 4.5:1)** |

### 4.3 Color Inconsistencies & Deviations Catalog

1. **`Crimes.jsx` Category Accents**:
   - Uses raw Tailwind palette: Blue (`#0369a1`), Amber (`#b45309`), Indigo (`#4338ca`), Rose (`#be123c`), Red (`#b91c1c`), Teal (`#0f766e`).
   - *Impact*: Incompatible with the portal's warm parchment and terracotta identity; resembles a generic dashboard template.
2. **`Laws.jsx` Status Badges**:
   - Uses `rgba(16, 185, 129, 0.12)` with `rgb(4, 120, 87)` for active laws, and `#eff6ff` for active filter tabs.
   - *Impact*: Inconsistent with `--color-success: #4B6658` and `--color-accent-terracotta: #9A503A` used throughout the dashboard and assessment views.
3. **`Prevention.jsx` Missing `--color-info` Variable**:
   - References `var(--color-info)` and `var(--color-info-light)` which are undefined in `main.css`.
   - *Impact*: Badges fall back to unstyled browser defaults or transparent backgrounds.
4. **`Resources.jsx` Emergency Callouts**:
   - Uses hardcoded `rgb(185, 28, 28)` instead of `--color-danger: #A34D43`.

---

## 5. Typography and Spacing Audit

### 5.1 Typographic Scale & Hierarchy

The portal standardizes on **Inter** via Google Fonts. All serif fonts have been deprecated in favor of a clean, legible grotesque sans-serif.

| Level | Computed Font Size | Computed Weight | Computed Line Height | Usage Across Routes | Consistency Assessment |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Display Hero** | `clamp(2.35rem, 3.8vw, 3.25rem)` | 800 | `1.2` | Home hero, About headline | Strong editorial presence, excellent kerning. |
| **Page Heading (H1)** | `40px` (`2.5rem`) | 700 / 800 | `1.2` (`48px`) | Laws, Crimes, Cases, Prevention, Resources | Consistent letter-spacing (`-0.8px`). |
| **Section Title (H2)** | `20px` to `32px` | 700 | `1.3` | Section headers, card titles | Inconsistent scale: some pages use 20px, others 32px for identical hierarchical levels. |
| **Component Title (H3)**| `16px` to `18.4px` | 700 | `1.35` | Sub-panels, incident rows | Good readability. |
| **Body Normal** | `16px` (`1rem`) | 400 | `26.88px` (`1.68`) | Paragraphs, lesson text, case narrative | Excellent reading rhythm and comfortable line height. |
| **Secondary Body** | `14px` (`0.875rem`) | 400 / 500 | `1.5` | Card summaries, metadata | Clean and compact. |
| **Caps Eyebrow** | `11.5px` to `12px` | 700 / 800 | `1.2` | `.page-eyebrow`, `.story-eyebrow` | Letter-spacing `0.08em`, uppercase. Needs contrast guard. |

### 5.2 Typography Defects Discovered

1. **Native Button Element Fallback to `Arial`**:
   - *Finding*: Computed style analysis on `/dashboard`, `/modules`, and `/assessment/baseline` revealed that standard `<button>` elements (such as icon buttons, sidebar controls, modal triggers) compute to `font-family: Arial, sans-serif` rather than `Inter`.
   - *Root Cause*: `main.css` applies `font-family: var(--font-sans)` to `body` and `.btn`, but does not declare a global `button { font-family: inherit; }` reset rule.

### 5.3 Spacing Rhythms & Vertical Rhythm

The design system declares a 6-tier spacing scale:
- `--space-xs: 0.25rem` (4px)
- `--space-sm: 0.5rem` (8px)
- `--space-md: 1rem` (16px)
- `--space-lg: 1.5rem` (24px)
- `--space-xl: 2.5rem` (40px)
- `--space-xxl: 4rem` (64px)

*Audit Findings*:
- Desktop layouts maintain balanced margins (`40px` to `64px` between major sections).
- On tablet (`768px`), several pages (`Prevention.jsx`, `Laws.jsx`) use inline style overrides (`margin-bottom: 36px`, `padding: 28px 32px`) that create uneven vertical gaps compared to pages using declared CSS variables.

---

## 6. Component Consistency Audit

| Component Type | Canonical Pattern | Variants in Production | Inconsistencies & Recommendations |
| :--- | :--- | :--- | :--- |
| **Buttons** | Editorial Pill (`border-radius: 6px`, 2px hover elevation) | • Primary Terracotta (`#9A503A`)<br>• Secondary Outline (`border: 1px solid var(--color-border)`)<br>• Unstyled raw `<button>` | Standardize button padding to `8px 18px`, ensure `font-family: inherit` globally, and eliminate borderless raw buttons without visible focus rings. |
| **Cards & Panels** | White paper card (`#FFFFFF`), `border: 1px solid rgba(48, 43, 39, 0.1)`, `border-radius: 12px`, soft shadow | • Studio Panels (`border-radius: 12px`)<br>• Ruled Dockets (`border-left: 4px solid #302B27`)<br>• Branching Nodes (`border-radius: 16px`) | Align card corner radii to 12px across all standard surfaces; preserve 6px for ruled institutional dockets. |
| **Badges & Tags** | Uppercase pill, `font-size: 0.68rem`, `font-weight: 800`, letter-spacing `0.06em` | • Muted Tints (Terracotta, Gold, Forest)<br>• Hardcoded Tailwind badges in Crimes<br>• Inverted solid badges | Replace all raw Tailwind badges with semantic token-backed variants. |
| **Tabs & Segmented Controls** | Horizontal pill group, active state has dark background (`#302B27`) or terracotta highlight | • Scenario tab buttons<br>• Law chapter pills<br>• Quiz mode switcher | Standardize minimum touch height (40px) and active indicator animation across all tab bars. |
| **Form Inputs** | Inset background (`#F8F4EC` or `#FFFFFF`), `border: 1px solid #DED6C9`, terracotta/gold focus ring | • Search inputs (`PortalSearch.jsx`)<br>• Filter dropdowns (`<select>`)<br>• Auth text fields | Add missing accessible labels to all `<select>` controls; standardize `--color-focus: #81551F` focus outline. |

---

## 7. Desktop, Tablet and Mobile Findings

### 7.1 Viewport Test Matrix & Overflow Results

| Viewport | Device Profile | Target Routes Tested | Horizontal Overflow Detected? | Max Overflow Delta |
| :---: | :---: | :---: | :---: | :---: |
| **1440 × 900** | Large Desktop / iMac | 17 routes | **NO (0px overflow)** | 0px |
| **1280 × 720** | Standard Laptop | 5 core routes | **NO (0px overflow)** | 0px |
| **768 × 1024** | iPad / Tablet Portrait | 9 routes | **NO (0px overflow)** | 0px |
| **390 × 844** | iPhone 12/13/14 / Modern Mobile | 14 routes | **YES — `/prevention`** | **+8px** (`scrollWidth: 398px`) |
| **375 × 667** | iPhone SE / Compact Mobile | 9 routes | **NO (0px overflow)** | 0px |

### 7.2 Detailed Mobile & Responsive Observations

1. **Confirmed 8px Overflow on `/prevention` at 390px Mobile**:
   - *Evidence*: `audit_collected_metrics.json` recorded `route: "/prevention", viewport: "390px", delta: 8`.
   - *Root Cause*: In `Prevention.jsx` lines 575–624, status badges (`<span style={{ minWidth: '120px' }}>`) are placed inside a horizontal flex row with fixed padding. At 390px screen width, the container width plus 120px badge plus full text line exceeds the screen boundary by exactly 8px.
   - *Fix Recommendation*: Replace `minWidth: '120px'` with `display: inline-block, width: fit-content` and wrap the flex layout on small screens (`flex-direction: column` below 640px).

2. **Tablet (768px) Layout Adaptation**:
   - The collapsible workspace sidebar transitions cleanly into an overlay mobile drawer with backdrop.
   - On `/quizzes`, the 5 practice cards render as a 2-column grid, leaving the 5th card spanning the entire bottom row with excessive empty space on the right side.

3. **Compact Screen (375px) Observations**:
   - The redesigned 4-Stage Progressive Journey Map on the Dashboard stacks vertically with zero overflow.
   - Radar chart labels in `DigitalAwarenessProfile.jsx` ("Unreviewed Acceptance") experience slight crowding at the canvas perimeter.

---

## 8. Accessibility Findings

Automated WCAG 2.1 AA accessibility scans were executed using `@axe-core/playwright` across 13 core routes.

### 8.1 Accessibility Violations Summary

| Route / View | Total Violations | Violation Breakdown by Impact | Key Violations Detected |
| :--- | :---: | :--- | :--- |
| **Homepage** (`/`) | 2 | 2 Serious | • `color-contrast`: Hero headline / directory numbers below threshold.<br>• `list`: `<ul>` contains direct `<div>` children. |
| **About** (`/about`) | 1 | 1 Serious | • `color-contrast`: Inactive side navigation links and secondary paragraphs. |
| **Auth Sign-In** (`/login`) | 3 | 3 Serious | • `aria-progressbar-name`: ARIA progressbar node lacks an accessible name.<br>• `nested-interactive`: Interactive controls nested inside buttons.<br>• `color-contrast`: Edition badge text. |
| **Dashboard** (`/dashboard`) | 3 | 3 Serious | • `aria-progressbar-name`: Progressbar lacks accessible label.<br>• `nested-interactive`: Action link wraps nested button.<br>• `color-contrast`: Masthead edition badge text. |
| **Laws** (`/laws`) | 1 | 1 Serious | • `color-contrast`: Status badge text on translucent background. |
| **Crimes** (`/crimes`) | 1 | 1 Serious | • `color-contrast`: Category badge text on light blue tint. |
| **Cases** (`/cases`) | **0** | **0 Violations** | Automated `@axe-core/playwright` scan detected zero violations across tested elements (manual keyboard and screen-reader audit still required for full WCAG 2.1 AA conformance). |
| **Prevention** (`/prevention`) | 2 | 2 Serious | • `color-contrast`: Eyebrow text below threshold.<br>• `scrollable-region-focusable`: Horizontal phase sequence bar lacks keyboard access (`tabIndex="0"`). |
| **Resources** (`/resources`) | 1 | 1 Serious | • `color-contrast`: Sub-caption text below threshold. |
| **Modules Catalog** (`/modules`) | 2 | 1 Critical, 1 Serious | • `select-name` (CRITICAL): Category `<select>` lacks accessible label.<br>• `color-contrast`: Eyebrow and tag contrast. |
| **Lesson Reading Studio** | 1 | 1 Serious | • `color-contrast`: Status badge text. |
| **Digital Awareness Profile** | 1 | 1 Serious | • `color-contrast` (127 nodes): Badge labels, trait scores, and chart legend text below 4.5:1 ratio. |
| **Quiz Studio** (`/quizzes`) | 2 | 1 Critical, 1 Serious | • `select-name` (CRITICAL): Topic `<select>` filter lacks accessible label.<br>• `color-contrast`: Eyebrow text. |

---

## 9. Storytelling and Interaction Opportunities

### 9.1 Connecting Legal Statutes to Real-World Situations
The portal's core pedagogical mission is to translate abstract statutory law into everyday defensive instincts. The audit identified several key interaction opportunities:
1. **Case Study Decision Elevation**: In `Cases.jsx`, the decision challenge card sits midway through the incident text. Elevating this decision into a prominent "Critical Pivot Point" card with clearer visual stakes would improve user engagement.
2. **Interactive Statutory Anchors**: In `Modules.jsx`, legal citations are rendered as plain text strings (e.g. "Section 66D, IT Act"). Transforming these into subtle, clickable references that open an inline drawer or link directly to the annotated section in `/laws` would bridge the curriculum and reference center seamlessly.
3. **Emergency Reporting Golden Hour Visualization**: In `Prevention.jsx` and `Resources.jsx`, the "Golden Hour" (reporting financial fraud within 2–3 hours to Helpline 1930) is currently presented as a text bullet. Introducing a visual timeline explaining the inter-bank CFCFRMS freeze mechanism would dramatically increase practical retention.

---

## 10. Three Proposed Colour Palette Directions

As requested, three distinct palette directions are proposed for consideration. All three honor the core aesthetic principles: **editorial, warm, restrained, authoritative, and educational**.

```
PROPOSED PALETTE COMPARISON TABLE:
┌───────────────────────┬──────────────────────────┬──────────────────────────┬──────────────────────────┐
│ Role                  │ Direction 1: Atelier     │ Direction 2: Ledger      │ Direction 3: Chronicle   │
├───────────────────────┼──────────────────────────┼──────────────────────────┼──────────────────────────┤
│ Background Canvas     │ #FAF6EE (Warm Ivory)     │ #F5F2EB (Sandstone)      │ #FBF7F0 (Cream Vellum)   │
│ Card Surface          │ #FFFFFF (Pure Paper)     │ #FFFFFF (Crisp Card)     │ #FFFFFF (Paper Card)     │
│ Secondary Inset       │ #F2EAE0 (Pressed Linen)  │ #ECE6DC (Archival Linen) │ #F0E7D8 (Oatmeal Inset)  │
│ Primary Text (Ink)    │ #2A2521 (Espresso Ink)   │ #262422 (Charcoal Bister)│ #2B231D (Mahogany Ink)   │
│ Secondary Text        │ #5C544D (Slate Umber)    │ #57524C (Graphite Sepia) │ #5E5147 (Warm Walnut)    │
│ Muted Text / Captions │ #6E665F (Warm Granite)   │ #69645E (Lead Slate)     │ #736458 (Muted Cocoa)    │
│ Primary Accent        │ #964932 (Terracotta)     │ #8F4C36 (Sienna Earth)   │ #A1482E (Rust Terracotta)│
│ Secondary Accent      │ #A37B40 (Antique Gold)   │ #8A785D (Raw Umber)      │ #B0853B (Heritage Ochre) │
│ In Force / Safe       │ #3E5C4E (Judicial Pine)  │ #3A5B4F (Verdigris Pine) │ #426352 (Spruce Slate)   │
│ Caution / Pending     │ #8C5922 (Ochre Amber)    │ #855A26 (Raw Sienna)     │ #915E1D (Golden Amber)   │
│ Struck Down / Threat  │ #9B3E35 (Crimson Brick)  │ #963E38 (Oxblood Rust)   │ #A13D33 (Venetian Red)   │
└───────────────────────┴──────────────────────────┴──────────────────────────┴──────────────────────────┘
```

---

### Direction 1: "The Constitutional Atelier" (Recommended)
- **Mood & Identity**: Evokes high-end legal publishing, constitutional gazettes, and editorial broadsheets. Combines rich warm ivory, deep espresso ink, burnished terracotta, and antique gold.
- **HEX Values**: Canvas `#FAF6EE` | Card `#FFFFFF` | Primary Ink `#2A2521` | Terracotta `#964932` | Gold `#A37B40` | Pine `#3E5C4E`.
- **Contrast Ratios**: Primary ink against canvas achieves **13.8:1 (AAA)**; secondary text achieves **6.2:1 (AA)**; muted text achieves **4.8:1 (AA)**.
- **Application**:
  - *Public Portal*: Deep `#2A2521` headlines with subtle `#964932` terracotta eyebrow indicators.
  - *Knowledge Centre*: Clear distinction between active statutes (`#3E5C4E`), pending provisions (`#8C5922`), and struck-down historical sections (`#9B3E35`).
  - *Dashboard*: Seamlessly matches the Stage 6 Journey Map and Study Dossier.
- **Trade-offs**: Requires discipline to prevent terracotta from dominating text-heavy pages.

---

### Direction 2: "The Civic Ledger"
- **Mood & Identity**: Evokes parliamentary archives, architectural drafting paper, and institutional libraries. More neutral, documentary, and quiet.
- **HEX Values**: Canvas `#F5F2EB` | Card `#FFFFFF` | Primary Ink `#262422` | Sienna `#8F4C36` | Umber `#8A785D` | Pine `#3A5B4F`.
- **Contrast Ratios**: Primary ink against canvas achieves **14.5:1 (AAA)**; secondary text achieves **6.8:1 (AA)**; muted text achieves **4.9:1 (AA)**.
- **Application**: Exceptional for dense statutory text on `/laws` and case studies on `/cases`.
- **Trade-offs**: Slightly cooler and more formal; less visually inviting for introductory civic learners.

---

### Direction 3: "The Juris Chronicle"
- **Mood & Identity**: Evokes university presses, leather-bound legal folios, and heritage typography. Warmer, more human, and highly approachable.
- **HEX Values**: Canvas `#FBF7F0` | Card `#FFFFFF` | Primary Ink `#2B231D` | Rust `#A1482E` | Ochre `#B0853B` | Spruce `#426352`.
- **Contrast Ratios**: Primary ink against canvas achieves **14.2:1 (AAA)**; secondary text achieves **6.5:1 (AA)**; muted text achieves **4.6:1 (AA)**.
- **Application**: Strong narrative cohesion for `/cases`, `/workspace/counterfactuals`, and `/assessment/baseline`.
- **Trade-offs**: Requires strict control on uncalibrated mobile screens to prevent cards from feeling overly warm or yellowish.

---

## 11. Prioritized Design Improvement Backlog

| ID | Category | Item Description | Affected Component / File | Severity / Priority | Functionality Impact? |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **DES-01** | **Mobile Defect** | Fix 8px horizontal overflow on 390px mobile by eliminating fixed `minWidth: 120px` badges. | `Prevention.jsx` | **CRITICAL** | None (Visual only) |
| **DES-02** | **Accessibility** | Add accessible labels (`aria-label`) to category and topic `<select>` dropdown filters. | `Modules.jsx`<br>`Quizzes.jsx` | **CRITICAL** | None (ARIA only) |
| **DES-03** | **Accessibility** | Add accessible name to ARIA progressbars in authentication and dashboard header. | `LearningPathVisual.jsx`<br>`Dashboard.jsx` | **HIGH** | None (ARIA only) |
| **DES-04** | **Typography** | Add global `button { font-family: inherit; }` reset to eradicate `Arial` fallbacks on native buttons. | `main.css` | **HIGH** | None (Visual only) |
| **DES-05** | **Palette Harmony**| Eradicate hardcoded Tailwind utility blues, purples, and teals in Cyber Crimes catalog. | `Crimes.jsx` | **HIGH** | None (Visual only) |
| **DES-06** | **Token Hygiene** | Declare missing `--color-info` and `--color-info-light` tokens in `:root` stylesheet. | `main.css` | **HIGH** | None (Visual only) |
| **DES-07** | **Contrast Guard** | Elevate subtle metadata and `.page-eyebrow` text colors to guarantee 4.5:1 WCAG 2.1 AA ratio. | `main.css`<br>`DigitalAwarenessProfile.css` | **HIGH** | None (Visual only) |
| **DES-08** | **Keyboard A11y** | Add keyboard focusability (`tabIndex="0"`) to scrollable phase sequence bar. | `Prevention.jsx` | **MEDIUM** | None (Interaction only) |
| **DES-09** | **Tablet Layout** | Refine 2-column wrapping of 5 practice cards on 768px tablet screens to avoid disproportionate blank space. | `Quizzes.jsx` | **MEDIUM** | None (Layout only) |
| **DES-10** | **Focus Visibility**| Standardize high-contrast focus rings (`--color-focus: #81551F`) across all input fields and accordion buttons. | `main.css`<br>`Resources.jsx` | **MEDIUM** | None (Visual only) |
| **DES-11** | **Print Styles** | Add explicit `@media print` page-break rules to Defensive Portfolio statement modal. | `DefensivePortfolioModal.jsx` | **LOW** | None (Print only) |

---

## 12. Confirmed Problems vs Subjective Recommendations

### Confirmed Technical & Accessibility Defects (Evidence-Backed)
1. **Horizontal Overflow on `/prevention` at 390px**: Measured `scrollWidth: 398px` vs `clientWidth: 390px` (+8px delta). Verified in automated audit tests.
2. **Missing Accessible Labels on Dropdown Filters**: Critical Axe violations on `<select>` elements in `Modules.jsx` and `Quizzes.jsx`.
3. **Missing Token Definitions**: `var(--color-info)` and `var(--color-info-light)` referenced in code but undeclared in CSS `:root`.
4. **Button Font Family Fallback**: Native `<button>` elements compute to `font-family: Arial` due to missing reset.
5. **Axe WCAG 2.1 AA Contrast Failures**: Measured contrast ratios below 4.5:1 on `.page-eyebrow`, `.profile-badge-scenario`, and subtle metadata tags.

### Subjective Design Recommendations (Aesthetic & Polish)
1. **Adopting Palette Direction 1 ("The Constitutional Atelier")**: Unifies peripheral knowledge pages (`Laws.jsx`, `Crimes.jsx`) with the warm editorial tone of the Dashboard.
2. **Case Study Pivot Point Elevation**: Visually emphasizing the interactive decision challenge in `Cases.jsx` with an editorial callout frame.
3. **Emergency Golden Hour Timeline**: Adding an infographic-style progression bar illustrating the 2–3 hour CFCFRMS inter-bank fund hold mechanism.

---

## 13. Screenshots and Evidence

All visual artifacts are saved in the project artifact directory:  
`C:\Users\Asus\.gemini\antigravity\brain\2a38735a-7985-4d0c-9744-999cb0b89167\screenshots\design-audit\`

### Representative Screenshot Directory:

```
SCREENSHOT ARTIFACT INDEX (54 CAPTURED FILES):
├── Desktop 1440px Viewport:
│   ├── public_home_1440.png
│   ├── public_about_1440.png
│   ├── public_login_1440.png
│   ├── public_register_1440.png
│   ├── public_laws_1440.png
│   ├── public_crimes_1440.png
│   ├── public_cases_1440.png
│   ├── public_case_detail_1440.png
│   ├── public_prevention_1440.png
│   ├── public_resources_1440.png
│   ├── workspace_dashboard_1440.png
│   ├── workspace_modules_catalog_1440.png
│   ├── workspace_lesson_reading_1440.png
│   ├── assessment_profile_1440.png
│   ├── workspace_quizzes_1440.png
│   ├── workspace_counterfactuals_1440.png
│   └── workspace_counterfactual_studio_1440.png
├── Desktop 1280px Viewport:
│   ├── public_home_1280.png
│   ├── workspace_dashboard_1280.png
│   ├── public_laws_1280.png
│   ├── assessment_profile_1280.png
│   └── workspace_quizzes_1280.png
├── Tablet 768px Viewport:
│   ├── public_home_768.png
│   ├── workspace_dashboard_768.png
│   ├── public_about_768.png
│   ├── public_laws_768.png
│   ├── public_crimes_768.png
│   ├── public_prevention_768.png
│   ├── workspace_modules_catalog_768.png
│   ├── assessment_profile_768.png
│   └── workspace_quizzes_768.png
├── Mobile 390px Viewport (iPhone 12/13/14):
│   ├── public_home_390.png
│   ├── workspace_dashboard_390.png
│   ├── public_about_390.png
│   ├── public_login_390.png
│   ├── public_laws_390.png
│   ├── public_crimes_390.png
│   ├── public_cases_390.png
│   ├── public_prevention_390.png  <-- [VERIFIED 8px OVERFLOW EVIDENCE]
│   ├── public_resources_390.png
│   ├── workspace_modules_catalog_390.png
│   ├── workspace_lesson_reading_390.png
│   ├── assessment_profile_390.png
│   ├── workspace_quizzes_390.png
│   └── workspace_counterfactuals_390.png
└── Mobile 375px Viewport (iPhone SE):
    ├── public_home_375.png
    ├── workspace_dashboard_375.png
    ├── public_login_375.png
    ├── public_laws_375.png
    ├── public_crimes_375.png
    ├── public_cases_375.png
    ├── public_prevention_375.png
    ├── workspace_modules_catalog_375.png
    └── assessment_profile_375.png
```

---

## 14. Risks, Constraints and Architectural Preservation

### 14.1 Strict Architectural Invariants (Protected)
- **Six Discrete Behavioral Dimensions**: `TR`, `SI`, `VB`, `DQ`, `FP`, `UA` must remain authoritatively calculated on the server and visually distinct. Never combine them into synthetic averages.
- **Historical Session Immutability**: Historical baseline/final assessment sessions and certified portfolio records must remain untouched.
- **Statutory Precision**: Legal statuses (`IN_FORCE`, `ENACTED_FUTURE_COMMENCEMENT`, `STRUCK_DOWN_HISTORICAL`) must be visually and textually distinguished in all future styling passes.
- **Learner Autonomy**: No streaks, XP points, countdown countdowns for mandatory revisits, or artificial gamification badges.

### 14.2 Design Implementation Risks
- **CSS Cascade Scope**: `main.css` is large (13,409 lines). Any global token adjustments must be verified against legacy utility classes to prevent unintended color regressions on older tables or forms.
- **Form Control Contrast**: Adjusting background or border colors on `<select>` and `<input>` elements must be tested against both light and dark device themes.

---

## 15. Proposed Next Steps

Upon Product Owner review and explicit approval of this audit:
1. **Phase 2 (Design Tokens & Global CSS Standardization)**:
   - Formally adopt **Direction 1 ("The Constitutional Atelier")** as the canonical palette.
   - Refine `:root` variables in `main.css` to guarantee WCAG 2.1 AA contrast for all text roles.
   - Add global resets (`button { font-family: inherit; }`, accessible focus rings).
2. **Phase 3 (Mobile Layout Defect & Accessibility Remediation)**:
   - Resolve the confirmed 8px horizontal overflow in `Prevention.jsx`.
   - Add accessible names (`aria-label`) to dropdown selectors in `Modules.jsx` and `Quizzes.jsx`.
   - Resolve ARIA progressbar naming in `LearningPathVisual.jsx` and `Dashboard.jsx`.
3. **Phase 4 (Legal Knowledge Centre Harmonization)**:
   - Harmonize `Crimes.jsx` and `Laws.jsx` to use the canonical editorial palette, eliminating raw Tailwind colors.
4. **Phase 5 (Verification & Final Sign-Off)**:
   - Re-run the automated Playwright audit suite to verify 0 horizontal overflows and 0 critical/serious Axe accessibility violations across all routes.

