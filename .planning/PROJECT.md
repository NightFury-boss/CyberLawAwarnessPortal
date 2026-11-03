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
- **Counterfactual Scenario Learning (Stage 3 / Original Phase 4)**: Educational simulations demonstrating alternative outcomes based on different decisions.
- **Digital Rights & Privacy Education (Stage 4 / Original Phase 5)**: Comprehensive curriculum covering personal data, consent, digital rights, copyright, piracy, and malware.
- **Spaced Retrieval & Long-Term Retention (Stage 5 / RT-1..4)**: Independent recall retention engine tracking knowledge maintenance over time.
- **Dashboard Integration & Refinement (Stage 6 / Original Phase 6)**: Macro journey coherence uniting assessment, pathways, curriculum, counterfactuals, and retention.
- **Post-Development Design Improvement (Separate Deferred Workstream)**: Dedicated backlog in `.planning/DESIGN_IMPROVEMENT_BACKLOG.md` for visual, editorial, and layout refinement following foundation completion.

## Architecture & Principles
- **Backend-Authoritative**: Zero scoring calculations or sensitive data inputs exist on the client. Assessment scoring, checkpoint validation, and reinforcement gating are calculated exclusively by the server.
- **Strict Version Isolation**: Historical v1 baseline assessments never cross-pollinate with v2 final assessments.
- **Replay Protection**: Atomic compare-and-swap state transitions prevent double-click race conditions.
- **Safe Simulated Mockups**: Realistic interfaces (browser, email, messaging, phone, UPI) with zero credential capture or transmission.
- **Pedagogical Boundary Enforcement**: Strict separation between Learning Completion, Knowledge Practice, and Observed Behavioral Shifts. No composite scores, gamified XP, or artificial mastery claims.
