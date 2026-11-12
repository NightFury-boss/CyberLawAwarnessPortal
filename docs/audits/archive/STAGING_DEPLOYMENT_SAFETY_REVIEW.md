# Cyber Law Awareness Portal — Staging Deployment Safety Review

> [!NOTE]
> **Historical Archive (Pre-Netlify/Render Safety Review):** Captures an earlier Docker/VPS pre-deployment assessment snapshot. Active staging runs on **Netlify + Render + MongoDB Atlas** ([`FREE_TIER_DEPLOYMENT_GUIDE.md`](../../deployment/FREE_TIER_DEPLOYMENT_GUIDE.md)); historical defect statuses noted below reflect subsequent hardening fixes.

**Review Type:** Pre-Deployment Operational & Security Safety Assessment  
**Date of Review:** 11 November 2026  
**Auditor:** Cyber Law Portal Engineering Partnership (Lead Product Architect & Security Reviewer)  
**Target Milestone:** Staging Server Deployment & Live Smoke-Test Execution  
**Current Git Baseline:** Branch `stage-5-learning-consolidation` (Commit: `db62fca`)  

---

## 1. Executive Summary

This safety review evaluates the staging deployment topology, Docker configurations, environment templates, database connection isolation, and automated smoke-test lifecycle for the Cyber Law Awareness Portal.

The objective is to guarantee that the impending staging deployment and live smoke validation:
1. Cannot accidentally alter, contaminate, or connect to production data.
2. Cannot leak credentials, cryptographic keys, or private tokens into client bundles, container image layers, or public logs.
3. Cannot create an insecure, open, or unmonitored public exposure.
4. Provides fail-closed safeguards and deterministic cleanup for all synthetic test artifacts.

### Overall Recommendation: **GO FOR STAGING DEPLOYMENT (SUBJECT TO PREREQUISITES)**
The deployment topology is securely architected with excellent container isolation, non-root execution, fail-closed runtime configuration validation, and surgical test teardown logic. Two medium operational improvements (adding `.dockerignore` files and adding an explicit production database guard to the smoke-test harness) have been identified and documented with safe remediation steps.

---

## 2. Docker Network and Port Exposure Assessment

### 2.1 Network Topology & Inter-Container Communication
- **Internal Bridge Network**: `docker-compose.staging.yml` establishes an isolated bridge network `staging_network`.
- **Frontend-to-Backend Resolution**: The Nginx frontend container communicates with the Express backend over internal Docker DNS (`http://backend:5000/api/`).
- **Isolation Boundary**: The Express backend container exposes port 5000 to `staging_network` only (`expose: ["5000"]`). It does **not** map port 5000 to the host network (`ports:` is omitted for backend). This prevents direct external bypass of Nginx.
- **Public Port Ingress**: Only the frontend Nginx container binds port 80/443 to the host (`ports: ["${STAGING_PORT:-80}:80"]`).
- **Database Exposure**: MongoDB is hosted externally on MongoDB Atlas with dedicated TLS; zero database server ports are opened or exposed by the Docker host.

### 2.2 Container Hardening & Execution Privileges
- **Non-Root Execution**: `server/Dockerfile` explicitly sets `USER node` and runs under the unprivileged `node` user (UID 1000).
- **Init Process Signal Handling**: `server/Dockerfile` integrates `dumb-init` as the container `ENTRYPOINT`, guaranteeing proper reaping of zombie processes and graceful handling of `SIGTERM` / `SIGINT` shutdown signals.
- **Restart Policies**: Both containers specify `restart: unless-stopped`, ensuring automatic recovery in the event of transient host crashes or OOM events.
- **Dependency Healthcheck Dependency**: The frontend container enforces `depends_on: backend: condition: service_healthy`. Nginx will not serve traffic until the Express backend has connected to MongoDB and `/api/health` returns HTTP 200.

### 2.3 Static Asset Delivery & SPA Fallback
- `client/nginx.conf` properly implements client-side routing fallback:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
- Static assets with content-hashed filenames (`.js`, `.css`, `.svg`, `.png`, `.woff2`) are cached with `Cache-Control: public, no-transform, immutable` for 30 days.
- `index.html` is served without aggressive caching headers, ensuring immediate client updates upon new container deployments.

---

## 3. Environment and Secret Safety Assessment

### 3.1 Git Ignore Verification
Rigorous evaluation with `git check-ignore -v` confirmed that all staging and local environment files are strictly excluded from version control by `.gitignore` (lines 8–14):
- `.gitignore:10:.env.staging` -> Matches `.env.staging` in workspace root.
- `.gitignore:10:.env.staging` -> Matches `server/.env.staging`.
- `.gitignore:10:.env.staging` -> Matches `client/.env.staging`.
- `.gitignore:8:.env` -> Matches all local `.env` files.

### 3.2 Template Sanitation
Both `.env.staging.example` files (root and `server/`) were inspected:
- **Placeholders Only**: `JWT_SECRET=replace_with_a_secure_random_64_character_hex_string_here_12345`
- **Database URI**: `mongodb+srv://<staging_username>:<staging_password>@<staging_cluster>.mongodb.net/cyber_law_staging?retryWrites=true&w=majority`
- **Zero Secrets**: Contains zero real MongoDB connection strings, API keys, private passwords, or PII.

### 3.3 Frontend Build-Time Leak Prevention
- `client/Dockerfile` receives only `ARG VITE_API_URL=/api`.
- Vite strictly restricts client-accessible environment variables to those prefixed with `VITE_`.
- Server-side secrets (`JWT_SECRET`, `MONGODB_URI`, `ADMIN_PASSWORD`) are never passed to the client builder and cannot leak into compiled client bundles in `client/dist`.

### 3.4 Runtime Log Obfuscation
- `server/config/db.js` implements `getObfuscatedURI()`, which parses connection strings and masks user credentials (`mongodb+srv://****:****@cluster.mongodb.net/...`). Real database passwords are never emitted to container stdout.

---

## 4. Production vs. Staging Database Isolation Assessment

### 4.1 Database Separation Mandate
- Staging and production **must** use separate, distinct MongoDB Atlas databases. The staging connection string must target `cyber_law_staging`.
- In `server/config/productionSecurity.js`, fail-closed validation aborts startup if mandatory variables are missing.

### 4.2 Destructive Operation Safeguards
- `server/config/seedReset.js` contains a hardcoded dual-safeguard:
  ```javascript
  if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DB_RESET !== 'true') {
    console.error('[DATABASE RESET SECURITY BLOCK]');
    process.exit(1);
  }
  ```
- Because staging runs with `NODE_ENV=production`, `seedReset.js` aborts immediately with exit code 1 if invoked in staging.

---

## 5. Smoke-Test Cleanup Safety Assessment

### 5.1 Test Entity Isolation in `stagingProductionSmoke.test.js`
The staging smoke test (`server/tests/stagingProductionSmoke.test.js`) generates synthetic test accounts using dynamic timestamps:
```javascript
const timestamp = Date.now();
learnerA = await User.create({
  fullName: 'Smoke Learner Alice',
  email: `smoke_alice_${timestamp}@staging.test`,
  ...
});
testUserIds.push(learnerA._id);
```

### 5.2 Deterministic Teardown Execution
In the `after()` block:
```javascript
after(async () => {
  if (testSessionIds.length > 0) {
    await AssessmentSession.deleteMany({ _id: { $in: testSessionIds } });
  }
  await UserProgress.deleteMany({ userId: { $in: testUserIds } });
  await User.deleteMany({ _id: { $in: testUserIds } });
  ...
});
```
- **Surgical Scoping**: Cleanup uses `$in: testSessionIds` and `$in: testUserIds`. It only deletes the exact ObjectIds instantiated during that specific test run.
- **Zero Impact on Real Data**: Existing learners, published scenario seeds (`baseline`, `final`), curriculum modules, and case study narratives remain untouched.
- **Orphan Recovery Utility**: If an abrupt process kill (`SIGKILL`) prevents `after()` from completing, use the existing run-scoped recovery CLI (`scripts/safeOrphanRecovery.js`) rather than broad collection-wide filters:
  ```bash
  # Dry-run preview first (required --run-id scopes Strictly to that smoke run)
  node scripts/safeOrphanRecovery.js --run-id <SMOKE_RUN_ID>

  # Execute run-scoped purge after verifying preview counts
  node scripts/safeOrphanRecovery.js --run-id <SMOKE_RUN_ID> --confirm
  ```

---

## 6. TLS, Reverse Proxy, and CORS Assessment

### 6.1 Reverse Proxy Header Forwarding
In `client/nginx.conf`:
```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
```
- The frontend Nginx container sets standard proxy headers when forwarding `/api/` traffic to the backend.

### 6.2 `TRUST_PROXY` Hop Count Analysis
- In `server/server.js`: `app.set('trust proxy', 1)`.
- When requests pass through **one proxy hop** (Internet -> Docker Nginx -> Express), setting `trust proxy: 1` is correct. Express reads `X-Forwarded-For` from Nginx to determine the client IP.
- **Multi-Proxy Caution**: If an **outer proxy** (such as Cloudflare or an AWS Application Load Balancer) sits in front of the staging VPS (Internet -> Cloudflare -> Docker Nginx -> Express), there are **two hops**. Under two hops, `trust proxy: 1` would cause Express to treat Docker Nginx's incoming IP (Cloudflare) as the client IP, causing all users to share the same rate-limit bucket.
- *Remediation*: If an outer proxy or CDN is used, set `TRUST_PROXY=2` or configure trusted subnet CIDRs in `.env.staging`.

### 6.3 HSTS & Secure Cookies
- HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) is emitted only when `NODE_ENV === 'production'` and the connection is verified secure (`req.secure || req.headers['x-forwarded-proto'] === 'https'`).
- Unencrypted HTTP connections will not emit HSTS, preventing accidental lockout during local testing.

### 6.4 CORS Policy Strictness
- `server/server.js` verifies incoming `Origin` against `CLIENT_URL`.
- Cross-origin requests from unapproved domains are rejected with HTTP 403 `CORS_FORBIDDEN`.
- In standard deployment, the React SPA and Express API share the same origin (`https://staging.cyberlawportal.org`), so client API requests are same-origin and bypass CORS overhead.

---

## 7. Security Defects and Operational Gaps Register

| Defect ID | Severity | Surface / Component | Observed Risk | Remediation / Safe Fix |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-STG-01** | **Medium** | Docker Build Context | Missing `.dockerignore` in `client/` and `server/`. `COPY . ./` in `client/Dockerfile` copies the entire client directory into the builder stage, risking inclusion of local `.env` files or temporary scratch files in the build cache. | Create `.dockerignore` files in `client/` and `server/` excluding `.env*`, `node_modules`, `tests/`, and `.git/`. |
| **SEC-STG-02** | **Medium** | Smoke Test Guard | Historical finding at snapshot time (`stagingProductionSmoke.test.js` lacked an explicit fail-closed DB guard prior to `connectDB()`). | **Resolved (Historical Note):** `stagingProductionSmoke.test.js` `before()` now invokes `assertApprovedStagingDatabase()` before `connectDB()` (failing closed with zero `ALLOW_PRODUCTION_SMOKE` override; set `EXPECTED_STAGING_HOST` as well to bind cluster host verification). |
| **SEC-STG-03** | **Low** | Reverse Proxy Topology | `TRUST_PROXY=1` assumes a single proxy hop. If Cloudflare or an outer ALB is added in front of Docker Nginx, rate-limiting may bundle all users into one IP bucket. | Document outer proxy topology in deployment manual; set `TRUST_PROXY=2` when behind Cloudflare. |

---

## 8. Exact Prerequisites Before Staging Deployment

The project owner or authorized operator must complete these checklist items before deploying:

1. **Staging VPS Provisioned**:
   - Host running Ubuntu 22.04 LTS / Debian 12 with Docker v24+ and Docker Compose v2.20+.
   - Outbound static IPv4 address noted.
2. **Dedicated MongoDB Atlas Staging Database**:
   - Database name: `cyber_law_staging`.
   - Dedicated database user with `readWrite` on `cyber_law_staging` only.
   - Staging VPS outbound IPv4 added to Atlas **Network Access IP Whitelist**.
3. **Environment File Prepared (`.env.staging`)**:
   - Copied from `.env.staging.example`.
   - `JWT_SECRET` generated via `openssl rand -hex 32`.
   - `CLIENT_URL` set to the exact staging domain (e.g. `https://staging.cyberlawportal.org`).
   - `MONGODB_URI` populated with the staging Atlas cluster URI.
4. **Pre-Flight Validation Execution**:
   - Run `node scripts/validate-staging-env.js .env.staging` on the host to verify credentials and database handshake before starting containers.
5. **DNS & TLS Ingress**:
   - Staging domain DNS A record pointing to staging VPS IP.
   - Let's Encrypt / Certbot or Cloudflare SSL certificate active.

---

## 9. Final Go / No-Go Recommendation

### Verdict: **GO FOR STAGING DEPLOYMENT**

**Rationale**:
- The Cyber Law Awareness Portal exhibits a mature, defense-in-depth architecture.
- Port exposure is strictly minimized: the backend API is unmapped to the host network and accessible only through internal Nginx reverse-proxying.
- Secrets cannot leak into client bundles.
- Destructive database reset commands (`seedReset.js`) are locked to `NODE_ENV === 'development'`.
- Smoke-test cleanup uses strict ID matching and operates on synthetic entities.
- The two identified medium issues (`.dockerignore` and smoke-test production URI guard) are operational hardening items that do not block deployment when following the prerequisite checklist.

The staging deployment is safe to proceed under the supervision of the authorized project owner.

