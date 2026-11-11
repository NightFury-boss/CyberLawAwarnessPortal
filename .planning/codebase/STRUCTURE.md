# Codebase Structure & Component Ownership Reference (GSD Planning Reference)

> **Authoritative Specification Pointer**: The definitive system architecture specification resides in [**`docs/architecture/ARCHITECTURE.md`**](../../docs/architecture/ARCHITECTURE.md), and the canonical component ownership baseline resides in [**`.planning/STRUCTURE.md`**](../STRUCTURE.md). This document serves as the internal GSD mapper reference.

---

## 1. Root Directory Layout
```text
cyber-law-portal/
├── .agents/                                # Antigravity rules and skills
├── .planning/                              # GSD planning, architecture, requirements & frozen structural baseline
│   ├── codebase/                           # Evidence-backed codebase maps (CONCERNS.md, CONVENTIONS.md, etc.)
│   ├── DESIGN_IMPROVEMENT_BACKLOG.md       # Deferred post-development visual design & UX backlog
│   ├── PROJECT.md                          # High-level vision and behavioral measurement goals
│   ├── REQUIREMENTS.md                     # Six-metric formula, functional, and canonical journey requirements
│   ├── ROADMAP.md                          # Phase breakdown and milestone status
│   ├── STATE.md                            # Current execution position, health, and verification status
│   └── STRUCTURE.md                        # Canonical component ownership and structural reference
├── client/                                 # React 19 + Vite frontend application
│   ├── src/
│   │   ├── components/                     # UI components, widgets, modals, and assessment mockups
│   │   │   ├── assessment/                 # DigitalAwarenessProfile, score breakdowns, radar charts
│   │   │   ├── auth/                       # SignInForm, SignUpForm
│   │   │   ├── common/                     # ErrorBoundary, EditorialRule, UI buttons
│   │   │   ├── dashboard/                  # AtelierMasthead, PrimaryFocus, CurriculumLessonsSection, etc.
│   │   │   ├── layout/                     # Canonical shell: Navbar.jsx, Sidebar.jsx, Footer.jsx (with facades)
│   │   │   ├── navigation/                 # WorkspaceBreadcrumb, Breadcrumb
│   │   │   ├── scenario/                   # Phone, email, browser, and UPI simulated mockups
│   │   │   ├── PathwayRunner.jsx           # Self-contained 3-step micro-learning intervention modal runner
│   │   │   └── RemediationCards.jsx        # Recommendation cards supporting preview and interactive modes
│   │   ├── context/                        # AuthContext and state providers
│   │   ├── pages/                          # Primary page-level route containers
│   │   ├── services/
│   │   │   └── api.js                      # Centralized backend REST API client
│   │   ├── utils/
│   │   │   ├── dashboardJourneySelectors.js# Deterministic 11-state priority ladder & orientation selector
│   │   │   └── evidenceSelectors.js        # Authoritative recall and portfolio metrics derivations
│   │   ├── App.jsx                         # Main router, route guards, workspace shell layout
│   │   └── main.jsx                        # React root entry point
│   ├── package.json
│   └── vite.config.js                      # Vite build configuration (Reticle removed)
├── deployment/                             # Central deployment architecture and provider hub
├── docs/                                   # Unified documentation hub (Architecture, Deployment, Audits, Research)
├── scripts/                                # 45 operational scripts catalogued in scripts/README.md
├── server/                                 # Express 4 Node.js REST API backend
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

---

## 3. Structural Component Ownership

### A. Workspace Shell & Navigation
* **`App.jsx`**: Top-level routing switchboard. Computes `isWorkspace` layout flag, mounts the workspace `Sidebar` on workspace paths, renders `Navbar` across all pages, and wraps code-split pages in `ErrorBoundary` and `Suspense`.
* **`client/src/components/layout/Navbar.jsx`**: Serves dual modes (Public Portal Mode vs Workspace Mode). Backward-compatible re-export facade maintained at `client/src/components/Navbar.jsx`.
* **`client/src/components/layout/Sidebar.jsx`**: Dedicated desktop collapsible sidebar and mobile off-canvas drawer. Backward-compatible re-export facade maintained at `client/src/components/Sidebar.jsx`.
* **`client/src/components/layout/Footer.jsx`**: Institutional editorial footer. Backward-compatible re-export facade maintained at `client/src/components/Footer.jsx`.
* **`WorkspaceBreadcrumb.jsx`**: Consistent orientation breadcrumb linking sub-pages back to `/dashboard`.
