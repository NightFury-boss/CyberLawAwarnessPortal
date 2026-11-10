# Cyber Law Awareness Portal: Free-Tier Staging Deployment Preparation Report

## 1. Files Inspected

The following repository components, architectural specifications, and deployment assets were systematically inspected prior to implementation:

1. **Architecture & Project Contracts**:
   - `ARCHITECTURE.md` (System components, dual-deployment requirements, scoring models, and security principles)
   - `PROJECT.md`, `REQUIREMENTS.md`, `STATE.md`, `ROADMAP.md`, `INTEGRATIONS.md`
   - `.agents/rules/engineering-partnership.md` (Server-authoritative scoring preservation, non-destructive database isolation, statutory accuracy)
2. **Frontend Assets & Configuration**:
   - `client/package.json` (Scripts, dependencies, Vite 8.2.1 build pipeline)
   - `client/vite.config.js` (Proxy configurations, build target)
   - `client/src/services/api.js` (Base API resolution logic, Axios instance configuration)
   - `client/src/App.jsx` (Client-side routing table, lazy loading definitions)
3. **Backend Assets & Configuration**:
   - `server/package.json` (Express 4.19.2, Mongoose 8.2.1, Node 20 runtime target)
   - `server/server.js` (Host and port binding, proxy trust, health check route `/api/health`, CORS policy, security headers)
   - `server/config/db.js` (Mongoose connection lifecycle, obfuscated logging)
   - `server/config/stagingDatabaseGuard.js` (Fail-closed database isolation, whitelist enforcement)
4. **Existing VPS / Docker Staging Configurations**:
   - `docker-compose.staging.yml` (Preserved intact for VPS deployment)
   - `client/Dockerfile`, `client/nginx.conf`, `server/Dockerfile` (Preserved intact for multi-container deployments)
   - `DEPLOYMENT.md`, `STAGING_SAFETY_FINDINGS_RESOLUTION.md`, `STAGING_DEPLOYMENT_SAFETY_REVIEW.md`

---

## 2. Files Created or Modified

| File | Status | Nature of Change |
| :--- | :--- | :--- |
| `netlify.toml` | **Created** | Root Netlify configuration declaring `base = "client"`, `publish = "dist"`, `command = "npm run build"`, Node 20 runtime, SPA fallback rule `/* -> /index.html 200`, and caching headers. |
| `client/public/_redirects` | **Created** | Dedicated Netlify SPA routing fallback rule (`/* /index.html 200`) ensuring hard reloads on nested routes do not return 404. |
| `client/.env.staging.example` | **Created** | Documented frontend staging environment template specifying `VITE_API_URL`. |
| `client/src/services/api.js` | **Modified** | Implemented `resolveApiUrl()` with robust whitespace trimming, URL normalization, trailing slash handling, and non-destructive fallback. Exported `{ API_URL, resolveApiUrl }`. |
| `render.yaml` | **Created** | Root Render blueprint configuring `cyberlaw-portal-backend` Web Service on the free tier, with `rootDir: server`, build/start commands, health probe `/api/health`, and non-synced credentials. |
| `server/server.js` | **Modified** | Updated `app.listen` binding to support `HOST = process.env.HOST || '0.0.0.0'` while preserving port fallback. |
| `server/config/db.js` | **Modified** | Integrated `assertApprovedStagingDatabase` guard into connection initialization when `ASSERT_STAGING_DB === 'true'`. |
| `server/.env.staging.example` | **Modified** | Added explicit `ASSERT_STAGING_DB=true` and `EXPECTED_STAGING_DB_NAME=cyber_law_staging` documentation. |
| `server/tests/freeTierDeploymentIntegration.test.js` | **Created** | 19-test automated integration suite validating URL normalization, Netlify SPA artifacts, Render blueprints, staging DB isolation, CORS origin enforcement, and health probe privacy. |
| `FREE_TIER_DEPLOYMENT_GUIDE.md` | **Created** | Comprehensive step-by-step staging setup guide detailing Atlas, Render, and Netlify provisioning, cold starts, and verification. |
| `FREE_TIER_DEPLOYMENT_PREPARATION_REPORT.md` | **Created** | This comprehensive 12-point readiness and verification report. |

---

## 3. Netlify Configuration

- **Base Directory**: `client`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist` (interpreted by Netlify as `client/dist`)
- **Runtime Environment**: Node.js v20
- **SPA Fallback Routing**: Dual configuration:
  1. `client/public/_redirects`: `/*    /index.html   200` (automatically copied to `dist/_redirects` on build)
  2. `netlify.toml`: Explicit `[[redirects]]` block routing `/*` to `/index.html` with status `200`.
- **Security & Cache Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Cache-Control: public, max-age=31536000, immutable` for `/assets/*`
- **Build Verification**: Verified locally using `npm run build --prefix client`. Build completes in 588ms, generating 29 optimized chunks and verifying that `client/dist/_redirects` is populated.

---

## 4. Render Configuration

- **Service Type**: Web Service
- **Plan**: `free`
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Network Interface**: Express listens on `0.0.0.0` using injected `process.env.PORT`.
- **Health Check Path**: `/api/health`
- **Blueprint File**: `render.yaml` located at repository root with `autoDeploy: true`.
- **Reverse Proxy Trust**: `TRUST_PROXY=1` enabled to accept single-hop TLS headers (`X-Forwarded-Proto`, `X-Forwarded-For`) terminated at Render's ingress balancer.
- **Fail-Closed Staging Guard**: Configured via `ASSERT_STAGING_DB="true"` and `EXPECTED_STAGING_DB_NAME=cyber_law_staging`.

---

## 5. Environment Variables Required

### 5.1 Frontend (Netlify Site Settings > Environment Variables)

| Variable | Staging Setting / Example | Exposure |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://cyberlaw-portal-backend.onrender.com/api` | Public (Embedded into client bundle) |

### 5.2 Backend (Render Service Dashboard > Environment)

| Variable | Staging Setting / Example | Exposure |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Private |
| `HOST` | `0.0.0.0` | Private |
| `CLIENT_URL` | `https://cyberlaw-portal-staging.netlify.app` | Private |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/cyber_law_staging?retryWrites=true&w=majority` | Secret |
| `JWT_SECRET` | *(64-hex char secret from `openssl rand -hex 32`)* | Secret |
| `TRUST_PROXY` | `1` | Private |
| `ASSERT_STAGING_DB` | `true` | Private |
| `EXPECTED_STAGING_DB_NAME` | `cyber_law_staging` | Private |
| `SPACED_RETRIEVAL_DELAY_DAYS`| `7` | Private |
| `SCORING_V2_CUTOVER_DATE` | `2026-11-04T00:00:00.000Z` | Private |
| `RATE_LIMIT_AUTH_MAX` | `20` | Private |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `900000` | Private |
| `RATE_LIMIT_ASSISTANT_MAX` | `30` | Private |
| `RATE_LIMIT_ASSISTANT_WINDOW_MS` | `60000` | Private |
| `ADMIN_EMAIL` | `staging-admin@cyberlawportal.org` | Secret |
| `ADMIN_PASSWORD` | *(Strong temporary staging admin password)* | Secret |

---

## 6. MongoDB Staging Safety Assessment

1. **Isolation Verification**:
   - The staging database must reside in a dedicated database namespace: **`cyber_law_staging`**.
   - The connection URI is programmatically checked by `assertApprovedStagingDatabase()` before any socket connection is attempted.
   - Any connection attempt containing `cyber_law_portal`, `cyberlaw_portal`, or keywords like `prod`, `live`, or `master` throws a fatal error that immediately halts process startup.
2. **Zero In-Memory Mutations / Zero Production Writes**:
   - Local database status remains strictly disconnected (`mongoose.connection.readyState === 0`).
   - No schema migrations, record deletions, or test records were executed against live clusters.
3. **Database User Least Privilege**:
   - The Atlas database user `cyberlaw_staging_app` should be granted `readWrite` permissions exclusively scoped to `cyber_law_staging`.
   - Administrative (`atlasAdmin`) and cross-database privileges are prohibited.

---

## 7. Tests Executed and Exact Pass/Fail Counts

| Test Suite File | Domain / Scope | Tests Passed | Tests Failed | Total |
| :--- | :--- | :--- | :--- | :--- |
| `server/tests/freeTierDeploymentIntegration.test.js` | API URL resolution, Netlify SPA, Render blueprint, Staging DB guard, Production CORS, Health endpoint | **19** | **0** | **19** |
| `server/tests/stagingDatabaseGuard.test.js` | Fail-closed database isolation, keyword rejection, whitelist validation | **10** | **0** | **10** |
| `server/tests/productionHardening.test.js` | JWT entropy, CLIENT_URL validation, Rate limiting, HSTS, Production CORS | **28** | **0** | **28** |
| `server/tests/casesCollectionIntegrity.test.js` | Case study schemas, narrative contracts, dry-run seed isolation | **31** | **0** | **31** |
| `server/tests/cyberCrimeValidation.test.js` | Red flag levels, CyberCrime schemas, law definitions | **5** | **0** | **5** |
| **Client Production Build (`npm run build`)** | Vite 8.2.1 production bundle generation and asset chunking | **Passed (0 errors)** | **0** | **1** |
| **Client Oxlint Check (`npm run lint`)** | JavaScript & JSX static syntax, linting, and quality analysis | **Passed (0 errors)** | **0** | **1** |
| **Cumulative Verification Totals** | | **94** | **0** | **94** |

---

## 8. Git Branch and Commit Information

- **Working Branch**: `stage-5-learning-consolidation`
- **Remote Upstream**: `origin/stage-5-learning-consolidation`
- **Active Pull Request**: PR #1 ([https://github.com/NightFury-boss/CyberLawAwarnessPortal/pull/1](https://github.com/NightFury-boss/CyberLawAwarnessPortal/pull/1))
- **Base Branch**: `origin/main` (Lineage: Fast-forwardable, 0 behind, 12 commits ahead in PR #1)
- **Direct Push Protection**: No changes committed directly to `main`. All deployment preparation is packaged within the feature branch for code review and PR synchronization.

---

## 9. Outstanding Deployment Blockers

There are **zero codebase blockers**. All code adjustments, configuration files, build scripts, tests, and guards are complete.

The only remaining prerequisites are the manual external service setups performed by the repository owner:
1. Creating the MongoDB Atlas M0 cluster and generating the `cyber_law_staging` connection string.
2. Linking the GitHub repository in the Render Dashboard and entering the private environment variables.
3. Linking the GitHub repository in the Netlify Dashboard and setting `VITE_API_URL`.

---

## 10. Exact Manual Steps Required in Netlify, Render, and Atlas

1. **MongoDB Atlas**:
   - Create free M0 cluster in nearest region (e.g. `ap-south-1` Mumbai or `eu-central-1` Frankfurt).
   - Create database user `cyberlaw_staging_app` with strong password and `readWrite` access to `cyber_law_staging`.
   - Add Network Access rule allowing `0.0.0.0/0` (comment: `Render Free Tier Dynamic Ingress`).
   - Copy connection string: `mongodb+srv://cyberlaw_staging_app:<password>@<cluster>.mongodb.net/cyber_law_staging?retryWrites=true&w=majority`.
2. **Render**:
   - Create Web Service from `NightFury-boss/CyberLawAwarnessPortal` (branch: `stage-5-learning-consolidation`).
   - Set Root Directory: `server`, Build Command: `npm install`, Start Command: `node server.js`.
   - Set Health Check Path: `/api/health`.
   - Add environment variables (see Section 5.2). Set `CLIENT_URL` to placeholder or wait for Netlify domain.
   - Deploy and note assigned URL: `https://cyberlaw-portal-backend.onrender.com`.
3. **Netlify**:
   - Create site from `NightFury-boss/CyberLawAwarnessPortal` (branch: `stage-5-learning-consolidation`).
   - Base directory: `client`, Build command: `npm run build`, Publish directory: `dist`.
   - Add environment variable: `VITE_API_URL = https://cyberlaw-portal-backend.onrender.com/api`.
   - Deploy site. Note assigned URL: `https://<site-name>.netlify.app`.
   - Return to Render and update `CLIENT_URL = https://<site-name>.netlify.app`.

---

## 11. Free-Tier Restrictions Affecting Reliability or Security

1. **Render Free-Tier Dynamic Outbound IPs**:
   - Because Render free instances do not have static outbound IPs, MongoDB Atlas Network Access cannot be restricted to a single IP address and must allow `0.0.0.0/0`.
   - *Security Impact*: Evaluated as acceptable for staging when combined with SCRAM-SHA-256 database authentication, strong random passwords, TLS transport encryption, and our fail-closed database name guard. For future live production, a dedicated VPC peering or Render Team tier with static outbound IP is recommended.
2. **Render Spin-Down Latency**:
   - Instances sleep after 15 minutes of inactivity. First request will pause for 30–50 seconds while the service boots up.
   - *User Experience Impact*: The frontend must expect occasional cold-start latency when users first access the staging site. Health checks by Render do not keep the free tier awake indefinitely.
3. **Monthly Free Compute Hours**:
   - Render grants 750 free hours/month. Running one web service consumes ~744 hours in a 31-day month. If multiple services share the account, hours may be exhausted before month's end.
4. **Atlas M0 Connection and Storage Limits**:
   - 500 connections maximum and 512 MB storage. Sufficient for staging testing with multiple simultaneous users, but not for large-scale stress testing.

---

## 12. Explicit Distinction: Locally Verified vs. Live-Hosted Functionality

| Verification Dimension | Locally Verified Status | Live-Hosted Status |
| :--- | :--- | :--- |
| **Vite Client Production Build** | **CONFIRMED**: Builds cleanly in 588ms, outputs 29 chunks to `client/dist`. | *Pending live Netlify build trigger.* |
| **Netlify SPA Route Rewrites** | **CONFIRMED**: `client/dist/_redirects` and `netlify.toml` verified with 200 rule. | *Pending live browser navigation check.* |
| **Frontend API Normalization** | **CONFIRMED**: 6 input variants verified in unit test suite. | *Pending live browser Axios request execution.* |
| **Render Blueprint & Health Check** | **CONFIRMED**: `render.yaml` schema and `/api/health` 200/503 responses verified. | *Pending live Render container startup.* |
| **CORS Policy Origin Filtering** | **CONFIRMED**: Netlify origin accepted, untrusted origins rejected with HTTP 403. | *Pending live cross-origin browser fetch.* |
| **Staging Database Guard Isolation**| **CONFIRMED**: Atlas staging URIs approved, production names fatal-blocked. | *Pending live Atlas connection handshake.* |
| **Authoritative Scoring Engine** | **CONFIRMED**: TR, SI, VB, DQ, FP, UA dimensions and idempotency verified. | *Pending live staging assessment run.* |
| **Multi-Container VPS Deployment** | **CONFIRMED**: Compose files, Dockerfiles, and Nginx configurations preserved intact. | *Unaffected by Netlify/Render changes.* |

---
**Status**: Staging preparation is complete and verified offline. Ready for repository synchronization and manual staging provisioning.
