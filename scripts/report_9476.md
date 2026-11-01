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
  - `getProgress()` and `getAssessmentStatus('baseline')` are *authoritative identity contracts*. Treating them identically to optional UI enrichment (e.g., secondary review counts, recommendation badges) created a critical false assumption where netwo
<truncated 9389 bytes>
 queried via `getSession`, `getScenarioStatus`, or `submitStep`. Dormant sessions that are never queried remain in `in-progress` state in MongoDB until next touch.
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