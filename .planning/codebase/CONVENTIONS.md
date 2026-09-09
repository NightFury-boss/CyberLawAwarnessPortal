# Code Conventions & Project Policies

## Golden Rules
1. **Authoritative Backend**: Client applications never compute, store, or submit assessment scores or behavioral metrics. All scoring happens authoritatively on the server via `assessmentScoringService.js`.
2. **Strict Two-File Documentation Invariant**:
   - Only maintain two markdown files in `changes/`:
     1. `changes/CHANGELOG.md`
     2. `changes/PROJECT_SPEC.md`
   - Never create extraneous, temporary reports inside `changes/`.
3. **No Metric or Scoring Mutability**:
   - The six-metric behavioral model (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) and `assessmentScoringService.js` must never be modified without explicit authorization.
4. **Historical Immutability**:
   - Existing published scenarios (e.g. v1) must remain immutable so historical assessment results remain 100% reproducible.

## Coding Style
- **Backend**:
  - Node.js CommonJS (`require` / `module.exports`).
  - Standardized JSON API responses with `{ success: true, ... }` or `{ success: false, error: { code, message } }`.
  - Clean resource teardown in tests: express server close + `await mongoose.disconnect()`.
- **Frontend**:
  - Functional React components with hooks.
  - No inline styling overrides that break responsive rules.
  - Proper accessibility focus management on dynamic views (`useRef`, `tabIndex="-1"`, `focus()`, `aria-live="polite"`).
  - Centralized API requests channeled through `client/src/services/api.js`.
