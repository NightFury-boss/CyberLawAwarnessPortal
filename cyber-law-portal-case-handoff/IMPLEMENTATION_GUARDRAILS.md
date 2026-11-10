# Implementation Guardrails — Case Collection Handoff

**Current state:** Read-only research handoff  
**Implementation authorization:** Editorially approved research package; engineering discovery only  
**Product Owner:** User  
**Engineering environment:** Antigravity  
**Repository:** `NightFury-boss/CyberLawAwarnessPortal`

## 1. First task: read-only audit

Before proposing changes, inspect the actual current repository state. Do not rely on historical documentation alone.

Record:
- current branch and HEAD;
- working-tree status;
- repository structure;
- existing CaseStudy Mongoose schema and indexes;
- case-study seed records and their current contents;
- API routes, controllers and response shapes serving cases;
- `client/src/pages/Cases.jsx` and relevant child components;
- existing collection / category / slug filtering behavior;
- test suites covering case records, API behavior and seed idempotency;
- any published data already stored in MongoDB or represented in seed files.

Do not connect to or mutate production databases during this audit. If local environment configuration points to a remote database, do not run seed commands or write operations.

## 2. Required audit output

Antigravity must return a proposal containing:

1. **Current-state summary:** what already exists and how the case archive works.
2. **Gap analysis:** which approved editorial requirements are not currently representable or displayed.
3. **Reuse analysis:** which existing fields, components and APIs can be reused.
4. **Proposed changes:** exact files and exact purpose of each change.
5. **Data plan:** mapping of the ten approved cases to existing fields; identify any proposed schema additions separately.
6. **Migration / seed plan:** idempotency, compatibility, backup and rollback approach.
7. **Test plan:** unit, API, integration, seed integrity, accessibility and regression tests.
8. **Risk register:** legal-content drift, source-link rot, stale case status, privacy, API compatibility and historical-data integrity.
9. **Out-of-scope confirmation:** explicitly list what will not be touched.
10. **Approval request:** stop and wait for explicit Product Owner authorization.

## 3. Protected boundaries

### Assessment and learner journey
- Do not modify `assessmentScoringService.js`.
- Do not modify six-metric definitions: TR, SI, VB, DQ, FP, UA.
- Do not change `AssessmentSession`, scenario traversal, CAS/idempotency behavior, scoring, remediation or assessment history.
- Do not modify the frozen six-state learner journey, prerequisite enforcement or historical assessment records.
- Do not alter published v1 scenarios or historical scenario versions.

### Existing code and data
- Do not modify schema, seed data, API endpoints, routes or UI before separate approval.
- Do not run destructive seed modes, database resets or production writes.
- Do not change authentication, RBAC, JWT or environment configuration.
- Do not add a dependency without justification and approval.
- Do not commit, push, merge or deploy.

### Visual design
- Broad visual redesign remains deferred until canonical Stages 1–6 are complete and verified, per `ROADMAP.md`.
- Any minimal presentation work necessary for case content must be proposed separately and must respect existing structural freeze and design backlog.

## 4. Roadmap and phase-numbering protection

The canonical `ROADMAP.md` says Stage 2 — Assessment Quality & Reliability is current, with AQ-3 awaiting explicit authorization. The case collection content workstream is separate. Do not interpret “Phase 2 content spec” as approval to start canonical Stage 2, AQ-3, or any roadmap stage.

Antigravity must reconcile its proposed sequencing with the current canonical roadmap and `STATE.md`, not historical handoff snapshots.

## 5. Legal and editorial controls

- Use `CASE_RESEARCH_MASTER.md`, `PRODUCT_OWNER_DECISIONS.md` and `SOURCE_REGISTER.md` as the editorial baseline.
- Preserve every case-specific caveat.
- Never upgrade an allegation, ED submission, police affidavit, provisional attachment, cause-list entry or secondary report into a final judicial finding.
- Do not invent missing source URLs, case outcomes, death counts, attribution, data exfiltration or technical details.
- Maintain historical law for historical conduct and separately explain current law.
- Keep source dates, cut-off dates and statistical definitions visible.
- Case 03: no unverified aggregate death count; Smartcoin/Krazybee are petitioner-specific; 2026 Tribunal order is attachment-related, not criminal conviction.
- Case 07: do not claim current final disposal status without a verified current order.
- Case 09: saved / held / lien-marked is not refunded; exclude unverified UQ 2577 attribution.
- Case 10: distinguish administrative IT from isolated plant-control systems.

## 6. Documentation conventions

Follow `CONVENTIONS.md`:
- In the repository's `changes/` directory, only maintain `changes/CHANGELOG.md` and `changes/PROJECT_SPEC.md`.
- Do not create temporary reports inside `changes/`.
- Any approved documentation updates must follow the project's existing conventions and be scoped to the relevant canonical documents.

The handoff files are external planning artifacts and are not permission to copy them into arbitrary repository directories.

## 7. Test and verification expectations after future approval

The implementation proposal should include tests appropriate to the actual design, including:
- legacy case archive API response compatibility;
- case slug and collection filtering;
- schema validation and required-field behavior;
- seed idempotency and no duplicate case records;
- preservation of existing published cases;
- legal-source link and metadata validation where practical;
- frontend rendering for all ten cases;
- responsive and keyboard accessibility;
- regression tests for existing cases, routes and navigation.

Do not run tests that write to a remote database without explicit approval and a confirmed safe test environment.

## 8. Acceptance gates

| Gate | Required evidence | Authorization |
|---|---|---|
| A. Read-only audit | Current-state report and exact file map | Already authorized |
| B. Implementation proposal | Scope, schema mapping, migration, tests, risks, rollback | Already authorized |
| C. Implementation | Separate explicit Product Owner approval | Not yet authorized |
| D. Validation | Test results and regression report | After implementation approval |
| E. Acceptance | Product Owner review of results and remaining risks | Required before next stage |

**Stop condition:** After Gate B, do not modify files until the user explicitly authorizes implementation.
