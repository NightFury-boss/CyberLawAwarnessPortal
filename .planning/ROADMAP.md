# Roadmap

## Phase 1: Foundation & Core Legal Knowledge System
- Status: complete
- Goal: User authentication, JWT tokens, RBAC, Indian cyber laws, case studies, quizzes.

## Phase 2.1: Six-Metric Assessment Engine Architecture
- Status: complete
- Goal: Replace monolithic score with six-metric behavioral matrix (TR, SI, VB, DQ, FP, UA).

## Phase 2.2: Replay Attack Defense & State-Machine Hardening
- Status: complete
- Goal: Implement CAS atomic session updates and unique constraint replay protection.

## Phase 2.3: "Your Digital Day" Production Scenario & Versioning
- Status: complete
- Goal: Author 13-stage adaptive branching production scenarios with immutable versioning.

## Phase 2.4: User Experience, Accessibility & Usability Hardening
- Status: complete
- Goal: Eliminate fake university login, remove mid-assessment answer leaks, responsive mobile layout, session resumption.

## Phase 3: Targeted Remediation & Micro-Learning Pathways
- Status: complete
- Achievements:
  - Server-authoritative remediation engine complete (`remediationEngineService.js`, `GET /api/assessments/remediation/:sessionId`).
  - Legal-reference architecture complete (`remediationCatalog.js` with verified statutory provisions; DPDP §6 future commencement; non-accusatory educational framing).
  - Automated verification complete (All 9 test suites passing 100%).
  - End-to-end real-session journey audit passed (`e2eUserJourneyAudit.js` verified full user lifecycle).
  - Browser-agent visual audit was attempted but blocked by Playwright driver infrastructure failure (upstream mirror 404).

## Phase 4: Adaptive Learning Pathways & Remediation Progress Tracking
- Status: complete
- Achievements:
  - Server-authoritative pathway execution engine with 3-step structured runner: Incident Learning (Case Study) → Practical Defense (Prevention Anchor) → Learning Checkpoint (Curated Quiz).
  - Extended `UserProgress` with `completedPathways` tracking `sourceSessionId`, `completedAt`, `checkpointScore`, and `stepsCompleted`.
  - Authoritative gating and scoring: Client submissions of derived scores or completion flags are ignored; server validates recommendation eligibility against `remediationEngineService.generateRemediation` and calculates checkpoint scores directly against `remediationCatalog.js`.
  - Dashboard focus metrics: "X of Y Recommended Focus Pathways Completed" scoped strictly to current/latest recommendation session and eligible catalog items, preventing historical inflations.
  - Zero synthetic composites: Maintained complete separation of concerns—Phase 4 measures completion of a learning intervention, while Phase 2 behavioral delta measures behavioral change. These are separate evidence types.
  - Automated verification: 100% pass across all 10 test suites (`pathwayProgress.test.js` Tests A–O, `e2eUserJourneyAudit.js`, `remediationEngine.test.js`, `behavioralAuthoritativeResult.test.js`, `digitalDay.test.js`, `deltaIsolation.test.js`, `fixtureValidation.test.js`, `api.test.js`, `verifyScenarios.js`, and client Vite build).

## Phase 5: Habit Retention, Targeted Reinforcement & Longitudinal Evidence
- Status: complete
- Achievements:
  - Extended `UserProgress` with `reinforcementsCompleted` tracking `pathwayId`, `sourceSessionId`, `sourceHabitState`, `completedAt`, and `checkpointScore`.
  - Implemented `POST /api/progress/pathways/reinforce`: server-authoritative scoring, eligibility gating strictly to `continued_practice` and `emerging_gap`, rejection of mastery/unrelated pathways, and idempotent persistence without mutating source session behavior scores.
  - Upgraded `PathwayRunner.jsx` with distinct reinforcement review mode, calm non-punitive tone, and precise educational checkpoint language ("demonstrates successful performance on the targeted learning checkpoint").
  - Connected "Reinforce Defensive Habit" CTAs on `FinalAssessment.jsx` and `RemediationCards.jsx` for habit shift weaknesses.
  - Implemented `GET /api/progress/portfolio` segregating three verifiable pillars: Learning Interventions, Knowledge Practice (`QuizAttempt`), and Behavioral Evolution (`AssessmentSession`). Untracked reading claims (Category C) strictly excluded.
  - Implemented `GET /api/assessments/trajectory` with rigorous Assessment Comparability Rules (`status === 'completed'`, `scenarioVersion >= 2`, 6-metric profile) and mathematical retention classification (`Retained`, `Partially Retained`, `Declined`, `Unimproved`, `Developing`, `Delayed Improvement`). Zero composite scores.
  - Refactored `Dashboard.jsx` into the Three-Pillar Defensive Portfolio layout with voluntary reassessment prompt ("Retake Assessment to Test Habit Retention").
  - Created comprehensive test suite `server/tests/phase5ReinforcementAndPortfolio.test.js` (Tests A–Q passing 100%).
  - Extended E2E suite `server/tests/e2eUserJourneyAudit.js` across the complete user lifecycle including habit reinforcement and longitudinal reassessment.
  - 100% pass across all 11 test suites and Vite production client build.

