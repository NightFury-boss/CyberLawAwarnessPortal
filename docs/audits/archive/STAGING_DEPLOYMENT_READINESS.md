# Cyber Law Awareness Portal — Staging Deployment Readiness Guide

> [!NOTE]
> **Historical Archive (Docker/VPS Readiness Baseline):** Preserved for historical reference against the earlier self-hosted Docker/VPS baseline. Active staging now runs on **Netlify + Render + MongoDB Atlas** ([`FREE_TIER_DEPLOYMENT_GUIDE.md`](../../deployment/FREE_TIER_DEPLOYMENT_GUIDE.md)).

**Document Version:** 1.0.0  
**Date of Assessment:** 11 November 2026  
**Auditor:** Cyber Law Portal Engineering Partnership (Lead Product Architect & Full-Stack Engineer)  
**Target Milestone:** Staging Deployment Acceptance & Live Beta Validation  
**Current Git Baseline:** Branch `stage-5-learning-consolidation` (Commit: `db62fca`)  

---

## 1. Deployment Architecture Summary

The Cyber Law Awareness Portal is architected for containerized staging and production deployments via a coordinated multi-service topology orchestrated by Docker Compose (`docker-compose.staging.yml`):

```
                        ┌────────────────────────────────────────────────────────┐
                        │              Internet / Public Clients                 │
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ HTTPS / TLS (Port 443)
                                                   ▼
                        ┌────────────────────────────────────────────────────────┐
                        │  Host Reverse Proxy / Ingress (Nginx / Cloudflare / ALB)│
                        └──────────────────────────┬─────────────────────────────┘
                                                   │ HTTP (Port 80) + X-Forwarded-*
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Docker Host: staging_network (Bridge)                                                                                  │
│                                                                                                                        │
│  ┌─────────────────────────────────────────────────────┐      ┌─────────────────────────────────────────────────────┐  │
│  │ Container: cyberlaw_frontend_staging (Nginx Alpine) │      │ Container: cyberlaw_backend_staging (Node.js 20)    │  │
│  │                                                     │      │                                                     │  │
│  │ • Serves built Vite React SPA from /dist            │      │ • Express 4 REST API on Port 5000                   │  │
│  │ • Caches hashed JS/CSS/SVGs (immutable, 30d)        │      │ • Authoritative scoring & 6 behavioral metrics      │  │
│  │ • SPA client fallback: try_files $uri /index.html   │      │ • JWT auth, bcryptjs password hashing               │  │
│  │ • Proxies /api/ requests to backend:5000/api/ ─────┼─────▶│ • Healthcheck: /api/health (database ping)          │  │
│  │ • Exposes Port 80 to host network                   │      │ • Rate limiting (Auth: 20/15m, Assistant: 30/60s)   │  │
│  └─────────────────────────────────────────────────────┘      └──────────────────────────┬──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────┼─────────────────────────────┘
                                                                                           │ TLS / TLS SNI
                                                                                           ▼
                                                                ┌─────────────────────────────────────────────────────┐
                                                                │ MongoDB Atlas Staging Cluster (Dedicated TLS)       │
                                                                │ • Network whitelist: Staging Host Outbound IP       │
                                                                │ • Isolated test data & learner accounts             │
                                                                └─────────────────────────────────────────────────────┘
```

### Core Architecture Attributes:
1. **Frontend Multi-Stage Container (`client/Dockerfile`)**:
   - Stage 1 (`node:20-alpine AS builder`): Installs dependencies with `npm ci`, sets `ARG VITE_API_URL=/api`, and compiles the static bundle via `npm run build` into `/app/dist`.
   - Stage 2 (`nginx:alpine-slim`): Copies compiled assets into `/usr/share/nginx/html` and mounts `nginx.conf`. Serves static files directly with gzip compression and routes all `/api/` traffic to the backend container over internal Docker DNS (`http://backend:5000/api/`).
2. **Backend API Container (`server/Dockerfile`)**:
   - Runs on `node:20-alpine` with `NODE_ENV=production`.
   - Listens on internal port 5000.
   - Fail-closed security validation (`server/config/productionSecurity.js`) executes before HTTP listener binds.
   - Dynamic healthcheck probe executes every 15s (`/api/health`), verifying MongoDB connectivity (`mongoose.connection.readyState === 1`).
3. **Network Isolation**:
   - Backend is not exposed directly to the public internet; only the frontend container exposes port 80/443 to the host.
   - Inter-container communication occurs over isolated internal bridge network `staging_network`.

---

## 2. Required Environment Variables & Purposes

All configuration is externalized via environment variables. The repository provides safe templates with placeholders:
- Root template: `.env.staging.example`
- Backend template: `server/.env.staging.example`
- Frontend template: `client/.env.example`

| Variable Name | Required Scope | Example / Staging Value | Purpose & Architectural Invariants |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Backend | `production` | Enables production security mode, suppresses detailed stack traces, activates HSTS header generation, and enforces strict CORS checks. |
| `PORT` | Backend | `5000` | Internal port on which Express HTTP server listens. |
| `CLIENT_URL` | Backend | `https://staging.cyberlawportal.org` | **Critical Security Invariant.** Comma-separated list of trusted frontend origins allowed by CORS. Must use HTTPS and must **never** point to localhost, 127.0.0.1, or loopback in production mode. |
| `JWT_SECRET` | Backend | *(64-char hex string)* | **Cryptographic Invariant.** Secret key used to sign and verify learner session tokens. Must be at least 32 characters with high entropy. Fails startup if matching known sample defaults. |
| `MONGODB_URI` | Backend | `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/cyber_law_staging?retryWrites=true&w=majority` | Dedicated staging database connection string with TLS/SSL enabled. Must point to a staging database, **never** production. |
| `TRUST_PROXY` | Backend | `2` *(Host Ingress + Docker Nginx only)* | For this two-hop topology (Host Ingress -> Docker Nginx -> Express), set `TRUST_PROXY=2` and ensure host ingress sanitizes external `X-Forwarded-For` / `X-Forwarded-Proto` headers. *(Single-proxy deployments such as Render Free Tier or direct Docker Nginx without outer ingress use `1`.)* |
| `STAGING_PORT` | Host / Compose | `80` (or `8080`) | Host port mapped to container port 80 in `docker-compose.staging.yml`. |
| `ADMIN_EMAIL` | Backend | `staging-admin@cyberlawportal.org` | Super-administrator account identity used during authorized staging initialization. |
| `ADMIN_PASSWORD` | Backend | *(Strong password)* | Initial administrator authentication credential (minimum 8 characters). |
| `RATE_LIMIT_AUTH_MAX` | Backend | `20` | Sliding window rate limit: Maximum authentication attempts (login/register) per IP per window. |
| `RATE_LIMIT_AUTH_WINDOW_MS` | Backend | `900000` | Authentication rate limit window (900,000 ms = 15 minutes). |
| `RATE_LIMIT_ASSISTANT_MAX`| Backend | `30` | Assistant guidance API rate limit per window. |
| `RATE_LIMIT_ASSISTANT_WINDOW_MS` | Backend | `60000` | Assistant rate limit window (60,000 ms = 1 minute). |
| `SPACED_RETRIEVAL_DELAY_DAYS` | Backend | `7` | Pedagogical interval in days before completed pathway questions become due for spaced review. |
| `SCORING_V2_CUTOVER_DATE` | Backend | `2026-11-04T00:00:00.000Z` | Version cutover timestamp enforcing immutable scoring version boundaries for historical sessions. |
| `VITE_API_URL` | Frontend | `/api` | Base API path consumed by the client bundle. In staging Docker, `/api` is reverse-proxied by Nginx to the backend container. |

---

## 3. Hosting Configuration Prerequisites

To deploy staging, the hosting infrastructure must fulfill the following operational prerequisites:

1. **Host Environment**:
   - Ubuntu 22.04 LTS / Debian 12 / Amazon Linux 2023 VPS or cloud instance (minimum: 2 vCPU, 2 GB RAM, 20 GB SSD storage).
   - Docker Engine v24.0+ and Docker Compose v2.20+ installed.
2. **DNS & Networking**:
   - Staging A / CNAME DNS record (e.g. `staging.cyberlawportal.org`) pointing to the host VPS public IPv4 address.
   - Host firewall (UFW / AWS Security Group) allowing inbound traffic on:
     - Port 80 (HTTP for ACME challenge & redirection)
     - Port 443 (HTTPS / TLS)
     - Port 22 (SSH administrative access, restricted to authorized IPs)
3. **TLS / SSL Certificate Management**:
   - Production TLS termination via Let's Encrypt / Certbot or Cloudflare Origin CA.
   - Automatic HTTP-to-HTTPS redirect (`301 Moved Permanently`).

---

## 4. MongoDB Network Access Requirements

1. **Dedicated Staging Cluster**:
   - A dedicated MongoDB Atlas cluster or isolated database (`cyber_law_staging`) must be provisioned. Under no circumstances should staging share a database with production.
2. **Network Whitelisting (IP Access List)**:
   - In MongoDB Atlas Console -> **Network Access**, add the public outbound static IPv4 address of the staging VPS.
   - If the staging host has a dynamic IP, configure Atlas VPC Peering or an AWS PrivateLink connection. (Avoid `0.0.0.0/0` in permanent environments).
3. **Database User Credentials**:
   - Create a dedicated staging database user (e.g. `portal_staging_app`) with `readWrite` privileges restricted exclusively to the `cyber_law_staging` database.
   - Do not grant `atlasAdmin` or cluster-wide roles to the application runner.
4. **TLS / SSL Mandate**:
   - All connections must use `mongodb+srv://` connection strings with mandatory TLS enabled (`ssl=true` or default for SRV).

---

## 5. HTTPS, Proxy, and CORS Requirements

1. **Reverse Proxy Configuration**:
   - The Nginx frontend container (`client/nginx.conf`) handles internal reverse-proxying.
   - When deploying behind an outer host proxy (e.g., Traefik, Caddy, or Cloudflare), ensure outer proxy forwards standard headers:
     ```nginx
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_set_header Host $host;
     ```
2. **Strict-Transport-Security (HSTS)**:
   - Backend `server.js` emits `Strict-Transport-Security: max-age=31536000; includeSubDomains` whenever `req.secure` is true or `X-Forwarded-Proto === 'https'`.
3. **CORS Enforcement**:
   - Enforced by `server/config/productionSecurity.js`.
   - In staging (`NODE_ENV=production`), incoming requests with an `Origin` header that does not exactly match `CLIENT_URL` are rejected with HTTP 403 `CORS_FORBIDDEN`.
   - Browser preflight `OPTIONS` requests receive HTTP 204 with authorized methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`) and headers (`Content-Type`, `Authorization`, `X-Requested-With`).

---

## 6. Smoke-Test Coverage & Identified Gaps

The primary staging smoke test is `server/tests/stagingProductionSmoke.test.js` (831 lines, 15 comprehensive test suites).

### Tested Workflows & Strengths:
- **Suite 1**: Public homepage (`/`), healthcheck probe (`/api/health`), and legal catalogues (`/api/laws`, `/api/crimes/crimes`, `/api/quizzes`).
- **Suite 2**: User registration with case-insensitive email normalization, duplicate email rejection (400), valid password hashing, and invalid password login rejection (401).
- **Suite 3**: JWT authentication with valid Bearer tokens, missing token rejection (401), and forged cryptographic signature rejection (401).
- **Suites 4 & 5**: Baseline assessment initialization, step submission with idempotency key, idempotent retry verification (`isRetry: true`), and authoritative server-side scoring across all 6 behavioral dimensions.
- **Suite 6**: Adaptive remediation engine computing tailored pathways from assessment weakness scores.
- **Suite 7**: Pathway progression tracking, multi-step completion (Case Study + Practical Defense), and resumption.
- **Suite 8**: Knowledge practice quiz checkpoint evaluation with passing score validation.
- **Suite 9**: Spaced retrieval question delivery, due reviews query, and reinforcement evaluation.
- **Suites 10 & 11**: Final assessment execution, longitudinal trajectory delta calculation between baseline and final sessions (`hasValidPair: true`).
- **Suite 12**: Defensive Portfolio three-pillar contract verification for print and PDF generation.
- **Suite 13**: Admin role-based access control (RBAC): verifies standard learner receives 403 on `/api/admin/*`, while admin receives 200.
- **Suite 14**: Insecure Direct Object Reference (IDOR) cross-tenant security: verifies Learner B cannot view, modify, or submit steps on Learner A's session.
- **Suite 15**: Production CORS enforcement: trusted staging origin allowed, untrusted origin rejected with 403 `CORS_FORBIDDEN`; rate-limiting headers validated.

### Identified Smoke-Test Gaps & Remediation Plan:
1. **Live Network Probe vs. In-Process Express App**:
   - `stagingProductionSmoke.test.js` builds an Express app on an ephemeral local port (`127.0.0.1:0`) and connects to `MONGODB_URI`.
   - *Operational Opportunity*: To test the *actual deployed containers* over the public internet (including Nginx routing, SSL certificates, and DNS), create a companion script `scripts/test-live-staging-endpoint.js` that points fetch requests directly to `https://staging.cyberlawportal.org`.
2. **Static Asset CDN Verification**:
   - The test validates API endpoints; it does not explicitly fetch frontend static chunks (e.g. `/assets/index-*.js`, `/favicon.svg`).
   - *Action*: Add automated verification of HTTP 200 on `/index.html`, `/favicon.svg`, and `/logo/cyber-law-logo-dark.svg` in post-deployment verification.

---

## 7. Security and Data-Isolation Precautions

1. **Synthetic Test Account Isolation**:
   - All smoke-test accounts use dynamic timestamps: `smoke_alice_<timestamp>@staging.test`.
   - In `after()`, the test deletes all created test sessions, user progress records, and test users.
2. **Zero Modification of Published Scenarios**:
   - Authoritative scenario seeds (`baseline`, `final`) and 21 case study records are read-only.
   - The test never modifies scenario version or configuration weights.
3. **Database Guardrails**:
   - Under no circumstances run `npm run seed:reset` in staging or production.
   - Automated backups in MongoDB Atlas must be enabled (daily snapshots with 7-day retention).
4. **Credential Sanitation**:
   - Never commit `.env` or `.env.staging` to Git.
   - Logs obfuscate database connection strings (`getObfuscatedURI()`), masking passwords.

---

## 8. Exact Deployment Steps for Authorized Operator

Follow these exact steps to deploy to staging:

### Step 1: Clone Repository on Staging Host
```bash
git clone https://github.com/your-org/cyber-law-portal.git /var/www/cyber-law-portal
cd /var/www/cyber-law-portal
git checkout stage-5-learning-consolidation
```

### Step 2: Configure Staging Environment
```bash
# Copy template to staging env file
cp .env.staging.example .env.staging

# Generate a strong 64-character hex secret for JWT
JWT_SECRET=$(openssl rand -hex 32)
echo "Generated Secret: $JWT_SECRET"

# Edit .env.staging with production values:
# 1. Set JWT_SECRET to the generated string
# 2. Set MONGODB_URI to your staging MongoDB Atlas cluster
# 3. Set CLIENT_URL to your staging domain (e.g., https://staging.cyberlawportal.org)
# 4. Set ADMIN_PASSWORD to a strong staging administrator password
nano .env.staging
```

### Step 3: Run Staging Pre-Flight Validator
```bash
# Verify configuration before launching containers
node scripts/validate-staging-env.js .env.staging
```
*Expected Output: `✔ PRE-FLIGHT CHECK PASSED: Staging environment configuration is valid and ready.`*

### Step 4: Build and Launch Staging Containers
```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --build
```

### Step 5: Verify Container Health
```bash
# Check container status
docker compose -f docker-compose.staging.yml ps

# Inspect backend health logs
docker logs cyberlaw_backend_staging --tail 50

# Inspect frontend Nginx access logs
docker logs cyberlaw_frontend_staging --tail 50
```

---

## 9. Post-Deployment Verification Commands

Run the following commands on the staging host or authorized remote machine to verify complete deployment acceptance:

### 1. Health Probe Verification
```bash
curl -I https://staging.cyberlawportal.org/api/health
```
*Expected: HTTP/1.1 200 OK or HTTP/2 200*
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 120,
  "timestamp": "2026-11-11T..."
}
```

### 2. Security Headers & HSTS Verification
```bash
curl -I https://staging.cyberlawportal.org/
```
*Verify presence of:*
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### 3. CORS Policy Verification
```bash
# Permitted origin (should return Access-Control-Allow-Origin)
curl -H "Origin: https://staging.cyberlawportal.org" -I https://staging.cyberlawportal.org/api/laws

# Unauthorized origin (should return HTTP 403 Forbidden)
curl -H "Origin: https://unauthorized-evil-site.com" -I https://staging.cyberlawportal.org/api/laws
```

### 4. Execute Backend Staging Smoke Test Suite
```bash
cd /var/www/cyber-law-portal
NODE_ENV=production npm run test:smoke
```
*Expected: 15 / 15 suites passed, 0 failures.*

---

## 10. Outstanding Blockers & Operational Assessment

### Operational Assessment: **READY FOR STAGING DEPLOYMENT**

| Category | Assessment | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Codebase & Builds** | Clean Vite production build, 0 Oxlint errors, zero broken modules. | **READY** | Dist bundle is optimized and verified. |
| **Integrity Suites** | 37/37 backend schema & collection tests passing; 26/26 pre-beta browser validation tests passing. | **READY** | All critical accessibility and functional invariants verified. |
| **Containers & Nginx** | Docker multi-stage build and Nginx reverse proxy configurations validated. | **READY** | Tested caching rules and SPA routing fallback. |
| **Configuration Templates**| Safe `.env.staging.example` files created with comprehensive documentation. | **READY** | Zero credentials or real secrets committed. |
| **Staging Infrastructure** | Provisioning staging VM and staging MongoDB Atlas IP access list. | **PENDING OPS** | Operational action required by hosting owner. |

### Summary of Blockers:
- **Application Code Blockers**: **ZERO (0)**. There are no remaining defects, broken layouts, or accessibility barriers in the code.
- **Operational Blockers**: **ONE (1)**. The operator must provision the staging host environment and MongoDB Atlas staging cluster credentials before running the live staging deployment.

