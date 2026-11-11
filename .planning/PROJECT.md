# Cyber Law Awareness Portal

## What This Is
The **Cyber Law Awareness Portal** is a production-grade educational and diagnostic web application focused on Indian Cyber Law (Information Technology Act 2000, Bharatiya Nyaya Sanhita) and practical cybersecurity hygiene.

It features the novel **"Your Digital Day"** adaptive behavioral assessment: a realistic 13-stage simulation modeled after ordinary everyday digital experiences (e-commerce shipping notices, UPI cashback requests, freelance job inquiries, shared network access, QR codes, emergency transfers).

## Core Value
Provides an objective, criterion-referenced behavioral measurement of individual digital vulnerability and cybersecurity judgment, coupling diagnostic assessment with Indian legal awareness and targeted remediation pathways.

## Requirements
- Six-metric Criterion-Referenced Behavioral Diagnostic Rubric model (`Threat Recognition`, `Signal Identification`, `Verification Behavior`, `Decision Quality`, `False Positive`, `Unreviewed Acceptance`).
- Pre/Post delta reporting with immutable scenario version isolation (historical v1 vs active v2).
- Strict backend-authoritative state machine with CAS atomic concurrency locks against double-click replay attacks.
- Safe, non-intrusive simulated interfaces with zero real credential or financial data collection.

## Core Capabilities
- **Indian Cyber Law Reference Center**: Categorized legal database with simplified explanations, penalties, related sections, and real-world case studies.
- **Adaptive Behavioral Assessment ("Your Digital Day")**:
  - 13-stage realistic daily simulation.
  - Contextual branching at Stage 7 (Safe Path vs Risky Phishing Path).
  - Six-metric Criterion-Referenced Behavioral Diagnostic Rubric evaluation (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
  - Pre/Post delta tracking (Baseline vs Final) with immutable versioning isolation.
- **Admin Command Center**: User progress tracking, analytical metric breakdown, scenario audit logs, and legal content management.
- **AI Legal Assistant**: Context-aware legal helper trained on Indian cyber jurisprudence.
- **Adaptive Learning Pathways**: Three-step pedagogical interventions (Incident Learning, Practical Defense, Server-Authoritative Checkpoint Evaluation) tied directly to assessed behavioral deficits.
- **Counterfactual Scenario Learning**: Educational simulations demonstrating alternative outcomes based on different decisions ("What happens if...?").
- **Digital Rights & Privacy Education**: 18-module curriculum covering personal data, consent, digital rights, copyright, piracy, and malware under DPDP Act 2023.
- **Spaced Retrieval & Long-Term Retention**: Independent recall retention engine tracking knowledge maintenance over time with 8 question formats.
- **Unified Learner Dashboard**: Macro journey coherence uniting assessment, pathways, curriculum, counterfactuals, retention, and the Three-Pillar Verified Defensive Learning Portfolio.
- **Constitutional Atelier Visual Identity**: Restrained, editorial, warm parchment aesthetic with verified 0px horizontal overflow across all viewports and WCAG 2.1 AA accessibility compliance.
- **Public Beta Experience & Feedback (`82e06a2`)**: Homepage Public Beta announcement banner, accessible structured feedback modal, and footer Beta status controls.
- **Staging Infrastructure & Tooling (`17e2e97`)**: Netlify frontend deployment, Render backend deployment (`render.yaml`), fail-closed MongoDB Atlas `cyber_law_staging` initialization (`scripts/initializeStagingDatabase.js`, 651 canonical records across 11 collections), and one-time staging admin provisioning (`scripts/createStagingAdmin.js`).
- **Backend Security Hardening (`33ac6e5`)**: Fail-closed seed guards (no hardcoded fallbacks or remote resets), immediate inactive-account token revocation, strict admin payload allowlists and URL validation, redacted API/DB/audit error logging, `auditService` string-value redaction, and reverse production database protection.

## Architecture & Principles
- **Backend-Authoritative**: Zero scoring calculations or sensitive data inputs exist on the client. Assessment scoring, checkpoint validation, and reinforcement gating are calculated exclusively by the server.
- **Strict Version Isolation**: Historical v1 baseline assessments never cross-pollinate with v2 final assessments.
- **Replay Protection**: Atomic compare-and-swap state transitions prevent double-click race conditions.
- **Safe Simulated Mockups**: Realistic interfaces (browser, email, messaging, phone, UPI) with zero credential capture or transmission.
- **Pedagogical Boundary Enforcement**: Strict separation between Learning Completion, Knowledge Practice, and Observed Behavioral Shifts. No composite scores, gamified XP, or artificial mastery claims.
