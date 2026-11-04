# Stage 3 Design Proposal: Counterfactual Scenario Learning
## Educational "What If?" Exploration Engine for Cyber Law & Digital Defense

**Status**: PROPOSAL `[Proposed]` — PENDING USER APPROVAL  
**Author**: Engineering Partner (Antigravity)  
**Target Milestone**: Stage 3 (Original Phase 4)  
**Canonical Baseline Revision**: `d54886f767c998482f1b04124059a2e49f71cc63`  
**Governance Scope**: Architecture Design, Feasibility Audit, Pedagogical Blueprint, and Safety Safeguards (Zero Product Code or Implementation Changes Authorized)

---

## 1. Executive Summary & Educational Objectives

### The Educational Problem
In typical cybersecurity training, learners are exposed to static case studies or single-outcome quizzes where mistakes are labeled simply as "incorrect" or "failed." Learners discover what *actually happened* in a historical breach, but rarely experience the divergent paths that their own real-world choices would trigger. 

Under real digital pressure (e.g. an urgent midnight SMS from an electricity board, a simulated video call from a "cyber crime officer," or an unrequested reverse-QR code payment), citizens face high-consequence junctions:
- What happens if they reflexively comply? (Immediate financial loss, account takeover, secondary extortion).
- What happens if they simply ignore or delete the message? (Temporary safety, but unaddressed persistent vulnerability or uncontained account risk).
- What happens if they execute active, independent out-of-band verification? (Deception dismantled, zero compromise, immediate defensive reporting).

### Core Educational Objectives
The objective of **Stage 3: Counterfactual Scenario Learning** is to provide an interactive, exploratory sandbox where learners can safely ask: **"What happens if I make this choice instead?"**

Key pedagogical goals:
1. **Divergent Consequence Modeling**: Enable learners to experience authentic, multi-stage downstream consequences (immediate 5-minute reaction vs. 24-hour escalation) for each available decision path.
2. **Safe Backtracking & Exploration ("Forking")**: Allow learners to freely rewind to critical inflection points and test alternative actions without penalty, score deduction, or fear of failure.
3. **Comparative Synthesis**: Provide an unlocked, side-by-side comparison of explored branches, illuminating *why* different actions produce drastically different personal, financial, and legal outcomes.
4. **Authoritative Statutory Grounding**: Anchor every outcome in verified Indian cyber legislation (Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, Digital Personal Data Protection Act 2023) and actionable emergency reporting protocols (National Cybercrime Helpline 1930, CFCFRMS, and `cybercrime.gov.in`).
5. **Absolute Assessment Isolation**: Guarantee that counterfactual exploration is 100% segregated from authoritative diagnostic assessment sessions, behavioral scores, rubrics, and learner portfolios.

---

## 2. Existing Implementation Audit

We performed an audit of the codebase to identify existing capabilities, reusable patterns, and architectural boundaries across the portal.

### A. Assessment and Scenario Engine
| File / Module | Current Responsibility & Invariants | Reusability Assessment for Counterfactuals |
| :--- | :--- | :--- |
| `server/controllers/simulationController.js` | Manages authoritative assessment sessions (`/start`, `/submit-step`, `/status/:code`, `/session/:id`). Enforces Compare-and-Swap (CAS) stage transitions, ACID replica-set transactions, strict `idempotencyKey` checks, and invokes `assessmentScoringService`. | **Do Not Reuse for Counterfactuals.** Tightly coupled to transactional scoring, session timeouts, and immutable evidence records. Modifying this controller risks introducing side-effects into authoritative assessment evaluations. |
| `server/routes/simulations.js` | Protected REST routes for assessment simulation (`POST /start`, `POST /submit-step`, etc.). | **Keep Isolated.** Authoritative assessment routes must remain untouched. |
| `server/models/AssessmentSession.js` | Persistent MongoDB model storing learner assessment state, behavioral metric arrays (`behaviourScores`, `behaviourOpportunities`, `behaviourEncounters`), penalty points (`FP`, `UA`), and scoring versions (`scoringVersion: 1 | 2`). | **Strictly Immutable / Isolated.** Counterfactual exploration must NEVER write to or query this collection. |
| `server/models/AssessmentDecision.js` | Stores individual assessment choices with compound unique index `{ assessmentSessionId: 1, stageId: 1 }` and partial unique index on `{ assessmentSessionId: 1, idempotencyKey: 1 }`. | **Strictly Immutable / Isolated.** Counterfactual choices must never be stored in this collection. |
| `server/models/Scenario.js` | Scenario catalog model defining assessment type (`baseline`, `final`, `practice`), difficulty, domains, and configured scoring weights. Indexed on `{ slug: 1, version: 1 }`. | **Separate Domain.** Authoritative scenarios (`baseline`, `final`) are version-locked for psychometric consistency. |
| `server/models/ScenarioStage.js` | Defines assessment stages, stage orders (1–14), mock interface types (`email`, `sms`, `messaging`, `browser`), and psychometric tags (`measurementFocus`, `targetSignals`, `hasSignalProbe`). | **Partially Reusable Design Pattern.** The mock interface types and layout structures (`email`, `sms`, `browser`, `phone_call`) are visually excellent, but the stage progression model in `ScenarioStage` is strictly forward-only and linear/convergent. |
| `server/models/ScenarioDecision.js` | Defines decision options with `scoreChange`, `behaviorEffects`, `riskLevel`, and forward-pointing `nextStageId`. | **Forward-Only Graph.** Cannot support rewinding, branch comparisons, or multiple divergent consequence steps from a single choice. |
| `server/config/scenarios.json` | Master seed definitions for 14-stage Baseline v2 and Final v2 assessment scenarios. | **Preserved Baseline.** Must remain untouched to preserve diagnostic calibration. |
| `server/services/scenarioIntegrityService.js` | Validates graph integrity for assessment scenarios (validating single start node, no self-loops, complete decision coverage). | **Pattern Reference.** Integrity validation concepts can be adapted to validate counterfactual branch graphs. |
| `server/services/assessmentScoringService.js` | Authoritative v1/v2 scoring resolver enforcing the 6-dimensional rubric (TR: 16, SI: 10, VB: 16, DQ: 4, FP: 8/6, UA: 8). | **Strictly Off-Limits.** Must never be invoked for counterfactual exploration. |

### B. Existing Learning and Storytelling Components
| File / Module | Current Responsibility | Reusability Assessment for Counterfactuals |
| :--- | :--- | :--- |
| `server/models/CaseStudy.js` | Models documented real-world incident archives (e.g. Case File 014, Case File 008) with timeline entries, legal context, warning signs, and static single-question `decisionPoints`. | **Reference Content Only.** `CaseStudy` represents historical documented facts. Conflating hypothetical "what if" simulations with documented court/police archives would violate our statutory and forensic integrity rules. |
| `client/src/pages/Cases.jsx` | Incident Archive viewer. Implements single pause-and-choose decision points (`decisionPoints[0]`), revealing an explanation and unlocking the remainder of the linear narrative. Uses `localStorage` (`completed_cases`). | **Valuable UX Reference.** Shows how to present a case file, but currently only supports single-path linear unlocking. |
| `client/src/pages/BaselineAssessment.jsx` & `FinalAssessment.jsx` | Full-screen simulation runners with simulated mock interfaces (email client, SMS banner, browser URL bar, simulated phone call), stage transitions, and signal probe panels. | **UI Pattern Reusable.** The mock interface rendering primitives (SMS headers, chat bubbles, email sender verification, payment prompts) provide a proven, accessible visual language that can be reused for counterfactual dilemmas. |
| `client/src/components/common/EditorialScrollStory.jsx` | Desktop sticky contextual navigation + sequential active content on the right, using `IntersectionObserver` with zero RAF loops and WCAG compliance. | **Highly Reusable.** Can anchor a counterfactual incident timeline, allowing learners to scroll through the unfolding consequences of their selected branch while keeping the decision junction visible in the sticky left panel. |
| `client/src/components/common/ScrollLinkedIncidentCase.jsx` | Production editorial scroll investigation for Case File 014, linking a left-hand Forensic Evidence Docket with right-hand chronological narrative stages. | **Layout Reusable.** Excellent editorial frame for displaying unfolding incident timelines alongside statutory evidence. |
| `client/src/components/dashboard/DigitalMomentsStorySection.jsx` | Tabbed dashboard story component connecting everyday dilemmas (*Midnight Power Cut SMS*, *₹15 Courier Redirection*, *Digital Arrest Video Call*, *Reverse QR Code*) to statutory provisions. | **Prime Content Seeds.** The four everyday dilemmas in this component represent the ideal curriculum candidates for full counterfactual branch exploration. |
| `client/src/components/PathwayRunner.jsx` | 3-step structured intervention modal (Incident Learning $\rightarrow$ Practical Defense $\rightarrow$ Checkpoint Quiz). Interacts with `UserProgress`. | **Strict Separation.** Counterfactual exploration must remain an independent experiential sandbox and not be conflated with the remediation pathway runner. |

---

## 3. Confirmed Gaps vs. Assumptions

Before proposing architecture, we validated what capabilities genuinely exist versus what is missing:

| Domain | Initial Assumption | Confirmed Codebase Reality | Real Gap Identified |
| :--- | :--- | :--- | :--- |
| **Branching Graph** | Existing `ScenarioStage` and `ScenarioDecision` can support alternative outcome exploration. | Existing `Scenario` graph is designed solely for *forward progression* through 14 stages (converging at Stage 10) to compute authoritative behavioral scores. It has no mechanism for rewinding to a fork, exploring alternative branches, or comparing outcomes. | Existing scenario models cannot model counterfactual rewinding or side-by-side outcome synthesis. |
| **Story Progression** | Case studies support interactive decision trees. | In `CaseStudy.js` and `Cases.jsx`, `decisionPoints` are static multiple-choice questions with a single explanation. The story after the choice is identical regardless of the answer. | There is currently **zero alternative-outcome narrative infrastructure** in the portal. |
| **Session Persistence** | Counterfactual exploration requires a dedicated MongoDB session schema like `AssessmentSession`. | Authoritative assessment requires session persistence because it is an authoritative diagnostic measurement spanning 13 stages with paired baseline/final deltas. Counterfactual exploration is a self-directed, 2-to-3 minute exploratory inquiry where learners test choices immediately. | A heavy database session model is **unnecessary and counterproductive** for exploratory counterfactual learning. |
| **Progress Tracking** | Counterfactual choices should be recorded in `UserProgress`. | `UserProgress` tracks formal curriculum modules, pathway checkpoints, and spaced retrieval. Silently recording exploratory counterfactual choices (which intentionally include reckless or curious choices) as learner habit data would distort learner profiles. | Counterfactual exploration must not alter `UserProgress` habit metrics. |

---

## 4. Evaluation of Architecture Alternatives

We systematically evaluated three architectural approaches against strict technical and pedagogical criteria:

```
+----------------------------------------------------------------------------------------------------+
| OPTION A: Content-Driven, Client-Side State Exploration                                            |
| Published counterfactual scenarios served as structured read-only graphs.                          |
| Learner navigation, branching, rewinding, and comparative synthesis maintained in client memory.   |
+----------------------------------------------------------------------------------------------------+
| OPTION B: Dedicated Counterfactual Persistence Engine                                              |
| Separate MongoDB schemas (CounterfactualSession, CounterfactualDecision) and REST write APIs.      |
| Full server-side session lifecycle, CAS state locking, and persistent telemetry database writes.   |
+----------------------------------------------------------------------------------------------------+
| OPTION C: Reuse & Extend Existing Scenario / CaseStudy Infrastructure                              |
| Modify ScenarioStage/ScenarioDecision or CaseStudy to add branching counterfactual fields.         |
| Route exploration through existing simulation controllers or case study readers.                   |
+----------------------------------------------------------------------------------------------------+
```

### Detailed Trade-Off Matrix

| Evaluation Dimension | Option A: Content-Driven Client State (Recommended) | Option B: Dedicated Persistence Engine | Option C: Extend Existing Scenario / CaseStudy |
| :--- | :--- | :--- | :--- |
| **Assessment Isolation** | **Absolute (100% Guaranteed)**. No database writes; impossible to touch `AssessmentSession` or scoring. | **Moderate Risk**. Requires strict isolation rules across controllers, routes, and services to prevent bleed. | **High Risk**. Reusing `Scenario` or `simulationController` risks accidental score execution or index collisions. |
| **Learner Experience & Responsiveness** | **Instantaneous (0ms latency)**. Branch switching, rewinding, and comparisons happen smoothly in the client without loading spinners or network hops. | **Sluggish**. Every rewind or branch switch requires an HTTP round-trip, database transaction, and loading state. | **Complex**. Existing assessment screens are not designed for smooth backtracking or comparison. |
| **System Complexity** | **Minimal**. Clean, declarative data schema; lightweight client state machine; zero new database collections or transactional overhead. | **High**. Requires new Mongoose schemas, indexes, controllers, route handlers, error handlers, and lifecycle cleanup routines. | **High**. Complex migrations of existing scenario/case schemas; tight coupling between disparate features. |
| **Privacy & Data Minimization** | **Highest**. Exploratory choices (including deliberately unsafe choices made out of curiosity) are never logged to a server. | **Low**. Stores every intermediate click, timestamp, and choice in persistent database records. | **Low**. Would store exploratory actions in shared or adjacent collections. |
| **Authoring & Content Agility** | **High**. Scenarios are declarative, modular JSON documents containing narrative branches, timeline steps, and statutory cards. | **Low**. Content authoring requires matching complex database IDs and relational references. | **Very Low**. Confuses historical documented court cases with hypothetical "what if" fictional branches. |
| **Testing & Maintainability** | **Clean & Predictable**. Deterministic component unit tests and Playwright interaction tests; zero database flakiness. | **High Maintenance**. Requires concurrency tests, transaction rollback tests, session expiration tests, and database fixtures. | **High Maintenance**. Risks breaking existing baseline/final assessment regression suites. |

### Architectural Conclusion
**Option A (Content-Driven, Client-Side Exploration with a Dedicated Read-Only Catalog)** is overwhelmingly superior across every technical, pedagogical, and security dimension. 

It provides **100% physical and logical isolation** from authoritative assessment data, delivers an instantaneous, fluid learner experience for rewinding and comparing branches, and completely avoids database bloat and migration risks.

---

## 5. Recommended Architecture & Data Model

### A. Architectural Overview
Under Option A, Counterfactual Scenario Learning operates as a self-contained, read-only educational module:

```
[ Client: /workspace/counterfactuals ]
  │
  ├── 1. Scenario Selector (Catalog of 4 Authentic Digital Dilemmas)
  │
  ├── 2. Incident Briefing & Simulated Stimulus (Mock SMS, Email, Call, or QR)
  │
  ├── 3. Decision Junction (2–3 Actionable Choices: Comply / Inaction / Verify)
  │
  ├── 4. Branch Consequence Timeline (Immediate 5-Min vs 24-Hr Escalation)
  │
  ├── 5. "Fork & Rewind" Interaction (Return to Junction to test alternative path)
  │
  ├── 6. Comparative Synthesis Matrix (Unlocked when >= 2 branches explored)
  │
  └── 7. Statutory Takeaway & 1930 Emergency Reporting Protocol
```

### B. Declarative Scenario Schema Specification
Counterfactual scenarios will be structured according to a strict, declarative TypeScript/JSON contract:

```typescript
export interface CounterfactualScenario {
  id: string; // e.g., 'cf-electricity-sms'
  slug: string; // e.g., 'midnight-power-cut-sms'
  title: string; // 'The Midnight Power Cut SMS'
  scenarioType: 'counterfactual-simulation';
  category: 'Utility Scam' | 'Banking Fraud' | 'Marketplace Fraud' | 'Public Impersonation';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number; // e.g., 3
  
  // Real-world context
  incidentContext: {
    summary: string;
    targetVector: string; // e.g., 'Spoofed SMS Header + Urgent Threat of Power Cut'
    mockInterfaceType: 'sms' | 'email' | 'messaging' | 'browser' | 'phone_call' | 'qr_code';
    mockInterfaceData: Record<string, unknown>; // e.g., sender, message text, timestamps
  };

  // The critical decision point
  decisionJunction: {
    prompt: string; // "What do you do when this message arrives at 16:42 IST?"
    choices: CounterfactualChoice[];
  };

  // Synthesis & Takeaways
  defensiveTakeaway: {
    coreRule: string; // Golden Rule for this threat category
    statutoryFramework: {
      act: string; // 'Information Technology Act, 2000'
      section: string; // 'Section 66D'
      status: 'IN_FORCE' | 'ENACTED_FUTURE_COMMENCEMENT';
      plainSummary: string;
    }[];
    officialReportingProtocol: {
      primaryChannel: '1930' | 'cybercrime.gov.in' | 'Bank Grievance';
      guidance: string;
    };
  };
}

export interface CounterfactualChoice {
  id: string; // e.g., 'choice-panic-pay'
  label: string; // 'Call the Private Mobile Number Immediately'
  choiceType: 'reflexive-compliance' | 'passive-inaction' | 'active-verification';
  shortAction: string; // 'Dialed 98112-04918 and paid ₹2,450 arrears via UPI link'
  
  // The unfolding consequence chain
  consequence: {
    immediateTitle: string; // 'T+5 Minutes: The Coerced Transaction'
    immediateBody: string; // Narrative of what immediately happens
    escalatedTitle: string; // 'T+24 Hours: Secondary Extraction & Compromise'
    escalatedBody: string; // Narrative of next-day fallout (e.g. account draining)
    impactAssessment: {
      financial: 'Zero' | 'Low (Lost Arrears)' | 'Severe (Account Compromise)';
      accountSafety: 'Compromised' | 'At Risk' | 'Secure';
      legalPosition: 'Customer-Induced Transfer (Challenging Recovery)' | 'Zero Liability Defended';
    };
    whyItHappened: string; // Forensic explanation of the psychology and technical exploit
  };
}
```

### C. Client State Machine (`useCounterfactualSession`)
The learner's interaction within a scenario is managed entirely in React component memory:

```typescript
interface CounterfactualState {
  currentScenario: CounterfactualScenario;
  selectedChoiceId: string | null;
  exploredChoiceIds: string[]; // Set of choices the learner has tested
  activeView: 'briefing' | 'junction' | 'consequence' | 'comparison' | 'takeaway';
  isComparisonUnlocked: boolean; // true when exploredChoiceIds.length >= 2
}
```

**State Transitions**:
1. `ENTER_SCENARIO` $\longrightarrow$ displays `briefing` & simulated incoming alert.
2. `PROCEED_TO_JUNCTION` $\longrightarrow$ displays `decisionJunction` with all available choices.
3. `SELECT_CHOICE(id)` $\longrightarrow$ records `id` into `exploredChoiceIds`; sets `selectedChoiceId = id`; transitions to `consequence`.
4. `REWIND_TO_JUNCTION` $\longrightarrow$ preserves `exploredChoiceIds`; resets `selectedChoiceId = null`; returns to `junction`. If `exploredChoiceIds.length >= 2`, unlocks the "Compare Outcomes" affordance.
5. `VIEW_COMPARISON` $\longrightarrow$ transitions to `comparison`, rendering side-by-side columns of all explored paths.
6. `FINISH_SCENARIO` $\longrightarrow$ transitions to `takeaway`, presenting the statutory summary and 1930 helpline guidance.

### D. Optional Progress Bookmark (Client-Side Only)
To allow learners to remember which counterfactual scenarios they have explored without touching database records or backend schemas, completion status can be stored in the browser's `localStorage` (`cl_counterfactual_completed_slugs: string[]`). This matches our existing, proven pattern in `client/src/pages/Cases.jsx` (`completed_cases`).

---

## 6. Proposed Learner Journey & Interaction Model

The proposed experience follows a clear, 8-step cognitive arc:

```
[ Step 1: Encounter ] ──> Enter everyday digital dilemma (Realistic mock SMS / Email / Call)
        │
[ Step 2: Junction ]  ──> Reach critical decision point with 2–3 actionable choices
        │
[ Step 3: Selection ] ──> Select one action (e.g. Choice A: Panic Compliance)
        │
[ Step 4: Downstream] ──> Experience hypothetical consequences (T+5 mins & T+24 hrs)
        │
[ Step 5: Rewind ]    ──> Click "Rewind & Try Another Choice" ──┐
        │                                                       │
        └───────────────────────────────────────────────────────┘
        │
[ Step 6: Explore Alt]──> Select alternative action (e.g. Choice C: Active Verification)
        │
[ Step 7: Compare ]   ──> Unlock Side-by-Side Comparison Matrix (Choice A vs Choice C)
        │
[ Step 8: Synthesis ] ──> Receive Statutory Takeaway & 1930 Emergency Reporting Protocol
```

### Key Interaction Details

#### 1. Authentic Incoming Stimulus (Restrained Editorial Mock)
Learners see a clean, authentic visual mock of the stimulus using the portal's existing restrained design tokens (warm ivory ground `#f8f7f1`, deep navy `#0f2537`, hairline borders `#e6e5e0`).
- *Example*: A simulated phone screen showing an incoming SMS from `VK-PSPCL-ALRT` threatening disconnection in 5 hours unless a private mobile number is contacted.

#### 2. The Decision Junction
The learner is presented with three distinct, relatable choices:
- **Choice A (Reflexive Compliance)**: Dial the number immediately and follow the "officer's" instructions to clear the ₹2,450 balance.
- **Choice B (Passive Inaction)**: Delete the message and ignore it, assuming it is spam.
- **Choice C (Active Independent Verification)**: Open the official state utility portal or app, log in using the registered Consumer Account Number, and check arrears independently.

#### 3. Experiencing Downstream Consequences
Choosing an option immediately unfolds an editorial consequence timeline:
- **T+5 Minutes**: The caller answers, confirms the "disconnection order," and sends an instant payment link requesting ₹2,450.
- **T+24 Hours**: The payment link was a phishing gateway. ₹48,000 was debited overnight, and the electricity bill remains unpaid because the utility never received the funds.
- **Forensic Breakdown**: Explains how artificial urgency suppresses rational skepticism.

#### 4. The "Rewind & Fork" Affordance
A prominent, encouraging action bar appears:
> *"You've seen what happens when you call the number. What would happen if you chose Active Verification instead?"*  
> `[ ↺ Rewind to Decision Point ]`

Clicking returns the learner to the decision junction, visually highlighting that Choice A has already been explored and prompting them to test Choice B or C.

#### 5. Unlocked Comparative Synthesis
Once at least two paths have been explored, a **"Compare Explored Outcomes"** banner unlocks. Clicking it renders a side-by-side comparison table:
- What happened in Choice A (Panic) vs Choice C (Verification).
- Financial difference (₹48,000 lost vs ₹0 lost).
- Time investment (3 hours on phone with police vs 2 minutes on official app).
- Legal status (Customer-authorized transfer vs Zero customer liability).

#### 6. Practical Defensive Lesson & Statutory Hook
The experience concludes with a structured takeaway card:
- **Statutory Hook**: IT Act § 66D (Cheating by Personation) & BNS § 318(4) (Fraud). Explains that statutory utilities never dispatch individual officers with private mobile numbers to demand instantaneous payment.
- **Action Protocol**: If funds were transferred, dial **1930** within the Golden Hour to trigger CFCFRMS inter-bank hold coordination.

---

## 7. Initial Curriculum: Four High-Frequency Dilemmas

To provide immediate, high-value coverage without content clutter, Stage 3 will introduce four representative scenarios addressing the most common cyber threats in India:

| Scenario Title | Incident Vector | Decision Choices | Primary Statutory Grounding |
| :--- | :--- | :--- | :--- |
| **1. The Midnight Power Cut SMS** | SMS spoofing with private mobile contact and artificial 5-hour cutoff. | 1. Call private mobile and pay.<br>2. Delete and ignore.<br>3. Verify on official utility app. | **IT Act § 66D** (Cheating by Personation)<br>**BNS § 318(4)** (Cheating & Deception) |
| **2. The Nominal ₹15 Parcel Fee** | Delivery exception SMS with a deceptive `.top` domain link for address update. | 1. Enter card details to pay ₹15.<br>2. Wait for delivery boy to arrive.<br>3. Track AWB on official logistics portal. | **IT Act § 66C** (Identity & Credential Theft)<br>**BNS § 319** (Cheating by Personation) |
| **3. The "Approve Payment" QR Code** | Classified marketplace buyer sends a QR code claiming it "receives funds." | 1. Scan QR and enter UPI PIN.<br>2. Ask buyer for cash on delivery.<br>3. Check bank passbook balance directly. | **IT Act § 43** (Unauthorized Access & Damage)<br>**RBI UPI Security Directives** |
| **4. The Video Summons "Digital Arrest"** | Skype video call from fake police alleging money laundering and demanding escrow. | 1. Stay on call and transfer funds.<br>2. Hang up and call Helpline 1930.<br>3. Argue with caller on video. | **BNS § 204** (Impersonating Public Servant)<br>**BNS § 308** (Extortion) |

---

## 8. Non-Negotiable Invariants & Safeguards

### A. Absolute Assessment Isolation
1. **Zero Database Writes**: Counterfactual exploration will not create, update, or delete any records in `AssessmentSession` or `AssessmentDecision`.
2. **Zero Scoring Execution**: `assessmentScoringService.js` will never be imported or called by counterfactual components.
3. **Immutable Baseline & Final Scores**: Counterfactual interactions will not alter learner behavioral scores (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), radar habit profiles, baseline-final deltas, or diagnostic portfolios.
4. **No Prerequisite Interference**: Completing or skipping counterfactual scenarios will have zero impact on the prerequisite check for Final Assessment (`403 PREREQUISITE_NOT_MET`).

### B. Learning Separation
1. **UserProgress Protection**: Counterfactual activity will not modify `UserProgress` collections (`completedPathways`, `completedModules`, `spacedReviews`).
2. **Portfolio Boundary**: Counterfactual scenarios will not award verified defensive badges or alter formal certification evidence without separate, future user authorization.

### C. Safety and Privacy
1. **Zero Credential Capture**: Mock interfaces (simulated banking apps, SMS inputs) will discard all learner keystrokes immediately.
2. **No Real PII or Financial Identifiers**: All account numbers, UPI IDs, telephone numbers, and addresses are strictly synthetic and invalid (e.g. `98110-XXXXX`, `pspcl-alert.top`).

### D. Educational and Statutory Integrity
1. **Clear Scenario Classification**: Scenarios will be explicitly badged as `Educational Simulation: Counterfactual "What If?" Exploration`, cleanly distinguishing them from historical documented police case archives (`CaseStudy`).
2. **Statutory Accuracy**: All legal references will accurately cite primary statutes (IT Act 2000, BNS 2023, DPDP Act 2023) and explicitly disclose commencement status (`IN_FORCE` vs. `ENACTED_FUTURE_COMMENCEMENT`).
3. **No Formal Legal Advice Disclaimer**: Standard educational disclaimer will accompany all statutory takeaways.
4. **Emergency Reporting Protocol**: Directs victims immediately to National Cybercrime Helpline **1930** and portal `cybercrime.gov.in` (including the 2–3 hour Golden Hour and CFCFRMS inter-bank hold coordination) without guaranteeing fund freezes or recovery.

### E. Visual Redesign Freeze Adherence
1. Strictly adheres to the current visual foundation: warm ivory background (`#f8f7f1`), deep institutional navy (`#0f2537`), restrained blue accents (`#2563eb`), hairline borders (`#e6e5e0`), and Inter typography.
2. Zero cyberpunk tropes, dark hacker terminals, flashing alerts, or generic SaaS clutter.

---

## 9. Acceptance Criteria & Validation Strategy

When Stage 3 implementation is authorized, acceptance will be governed by the following criteria:

### Acceptance Criteria
- **AC-1 (Catalog Presentation)**: Learners can browse and select from the 4 calibrated counterfactual scenarios in `/workspace/counterfactuals`.
- **AC-2 (Incident Stimulus)**: Each scenario accurately renders realistic incoming stimuli (SMS, email, video summons, QR code) using responsive, accessible mock interface components.
- **AC-3 (Multi-Branch Consequence Rendering)**: Learners can select any of the 2–3 available choices and view a multi-stage consequence timeline (Immediate vs. Escalated).
- **AC-4 (Rewind & Forking)**: Learners can rewind to the decision junction at any time, select alternative paths, and experience alternative consequences without page reload.
- **AC-5 (Comparative Synthesis)**: Once at least two branches have been explored, a side-by-side comparative matrix is unlocked, contrasting consequences, financial impacts, and legal positions.
- **AC-6 (Statutory & Reporting Takeaways)**: Each scenario concludes with an accurate statutory card and emergency 1930 reporting guidance.
- **AC-7 (Absolute Assessment Isolation)**: Automated audit verifies zero writes to `AssessmentSession` or `AssessmentDecision`, zero calls to `assessmentScoringService`, and zero changes to existing diagnostic baseline/final scores.
- **AC-8 (Clean Build & Responsive Accessibility)**: Clean Vite production build, zero linter warnings, full keyboard navigation (focus states, Escape dismissal), and zero horizontal overflow on mobile viewports ($\le 900\text{px}$).

### Validation Strategy
1. **Automated Component & Contract Tests**: Unit test suites validating graph traversal, state transitions (`useCounterfactualSession`), and comparative unlocking logic.
2. **Assessment Isolation Test**: Automated integration test confirming that running all counterfactual scenarios leaves `AssessmentSession.countDocuments()` and `AssessmentDecision.countDocuments()` completely unchanged.
3. **Playwright Live Browser Test**: End-to-end browser smoke test traversing scenario branching, rewinding to test alternative choices, unlocking the comparison matrix, and capturing screenshots.
4. **Client Production Build**: Verifying 0 errors and sub-second build performance via `npm run build --prefix client`.

---

## 10. Risks, Outstanding Decisions & Next Steps

### Outstanding Decisions for User Review
1. **Navigation Placement**:
   - *Option 1 (Recommended)*: Add "Counterfactuals" directly to the Workspace Sidebar under the "Your Learning" section (between Lessons and Quizzes).
   - *Option 2*: Group Counterfactuals as an interactive tab inside the Case Studies Archive (`/workspace/cases`).
   - *Recommendation*: Option 1 is superior because counterfactual simulations are active decision-making experiences, distinct from reading historical case dossiers.
2. **Completion Marker**:
   - *Decision*: Confirm whether completing a counterfactual scenario should record a lightweight slug in client `localStorage` (`completed_counterfactuals`) to show a clean "Explored" badge in the catalog, without touching server database schemas.

### Prioritized Next Actions
1. **User Review**: Review this proposal (`STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md`).
2. **Formal Authorization**: Await user approval of this design proposal before beginning any implementation work.
3. **Wave 1 Execution (Upon Approval)**: Define declarative scenario data fixtures and core graph structures.
4. **Wave 2 Execution (Upon Approval)**: Build responsive client explorer components (`CounterfactualExplorer.jsx`, `DecisionJunction.jsx`, `ConsequenceTimeline.jsx`, `ComparativeMatrix.jsx`).
5. **Wave 3 Execution (Upon Approval)**: Conduct end-to-end testing, Playwright verification, and documentation synchronization.

---
*Report prepared for formal architectural review. Implementation work remains strictly paused.*

