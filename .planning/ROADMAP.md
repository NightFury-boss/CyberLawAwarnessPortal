# Cyber Law Awareness Portal — Canonical Development Roadmap

**Document Version:** 2.1.0  
**Last Reconciled:** 12 November 2026  
**Current Milestone Position:** Programme 2 — Milestone 7.1 Staging Tooling/DB Initialized & Stage 1 Security Remediation Complete; Cloud Redeploy & Live Smoke Remaining  
**Historical Programme Status:** Original Six-Stage Core Engineering Programme (Stages 1–6) & Post-Development Design Cycle **FORMALLY COMPLETED & VERIFIED**  
**Repository Branch / Commits:** `public-beta-experience` (`82e06a2` Public Beta, `17e2e97` Staging Tooling, `33ac6e5` Stage 1 Security Remediation)  

---

## 1. Executive Summary & Master Programme Overview

The **Cyber Law Awareness Portal** has successfully completed its original six-stage foundational development lifecycle and subsequent visual/accessibility polish pass. The platform represents an authoritative, criterion-referenced educational web application pairing Indian statutory cyber jurisprudence (Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, Digital Personal Data Protection Act 2023) with an experiential, scenario-based simulation engine ("Your Digital Day").

The original development programme (Stages 1 through 6) and the standalone post-development design improvement pass are formally closed. The project has transitioned to **Programme 2: Staging Deployment, Infrastructure Hardening & Operational Continuity**.

```
==========================================================================================
PROGRAMME 1: CORE ARCHITECTURE & LEARNING FOUNDATION (STAGES 1–6) — [COMPLETED & CLOSED]
==========================================================================================
  Stage 1: Core Learner Experience                     [COMPLETED & VERIFIED]
  Stage 2: Assessment Quality & Reliability (AQ-1..4)  [COMPLETED & VERIFIED]
  Stage 3: Counterfactual Scenario Learning (Waves 1-3)[COMPLETED & VERIFIED]
  Stage 4: Digital Rights & Privacy Education (18 Mods)[COMPLETED & VERIFIED]
  Stage 5: Spaced Retrieval & Learning Consolidation   [COMPLETED & VERIFIED]
  Stage 6: Dashboard Integration & Journey Coherence   [COMPLETED & VERIFIED]
  Design Pass: Constitutional Atelier Design & A11y    [COMPLETED & VERIFIED]
                                         │
                                         ▼
==========================================================================================
PROGRAMME 2: PRODUCTION OPERATIONS, HARDENING & EXPANSION — [ACTIVE PROGRAMME]
==========================================================================================
  Milestone 7.1: Staging Init, Beta UI & Cloud Verification [ACTIVE — REDEPLOY PENDING]
  Milestone 7.2: Security Remediation, CI/CD & Deps        [STAGE 1 DONE / DEPS PENDING]
  Milestone 7.3: Statutory Currency & Judicial Precedents  [SCHEDULED MAINTENANCE]
  Milestone 7.4: Assistive Technology & Screen-Reader UAT  [PENDING]
  Milestone 7.5: Editorial Portfolio Export & UX Polish    [BACKLOG]
  Milestone 7.6: Performance, Caching & SEO Structured Data[BACKLOG]
  Milestone 7.7: Privacy-Preserving Learning Analytics     [FUTURE RESEARCH]
==========================================================================================
```

---

## 2. Programme 1 Reconciliation: Stage-by-Stage Verification & Formal Closure

### Stage 1 — Core Learner Experience
- **Original Objective**: Establish the foundational learner journey, JWT authentication, Indian cyber law catalogs, case studies, knowledge quizzes, 13-stage baseline assessment ("Your Digital Day"), six-metric behavioral profile (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), adaptive remediation engine, and navigation architecture.
- **Implemented Capabilities**:
  - Full JWT authentication lifecycle with bcrypt password hashing and role-based access control (`user` vs `admin`).
  - Categorized Indian cyber laws, cybercrime typologies, and landmark precedent case studies.
  - "Your Digital Day" 13-stage baseline assessment with Compare-and-Swap (CAS) atomic concurrency locks against double-submit replays.
  - Non-punitive diagnostic profile (`DigitalAwarenessProfile.jsx`) presenting criterion-referenced behavioral traits.
  - Dynamic remediation prioritization engine ($PriorityScore = Deficit \times SeverityWeight \times OpportunityFactor$).
  - 3-step structured pathway runner (`PathwayRunner.jsx`) with server-authoritative checkpoint grading ($\ge 67\%$).
  - Milestone 3.1–3.3 navigation audit, routing cleanup, and structural freeze.
- **Important Files**: `server/controllers/simulationController.js`, `server/models/AssessmentSession.js`, `server/models/AssessmentDecision.js`, `server/config/scenarios.json`, `client/src/components/assessment/BaselineAssessment.jsx`, `client/src/components/assessment/DigitalAwarenessProfile.jsx`, `client/src/components/dashboard/PathwayRunner.jsx`.
- **Test Evidence**: `server/tests/phase1Reliability.test.js`, `server/tests/firstTimeLearnerJourney.test.js`, `server/tests/phase2_awareness_profile.test.js`, `server/tests/phase3_2_navigation_and_integrity.test.js`, `server/tests/phase3_adaptive_learning.test.js`.
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Stage 2 — Assessment Quality & Reliability (AQ-1 through AQ-4)
- **Original Objective**: Conduct an empirical audit of the six behavioral dimensions, harden scoring fairness and path equivalence, introduce atomic forensic cue probes, deploy partial compound unique indexes, and validate the end-to-end longitudinal assessment lifecycle.
- **Implemented Capabilities**:
  - **AQ-1**: Empirical quality audit evaluating construct validity and denominator arithmetic.
  - **AQ-2**: Approved Assessment Refinement Specification v2.5.0 decoupling encounters from arbitrary point ceilings.
  - **AQ-3**: Implemented Global 16-point Threat Recognition budget invariant (Stage 7 early resolution = +4), 5 universal Signal Identification forensic cue probes, Decision Quality construct purity (Stages 5 & 13, $DQ_{\text{max}} = 4$), Unreviewed Acceptance 4-encounter parity, partial unique compound index `{ assessmentSessionId: 1, idempotencyKey: 1 }` with ACID multi-document transactions, and fail-closed cutover resolution (`SCORING_V2_CUTOVER_DATE=2026-11-04T00:00:00.000Z`).
  - **AQ-4**: Integrated lifecycle validation across baseline, remediation, final assessment, paired longitudinal delta, and browser reload/resumption recovery at Stages 2, 6, and 10.
- **Important Files**: `server/config/cutoverConfig.js`, `server/controllers/simulationController.js`, `server/config/calibrateScenariosV2.js`, `client/src/components/assessment/FinalAssessment.jsx`, `server/tests/aq4_integrated_lifecycle.test.js`.
- **Test Evidence**: `scoring_v2_authoritative.test.js` (15/15), `scoring_path_equivalence.test.js` (3/3), `si_idempotency_atomicity.test.js` (7/7), `aq4_integrated_lifecycle.test.js` (12/12), `scripts/browser_resumption_smoke_test.js` (Parts A–E).
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Stage 3 — Counterfactual Scenario Learning
- **Original Objective**: Develop exploratory simulation experiences illustrating alternative decision branches ("What happens if...?") while strictly protecting immutable historical assessment records.
- **Implemented Capabilities**:
  - **Wave 1**: Four declarative scenario data fixtures in `client/src/data/counterfactualScenarios.js` covering Midnight Power Cut SMS, Nominal ₹15 Parcel Fee, Approve Payment QR, and Video Summons Digital Arrest.
  - **Wave 2**: Interactive Counterfactual Studio (`CounterfactualCatalog.jsx`, `CounterfactualExplorer.jsx`, `IncidentStimulusView.jsx`, `DecisionJunction.jsx`, `ConsequenceTimeline.jsx`, `ComparativeMatrix.jsx`, `DefensiveTakeawayCard.jsx`), pure state engine `counterfactualEngine.js`, and dual-mode storage adapter `counterfactualStorage.js`.
  - **Wave 3**: Playwright E2E integration test suite (`e2e/counterfactual.spec.js`), deep immutability verification, disposable in-memory database test runner with zero-mutation verification (`verifyCounterfactualDbIsolation.js`), and NVDA screen-reader accessibility checklist.
- **Important Files**: `client/src/data/counterfactualScenarios.js`, `client/src/pages/Counterfactuals.jsx`, `client/src/utils/counterfactualEngine.js`, `client/src/utils/counterfactualStorage.js`, `server/tests/counterfactualEngine.test.js`, `server/tests/counterfactualFixtures.test.js`, `server/tests/verifyCounterfactualDbIsolation.js`, `e2e/counterfactual.spec.js`.
- **Test Evidence**: `counterfactualEngine.test.js` (6/6), `counterfactualFixtures.test.js` (5/5), `verifyCounterfactualDbIsolation.js` (PASS), `verify_counterfactual_ui.js` (13/13 checkpoints, 18 screenshot captures).
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Stage 4 — Digital Rights & Privacy Education
- **Original Objective**: Expand the curriculum and reference catalog to cover personal data protection, consent architecture, data fiduciary obligations, digital copyright vs piracy, and statutory distinction between operative and enacted future laws.
- **Implemented Capabilities**:
  - **Wave 1**: Authored and seeded 14 LawSections and 18 LearningModules across 4 categories (Foundations, Financial Cybersecurity, Digital Identity & Privacy, Cyber Crimes & Remedies) in `seedModulesData.js` and `supplementaryLawsSeed.js`.
  - **Wave 2**: Expanded assessment bank with multi-check in-lesson quick evaluations.
  - **Wave 3**: Interactive Lesson Reading Studio (`Modules.jsx`) featuring structured sections, statutory anchors, key takeaways, search filtering, category filtering, and progress tracking via `/api/modules/:slug/progress`.
  - Statutory accuracy taxonomy enforcing strict distinctions between `IN_FORCE` primary law and `ENACTED_FUTURE_COMMENCEMENT` provisions (DPDP Act 2023 §§ 6, 8, 11).
- **Important Files**: `server/models/LearningModule.js`, `server/controllers/moduleController.js`, `server/routes/modules.js`, `server/config/seedModulesData.js`, `client/src/pages/Modules.jsx`, `server/tests/learningModules.test.js`.
- **Test Evidence**: `server/tests/learningModules.test.js` (Access control, retrieval, categories, search, auto-start, multi-check progress all verified).
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Stage 5 — Spaced Retrieval & Long-Term Retention
- **Original Objective**: Build an independent knowledge-retention engine tracking recall maintenance over time, completely decoupled from six-dimensional behavioral assessment scores.
- **Implemented Capabilities**:
  - Learning consolidation and learner independence architecture without forced calendar lockouts.
  - Missed-question tracking (`isResolved: false`) in Quiz Studio with instant bidirectional resolution upon answering correctly in regular practice.
  - Multi-format authoring and server-authoritative evaluation in `submitQuizRecall` supporting 8 question formats: `single_choice`, `multiple_choice`, `true_false`, `matching`, `ordering`, `indicator_identification`, `scenario_decision`, `legal_application`.
  - Rich non-punitive educational error feedback (whyIncorrect, practical takeaways, statutory citations, full solutions).
  - Review history capping (10 entries) protecting document size.
  - Merged pull request: `007b1ec` (`stage-5-learning-consolidation`).
- **Important Files**: `server/controllers/quizController.js`, `server/services/spacedRetrievalService.js`, `server/models/UserProgress.js`, `client/src/pages/Quizzes.jsx`, `client/src/components/dashboard/DashboardQuizPractice.jsx`, `server/tests/stage5Consolidation.test.js`.
- **Test Evidence**: `server/tests/stage5Consolidation.test.js`, `server/tests/spacedRetrieval.test.js`.
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Stage 6 — Dashboard Integration & Refinement
- **Original Objective**: Synthesize all learning, assessment, counterfactual, and retention streams into a unified, cohesive learner journey.
- **Implemented Capabilities**:
  - Unified macro-journey layout: `Dashboard.jsx`, `AtelierMasthead.jsx`, `PrimaryFocus.jsx`, `DigitalMomentsStorySection.jsx`, `BehavioralEvolution.jsx`.
  - Deterministic 11-state priority ladder implemented in `client/src/utils/dashboardJourneySelectors.js` governing primary next actions.
  - Three-Pillar Verified Defensive Learning Portfolio (`DefensivePortfolioModal.jsx`) synthesizing Interventions & Checkpoints (Pillar 1), Knowledge Practice (Pillar 2), and Behavioral Evolution (Pillar 3).
  - Human-readable learning history and recent activity feed eliminating internal slugs.
  - Scenario transitions, milestone redesign, and plain-language refinement (commits `3469034`, `8a219d7`, `db62fca`).
- **Important Files**: `client/src/pages/Dashboard.jsx`, `client/src/utils/dashboardJourneySelectors.js`, `client/src/components/dashboard/PrimaryFocus.jsx`, `client/src/components/dashboard/DefensivePortfolioModal.jsx`, `client/src/components/dashboard/BehavioralEvolution.jsx`, `server/controllers/progressController.js`.
- **Test Evidence**: `server/tests/dashboardReworkPhase6.test.js`, `server/tests/dashboardLearningJourney.test.js`, `server/tests/portfolioStatementContract.test.js`, `server/tests/recentActivityEvidence.test.js`.
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

### Post-Development Design Improvement Workstream
- **Original Objective**: Elevate portal visual hierarchy, typography, responsive stability, brand identity, and WCAG accessibility across public and authenticated routes.
- **Implemented Capabilities**:
  - Comprehensive portal-wide visual audit across 17 routes and 5 viewports documented in `docs/audits/DESIGN_AUDIT_REPORT.md` (54 high-resolution screenshot captures).
  - Brand identity integration: multi-resolution SVG brand marks (`cyber-law-logo-horizontal.svg`, `cyber-law-logo-icon.svg`), optical favicon suite in `client/public/`.
  - Editorial "Constitutional Atelier" palette standardized (`--color-background: #F8F4EC`, `--color-surface-card: #FFFFFF`, `--color-accent-terracotta: #9A503A`, `--color-accent-gold: #B18A55`, `--color-text-primary: #302B27`).
  - Mobile responsiveness: eliminated 8px horizontal overflow on `/prevention`; verified 0px horizontal overflow across all 5 standard viewports (1440px, 1280px, 768px, 390px, 375px).
  - WCAG 2.1 AA accessibility hardening: resolved missing `<label>` tags on select dropdowns, ARIA tabpanel linkages, keyboard focus visibility rings, high text contrast (exceeding 4.5:1 / 7:1 across badges and buttons).
  - Pre-Beta Validation passed 26/26 automated checks documented in `docs/audits/PRE_BETA_VALIDATION_REPORT.md`.
- **Important Files**: `client/src/styles/main.css`, `client/src/styles/dashboard-redesign.css`, `client/src/components/layout/Navbar.jsx`, `client/src/components/layout/Sidebar.jsx`, `client/src/components/layout/Footer.jsx`, `client/src/pages/Home.jsx`, `client/src/pages/About.jsx`, `client/src/pages/Prevention.jsx`.
- **Test Evidence**: `scripts/verifyPreBetaRelease.js` (26/26 passed), `npm run lint --prefix client` (Oxlint: 0 errors).
- **Final Status**: **`COMPLETED AND VERIFIED`**

---

## 3. Programme 2: Canonical Next Development Roadmap

The next phase of the Cyber Law Awareness Portal focuses on deployment execution, infrastructure hardening, statutory maintenance, and user experience polish:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ PROGRAMME 2 WORKSTREAMS                                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. Staging Cloud Deployment & Live Verification    [ACTIVE / IMMEDIATE PRIORITY] │
│ 2. Reliability, Security & Infrastructure Hardening [PLANNED]                    │
│ 3. Statutory Tracking & Landmark Precedent Expansion[PLANNED]                    │
│ 4. Assistive Technology & Screen-Reader Verification[PLANNED]                    │
│ 5. Editorial Print Export & UI Refinement           [PLANNED]                    │
│ 6. Performance, Caching & Search Engine Optimization[PLANNED]                    │
│ 7. Privacy-Preserving Cohort Analytics              [FUTURE RESEARCH]            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Milestone 7.1 — Staging Cloud Deployment & Live Verification
**Status**: **`IN PROGRESS (IMMEDIATE ACTIVE PRIORITY)`**  
**Focus**: Transition from repository deployment readiness to verified live cloud infrastructure.

#### Work Breakdown:
- **7.1.1: MongoDB Atlas M0 Staging Setup**:
  - Provision dedicated cluster in project `CyberLaw-Staging` (Region: AWS Mumbai `ap-south-1`).
  - Create database user `cyberlaw_staging_app` with `readWrite` granted exclusively on `cyber_law_staging`.
  - In Network Access, allowlist Render's regional shared outbound CIDR ranges (retrieved from Render Dashboard → Connect → Outbound) or `0.0.0.0/0`.
- **7.1.2: Render Web Service Deployment**:
  - Connect repository `NightFury-boss/CyberLawAwarnessPortal`, branch `main`, root dir `server`.
  - Configure environment variables via Render Dashboard (`NODE_ENV=production`, `HOST=0.0.0.0`, `TRUST_PROXY=1`, `ASSERT_STAGING_DB=true`, `EXPECTED_STAGING_DB_NAME=cyber_law_staging`, `MONGODB_URI`, `JWT_SECRET`, temporary `CLIENT_URL`).
  - Deploy and confirm `/api/health` returns `HTTP 200 {"status":"healthy","database":"connected"}`.
- **7.1.3: Netlify Frontend Verification**:
  - Confirm live deployment at `https://cyber-law-awareness-portal.netlify.app`.
  - Configure `VITE_API_URL` pointing to the Render Web Service URL.
  - Verify SPA redirect rules (`/* /index.html 200`) prevent 404s on hard reloads of `/laws`, `/quizzes`, `/dashboard`.
- **7.1.4: Canonical Staging Initialization & Admin Provisioning (Completed)**:
  - Populated `cyber_law_staging` via dedicated idempotent canonical initializer `scripts/initializeStagingDatabase.js` (`651` records across `11` Class A collections, preserving learner collections untouched) and provisioned `1` verified staging admin via `scripts/createStagingAdmin.js` (instead of running general `seed.js`).
  - Documented Public Beta experience (`82e06a2`) and guarded staging tooling (`17e2e97`).
- **7.1.5: Cloud Redeploy & End-to-End Live Smoke Verification (Pending Merge/Deploy)**:
  - Redeploy Netlify/Render with `public-beta-experience` changes (`82e06a2`, `17e2e97`, `33ac6e5`) when authorized and run live smoke checks against deployed endpoints.

#### Acceptance Criteria:
1. `GET /api/health` on Render responds with HTTP 200 and `"status":"healthy"`.
2. Netlify frontend communicates seamlessly with Render backend without CORS violations.
3. Registration, login, and Baseline assessment complete end-to-end against live Atlas database.
4. Render cold-start notice displays gracefully on container spin-up and dismisses upon response.

---

### Milestone 7.2 — Reliability, Security & Infrastructure Hardening
**Status**: **`IN PROGRESS (Stage 1 Remediation Committed `33ac6e5`; CI/CD & Dependency Patches Pending)`**  
**Focus**: Backend security hardening, production/staging separation, dependency remediation, and automated CI.

#### Work Breakdown:
- **7.2.0: Stage 1 Backend Security Remediation (Completed — `33ac6e5`)**:
  - Enforced fail-closed seed/reset/migration guards (`seedSecurityGuard.js`), inactive-account token revocation, strict admin payload allowlists and HTTP/HTTPS/relative URL validation (`adminPayloadSanitizer.js`), centralized API/DB/audit error & string redaction (`apiErrorResponder.js`, `auditService.js`), reverse production database guard (`db.js`), shared `moduleController` audit routing, and `stage1SecurityRemediation.test.js` (24/24).
- **7.2.1: Automated CI/CD & Runtime Dependency Triage (Pending)**:
  - Implement GitHub Actions workflow (`.github/workflows/ci.yml`) executing Oxlint, Vite build, and isolated backend test suites.
  - Apply non-breaking dependency security updates identified in `npm audit` (prioritizing server `proxy-addr`, `body-parser`, `mongoose`, and `qs`, alongside client/root tooling).
- **7.2.2: Defense-in-Depth TLS Configuration**:
  - Explicitly declare `tls: true` and specify minimum TLS versions in `server/config/db.js` Mongoose connection options.
- **7.2.3: Distributed Rate Limiting Architecture**:
  - Document upgrade path from memory-backed sliding windows to Redis-backed distributed stores (`ioredis` + `express-rate-limit`) when scaling across multiple container instances.

#### Acceptance Criteria:
1. GitHub Actions automated pipeline validates all PRs before merge.
2. Explicit TLS options declared in Mongoose connection without breaking Atlas connectivity.

---

### Milestone 7.3 — Statutory Tracking & Landmark Precedent Expansion
**Status**: **`PLANNED MAINTENANCE`**  
**Focus**: Ongoing legal accuracy, legislative notification monitoring, and judicial precedent authoring.

#### Work Breakdown:
- **7.3.1: DPDP Act 2023 Commencement Tracking**:
  - Monitor MeitY official gazette notifications regarding the operational commencement of substantive DPDP Act sections (Sections 6, 8, 11).
  - When notified by the Central Government, update legal taxonomy from `ENACTED_FUTURE_COMMENCEMENT` to `IN_FORCE`.
- **7.3.2: BNS 2023 Judicial Interpretation Updates**:
  - Monitor and document emerging High Court and Supreme Court rulings applying BNS Section 308 (extortion) and Section 318 (cheating) to novel cyber threats like Digital Arrest.
- **7.3.3: Case Studies Archive Expansion**:
  - Research and author Checkpoint 3 case studies following the established 6-part editorial narrative contract (`docs/research/cases-where-justice-fell-short/PHASE_2_CONTENT_SPEC.md`).

#### Acceptance Criteria:
1. Legal status taxonomy reflects real-world Indian gazette notifications with primary citations.
2. All new case studies adhere to 6-part narrative schema and pass schema validation offline.

---

### Milestone 7.4 — Assistive Technology & Screen-Reader Verification
**Status**: **`PENDING`**  
**Focus**: Empirical manual testing with physical screen readers on production devices.

#### Work Breakdown:
- **7.4.1: Physical Device NVDA Testing**:
  - Execute the manual test checklist in `e2e/NVDA_SCREEN_READER_ACCEPTANCE_CHECKLIST.md` using NVDA on Windows 11.
  - Verify speech announcements on dynamic stage transitions, Signal Identification radio reveals, and modal dialog focus traps.
- **7.4.2: VoiceOver & TalkBack Mobile Testing**:
  - Test core assessment flows using VoiceOver on iOS Safari and TalkBack on Android Chrome.
  - Validate touch targets ($\ge 44 \times 44\text{px}$) across all interactive decision triggers.
- **7.4.3: 200% Text Zoom Audit**:
  - Test all views under 200% browser zoom ensuring zero container truncation or unreadable overlaps.

#### Acceptance Criteria:
1. Zero critical screen reader accessibility traps across baseline simulation and pathway execution.
2. All interactive elements provide meaningful accessible announcements.

---

### Milestone 7.5 — Editorial Print Export & UI Refinement
**Status**: **`BACKLOG`**  
**Focus**: Printable defensive portfolio generation, layout polish, and micro-interactions.

#### Work Breakdown:
- **7.5.1: Print & PDF Stylesheet Optimization**:
  - Harden `@media print` rules in `client/src/styles/main.css` for `DefensivePortfolioModal.jsx`.
  - Add explicit page-break boundaries (`break-inside: avoid`, `page-break-after: always`) between the Three Pillars for clean PDF export and physical printing.
- **7.5.2: Micro-Interaction Polish**:
  - Refine subtle slide transitions in `CounterfactualExplorer.jsx` decision junctions.
  - Optimize mobile navigation drawer opening/closing curves.

#### Acceptance Criteria:
1. Browser Print / Save as PDF produces a structured, beautifully formatted multi-page Verified Defensive Portfolio.

---

### Milestone 7.6 — Performance, Caching & Search Engine Optimization
**Status**: **`BACKLOG`**  
**Focus**: Edge caching, social preview metadata, and search visibility.

#### Work Breakdown:
- **7.6.1: Social Preview & OpenGraph Metadata**:
  - Configure OpenGraph and Twitter Card tags in `index.html` and dynamic route helpers for `/laws`, `/crimes`, `/cases`, and `/about`.
- **7.6.2: JSON-LD Structured Data**:
  - Embed schema.org `Legislation`, `Course`, and `EducationalOrganization` structured data for search engine discovery.
- **7.6.3: Client Bundle Optimization**:
  - Review dynamic imports and chunk splitting to maintain sub-second mobile page loads across edge CDN nodes.

#### Acceptance Criteria:
1. Rich social preview cards generate correctly when sharing portal URLs.
2. Valid JSON-LD structured data confirmed via Google Rich Results test.

---

### Milestone 7.7 — Privacy-Preserving Cohort Analytics
**Status**: **`FUTURE RESEARCH`**  
**Focus**: Educational cohort insights without individual learner surveillance.

#### Work Breakdown:
- **7.7.1: k-Anonymity Aggregation Service**:
  - Develop backend aggregation service evaluating cohort vulnerability trends across the six cognitive dimensions (sample size $k \ge 5$).
  - Strictly exclude individual identifiers, email addresses, or individual attempt timestamps from administrative dashboards.
- **7.7.2: Institutional Benchmark Reporting**:
  - Enable academic administrators to view macro-level habit shifts between baseline and final assessments.

#### Acceptance Criteria:
1. Zero learner PII exposed in analytics queries; strict $k \ge 5$ threshold enforced.

---

## 4. Phase Numbering & Workstream Reconciliation Table

| Canonical Identifier | Historical Code | Current Status | Description & Deliverables |
| :--- | :--- | :--- | :--- |
| **Stage 1: Core Learner Experience** | Phases 1–3 / Milestones 3.1–3.3 | **COMPLETED & VERIFIED** | Registration, baseline assessment, 6-metric profile, pathways, structural freeze. |
| **Stage 2: Assessment Quality** | AQ-1..4 | **COMPLETED & VERIFIED** | 16-pt TR budget, 5 SI probes, v2 cutover, idempotency index, longitudinal delta. |
| **Stage 3: Counterfactual Learning** | Original Phase 4 | **COMPLETED & VERIFIED** | 4 scenario fixtures, interactive studio, pure state engine, Playwright E2E. |
| **Stage 4: Digital Rights & Privacy** | Original Phase 5 | **COMPLETED & VERIFIED** | 18 modules, 14 law sections, quick checks, DPDP Act 2023 statutory grounding. |
| **Stage 5: Spaced Retrieval** | RT-1..4 | **COMPLETED & VERIFIED** | Learner independence, missed-question resolution, 8-format evaluation engine. |
| **Stage 6: Dashboard Integration** | Original Phase 6 | **COMPLETED & VERIFIED** | 11-state priority ladder, Three-Pillar Defensive Portfolio, journey coherence. |
| **Post-Development Design Pass** | Design Backlog | **COMPLETED & VERIFIED** | Constitutional Atelier theme, 0px mobile overflow, WCAG 2.1 AA compliance. |
| **Milestone 7.1: Cloud Staging Ops** | — | **ACTIVE (REDEPLOY PENDING)** | Netlify CDN, Render service, `cyber_law_staging` (651 canonical items + 1 admin), Beta UI (`82e06a2`). |
| **Milestone 7.2: Security & CI/CD** | — | **PARTIAL (`33ac6e5` DONE)** | Stage 1 security hardening committed (`33ac6e5`); CI workflow, `npm audit` patches & TLS pending. |
| **Milestone 7.3: Legal Maintenance** | — | **PLANNED** | DPDP Act Section 1(2) commencement tracking, BNS case law, precedent authoring. |
| **Milestone 7.4: Screen-Reader QA** | — | **PENDING** | Physical NVDA, VoiceOver, and TalkBack assistive technology verification. |
| **Milestone 7.5: Portfolio Export** | — | **BACKLOG** | Print stylesheet optimization for Verified Defensive Learning Portfolio PDF export. |
| **Milestone 7.6: SEO & Performance** | — | **BACKLOG** | OpenGraph social preview cards, JSON-LD structured data, Lighthouse tuning. |
| **Milestone 7.7: Cohort Analytics** | — | **FUTURE RESEARCH** | Privacy-preserving $k \ge 5$ aggregated learning trend reporting for educators. |

---

## 5. Development Governance & Invariant Rules

All future work on the Cyber Law Awareness Portal must adhere strictly to the following invariant principles:

1. **Six Cognitive Dimensions Invariance**: The six dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) remain discrete and non-composite. They must never be averaged or collapsed into an arbitrary single "safety score".
2. **Server-Side Scoring Authority**: All assessment scoring, progression gating, and checkpoint evaluation are executed exclusively by the backend. Never trust client-submitted scores.
3. **Historical Session Immutability**: Historical assessment sessions and attempt logs are permanent and immutable. Never mutate or overwrite completed assessment sessions in-place.
4. **Statutory Accuracy**: Verify statutory citations against primary Indian legislation (IT Act 2000, BNS 2023, DPDP Act 2023). Maintain strict distinctions between active law, pending commencement provisions, and unconstitutional provisions (Section 66A IT Act).
5. **Emergency Reporting Protocol**: Direct victims immediately to National Cybercrime Helpline **1930** and portal `cybercrime.gov.in`. Explain CFCFRMS inter-bank hold coordination without guaranteeing fund recovery.
6. **Aesthetic Identity**: Maintain the established editorial visual identity (warm parchment `#F8F4EC`, deep espresso `#302B27`, restrained terracotta `#9A503A`). Strictly avoid cyberpunk, neon, or flashy gamification.
7. **Rigorous Honesty**: Clearly distinguish repository code readiness from live cloud infrastructure deployment. Never claim live deployment without empirical verification.
