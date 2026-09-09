# Phase 3 Plan: Targeted Remediation & Micro-Learning Pathways

## 1. Objective & Scope
Connect the authoritative Six-Metric Behavioral assessment results directly to Indian cyber law learning pathways. Users will receive personalized, targeted micro-learning recommendations based on their weakest measured habits (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).

---

## 2. Requirements & Traceability
- **FR-7 (Targeted Remediation Engine):** Pure service to rank and select learning pathways matching individual behavioral gaps.
- **FR-8 (Assessment Reveal Integration):** Present calm, actionable remediation cards on `BaselineAssessment.jsx` and `FinalAssessment.jsx`.
- **FR-9 (Dashboard Remediation Pathway):** Surface current focus areas on the main `Dashboard.jsx`.
- **NFR-5 (Calm Pedagogical Tone):** Avoid punitive phrasing; focus on constructive habit building and legal protections.

---

## 3. Plan Execution Waves

```
Wave 1 (Tracer: Remediation Engine & Verification)
  └── Create client/src/services/remediationService.js
  └── Create server/tests/remediationEngine.test.js & verify ranking

Wave 2 (Reusable Presentation Component)
  └── Create client/src/components/RemediationCards.jsx
  └── Add CSS styling tokens in client/src/styles/main.css

Wave 3 (Assessment & Dashboard Integration)
  └── Integrate into client/src/pages/BaselineAssessment.jsx
  └── Integrate into client/src/pages/FinalAssessment.jsx
  └── Integrate into client/src/pages/Dashboard.jsx

Wave 4 (Deep-Link Navigation & Verification)
  └── Verify anchor scroll & ID matching in Cases.jsx, Crimes.jsx, Laws.jsx
  └── Execute all regression test suites
  └── Validate client Vite production build
```

---

## 4. Task Breakdown

### Task 1: Remediation Service (`client/src/services/remediationService.js`)
- Author comprehensive content catalog mapping each of the 6 metrics to specific case studies, crimes, laws, and practical guidelines.
- Implement `getRecommendedPathways(behaviourScores)`:
  - Sorts metrics by lowest score.
  - Returns top 2 prioritized recommendations.
  - If all metrics $\ge 80\%$, returns advanced mastery & habit maintenance modules.
- Implement `getPathwayForMetric(metricKey)`:
  - Returns specific metadata for direct metric drill-down.

### Task 2: Automated Service Test (`server/tests/remediationEngine.test.js`)
- Test ranking logic for various profiles:
  - Weak Autopilot (`UA = 0`, `DQ = 25` $\rightarrow$ returns UA and DQ pathways).
  - Weak Verification (`VB = 14`, `TR = 50` $\rightarrow$ returns VB and TR pathways).
  - Perfect Profile (`all 100%` $\rightarrow$ returns advanced maintenance modules).
  - Null/undefined tolerance (safe fallback).

### Task 3: Reusable Component (`client/src/components/RemediationCards.jsx`)
- Renders a clean, calm grid of 1–2 recommendation cards:
  - Metric focus tag (e.g. `Focus Area: Unreviewed Acceptance`).
  - Clear, accessible headline and rationale.
  - Statutory connection badge (e.g. `DPDP Act 2023 §6`).
  - Primary button linking directly to the learning destination (`/cases#...`, `/laws#...`, `/crimes#...`).

### Task 4: Integration into Assessment Pages & Dashboard
- **`BaselineAssessment.jsx`**: Insert `RemediationCards` under the 6-metric habit profile in the reveal view.
- **`FinalAssessment.jsx`**: Insert `RemediationCards` under the 6-metric habit shift table in the reveal view.
- **`Dashboard.jsx`**: Add a "Personalized Learning Pathways" section reflecting latest assessment results.

### Task 5: Regression & Verification
- Run:
  1. `node server/tests/remediationEngine.test.js`
  2. `node server/tests/behavioralAuthoritativeResult.test.js`
  3. `node server/tests/digitalDay.test.js`
  4. `node server/tests/deltaIsolation.test.js`
  5. `node server/tests/fixtureValidation.test.js`
  6. `node server/tests/api.test.js`
  7. `npm run build --prefix client`
