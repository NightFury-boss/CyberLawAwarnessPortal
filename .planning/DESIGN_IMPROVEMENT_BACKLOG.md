# Post-Development Design Improvement Backlog

**Status**: DEFERRED — DO NOT START DURING CURRENT ENGINEERING WORK  
**Governance Principle**: Technical & Educational Foundation First, Broad Visual Redesign Later  
**Scope**: Editorial UI/UX, Typography, Spacing, Storytelling, and Aesthetic Refinement  

---

## 1. Workstream Status & Operational Boundary

This document serves as the dedicated, standalone register for all visual design, layout, styling, and aesthetic improvements for the Cyber Law Awareness Portal.

> [!IMPORTANT]
> **Strict Separation of Workstreams**:  
> The Cyber Law Awareness Portal maintains two distinct, sequential priorities:  
> 1. **First Priority (Active Engineering)**: Build, harden, integrate, and technically validate the complete educational, architectural, assessment, and statutory foundation across Stages 1 through 6.  
> 2. **Second Priority (Deferred Design Cycle)**: Conduct a dedicated, holistic design improvement cycle to elevate the portal's visual polish, typography, editorial storytelling, and overall user experience.  
>  
> **Under no circumstances should items from this backlog be mixed into active engineering initiatives.**

---

## 2. Clarification of the Structural Freeze

The Milestone 3.3 Learner Experience Structural Freeze is **not** a permanent visual-design freeze.

- **What the Freeze Protects (Strict Invariants)**:
  - Canonical Learner Journey architecture (6 deterministic states).
  - Component ownership boundaries (`/dashboard`, `/assessment/baseline`, `/assessment/final`, `DigitalAwarenessProfile.jsx`, `PathwayRunner.jsx`).
  - Prerequisite enforcement and assessment security boundaries.
  - Server-authoritative scoring and historical session immutability.
- **What the Freeze Permits Later**:
  - A dedicated visual redesign pass once engineering is complete.
  - Typography, spacing, layout, color palette refinement, and responsive improvements.
  - Enhanced transitions, editorial storytelling, and interactive component polish.

*Genuine functional defects, accessibility blockers, or severe usability regressions may still be documented and resolved when justified during engineering; however, broad cosmetic overhauls remain strictly deferred to this workstream.*

---

## 3. Approved Aesthetic Direction & Anti-Patterns

### Core Visual Philosophy
- **Editorial & Restrained**: Clean visual hierarchy, thoughtful whitespace, balanced editorial layouts, consistent typography, and functional minimalism.
- **Warm & Authoritative**: A trustworthy, institutional, and educational aesthetic suitable for Indian statutory legal awareness.
- **Purposeful Interactions**: Subtle, high-performance visual feedback and transitions with pedagogical purpose.

### Prohibited Aesthetic Patterns (What to Avoid)
- **Generic SaaS Tropes**: Template-like card grids, random rounded containers, and excessive drop shadows.
- **Flashy Gamification**: Unnecessary badges, point confetti, flashing animations, and trivial achievement popups.
- **Cyberpunk & Neon**: Glowing neon borders, dark "hacker terminal" palettes, matrix text rain, and futuristic visual clichés.
- **Visual Clutter**: Unnecessary decorative illustrations, excessive gradients, and overcrowded container elements that sacrifice readability.

---

## 4. Deferred Design Improvement Registry

The following items are officially cataloged for the future design cycle:

### Category A: Dashboard & Authenticated Workspace
- **DB-1 (Atelier Masthead Polish)**: Refine typographic scale and date/time metadata formatting in `AtelierMasthead.jsx`.
- **DB-2 (PrimaryFocus Dossier Layout)**: Enhance the editorial presentation of the active learning focus area, optimizing button placement, status pills, and reading progress indicators.
- **DB-3 (Curriculum Lessons Grid)**: Improve card spacing, hover elevations, and constellation category tags in `CurriculumLessonsSection.jsx`.
- **DB-4 (Verified Defensive Portfolio Drawer)**: Redesign slide-out drawer layout, pillar separation, and credential typography in `PortfolioDrawer.jsx`.

### Category B: Assessment Simulators & Diagnostic Profile
- **AS-1 (Simulator Interface Framing)**: Polish phone, email, SMS, and browser simulated window frames in `BaselineAssessment.jsx` and `FinalAssessment.jsx` without neon styling.
- **AS-2 (Decision Option Cards)**: Refine padding, border treatment, and radio-option selection states for primary choices and signal identification probes.
- **AS-3 (Digital Awareness Profile Presentation)**: Elevate the editorial reveal in `DigitalAwarenessProfile.jsx`, improving radar/bar visualization, situation count badges, and unassessed neutral cards.
- **AS-4 (Remediation Recommendation Cards)**: Harmonize preview badges, category indicators, and action triggers in `RemediationCards.jsx`.

### Category C: Public Legal Knowledge & Reference Center
- **PL-1 (Laws Reference Center)**: Refine statutory section expandable drawers, penalty callout blocks, and legal status taxonomy badges (`IN_FORCE`, `ENACTED_FUTURE_COMMENCEMENT`, `STRUCK_DOWN_HISTORICAL`) in `Laws.jsx`.
- **PL-2 (Cyber Crime Catalog)**: Polish crime category navigation, severity indicators, and real-world example typography in `Crimes.jsx`.
- **PL-3 (Case Studies Archive)**: Enhance editorial readability, judicial citation formatting, and key lesson callouts in `Cases.jsx`.
- **PL-4 (Prevention & Emergency Reporting Guide)**: Elevate emergency helpline 1930 and `cybercrime.gov.in` callout banners in `Prevention.jsx` and `Resources.jsx`.

### Category D: Typography, Spacing & Global Systems
- **GL-1 (Typographic Hierarchy)**: Standardize serif headlines, sans-serif body text, and tabular monospace figures across all views.
- **GL-2 (Consistent Spacing Rhythms)**: Normalize section padding, card margins, and gap variables across viewport breakpoints.
- **GL-3 (Mobile & Tablet Responsiveness)**: Thorough responsive audit across 375px mobile, 768px tablet, and 1440px desktop viewports.
- **GL-4 (Accessibility Audit & Polish)**: Verify WCAG 2.1 AA color contrast ratios, focus visible rings, screen reader ARIA landmarks, and keyboard navigation tab stops.

---

## 5. Initiation Criteria

Work on this backlog may begin **only** after:
1. Stage 1 (Core Learner Experience) is closed. (Satisfied)
2. Stage 2 (Assessment Quality & Reliability: AQ-1 through AQ-4) is completed and validated.
3. Stage 3 (Counterfactual Scenario Learning) is built and verified.
4. Stage 4 (Digital Rights & Privacy Education) is built and verified.
5. Stage 5 (Spaced Retrieval & Long-Term Retention) is built and verified.
6. Stage 6 (Dashboard Integration & Journey Coherence) is functionally complete.
7. Explicit user approval is granted to commence the visual design pass.

