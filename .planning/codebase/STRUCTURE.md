# Codebase Structure & Directory Layout

## Root Directory
```text
cyber-law-portal/
├── .planning/                  # GSD planning, architecture, and roadmap documents
│   ├── codebase/               # Evidence-backed codebase maps
│   └── onboarding/             # Onboarding summary and guides
├── changes/                    # Strict two-file tracking convention
│   ├── CHANGELOG.md            # Comprehensive chronological change log
│   └── PROJECT_SPEC.md         # Canonical project architecture and metric specification
├── client/                     # React + Vite frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI widgets, Navbar, Scenario Mockups
│   │   ├── context/            # AuthContext and state providers
│   │   ├── pages/              # BaselineAssessment, FinalAssessment, Dashboard, etc.
│   │   ├── services/           # api.js centralized backend REST client
│   │   ├── styles/             # main.css and component stylesheets
│   │   └── App.jsx             # Route definitions and application shell
│   ├── package.json
│   └── vite.config.js
├── server/                     # Express 4 Node.js backend
│   ├── config/                 # db.js (Mongoose connection) and seed.js
│   ├── controllers/            # authController, simulationController, etc.
│   ├── middleware/             # authMiddleware (JWT protect & admin guard)
│   ├── models/                 # User, Scenario, ScenarioStage, ScenarioDecision, AssessmentSession
│   ├── routes/                 # simulations.js, auth.js, laws.js, quizzes.js
│   ├── services/               # assessmentScoringService.js, scenarioIntegrityService.js
│   ├── tests/                  # digitalDay.test.js, deltaIsolation.test.js, api.test.js
│   ├── utils/                  # verifyScenarios.js graph validator
│   ├── package.json
│   └── server.js               # Express application entry point
├── package.json                # Root concurrently workspace scripts
└── README.md
```

## Key Files & Entry Points
- **Backend Entry**: `server/server.js` (Express app on port 5000)
- **Frontend Entry**: `client/src/main.jsx` and `client/src/App.jsx` (Vite dev on port 5173)
- **Primary Database Connector**: `server/config/db.js`
- **Authoritative Scorer**: `server/services/assessmentScoringService.js`
- **Assessment Simulation Controller**: `server/controllers/simulationController.js`
- **Client REST Layer**: `client/src/services/api.js`
