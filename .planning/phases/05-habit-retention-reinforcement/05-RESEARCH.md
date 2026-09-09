# Phase 5: Habit Retention, Targeted Reinforcement & Longitudinal Evidence — Revised Research

## 1. Revised Phase 5 Problem Statement

Phases 1 through 4 established a verified, server-authoritative learning and assessment system:
- **Phase 2**: Six-metric behavioral assessment (`Your Digital Day`) measuring `TR`, `SI`, `VB`, `DQ`, `FP`, `UA` with atomic CAS replay defense and version isolation.
- **Phase 3**: Remediation engine dynamically prioritizing focus areas based on $Deficit \times SeverityWeight \times OpportunityFactor$ with verified statutory references.
- **Phase 4**: 3-step Adaptive Learning Pathway Runner (Incident Learning $\to$ Practical Defense $\to$ Learning Checkpoint) with server-authoritative scoring and progress persistence.

### The Educational Problem After Phase 4:
When a user finishes their recommended pathways and takes the Final Assessment:
1. **Unreinforced Persistent Weaknesses**: The assessment classifies habit shifts into four distinct states: `consolidated_strength`, `continued_practice`, `emerging_gap`, and `mastery`. However, for habits that remain weak (`continued_practice`) or regress (`emerging_gap`), the portal provides diagnostic feedback but lacks a targeted, low-friction educational mechanism to revisit and reinforce those specific defensive habits.
2. **Fragmented Dashboard Presentation**: The dashboard surfaces isolated, disconnected widgets (generic stat cards, a single latest-session milestone counter, a quiz badge locker, and an assessment checklist). It lacks a cohesive portfolio that visualizes the user's longitudinal defensive journey across time.
3. **Risk of Evidence Conflation**: Without strict architectural boundaries, users or observers might confuse *learning intervention completion* with *behavioral change*, or equate *quiz taking* with *operational safety*. These three forms of evidence must be presented as strictly independent pillars.
4. **Habit Decay Blind Spot**: Cybersecurity defensive habits suffer from forgetting curves. A single post-intervention assessment measures immediate shift, but cannot evaluate whether defensive habits endure over multiple subsequent sessions.

---

## 2. Revised Educational Objective

To complete the educational continuum:
$$\text{Learn} \longrightarrow \text{Practice} \longrightarrow \text{Improve} \longrightarrow \text{Retain}$$

without introducing gamification, synthetic composite scores, or generic LMS bloat.

The objective is divided into two discrete layers:
- **Phase 5A (Primary Educational Intervention)**: Provide a targeted **Habit Reinforcement Action** for persistent weaknesses (`continued_practice`) and regressed habits (`emerging_gap`) identified in post-intervention assessments.
- **Phase 5B (Longitudinal Evidence & Progress View)**: Deliver a trustworthy, lightweight **Three-Pillar Defensive Portfolio** and **Multi-Session Retention Trajectory** derived strictly from reliably persisted MongoDB data.

---

## 3. Scope Split: Phase 5A vs. Phase 5B

```
[Final Branching Assessment (Phase 2)]
                │
                ▼
[Phase 3 Habit Shift Classification]
 (continued_practice / emerging_gap)
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5A: TARGETED HABIT REINFORCEMENT                 │
│ - Identify persistent / regressed habit                │
│ - Concise relevant incident / context review           │
│ - Practical defensive rule review                      │
│ - Small learning checkpoint re-verification            │
│ - Record reinforcement completion in UserProgress      │
└────────────────────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5B: LONGITUDINAL EVIDENCE & PROGRESS VIEW        │
│ - Pillar 1: Learning Interventions (Ph 4 + Ph 5A)      │
│ - Pillar 2: Knowledge Practice (Verified QuizAttempts) │
│ - Pillar 3: Behavioral Evolution (Multi-Session Delta) │
│ - Voluntary Reassessment Retention Trajectory          │
└────────────────────────────────────────────────────────┘
```

### Phase 5A — Targeted Habit Reinforcement (Primary Intervention)
- **Eligibility**: Strictly limited to pathways diagnosed with `habitShiftState === 'continued_practice'` or `'emerging_gap'` for the user's latest completed assessment session.
- **Experience**: Reuses the Phase 4 `PathwayRunner` component in a streamlined **Reinforcement Mode**:
  1. Identifies the persistent or regressed habit.
  2. Presents concise incident context focusing on the specific scenario vulnerability.
  3. Re-emphasizes the authoritative practical defensive rule.
  4. Delivers a 2–3 question learning checkpoint evaluated server-side.
  5. Records reinforcement completion in `UserProgress.reinforcementsCompleted`.
- **Measurement Safety**:
  - Reinforcement completion does NOT alter `TR`, `SI`, `VB`, `DQ`, `FP`, or `UA`.
  - Reinforcement completion does NOT claim habit mastery; it records completion of a targeted remediation effort.

### Phase 5B — Longitudinal Evidence & Progress View (Evidence Layer)
- **Composition**: Formed strictly from trustworthy existing MongoDB records (`UserProgress`, `QuizAttempt`, `AssessmentSession`).
- **Structure**: Replaces fragmented dashboard widgets with a Three-Pillar Defensive Portfolio.
- **Retention Trajectory**: When a user voluntarily completes subsequent compatible assessment sessions, displays dimension-by-dimension scores and retention states across time.

---

## 4. Existing-Data Evidence Audit

Before defining dashboard evidence, we conducted a static audit of the repository to determine what user interactions are reliably tracked:

| Data Type | Persistence Mechanism | Classification | Suitability for Portfolio |
|---|---|---|---|
| **Quiz Attempts** | Stored in `QuizAttempt` collection with `userId`, `quizId`, `answers`, `score`, `percentage`, `attemptNumber`, `completedAt`. | **Category A** | **YES**: Reliably persisted and suitable for longitudinal reporting. |
| **Pathway Completions** | Stored in `UserProgress.completedPathways` with `pathwayId`, `sourceSessionId`, `completedAt`, `checkpointScore`, `stepsCompleted`. | **Category A** | **YES**: Server-authoritative and verified. |
| **Behavioral Sessions** | Stored in `AssessmentSession` with `behaviourScores` (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), `behaviourOpportunities`, `scenarioVersion`, `startedAt`, `completedAt`. | **Category A** | **YES**: Server-authoritative psychometric measurement. |
| **Case Study Views** | Stored only in browser `localStorage` (`'completed_cases'`). | **Category B** | **NO**: Transient client state; unauthenticated, unverified, easily cleared. Excluded from tracked evidence. |
| **Learning Module Reads** | `completedModules: []` field exists on `UserProgress` schema, but no route or controller ever writes to it. | **Category C** | **NO**: Not currently tracked in backend. Excluded from tracked evidence. |
| **Law Section Views** | Public routes exist (`/api/laws`), but zero user reading logs are stored. | **Category C** | **NO**: Not tracked. Excluded from tracked evidence. |
| **Prevention Handbook Views** | Purely client-side navigation. | **Category C** | **NO**: Not tracked. Excluded from tracked evidence. |

### Architectural Consequence:
Pillar 2 (Knowledge Practice) must **ONLY** report verified `QuizAttempt` records. All previously suggested claims regarding "statutory provisions read" or "case studies explored" are **REMOVED** because the platform does not possess reliable, authenticated backend event logs for passive document reading.

---

## 5. Exact Retention Trajectory & State Definition

### 5.1 Rejection of "Retention Rate" Percentage
Collapsing longitudinal retention into an artificial aggregate percentage (e.g. "82% Retention Rate") is rejected because it blurs distinct psychometric dimensions and violates the project's non-composite guardrail.

### 5.2 Mathematical Trajectory Representation
Longitudinal trajectory is represented as a sequence of raw dimension scores across compatible sessions:
$$\text{Baseline } (S_{\text{base}}) \longrightarrow \text{Final } (S_{\text{final}}) \longrightarrow \text{Reassessment } (S_{\text{reassess}})$$

Example:
- `Threat Recognition (TR)`: $14\% \longrightarrow 57\% \longrightarrow 57\%$
- `Verification Behaviour (VB)`: $14\% \longrightarrow 57\% \longrightarrow 71\%$
- `Unreviewed Acceptance (UA)`: $0\% \longrightarrow 33\% \longrightarrow 33\%$

### 5.3 Categorical Habit Retention Classification Rules
For each dimension $D \in \{TR, SI, VB, DQ, FP, UA\}$, a categorical retention state is calculated based on explicit mathematical thresholds:

Let $\Delta_{\text{learned}} = S_{\text{final}} - S_{\text{base}}$ (the intervention delta).  
Let $\Delta_{\text{retention}} = S_{\text{reassess}} - S_{\text{final}}$ (the retention delta).

1. **When Intervention Produced Meaningful Gain ($\Delta_{\text{learned}} \ge 10$ points)**:
   - **Retained**: $\Delta_{\text{retention}} \ge -5$ points  
     *(Score was sustained within 5 points of final score, or improved further).*
   - **Partially Retained**: $-20 \le \Delta_{\text{retention}} < -5$ points AND $S_{\text{reassess}} > S_{\text{base}}$  
     *(Score experienced minor decay, but remains strictly above original baseline).*
   - **Declined**: $\Delta_{\text{retention}} < -20$ points OR $S_{\text{reassess}} \le S_{\text{base}}$  
     *(Substantial decay; returned to or dropped below baseline vulnerability).*

2. **When Baseline Was Already High ($S_{\text{base}} \ge 75$ and $S_{\text{final}} \ge 75$)**:
   - **Retained**: $S_{\text{reassess}} \ge 75$ points *(Habit strength persisted).*
   - **Declined**: $S_{\text{reassess}} < 70$ points *(Vigilance slipped).*

3. **When Intervention Did Not Shift Habit ($S_{\text{final}} < 50$)**:
   - **Unimproved**: $S_{\text{reassess}} < 50$ points *(Persistent weakness unshifted).*
   - **Delayed Improvement**: $S_{\text{reassess}} \ge 65$ points *(Improvement materialized on subsequent trial).*

Zero composite scores or summary grades are created. Each of the 6 dimensions is classified and reported independently.

---

## 6. Assessment Comparability Rules

Longitudinal behavioral analysis is valid only if compared assessment sessions are psychometrically comparable:

### Mandatory Comparability Criteria:
1. **Completion Status**: Both sessions must have `status === 'completed'`. Abandoned or started sessions are excluded.
2. **Scenario Version Isolation**: Both sessions must have `scenarioVersion >= 2`. Historical v1 sessions (which used monolithic scoring) are strictly disqualified.
3. **Identical Instrument Mapping**:
   - Baseline must originate from `scenarioCode === 'baseline'` (13 stages measuring `TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
   - Final must originate from `scenarioCode === 'final'` (13 stages with branching at Stage 7).
   - Subsequent Reassessments must originate from compatible `version >= 2` scenarios (`baseline` or `final`).
4. **Scoring Model Schema**: Sessions must record valid `behaviourScores` maps containing all six discrete dimension keys.

Any session failing these criteria is flagged as `NON_COMPARABLE` and excluded from longitudinal trajectory calculations.

---

## 7. Reassessment Definition

- **What It Is**: A voluntary, user-initiated completion of a compatible assessment session (`scenarioVersion >= 2`, `status === 'completed'`) occurring after the user has already established a completed Baseline and Final assessment pair.
- **What It Is NOT**:
  - No scheduled notification daemons.
  - No automated email reminders.
  - No push notification servers.
  - No mandatory deadlines.
- **Trigger**: The dashboard simply displays an optional, calm CTA: *"Retake Assessment to Test Habit Retention"* once a user has completed both Baseline and Final assessments.

---

## 8. Data Minimization & Privacy Audit

Every field proposed for Phase 5 has been evaluated for data minimization:

| Field Name | Storage Location | Educational Justification | Privacy / Data Minimization Assessment |
|---|---|---|---|
| `pathwayId` | `reinforcementsCompleted` | Identifies which habit was reinforced. | String identifier; zero PII. Necessary. |
| `sourceSessionId` | `reinforcementsCompleted` | Links reinforcement to the diagnostic assessment that identified the deficit. | ObjectId reference; avoids copying assessment data. Necessary. |
| `sourceHabitState` | `reinforcementsCompleted` | Records whether the gap was persistent (`continued_practice`) or regressed (`emerging_gap`). | String enum (`continued_practice`, `emerging_gap`). Necessary for pedagogical audit. |
| `completedAt` | `reinforcementsCompleted` | Proves when the reinforcement was completed. | Date timestamp. Necessary. |
| `checkpointScore` | `reinforcementsCompleted` | Demonstrates successful performance on the targeted learning checkpoint (>= 67%). | Numerical percentage (0–100). Necessary. |

No user credentials, biometric indicators, or freeform text narratives are collected or stored.
