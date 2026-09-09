# Phase 5: Habit Retention, Targeted Reinforcement & Longitudinal Evidence — Revised Architectural Plan

## 1. Non-Negotiable Guardrails & Frozen Dependencies

The following modules, formulas, and boundaries are **STRICTLY FROZEN**:
1. `server/services/assessmentScoringService.js` — Untouched.
2. Phase 2 Six-Metric Behavioral Model (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) — Kept strictly discrete; never averaged into an "Overall Score" or letter grade.
3. Phase 3 Remediation Engine (`remediationEngineService.js`) — Ranking formula ($Deficit \times SeverityWeight \times OpportunityFactor$) remains untouched.
4. Phase 3 Legal Catalog & Statutory Classifications (`remediationCatalog.js`) — Unaltered.
5. Phase 4 Pathway Runner Architecture (`PathwayRunner.jsx`) — Reused as a foundation for reinforcement mode without changing its internal state machine.
6. Phase 4 `completedPathways` Model — Preserved exclusively for initial recommended pathway completions; not overwritten or conflated with reinforcement.
7. Phase 4 Server-Authoritative Checkpoint Validation — Enforced on all quiz submissions.
8. Historical v1 / v2 Assessment Isolation — Preserved; v1 sessions are excluded from retention calculations.
9. Zero Gamification — No XP, virtual coins, leaderboards, or artificial streak counters.
10. Zero New MongoDB Collections — All Phase 5 functionality must be composed from existing collections (`UserProgress`, `AssessmentSession`, `QuizAttempt`).

---

## 2. Phase 5 Scope Breakdown

### Phase 5A: Targeted Habit Reinforcement (Primary Intervention)
- **Objective**: Close the loop on persistent vulnerabilities (`continued_practice`) or regressed habits (`emerging_gap`) discovered during the user's latest completed assessment.
- **Workflow**:
  1. Assessment reveal or Dashboard identifies persistent weakness via `remediationEngineService.generateRemediation`.
  2. User triggers "Reinforce Habit" action.
  3. `PathwayRunner` opens in **Reinforcement Mode**:
     - Concise incident summary emphasizing the exact behavioral failure mode.
     - Core habit defensive rule reminder.
     - 2–3 question learning checkpoint re-verification.
  4. Server validates answers authoritatively and checks score $\ge 67\%$.
  5. Upon passing, records the reinforcement event in `UserProgress.reinforcementsCompleted`.
- **Measurement Safeguard**: Reinforcement completion does NOT alter `AssessmentSession` behavioral scores. It proves an intervention was taken, not that behavioral change occurred.

### Phase 5B: Longitudinal Evidence & Progress View (Evidence Layer)
- **Objective**: Reorganize the Dashboard into a calm, unblended **Three-Pillar Defensive Portfolio**:
  - **Pillar 1: Learning Interventions**:
    - Recommended pathways completed for the current session ($X$ of $Y$).
    - Targeted reinforcements completed ($Z$ total).
    - Discrete completion records with timestamps and checkpoint scores.
  - **Pillar 2: Knowledge Practice**:
    - Authoritatively sourced from `QuizAttempt` records (quiz titles, scores, attempt timestamps).
    - Explicitly excludes unverified claims about "laws read" or "cases explored" (as per the Category C audit).
  - **Pillar 3: Behavioral Evolution**:
    - Baseline $\to$ Final $\to$ Reassessment score trajectory across `TR`, `SI`, `VB`, `DQ`, `FP`, `UA`.
    - Mathematical retention classification (`Retained`, `Partially Retained`, `Declined`) evaluated per-dimension.

---

## 3. Data Model Impact

**ZERO NEW COLLECTIONS**.

### Minimal Extension to `server/models/UserProgress.js`:
```javascript
// Minimal subdocument array added to UserProgressSchema
reinforcementsCompleted: [
  {
    pathwayId: { 
      type: String, 
      required: true 
    },
    sourceSessionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'AssessmentSession', 
      required: true 
    },
    sourceHabitState: { 
      type: String, 
      enum: ['continued_practice', 'emerging_gap'], 
      required: true 
    },
    completedAt: { 
      type: Date, 
      default: Date.now 
    },
    checkpointScore: { 
      type: Number, 
      min: 0, 
      max: 100, 
      required: true 
    }
  }
]
```

### Why Each Field is Necessary:
- `pathwayId`: Specifies which habit was reinforced (e.g. `pathway-ua-upi-consent`).
- `sourceSessionId`: Provides verifiable linkage to the specific Final Assessment that diagnosed the weakness.
- `sourceHabitState`: Records whether the intervention targeted an unshifting deficit (`continued_practice`) or a drop (`emerging_gap`).
- `completedAt`: Audit timestamp of completion.
- `checkpointScore`: Verifies that the user answered checkpoint questions successfully ($\ge 67\%$).

---

## 4. API Endpoints Specification

### 1. `POST /api/progress/pathways/reinforce` (Phase 5A)
- **Authentication**: Required (JWT).
- **Request Body**:
  ```json
  {
    "pathwayId": "pathway-ua-upi-consent",
    "sourceSessionId": "6aa05485f69c90ee0c36e805",
    "answers": [
      { "questionId": "chk-ua-1", "selectedOptionIndex": 1 },
      { "questionId": "chk-ua-2", "selectedOptionIndex": 1 },
      { "questionId": "chk-ua-3", "selectedOptionIndex": 0 }
    ]
  }
  ```
- **Server Logic**:
  1. Authenticate user and verify `session.userId === req.user._id`.
  2. Verify `session.status === 'completed'` and `session.scenarioVersion >= 2`.
  3. Verify pathway eligibility: evaluates `remediationEngineService.generateRemediation` on `sourceSessionId` and confirms the pathway has `habitShiftState === 'continued_practice'` or `'emerging_gap'`.
  4. Authoritatively score submitted answers against `remediationCatalog.js`.
  5. If score $\ge 67\%$, atomically record in `UserProgress.reinforcementsCompleted` (idempotent for the same session and pathway).
  6. Return `{ success: true, checkpointScore: 100, passed: true, completedAt: "..." }`.

### 2. `GET /api/progress/portfolio` (Phase 5B)
- **Authentication**: Required (JWT).
- **Server Logic**:
  Queries `UserProgress`, `QuizAttempt`, and `AssessmentSession` in parallel for `req.user._id`:
  - Assembles Pillar 1 from `completedPathways` and `reinforcementsCompleted`.
  - Assembles Pillar 2 from `QuizAttempt.find({ userId }).sort({ completedAt: -1 })`.
  - Assembles Pillar 3 from `AssessmentSession.find({ userId, status: 'completed', scenarioVersion: { $gte: 2 } }).sort({ startedAt: 1 })`.
  - Applies Assessment Comparability Rules to construct chronological trajectory pairs.

### 3. `GET /api/assessments/trajectory` (Phase 5B)
- **Authentication**: Required (JWT).
- **Server Logic**:
  - Filters completed v2 assessment sessions for the user.
  - Groups sessions chronologically: Baseline (Session 1), Final (Session 2), Reassessment (Session 3+).
  - For each dimension (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), outputs the raw sequence and evaluates the mathematical retention state (`Retained`, `Partially Retained`, `Declined`).
  - Returns zero composite scores.

---

## 5. Frontend & UI Flow Impact

1. **Reinforcement Trigger**:
   - On `FinalAssessment.jsx` and `Dashboard.jsx`, pathways with `continued_practice` or `emerging_gap` display a prominent `"Reinforce Defensive Habit"` button.
   - Launches `PathwayRunner` in reinforcement mode.
2. **Dashboard Portfolio (`Dashboard.jsx`)**:
   - Replaces disconnected widgets with three clearly delineated sections:
     - **Pillar 1: Learning Interventions**: Visualizes completed pathways ($X$ of $Y$), reinforcement interventions, dates, and checkpoint scores.
     - **Pillar 2: Knowledge Practice**: Verified quiz attempts, percentage scores, and dates.
     - **Pillar 3: Behavioral Evolution**: Multi-session comparison showing raw scores across all 6 dimensions.
3. **Calm Educational Tone**:
   - Explicit disclaimer: *"Learning intervention completion demonstrates successful performance on the targeted learning checkpoint. Behavioral change is measured independently through simulated scenarios."*

---

## 6. Comprehensive Testing Strategy

### New Test Suite: `server/tests/phase5ReinforcementAndPortfolio.test.js`

| Test ID | Scenario | Expected Outcome |
|---|---|---|
| **Test A** | Unauthenticated reinforcement request | HTTP 401 Unauthorized |
| **Test B** | Wrong session owner reinforcement attempt | HTTP 403 Forbidden |
| **Test C** | Ineligible pathway reinforcement (e.g. pathway marked `mastery`) | HTTP 403 `REINFORCEMENT_NOT_ELIGIBLE` |
| **Test D** | Forged score in client payload | Server recalculates score; client parameters ignored |
| **Test E** | Failed reinforcement checkpoint (< 67%) | Reinforcement incomplete; not added to `reinforcementsCompleted` |
| **Test F** | Passing reinforcement checkpoint ($\ge 67\%$) | Successfully persisted in `UserProgress.reinforcementsCompleted` |
| **Test G** | Duplicate reinforcement submission | Idempotent; maintains single record per session/pathway |
| **Test H** | Zero score pollution check | Confirms `AssessmentSession.behaviourScores` are NOT modified |
| **Test I** | Portfolio data assembly verification | Confirms Pillar 1, 2, and 3 are segregated and accurate |
| **Test J** | Category C exclusion check | Confirms unverified reading logs are NOT exposed in Pillar 2 |
| **Test K** | Assessment comparability enforcement | Confirms v1 or abandoned sessions are excluded from trajectory |
| **Test L** | Mathematical retention state calculation | Validates `Retained`, `Partially Retained`, `Declined` thresholds |

---

## 7. Explicit Changes from Previous Phase 5 Proposal

| Area | Previous Proposal | Revised Proposal (This Plan) | Rationale |
|---|---|---|---|
| **Phase Scope** | Single undifferentiated Phase 5. | Formally split into **Phase 5A (Targeted Reinforcement)** and **Phase 5B (Longitudinal Evidence)**. | Separates primary educational intervention from evidence visualization. |
| **Tracked Reading Evidence** | Proposed tracking "laws read" and "case studies explored" in Pillar 2. | **REMOVED**. Pillar 2 tracks ONLY verified `QuizAttempt` data. | Audit proved reading views are unpersisted (Category C) or transient local storage (Category B). |
| **Retention Metric** | Proposed an aggregate "Retention Rate %". | **REMOVED**. Replaced with raw dimension sequence ($S_{\text{base}} \to S_{\text{final}} \to S_{\text{reassess}}$) and categorical retention states. | Prevents synthetic score blurring across distinct psychometric dimensions. |
| **Assessment Comparability** | Implicitly assumed any assessment sessions could be compared. | **Explicit Comparability Rules**: Enforces `status === 'completed'`, `scenarioVersion >= 2`, and identical 6-metric instrument schema. | Prevents comparing incompatible instruments (e.g. legacy v1). |
| **Reassessment Definition** | Vaguely described "Session 3+ Retention Reassessment". | **Explicitly Defined**: A user voluntarily taking another compatible assessment session after a baseline/final pair. Zero background daemons or automated push notifications. | Eliminates unnecessary daemon infrastructure and privacy/spam concerns. |
| **Reinforcement Storage** | Suggested generic array or overloading `completedPathways`. | **Explicit `reinforcementsCompleted` Subdocument**: Captures `sourceHabitState` and prevents semantic ambiguity with Phase 4 initial recommendations. | Keeps initial intervention evidence distinct from reinforcement evidence. |

---

## 8. Implementation Sequence

1. **Phase 5A Implementation**:
   - Extend `UserProgress.js` with `reinforcementsCompleted`.
   - Implement `POST /api/progress/pathways/reinforce` in `progressController.js`.
   - Update `PathwayRunner.jsx` to support targeted reinforcement review mode.
   - Connect reinforcement CTAs on `FinalAssessment.jsx` and `RemediationCards.jsx`.
   - Verify with Phase 5A automated tests.
2. **Phase 5B Implementation**:
   - Implement `GET /api/progress/portfolio` and `GET /api/assessments/trajectory`.
   - Refactor `Dashboard.jsx` into the Three-Pillar Defensive Portfolio layout.
   - Verify with Phase 5B automated tests.
3. **Full Regression Validation**:
   - Run all 10 existing test suites + new Phase 5 suite.
   - Run Vite production client build.

---

## 9. Acceptance Criteria

1. [x] Zero modifications to `assessmentScoringService.js`.
2. [x] Zero modifications to Phase 3 ranking formulas ($Deficit \times SeverityWeight \times OpportunityFactor$).
3. [x] Zero new MongoDB collections created.
4. [x] Zero composite scores, grades, XP, or gamification elements introduced.
5. [x] Learning completion, knowledge practice, and behavioral change remain strictly segregated.
6. [x] Reinforcement is strictly gated to `continued_practice` and `emerging_gap`.
7. [x] Trajectory calculations enforce Assessment Comparability Rules (`scenarioVersion >= 2`, `status === 'completed'`).
8. [x] Category C untracked data (laws read, cases explored) is completely absent from portfolio reporting.
9. [x] Full 10-suite regression matrix remains 100% green.
