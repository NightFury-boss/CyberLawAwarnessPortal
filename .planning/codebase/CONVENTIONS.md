# Code Conventions & Project Policies (GSD Planning Reference)

> **Authoritative Specification Pointer**: The definitive, project-wide engineering and editorial conventions reside in [**`docs/architecture/CONVENTIONS.md`**](../../docs/architecture/CONVENTIONS.md). This document serves as the internal GSD agent codebase planning reference.

---

## Golden Rules
1. **Authoritative Backend**: Client applications never compute, store, or submit assessment scores or behavioral metrics. All scoring happens authoritatively on the server via `assessmentScoringService.js`.
2. **Documentation & Planning Hierarchy**:
   - Project specifications, deployment runbooks, and audits reside in [`docs/`](../../docs/README.md).
   - Milestone tracking and roadmap state reside in [`.planning/`](../ROADMAP.md).
   - Platform configurations remain at their required root locations (`render.yaml`, `netlify.toml`, `package.json`).
3. **No Metric or Scoring Mutability**:
   - The six-metric behavioral model (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) and `assessmentScoringService.js` must never be modified without explicit authorization.
4. **Historical Immutability**:
   - Existing published scenarios (e.g. v1) and completed assessment sessions must remain immutable so historical assessment results remain 100% reproducible.

---

## Coding Style & Patterns
- **Backend**:
  - Node.js CommonJS (`require` / `module.exports`).
  - Standardized JSON API responses with `{ success: true, ... }` or `{ success: false, error: { code, message } }`.
  - Clean resource teardown in tests: express server close + `await mongoose.disconnect()`.
- **Frontend**:
  - Functional React components with hooks.
  - Layout components organized under `client/src/components/layout/`.
  - No inline styling overrides that break responsive rules.
  - Proper accessibility focus management on dynamic views (`useRef`, `tabIndex="-1"`, `focus()`, `aria-live="polite"`).
  - Centralized API requests channeled through `client/src/services/api.js`.
