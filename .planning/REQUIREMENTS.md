# Project Requirements & Behavioral Measurement Model

## 1. Six-Metric Behavioral Model (v2.5.1 Authoritative Rubric)

| Metric | Code | Measurement Intent | Denominator / Max Penalty | Normalization Formula | Demonstrated Strength Threshold |
|---|---|---|---|---|---|
| **Threat Recognition** | `TR` | Detection of fraudulent stimuli vs legitimate interactions | **16 points** (Both paths) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ | $\ge 75\%$ |
| **Signal Identification** | `SI` | Explicit forensic cue identification via universal probes | **10 points** (5 probes $\times$ 2 pts) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ | $\ge 75\%$ |
| **Verification Behavior** | `VB` | Propensity to verify through independent trusted channels (0=none, 1=partial, 2=strong) | **16 points** (8 situations $\times$ 2 pts) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ | $\ge 75\%$ |
| **Decision Quality** | `DQ` | Authentication & operational hygiene (Stages 5 & 13) | **4 points** (2 situations $\times$ 2 pts) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ | $\ge 75\%$ |
| **False Positive** | `FP` | Over-reporting tendency / paranoia on legitimate alerts | **8 pts (Safe) / 6 pts (Risky)** | $\max(0, 100 - (\text{penaltyPoints} / \text{maxPenalty}) \times 100)$ | Penalty $\le 2$ pts |
| **Unreviewed Acceptance** | `UA` | Autopilot compliance / unreviewed permissions & UPI PINs | **8 points** (4 genuine encounters) | $\max(0, 100 - (\text{penaltyPoints} / \text{maxPenalty}) \times 100)$ | Penalty $\le 2$ pts |

---

## 2. Statutory Accuracy & Legal Status Taxonomy

All statutory references across the application, diagnostic reveals, and educational materials must adhere to the following taxonomy:

| Status Code | Definition | Primary Examples | Handling Rules |
| :--- | :--- | :--- | :--- |
| `IN_FORCE` | Active, operative primary Indian statutes. | IT Act 2000 §§ 43, 66, 66C, 66D; BNS 2023 §§ 318(4), 319; BSA 2023 § 63 | Cited as active governing law and enforceable standards. |
| `ENACTED_FUTURE_COMMENCEMENT` | Passed legislation enacted by Parliament whose operational commencement is pending notification under G.S.R. 843(E) dated 13 November 2025. | DPDP Act 2023 §§ 6, 8, 11 | **As of 3 November 2026, not yet in force.** Must be explicitly identified as enacted future law. Never presented as currently enforceable against fiduciaries. |
| `STRUCK_DOWN_HISTORICAL` | Statutory provisions declared unconstitutional and void by the Supreme Court of India. | IT Act 2000 § 66A (*Shreya Singhal v. Union of India*, 2015) | Identified strictly as historical judicial precedent; never cited as operative law. |

### Emergency Cybercrime Reporting Guidance
- All emergency reporting advice must prioritize the **National Cybercrime Helpline 1930** and official web portal **https://cybercrime.gov.in**.
- Awareness materials may reference the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) and the critical value of rapid reporting.
- **Fixed Recovery-Window Restrictions**: Never guarantee fund recovery, account freezes, or response timelines. Fixed 2–3 hour window claims must be avoided; reporting remains vital and processed 24/7 regardless of elapsed time.

---

## 3. Functional Requirements
- **FR-1**: User registration and login protected by JWT authentication with role-based access control (`user` vs `admin`).
- **FR-2**: Baseline assessment ("Your Digital Day") must record initial behavioral baseline before educational intervention.
- **FR-3**: Adaptive final assessment must branch based on user judgment at Stage 7:
  - Prudent decision $\rightarrow$ Stage 8A (Safe Path)
  - Careless decision $\rightarrow$ Stage 8B (Risky Phishing Path)
  - Both paths converge at Stage 10 and conclude at Stage 14.
- **FR-4**: Pre/Post delta reporting must accurately isolate by `scenarioVersion`, ensuring historical v1 sessions are never mixed with v2 sessions.
- **FR-5**: Client UI must support session resumption on page refresh via `sessionStorage` and `GET /api/assessments/status/:scenarioCode`.
- **FR-6**: Re-entry to a completed assessment must display the completed summary instead of restarting or overwriting history.
- **FR-7**: Pure remediation engine dynamically ranks learning pathways based on weakest assessed behavioral metrics.
- **FR-8**: Post-assessment reveal views (`BaselineAssessment.jsx`, `FinalAssessment.jsx`) present personalized remediation cards with preview badges and deep-link navigation to the learning dashboard.
- **FR-9**: Main dashboard surfaces personalized focus pathways matching current assessed state with a deterministic priority ladder.
- **FR-10**: Adaptive Learning Pathways provide a 3-step structured intervention (`incident`, `prevention`, `checkpoint`) with server-authoritative checkpoint grading (passing threshold $\ge 67\%$, representing 2 of 3 questions answered correctly).
- **FR-11**: Checkpoint answer keys stripped from client delivery; all score evaluations computed server-side.
- **FR-12**: Targeted Habit Reinforcement allows post-final micro-reinforcements gated to active deficit or maintenance modes (`continued_practice`, `emerging_gap`).
- **FR-13**: Verified Defensive Learning Portfolio synthesizes Module completion, Pathway completion, and Reinforcement drills into discrete progress indicators. Untracked reading claims strictly excluded. The portfolio records verified learning activities; it is not an accredited qualification or legal certification.
- **FR-14**: Longitudinal Assessment Trajectory pairs earliest valid Baseline with first Final and tracks subsequent Reassessments across 9 discrete retention states.
- **FR-15 (Prerequisite Enforcement)**: Direct `POST /api/assessments/start` with `scenarioCode: 'final'` must reject unassessed users (`403 PREREQUISITE_NOT_MET`) unless the authenticated learner has a completed baseline assessment in the database.
- **FR-16 (Session Resumption & Expiration)**: Active unexpired final sessions (`expiresAt > now`) must be resumed idempotently without duplicating session documents; expired sessions must be rejected for resumption and re-initialized cleanly.
- **FR-17 (Route & Query Compatibility)**: Curriculum lessons must resolve identically via `/workspace/modules/:slug` and `/workspace/modules?slug=...` and survive browser reloads.
- **FR-18 (Recommendation Routing)**: Quiz recommendations must route case studies to `/workspace/cases?slug=...` and curriculum modules to `/workspace/modules?slug=...`.
- **FR-19 (Atomic Signal Probe Submission)**: On stages with `hasSignalProbe: true`, submitting a step without `signalProbeDecisionId` must be atomically rejected with HTTP 400 (`INCOMPLETE_STAGE_SUBMISSION`) with zero database writes.
- **FR-20 (Client Idempotency Key Persistence)**: The client must persist stage-scoped idempotency keys in `sessionStorage` (`idemp_${sessionId}_${stageId}`) across page reloads and network retries; repeated submission of identical payload returns HTTP 200 (`isRetry: true`), while differing payloads or stage replays return HTTP 409.
- **FR-21 (Replica-Set ACID Transaction Isolation)**: All stage decision writes and Compare-and-Swap (CAS) stage pointer updates must run inside MongoDB multi-document transactions with automated rollback on concurrency or index conflicts.

---

## 4. Canonical Learner Journey Requirements (Frozen)
- **CJ-1 (Newly Registered Learner)**:
  - Destination: `/dashboard`.
  - State: Stage 1 of 4 ("First Check Needed").
  - Primary Action: "Start First Check \u2192" (`/assessment/baseline`).
  - Presentation: `FirstVisitExperience.jsx` orientation with progressive disclosure to explore full studio.
- **CJ-2 (In-Progress Baseline)**:
  - Destination: `/assessment/baseline` (or `/dashboard` orientation banner).
  - State: Active Simulation.
  - Primary Action: "Resume Your First Check (Situation X of 13)".
  - Guard: CAS atomic locks prevent double-submit replay attacks.
- **CJ-3 (Completed Baseline)**:
  - Destination: Post-assessment reveal (`DigitalAwarenessProfile.jsx`) $\rightarrow$ `/dashboard`.
  - State: Stage 2 of 4 ("Lessons & Practice").
  - Primary Action: Start top-ranked Focus Pathway via `PathwayRunner.jsx` modal.
  - Guard: Profile pathway cards are preview-only; primary CTA directs to `/dashboard`.
- **CJ-4 (Interrupted Pathway)**:
  - Destination: `/dashboard`.
  - State: `RESUME_PATHWAY`.
  - Primary Action: "Continue: [Pathway Title] \u2192" reopening `PathwayRunner` at interrupted step.
  - Guard: Server tracks step progress (`caseStudy`, `prevention`, `checkpointQuiz`).
- **CJ-5 (Interrupted Final Assessment)**:
  - Destination: `/dashboard`.
  - State: `RESUME_FINAL`.
  - Primary Action: "Resume Final Safety Check (Step X of 5) \u2192" linking to `/assessment/final`.
  - Guard: Server validates session unexpired (`expiresAt > now`).
- **CJ-6 (All Learning Experiences Completed)**:
  - Destination: `/dashboard`.
  - State: Stage 4 of 4 ("Keeping Habits Sharp" / `ALL_CAUGHT_UP`).
  - Primary Action: Practice Law Quizzes, review Verified Defensive Learning Portfolio, or take voluntary spaced retention checks when due.

---

## 5. Structural Ownership & Component Boundaries
- **SO-1 (Dashboard Ownership)**: `/dashboard` (`Dashboard.jsx`) owns macro orientation, the PrimaryFocus study dossier, pathway launch orchestration, quiz studio, and portfolio drawer.
- **SO-2 (Assessment Simulation Ownership)**: `/assessment/baseline` and `/assessment/final` own full-screen, focused simulation runs. They do not embed the dashboard workspace sidebar during active simulation runs.
- **SO-3 (Profile Ownership)**: `DigitalAwarenessProfile.jsx` owns diagnostic interpretation and statutory breakdown. It delegates pathway execution to the dashboard via preview-only cards.
- **SO-4 (Pathway Runner Ownership)**: `PathwayRunner.jsx` is a self-contained modal runner owning 3-step intervention execution. It does not navigate away from the current page.

---

## 6. Intended Future Routing Architecture (Backlog Specification)
- **Public vs. Authenticated Workspace Redirection**:
  - Unauthenticated visitors accessing educational paths (`/laws`, `/crimes`, `/cases`, `/modules`, `/prevention`, `/resources`) render the Public Shell (Navbar + Footer).
  - Authenticated learners accessing bare public educational paths must be canonically redirected to their corresponding `/workspace/*` path (`/workspace/laws`, `/workspace/crimes`, etc.), ensuring the workspace sidebar, breadcrumb hierarchy, and active learning context are continuously preserved.

---

## 7. Non-Functional Requirements
- **NFR-1 (Security)**: CAS atomic locks (`status: 'in-progress'`) on submission prevent double-click replay attacks.
- **NFR-2 (Privacy)**: Simulated login, OTP, and UPI interfaces must never collect or persist real user credentials.
- **NFR-3 (Accessibility)**: Programmatic focus management (`tabIndex="-1"`), focus trapping, Escape key handling, and viewport scroll reset on stage transitions.
- **NFR-4 (Responsiveness)**: Fluid layout on devices $\le 375\text{px}$ (mobile) and $\ge 1200\text{px}$ (desktop).
- **NFR-5 (Pedagogical Tone)**: Non-punitive, calm habit-building recommendations connecting behaviors directly to Indian statutory frameworks.
- **NFR-6 (Pedagogical Boundary)**: Learning completion does not equate to behavioral mastery; quiz scores do not equate to operational safety. UI wording strictly respects these distinctions.
- **NFR-7 (Deterministic Precedence)**: Dashboard primary next step evaluates a strictly ordered priority ladder with zero ambiguous or conflicting states.
