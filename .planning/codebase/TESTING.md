# Testing Architecture & Verification Protocols

## Test Suites & Executables

### 1. Digital Day Production Test Suite
- **File**: `server/tests/digitalDay.test.js`
- **Command**: `node server/tests/digitalDay.test.js`
- **Scope**:
  - Tests A through M validating all 13 interactive stages.
  - Safe Path ($7A \rightarrow 8A$) vs Risky Path ($7B \rightarrow 8B$).
  - Full opportunity matrix normalization.
  - Signal Identification (SI) isolation across Stages 2, 3, 9, 10.
  - False Positive (FP) and Unreviewed Acceptance (UA) penalty tracking and critical mistake logs.
  - Replay attacks and client score injection defense.
  - Scenario graph reference audit via `scenarioIntegrityService.js`.
- **Teardown Contract**: Closes test HTTP server on port 5998, disconnects Mongoose cleanly, and exits naturally with code 0.

### 2. Delta Version Isolation Suite
- **File**: `server/tests/deltaIsolation.test.js`
- **Command**: `node server/tests/deltaIsolation.test.js`
- **Scope**: Asserts that v2 Final Assessment sessions isolate against v2 Baseline sessions and do not pollute historical v1 session deltas.

### 3. Comprehensive Security & State Machine Suite
- **File**: `server/tests/api.test.js`
- **Command**: `node server/tests/api.test.js`
- **Scope**: Standardized error schema, role parameter lockout (`role = 'user'`), endpoint auth guards, quiz answer stripping, CAS replay attack locking, zero-credential storage verification.

### 4. Fixture Validation Suite
- **File**: `server/tests/fixtureValidation.test.js`
- **Command**: `node server/tests/fixtureValidation.test.js`
- **Scope**: 41-assertion truth-table audit across controlled fixtures.

### 5. Scenario Graph Validator
- **File**: `server/utils/verifyScenarios.js`
- **Command**: `node server/utils/verifyScenarios.js`
- **Scope**: Traverses all Scenario, Stage, and Decision references in MongoDB to verify 0 broken edges or orphan nodes.

### 6. Frontend Build Verification
- **Command**: `npm run build --prefix client`
- **Scope**: Vite production bundle compilation, asset chunking, and JSX syntax validation.
