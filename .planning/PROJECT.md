# Cyber Law Awareness Portal

## What This Is
The **Cyber Law Awareness Portal** is a production-grade educational and diagnostic web application focused on Indian Cyber Law (Information Technology Act 2000, Bharatiya Nyaya Sanhita) and practical cybersecurity hygiene.

It features the novel **"Your Digital Day"** adaptive behavioral assessment: a realistic 13-stage simulation modeled after ordinary everyday digital experiences (e-commerce shipping notices, UPI cashback requests, freelance job inquiries, shared network access, QR codes, emergency transfers).

## Core Value
Provides an objective, psychometrically validated behavioral measurement of individual digital vulnerability and cybersecurity judgment, coupling diagnostic assessment with Indian legal awareness and targeted remediation pathways.

## Requirements
- Six-metric psychometric behavioral model (`Threat Recognition`, `Signal Identification`, `Verification Behavior`, `Decision Quality`, `False Positive`, `Unreviewed Acceptance`).
- Pre/Post delta reporting with immutable scenario version isolation (historical v1 vs active v2).
- Strict backend-authoritative state machine with CAS atomic concurrency locks against double-click replay attacks.
- Safe, non-intrusive simulated interfaces with zero real credential or financial data collection.

## Core Capabilities
- **Indian Cyber Law Reference Center**: Categorized legal database with simplified explanations, penalties, related sections, and real-world case studies.
- **Adaptive Behavioral Assessment ("Your Digital Day")**:
  - 13-stage realistic daily simulation.
  - Contextual branching at Stage 7 (Safe Path vs Risky Phishing Path).
  - Six-metric psychometric evaluation (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`).
  - Pre/Post delta tracking (Baseline vs Final) with immutable versioning isolation.
- **Admin Command Center**: User progress tracking, analytical metric breakdown, scenario audit logs, and legal content management.
- **AI Legal Assistant**: Context-aware legal helper trained on Indian cyber jurisprudence.
- **Adaptive Learning Pathways (Phase 4)**: Three-step pedagogical interventions (Incident Learning, Practical Defense, Server-Authoritative Checkpoint Evaluation) tied directly to assessed behavioral deficits.
- **Targeted Habit Reinforcement & Longitudinal Evidence (Phase 5)**: Post-final spaced reinforcement micro-drills, Three-Pillar Defensive Portfolio, and Longitudinal Assessment Trajectory Engine tracking habit retention states.

## Architecture & Principles
- **Backend-Authoritative**: Zero scoring calculations or sensitive data inputs exist on the client. Assessment scoring, checkpoint validation, and reinforcement gating are calculated exclusively by the server.
- **Strict Version Isolation**: Historical v1 baseline assessments never cross-pollinate with v2 final assessments.
- **Replay Protection**: Atomic compare-and-swap state transitions prevent double-click race conditions.
- **Safe Simulated Mockups**: Realistic interfaces (browser, email, messaging, phone, UPI) with zero credential capture or transmission.
- **Pedagogical Boundary Enforcement**: Strict separation between Learning Completion, Knowledge Practice, and Observed Behavioral Shifts. No composite scores, gamified XP, or artificial mastery claims.
