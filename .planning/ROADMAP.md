# Cyber Law Awareness Portal — Canonical Development Roadmap

**Governance Principle**: Technical & Educational Foundation First, Broad Visual Redesign Later  
**Current Milestone Position**: Stage 3 — Counterfactual Scenario Learning (PLANNING IN PROGRESS; Implementation Unauthorized)  
**Historical Baseline**: Milestone 3.3 Learner Experience Structural Freeze Formally Closed; Stage 2 Formally Accepted & Closed  

---

## 1. Master Development Sequence

The development of the Cyber Law Awareness Portal follows a strict, sequential 6-stage canonical roadmap. All engineering, testing, and architectural initiatives must execute in this authoritative order:

```
+---------------------------------------------------------------------------------------+
| STAGE 1: Core Learner Experience (COMPLETED & FROZEN)                                 |
| • Phase 1: First-Time Learner Experience                                              |
| • Phase 2: Digital Awareness Profile & Results                                        |
| • Phase 3: Adaptive Learning Pathways                                                |
| • Milestones 3.1, 3.2, 3.3: Navigation Audit, Improvements & Structural Freeze        |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 2: Assessment Quality & Reliability (COMPLETED & FORMALLY CLOSED)               |
| • AQ-1: Six-Dimensional Assessment Quality Audit [COMPLETED]                          |
| • AQ-2: Assessment Refinement Design Proposal v2.5.0 [APPROVED]                       |
| • AQ-3: Controlled Implementation (3 Waves) [COMPLETED]                               |
| • AQ-4: Integrated Assessment Validation [COMPLETED & FORMALLY ACCEPTED]              |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 3: Counterfactual Scenario Learning (PLANNING IN PROGRESS)                      |
| • Educational simulations of alternative decision branches & outcomes                 |
| • "What happens when...?" exploration without modifying immutable assessment records |
| • Design proposal prepared in STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md               |
| • Implementation strictly unauthorized pending explicit proposal approval             |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 4: Digital Rights & Privacy Education (Original Phase 5 — PENDING)              |
| • Personal data, consent, privacy, digital rights, copyright vs data misuse           |
| • Statutory grounding: Active legislation vs enacted future commencement provisions   |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 5: Spaced Retrieval & Long-Term Retention (Separate Workstream — PENDING)       |
| • RT-1: Audit existing quiz recall & spaced review mechanisms                         |
| • RT-2: Propose justified retention architecture improvements                         |
| • RT-3: Controlled implementation of approved improvements (if justified)             |
| • RT-4: Empirical validation of longitudinal knowledge retention                     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| STAGE 6: Dashboard Integration & Refinement (Original Phase 6 — PENDING)              |
| • Unified journey coherence integrating all learning, assessment, and recall streams  |
| • Functional integration & transition flow (NOT broad visual redesign)                |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| SEPARATE WORKSTREAM: Post-Development Design Improvement (DEFERRED)                   |
| • Dedicated register in .planning/DESIGN_IMPROVEMENT_BACKLOG.md                       |
| • Holistic UI/UX redesign, editorial storytelling, typography, and responsive polish   |
| • Initiates ONLY after Stages 1–6 technical foundation is fully built and verified    |
+---------------------------------------------------------------------------------------+
```

---

## 2. Stage Breakdown & Status

### Stage 1 — Core Learner Experience
**Status**: COMPLETED & OFFICIALLY FROZEN (Milestone 3 Closed)

Original learner-experience phases:
- **Phase 1: First-Time Learner Experience**: User registration, JWT authentication, RBAC, Indian cyber law catalog, case studies, quizzes, and initial onboarding.
- **Phase 2: Digital Awareness Profile & Results**: Six-metric behavioral assessment engine (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), CAS atomic replay protection, 13-stage adaptive branching ("Your Digital Day"), session resumption, and diagnostic profile presentation.
- **Phase 3: Adaptive Learning Pathways**: Server-authoritative remediation engine, grounded statutory reference catalog, 3-step structured runner (`PathwayRunner.jsx`), and checkpoint validation ($\ge 67\%$ passing threshold).

Structural and navigation milestones:
- **Milestone 3.1: Learner Journey & Flow Architecture Audit**: Full application audit across routes, state machines, and pedagogical boundaries.
- **Milestone 3.2: Approved Navigation & Experience Improvements**: Synchronized curriculum constellation slugs, server-side prerequisite enforcement for final assessment (`403 PREREQUISITE_NOT_MET`), expired session re-initialization, preview-only remediation cards on profile reveal, and removal of intrusive development tooling.
- **Milestone 3.3: Learner Experience Structural Freeze**: Formal sign-off freezing canonical learner journey (6 states), component ownership boundaries, "Verified Defensive Learning Portfolio" terminology, statutory accuracy taxonomy, and emergency helpline 1930 guidance.

---

### Stage 2 — Assessment Quality & Reliability
**Status**: COMPLETED & FORMALLY CLOSED (AQ-4 Formally Accepted)

> [!NOTE]
> This independent assessment-hardening engineering initiative is formally complete and closed. Its internal workstream identifiers (`AQ-1` through `AQ-4`) must not be confused with the original learner-experience phase numbers.
>
> **Preserved Verified Baseline Revisions**:
> - Implementation Revision: `a196c34acefde13fa6898745fd39ae8f1242a3a8`
> - Documentation Alignment Revision: `72b7f5ca155681ce2fc18ae676ff38a8ca4695eb`
> - Review Audit Fix Revision: `5fcf9ee1fe9d6076e66e01333f7e3a1553fa6b8c`
>
> **Environment Distinction**:
> Application readiness has been verified across all integration and lifecycle suites in the local runtime environment connected to MongoDB Atlas. The application is not yet deployed to cloud hosting infrastructure. The portal is ready for deployment, not production-deployed.
>
> **Outstanding Engineering Considerations (Future Non-Blockers)**:
> 1. Redis-backed distributed rate limiting (for horizontal scaling across multiple node instances).
> 2. Cloud hosting infrastructure-as-code configuration and automated deployment pipelines.
> 3. Production TLS/SSL termination at the ingress or reverse proxy boundary.
> 4. Background-tab mobile browser eviction and visibilitychange refresh handling.

- **AQ-1: Six-Dimensional Assessment Quality Audit [COMPLETED]**:
  - Comprehensive empirical audit of the existing six behavioral dimensions across construct validity, denominator arithmetic, scoring fairness, and path equivalence.
- **AQ-2: Assessment Refinement Design Proposal [APPROVED — Version 2.5.0]**:
  - Decouples discrete decision encounters ($N$) from point ceilings.
  - Establishes the Global 16-point Threat Recognition budget invariant (Stage 7 early resolution = +4).
  - Specifies 5 universal Signal Identification forensic cue probes.
  - Reframes Decision Quality strictly around Stages 5 and 13 ($N=2, DQ_{\text{max}} = 4$).
  - Specifies partial compound unique index `{ assessmentSessionId: 1, idempotencyKey: 1 }` for valid string keys with safe retry and conflict handling.
  - Establishes fail-closed deployment cutover contract (`SCORING_V2_CUTOVER_DATE=2026-11-04T00:00:00.000Z`).
- **AQ-3: Controlled Implementation & Verification [COMPLETED]**:
  - *Wave 1: Backend Scoring Foundation*: Schema updates, fail-closed cutover resolution, `calculateScoresV2` with first-class `null` unassessed representation, discrete encounter tracking, and remediation confidence heuristics.
  - *Wave 2: Scenario Calibration & Atomic SI Probes*: Atomic submission validation (HTTP 400 with zero writes on missing probe), partial unique compound index (`{ assessmentSessionId: 1, idempotencyKey: 1 }`), replica-set ACID multi-document transactions with CAS rollback, approved UA decision ($N=4, \text{Max Penalty}=8$), and scenario calibration of Baseline v2 & Final v2 in `scenarios.json` and MongoDB Atlas.
  - *Wave 3: Client Presentation & Test Verification*: 2-step in-place forensic probe UI in `BaselineAssessment.jsx` and `FinalAssessment.jsx`, client `sessionStorage` idempotency key persistence across reloads/retries, penalty scoring transparency blocks in `DigitalAwarenessProfile.jsx`, focused sample badges, standardized terminology ("Criterion-Referenced Behavioral Diagnostic Rubric"), and automated test suites.
- **AQ-4: Integrated Assessment Validation [COMPLETED & FORMALLY ACCEPTED]**:
  - *Wave 1: Integration Contract Alignment*: Updated `stagingProductionSmoke.test.js` and `e2eUserJourneyAudit.js` to supply valid configured `signalProbeDecisionId` on probe stages, session-and-stage-scoped idempotency keys (`idemp_${sessionId}_${stageId}`), safe retry handling (`isRetry: true`), and verified historical v1 test suites remain 100% valid.
  - *Wave 2: Integrated Lifecycle Validation*: Implemented and verified `aq4_integrated_lifecycle.test.js` (12/12 passed, 100% pass) covering registration, baseline (both Path 1 and Path 2), 6-dimension behavioral profiling, deficit dimension ranking, 3-step adaptive remediation completion, final assessment prerequisite enforcement, paired-baseline delta calculation, dashboard journey synchronization, and defensive portfolio generation. Confirmed dimension scores remain immutable across drills.
  - *Wave 3: Browser Resumption & Expiration Recovery*: Implemented and verified `browser_resumption_smoke_test.js` with Playwright Chromium (Parts A–E passed 100%, 12 screenshots captured). Verified exact stage and probe restoration after browser reloads at Stages 2, 6, 10 in both Baseline and Final, clean recovery from expired session caches, and safe completed summary re-entry with zero duplicate sessions created. Fixed `computeBehaviourDelta` scope and defensive `toObjectSafe` serialization on `/api/assessments/status/:scenarioCode`.

---

### Stage 3 — Counterfactual Scenario Learning
**Status**: PLANNING IN PROGRESS (Revised Design Proposal Prepared; Implementation Unauthorized)

> [!IMPORTANT]
> Planning and discovery for Stage 3 were authorized by the user on 2026-11-04. The revised design proposal addressing review findings has been prepared in [`.planning/STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md`](file:///c:/Users/Asus/Desktop/cyber-law-portal/.planning/STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md).
>
> **Implementation remains strictly unauthorized.** No product code, database schemas, API routes, scenario seeds, or test suites may be modified until the user explicitly reviews and approves the proposal.

Develop educational simulation experiences that demonstrate alternative outcomes based on different learner decisions:
- Interactive "What happens if...?" exploration:
  - What happens when a learner verifies a suspicious request through official channels vs ignores it?
  - What happens when they trust an unknown sender in an emergency impersonation scenario?
  - What happens when they share sensitive credentials or enter UPI PINs on collect requests?
- **Strict Invariants**:
  - These simulations are purely educational and exploratory.
  - They must **never** modify, overwrite, or corrupt immutable historical assessment records.
  - Audit existing simulator components before proposing new infrastructure.

---

### Stage 4 — Digital Rights & Privacy Education
**Status**: PENDING (Original Phase 5)

Expand the educational curriculum and reference catalog to cover:
- Personal data, digital identity, and individual privacy.
- Consent architecture, data fiduciary obligations, and data principal rights.
- Intellectual property, digital copyright, fair use, and piracy.
- Malware taxonomy, unsafe downloads, and malicious application sideloading.
- Explicit legal distinction between copyright infringement and personal-data misuse.
- Statutory accuracy: Clearly distinguish active statutory provisions (`IN_FORCE`) from enacted provisions with future operational commencement dates (`ENACTED_FUTURE_COMMENCEMENT`).

---

### Stage 5 — Spaced Retrieval & Long-Term Retention
**Status**: PENDING (Separate Retention Workstream)

> [!NOTE]
> This is an independent knowledge-retention initiative. It must remain strictly decoupled from six-dimensional behavioral assessment scores.

Controlled execution sequence:
- **RT-1: Audit Existing Retention Infrastructure**: Audit existing quiz recall, spaced review, and user progress mechanisms already present in the codebase.
- **RT-2: Propose Justified Architecture Improvements**: Design evidence-based improvements only where actual gaps exist, avoiding duplicate systems.
- **RT-3: Implement Approved Improvements**: Implement approved changes under explicit user authorization.
- **RT-4: Empirical Validation**: Verify long-term knowledge retention and recall efficacy through automated testing.

---

### Stage 6 — Dashboard Integration & Refinement
**Status**: PENDING (Original Phase 6)

Synthesize all completed learning, assessment, and recall capabilities into a single, cohesive learner journey:
- Functional integration of:
  - Behavioral assessment profiles and delta tracking.
  - Adaptive learning pathways and micro-learning interventions.
  - Curriculum chapters and statutory lessons.
  - Knowledge quizzes and spaced retrieval recalls.
  - Counterfactual scenario simulations.
  - Digital rights and privacy modules.
  - Verified Defensive Learning Portfolio and long-term history.
- **Scope Boundary**: This stage concerns functional integration, journey state machines, and flow coherence — **not** broad visual redesign.

---

## 3. Separate Workstream: Post-Development Design Improvement
**Status**: DEFERRED — DO NOT START DURING CURRENT ENGINEERING WORK  
**Registry**: [`.planning/DESIGN_IMPROVEMENT_BACKLOG.md`](file:///c:/Users/Asus/Desktop/cyber-law-portal/.planning/DESIGN_IMPROVEMENT_BACKLOG.md)

- Broad visual redesign, aesthetic overhaul, and styling improvements are strictly deferred until the complete technical, educational, and architectural foundation (Stages 1 through 6) is built, integrated, and verified.
- The Milestone 3.3 structural freeze protects navigation and data integrity; it does not permanently prohibit future design improvements.
- When initiated, visual work will follow a thoughtful, editorial, warm, and restrained aesthetic, avoiding generic SaaS cards, flashing gamification, and neon cyberpunk tropes.

---

## 4. Mandatory Development Methodology

All future engineering initiatives must strictly follow this nine-step cycle:

1. **Audit Existing Implementation & Documentation**: Thoroughly inspect existing code, schemas, and planning docs before proposing changes.
2. **Identify Actual Gaps & Defects**: Establish evidence-backed gaps rather than theoretical assumptions.
3. **Distinguish Confirmed Problems from Hypotheses**: Validate observed evidence before treating an issue as real.
4. **Prepare an Evidence-Based Proposal**: Write a comprehensive, standalone design specification with trade-offs.
5. **Obtain Explicit User Approval**: Never begin implementation without unambiguous authorization.
6. **Implement in Controlled Stages**: Execute in discrete, incremental waves.
7. **Execute Relevant Tests & Regression Checks**: Verify with automated test suites against live database environments.
8. **Report Results & Outstanding Risks**: Deliver comprehensive standardized eight-section reports.
9. **Obtain Acceptance Before Advancing**: Secure sign-off before proceeding to the next roadmap stage.

---

## 5. Phase Numbering Reconciliation Table

To eliminate past ambiguity across planning documents, the following table formally reconciles historical and workstream phase numbers:

| Canonical Stage & Workstream | Historical / Informal Identifier | Status | Scope & Definition |
| :--- | :--- | :--- | :--- |
| **Stage 1: Core Learner Experience** | Phases 1, 2, 3 / Milestones 3.1, 3.2, 3.3 | **COMPLETED & FROZEN** | Registration, baseline assessment, 6-metric profile, pathways, final assessment, navigation fixes, structural freeze. |
| **Stage 2: Assessment Quality & Reliability** | "Phase 4.1", "Phase 4.2", "Phase 4.3", "Phase 4.4" / AQ-1..4 | **COMPLETED & FORMALLY CLOSED** | Independent assessment-hardening workstream: AQ-1 (Audit complete), AQ-2 (Design v2.5.0 approved), AQ-3 (Implementation verified), AQ-4 (Integrated validation complete & accepted). Stage 2 closed. |
| **Stage 3: Counterfactual Scenario Learning** | Original Phase 4 | **PLANNING IN PROGRESS** | Educational alternative-choice simulations ("What happens if...?"). Revised design proposal prepared in `.planning/STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md`. Implementation unauthorized. |
| **Stage 4: Digital Rights & Privacy Education** | Original Phase 5 | **PENDING** | Curriculum expansion: personal data, consent, privacy, copyright, piracy, malware. |
| **Stage 5: Spaced Retrieval & Long-Term Retention** | Separate Retention Initiative / RT-1..4 | **PENDING** | Dedicated retention workstream: audit existing recall, propose improvements, implement, and validate. Separate from behavioral scoring. |
| **Stage 6: Dashboard Integration & Refinement** | Original Phase 6 | **PENDING** | Macro journey integration connecting all assessment, curriculum, counterfactual, and retention streams. |
| **Separate Workstream: Post-Development Design** | "Design Pass", "UI Polish", Backlog | **DEFERRED** | Standalone visual, typographic, layout, and editorial polish pass. Initiates only after Stages 1–6 complete. |
