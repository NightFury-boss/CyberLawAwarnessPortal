# Cyber Law Awareness Portal — Project Changelog

This document maintains the historical and ongoing record of major architectural milestones, security hardening passes, pedagogical enhancements, and repository refinements for the **Cyber Law Awareness Portal**.

---

## [2026-11-11] - Phase B Repository Organization & Reticle Decommissioning
* **Category:** Repository Architecture, Tool Decommissioning, Documentation
* **Structural Reorganization**:
  - Consolidated 9 loose root-level deployment guides and audit reports into a structured `docs/` hierarchy (`docs/deployment/`, `docs/audits/`, and `docs/audits/archive/`).
  - Relocated the 6-file landmark case research package into `docs/research/cases-where-justice-fell-short/`.
  - Decoupled structural layout components (`Navbar.jsx`, `Sidebar.jsx`, `Footer.jsx`) into `client/src/components/layout/` while establishing backwards-compatible re-export facades at `client/src/components/` for seamless import resolution.
  - Established central `deployment/README.md` and provider guides (`deployment/docker/`, `deployment/netlify/`, `deployment/render/`, `deployment/mongodb/`, `deployment/scripts/`).
  - Created `docs/README.md` and `scripts/README.md` cataloguing all 45 operational scripts across 7 domains.
* **Tool Decommissioning (Reticle Purge)**:
  - Completely decommissioned Reticle: deleted `RETICLE.md`, `.reticle.json`, `client/.reticle.json`, `client/src/reticle-dev.ts`, and the `.reticle/` flow/intent directory.
  - Pruned `@reticlehq/react` and `@reticlehq/vite-plugin` from `client/package.json` and synchronized `client/package-lock.json`.
  - Pruned Reticle print suppression CSS selectors from `client/src/styles/main.css`.
  - Pruned obsolete `#reticle-root` style injection calls from 6 Playwright diagnostic scripts.
  - Rewrote `AGENTS.md` to establish the authoritative Antigravity engineering contract and statutory invariants.
* **Verification**: All 6 offline backend test suites passed (107 tests), Vite client production build succeeded in 604ms, and Oxlint passed with 0 errors across 83 client files.

---

## [2026-11-10] - Render Cold-Start Handling & Staging Infrastructure Support
* **Category:** Infrastructure, Frontend API Client, Resilience
* **Details**:
  - Implemented staging-aware cold-start detection and adaptive timeout handling in `client/src/services/api.js`.
  - Introduced `<ColdStartNotice />` non-intrusive status notification pill with 60-second adaptive timeout during Render free-tier container wakes.
  - Refactored single-boundary request lifecycle tracking across retries (`onCallStart` / `onCallEnd` outer boundary), preventing UI banner flicker (H-1 remediation).
  - Guarded awake state against HTTP 502/503/504 proxy boot responses (H-2 remediation).
  - Implemented combined `AbortSignal` cancellation and timeout handling with deterministic event listener cleanup (M-1 remediation).
  - Enforced strict non-retrying mutations for `POST`, `PUT`, `PATCH`, `DELETE` calls while permitting safe backoff retries exclusively on idempotent `GET` and `HEAD` requests (M-2 remediation).
  - Added dedicated automated contract test suite `server/tests/coldStartHandling.test.js` (14 passing tests).
* **Verification**: 14 cold-start tests passing, 71 staging/security tests passing.

---

## [2026-10-31] - Obsolete Asset Cleanup & Design Token Standardization
* **Category:** Frontend UI/UX, Design System, Asset Optimization
* **Details**:
  - Standardized the editorial "Constitutional Atelier" color palette (`--color-background`, `--color-accent-forest`, `--color-accent-terracotta`).
  - Pruned legacy conflicting style declarations and redundant test fixtures.
  - Generated and validated multi-resolution brand marks and optical favicon suite in `client/public/`.
* **Verification**: Optical favicon tests and responsive checks verified across 5 standard device viewports.

---

## [2026-10-24] - Stage 5 Learning Consolidation & Three-Pillar Portfolio
* **Category:** Assessment Engine, Pedagogical Architecture, Learner Dashboard
* **Details**:
  - Implemented Three-Pillar Verified Defensive Learning Portfolio (`DefensivePortfolioModal.jsx`) covering Interventions, Practice, and Trajectory.
  - Added `FirstVisitExperience.jsx` orientation card with progressive disclosure toggle for first-time learners.
  - Hardened `dashboardJourneySelectors.js` with deterministic 11-state priority ladder governing next-action recommendations.
  - Maintained server-authoritative scoring across all six discrete, non-composite cognitive dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
  - Added statutory grounding adhering to legal status taxonomy (`IN_FORCE`, `ENACTED_FUTURE_COMMENCEMENT`, `STRUCK_DOWN_HISTORICAL`).
* **Verification**: Counterfactual scenario test suite and journey selector verification passing.

---

## [2026-08-19] - Initial Baseline Status & Architectural Upgrades *(Recovered from Git Baseline `08f6092`)*
* **Category:** Core MERN System Architecture, Initial Feature Set
* **1. Cyber Incident Archive (Case Studies Upgrade)**:
  - Restructured Case Studies into an investigative registry for documented attack vectors.
  - Integrated "Pause & Choose" situational mockups before revealing incident outcomes.
  - Added deception ratings and warning marker analysis panels.
  - Connected case studies directly to relevant Information Technology Act sections.
* **2. Indian Digital Law Learning Centre (Cyber Laws Upgrade)**:
  - Implemented the "Law Compass" scenario-to-provision auditing wizard mapping real situations to legal clauses.
  - Added side-by-side plain English vs. statutory translation toggles.
  - Enabled local storage bookmarking and personal study note drafting.
  - Refactored Admin CMS into structured tabbed forms (*Overview*, *Content*, *Metadata*, *Connections*).
  - Expanded `seed.js` with 11+ provisions spanning BNS 2023, IT Act 2000, and DPDP Act 2023.
* **3. About Project Story Redesign**:
  - Streamlined academic focus on the experiential loop: $\text{Experience} \rightarrow \text{Understand} \rightarrow \text{Learn} \rightarrow \text{Practice} \rightarrow \text{Improve}$.
  - Added hero connected SVG graph and differentiators pathway.
  - Added simulation safety checklists documenting zero collection of credentials.
  - Created vertical MERN system architecture visualization.
* **4. Navigation & Layout Visual Polish**:
  - Redesigned sidebar navigation with flat 3px left-border active highlights.
  - Embedded SVG incident progression headers (`Bait` ➔ `Leverage` ➔ `Choice` ➔ `Outcome` ➔ `Law`).
  - Replaced solid timelines with dashed connector layouts and circular state nodes.
