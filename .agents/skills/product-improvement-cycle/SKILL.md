---
name: product-improvement-cycle
description: Autonomous end-to-end product improvement cycle for the Cyber Law Awareness Portal. Use when conducting a broad product-maturity pass, quality audit, feature completion, or systematic verification and hardening cycle across the application.
---

# Product Improvement Cycle

A systematic, autonomous procedure for advancing the Cyber Law Awareness Portal to a polished, reliable, robust, and complete state.

## When to Use

Activate this skill when requested to:
- Conduct an autonomous product maturity or improvement initiative.
- Audit and repair critical areas across public portal, learner workspace, assessments, quizzes, or admin panel.
- Execute systematic quality hardening, statutory verification, and automated testing passes.
- Proactively discover and deliver high-value product improvements.

## 9-Step Improvement Workflow

1. **Inspect Documentation & Real Codebase State**:
   - Compare product vision and architectural commitments against actual code in `client/` and `server/`.
   - Review active database models, backend controllers, client components, and automated test suites.
   - Avoid repeating documented analysis; establish the true baseline of what works, what is incomplete, and what requires verification.

2. **Identify Highest-Value Problem or Opportunity**:
   - Determine priorities based on learner trust, legal correctness, data integrity, user experience, and administrative operability.
   - Scope covers all application areas:
     - Public portal & information architecture (editorial clarity, accessible search, Indian cyber statutes).
     - Crisis response & emergency guidance (1930 helpline, CFCFRMS Golden Hour, evidence preservation).
     - Learner workspace & Three-Pillar Defensive Portfolio.
     - Scenario branching, 6 behavioral psychometric dimensions, and assessment integrity.
     - Knowledge practice & Interactive Quiz Centre (Bloom's taxonomy, question banks, explanations).
     - Administration console (role separation, audit history logs, scenario engine management).
     - Legal accuracy (IT Act 2000, DPDP Act 2023, BNS 2023) and plain-language guidance.
     - Security, accessibility (ARIA, focus management, WCAG contrast), responsive behavior, and performance.

3. **Form an Independent Approach**:
   - Act as a senior full-stack engineer and product architect.
   - Challenge weak assumptions and avoid superficial redesigns or generic SaaS patterns.
   - Formulate a clear, evidence-based strategy before editing files.

4. **Evaluate Trade-Offs**:
   - Weigh maintainability, performance, security, and accessibility.
   - Preserve our editorial, warm, restrained design identity (zero cyberpunk, neon, or flashy gamification).
   - Protect established architectural guarantees (authoritative server-side scoring, discrete 6 dimensions, version isolation).

5. **Implement the Improvement**:
   - Deliver real, working code across frontend, backend, routes, models, and styles as required.
   - Avoid minimum viable placeholders or unverified stubs.
   - Handle loading, empty, error, and success states thoughtfully.

6. **Run Authoritative Verification**:
   - Execute all relevant verification suites:
     - Frontend compilation: `npm run build` in `client`.
     - Automated security & state machines: `node server/tests/api.test.js`.
     - Admin quiz & scenario engine: `node server/tests/adminQuizScenario.test.js`.
     - Admin audit panel: `node server/tests/adminAudit.test.js`.
     - Question bank completeness: `node server/tests/quizCompleteness.test.js`.
     - Three-Pillar Defensive Portfolio: `node server/tests/phase5ReinforcementAndPortfolio.test.js`.
     - Remediation engine & statutory accuracy: `node server/tests/remediationEngine.test.js`.
   - Verify keyboard navigation, accessibility, and responsive layouts.

7. **Correct Defects Immediately**:
   - If verification uncovers errors, regressions, or edge cases, diagnose and fix them directly before proceeding.

8. **Enforce Stop Condition & Scope Boundary**:
   - Conclude work when the current cycle objectives and verification gates are satisfied.
   - Do not automatically chain into subsequent unprompted improvement cycles or spawn background tasks.
   - Outline the most impactful future actions for explicit user prioritization in the handoff.

9. **Deliver Standardized Engineering Report**:
   - Conclude each cycle by generating the complete, copyable Markdown report inside a single fenced code block as mandated by the permanent rule in `.agents/rules/engineering-partnership.md`.
