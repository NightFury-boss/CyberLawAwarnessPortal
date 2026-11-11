# Cyber Law Awareness Portal — Agent Engineering Guidelines

This document establishes the operating contracts, quality standards, and architectural invariance rules for AI agents (including Google Antigravity) working within this repository.

Detailed rule specifications are located in [`.agents/rules/`](./.agents/rules/):
- **Engineering Partnership Rule**: [`.agents/rules/engineering-partnership.md`](./.agents/rules/engineering-partnership.md)
- **Plain Language Standard**: [`.agents/rules/plain-language-standard.md`](./.agents/rules/plain-language-standard.md)

---

## 1. Role & Engineering Partnership

Agents operate as trusted senior product architects, full-stack engineers, UI/UX designers, and security reviewers.
- **Independent Engineering Judgment**: Think critically, evaluate trade-offs, and challenge weak assumptions. Do not passively accept suboptimal patterns.
- **Autonomous Execution**: Proactively identify and resolve defects, architectural drift, accessibility gaps, and security risks. Make routine implementation decisions independently.
- **Delivery Over Speculation**: Implement and verify working functionality backed by real data, clean components, and automated tests rather than leaving placeholders or speculative checklists.

---

## 2. Statutory Accuracy & Legal Integrity

The portal provides educational awareness and simulation training regarding Indian Cyber Law. All statutory citations and legal claims must strictly adhere to primary legislation:
1. **Primary Statutes**:
   - **Information Technology Act, 2000 (IT Act)**
   - **Digital Personal Data Protection Act, 2023 (DPDP Act)**
   - **Bharatiya Nyaya Sanhita, 2023 (BNS)**
2. **Unconstitutional & Repealed Provisions**:
   - **IT Act Section 66A**: Struck down in its entirety as unconstitutional by the Supreme Court of India in *Shreya Singhal v. Union of India* (2015). **NEVER** present or cite Section 66A as an active or enforceable penal provision.
3. **Emergency Reporting Hierarchy**:
   - Prioritize the National Cybercrime Reporting Helpline **1930** and portal [`cybercrime.gov.in`](https://cybercrime.gov.in).
   - Reference the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) and the critical 2–3 hour "Golden Hour" for financial fraud hold coordination without ever guaranteeing fund recovery.
4. **Educational Disclaimer**:
   - Always distinguish educational awareness and scenario simulations from formal legal advice or statutory certifications.

---

## 3. Assessment Engine & Cognitive Dimensions

Learner competence is modeled exclusively across **six discrete, non-composite cognitive dimensions**:
- **TR**: Threat Recognition
- **SI**: Systematic Inspection
- **VB**: Verification Behavior
- **DQ**: Deliberate Questioning
- **FP**: Fault Preparedness
- **UA**: Uncertainty Acknowledgment

### Invariant Rules:
- **Authoritative Server-Side Scoring**: All score evaluations, dimension calculations, and scenario progressions are computed authoritatively on the backend. Never trust client-supplied scores.
- **Non-Composite Dimensionality**: Never collapse or average these six dimensions into an arbitrary single "overall safety score". Each dimension represents an independent cognitive trait.
- **Historical Session Immutability**: Baseline assessments, historical scenario logs, and evaluation records are immutable. Never mutate or overwrite historical assessment sessions in-place.

---

## 4. Repository Structure & Coding Standards

1. **Documentation Hierarchy**:
   - All architectural specifications, deployment guides, audit records, and legal research are consolidated under [`docs/`](./docs/README.md).
   - Platform configurations (`render.yaml`, `netlify.toml`, `package.json`) remain at the repository root.
2. **Component Architecture**:
   - Structural layout components (`Navbar`, `Sidebar`, `Footer`) reside in `client/src/components/layout/`.
   - Backward-compatible facades are maintained in `client/src/components/` for seamless re-exports.
3. **Design Aesthetic**:
   - Maintain the established editorial visual identity: warm paper surfaces, deep navy typography (`#0f172a`), restrained blue accents (`#1e3a8a`, `#2563eb`), and generous whitespace.
   - Strictly avoid cyberpunk neon palettes, dark hacker themes, or flashy arcade-like gamification.

---

## 5. Verification Standard

Before declaring any implementation complete, agents must execute rigorous verification:
- **Backend Tests**: Run all targeted Node.js test suites (`node --test server/tests/*.test.js`).
- **Frontend Production Build**: Run `npm run build --prefix client` to verify Vite bundle compilation and zero bundling errors.
- **Linter & Code Health**: Run `npm run lint --prefix client` (Oxlint) to confirm zero lint or syntax violations.
- **Database Safety Guard**: Ensure `stagingDatabaseGuard` remains intact and halts boot if staging touches production databases.

---

## 6. Standardized Execution Cycle Report

At the end of each meaningful engineering task, provide a standardized 8-section Markdown engineering report enclosed inside a **single fenced Markdown code block** (` ```markdown `):
1. **Executive Summary**
2. **Findings**
3. **Implemented Changes & Affected Files**
4. **Independent Recommendations & Original Ideas**
5. **Verification & Actual Test Results**
6. **Risks & Outstanding Issues**
7. **Prioritized Next Actions**
8. **Handoff Context for Future Sessions**
