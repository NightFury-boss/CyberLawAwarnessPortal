# Post-Development Design Improvement Backlog & Resolution Register

**Document Version:** 2.0.1  
**Last Reconciled:** 12 November 2026  
**Primary Design Cycle Status:** **COMPLETED & VERIFIED (Accepted in Pre-Beta Release `8692471`; Public Beta UX added in `82e06a2`)**  
**Current Governance:** Programme 2 UI/UX Refinement Register  
**Scope:** Editorial UI/UX, Typography, Spacing, Responsive Stability, Accessibility, and Print Fidelity  

---

## 1. Workstream Status & Operational Reconciliation

The post-development design improvement workstream was originally deferred until the technical foundation (Stages 1 through 6) was built and verified. Following the completion of Stage 6 in commit `db62fca`, the design cycle was formally executed, audited, and verified:

1. **Phase 1 (Design Audit)**: Comprehensive portal-wide visual and accessibility audit documented in [`docs/audits/DESIGN_AUDIT_REPORT.md`](../docs/audits/DESIGN_AUDIT_REPORT.md) across 17 routes, 5 viewports, and 54 screenshot captures.
2. **Phase 2 (Design & Brand Implementation)**: Implemented the "Constitutional Atelier" design system, integrated the official brand logo assets and optical favicon suite, normalized typography to `Inter`, and resolved layout drift.
3. **Phase 3 (Validation & Pre-Beta Gate)**: Formally validated in [`docs/audits/PRE_BETA_VALIDATION_REPORT.md`](../docs/audits/PRE_BETA_VALIDATION_REPORT.md) with 26/26 passing automated accessibility and responsive tests (0px horizontal overflow across all viewports).
4. **Public Beta Experience (`82e06a2`)**: Added [`PublicBetaAnnouncement.jsx`](../client/src/components/home/PublicBetaAnnouncement.jsx), [`FeedbackModal.jsx`](../client/src/components/common/FeedbackModal.jsx), and footer beta controls matching the editorial design tokens.

The primary design improvement cycle is **FORMALLY COMPLETED & CLOSED**. This document now serves as the active backlog register for post-staging editorial enhancements.

---

## 2. Completed & Closed Design Items (Programme 1 Resolution Matrix)

| Item ID | Category | Description | Implementation Resolution & Evidence | Status |
| :--- | :--- | :--- | :--- | :---: |
| **DB-1** | Dashboard | Atelier Masthead Polish | Refined typographic scale, edition tags, and date/time formatting in `AtelierMasthead.jsx`. | **CLOSED** |
| **DB-2** | Dashboard | PrimaryFocus Dossier Layout | Editorial layout for active learning focus area, status pills, and progress indicators in `PrimaryFocus.jsx`. | **CLOSED** |
| **DB-3** | Dashboard | Curriculum Lessons Grid | Standardized card spacing, hover elevation, and category badges in `CurriculumLessonsSection.jsx`. | **CLOSED** |
| **DB-4** | Dashboard | Verified Defensive Portfolio | Three-pillar certified learning drawer in `DefensivePortfolioModal.jsx` with verified timestamps. | **CLOSED** |
| **AS-1** | Assessment | Simulator Interface Framing | Polished simulated SMS, WhatsApp, phone, email, and browser frames in `BaselineAssessment.jsx`. | **CLOSED** |
| **AS-2** | Assessment | Decision Option Cards | Radio option selection states and dynamic signal probe disclosure in `BaselineAssessment.jsx`. | **CLOSED** |
| **AS-3** | Assessment | Digital Awareness Profile | Restrained editorial reveal in `DigitalAwarenessProfile.jsx`, behavioral radar, and trait score cards. | **CLOSED** |
| **AS-4** | Assessment | Remediation Cards | Prioritized focus cards with preview badges and deep links in `RemediationCards.jsx`. | **CLOSED** |
| **PL-1** | Legal Knowledge | Laws Reference Center | Statutory drawers, penalty callout blocks, and plain language toggles in `Laws.jsx`. | **CLOSED** |
| **PL-2** | Legal Knowledge | Cyber Crime Catalog | Harmonized attack lifecycle typologies and severity badge hierarchy in `Crimes.jsx`. | **CLOSED** |
| **PL-3** | Legal Knowledge | Case Studies Archive | Reconstructed landmark cases with "Pause & Choose" pivot points in `Cases.jsx`. | **CLOSED** |
| **PL-4** | Legal Knowledge | Prevention & Emergency Guide | Priority helpline 1930 and `cybercrime.gov.in` callout banners in `Prevention.jsx` and `Resources.jsx`. | **CLOSED** |
| **GL-1** | Global Systems | Typographic Hierarchy | Standardized typography to `Inter`, with tabular monospace figures and consistent headline scales. | **CLOSED** |
| **GL-2** | Global Systems | Consistent Spacing Rhythms | Normalized section padding, card margins, and gap variables across viewport breakpoints. | **CLOSED** |
| **GL-3** | Global Systems | Mobile & Tablet Responsiveness | Eliminated 8px horizontal overflow on `/prevention`; verified 0px overflow across all 5 viewports. | **CLOSED** |
| **GL-4** | Global Systems | Accessibility Audit & Polish | WCAG 2.1 AA compliant contrast (>4.5:1 / >7:1), visible focus rings, ARIA labels on form controls. | **CLOSED** |

---

## 3. Active UI/UX Refinement Backlog (Programme 2 Opportunities)

The following items are cataloged for ongoing editorial refinement during Programme 2:

### Category E: Print & Document Generation
- **UX-1 (Print Stylesheet Optimization for Defensive Portfolio)**:
  - *Context*: `DefensivePortfolioModal.jsx` allows learners to view and print their Verified Defensive Learning Portfolio.
  - *Opportunity*: Add explicit print-break control rules (`break-inside: avoid; page-break-after: always;`) between Pillar 1 (Interventions & Checkpoints), Pillar 2 (Knowledge Practice), and Pillar 3 (Behavioral Evolution) to guarantee pristine multi-page PDF generation without awkward table splits.
  - *Priority*: **Medium** (Milestone 7.5)

### Category F: Transitions & Micro-Interactions
- **UX-2 (Counterfactual Studio Decision Transition Curves)**:
  - *Context*: `CounterfactualExplorer.jsx` transitions between the incident stimulus and decision junctions.
  - *Opportunity*: Introduce subtle CSS cubic-bezier transition curves for choice reveals and rewind timeline interactions.
  - *Priority*: **Low** (Milestone 7.5)
- **UX-3 (Mobile Navigation Drawer Animation Polish)**:
  - *Context*: Mobile sidebar drawer on screens $\le 768\text{px}$.
  - *Opportunity*: Enhance spring-curve transition on opening/closing to provide native app feel.
  - *Priority*: **Low** (Milestone 7.5)

### Category G: Data Visualizations & Infographics
- **UX-4 (Interactive Behavioral Dimension Diagrams on About Page)**:
  - *Context*: `About.jsx` explains the six cognitive dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
  - *Opportunity*: Embed interactive SVG radar/spider diagram walkthrough illustrating typical learner trajectories.
  - *Priority*: **Low** (Future Enhancement)

---

## 4. Design Governance & Aesthetic Rules (Strict Invariants)

All future UI/UX modifications must respect these core design principles:

1. **Editorial & Restrained**: Clean visual hierarchy, generous whitespace, balanced editorial layouts, consistent typography (`Inter`), and functional minimalism.
2. **Warm & Authoritative Canvas**: Maintain the "Constitutional Atelier" palette (`#F8F4EC` canvas, `#FFFFFF` cards, `#302B27` primary text, `#9A503A` terracotta accent).
3. **No Cyberpunk or Neon Clichés**: Never introduce dark "hacker terminal" palettes, glowing neon borders, matrix code rain, or futuristic tech tropes.
4. **No Flashy Gamification**: Never introduce point confetti, spinning badges, leveling bars, or trivial achievement popups that undermine statutory seriousness.
5. **Zero Horizontal Overflow**: Every view must maintain `scrollWidth === clientWidth` (`overflowDelta = 0px`) across all standard viewports down to 375px mobile.
6. **WCAG 2.1 AA Compliance**: All text and interactive controls must maintain at least 4.5:1 contrast against their effective rendered backgrounds (7:1 for AAA).
