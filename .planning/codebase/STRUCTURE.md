# Codebase Structure & Component Ownership Reference

## 1. Root Directory Layout
```text
cyber-law-portal/
├── .planning/                              # GSD planning, architecture, requirements & frozen structural baseline
│   ├── codebase/                           # Evidence-backed codebase maps (ARCHITECTURE.md, STRUCTURE.md, etc.)
│   ├── DESIGN_IMPROVEMENT_BACKLOG.md       # Deferred post-development visual design & UX backlog
│   ├── PROJECT.md                          # High-level vision and behavioral measurement goals
│   ├── REQUIREMENTS.md                     # Six-metric formula, functional, and canonical journey requirements
│   ├── ROADMAP.md                          # Phase breakdown and milestone status
│   ├── STATE.md                            # Current execution position, health, and verification status
│   └── STRUCTURE.md                        # Canonical component ownership and structural reference
├── client/                                 # React 18 + Vite frontend application
│   ├── src/
│   │   ├── components/                     # UI components, widgets, modals, and assessment mockups
│   │   │   ├── assessment/                 # DigitalAwarenessProfile, score breakdowns, radar charts
│   │   │   ├── auth/                       # SignInForm, SignUpForm
│   │   │   ├── common/                     # ErrorBoundary, EditorialRule, UI buttons
│   │   │   ├── dashboard/                  # AtelierMasthead, PrimaryFocus, CurriculumLessonsSection, etc.
│   │   │   ├── navigation/                 # Navbar, Sidebar, Breadcrumb
│   │   │   ├── scenario/                   # Phone, email, browser, and UPI simulated mockups
│   │   │   ├── PathwayRunner.jsx           # Self-contained 3-step micro-learning intervention modal runner
│   │   │   └── RemediationCards.jsx        # Recommendation cards supporting preview and interactive modes
│   │   ├── context/                        # AuthContext and state providers
│   │   ├── pages/                          # Primary page-level route containers
│   │   │   ├── About.jsx                   # Project mission, legal advisors, methodology
│   │   │   ├── AdminPanel.jsx              # Admin management, metrics, audit logs
│   │   │   ├── BaselineAssessment.jsx      # First Check simulation container ("Your Digital Day")
│   │   │   ├── Cases.jsx                   # Case studies archive with slug filtering
│   │   │   ├── Crimes.jsx                  # Cyber crime categories and practical defenses
│   │   │   ├── Dashboard.jsx               # Central authenticated learning workspace hub
│   │   │   ├── FinalAssessment.jsx         # Final Safety Check branching simulation container
│   │   │   ├── Home.jsx                    # Public portal landing page
│   │   │   ├── Laws.jsx                    # Indian cyber law statutory reference center
│   │   │   ├── Login.jsx & Register.jsx    # Authentication entry points
│   │   │   ├── Modules.jsx                 # Structured curriculum chapters and lessons
│   │   │   ├── Prevention.jsx              # Cyber hygiene practices and 1930 reporting guidance
│   │   │   ├── Quizzes.jsx                 # Statutory knowledge practice and recall drills
│   │   │   └── Resources.jsx               # Emergency portals, helpline 1930, downloads
│   │   ├── services/
│   │   │   └── api.js                      # Centralized backend REST API client
│   │   ├── utils/
│   │   │   ├── dashboardJourneySelectors.js# Deterministic 11-state priority ladder & orientation selector
│   │   │   └── evidenceSelectors.js        # Authoritative recall and portfolio metrics derivations
│   │   ├── App.jsx                         # Main router, route guards, workspace shell layout
│   │   └── main.jsx                        # React root entry point
│   ├── package.json
│   └── vite.config.js                      # Vite build configuration (Reticle removed)
├── server/                                 # Express 4 Node.js REST API backend
│   ├── config/
│   │   ├── db.js                           # Mongoose connection with retry and timeout configuration
│   │   ├── remediationCatalog.js           # Grounded catalog with verified statutory provisions & answer keys
│   │   └── seed.js                         # Database bootstrap fixtures for scenarios, modules, and laws
│   ├── controllers/
│   │   ├── authController.js               # Registration, login, profile retrieval
│   │   ├── moduleController.js             # Curriculum catalog & authenticated lesson progress tracking
│   │   ├── progressController.js           # Pathway execution, checkpoint evaluation, portfolio, recalls
│   │   ├── quizController.js               # Quiz catalog, attempt submission, missed topic analysis
│   │   └── simulationController.js         # Assessment state machine, CAS updates, prerequisite enforcement
│   ├── middleware/
│   │   └── authMiddleware.js               # JWT bearer token verification & admin role guards
│   ├── models/
│   │   ├── AssessmentSession.js            # Immutable evaluation session records & 6-metric profile
│   │   ├── LearningModule.js               # Published curriculum lessons, chapters, and statutory mapping
│   │   ├── Quiz.js & QuizAttempt.js        # Statutory practice questions and attempt records
│   │   ├── Scenario.js & ScenarioStage.js  # Branching simulation graphs and stage decisions
│   │   ├── User.js                         # Authenticated identity credentials and role
│   │   └── UserProgress.js                 # Pathway interventions, reinforcements, lesson progress
│   ├── routes/                             # Express route declarations (/api/auth, /api/assessments, etc.)
│   ├── services/
│   │   ├── assessmentScoringService.js     # Authoritative 6-metric Criterion-Referenced Behavioral Diagnostic Rubric scoring engine
│   │   ├── remediationEngineService.js     # Pure deficit ranking: Deficit * Severity * Opportunity
│   │   └── scenarioIntegrityService.js     # Graph traversal validation and version isolation
│   ├── tests/                              # Node native automated test suites
│   └── server.js                           # Express entry point (Port 5000)
├── package.json                            # Root workspace concurrently runner
└── README.md                               # Project overview and runbook
```

---

## 2. Route Architecture & Canonical URL Mapping

| Canonical Path | Context | Primary Component | Access Control | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public Portal | `Home.jsx` | Public | Portal landing, emergency 1930 guidance, entry points |
| `/about` | Public Portal | `About.jsx` | Public | Methodology, academic advisory, statutory scope |
| `/laws` | Public Portal | `Laws.jsx` | Public | Indian cyber law statutory reference center |
| `/crimes` | Public Portal | `Crimes.jsx` | Public | Overview of cyber crime categories under Indian law |
| `/cases` | Public Portal | `Cases.jsx` | Public | Real-world case study archive (slug filter supported) |
| `/prevention` | Public Portal | `Prevention.jsx` | Public | Preventive hygiene rules, Helpline 1930, cybercrime.gov.in |
| `/resources` | Public Portal | `Resources.jsx` | Public | Official helplines, reporting forms, cyber security guides |
| `/login` | Public Portal | `Login.jsx` | Unauthenticated | Learner and admin authentication |
| `/register` | Public Portal | `Register.jsx` | Unauthenticated | Learner account registration |
| `/dashboard` | Workspace | `Dashboard.jsx` | Authenticated Learner | Central personal study workspace & PrimaryFocus hub |
| `/assessment/baseline` | Workspace (Full) | `BaselineAssessment.jsx`| Authenticated Learner | First Check diagnostic simulation ("Your Digital Day") |
| `/assessment/final` | Workspace (Full) | `FinalAssessment.jsx` | Authenticated Learner | Final Safety Check simulation (Prerequisite: baseline complete) |
| `/quizzes` | Workspace | `Quizzes.jsx` | Authenticated Learner | Statutory knowledge practice, recall drills, history |
| `/workspace/modules` | Workspace | `Modules.jsx` | Authenticated Learner | Published curriculum chapters & lesson reader |
| `/workspace/modules/:slug`| Workspace | `Modules.jsx` | Authenticated Learner | Direct curriculum lesson reading via route parameter |
| `/workspace/modules?slug=…`| Workspace| `Modules.jsx` | Authenticated Learner | Direct curriculum lesson reading via query parameter |
| `/workspace/cases` | Workspace | `Cases.jsx` | Authenticated Learner | Workspace case studies (supports `?slug=...` deep-link) |
| `/workspace/laws` | Workspace | `Laws.jsx` | Authenticated Learner | Workspace statutory reference center |
| `/workspace/crimes` | Workspace | `Crimes.jsx` | Authenticated Learner | Workspace crime categories |
| `/workspace/prevention` | Workspace | `Prevention.jsx` | Authenticated Learner | Workspace prevention guide |
| `/workspace/resources` | Workspace | `Resources.jsx` | Authenticated Learner | Workspace emergency resources |
| `/admin` | Admin Shell | `AdminPanel.jsx` | Authenticated Admin | System administration, metrics, audit logs |

### Intended Future Routing Architecture (Public vs. Authenticated Workspace)
* **Public Unauthenticated Behavior**: Visitors navigating to `/laws`, `/crimes`, `/cases`, `/modules`, `/prevention`, or `/resources` receive the Public Portal Shell (`Navbar` with horizontal public links and standard `Footer`).
* **Authenticated Workspace Canonical Redirection (Future Work)**: In the target architecture, authenticated learners navigating to bare public educational paths (`/laws`, `/crimes`, `/cases`, `/modules`, `/prevention`, `/resources`) must be canonically redirected to their corresponding `/workspace/*` path (`/workspace/laws`, etc.). This preserves the workspace sidebar, orientation breadcrumb, and active learning profile without jarring layout shifts.

---

## 3. Structural Component Ownership

### A. Workspace Shell & Navigation
* **`App.jsx`**: Top-level routing switchboard. Computes `isWorkspace` layout flag, mounts the workspace `Sidebar` on workspace paths, renders `Navbar` across all pages, and wraps code-split pages in `ErrorBoundary` and `Suspense`.
* **`Navbar.jsx`**: Serves dual modes:
  1. *Public Portal Mode*: Horizontal header navigation with links to Laws, Crimes, Cases, Prevention, Resources, and Sign In.
  2. *Workspace Mode*: Topbar displaying portal badge, learner greeting, mobile drawer toggle button, and quick profile controls.
* **`Sidebar.jsx`**: Dedicated desktop collapsible sidebar and mobile off-canvas drawer for authenticated workspace navigation (`Dashboard`, `Modules`, `Quizzes`, `Final Check`, `Case Studies`, `Law Library`).
* **`WorkspaceBreadcrumb.jsx`**: Consistent orientation breadcrumb linking sub-pages back to `/dashboard`.

### B. Assessment & Diagnostic Experiences
* **`BaselineAssessment.jsx`**:
  - Owns the unassessed learner diagnostic entry point.
  - Controls the 13-stage sequential simulation runner.
  - Mounts `DigitalAwarenessProfile.jsx` upon completion or on subsequent visits.
* **`FinalAssessment.jsx`**:
  - Owns the post-remediation adaptive final evaluation.
  - Enforces the server-side baseline prerequisite; displays educational "First Check Required" briefing card if unassessed.
  - Manages branching at Stage 7 (Safe Stage 8A vs Phishing Stage 8B converging at Stage 10).
  - Displays post-assessment comparison results and unlocks habit reinforcement.
* **`DigitalAwarenessProfile.jsx`**:
  - Owns diagnostic interpretation across the 6 behavioral dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
  - Displays statutory grounding adhering to legal status taxonomy (`IN_FORCE`, `ENACTED_FUTURE_COMMENCEMENT`, `STRUCK_DOWN_HISTORICAL`).
  - Identifies DPDP Act provisions (including §§ 6, 8, 11 under G.S.R. 843(E) dated 13 November 2025) as enacted future law, not yet commenced as of 3 November 2026.
  - Mounts `RemediationCards.jsx` in `isPreviewOnly={true}` mode.
  - Features single primary CTA: *"Go to Your Learning Dashboard →"* (`/dashboard`).

### C. Personal Learning Workspace Hub (`Dashboard.jsx`)
* **`Dashboard.jsx`**: Central coordinator of the learner's journey. Fetches authoritative progress, assessment statuses, portfolio data, trajectory, due reviews, and quiz recalls in parallel.
* **`FirstVisitExperience.jsx`**: Dedicated orientation card rendered when `!hasBaseline`. Displays greeting, macro Step 1 badge, "Start First Check →" CTA, and progressive disclosure toggle to expand the full studio.
* **`AtelierMasthead.jsx`**: Displays learner orientation header, 4-pillar ledger (Interventions, Practice, Behavioral Habit, Retention), macro compass badge, and "View Portfolio" CTA.
* **`PrimaryFocus.jsx`**: Primary Study Dossier rendering the deterministic single next action selected by `dashboardJourneySelectors.js`.
* **`CurriculumLessonsSection.jsx`**: Surfaces the 6 core constellation chapters (`digital-identity-foundations`, `phishing-social-engineering`, `upi-qr-payment-fraud`, `passwords-mfa-passkeys`, `digital-evidence-bsa-63`, `it-act-fundamentals`).
* **`TargetedInterventionsPanel.jsx`**: Lists recommended focus pathways with progress badges ("Ready in Dashboard Workspace", "In Progress", "Completed").
* **`DashboardQuizPractice.jsx`**: Surfaces 5 quiz practice modes and missed-concept recall alerts.
* **`RecentActivityStream.jsx`**: Chronological evidence log of completed pathways, quiz attempts, and spaced reviews.
* **`BehavioralEvolution.jsx`**: Visual progression chart tracking the 6 behavioral dimensions across sessions.
* **`DashboardHistory.jsx`**: Archival session history drawer displaying completed baseline, final, and retake records.
* **`DefensivePortfolioModal.jsx`**: Full-screen modal presenting the Verified Defensive Learning Portfolio across three discrete pillars (Interventions, Practice, Trajectory). The portfolio records verified learning activities; it is not an accredited qualification or legal certification.

### D. Interactive Learning Interventions
* **`PathwayRunner.jsx`**: Self-contained modal dialog orchestrating the 3-step structured intervention:
  1. *Step 1: Incident Learning* (`IncidentLearningStep.jsx`): Case study narrative.
  2. *Step 2: Practical Defense* (`PreventionAnchorStep.jsx`): Actionable rule connected to statute.
  3. *Step 3: Learning Checkpoint* (`CheckpointQuizStep.jsx`): Curated 3-question evaluation with server-authoritative scoring ($\ge 67\%$ to pass).
  - Also supports *Reinforcement Review Mode* (`isReinforcementMode={true}`) for post-final habit strengthening.

---

## 4. Primary vs Secondary Actions Across Core Views

| View / State | Primary Action | Secondary Actions |
| :--- | :--- | :--- |
| **New Learner Orientation** (`Dashboard.jsx`) | "Start First Check \u2192" (`/assessment/baseline`) | "Explore complete studio & library \u2193" (Progressive disclosure), Browse Law Library |
| **Active Baseline Simulation** (`BaselineAssessment.jsx`) | "Submit Decision" (advance stage) | Review situation context, independent verification options |
| **Digital Awareness Profile** (`DigitalAwarenessProfile.jsx`) | "Go to Your Learning Dashboard \u2192" (`/dashboard`) | Review statutory explanations, inspect preview pathway cards |
| **Dashboard (Interrupted Pathway)** | "Continue Lesson \u2192" (Reopen `PathwayRunner`) | Read curriculum lessons, practice topic quizzes, view portfolio |
| **Dashboard (Ready for Final)** | "Start Final Check \u2192" (`/assessment/final`) | Review completed pathways, take practice quizzes |
| **Dashboard (Interrupted Final)** | "Resume Final Check (Step X of 5) \u2192" | Complete prior lessons, review portfolio |
| **Dashboard (All Completed)** | "Practice Law Quizzes \u2192" (`/quizzes`) | View Verified Defensive Learning Portfolio, voluntary reassessment retake |
| **Curriculum Reader** (`Modules.jsx`) | "Mark Lesson Completed" / "Review Next Lesson" | Take module knowledge check, navigate related law sections |
| **Quiz Studio** (`Quizzes.jsx`) | "Start Quiz" (selected topic) | Start Missed Concept Recall, view quiz history |

---

## 5. Loading, Error, Empty, and Resumption States

### A. Loading States
* **Page Navigation**: `PageLoadingFallback` in `App.jsx` displays an editorial *"Opening page..."* indicator during lazy chunk loading.
* **Dashboard Data Hydration**: Full-screen desk-space container displays *"Opening your personal learning workspace..."* while parallel APIs resolve.
* **Assessment Stage Transitions**: Programmatic smooth transitions with focus shift to `stageHeadingRef`.

### B. Error States
* **Network Interruption on Dashboard**: If authoritative checks fail, `Dashboard.jsx` displays a dedicated Connection Interruption card with an explicit *"Retry Connection"* button and non-blocking diagnostic notice.
* **Prerequisite Violation on Final Assessment**: If an unassessed user directly hits `/assessment/final`, `FinalAssessment.jsx` gracefully catches `403 PREREQUISITE_NOT_MET` and displays the educational "First Check Required" card.
* **Boundary Error Handling**: Top-level `ErrorBoundary` catches unexpected React lifecycle exceptions and displays a calm editorial recovery screen.

### C. Empty States
* **No Remediation Pathways**: Displays *"No active deficits detected. Your defensive habits are currently well-balanced."*
* **No Quiz History**: Displays *"No quiz attempts recorded yet. Choose a topic below to test your legal knowledge."*
* **No Due Spaced Reviews**: Hides recall alerts and maintains clean workspace orientation.

### D. Resumption States
* **Baseline Simulation**: Automatically re-mounts at `currentStageId` upon page reload.
* **Final Simulation**: Checks backend session expiration; unexpired sessions resume at active stage; expired sessions prompt clean re-initialization.
* **Interrupted Pathway**: `PrimaryFocus` displays exact step reached (Step 1, 2, or 3) and launches `PathwayRunner` directly into that step.

---

## 6. Desktop vs Mobile (375px) Navigation Behavior

* **Desktop ($\ge 1024\text{px}$)**:
  - Collapsible persistent sidebar with icon and text labels.
  - Two-column learning studio grid (`CurriculumLessonsSection` left, `DashboardQuizPractice` right).
  - Atelier Masthead full 4-pillar ledger with horizontal orientation compass.
* **Mobile ($\le 600\text{px}$ / 375px Viewport)**:
  - Sidebar collapses to off-canvas slide-out drawer toggled via the Topbar hamburger button. Drawer automatically closes upon route navigation.
  - Two-column studio stacks vertically into a single cohesive column.
  - PrimaryFocus study dossier adapts buttons to full width with $\ge 44\text{px}$ touch targets.
  - Simulated assessment mockups (email, phone, UPI) scale smoothly within `100%` viewport width with zero horizontal overflow.
