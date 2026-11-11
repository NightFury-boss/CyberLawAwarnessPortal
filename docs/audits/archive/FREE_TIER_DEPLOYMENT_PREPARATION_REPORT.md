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
- **Environment Detection Heuristics**:
  - Automatically recognizes `*.netlify.app` and `staging.*` hostnames as staging mode, activating adaptive 60s cold-start timeouts and spin-up notices.
  - **Important Note for Production on Default Netlify Subdomains**: When running a production instance on a default `*.netlify.app` subdomain (without a custom production domain), `VITE_APP_ENV=production` MUST be set in Netlify site settings to prevent matching the staging heuristic.
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

| Variable | Staging Setting / Example | Required? | Nature | Default / Fallback in Code | Relevant Source File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `https://cyberlaw-portal-backend.onrender.com/api` | Optional | Public | Auto-normalized via `resolveApiUrl()`; falls back to window origin or `http://localhost:5000/api` | `client/src/services/api.js:11` |
| `VITE_APP_ENV` | `staging` (or `production` for prod on `*.netlify.app`) | **Required** for prod on `*.netlify.app` | Config | Unset (defaults to URL/hostname heuristics) | `client/src/services/api.js:62` |
| `VITE_IS_STAGING` | `true` | Optional | Config | Unset | `client/src/services/api.js:66` |
| `VITE_API_TIMEOUT_MS` | `15000` | Optional | Config | `15000` (15s default active timeout) | `client/src/services/api.js:96` |
| `VITE_API_COLD_START_TIMEOUT_MS` | `60000` | Optional | Config | `60000` (60s cold-start timeout) | `client/src/services/api.js:97` |

> [!IMPORTANT] Production on Default `*.netlify.app` Subdomains
> Production deployments hosted on default `*.netlify.app` subdomains (without a custom domain) will match the staging heuristic unless `VITE_APP_ENV=production` is set in the Netlify site configuration. Explicit `VITE_APP_ENV=production` always takes absolute precedence over hostname detection.

### 5.2 Backend (Render Service Dashboard > Environment)

| Variable | Staging Setting / Example | Required? | Nature | Default / Fallback in Code | Relevant Source File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` | Optional | Config | None (Node runtime default) | `server/server.js:13`, `render.yaml:18` |
| `HOST` | `0.0.0.0` | Optional | Config | `'0.0.0.0'` | `server/server.js:132`, `render.yaml:20` |
| `PORT` | Auto-injected by Render (e.g. `10000`) | Optional | Config | `5000` | `server/server.js:131` |
| `CLIENT_URL` | `https://cyberlaw-portal-staging.netlify.app` | **Required** in prod | Config | Throws fatal error in prod; `'http://localhost:5173'` in dev | `server/config/productionSecurity.js:76`, `server/server.js:53` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/cyber_law_staging?retryWrites=true&w=majority` | **Required** | Secret | Checks `MONGO_URI`, then `'mongodb://localhost:27017/cyber_law_portal'` | `server/config/db.js:7`, `render.yaml:42` |
| `MONGO_URI` | Alternative database URI fallback | Optional | Secret | None | `server/config/db.js:7` |
| `JWT_SECRET` | *(64-hex char secret from `openssl rand -hex 32`)* | **Required** in prod | Secret | Throws fatal error in prod; dev placeholder in dev/test | `server/config/productionSecurity.js:34`, `render.yaml:44` |
| `TRUST_PROXY` | `1` | Optional | Config | `'1'` | `server/server.js:35`, `render.yaml:22` |
| `ASSERT_STAGING_DB` | `true` | **Required** for staging | Config | Unset (guard bypassed if not `'true'`) | `server/config/db.js:8`, `render.yaml:24` |
| `EXPECTED_STAGING_DB_NAME` | `cyber_law_staging` | Optional | Config | Unset (falls back to broad staging whitelist) | `server/config/stagingDatabaseGuard.js:126`, `render.yaml:26` |
| `SPACED_RETRIEVAL_DELAY_DAYS`| `7` | Optional | Config | `7` | `server/services/spacedRetrievalService.js:20`, `render.yaml:28` |
| `SCORING_V2_CUTOVER_DATE` | `2026-11-04T00:00:00.000Z` | **Required** in prod | Config | Throws `CONFIG_CUTOVER_MISSING` in prod; `'2026-11-04T00:00:00.000Z'` in test | `server/config/cutoverConfig.js:8`, `render.yaml:30` |
| `RATE_LIMIT_AUTH_MAX` | `20` | Optional | Config | `20` | `server/middleware/rateLimitMiddleware.js:111`, `render.yaml:32` |
| `RATE_LIMIT_AUTH_WINDOW_MS` | `900000` | Optional | Config | `900000` (15 minutes) | `server/middleware/rateLimitMiddleware.js:110`, `render.yaml:34` |
| `RATE_LIMIT_ASSISTANT_MAX` | `30` | Optional | Config | `30` | `server/middleware/rateLimitMiddleware.js:117`, `render.yaml:36` |
| `RATE_LIMIT_ASSISTANT_WINDOW_MS` | `60000` | Optional | Config | `60000` (1 minute) | `server/middleware/rateLimitMiddleware.js:116`, `render.yaml:38` |
| `ADMIN_EMAIL` | `staging-admin@cyberlawportal.org` | Optional | Secret | `'admin@cyberlawportal.test'` (seed script fallback) | `server/config/seed.js:54`, `render.yaml:46` |
| `ADMIN_PASSWORD` | *(Strong temporary staging admin password)* | Optional | Secret | `'AdminPass123!'` (seed script fallback) | `server/config/seed.js:55`, `render.yaml:48` |

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
| `server/tests/coldStartHandling.test.js` | Render cold start, adaptive timeouts, bounded retries, AbortSignal handling, notification transitions | **14** | **0** | **14** |
| `server/tests/freeTierDeploymentIntegration.test.js` | API URL resolution, Netlify SPA, Render blueprint, Staging DB guard, Production CORS, Health endpoint | **19** | **0** | **19** |
| `server/tests/stagingDatabaseGuard.test.js` | Fail-closed database isolation, keyword rejection, whitelist validation | **10** | **0** | **10** |
| `server/tests/productionHardening.test.js` | JWT entropy, CLIENT_URL validation, Rate limiting, HSTS, Production CORS | **28** | **0** | **28** |
| `server/tests/casesCollectionIntegrity.test.js` | Case study schemas, narrative contracts, dry-run seed isolation | **31** | **0** | **31** |
| `server/tests/cyberCrimeValidation.test.js` | Red flag levels, CyberCrime schemas, law definitions | **5** | **0** | **5** |
| **Client Production Build (`npm run build`)** | Vite 8.2.1 production bundle generation and asset chunking | **Passed (0 errors)** | **0** | **1** |
| **Client Oxlint Check (`npm run lint`)** | JavaScript & JSX static syntax, linting, and quality analysis | **Passed (0 errors)** | **0** | **1** |
| **Cumulative Verification Totals** | | **108** | **0** | **108** |

---

## 8. Git Branch and Commit Information

- **Working & Deployment Branch**: `main`
- **Remote Upstream**: `origin/main`
- **Merged Releases & PRs**:
  - PR #1: Staging preparation and Netlify/Render/Atlas readiness ([PR #1](https://github.com/NightFury-boss/CyberLawAwarnessPortal/pull/1)) — *Merged into main*.
  - PR #2: Unreferenced assets and documentation cleanup ([PR #2](https://github.com/NightFury-boss/CyberLawAwarnessPortal/pull/2)) — *Merged into main*.
- **Commit Baseline**: `15d8cabc3df35cdd088133c3aa22e638ad4c8f70` (In exact parity with `origin/main`).
- **Deployment Recommendation**: Deployments must strictly use the reviewed, merged `main` branch. All outdated references suggesting deployment from temporary feature branches (such as `stage-5-learning-consolidation`) have been retired.
- **Render Auto-Deploy Behavior**: Render's `render.yaml` blueprint specifies `autoDeploy: true`. Future merges or pushes to `main` will automatically trigger fresh builds on Render.

---

## 9. Outstanding Deployment Blockers

There are **zero codebase blockers**. All code adjustments, configuration files, build scripts, tests, documentation, and guards are complete.

The only remaining prerequisites are the manual external service setups performed by the repository owner:
1. Creating the MongoDB Atlas M0 cluster, generating the `cyber_law_staging` connection string, and configuring the least-privilege `cyberlaw_staging_app` user.
2. Linking the GitHub repository in the Render Dashboard (`main` branch) and entering the private environment variables.
3. Linking the GitHub repository in the Netlify Dashboard (`main` branch) and setting `VITE_API_URL`.

---

## 10. Exact Manual Steps Required in Netlify, Render, and Atlas

1. **MongoDB Atlas**:
   - Create free M0 cluster in nearest region (e.g. `ap-south-1` Mumbai or `eu-central-1` Frankfurt).
   - Create database user `cyberlaw_staging_app` with strong password (24+ characters) and granular `readWrite` access scoped strictly to `cyber_law_staging`.
   - Add Network Access rule allowing `0.0.0.0/0` (comment: `Render Free Tier Dynamic Ingress`).
   - Copy connection string: `mongodb+srv://cyberlaw_staging_app:<password>@<cluster>.mongodb.net/cyber_law_staging?retryWrites=true&w=majority`.
2. **Render**:
   - Create Web Service from `NightFury-boss/CyberLawAwarnessPortal` (branch: **`main`**).
   - Set Root Directory: `server`, Build Command: `npm install`, Start Command: `node server.js`.
   - Set Health Check Path: `/api/health`.
   - Add environment variables (see Section 5.2). Set `CLIENT_URL` to a placeholder or wait for the Netlify assigned domain.
   - Deploy and note assigned URL: `https://cyberlaw-portal-backend.onrender.com`.
3. **Netlify**:
   - Create site from `NightFury-boss/CyberLawAwarnessPortal` (branch: **`main`**).
   - Base directory: `client`, Build command: `npm run build`, Publish directory: `dist`.
   - Add environment variable: `VITE_API_URL = https://cyberlaw-portal-backend.onrender.com/api`.
   - Deploy site. Note assigned URL: `https://<site-name>.netlify.app`.
   - Return to Render and update `CLIENT_URL = https://<site-name>.netlify.app`.

---

## 11. Free-Tier Restrictions Affecting Reliability or Security

1. **Render Free-Tier Dynamic Outbound IPs**:
   - Because Render free instances do not have static outbound IPs, MongoDB Atlas Network Access cannot be restricted to a single IP address and must allow `0.0.0.0/0`.
   - *Security Reality & Defense-in-Depth*: Allowing `0.0.0.0/0` accepts connections from anywhere on the internet. While TLS 1.3 and SCRAM-SHA-256 protect queries, they do not prevent denial-of-service connection floods or brute force on Atlas M0. Therefore, the staging database must strictly contain zero production data, use an unguessable 24+ char password, enforce least-privilege scoping, and rely on our fail-closed `ASSERT_STAGING_DB` code guard.
   - For funded production, a Render Team plan with Static Outbound IP or AWS/GCP VPC Peering should be adopted.
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
