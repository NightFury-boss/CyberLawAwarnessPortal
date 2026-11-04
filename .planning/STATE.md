# Project State & Current Position

## 1. Milestone Status & Position
- **Active Canonical Stage**: **Stage 3 — Counterfactual Scenario Learning (IN PROGRESS — Wave 1 Completed)**
  - `Stage 1`: Core Learner Experience — **COMPLETED & FROZEN** (Milestone 3.3 Closed)
  - `Stage 2`: Assessment Quality & Reliability — **COMPLETED & FORMALLY CLOSED** (AQ-1, AQ-2, AQ-3, AQ-4 Accepted)
  - `Stage 3`: Counterfactual Scenario Learning — **IN PROGRESS**
    - Architecture audit & feasibility evaluation: **COMPLETED**
    - Final Reconciled Design Proposal: **PREPARED** ([`.planning/STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md`](file:///c:/Users/Asus/Desktop/cyber-law-portal/.planning/STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md))
    - Wave 1 (4 Scenario Data Fixtures): **COMPLETED & TESTED** ([`client/src/data/counterfactualScenarios.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/data/counterfactualScenarios.js))
    - Wave 2 (Components) & Wave 3 (Verification): **STRICTLY UNAUTHORIZED** (Awaiting separate user authorization)
  - `Stage 4`: Digital Rights & Privacy Education (Original Phase 5) — **PENDING**
  - `Stage 5`: Spaced Retrieval & Long-Term Retention (RT-1..4) — **PENDING**
  - `Stage 6`: Dashboard Integration & Refinement (Original Phase 6) — **PENDING**
- **Preserved Verified Baseline Revisions**:
  - Implementation Revision: `a196c34acefde13fa6898745fd39ae8f1242a3a8`
  - Documentation Alignment Revision: `72b7f5ca155681ce2fc18ae676ff38a8ca4695eb`
  - Review Audit Fix Revision: `5fcf9ee1fe9d6076e66e01333f7e3a1553fa6b8c`
- **Environment Distinction**:
  - Locally verified application readiness across all integration and lifecycle suites connected to MongoDB Atlas replica set.
  - No hosted cloud production deployment (e.g. AWS/Vercel/Render hosting) has been evaluated or established.
  - The portal is ready for deployment, not production-deployed.
- **Outstanding Engineering Considerations (Future Non-Blockers)**:
  - Redis-backed distributed rate limiting (for horizontal multi-instance scaling).
  - Cloud hosting infrastructure-as-code and automated deployment pipelines.
  - Production TLS/SSL termination at the ingress or reverse proxy boundary.
  - Background-tab mobile browser visibilitychange eviction and cache refresh handling.
- **Separate Deferred Workstream**:
  - `Post-Development Design Improvement`: **DEFERRED** (Tracked in [`.planning/DESIGN_IMPROVEMENT_BACKLOG.md`](file:///c:/Users/Asus/Desktop/cyber-law-portal/.planning/DESIGN_IMPROVEMENT_BACKLOG.md); initiates only after Stages 1–6 complete).
- **System Health**: All automated test suites pass 100% with 0 errors. Client Vite production build succeeds with 0 errors (built in ~446ms). MongoDB Atlas cluster healthy and accessible.
- **Authoritative Model**: Six-Dimensional Behavioral Model (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) authoritative, server-enforced, and immutably versioned. Standardized to "Criterion-Referenced Behavioral Diagnostic Rubric".

---

## 2. Completed Assessment Refinement Specification (AQ-3 v2.5.1 Amended)
The implemented and verified design specification establishes:
1. **Scoring Version Isolation & Cutover Contract**:
   - `SCORING_V2_CUTOVER_DATE=2026-11-04T00:00:00.000Z` in `server/.env`.
   - `cutoverConfig.js` enforces synchronous fail-closed validation at startup.
   - Deterministic resolver preserves explicit versions, maps pre-cutover sessions to v1, stamps new post-cutover sessions as v2 at birth, and rejects unknown versions with `UNSUPPORTED_SCORING_VERSION`.
2. **Global 16-Point Threat Recognition Budget**:
   - Both Path 1 (Early Resolution via Stage 7 -> Stage 8 -> Stage 10) and Path 2 (Escalation & Late Recovery via Stage 7 -> Stage 9 -> Stage 10) operate against a strict 16-point denominator.
   - Stage 7 early termination awards +4 TR and +2 VB; Stage 9 late recovery awards +2 TR and +2 VB.
3. **Signal Identification Universal Forensic Probes**:
   - 5 discrete 4-option forensic cue probes deployed across common stages (Stages 2, 3, 10, 11, 12).
   - Atomic submission: stage submissions missing mandatory probe IDs fail with HTTP 400 (`INCOMPLETE_STAGE_SUBMISSION`) with zero database mutations.
   - 2-step learner interaction: primary choice renders probe dynamically; learner selects cue before confirming.
   - Client persists stage idempotency key in `sessionStorage` (`idemp_${sessionId}_${stageId}`) across reloads and retries.
4. **Construct-Pure Decision Quality (DQ)**:
   - DQ construct stripped of verification and panic overlaps; evaluated exclusively across Stages 5 and 13 ($N=2, DQ_{\text{max}} = 4$). Stage 14 (Evening Closure) strictly non-scoring.
5. **Approved UA Model ($N=4, \text{Max Penalty}=8$)**:
   - Unreviewed Acceptance evaluated across 4 genuine encounters on both paths (Stages 3, 4, 6, 10).
   - No manufactured 5th encounter; exact path parity.
6. **Idempotency & Partial Unique Compound Index**:
   - Unique partial compound index on `AssessmentDecision`: `{ assessmentSessionId: 1, idempotencyKey: 1 }` with `{ unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $type: "string" } } }`.
   - Safe retry returns HTTP 200 (`isRetry: true`); mismatched payload or re-submission conflicts return HTTP 409.
   - Multi-document transactions on MongoDB Atlas replica set ensure atomic rollbacks.
7. **First-Class Null Representation & Confidence Heuristics**:
   - Unassessed dimensions ($N=0$) are stored as `null` in `behaviourScores`, excluded from remediation rankings, and rendered as neutral unassessed cards in `DigitalAwarenessProfile.jsx`.
   - Low-sample heuristic dampener (0.70) applied for $N \in [2, 3]$ with `(Focused sample)` visual badges in the UI.
   - False Positive cumulative penalty $\le 2$ treated as `STRENGTH` across both 4-encounter and 3-encounter paths.
   - Scoring transparency blocks for penalty dimensions (`FP` and `UA`) in `DigitalAwarenessProfile.jsx` show accrued penalties, applicable max penalties, evaluated encounters, and the $\le 2$ penalty threshold.

---

## 3. Officially Frozen Learner Experience Structure (Stage 1 Baseline)
The following structural specifications remain invariant:
1. **Canonical Learner Journey**:
   - Six mutually exclusive learner states evaluated deterministically in `PrimaryFocus.jsx` via `client/src/utils/dashboardJourneySelectors.js`.
2. **Component & Route Ownership**:
   - `/dashboard` (`Dashboard.jsx`) owns macro orientation, study dossier, pathway execution launching, quiz studio, and portfolio drawer.
   - `/assessment/baseline` and `/assessment/final` own dedicated simulation flows with CAS atomic concurrency locks.
   - `DigitalAwarenessProfile.jsx` owns diagnostic interpretation and statutory grounding.
   - `PathwayRunner.jsx` owns 3-step structured intervention execution as a modal dialog.
3. **Verified Defensive Learning Portfolio**:
   - Standardized to "Verified Defensive Learning Portfolio" across three discrete pillars (Interventions, Knowledge Practice, Behavioral Trajectory).
4. **Statutory Accuracy & Legal Status Taxonomy**:
   - `IN_FORCE`: IT Act 2000 §§ 43, 66, 66C, 66D; BNS 2023 §§ 318(4), 319; BSA 2023 § 63.
   - `ENACTED_FUTURE_COMMENCEMENT`: DPDP Act 2023 §§ 6, 8, 11 under G.S.R. 843(E) dated 13 November 2025 (not in force on 3 November 2026).
   - `STRUCK_DOWN_HISTORICAL`: IT Act 2000 § 66A struck down in *Shreya Singhal v. Union of India (2015)*.
5. **Cybercrime Emergency Reporting Principles**:
   - Directs victims immediately to National Cybercrime Helpline **1930** and official portal `https://cybercrime.gov.in`.
   - Explains prompt reporting supports CFCFRMS inter-bank hold coordination without guaranteeing fund recovery, avoiding fixed "Golden Hour" claims.

---

## 4. Current Execution Boundary & Immediate Next Action
- **Current Position**: Stage 3 (Counterfactual Scenario Learning) **IN PROGRESS — Wave 1 Completed**. 4 declarative scenario data fixtures authored in [`client/src/data/counterfactualScenarios.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/data/counterfactualScenarios.js) and validated in [`server/tests/counterfactualFixtures.test.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/tests/counterfactualFixtures.test.js).
- **Next Canonical Step**: User review of Wave 1 fixtures and potential explicit authorization of Wave 2 (React component development).
- **Strict Authorization Boundary**: Wave 2 (React components, routing, UI) and Wave 3 (integration tests) **remain strictly unauthorized**. Zero React components, backend routes, database schemas, or assessment engines may be modified without explicit authorization.
- **Strict Invariants**: All Stage 1 and Stage 2 assessment scoring invariants, six-dimensional behavioral rubrics, immutable historical assessment sessions, and visual redesign freeze rules remain strictly enforced.
- **Deferred Workstream**: Post-Development Design Improvement is strictly deferred to [`.planning/DESIGN_IMPROVEMENT_BACKLOG.md`](file:///c:/Users/Asus/Desktop/cyber-law-portal/.planning/DESIGN_IMPROVEMENT_BACKLOG.md).

---

## 5. Verification Status Summary

### Counterfactual Scenario Learning (Stage 3 Wave 1)
- `node server/tests/counterfactualFixtures.test.js` -> 100% GREEN (5/5 comprehensive test suites passed covering schema conformance, tri-branch consequence depth, safety & privacy constraints, statutory accuracy [BNSS § 35(3), BNS §§ 308/319, IT Act §§ 66C/43, UPI PIN invariant], and multi-tier isolation with zero server/assessment imports).
- `npm run build --prefix client` -> 100% GREEN (81 modules transformed, 0 errors, built in ~452ms).

### Integrated Assessment Validation (AQ-4)
- `node server/tests/stagingProductionSmoke.test.js` -> 100% GREEN (13/13 tests passed, duration: ~6.9s).
- `node server/tests/e2eUserJourneyAudit.js` -> 100% GREEN (12/12 steps passed, 0 failures).
- `node --test server/tests/aq4_integrated_lifecycle.test.js` -> 100% GREEN (12/12 comprehensive lifecycle tests passed, duration: ~68.8s).
- `node scripts/browser_resumption_smoke_test.js` -> 100% GREEN (Parts A–E passed; 12 screenshots captured covering mid-session reloads at Stages 2, 6, 10, completed re-entry, and expired session recovery).
- `npm run build --prefix client` -> 100% GREEN (81 modules transformed, 0 errors, built in ~589ms).

### Assessment Foundation & Rubric Verification
- `node server/tests/scoring_v2_authoritative.test.js` -> 100% GREEN (15/15 checks passed).
- `node server/tests/scoring_path_equivalence.test.js` -> 100% GREEN (3/3 comprehensive paths passed; Path 1 vs Path 2 exact 16 TR / 10 SI / 16 VB / 4 DQ parity, honest FP score divergence, unified STRENGTH classification).
- `node server/tests/si_idempotency_atomicity.test.js` -> 100% GREEN (7/7 checks passed; mandatory probe atomic rejection with zero DB writes, idempotent retry HTTP 200, conflict detection HTTP 409, and partial unique index compatibility).
- `node server/tests/behavioralAuthoritativeResult.test.js` -> 100% GREEN (Tests A–G passed 100%).
- `node server/tests/remediationEngine.test.js` -> 100% GREEN (Tests A–M passed 100%).
- `node server/tests/phase2_awareness_profile.test.js` -> 100% GREEN (10/10 checks passed).
- `node server/tests/phase3_2_navigation_and_integrity.test.js` -> 100% GREEN (7/7 checks passed).
