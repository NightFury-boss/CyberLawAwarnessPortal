# Architectural Concerns & Technical Debt

## Current Limitations & Watched Items

1. **Large Frontend Bundle Size**:
   - `npm run build --prefix client` generates an asset chunk `dist/assets/index-*.js` of ~586 kB, which triggers Vite's chunk size warning (> 500 kB).
   - *Recommendation*: Introduce `React.lazy()` dynamic imports for assessment routes and admin dashboards to split the client bundle.

2. **Atlas Network Latency in Standalone Tests**:
   - The test suites run against the live remote MongoDB Atlas cluster. Network round-trips can introduce variance (e.g. 5–15 seconds per suite).
   - *Mitigation*: Connection pooling and proper teardown (`mongoose.disconnect()`) ensure no orphaned sockets or leaks.

3. **Two-File Documentation Policy Adherence**:
   - The user has mandated strict adherence to keeping project summaries and changelogs within `changes/CHANGELOG.md` and `changes/PROJECT_SPEC.md`.
   - *Mitigation*: The `.planning/` directory serves as internal GSD runtime configuration, while `changes/` remains the public human-facing audit trail.

4. **Interactive Phone Affordance Semantics**:
   - The SVG call controls (Decline/Accept) in `BaselineAssessment` and `FinalAssessment` are mapped to the respective stage decision IDs (`hang up` vs `press 9`). If stage copy changes in future seedings, the fuzzy string match in `handlePhoneAction` must be kept aligned.
