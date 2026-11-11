# Cyber Law Awareness Portal — Documentation Hub

Welcome to the definitive documentation index for the Cyber Law Awareness Portal repository.

This directory organizes all architectural specifications, deployment runbooks, quality and security audits, and legal curriculum research packages.

---

## Documentation Directory

### 1. System Architecture & Engineering
Technical contracts, system diagrams, coding conventions, and integration contracts.

| Document | Description | Scope |
| :--- | :--- | :--- |
| [**Architecture Overview**](./architecture/ARCHITECTURE.md) | Dual-engine MERN system architecture, six-dimension scoring model, and telemetry pipelines. | Core System |
| [**Coding Conventions**](./architecture/CONVENTIONS.md) | Style guides, Plain Language legal standards, and architectural invariance rules. | Development |
| [**Service Integrations**](./architecture/INTEGRATIONS.md) | Netlify, Render, and MongoDB Atlas runtime integration specifications. | Infrastructure |

---

### 2. Deployment Runbooks & Infrastructure
Production and staging hosting, environment checklists, container orchestration, and platform setup. See also the repository [**Deployment Hub**](../deployment/README.md).

| Document | Target Platform | Description |
| :--- | :--- | :--- |
| [**Deployment Documentation Index**](./deployment/README.md) | **Cross-Platform Index** | Directory index for staging runbooks and production deployment guides. |
| [**Free-Tier Staging Deployment Guide**](./deployment/FREE_TIER_DEPLOYMENT_GUIDE.md) | **Netlify + Render + MongoDB Atlas** | Definitive 10-step zero-cost staging runbook, cold-start handling, and CORS synchronization. |
| [**Docker & VPS Deployment Guide**](./deployment/DOCKER_VPS_DEPLOYMENT.md) | **Docker Compose / VPS / Nginx** | Production container orchestration, reverse proxy configuration, and multi-tenant hosting. |

---

### 3. Audits & Validation Reports
Quality gates, design reviews, accessibility evaluations, and release validation.

| Document | Category | Status / Scope |
| :--- | :--- | :--- |
| [**Design Audit Report**](./audits/DESIGN_AUDIT_REPORT.md) | Design & Accessibility | Visual hierarchy, typography, mobile responsiveness, and WCAG contrast audit. |
| [**Pre-Beta Validation Report**](./audits/PRE_BETA_VALIDATION_REPORT.md) | Release Validation | 26-point cross-viewport verification across 7 public routes and authenticated workspaces. |

#### Milestone Audit Archive
Superseded milestone preparation and gate records preserved for historical traceability:
* [**Free-Tier Deployment Preparation Report**](./audits/archive/FREE_TIER_DEPLOYMENT_PREPARATION_REPORT.md): 12-point infrastructure readiness evaluation.
* [**Final Staging Deployment Gate**](./audits/archive/FINAL_STAGING_DEPLOYMENT_GATE.md): Pre-deployment smoke test verification and risk assessment.
* [**Staging Deployment Readiness Review**](./audits/archive/STAGING_DEPLOYMENT_READINESS.md): Security and configuration readiness review.
* [**Staging Deployment Safety Review**](./audits/archive/STAGING_DEPLOYMENT_SAFETY_REVIEW.md): Fail-closed staging guard and network access review.
* [**Staging Safety Findings Resolution**](./audits/archive/STAGING_SAFETY_FINDINGS_RESOLUTION.md): Remediation log for database isolation findings.

---

### 4. Legal & Curriculum Research Packages
Authoritative statutory analysis, judicial precedents, and curriculum design.

* [**Cases Where Justice Fell Short (Phase 2 Research Package)**](./research/cases-where-justice-fell-short/README.md):
  - [**Case Research Master**](./research/cases-where-justice-fell-short/CASE_RESEARCH_MASTER.md): Verified judicial records and statutory gaps.
  - [**Product Owner Decisions**](./research/cases-where-justice-fell-short/PRODUCT_OWNER_DECISIONS.md): Editorial authority for 10 landmark cases.
  - [**Source Register**](./research/cases-where-justice-fell-short/SOURCE_REGISTER.md): Primary-source citations from Supreme Court and High Courts.
  - [**Implementation Guardrails**](./research/cases-where-justice-fell-short/IMPLEMENTATION_GUARDRAILS.md): Engineering workflow rules and frozen boundaries.
  - [**Phase 2 Content Specification**](./research/cases-where-justice-fell-short/PHASE_2_CONTENT_SPEC.md): Narrative 6-part editorial structure.

---

### 5. Autonomous Agent Planning & Roadmap
Internal roadmap, active execution state, and autonomous planning artifacts are tracked in the [`.planning/`](../.planning/) workspace:
* [**Product Roadmap**](../.planning/ROADMAP.md): Milestone progress and active delivery stages.
* [**Project Requirements**](../.planning/REQUIREMENTS.md): Technical requirements and pedagogical specifications.
* [**Current State & Phase Verification**](../.planning/STATE.md): Current sprint state, recent test metrics, and checkpoint history.

---

### 6. Historical Releases & Changelog
Comprehensive ledger of architectural upgrades, security hardening, and repository milestones:
* [**Project Changelog**](./CHANGELOG.md): Chronicle of milestones, security remediations, and baseline features.
