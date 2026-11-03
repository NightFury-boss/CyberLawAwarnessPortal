# Cyber Law Awareness Portal — Engineering Context & Technical Reference

This document serves as the primary technical context and single source of truth for the **Cyber Law Awareness Portal**. All specifications, operational constraints, and architectural invariants are organized according to our three-tier governance taxonomy.

---

## 1. Governance Taxonomy

Every concept, specification, and artifact in the repository is classified into exactly one of three categories:

| Taxonomy Category | Definition & Authority Level | Modification Rules |
| :--- | :--- | :--- |
| **`[Current]`** | Formally approved, fully implemented, verified by automated test suites, and actively running in production/dev. | Canonical source of truth. Changes require explicit user authorization and regression testing. |
| **`[Historical]`** | Immutable audit records, superseded specifications, archived designs, and past phase deliverables. Retained solely for compliance, auditability, and backward-compatibility reference. | **Strictly immutable.** Never edit, rewrite, or delete historical records to match current reality; record an amendment instead. |
| **`[Proposed]`** | Unapproved draft proposals, forward-looking concepts, exploratory sketches, or ideas under consideration. | Explicitly labeled as proposals. Never treat as current implementation requirements until formally approved. |

---

## 2. System Architecture & Technology Stack `[Current]`

The portal bridges Indian digital statutory frameworks with everyday digital behavior via an experiential, interactive loop:
$$\text{Experience} \longrightarrow \text{Understand} \longrightarrow \text{Learn} \longrightarrow \text{Practice} \longrightarrow \text{Improve}$$

### Architectural Invariants:
1. **Server-Authoritative Scoring**: All scoring, metric evaluations, thresholds, and state progressions are executed strictly on the backend. Client payloads submitting precomputed scores or metrics are ignored.
2. **Discrete Six-Dimensional Behavioral Model**: Measures six independent dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`). Never combines metrics into a single composite average. Completely unassessed dimensions return `null`.
3. **Multi-Document ACID Transactions**: MongoDB Atlas replica set multi-document transactions ensure atomic session updates and stage advancements with rollback protection.
4. **Idempotency & Partial Unique Index**: Concurrent duplicate submissions and client network retries are handled idempotently via a partial unique compound index on `AssessmentDecision`.
5. **Scenario Version & Session Immutability**: Historical completed assessment sessions and their decision evidence records are permanently immutable.

### Technology Stack:
- **Client (SPA)**: React.js 18, Vite 6, React Router DOM 6, Lucide React, vanilla CSS design tokens (warm editorial styling, zero neon/cyberpunk aesthetics).
- **Backend (API)**: Node.js (v24 LTS) + Express.js REST API with JWT authentication, HTTP security headers, and RBAC (`user`, `admin`).
- **Database**: MongoDB Atlas (3-node replica set `Cluster0` / `ac-0t3cegi-shard-00`) via Mongoose 8+.
- **Statutory Corpus**: Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, Digital Personal Data Protection Act 2023, and Bharatiya Sakshya Adhiniyam 2023.

---

## 3. Authoritative Behavioral Rubric Specification (v2.5.1 Amended) `[Current]`

Standardized Name: **Criterion-Referenced Behavioral Diagnostic Rubric**

### Summary Matrix:
| Behavioral Metric | Code | Type | Encounters ($N$) | Denominator / Max Penalty | Baseline Encounters | Final Encounters | Demonstrated Strength Threshold |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Threat Recognition** | `TR` | Accumulative | 7 (P1) / 8 (P2) | **16 points** | 7 common stages (12 pts) + Stage 7 early resolution (4 pts) on P1; 7 stages + Stg 9 (2 pts) + Stg 11 (2 pts) on P2 | Identical | $\ge 75\%$ |
| **Signal Identification** | `SI` | Accumulative | 5 | **10 points** | Stages 2, 3, 10, 11, 12 (5 probes $\times$ 2 pts) | Stages 2, 3, 10, 11, 12 | $\ge 75\%$ |
| **Decision Quality** | `DQ` | Accumulative | 2 | **4 points** | Stage 5 (Google Sign-In) & Stage 13 (OS Update) | Stages 5 & 13 | $\ge 75\%$ |
| **Verification Behaviour** | `VB` | Accumulative | 8 | **16 points** | 8 independent verification situations $\times$ 2 pts | 8 situations | $\ge 75\%$ |
| **False Positive Control** | `FP` | Penalty-Deductive | 4 (P1) / 3 (P2) | **8 pts (P1) / 6 pts (P2)** | Stages 1, 5, 8A, 13 (P1); Stages 1, 5, 13 (P2) | Stages 1, 5, 8A, 13 | Penalty $\le 2$ pts |
| **Unreviewed Acceptance** | `UA` | Penalty-Deductive | 4 | **8 points** | Stages 3, 4, 6, 10 (4 encounters $\times$ 2 pts) | Stages 3, 4, 6, 10 | Penalty $\le 2$ pts |

### Detailed Metric Definitions:
1. **Threat Recognition (`TR`, Denominator = 16)**:
   - Measures detection of deceptive, fraudulent, or malicious patterns.
   - **Path 1 (Early Resolution)**: 6 common stages $\times$ 2 pts = 12 pts + Stage 7 early resolution = 4 pts $\longrightarrow$ Total = **16 pts**.
   - **Path 2 (Escalation & Late Recovery)**: 6 common stages $\times$ 2 pts = 12 pts + Stage 7 vulnerable = 0 pts + Stage 9 late recovery = 2 pts + Stage 11 = 2 pts $\longrightarrow$ Total = **16 pts**.
   - Guarantees exact mathematical parity between safe and risky branching paths.
2. **Signal Identification (`SI`, Denominator = 10)**:
   - Measures identification of specific forensic indicators (e.g. domain mismatches, VPA spoofing, unauthorized permissions).
   - Deployed as 5 universal forensic probes across Stages 2, 3, 10, 11, and 12.
   - Each probe offers 4 options with exactly 1 correct forensic cue.
   - **2-Step Interaction Contract**: Learner selects primary situational action (Step 1), forensic probe dynamically renders in-place, learner selects identified cue (Step 2), and confirms submission atomically.
   - Client persists `idempotencyKey` in `sessionStorage` per stage until response succeeds.
3. **Decision Quality (`DQ`, Denominator = 4)**:
   - Measures administrative hygiene, password management, and operational decision-making.
   - Pure construct: completely stripped of verification and panic overlaps. Evaluated exclusively in Stage 5 (Browser Sign-In Prompt) and Stage 13 (OS Patch Notification). Stage 14 (Evening Closure) is non-scoring.
4. **Verification Behaviour (`VB`, Denominator = 16)**:
   - Measures active out-of-band validation across 8 situations.
   - Scored on an explicit ordinal scale: Strong out-of-band verification = 2 pts, Partial in-band verification = 1 pt, Blind action / unverified disengagement = 0 pts.
5. **False Positive Control (`FP`, Max Penalty = 8 on Path 1, 6 on Path 2)**:
   - Measures avoidance of unwarranted panic or over-reporting on legitimate, routine notifications.
   - Normalized score: $\max\left(0, \left(1 - \frac{\text{penalties}}{\text{maxPenalty}}\right) \times 100\right)$.
   - Single-slip safeguard: An isolated over-reporting error ($\le 2$ penalty points) is categorized as `Demonstrated Strength` across both paths.
6. **Unreviewed Acceptance Control (`UA`, Max Penalty = 8 across 4 genuine encounters)**:
   - Measures resistance to autopilot compliance, reflexive permission grants, and unreviewed transactions.
   - Evaluated across Stages 3, 4, 6, and 10 on both paths.
   - No manufactured 5th encounter; preserves pedagogical integrity and exact path parity.

---

## 4. Concurrency, Idempotency & Database Integrity `[Current]`

### Partial Unique Compound Index:
- Collection: `assessmentdecisions`
- Index Key: `{ assessmentSessionId: 1, idempotencyKey: 1 }`
- Options: `{ unique: true, partialFilterExpression: { idempotencyKey: { $exists: true, $type: "string" } } }`
- **Compatibility**: Allows historical unversioned and v1 decisions lacking an `idempotencyKey` to coexist without index collision.

### Submission Lifecycle:
1. **Validation**: For v2 sessions, `idempotencyKey` is mandatory (non-empty alphanumeric string $\ge 8$ chars). Missing, empty, whitespace, or malformed keys return HTTP 400 (`MISSING_IDEMPOTENCY_KEY`, `INVALID_IDEMPOTENCY_KEY`, `MALFORMED_IDEMPOTENCY_KEY`).
2. **Mandatory Signal Probe**: If stage has `hasSignalProbe: true`, `signalProbeDecisionId` is mandatory. Omission returns HTTP 400 (`INCOMPLETE_STAGE_SUBMISSION`) with zero writes.
3. **Idempotent Retry**: Re-submitting the exact same payload with the identical key returns HTTP 200 with `{ isRetry: true }`.
4. **Conflict Detection**:
   - Same key with differing decision payload returns HTTP 409 (`IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`).
   - Same stage already committed with a different key returns HTTP 409 (`STAGE_DECISION_ALREADY_COMMITTED`).
5. **Atomic Commit**: Handled inside a MongoDB multi-document session with Compare-and-Swap (CAS) stage pointer advancement. Aborts transaction on any error, leaving zero partial state.

---

## 5. Scoring Version Resolution & Cutover `[Current]`

Enforced via `server/config/cutoverConfig.js` and `assessmentScoringService.js`:
- `SCORING_V2_CUTOVER_DATE=2026-11-04T00:00:00.000Z`
- **Environment Distinction**: Operational cutover to Scoring v2 was verified strictly within the **tested local development and automated test runtime environment** connected to the live MongoDB Atlas replica set. No cloud production deployment (e.g. AWS/Vercel/Render hosting) has been established or evaluated.
- **Deterministic Resolution**:
  - Explicit `scoringVersion: 2` $\longrightarrow$ v2 (active for all newly created sessions at birth)
  - Explicit `scoringVersion: 1` $\longrightarrow$ v1 (immutable historical protection)
  - Pre-cutover unversioned sessions $\longrightarrow$ v1
  - Legacy test fixtures lacking `createdAt` $\longrightarrow$ v1
  - Unsupported version (e.g. 3) $\longrightarrow$ Fails closed with error (`UNSUPPORTED_SCORING_VERSION`)

---

## 6. Integrated Assessment Lifecycle & Resumption Contracts `[Current]`

### Scenario Graph Topology & Experienced Situations:
- **Baseline and Final Scenarios** contain 14 database stage records, producing exactly **13 experienced situations** for every learner:
  - Stages 1–6: Linear common path.
  - Stage 7: Branching node. Decision 1/3 $\longrightarrow$ Stage 8 (Path 1: Bank KYC, legitimate); Decision 2 $\longrightarrow$ Stage 9 (Path 2: Skype interrogation, malicious).
  - Stages 8 & 9: Both converge cleanly to Stage 10.
  - Stages 10–14: Linear convergence common path.
- **Universal Forensic Signal Probes**: Present at **Stages 2, 3, 10, 11, and 12** (5 total probes $\times$ 2 pts = 10 pts SI).
- **Opportunity Parity**:
  - `TR`: 16 points (Both paths).
  - `SI`: 10 points (Both paths).
  - `VB`: 16 points (Both paths, 8 situations $\times$ 2 pts).
  - `DQ`: 4 points (Both paths, 2 situations $\times$ 2 pts).
  - `FP`: 8 points on Path 1 (traverses legitimate Stage 8), 6 points on Path 2 (traverses malicious Stage 9). Normalized to 0–100%. Single-slip threshold ($\le 2$ penalty points) earns `Demonstrated Strength`.
  - `UA`: 8 points (Both paths, 4 genuine encounters $\times$ 2 pts max penalty).

### Resumption & Recovery Guarantees:
1. **Mid-Session Browser Reload**: At Stages 2, 6, and 10 in both Baseline and Final, reloading the browser restores the active session ID, current stage heading, mock interface, decision choices, and unconfirmed signal probe panel state without session duplication or state loss.
2. **Expired-Session Cache Recovery**: If a client attempts to load `/assessment/baseline` or `/assessment/final` with an expired session in `sessionStorage`, the client and backend transition cleanly, remove the stale key, update status to `abandoned`, and render the initial start briefing without unhandled exceptions.
3. **Completed Assessment Re-entry**: Returning to `/assessment/baseline` or `/assessment/final` after completion safely renders the completed summary view (`completed_summary`), displays the 6 behavioral habit benchmarks, and prevents duplicate session creation.
4. **Prerequisite Enforcement**: Attempting to start the Final Assessment (`POST /api/assessments/start` with `scenarioCode: 'final'`) without a completed Baseline session returns HTTP 403 (`PREREQUISITE_NOT_MET`).
5. **Score Immutability**: Authoritative assessment session scores and encounter opportunities remain 100% frozen across all remediation pathway drills, learning checkpoints, and knowledge practice.

---

## 7. Superseded Values Register `[Historical]`

The following historical parameters, drafts, and specifications have been formally superseded and must not be used in current implementations:

| Domain | Historical / Superseded Parameter `[Historical]` | Current Authoritative Specification `[Current]` | Supersession Rationale |
| :--- | :--- | :--- | :--- |
| **UA Encounters** | $N=5$, Max Penalty = 10 points | $N=4$, Max Penalty = **8 points** | Approved UA Decision: Stage 5 measures auth hygiene (`DQ` and `FP`). Forcing a manufactured UA option into Stage 5 would re-conflate DQ and UA. 4 genuine encounters exist across Stages 3, 4, 6, 10. |
| **TR Denominator** | Path 1 = 16, Path 2 = 14 (Draft v2.2.0) | Both Paths = **16 points** | Path 2 TR arithmetic resolved: 6 common stages $\times 2 = 12$ + Stage 7 vulnerable = 0 + Stage 9 late recovery = 2 + Stage 11 = 2 $\longrightarrow$ 16 points. |
| **DQ Encounters** | 12 situations $\times 2 = 24$ points (Phase 2.3) | 2 encounters $\times 2 = \mathbf{4\text{ points}}$ | DQ construct previously overlapped with VB and TR. Now isolated strictly to administrative scheduling/hygiene (Stages 5 and 13). |
| **SI Mechanism** | Co-mingled secondary tag on primary decision | **5 Universal Forensic Probes** (10 pts) | Signal identification must be an independent cognitive observation, not inferred from primary action. 2-step learner interaction. |
| **Overall Score** | Single composite average percentage | **No Composite Score** | Averaging independent psychological dimensions produces psychometric distortion. Each of the 6 dimensions is reported independently. |
| **Unassessed Metrics**| Reported as 0% or uncalculated average | **First-Class `null`** | Metrics with zero opportunities return `null` and are excluded from remediation ranking. |
| **Idempotency Index**| Sparse compound index `{ sessionId: 1, key: 1 }` | **Partial Unique Compound Index** | Sparse index was non-unique and failed to prevent concurrent race conditions. Partial unique index guarantees replica-set ACID protection. |

---

## 8. Canonical Test Suites & Verification Commands `[Current]`

All tests execute against MongoDB Atlas replica set (`ac-0t3cegi-shard-00`). Outbound network access requires `BypassSandbox: true` on restricted runner environments.

```bash
# 1. Real Concurrency & Replica-Set ACID Multi-Document Transactions (11/11 checks)
node server/tests/concurrency_idempotency_real.test.js

# 2. Mandatory Signal Probe Atomicity & Conflict Detection (8/8 checks)
node server/tests/si_idempotency_atomicity.test.js

# 3. SI Two-Step Learner Interaction & Component Contracts (20/20 checks)
node server/tests/si_learner_interaction_verification.test.js

# 4. Scoring Path Equivalence & Mathematical Parity (3/3 checks)
node server/tests/scoring_path_equivalence.test.js

# 5. Authoritative Scoring v2 Architecture & Version Resolver (15/15 checks)
node server/tests/scoring_v2_authoritative.test.js

# 6. Authoritative Six-Metric Behavioral Profile (Tests A–G)
node server/tests/behavioralAuthoritativeResult.test.js

# 7. Learner Journey, Prerequisite Boundary & Immutability (Tests 1–7)
node server/tests/phase3_2_navigation_and_integrity.test.js

# 8. Adaptive Remediation Engine & Legal Validation (Tests A–M)
node server/tests/remediationEngine.test.js

# 9. Digital Awareness Profile Acceptance Suite (10/10 checks)
node server/tests/phase2_awareness_profile.test.js

# 10. "Your Digital Day" End-to-End Simulation Traversal (Tests A–M)
node server/tests/digitalDay.test.js

# 11. Delta Version-Isolation & Cross-Version Protection
node server/tests/deltaIsolation.test.js

# 12. Scenario Graph Integrity & Reference Path Verification
node server/utils/verifyScenarios.js

# 13. Client Production Build
npm run build --prefix client

# 14. Playwright End-to-End Live Browser Smoke Test (10/10 probes across Baseline & Final)
node scripts/browser_si_smoke_test.js

# 15. Staging & Production Smoke Test Suite (13/13 checks)
node server/tests/stagingProductionSmoke.test.js

# 16. Comprehensive End-to-End User Journey Audit (12/12 steps)
node server/tests/e2eUserJourneyAudit.js

# 17. Integrated Assessment Lifecycle Validation Suite (12/12 checks)
node --test server/tests/aq4_integrated_lifecycle.test.js

# 18. Browser Resumption & Expiration Recovery Smoke Test (Parts A–E, 12 screenshots)
node scripts/browser_resumption_smoke_test.js
```

