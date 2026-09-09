# Project Requirements & Behavioral Measurement Model

## 1. Six-Metric Behavioral Model

| Metric | Code | Measurement Intent | Normalization Formula |
|---|---|---|---|
| **Threat Recognition** | `TR` | Ability to spot fraudulent stimuli vs legitimate interactions | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ |
| **Signal Identification** | `SI` | Explicit identification of deceptive indicators (URLs, sender addresses, urgency) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ |
| **Verification Behavior** | `VB` | Propensity to verify through independent trusted channels (0=none, 1=partial, 2=strong) | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ |
| **Decision Quality** | `DQ` | Strategic prudence across all situations | $(\text{rawPoints} / \text{maxOpportunities}) \times 100$ |
| **False Positive** | `FP` | Over-reporting tendency / paranoia toward legitimate requests | $\max(0, 100 - (\text{penaltyPoints} / \text{maxPenalty}) \times 100)$ |
| **Unreviewed Acceptance** | `UA` | Autopilot habit of approving requests without inspection | $\max(0, 100 - (\text{penaltyPoints} / \text{maxPenalty}) \times 100)$ |

## 2. Functional Requirements
- **FR-1**: User registration and login protected by JWT authentication with role-based access control (`user` vs `admin`).
- **FR-2**: Baseline assessment must record initial behavioral baseline before educational intervention.
- **FR-3**: Adaptive final assessment must branch based on user judgment at Stage 7:
  - Prudent decision $\rightarrow$ Stage 8A (Safe Path)
  - Careless decision $\rightarrow$ Stage 8B (Risky Phishing Path)
  - Both paths converge at Stage 10.
- **FR-4**: Pre/Post delta reporting must accurately isolate by `scenarioVersion`, ensuring historical v1 sessions are never mixed with v2 sessions.
- **FR-5**: Client UI must support session resumption on page refresh via `sessionStorage` and `GET /api/assessments/status/:scenarioCode`.
- **FR-6**: Re-entry to a completed assessment must display the completed summary instead of restarting or overwriting history.
- **FR-7**: Pure remediation engine dynamically ranks learning pathways based on weakest assessed behavioral metrics.
- **FR-8**: Post-assessment reveal views (`BaselineAssessment.jsx`, `FinalAssessment.jsx`) present personalized remediation cards with deep-link navigation.
- **FR-9**: Main dashboard surfaces personalized focus pathways matching current assessed state.
- **FR-10**: Adaptive Learning Pathways (Phase 4) provide a 3-step structured intervention (`incident`, `prevention`, `checkpoint`) with server-authoritative checkpoint grading (passing threshold $\ge 70\%$).
- **FR-11**: Checkpoint answer keys stripped from client delivery; all score evaluations computed server-side.
- **FR-12**: Phase 5 Targeted Habit Reinforcement allows post-final micro-reinforcements gated to active deficit or maintenance modes (`continued_practice`, `emerging_gap`).
- **FR-13**: Three-Pillar Defensive Portfolio synthesizes Module completion, Pathway completion, and Reinforcement drills into discrete progress indicators.
- **FR-14**: Longitudinal Assessment Trajectory pairs earliest valid Baseline with first Final and tracks subsequent Reassessments across 9 discrete retention states (`Retained`, `Stable`, `Partially Retained`, `Declined`, `Unimproved`, `Developing`, `Delayed Improvement`, `pending_reassessment`, `pending_data`).

## 3. Non-Functional Requirements
- **NFR-1 (Security)**: CAS atomic locks (`status: 'in-progress'`) on submission prevent double-click replay attacks.
- **NFR-2 (Privacy)**: Simulated login, OTP, and UPI interfaces must never collect or persist real user credentials.
- **NFR-3 (Accessibility)**: Programmatic focus management (`tabIndex="-1"`), focus trapping, Escape key handling, and viewport scroll reset on stage transitions.
- **NFR-4 (Responsiveness)**: Fluid layout on devices $\le 600\text{px}$ (mobile email client) and $\le 768\text{px}$ (reveal grid stacking).
- **NFR-5 (Pedagogical Tone)**: Non-punitive, calm habit-building recommendations connecting behaviors directly to Indian statutory frameworks.
- **NFR-6 (Pedagogical Boundary)**: Learning completion does not equate to behavioral mastery; quiz scores do not equate to operational safety. UI wording strictly respects these distinctions.
