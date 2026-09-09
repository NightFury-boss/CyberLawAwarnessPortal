# Phase 4: Adaptive Learning Pathways & Remediation Progress Tracking — Revised Research

## 1. Executive Summary & Context

Phase 3 delivered the server-authoritative remediation engine (`remediationEngineService.js` and `remediationCatalog.js`). When a user completes an assessment (Baseline or Final "Your Digital Day"), the server evaluates their 6 behavioral metrics (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), penalizes deficits weighted by real-world severity, filters out low-opportunity noise, and returns at most 2 prioritized habit focus areas mapped to validated Indian statutory context and case study/prevention content.

Phase 4 establishes the **Adaptive Learning Pathway Runner & Progress Tracking Architecture**. 

### Architectural Principles & Hard Constraints:
1. **Strict Server Authority**: The client is never trusted for scores, completion flags, or derived progress. The server validates session ownership, checks pathway recommendation eligibility, calculates checkpoint scores from authoritative answers, and determines step completion.
2. **Preserve Learning Traceability**: Every pathway progress record is anchored to its `sourceSessionId`, maintaining a verifiable audit trail: $\text{Assessment Session} \to \text{Recommendation} \to \text{Learning Pathway} \to \text{Authoritative Completion}$.
3. **Strict Non-Composite Evidence**: No synthetic composite scores, "Cyber Awareness Index", or LMS letter grades. Evidence of learning consists solely of (a) discrete recommended pathway completion count, and (b) subsequent pre/post behavioral shift ($\Delta$) in "Your Digital Day".
4. **Preserve Phase Boundaries**: Phase 2 measures behavior; Phase 3 selects remediation; Phase 4 delivers the interactive runner and tracks completion. Zero changes to `assessmentScoringService.js` or Phase 3 prioritization formulas.
5. **No LMS or Gamification Bloat**: No course builders, XP points, public leaderboards, virtual currencies, or coin economies.

---

## 2. Deep-Dive Answers to Core Architectural Questions

### 2.1 User-Facing Learning Experience: The 3-Step Pathway Runner
When a user engages with a recommended pathway card on `BaselineAssessment.jsx`, `FinalAssessment.jsx`, or `Dashboard.jsx`, they launch `PathwayRunner.jsx`:

1. **Step 1: Incident Learning (Case Study)**:
   - Deep immersion in the real incident narrative, threat actor objectives, and timeline.
   - Interactive educational decision point providing immediate explanatory feedback. (Educational only; does not affect psychometric behavioral metrics).
2. **Step 2: Practical Defense (Prevention & Action Checklist)**:
   - Concise presentation of the authoritative defensive rule (e.g. *"UPI PIN is entered ONLY to send money, NEVER to receive funds"*).
   - Practical action checklist (device hygiene, out-of-band protocols).
   - Explicit user acknowledgment action.
3. **Step 3: Learning Checkpoint (Targeted Practice Questions)**:
   - 2–3 targeted questions evaluating deception cue recognition and relevant statutory safeguards.
   - Client submits selected answers (`questionId`, `selectedOptionIndex`).
   - Server evaluates correctness against authoritative catalog answers and compares score with catalog `passingScore`.
   - Explanatory feedback is returned after server validation.

---

### 2.2 Preserving Learning Traceability & Schema Design
To avoid treating pathway completions as isolated, floating strings, each completion record preserves the session context from which it originated:

```javascript
// Minimal Extension to server/models/UserProgress.js
completedPathways: [
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
    completedAt: { 
      type: Date 
    },
    checkpointScore: { 
      type: Number, 
      min: 0, 
      max: 100 
    },
    stepsCompleted: {
      caseStudy: { type: Boolean, default: false },
      prevention: { type: Boolean, default: false },
      checkpointQuiz: { type: Boolean, default: false }
    }
  }
]
```

#### Why UserProgress is Sufficient:
- Avoids creating new collections, keeping queries single-trip on Dashboard and Progress endpoints.
- Stores `sourceSessionId` so historical completions can always be attributed to specific assessments.
- Supports fine-grained step persistence with atomic MongoDB updates (`$set`).

---

### 2.3 Recommendation Eligibility Guard
A user cannot arbitrarily mark any pathway complete. The backend validates eligibility before recording step progress:
1. Client supplies `pathwayId` and `sourceSessionId`.
2. Server loads the assessment session:
   - Verifies `session.userId.toString() === req.user._id.toString()`.
   - Verifies `session.status === 'completed'`.
3. Server invokes `remediationEngineService.generateRemediation(sourceSessionId, req.user._id)`.
4. Server verifies that `pathwayId` is present in the returned `recommendations`.
5. If ineligible, the request is rejected with HTTP 403 / `PATHWAY_NOT_ELIGIBLE`.

---

### 2.4 Server-Authoritative Checkpoint Design
Instead of hardcoding a 66% threshold or trusting client calculations:
- `remediationCatalog.js` specifies authoritative checkpoint configuration per pathway:
  ```javascript
  checkpoint: {
    passingScore: 67, // Server-enforced passing threshold percentage
    questions: [
      {
        questionId: 'chk-ua-1',
        questionText: 'When receiving a payment or cashback on UPI, when must you enter your UPI PIN?',
        options: [
          'Only after scanning the merchant QR code',
          'Never; UPI PIN is only required to authorize sending money or checking balance',
          'When accepting a collect request above Rs 500',
          'Whenever requested by an authorized customer care representative'
        ],
        correctOptionIndex: 1,
        explanation: 'A UPI PIN is an authorization credential for debiting your account. You NEVER enter a PIN to receive money.'
      },
      // ... 2-3 focused questions
    ]
  }
  ```
- **Client Fetch (`GET /api/progress/pathways/:pathwayId/checkpoint`)**: Strips `correctOptionIndex` and `explanation`.
- **Client Submission (`POST /api/progress/pathways/checkpoint`)**: Sends `{ pathwayId, sourceSessionId, answers: [{ questionId, selectedOptionIndex }] }`.
- **Server Calculation**:
  $$\text{score} = \text{Math.round}\left(\frac{\text{correctCount}}{\text{totalQuestions}} \times 100\right)$$
  $$\text{passed} = \text{score} \ge \text{checkpoint.passingScore}$$
- Only if `passed === true` and preceding steps (`caseStudy`, `prevention`) are complete does the server mark `stepsCompleted.checkpointQuiz = true` and record `completedAt`.

---

### 2.5 Dashboard Counting Logic
The Dashboard milestone count cleanly distinguishes current session recommendations from historical completions:
- **Current Recommendation Set**: Authoritatively derived from the user's latest completed assessment session ($Y$ recommended pathways, typically 1 or 2).
- **Completed from Current Set ($X$)**: The subset of $Y$ whose `pathwayId` and `sourceSessionId` match a fully completed record in `UserProgress.completedPathways`.
- **Display**: `"X of Y Recommended Focus Pathways Completed"`.
- **Historical Total ($Z$)**: Total count of all distinct completed pathways across all past assessment sessions.

---

### 2.6 Comprehensive Test Strategy
14 mandatory test cases in `server/tests/pathwayProgress.test.js` covering authentication, authorization, eligibility, step state transitions, server-side score calculation, passing thresholds, duplicate idempotency, user isolation, and session traceability. Extended `server/tests/e2eUserJourneyAudit.js` validates real-session end-to-end integration.
