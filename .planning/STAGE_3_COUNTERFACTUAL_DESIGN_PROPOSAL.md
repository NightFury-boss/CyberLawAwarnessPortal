# Stage 3 Design Proposal: Counterfactual Scenario Learning
## Educational "What If?" Exploration Engine for Cyber Law & Digital Defense

**Status**: PROPOSAL `[Proposed]` — FINAL RECONCILED DRAFT PENDING IMPLEMENTATION AUTHORIZATION  
**Author**: Engineering Partner (Antigravity)  
**Target Milestone**: Stage 3 (Original Phase 4)  
**Canonical Baseline Revision**: `d61ec29f6b4731eac3c2269f2cecf295ade475a5`  
**Governance Scope**: Architecture Design, Feasibility Audit, Proposed Design Decisions, Legal & Regulatory Framework, and Isolation Verification Safeguards (Strictly Documentation-Only; Implementation Unauthorized)

---

## 1. Executive Summary & Educational Objectives `[Current & Proposed]`

### The Educational Problem
In conventional cybersecurity training, learners are typically presented with static case studies or single-outcome quizzes where choices are classified simply as "correct" or "incorrect." Learners read about what occurred in a historical incident, but rarely experience the divergent paths that their own real-world choices would trigger.

Under everyday digital pressure (e.g. an urgent SMS alleging utility disconnection, a video call from an individual claiming to be a law enforcement officer, or an unrequested reverse-QR payment code), citizens encounter consequential decision points:
- What happens if they comply reflexively out of manufactured panic?
- What happens if they take passive inaction, deleting or ignoring an alert without addressing potential underlying vulnerabilities?
- What happens if they execute active, independent out-of-band verification?

### Core Educational Objectives
The objective of **Stage 3: Counterfactual Scenario Learning** is to provide an interactive, exploratory sandbox where learners can safely examine: **"What happens if I make this choice instead?"**

Key pedagogical goals:
1. **Divergent Consequence Modeling**: Enable learners to experience plausible, multi-stage downstream consequences (immediate reactions vs. potential later escalation) for distinct decision paths.
2. **Safe Backtracking & Exploration ("Rewinding")**: Allow learners to return freely to critical inflection points and test alternative choices without penalty, score deduction, or fear of failure.
3. **Comparative Synthesis**: Provide an optional, side-by-side comparison of explored branches (unlocked after exploring at least two branches), illustrating *why* different actions produce different personal, operational, and legal consequences.
4. **Authoritative Statutory Grounding**: Anchor every scenario in primary Indian digital statutes (Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, Digital Personal Data Protection Act 2023) and actionable emergency reporting protocols (National Cybercrime Helpline 1930, CFCFRMS, and `cybercrime.gov.in`).
5. **Architectural Assessment Segregation**: Ensure counterfactual exploration does not import or invoke assessment scoring services, nor execute any read, insert, update, or delete operations against diagnostic assessment or user progress collections.

---

## 2. Existing Implementation Audit `[Current]`

We inspected the codebase to identify existing capabilities, reusable patterns, and architectural boundaries across the portal.

### A. Assessment and Scenario Engine
| File / Module | Current Responsibility & Invariants | Reusability Assessment for Counterfactuals |
| :--- | :--- | :--- |
| `server/controllers/simulationController.js` | Manages authoritative assessment sessions (`/start`, `/submit-step`, `/status/:code`, `/session/:id`). Enforces Compare-and-Swap (CAS) stage transitions, ACID replica-set transactions, strict `idempotencyKey` validation, and invokes `assessmentScoringService`. | **Do Not Reuse for Counterfactuals.** Tightly coupled to transactional scoring, session timeouts, and immutable assessment records. Modifying this controller risks introducing unintended side-effects into authoritative assessment evaluations. |
| `server/routes/simulations.js` | Protected REST routes for assessment simulation (`POST /start`, `POST /submit-step`, etc.). | **Keep Isolated.** Authoritative assessment routes must remain untouched. |
| `server/models/AssessmentSession.js` | Persistent MongoDB model storing learner assessment state, behavioral metric arrays (`behaviourScores`, `behaviourOpportunities`, `behaviourEncounters`), penalty points (`FP`, `UA`), and scoring versions (`scoringVersion: 1 | 2`). | **Strictly Isolated.** Counterfactual exploration must not read from, write to, or query this collection. |
| `server/models/AssessmentDecision.js` | Stores individual assessment choices with compound unique index `{ assessmentSessionId: 1, stageId: 1 }` and partial unique index on `{ assessmentSessionId: 1, idempotencyKey: 1 }`. | **Strictly Isolated.** Counterfactual choices must not read from or be stored in this collection. |
| `server/models/Scenario.js` | Scenario catalog model defining assessment type (`baseline`, `final`, `practice`), difficulty, domains, and configured scoring weights. Indexed on `{ slug: 1, version: 1 }`. | **Separate Domain.** Authoritative scenarios (`baseline`, `final`) are version-locked for psychometric consistency. |
| `server/models/ScenarioStage.js` | Defines assessment stages, stage orders (1–14), mock interface types (`email`, `sms`, `messaging`, `browser`), and psychometric tags (`measurementFocus`, `targetSignals`, `hasSignalProbe`). | **Visual Design Pattern Reusable.** The mock interface types and layout structures (`email`, `sms`, `browser`, `phone_call`) provide a tested visual model, but the stage progression model in `ScenarioStage` is strictly forward-only and convergent. |
| `server/models/ScenarioDecision.js` | Defines decision options with `scoreChange`, `behaviorEffects`, `riskLevel`, and forward-pointing `nextStageId`. | **Forward-Only Graph.** Cannot model rewinding, branch comparisons, or multiple divergent consequence tiers from a single choice. |
| `server/config/scenarios.json` | Master seed definitions for 14-stage Baseline v2 and Final v2 assessment scenarios. | **Preserved Baseline.** Must remain untouched to preserve diagnostic calibration. |
| `server/services/scenarioIntegrityService.js` | Validates graph integrity for assessment scenarios (validating single start node, no self-loops, complete decision coverage). | **Pattern Reference.** Integrity validation concepts can be adapted to validate counterfactual branch graphs. |
| `server/services/assessmentScoringService.js` | Authoritative v1/v2 scoring resolver enforcing the 6-dimensional rubric (TR: 16, SI: 10, VB: 16, DQ: 4, FP: 8/6, UA: 8). | **Strictly Off-Limits.** Must never be imported or invoked for counterfactual exploration. |

### B. Existing Learning and Storytelling Components
| File / Module | Current Responsibility | Reusability Assessment for Counterfactuals |
| :--- | :--- | :--- |
| `server/models/CaseStudy.js` | Models incident dossier archives across multiple case types (`documented-case`, `educational-reconstruction`, `anonymized-incident`, `fictional-training-scenario`) with timeline entries, legal context, warning signs, and static single-question `decisionPoints`. | **Architectural Separation.** The existing `CaseStudy` model provides structured chronological dossiers with static pause-and-choose points. It does not support interactive branch forking, consequence divergence, or comparative synthesis. Counterfactual exploration should remain a separate, dedicated experiential learning module. |
| `client/src/pages/Cases.jsx` | Incident Archive viewer. Implements single pause-and-choose decision points (`decisionPoints[0]`), revealing an explanation and unlocking the remainder of the linear narrative. Uses `localStorage` (`completed_cases`). | **Valuable UX Reference.** Demonstrates how to present an incident file, but currently supports only single-path linear unlocking. |
| `client/src/pages/BaselineAssessment.jsx` & `FinalAssessment.jsx` | Full-screen simulation runners with simulated mock interfaces (email client, SMS banner, browser URL bar, simulated phone call), stage transitions, and signal probe panels. | **UI Pattern Reusable.** The mock interface rendering primitives (SMS headers, chat bubbles, email sender verification, payment prompts) provide a proven, accessible visual language that can be reused for counterfactual dilemmas. |
| `client/src/components/common/EditorialScrollStory.jsx` | Desktop sticky contextual navigation + sequential active content on the right, using `IntersectionObserver` with zero continuous polling loops and WCAG compliance. | **Highly Reusable.** Can anchor a counterfactual incident timeline, allowing learners to view the unfolding consequences of their selected branch while keeping the decision junction accessible. |
| `client/src/components/common/ScrollLinkedIncidentCase.jsx` | Production editorial scroll investigation for Case File 014, linking a left-hand Forensic Evidence Docket with right-hand chronological narrative stages. | **Layout Reusable.** Clean editorial frame for displaying unfolding incident timelines alongside statutory evidence. |
| `client/src/components/dashboard/DigitalMomentsStorySection.jsx` | Tabbed dashboard story component connecting everyday dilemmas (*Midnight Power Cut SMS*, *₹15 Courier Redirection*, *Digital Arrest Video Call*, *Reverse QR Code*) to statutory provisions. | **Prime Content Seeds.** The four everyday dilemmas in this component represent suitable curriculum candidates for full counterfactual branch exploration. |
| `client/src/components/PathwayRunner.jsx` | 3-step structured intervention modal (Incident Learning $\rightarrow$ Practical Defense $\rightarrow$ Checkpoint Quiz). Interacts with `UserProgress`. | **Strict Separation.** Counterfactual exploration must remain an independent experiential sandbox and not be conflated with the remediation pathway runner. |

---

## 3. Confirmed Gaps vs. Assumptions `[Current]`

Before defining architecture, we confirmed what capabilities exist versus what is missing:

| Domain | Initial Assumption | Confirmed Codebase Reality | Real Gap Identified |
| :--- | :--- | :--- | :--- |
| **Branching Graph** | Existing `ScenarioStage` and `ScenarioDecision` can support alternative outcome exploration. | Existing `Scenario` graph is designed solely for *forward progression* through 14 stages (converging at Stage 10) to compute authoritative behavioral scores. It has no mechanism for rewinding to a fork, exploring alternative branches, or comparing outcomes. | Existing scenario models cannot model counterfactual rewinding or side-by-side outcome synthesis. |
| **Story Progression** | Case studies support interactive decision trees. | In `CaseStudy.js` and `Cases.jsx`, `decisionPoints` are static multiple-choice questions with a single explanation. The story after the choice is identical regardless of the answer. | There is currently **zero alternative-outcome narrative infrastructure** in the portal. |
| **Session Persistence** | Counterfactual exploration requires a dedicated MongoDB session schema like `AssessmentSession`. | Authoritative assessment requires session persistence because it is a formal diagnostic measurement spanning 13 stages with paired baseline/final deltas. Counterfactual exploration is a self-directed, 2-to-3 minute exploratory inquiry where learners test choices immediately. | A heavy database session model is **unnecessary and counterproductive** for exploratory counterfactual learning. |
| **Progress Tracking** | Counterfactual choices should be recorded in `UserProgress`. | `UserProgress` tracks formal curriculum modules, pathway checkpoints, and spaced retrieval. Silently recording exploratory counterfactual choices (which intentionally include reckless or curious choices) as learner habit data would distort learner profiles. | Counterfactual exploration must not alter `UserProgress` habit metrics. |

---

## 4. Evaluation of Architecture Alternatives `[Proposed Design Decisions]`

We systematically evaluated three architectural approaches against strict technical and pedagogical criteria:

```
+----------------------------------------------------------------------------------------------------+
| OPTION A: Content-Driven, Client-Side State Exploration (RECOMMENDED DIRECTION)                    |
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
| **Assessment Isolation** | **Complete**. Counterfactual components do not import `assessmentScoringService` and execute zero read or write operations against `AssessmentSession` or `AssessmentDecision`. | **Moderate Risk**. Requires strict isolation rules across controllers, routes, and services to prevent bleed. | **High Risk**. Reusing `Scenario` or `simulationController` risks accidental score execution or index collisions. |
| **Learner Experience & Responsiveness** | **In-Memory Client Evaluation**. Branch transitions, rewinding, and comparative views evaluate directly in React state without network latency or round-trip spinners. | **Network Dependent**. Every rewind or branch switch requires an HTTP round-trip, database transaction, and loading state. | **Complex**. Existing assessment screens are not designed for smooth backtracking or comparison. |
| **System Complexity** | **Minimal**. Clean, declarative data schema; lightweight client state machine; zero new database collections or transactional overhead. | **High**. Requires new Mongoose schemas, indexes, controllers, route handlers, error handlers, and lifecycle cleanup routines. | **High**. Complex migrations of existing scenario/case schemas; tight coupling between disparate features. |
| **Privacy & Data Minimization** | **Highest**. Exploratory choices (including deliberately unsafe choices made out of curiosity) are never logged to a remote server. | **Low**. Stores every intermediate click, timestamp, and choice in persistent database records. | **Low**. Would store exploratory actions in shared or adjacent collections. |
| **Authoring & Content Agility** | **High**. Scenarios are declarative, modular documents containing narrative branches, timeline steps, and statutory cards. | **Low**. Content authoring requires matching complex database IDs and relational references. | **Very Low**. Conflates historical case dossiers with hypothetical "what if" fictional branches. |
| **Testing & Maintainability** | **Clean & Predictable**. Deterministic component unit tests and Playwright interaction tests; zero database state dependencies. | **High Maintenance**. Requires concurrency tests, transaction rollback tests, session expiration tests, and database fixtures. | **High Maintenance**. Risks breaking existing baseline/final assessment regression suites. |

### Architectural Recommendation
**Option A (Content-Driven, Client-Side Exploration with a Dedicated Read-Only Catalog)** is the recommended architecture direction pending formal user approval.

It ensures that counterfactual exploration operates without reading from or writing to assessment tables, delivers a responsive learner experience for rewinding and comparing branches, and avoids database bloat and migration hazards.

---

## 5. Proposed Architecture, Data Model & Lifecycle `[Proposed Design Decisions & Implementation]`

### A. Architectural Overview
Under Option A, Counterfactual Scenario Learning operates as a self-contained, read-only educational module:

```
[ Client: /workspace/counterfactuals ]
  │
  ├── 1. Scenario Selector (Catalog of 4 Fictional Educational Scenarios)
  │
  ├── 2. Incident Briefing & Simulated Stimulus (Fictional Mock SMS, Email, Call, or QR)
  │
  ├── 3. Decision Junction (2–3 Actionable Choices: Comply / Inaction / Verify)
  │
  ├── 4. Branch Consequence Timeline (Immediate Reactions vs. Potential Escalation)
  │
  ├── 5. "Fork & Rewind" Interaction (Return to Junction to test alternative path)
  │
  ├── 6. Optional Comparative Synthesis Matrix (Available when exploredBranchIds.length >= 2)
  │
  └── 7. Statutory Takeaway & Official Reporting Protocol (Accessible after >= 1 explored branch)
```

### B. Declarative Scenario Schema Specification `[Proposed]`
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
  
  // Fictional educational context
  incidentContext: {
    summary: string;
    targetVector: string; // e.g., 'Spoofed SMS Header + Urgent Threat of Power Disconnection'
    mockInterfaceType: 'sms' | 'email' | 'messaging' | 'browser' | 'phone_call' | 'qr_code';
    mockInterfaceData: Record<string, unknown>; // Uses fictional placeholders only
  };

  // The critical decision point
  decisionJunction: {
    prompt: string; // "What do you do when this message arrives?"
    choices: CounterfactualChoice[];
  };

  // Synthesis & Takeaways
  defensiveTakeaway: {
    coreRule: string; // Primary defensive principle for this threat category
    statutoryFramework: {
      act: string; // e.g., 'Information Technology Act, 2000'
      section: string; // e.g., 'Section 66D'
      status: 'IN_FORCE' | 'ENACTED_FUTURE_COMMENCEMENT';
      plainSummary: string;
      applicabilityNote?: string; // Explains conditional applicability based on factual elements
    }[];
    officialReportingProtocol: {
      primaryChannel: '1930' | 'cybercrime.gov.in';
      guidance: string;
    };
  };
}

export interface CounterfactualChoice {
  id: string; // e.g., 'choice-panic-pay'
  label: string; // 'Call the Private Number Provided in the Message'
  choiceType: 'reflexive-compliance' | 'passive-inaction' | 'active-verification';
  shortAction: string; // Brief summary of the specific action taken
  
  // The unfolding consequence chain
  consequence: {
    immediateTitle: string; // e.g., 'Immediate Reaction: The Coerced Interaction'
    immediateBody: string; // Explains the immediate technical/social engineering mechanism
    escalatedTitle: string; // e.g., 'Potential Later Escalation: Secondary Risk'
    escalatedBody: string; // Explains plausible downstream developments without guaranteeing an outcome
    impactAssessment: {
      financialExposure: 'None' | 'Potential loss of paid amount' | 'High risk of credential capture';
      accountSafety: 'Secure' | 'At Risk' | 'Compromised';
      legalConsiderations: string; // Objective legal summary; no categorical liability determinations
    };
    whyItHappened: string; // Forensic explanation of the psychological and technical dynamics
  };
}
```

### C. Client State Machine & Lifecycle (`useCounterfactualSession`) `[Proposed Design Decisions]`

The learner's interaction within a scenario is managed entirely in React component memory:

```typescript
interface CounterfactualState {
  currentScenario: CounterfactualScenario;
  activeBranchId: string | null; // Currently selected choice (null when at briefing or junction)
  exploredBranchIds: string[]; // Ordered list of unique choice IDs tested in current in-memory session
  currentStep: 'briefing' | 'junction' | 'consequence' | 'comparison' | 'takeaway';
  consequenceStage: 'immediate' | 'escalated'; // View toggle for consequence timeline
}
```

#### Derived Values (Eliminating Redundant State)
- **`isComparisonUnlocked`**: Strictly derived as `exploredBranchIds.length >= 2`. No separate boolean state is stored, preventing state divergence. Comparison is an optional exploration tool, not a mandatory prerequisite for completion.

#### Reconciled Deterministic Lifecycle State Transitions
1. **Switching Scenarios**: Navigating to another scenario completely resets active in-memory exploration state (`activeBranchId: null`, `exploredBranchIds: []`, `currentStep: 'briefing'`).
2. **Revisiting a Previously Completed Scenario**: Always starts a fresh exploration session in memory (`exploredBranchIds: []`). If the scenario's slug exists in `localStorage`, the catalog displays a completion badge indicating prior completion. Previous branch choices and comparison views are **not** restored, and the learner cannot jump directly into a past comparison without re-exploring at least two branches.
3. **Browser Refresh**: Active component state resets cleanly to `'briefing'`. No corrupted session states occur because state is not tied to persistent backend sessions. Any previously earned `localStorage` completion marker remains intact.
4. **Rewinding to Junction**: Clicking "Rewind to Decision Point" sets `activeBranchId = null` and `currentStep = 'junction'`, while preserving `exploredBranchIds` tested in the current in-memory session. The decision junction visually indicates which choices have already been explored and prompts testing an unexamined choice.
5. **Revisiting an Already-Explored Branch**: The learner can re-click an already-explored choice to re-read its consequence narrative without duplicating IDs in `exploredBranchIds`.
6. **Resetting a Scenario**: A dedicated "Reset Exploration" button clears `exploredBranchIds` and returns the learner to `'junction'`.
7. **Leaving Mid-Exploration**: Navigating away leaves zero partial writes on the server. `localStorage` is not updated unless the learner reaches Step 8 synthesis.
8. **Completion Gate**: Completion is recorded only when the learner reaches Step 8 (Statutory Takeaway & Synthesis) after exploring at least one branch.
9. **Optional Comparison**: Comparative synthesis becomes available as an optional exploration mode once `exploredBranchIds.length >= 2`. A learner who explores one branch may proceed directly to Step 8 synthesis to complete the scenario without being forced to compare.

### D. Client-Side Completion Tracking Decision `[Proposed Design Decisions]`
To allow learners to track their self-directed exploration without server persistence, the proposal establishes the following single canonical specification:

- **Canonical Key Name**: `cl_counterfactual_completed_slugs` (stored as a JSON stringified array of scenario slugs in `localStorage`).
- **Completion Trigger**: A scenario slug is added to `cl_counterfactual_completed_slugs` **only when the learner reaches Step 8 (Statutory Takeaway & Synthesis)** after exploring at least one branch. Merely opening or previewing a scenario does not mark it complete.
- **Three Discrete UI States**:
  - `Unstarted`: Slug is not present in `cl_counterfactual_completed_slugs` and `exploredBranchIds.length === 0`.
  - `In Progress`: Learner is actively testing branches in the current session (`exploredBranchIds.length > 0`), but has not reached the final synthesis.
  - `Explored`: Slug exists in `cl_counterfactual_completed_slugs`. The catalog renders a clean `Explored` badge with an action to `Explore Again`.

#### Strict Three-Tier Architectural Distinction
1. **In-Memory Active Exploration State (`useCounterfactualSession`)**: Ephemeral React state tracking current branch, tested branches, and UI step. Resets on refresh or navigation.
2. **Persisted Local Completion Marker (`cl_counterfactual_completed_slugs`)**: Local browser convenience marker indicating prior completion. Does not restore branch state, does not leave the browser, and is not verified learning evidence.
3. **Backend-Authoritative Assessment and Learning Records (`AssessmentSession`, `AssessmentDecision`, `UserProgress`)**: Completely isolated. Counterfactual exploration executes zero reads, writes, updates, or deletes against these collections.

---

## 6. Proposed Learner Journey & Interaction Model `[Proposed Design Decisions]`

The proposed experience follows a clear, 8-step cognitive arc with optional comparison:

```
[ Step 1: Encounter ] ──> Enter everyday digital dilemma (Fictional mock SMS / Email / Call)
        │
[ Step 2: Junction ]  ──> Reach critical decision point with 2–3 actionable choices
        │
[ Step 3: Selection ] ──> Select one action (e.g. Choice A: Reflexive Compliance)
        │
[ Step 4: Downstream] ──> Experience plausible consequences (Immediate vs. Potential Escalation)
        │
[ Step 5: Rewind ]    ──> Click "Rewind & Try Another Choice" ──┐
        │                                                       │
        └───────────────────────────────────────────────────────┘
        │
[ Step 6: Explore Alt]──> Select alternative action (e.g. Choice C: Active Verification)
        │
        ├── [ Optional Step 7: Compare ] ──> Compare Explored Outcomes Matrix (Unlocked when explored >= 2)
        │                                           │
        └───────────────────────────────────────────┘
        │
[ Step 8: Synthesis ] ──> Receive Statutory Takeaway & 1930 Emergency Reporting Protocol
                          (Accessible after exploring >= 1 branch; marks scenario as completed)
```

### Key Interaction Details

#### 1. Simulated Stimulus with Fictional Placeholders
Learners see a clean visual mock of the stimulus using the portal's existing restrained design tokens (warm ivory ground `#f8f7f1`, deep navy `#0f2537`, hairline borders `#e6e5e0`).
- *Fictional Identifiers*: All phone numbers, links, and accounts use unmistakably fictional placeholders (e.g., `+91-00000-00000`, `alert-utility.example.invalid`, `consumer-account-0000`).

#### 2. The Decision Junction
The learner is presented with three distinct, relatable choices:
- **Choice A (Reflexive Compliance)**: Contact the provided private number or link immediately to address the stated urgency.
- **Choice B (Passive Inaction)**: Delete or ignore the message without verifying account status.
- **Choice C (Active Independent Verification)**: Access the official service portal or application via independently known channels using registered account identifiers.

#### 3. Experiencing Downstream Consequences (Plausible Causal Modeling)
Choosing an option unfolds an editorial consequence timeline that explains *how* technical and psychological factors interact:
- **Immediate Reaction**: The initial interaction (e.g., caller confirms an alleged disconnection order and provides an unverified payment link).
- **Potential Later Escalation**: Plausible downstream developments (e.g., unverified payment portals may capture card details, or fake callers may re-contact demanding additional fees).
- **Forensic Mechanism**: Explains that artificial urgency suppresses critical pauses, prompting instinctive compliance.
- *Strict Rule*: No arbitrary financial figures or unsupported time durations are asserted as inevitable facts. Any monetary figures are explicitly identified as illustrative examples.

#### 4. The "Rewind & Fork" Affordance
A prominent, encouraging action bar appears:
> *"You have examined the plausible consequences of contacting the provided number. What would happen if you chose Active Verification instead?"*  
> `[ ↺ Rewind to Decision Point ]`

Clicking returns the learner to the decision junction, visually highlighting that Choice A has already been explored and encouraging testing an alternative path.

#### 5. Optional Comparative Synthesis (Derived when `exploredBranchIds.length >= 2`)
Once at least two paths have been explored, a **"Compare Explored Outcomes"** banner unlocks. Clicking it renders a side-by-side comparison table contrasting:
- Decision strategy (Compliance vs. Inaction vs. Verification).
- Plausible operational and financial exposure.
- Key legal considerations (distinguishing voluntary transfers under deception from unauthorized access).
- Practical next steps.

#### 6. Practical Defensive Lesson & Statutory Hook (Step 8 Synthesis)
Accessible after exploring at least one branch. Concludes with a structured takeaway card:
- **Statutory Framework**: Explains relevant provisions of the IT Act 2000 and BNS 2023 with verified commencement status.
- **Reporting Protocol**: Guidance on reporting cyber fraud via Helpline **1930** and portal `https://cybercrime.gov.in`.
- **Completion Trigger**: Reaching this view writes the scenario slug into `cl_counterfactual_completed_slugs`.

---

## 7. Initial Curriculum: Four Fictional Educational Scenarios `[Proposed Content Scope]`

To provide structured, high-value coverage without content clutter, Stage 3 introduces four representative fictional educational simulations addressing common cyber threat patterns in India:

| Scenario Title | Incident Vector & Simulated Stimulus | Decision Choices | Primary Statutory Grounding & Applicability Notes |
| :--- | :--- | :--- | :--- |
| **1. The Midnight Power Cut SMS** | Fictional educational simulation: SMS purporting to be from a utility provider, using an unofficial number (`+91-00000-00000`) and a manufactured 5-hour cutoff. | 1. Contact private number and follow payment directions.<br>2. Delete and ignore message.<br>3. Verify account balance on official utility portal independently. | **BNS § 318(4)** (Cheating and dishonestly inducing delivery of property) applies to fraudulently obtaining funds.<br>**IT Act § 66D** (Cheating by personation using computer resource) applies conditionally if computer or telecom resources were used to personate a utility official.<br>*Statutory Clarification*: Legitimate utilities do not dispatch individual officers with private mobile numbers to demand immediate payment under manufactured cutoff deadlines. |
| **2. The Nominal ₹15 Parcel Fee** | Fictional educational simulation: Delivery exception SMS with a deceptive link (`delivery-update.example.invalid`) requesting address update and a nominal ₹15 fee. | 1. Access link and enter card credentials to pay ₹15.<br>2. Wait for delivery courier without checking.<br>3. Track AWB code on official logistics portal directly. | **BNS § 318(4)** applies to inducing payments by fraud.<br>**BNS § 319** (Cheating by personation) applies *conditionally* only where the perpetrator personates a specific courier representative or entity (representing oneself to be someone else).<br>**IT Act § 66C** (Identity theft) applies *conditionally* only if the perpetrator fraudulently or dishonestly makes use of another person's electronic signature, password, or other unique identification feature. Ordinary input or harvesting of payment details does not automatically satisfy § 66C without proving fraudulent use of qualifying unique identification features. |
| **3. The "Approve Payment" QR Code** | Fictional educational simulation: Buyer on a classified marketplace sends a QR code claiming it "receives" funds for a listed item. | 1. Scan QR and enter UPI PIN.<br>2. Request direct bank account transfer (NEFT/IMPS) or cash.<br>3. Verify account credit directly via banking passbook. | **BNS § 318(4)** applies to fraudulently inducing payment authorization under the false pretense of receiving money.<br>**IT Act § 66D** applies conditionally if personation occurred.<br>**UPI Guidance**: Entering a UPI PIN authorizes a transaction that can debit your account. You do not need to enter your UPI PIN to receive money. Always verify the payee and transaction details before authorizing a payment.<br>*Correction Note*: IT Act § 43 does **not** apply to voluntary PIN entry on a user's own device; § 43 governs unauthorized system access, extraction, or damage. |
| **4. The Video Summons "Digital Arrest"** | Fictional educational simulation: Video call alleging money laundering, displaying forged police insignia, and demanding fund transfer to a "verification account." | 1. Comply with demands and transfer funds.<br>2. Terminate call immediately and report to Helpline 1930.<br>3. Argue with caller while remaining on video. | **BNS § 204** (Impersonating a public servant).<br>**BNS § 308** (Extortion) applies *conditionally* where the statutory elements of intentionally putting a person in fear of injury and dishonestly inducing property delivery are established (threats of arrest do not automatically establish extortion in every instance).<br>**BNS § 318(4)** (Cheating).<br>**IT Act § 66D** (Cheating by personation).<br>*Statutory Clarification*: "Digital Arrest" has no basis in Indian law. Arrest procedures are governed by Chapter V (Sections 35 to 62) of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS); processes to compel appearance (including summons) are governed by Chapter VI (Sections 63 to 93) and Section 35(3) of the BNSS (with applicable savings under Section 531). Legitimate authorities do not require citizens to transfer money to private "safe" or "verification" accounts to avoid arrest. |

---

## 8. Non-Negotiable Invariants & Safeguards `[Proposed Safeguards]`

### A. Measurable Assessment and Progress Isolation
1. **Zero Scoring Execution**: Counterfactual components must not import or invoke `assessmentScoringService.js`.
2. **Zero Database Writes**: Counterfactual interactions must not execute any insert, update, or delete operations against `AssessmentSession`, `AssessmentDecision`, or `UserProgress`.
3. **Zero Database Reads**: Counterfactual components must not query, read, or depend on records in `AssessmentSession`, `AssessmentDecision`, or `UserProgress`.
4. **Immutable Diagnostic History**: Counterfactual interactions must not modify learner behavioral scores (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`), radar habit profiles, baseline-final deltas, or diagnostic portfolios.
5. **No Prerequisite Interference**: Completing or skipping counterfactual scenarios must not alter the prerequisite check for Final Assessment (`403 PREREQUISITE_NOT_MET`).
6. **No Telemetry Bleed**: No counterfactual decision data may be transmitted to or stored in backend assessment endpoints.

### B. Learning Separation
1. **UserProgress Protection**: Counterfactual activity must not write to, update, or delete records in `UserProgress` collections (`completedPathways`, `completedModules`, `spacedReviews`).
2. **Portfolio Boundary**: Counterfactual scenarios do not award verified defensive badges or alter formal certification evidence.

### C. Synthetic Data and Mock Safety
1. **Unmistakably Fictional Placeholders**: All telephone numbers, account numbers, UPI IDs, URLs, and addresses must use unmistakably fictional placeholders (e.g. `+91-00000-00000`, `user@example.invalid`, `portal.example.invalid`).
2. **No Real PII or Active Payment Destinations**: No functional phishing links, active QR payment codes, or real personal information may be used.
3. **Zero Credential Capture**: Mock interfaces must not request or retain actual passwords, OTPs, UPI PINs, card numbers, or credentials. Any simulated input fields must discard text immediately.

### D. Educational and Statutory Integrity
1. **Clear Scenario Classification**: Every counterfactual scenario must display a clear, prominent disclosure:
   > *"Educational Simulation: Hypothetical Counterfactual Model. Scenarios and consequence branches are educational models designed to teach causal reasoning and defensive habits. They do not represent specific individuals, documented cases, or guaranteed legal/financial outcomes."*
2. **Preservation of CaseStudy Distinction**: Counterfactual simulations are strictly decoupled from documented historical incident archives (`CaseStudy`).
3. **Statutory Accuracy**: All legal references cite primary statutes (IT Act 2000, BNS 2023, DPDP Act 2023) with explicit commencement status (`IN_FORCE` vs. `ENACTED_FUTURE_COMMENCEMENT`). Provisions of the DPDP Act 2023 that are enacted but pending operational commencement (e.g., G.S.R. 843(E) dated 13 November 2025) are explicitly identified as non-operative.
4. **RBI Regulatory Framework & No Categorical Liability Guarantees**:
   - Customer liability and dispute resolution are governed by applicable operative RBI Master Directions and circulars across specific payment categories:
     - *Commercial Banks*: RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 dated July 6, 2017 ("Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions"), consolidated in Master Direction – Customer Service in Banks.
     - *Prepaid Payment Instruments (PPIs)*: RBI Circular DPSS.CO.PD.No.1417/02.14.006/2018-19 dated January 4, 2019 and Master Directions on Prepaid Payment Instruments (PPIs) (Updated as of February 10, 2023).
     - *Credit and Debit Cards*: Master Direction – Credit Card and Debit Card – Issuance and Conduct Directions, 2022 (DoR.AUT.REC.No.27/24.01.041/2022-23, updated as of March 7, 2024), Chapter VI.
     - *Digital Payment Security Controls*: Master Direction on Digital Payment Security Controls (DoS.CO.CSITE.SEC.No.1852/31.01.015/2020-21 dated February 18, 2021).
   - *Crucial Regulatory Distinction*: These regulatory protections apply primarily to **unauthorised transactions** (occurring without customer consent). Where a transaction is **voluntarily authorized by the customer under deception** (e.g. entering a UPI PIN or card credentials due to social engineering), regulatory zero-liability rules do not automatically apply. Recourse depends on prompt reporting to the bank, chargeback rules where applicable, law enforcement complaint filing, and inter-bank hold coordination.
   - Educational content will explain that liability and recovery depend on transaction classification, factual circumstances, compliance with reporting timelines under applicable regulatory requirements, and bank investigation procedures. Content must not promise zero customer liability or guaranteed financial recovery.
5. **Emergency Reporting Protocol**: Directs victims immediately to National Cybercrime Helpline **1930** and portal `https://cybercrime.gov.in`. Content will explain that prompt reporting supports coordination through inter-bank mechanisms (CFCFRMS) to request holds on beneficiary accounts before secondary withdrawal, without guaranteeing fund recovery. Fixed or universal "Golden Hour" time claims must not be asserted.

### E. Visual Redesign Freeze Adherence
1. Strictly adheres to the current visual foundation: warm ivory background (`#f8f7f1`), deep institutional navy (`#0f2537`), restrained blue accents (`#2563eb`), hairline borders (`#e6e5e0`), and Inter typography.
2. Zero cyberpunk tropes, dark hacker terminals, flashing alerts, or generic SaaS clutter.

---

## 9. Acceptance Criteria & Validation Strategy `[Proposed Implementation Standards]`

When Stage 3 implementation is authorized, acceptance will be governed by the following criteria:

### Acceptance Criteria
- **AC-1 (Catalog Presentation)**: Learners can browse and select from the 4 calibrated fictional educational scenarios in `/workspace/counterfactuals`.
- **AC-2 (Incident Stimulus with Fictional Placeholders)**: Each scenario accurately renders realistic incoming stimuli using fictional, non-functional placeholders (`+91-00000-00000`, `example.invalid`) and accessible mock interface components.
- **AC-3 (Multi-Branch Consequence Rendering)**: Learners can select any of the available choices and view a multi-stage consequence timeline explaining technical and psychological mechanisms without arbitrary figures.
- **AC-4 (Rewind & Forking)**: Learners can rewind to the decision junction at any time, select alternative paths, and view alternative consequences without network latency or page reloads.
- **AC-5 (Comparative Synthesis Matrix)**: Derived dynamically when `exploredBranchIds.length >= 2`. Unlocks a side-by-side comparative matrix contrasting choices, exposure, and objective legal considerations.
- **AC-6 (Statutory & Reporting Guidance)**: Each scenario concludes with an accurate statutory card disclosing commencement status and Helpline 1930 guidance without categorical liability claims or recovery guarantees.
- **AC-7 (Multi-Tier Assessment & Progress Isolation)**:
  - Counterfactual components must not import or invoke `assessmentScoringService`.
  - Counterfactual exploration makes zero backend API calls for decision branching or state management across all HTTP methods.
  - No insert, update, delete, or read operations occur against `AssessmentSession`, `AssessmentDecision`, or `UserProgress`.
  - Existing assessment lifecycle tests (`aq4_integrated_lifecycle.test.js`, `scoring_v2_authoritative.test.js`, `stagingProductionSmoke.test.js`) continue passing 100% green.
- **AC-8 (Responsive Accessibility & Clean Build)**: Clean Vite production build, zero linter errors, full keyboard navigation (focus states, Escape dismissal), and zero horizontal overflow on mobile viewports ($\le 900\text{px}$).

### Proposed Implementation-Stage Validation Strategy (Not Executed During Planning)
1. **Static Analysis & Import Boundary Test**: Automated AST/linter check verifying:
   - Client components under `client/src/components/counterfactual/` do not import `assessmentScoringService`, `AssessmentSession`, `AssessmentDecision`, or `UserProgress`.
   - Backend routes and services under `server/` contain zero counterfactual endpoints accessing assessment or progress models.
2. **Comprehensive Network Request Monitoring Test**: Playwright test asserting that running all 4 counterfactual scenarios generates zero HTTP requests (GET, POST, PUT, PATCH, DELETE) to `/api/assessments/*`, `/api/simulations/*`, or `/api/progress/*`.
3. **Database Command Monitoring Instrumentation**: Database test listener asserting that zero write or read commands (insert, update, delete, find) are issued against `assessmentsessions`, `assessmentdecisions`, or `userprogresses` during counterfactual traversal. (Note: Document count comparisons alone are insufficient, as counts cannot verify that update or read operations did not occur).
4. **Assessment Regression Verification**: Full execution of `aq4_integrated_lifecycle.test.js` and `scoring_v2_authoritative.test.js` to ensure authoritative diagnostic scoring remains 100% invariant.
5. **Playwright Live Browser Smoke Test**: End-to-end browser test traversing scenario branching, rewinding to test alternative choices, unlocking the comparison matrix, and capturing screenshots.
6. **Client Production Build Verification**: Verifying 0 errors and sub-second build performance via `npm run build --prefix client`.

---

## 10. Proposed Design Decisions & Authorization Boundary `[Proposed Decisions & Boundary]`

### Proposed Design Decisions (Pending Explicit User Approval)
The following design decisions are recommended for Stage 3:
1. **Sidebar Navigation Placement**: Place Counterfactuals in Workspace Sidebar under "Your Learning" at route `/workspace/counterfactuals`.
2. **Single Canonical Progress Key**: Use `cl_counterfactual_completed_slugs` in client `localStorage` as the sole completion key.
3. **Local-Only Completion Scope**: Completion is strictly a local browser convenience marker. It does not constitute verified learning evidence and must never enter the Verified Defensive Learning Portfolio or `UserProgress`.
4. **Derived Comparison Affordance**: Comparison is optional and derived dynamically when `exploredBranchIds.length >= 2`.
5. **Step 8 Completion Gate**: Completion is recorded only when the learner reaches Step 8 (Statutory Takeaway & Synthesis) after exploring at least one branch.
6. **Zero Backend Persistence**: No backend persistence, sessions, or telemetry collection for counterfactual choices.
7. **Absolute Assessment Isolation**: Counterfactual components operate completely separate from assessment scoring, portfolios, and `UserProgress`.

> [!IMPORTANT]
> The above design decisions are **proposals awaiting user review and approval**. They **do not authorize implementation**. Work remains strictly paused at this planning boundary.

### Prioritized Next Actions
1. **User Review**: Product owner review of this final reconciled proposal (`STAGE_3_COUNTERFACTUAL_DESIGN_PROPOSAL.md`).
2. **Formal Authorization**: Await explicit user authorization before initiating implementation.
3. **Wave 1 Execution (Upon Authorization)**: Define declarative scenario data fixtures for the 4 fictional educational scenarios.
4. **Wave 2 Execution (Upon Authorization)**: Implement client components (`CounterfactualExplorer`, `DecisionJunction`, `ConsequenceTimeline`, `ComparativeMatrix`).
5. **Wave 3 Execution (Upon Authorization)**: Conduct end-to-end testing, Playwright verification, and documentation synchronization.

---
*Report prepared for formal architectural review. Implementation work remains strictly paused.*
