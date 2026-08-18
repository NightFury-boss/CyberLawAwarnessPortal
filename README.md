# Cyber Law Awareness Portal

A production-quality MERN-stack academic web application designed to educate citizens about Indian Cyber Law, specifically the **Information Technology Act, 2000**, cybercrime identification, and safety countermeasures.

Rather than presenting laws purely as static text, this portal implements a secure **Cyber Awareness Assessment Engine** that walks users through safe, realistic threat simulations, measures their reactions, identifies vulnerabilities, and tracks awareness improvement.

---

## 🚀 Technical Architecture

The application is built using the standard MERN stack with strict security isolation:

```text
React (Vite)  ↔  Node.js (Express)  ↔  Mongoose  ↔  MongoDB (Local / Atlas)
```

### Key Security & Design Principles
1. **Mongoose Database Layer:** Leverages MongoDB document schemas for concurrent assessment attempts, admin logs, and legal sources.
2. **Backend-Authoritative Scoring:** The client cannot submit final scores. It submits step-by-step decision identifiers `(sessionId, stageId, decisionId)`. The server validates the session owner, checks the active sequence, adjusts weighted category metrics, determines the next adaptive stage, and computes the report.
3. **Zero Credential Retention:** Simulated password fields are processed purely in-browser and immediately discarded. The database only records `credentialSubmissionAttempted: true`. No sensitive inputs (OTP, UPI PIN, passwords) are ever saved.
4. **Section 66A Isolation:** Section 66A of the IT Act is visually and programmatically marked as **OMITTED** (declared unconstitutional in Shreya Singhal v. Union of India, 2015) to prevent misleading students.
5. **Admin Audit Trails:** All database CRUD operations performed in the admin workspace are logged to an audit trail collection (`AdminAuditLog`).

---

## 🔧 Installation & Setup

### 1. Prerequisites
* **Node.js (v18+)**
* **MongoDB** (A local database running on `localhost:27017` or a MongoDB Atlas connection string)

### 2. Environment Configuration
Create a `.env` file in the `server/` directory:
```env
PORT=5000
JWT_SECRET=academic_project_cyber_security_secret_portal_key_552109
MONGODB_URI=mongodb://localhost:27017/cyber_law_portal
ADMIN_EMAIL=admin@cyberlawportal.test
ADMIN_PASSWORD=AdminPass123!
```

### 3. Dependencies Installation
Open your terminal in the project root directory and run:
```bash
npm run install:all
```
This helper script installs node modules for the root orchestrator, frontend client, and Express server.

### 4. Database Seeding
Seed the MongoDB database with official Central Acts, unconstitutional omits, case studies, quizzes, and simulation scenario trees:
```bash
npm run seed
```
This drops existing collections and seeds standard development accounts:
* **Admin Account:** `admin@cyberlawportal.test` / `AdminPass123!` (or custom credentials configured in `.env`).
* **Demo User:** `user@example.com` / `UserPass123!`

---

## 🏃 Running the Application

Start both development servers concurrently:
```bash
npm run dev
```
Once booted:
* **Frontend Web App:** Available at [http://localhost:5173/](http://localhost:5173/)
* **Express API Server:** Running at [http://localhost:5000/](http://localhost:5000/)

---

## 🧪 Verification & Automated Testing

Verify the application's integrity, authentication middleware, security isolation, and scoring delta by running the automated test suite:
```bash
npm run test
```
This runs [api.test.js](file:///C:/Users/Asus/.gemini/antigravity-ide/scratch/cyber-law-portal/server/tests/api.test.js) which:
1. Validates MongoDB connection and model constraints.
2. Checks that standard registrations cannot inject administrative roles.
3. Tests role-based authorization guards on `/api/admin/audit-logs`.
4. Asserts that the assessment engine rejects client-side score overrides and blocks step replay attacks.
5. Asserts that mock credentials typed during simulations are excluded from database logs.

---

## 📂 Project Organization

```
cyber-law-portal/
├── client/                  # Vite + React Frontend
│   ├── src/
│   │   ├── components/      # Navigation headers, footer helpline guides, chatbot widget
│   │   ├── pages/           # Home, Laws, Crimes, Cases, Dashboard, AdminPanel, Assessments
│   │   ├── services/        # Centralized HTTP request client (api.js)
│   │   └── styles/          # Custom Design System CSS (main.css)
│   └── package.json
│
├── server/                  # Node.js + Express Backend
│   ├── config/              # MongoDB connection hook (db.js) and database seeder (seed.js)
│   ├── controllers/         # Business logic (auth, laws, quizzes, simulation engine, admin audit)
│   ├── middleware/          # JWT decodes and role authorization guards (authMiddleware.js)
│   ├── models/              # Mongoose data models (User, LawSection, AssessmentSession, Scenario)
│   ├── routes/              # Express API endpoint declarations
│   ├── tests/               # Automated test scripts (api.test.js)
│   └── package.json
│
├── package.json             # Root monorepo orchestration using concurrently
├── .gitignore               # Isolates environment configs and packages from repository
└── README.md
```

---

## 🎓 Viva Demonstration Walkthrough

Use this sequence to demonstrate the portal features during evaluations:

1. **Public Registration:** Create a student profile. An automatic badge `"First Step"` is awarded.
2. **Dashboard Restriction:** Notice that the Student Dashboard recommends completing the baseline test first.
3. **Baseline Simulation:** Start the "Cyber Security Baseline". Experience a mock security alert email. Click the verification link to open a mock unsecure HTTP login form. Submit credentials.
4. **Immediate Reveal Screen:** Review missed warning signs (fake domain suffix, artificial urgency, unencrypted HTTP connection). Observe your score (e.g. 40/100) and Level.
5. **Personalized Recommendations:** Return to the dashboard. The recommendation cards suggest visiting **Phishing** and **Safe Browsing** modules.
6. **Information Database:** Explore the **Cyber Laws** page (observe Section 66A marked as omitted with Shreya Singhal case history) and the **Cybercrime** warning signs page.
7. **Quiz Challenges:** Take the Phishing Prevention quiz. Scoring 100% awards the `"Scam Spotter"` badge.
8. **Final branching Simulation:** Begin the Final Assessment **"A Day in Your Digital Life"** (Morning ZIP attachment recruiter NDA, Afternoon browser patch notification, Evening concert QR code checkout).
9. **Outcome Progress:** Complete the branching assessment. The final report calculates your improvement delta (e.g., `+45 points`) compared to your baseline.
10. **Admin Portal:** Log in using `admin@cyberlawportal.test` / `AdminPass123!`. Access the admin controls to view total students, average baseline/final scores, weakest learning areas, and the **Admin Audit Trail** tracking database modifications.
11. **Keyword Retrieval Assistant:** Ask the floating widget *"What is Section 66C?"* to review the local keyword matching engine returning grounded legal answers.

---

## ⚖️ Legal Disclaimer & Safety
* **Sensitive Inputs:** Simulated passwords, PINs, or OTPs typed during assessments are discarded instantly and **never** written to database files.
* **Educational Purpose Only:** This platform is an educational resource. Information provided does not constitute formal legal counsel. For official legal status, reference government legislative publications.
