```markdown
# Engineering Report: Phase 1.1 — First-Time Experience Reliability Corrections

## 1. Executive Summary
- **Problem Statement**: Two critical reliability vulnerabilities were discovered during the Phase 1 First-Time Learner Experience rollout:
  1. *Network Error False-Positive*: In `Dashboard.jsx`, transient network failures or timeouts during `api.getAssessmentStatus('baseline')` previously swallowed errors with `.catch(() => null)`, falsely misclassifying established or returning learners as brand-new unassessed users.
  2. *Assessment Session Expiry Rigidity*: The original assessment lifecycle applied a rigid, non-sliding 2-hour timer that penalized users taking reasonable pauses between simulation stages, lacked distinction between inactivity expiration and permanent session abandonment, and lacked reassuring learner recovery guidance.
- **Strategic Intent**: Harden the client-side state machine into explicit deterministic states (`LOADING`, `RESOLVED`, `ERROR`), guarantee that no learner is placed into onboarding without verified server-authoritative state, introduce a 2-hour sliding inactivity window capped by a 24-hour maximum hard lifetime, ensure immutable preservation of historical decision audits, and provide graceful recovery pathways.
- **Core Outcome**: Successfully implemented and verified `fetchWithTimeout` abort mechanics, deterministic 3-state lifecycle handling in `Dashboard.jsx`, sliding inactivity resets in `simulationController.js`, atomic status transitions to `abandoned`, Case C expired session recovery in `FirstVisitExperience.jsx`, and passed 100% of integration, contract, and build test batteries across 25 total test scenarios with 0 regressions.

---

## 2. Findings
- **Authoritative vs. Enrichment Contract Segregation**:
  - `getProgress()` and `getAssessmentStatus('baseline')` are *authoritative identity contracts*. Treating them identically to optional UI enrichment (e.g., secondary review counts, recommendation badges) created a critical false assumption where network failure was interpreted as an absence of learner history.
  - Secondary enrichment calls (`portfolio`, `trajectory`, `spacedReviews`, `quizzes`) can safely degrade to empty fallback defaults without affecting journey state.
- **Sliding Window vs. Fixed Lifetime Dynamics**:
  - A fixed 2-hour countdown penalizes active learners who encounter interruptions or conduct research between stages. A sliding 2-hour window that resets on each valid `submitStep` accommodates realistic learner workflows.
  - However, an uncapped sliding window allows sessions to remain open indefinitely across days or scenario version bumps. Capping sliding extensions to a strict 24-hour hard maximum (`maxLifetimeExpiresAt = startedAt + 24h`) preserves data hygiene and scenario version isolation.
- **Decision Immutability Under Abandonment**:
  - Expired or abandoned assessment sessions must never delete or overwrite historical `AssessmentDecision` rows. Preserving decisions immutably maintains audit compliance, research integrity, and ensures learners never lose credit for prior engagement.

---

## 3. Implemented Changes & Affected Files
### Client Architecture (`client/`)
- [`client/src/services/api.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/services/api.js):
  - Implemented `fetchWithTimeout(url, options, timeoutMs = 10000)` using `AbortController` to guarantee requests abort cleanly after 10 seconds rather than hanging indefinitely.
  - Updated `getAssessmentStatus`, `getProgress`, `startAssessment`, `getAssessmentSession`, and `submitAssessmentStep` to utilize `fetchWithTimeout`.
  - Replaced silent fallback swallowing with explicit error propagation for authoritative contracts.
- [`client/src/pages/Dashboard.jsx`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/pages/Dashboard.jsx):
  - Refactored dashboard state management to use an explicit state machine: `loadState: 'LOADING' | 'RESOLVED' | 'ERROR'`.
  - Segregated `fetchDashboardData` into Phase 1 authoritative checks (`getProgress`, `getAssessmentStatus('baseline')`) and Phase 2 non-blocking secondary enrichments (`getPortfolio`, `getTrajectory`, etc.).
  - Added calm retry card with "Retry Connection" button, preserving authenticated learner identity (`user?.name || user?.fullName`) and technical notice without entering first-visit onboarding.
  - Bound `hasExpiredSession` and `expiredSession` properties to pass through to `FirstVisitExperience`.
- [`client/src/components/dashboard/FirstVisitExperience.jsx`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/components/dashboard/FirstVisitExperience.jsx):
  - Added dedicated **Case C: Expired / Abandoned Session State**.
  - Renders a calming warning badge (`⏱ Previous Session Concluded • Inactivity Window`), explains why the session ended (> 2 hours of inactivity), assures the learner that past responses remain recorded immutably, and provides a direct "Start Fresh First Check →" CTA.
- [`client/src/styles/dashboard-reinvention.css`](file:///c:/Users/Asus/Desktop/cyber-law-portal/client/src/styles/dashboard-reinvention.css):
  - Added `.first-visit-expiry-banner`, `.expiry-clock-icon`, and `.expiry-badge-text` tokens matching the Atelier editorial aesthetic (warm amber, restrained border, deep typography).

### Server Architecture (`server/`)
- [`server/models/AssessmentSession.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/models/AssessmentSession.js):
  - Added `maxLifetimeExpiresAt: { type: Date }` to enforce hard 24-hour lifetime limits.
  - Added `abandonedAt: { type: Date }` to track exact timestamp of inactivity transitions.
- [`server/controllers/simulationController.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/controllers/simulationController.js):
  - In `startAssessment`: Sets `expiresAt` to `now + 2h` (sliding inactivity) and `maxLifetimeExpiresAt` to `startedAt + 24h` (hard lifetime).
  - In `submitStep`: Validates against both inactivity expiry and `maxLifetimeExpiresAt`. On valid submission, computes sliding window extension `newExpiresAt = min(now + 2h, maxLifetimeExpiresAt)`.
  - In `getSession`: Evaluates both expiration conditions, atomically marking expired sessions as `status: 'abandoned', abandonedAt: now`.
  - In `getScenarioStatus`: Detects expired/abandoned sessions and returns `hasActiveSession: false, hasExpiredSession: true, expiredSession: { sessionId, stagesCompleted, expiredAt }`.

### Automated Testing (`server/tests/`)
- [`server/tests/phase1Reliability.test.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/tests/phase1Reliability.test.js):
  - End-to-end integration test battery covering registration, idempotency, 2-hour sliding window, 24-hour hard lifetime, 403 cross-user protection, sliding window extension on step submission, inactivity transition to `abandoned`, decision immutability preservation, and clean fresh-start recovery.
- [`server/tests/clientStateReliability.test.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/tests/clientStateReliability.test.js):
  - Unit contract test suite verifying `fetchWithTimeout` abort logic, network error rejection, state transitions to `ERROR`, retry recovery to `RESOLVED`, and legitimate fresh learner rendering.
- [`server/tests/firstTimeLearnerJourney.test.js`](file:///c:/Users/Asus/Desktop/cyber-law-portal/server/tests/firstTimeLearnerJourney.test.js):
  - Updated connection hostname to `127.0.0.1` for consistent Windows network loopback resolution.

---

## 4. Independent Recommendations & Original Ideas
1. **Heartbeat Activity Detection in Long-Form Scenarios**:
   - Rather than relying solely on `submitStep` to extend the inactivity window, implement a lightweight background heartbeat `PUT /api/assessments/session/:id/ping` when a learner is actively reading or interacting with scenario exhibits for > 15 minutes.
2. **Offline-Safe Local Storage Snapshot for Scenarios**:
   - Cache uncommitted exhibit selections in browser `sessionStorage` with cryptographic timestamp validation, allowing the learner to recover unsubmitted text input if their Wi-Fi momentarily drops before clicking a choice.
3. **Statutory Transition Notice Badge on Assessment Exhibits**:
   - For simulated scenarios referencing legal reporting requirements (e.g., CERT-In 6-hour directions under IT Act § 70B), add contextual helper cards highlighting statutory authority without breaking scenario immersion.

---

## 5. Verification & Actual Test Results

### 1. Phase 1.1 Reliability & Expiry Test Battery (`server/tests/phase1Reliability.test.js`)
- **Execution Command**: `node server/tests/phase1Reliability.test.js`
- **Result**: `ALL 10 RELIABILITY & EXPIRY TESTS PASSED SUCCESSFULLY! (100%)`
  - *Test 1 (Registration)*: Passed. Created test learners A & B.
  - *Test 2 (New Learner Status)*: Passed. Authoritative `hasActiveSession: false`, `hasCompletedSession: false`.
  - *Test 3 (Start & Idempotency)*: Passed. Repeated calls return same active `sessionId`.
  - *Test 4 (Inactivity & Lifetime Values)*: Passed. Inactivity = 2.00h, Max lifetime = 24.00h.
  - *Test 5 (Cross-User Isolation)*: Passed. User B accessing User A session rejected with `403 Forbidden`.
  - *Test 6 (Sliding Expiry Extension)*: Passed. Sliding window reset to 120.0 minutes upon step submission.
  - *Test 7 (Inactivity Abandonment)*: Passed. Inactive session (>2h) transitioned atomically to `status: 'abandoned'`.
  - *Test 8 (Decision Immutability)*: Passed. `AssessmentDecision` records from abandoned session preserved intact.
  - *Test 9 (Fresh Start Recovery)*: Passed. Clean session instantiated without database conflict.
  - *Test 10 (24-Hour Hard Lifetime)*: Passed. Session age > 24h triggered strict abandonment.

### 2. Client State Machine Test Battery (`server/tests/clientStateReliability.test.js`)
- **Execution Command**: `node server/tests/clientStateReliability.test.js`
- **Result**: `ALL 5 CLIENT STATE MACHINE TESTS PASSED SUCCESSFULLY! (100%)`
  - *Test 1 (Timeout Abort)*: Passed. `fetchWithTimeout` cleanly threw timeout error on slow response.
  - *Test 2 (500 Error Rejection)*: Passed. Server error transitioned to `ERROR` and `RETRY_ERROR_VIEW` (never onboarding).
  - *Test 3 (Status Rejection)*: Passed. Failure of `getAssessmentStatus` triggered calm retry view.
  - *Test 4 (Retry Recovery)*: Passed. Retrying after transient glitch transitioned `ERROR -> RESOLVED` and restored studio.
  - *Test 5 (Legitimate Fresh Learner)*: Passed. Onboarding rendered only upon authoritative 200 `RESOLVED`.

### 3. Complete First-Time Learner Journey Regression Battery (`server/tests/firstTimeLearnerJourney.test.js`)
- **Execution Command**: `node server/tests/firstTimeLearnerJourney.test.js`
- **Result**: `ALL 10 FIRST-TIME LEARNER JOURNEY SCENARIOS PASSED 100%`
  - Validated full end-to-end journey from registration through baseline completion and post-baseline dashboard transition.

### 4. Client Production Compilation & Static Analysis
- **Build Command**: `npm --prefix client run build`
  - **Result**: Exit code 0 (`✓ built in 482ms`, 0 build errors).
- **Linter Command**: `npm --prefix client run lint`
  - **Result**: Oxlint completed on 67 files with 0 errors.

---

## 6. Risks & Outstanding Issues
- **Background Cron for Dormant Sessions**:
  - Inactivity expiration currently evaluates lazily when a session is queried via `getSession`, `getScenarioStatus`, or `submitStep`. Dormant sessions that are never queried remain in `in-progress` state in MongoDB until next touch.
  - *Mitigation*: Recommended adding a scheduled daily maintenance cron (`node server/utils/expireDormantSessions.js`) to mark records older than 24 hours as `abandoned`.
- **Clock Drift in Distributed Deployments**:
  - Client timeouts rely on local system time, while session expiry relies on server UTC.
  - *Mitigation*: All session expiration checks remain strictly server-authoritative (`new Date() > session.expiresAt`); client clocks are never trusted for session validity.

---

## 7. Prioritized Next Actions
1. **Phase 2 Implementation: Dynamic Baseline Exhibit Expansion**:
   - Expand the 4 baseline scenario stages with responsive interactive exhibits (e.g., realistic bank SMS thread, courier delivery tracking modal, utility payment gateway).
2. **Scheduled Maintenance Worker**:
   - Implement a lightweight, idempotent background script to transition orphaned sessions past `maxLifetimeExpiresAt` to `abandoned`.
3. **Telemetry & Latency Monitoring**:
   - Log client-side retry counts and network aborts to identify regional connection latency or MongoDB Atlas connection pool bottlenecks.

---

## 8. Handoff Context for Future Sessions
- **Active Backend Server**:
  - Express API is running on PID `7844` listening on `http://127.0.0.1:5000` (IPv6 `::` mapped). Connected to MongoDB Atlas cluster `cyber_law_portal`.
  - Health endpoint: `GET http://127.0.0.1:5000/api/health` returns `{ status: "healthy", database: "connected" }`.
- **Client Dev Server**:
  - Vite dev server runs via `npm --prefix client run dev` on `http://localhost:5173`.
- **Key Test Scripts**:
  - `node server/tests/phase1Reliability.test.js` (Lifecycle, sliding window, and expiry tests).
  - `node server/tests/clientStateReliability.test.js` (State machine, retry, and timeout tests).
  - `node server/tests/firstTimeLearnerJourney.test.js` (End-to-end first-time journey tests).
```