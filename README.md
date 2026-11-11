# Cyber Law Awareness Portal

A MERN-stack web application designed to educate citizens about Indian Cyber Law, specifically the Information Technology Act, 2000, cybercrime identification, and safety countermeasures.

Rather than presenting laws purely as static text, this portal implements an interactive Cyber Awareness Assessment Engine that walks users through safe, realistic threat simulations, measures threat recognition responses, and logs learning progress.

---

## Documentation & Architecture Hub

Comprehensive technical specifications, deployment runbooks, quality audits, and legal research packages are organized in the [`docs/`](./docs/README.md) directory:

| Section | Focus Area | Key Documents |
| :--- | :--- | :--- |
| **[Architecture](./docs/architecture/ARCHITECTURE.md)** | System Design & Contracts | [System Architecture](./docs/architecture/ARCHITECTURE.md) • [Conventions](./docs/architecture/CONVENTIONS.md) • [Integrations](./docs/architecture/INTEGRATIONS.md) |
| **[Deployment](./deployment/README.md)** | Infrastructure & Hosting | [Deployment Hub](./deployment/README.md) • [Free-Tier Guide](./docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md) • [Docker/VPS Guide](./docs/deployment/DOCKER_VPS_DEPLOYMENT.md) |
| **[Audits](./docs/audits/DESIGN_AUDIT_REPORT.md)** | Quality & Compliance | [Design Audit](./docs/audits/DESIGN_AUDIT_REPORT.md) • [Pre-Beta Validation](./docs/audits/PRE_BETA_VALIDATION_REPORT.md) • [Audit Archive](./docs/audits/archive/) |
| **[Research](./docs/research/cases-where-justice-fell-short/README.md)** | Statutory Research | [Case Research Master](./docs/research/cases-where-justice-fell-short/CASE_RESEARCH_MASTER.md) • [Judicial Decisions](./docs/research/cases-where-justice-fell-short/PRODUCT_OWNER_DECISIONS.md) |
| **[Scripts](./scripts/README.md)** | Tooling Catalog | [Script Catalog & Operational Guide](./scripts/README.md) |
| **[Roadmap](./.planning/ROADMAP.md)** | Autonomous Planning | [Product Roadmap](./.planning/ROADMAP.md) • [Requirements](./.planning/REQUIREMENTS.md) • [Current State](./.planning/STATE.md) |
| **[Changelog](./docs/CHANGELOG.md)** | History & Milestones | [Project Changelog](./docs/CHANGELOG.md) |

---

## Core Features

1. **Indian Digital Law Learning Centre:**
   * **Plain English Toggles:** Access side-by-side comparative translations of statutory legal texts.
   * **Law Compass:** An interactive situation audit tool mapping real-world scenarios to relevant legal provisions.
   * **Bookmarking & Notes:** Save key sections offline and record study notes locally.

2. **Cyber Incident Archive (Case Studies):**
   * **Investigative Registry:** Real-world incident reconstructions.
   * **Critical Decision Points:** Controlled narrative pauses requiring users to choose actions before the final incident outcome is revealed.
   * **Attacker Vector Analysis:** Graphic ratings illustrating psychological tricks (Urgency, Fear, Authority) and list warnings.

3. **Experiential Learning Loop:**
   * An educational path: **Experience** a mock threat, **Understand** the warning flags, **Learn** the applicable laws, **Practice** with quizzes, and **Improve** performance scores.

4. **Ethical Simulation Design:**
   * Real credentials (passwords, OTP values, credit cards) are never processed or stored by the database. The platform operates within a strict client-side sandbox.

---

## Installation & Setup

### 1. Prerequisites
* Node.js (v18+)
* MongoDB (running locally or via MongoDB Atlas connection string)

### 2. Environment Configuration
Configure environment variables in the backend server directory inside a `.env` file:
* Specify custom parameters for connection ports, JWT signing secrets, database connection URIs, and fallback administrative credentials.
* Reference templates: `server/.env.example` and `client/.env.example`.

### 3. Dependencies Installation
Install dependencies for both frontend and backend modules:
```bash
npm run install:all
```

### 4. Database Seeding
Seed the database with default cybercrime data, laws, quizzes, and scenario workflows:
```bash
npm run seed
```

### 5. Running the Application
Launch both frontend and backend servers concurrently:
```bash
npm run dev
```

---

## Legal Disclaimer & Safety
* **Simulation Safety:** Simulated inputs entered during threat scenarios are discarded instantly in the browser and are never stored.
* **Educational Purpose:** The portal is a student development project designed for safety awareness. The content provided is for educational reference and does not constitute formal legal counsel. Official legal questions should be verified against publications from the Government of India.
