# Phase 4 Plan: Adaptive Learning Pathways & Remediation Progress Tracking (Revised)

## 1. Goal & Architectural Intent

To transform Phase 3's static remediation recommendations into an active, guided, and verifiable learning journey without altering behavioral assessment scoring or introducing synthetic composite scores.

Phase 4 delivers:
1. A structured **3-Step Micro-Learning Runner** (`PathwayRunner.jsx`): Incident Learning $\to$ Practical Defense $\to$ Learning Checkpoint.
2. **Server-Authoritative Progress Persistence** in `UserProgress.completedPathways`, preserving `sourceSessionId` for learning traceability.
3. **Server-Authoritative Checkpoint Validation** calculating scores from catalog answers and enforcing configured passing thresholds without trusting client inputs.
4. **Recommendation Eligibility Gating** ensuring users can only complete pathways recommended for their authenticated assessment sessions.
5. **Discrete Milestone Progress** on the Dashboard distinguishing current focus completion ($X$ of $Y$) from historical completions.

---

## 2. Requirements & Traceability

- **FR-10 (Server-Authoritative Pathway Tracking)**: Persist pathway completion in `UserProgress.completedPathways` tied to `sourceSessionId`.
- **FR-11 (Recommendation Eligibility Gate)**: Server validates that the pathway is recommended by `remediationEngineService` for `sourceSessionId` before allowing step progress.
- **FR-12 (3-Step Pathway Runner)**: Cohesive UI guiding the user through Case Study, Practical Prevention, and Checkpoint Quiz.
- **FR-13 (Server-Authoritative Checkpoint)**: Server evaluates answers against catalog, computes percentage, compares with `passingScore`, and returns feedback.
- **FR-14 (Dashboard Milestone Sync)**: Dashboard displays current recommended pathway completion ($X$ of $Y$) distinct from historical totals.
- **NFR-6 (No Synthetic Scoring)**: Learning completion is measured strictly by completed pathway count and final assessment behavioral $\Delta$.
- **NFR-7 (Strict User & Session Boundary Isolation)**: Authenticated user ownership and session status validated on all progression endpoints.

---

## 3. Implementation Waves

```
Wave 1: Data Contracts & Catalog Checkpoint Definition (Tracer)
  └── Extend server/models/UserProgress.js (completedPathways with sourceSessionId)
  └── Extend server/config/remediationCatalog.js (add checkpoint definition with passingScore and curated questions)
  └── Create server/tests/pathwayProgress.test.js contract harness

Wave 2: Server API, Eligibility Gating & Checkpoint Evaluation
  └── Implement POST /api/progress/pathways/step (Step 1 & Step 2 persistence)
  └── Implement GET /api/progress/pathways/:pathwayId/checkpoint (Sanitized questions without answers)
  └── Implement POST /api/progress/pathways/checkpoint (Server scoring & completion validation)
  └── Extend GET /api/progress to return completedPathways
  └── Mount routes in server/routes/progress.js

Wave 3: Pathway Runner UI Component
  └── Create client/src/components/PathwayRunner.jsx (3-step runner with instant feedback)
  └── Add client API methods in client/src/services/api.js (getPathwayCheckpoint, submitPathwayStep, submitPathwayCheckpoint)

Wave 4: Reveal Views & Dashboard Sync
  └── Wire RemediationCards.jsx to display Start / In Progress / Completed status and launch PathwayRunner
  └── Update client/src/pages/Dashboard.jsx to compute current recommended completion (X of Y) and historical totals

Wave 5: Verification & Full Regression Audit
  └── Execute server/tests/pathwayProgress.test.js (Tests A through N)
  └── Extend and execute server/tests/e2eUserJourneyAudit.js
  └── Run full 9-suite regression suite & validate client production build
```

---

## 4. Detailed Task Breakdown

### Task 1: Extend `UserProgress` Schema & Remediation Catalog
- **`server/models/UserProgress.js`**:
  ```javascript
  completedPathways: [
    {
      pathwayId: { type: String, required: true },
      sourceSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentSession', required: true },
      completedAt: { type: Date },
      checkpointScore: { type: Number, min: 0, max: 100 },
      stepsCompleted: {
        caseStudy: { type: Boolean, default: false },
        prevention: { type: Boolean, default: false },
        checkpointQuiz: { type: Boolean, default: false }
      }
    }
  ]
  ```
- **`server/config/remediationCatalog.js`**:
  For each of the 7 pathways, add:
  ```javascript
  checkpoint: {
    passingScore: 67, // Server passing threshold
    questions: [
      {
        questionId: 'chk-...-1',
        questionText: '...',
        options: ['...', '...', '...'],
        correctOptionIndex: 1,
        explanation: '...'
      },
      // 2-3 focused questions
    ]
  }
  ```

### Task 2: Implement Progress Controller Endpoints
- **`server/controllers/progressController.js`**:
  - `recordPathwayStep(req, res)`:
    - Inputs: `{ pathwayId, sourceSessionId, step, decisionChoiceIndex, acknowledged }`
    - Validates ownership of `sourceSessionId`.
    - Validates `pathwayId` is recommended for `sourceSessionId` via `remediationEngineService.generateRemediation`.
    - Updates `stepsCompleted.caseStudy` or `stepsCompleted.prevention`.
    - Returns `{ success: true, pathwayId, stepsCompleted }`.
  - `getPathwayCheckpoint(req, res)`:
    - Inputs: `params.pathwayId`, `query.sourceSessionId`
    - Validates ownership and eligibility.
    - Sanitizes questions (removes `correctOptionIndex` and `explanation`).
    - Returns `{ pathwayId, passingScore: pathway.checkpoint.passingScore, questions: [...] }`.
  - `submitPathwayCheckpoint(req, res)`:
    - Inputs: `{ pathwayId, sourceSessionId, answers: [{ questionId, selectedOptionIndex }] }`
    - Validates preceding steps (`caseStudy`, `prevention`) are complete.
    - Compares each answer against authoritative catalog questions.
    - Computes `score = Math.round((correct / total) * 100)`.
    - Compares `score >= pathway.checkpoint.passingScore`.
    - If passed: sets `stepsCompleted.checkpointQuiz = true`, `completedAt = new Date()`, `checkpointScore = score`.
    - If failed: leaves `completedAt` null; returns explanations for retry.
    - Returns `{ passed, score, passingScore, isFullyCompleted, explanations }`.
  - `getProgress(req, res)`:
    - Returns `completedPathways: progress.completedPathways || []`.

### Task 3: Automated Test Suite (`server/tests/pathwayProgress.test.js`)
Must verify Tests A through N:
- **Test A**: Unauthenticated request rejected (401).
- **Test B**: Invalid pathway rejected (400).
- **Test C**: Unauthorized user/session rejected (403).
- **Test D**: Ineligible pathway cannot be completed (403/400).
- **Test E**: Case-study step cannot be falsely marked complete.
- **Test F**: Prevention step cannot be falsely marked complete.
- **Test G**: Client-supplied checkpoint score is ignored/rejected.
- **Test H**: Server calculates checkpoint score from authoritative answers.
- **Test I**: Failed checkpoint does not complete pathway.
- **Test J**: Passing checkpoint completes pathway when all required steps are complete.
- **Test K**: Duplicate requests are idempotent.
- **Test L**: User A cannot mutate User B's progress.
- **Test M**: Source assessment/session remains attached to completion.
- **Test N**: Existing regression suites remain green.

### Task 4: Client API Service Extension (`client/src/services/api.js`)
- `recordPathwayStep(pathwayId, sourceSessionId, step, extraData)`
- `getPathwayCheckpoint(pathwayId, sourceSessionId)`
- `submitPathwayCheckpoint(pathwayId, sourceSessionId, answers)`

### Task 5: Interactive Pathway Runner Component (`client/src/components/PathwayRunner.jsx`)
- Step 1: Incident Learning (Case Study overview, timeline, educational decision point with feedback).
- Step 2: Practical Defense (Authoritative defensive rule, prevention anchor, acknowledgment CTA).
- Step 3: Learning Checkpoint (2–3 practice questions, submit to server, render authoritative feedback).
- State transitions strictly driven by server responses.

### Task 6: Reveal Views & Dashboard Sync
- `RemediationCards.jsx`: Shows `[Start Learning Pathway]`, `[In Progress]`, or `[Completed ✓]`.
- `Dashboard.jsx`: Displays current recommended focus progress (`"X of Y Recommended Focus Pathways Completed"`) derived by matching the latest session recommendations against completed pathways with that `sourceSessionId`.

### Task 7: Full Verification & E2E Extension
- Update `server/tests/e2eUserJourneyAudit.js` to execute a pathway step between Baseline and Final assessments.
- Execute all regression suites.
