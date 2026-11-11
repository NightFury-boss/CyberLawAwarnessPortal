# Cyber Law Awareness Portal — Staging & Production Deployment Guide

This guide specifies the architecture, environment configuration, container assets, and verification runbook for deploying the Cyber Law Awareness Portal to a controlled staging environment and subsequent production release.

---

## 1. Staging Architecture Evaluation & Options

To deploy this MERN application without assuming paid enterprise accounts or dedicated DevOps teams, three viable architectural options are evaluated below:

### Option A: Single-Host VPS with Docker Compose (Recommended Staging Architecture)
* **Frontend**: Nginx Alpine serving compiled Vite static bundle (`client/dist`).
* **Backend**: Node.js 20 Alpine running Express on internal port 5000.
* **Reverse Proxy**: Nginx reverse-proxies `/api/` traffic to the backend container, handling gzip compression, static asset caching, and security headers.
* **Database**: MongoDB Atlas M0 (Free Tier) or M10 cluster with TLS/SSL encryption and restricted IP whitelisting.
* **DNS & HTTPS**: Free Let's Encrypt SSL certificate provisioned via Certbot or Cloudflare Proxied DNS.
* **Pros**: 
  - Lowest cost (runs on any inexpensive $4–$6/mo VPS like Hetzner, DigitalOcean, or Linode; or free-tier cloud credits).
  - Exact simulation of production Nginx reverse proxy topology (`TRUST_PROXY=1`).
  - Same-origin API routing (`/api`), eliminating CORS preflight latency and cookie/origin issues.
  - Reproducible container builds via `docker-compose.staging.yml`.
* **Cons**: Requires managing Linux host OS updates and firewall rules (UFW).

### Option B: Managed PaaS (Render / Railway / Fly.io)
* **Frontend**: Deployed as a Static Site (free tier).
* **Backend**: Deployed as a Web Service container.
* **Database**: MongoDB Atlas.
* **HTTPS**: Automatically managed by PaaS provider.
* **Pros**: Zero server maintenance, automated git push deployments, managed TLS.
* **Cons**: 
  - Free tiers often sleep after inactivity, causing 30–50 second cold starts for API requests.
  - Separate origins (`https://cyberlaw-client.onrender.com` vs `https://cyberlaw-api.onrender.com`) require explicit CORS preflight negotiations for every non-GET request.
  - Free bandwidth and execution hour caps.

### Option C: Decoupled Static Edge (Cloudflare Pages / Vercel) + Containerized Backend VPS
* **Frontend**: Hosted on Cloudflare Pages or Vercel Edge CDN.
* **Backend**: Hosted on a dedicated Node.js VPS.
* **Database**: MongoDB Atlas.
* **Pros**: Extremely fast global frontend asset delivery; unlimited static bandwidth.
* **Cons**: Two independent deployment lifecycles; cross-origin CORS policy strictly required.

**Decision**: For controlled staging verification, **Option A** (Docker Compose with Nginx reverse proxy) is recommended as the canonical architecture because it tests real reverse proxy behavior, HSTS forwarding, and in-memory rate limiting identically to production.

---

## 2. Environment Variables & Secret Management

### Backend Configuration (`server/.env.staging`)
Copy `server/.env.staging.example` to `server/.env.staging` and configure:

| Variable | Description | Security Requirement |
| :--- | :--- | :--- |
| `PORT` | Internal backend listen port | `5000` |
| `NODE_ENV` | Runtime environment mode | Must be strictly `production` |
| `CLIENT_URL` | Allowed frontend origin(s) | Explicit HTTPS origin (e.g. `https://staging.cyberlawportal.org`). Never `*` or `localhost` in production. |
| `JWT_SECRET` | Secret key for JWT signing | Minimum 32 characters, cryptographically random. Generate with: `openssl rand -hex 32` |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://...` with TLS/SSL enabled |
| `TRUST_PROXY` | Reverse proxy trust level | Set to `1` behind Nginx, Cloudflare, or AWS ALB |
| `ADMIN_EMAIL` | Initial admin account email | Valid email address |
| `ADMIN_PASSWORD` | Initial admin account password | Minimum 8 characters, non-default |
| `RATE_LIMIT_AUTH_MAX` | Max login/register attempts | `20` per 15 minutes |
| `RATE_LIMIT_AUTH_WINDOW_MS` | Auth window duration | `900000` (15 minutes) |
| `RATE_LIMIT_ASSISTANT_MAX` | Max legal assistant queries | `30` per minute |
| `RATE_LIMIT_ASSISTANT_WINDOW_MS` | Assistant window duration | `60000` (1 minute) |

### Frontend Build Variable (`client/.env.production`)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL | `/api` (when using Nginx reverse proxy) or `https://api.staging.example.com/api` |

> [!IMPORTANT]
> Never commit `.env` or `.env.staging` files to source control. Secrets should be injected via host environment variables, Docker secrets, or CI/CD deployment pipeline secrets.

---

## 3. MongoDB Atlas Configuration

1. **Cluster Provisioning**:
   - Create a MongoDB Atlas cluster (M0 Free or M10 Dedicated).
   - Database name: `cyber_law_staging`.
2. **Network Access**:
   - In Atlas Dashboard $\rightarrow$ **Network Access**, add the static public IP address of your staging host (`<STAGING_HOST_IP>/32`).
   - Do **NOT** use `0.0.0.0/0` (allow access from anywhere) in production.
3. **Database User**:
   - In Atlas Dashboard $\rightarrow$ **Database Access**, create a dedicated database user with `readWrite` permissions on `cyber_law_staging`.
   - Avoid using the Atlas project owner account for application connections.

---

## 4. Staging Deployment Execution Runbook

### Step 1: Pre-Flight Environment Validation
Run the built-in validator against your staging environment file:
```bash
node scripts/validate-staging-env.js server/.env.staging
```
The script will verify high-entropy secrets, origin configurations, and ping the live MongoDB Atlas cluster. If any check fails, resolve it before proceeding.

### Step 2: Build & Launch with Docker Compose
```bash
# Build containers with zero cache to guarantee fresh dependencies
docker compose -f docker-compose.staging.yml build --no-cache

# Start containers in detached mode
docker compose -f docker-compose.staging.yml up -d
```

### Step 3: Verify Container Health
```bash
# Check container status and healthcheck verdict
docker compose -f docker-compose.staging.yml ps

# Inspect backend logs
docker compose -f docker-compose.staging.yml logs -f backend

# Probe backend health directly
curl -i http://localhost:5000/api/health
```
Expected response:
```json
HTTP/1.1 200 OK
{
  "status": "healthy",
  "database": "connected",
  "uptime": 12,
  "timestamp": "2026-10-30T10:00:00.000Z"
}
```

### Step 4: Non-Destructive Database Seeding
Initialize laws, cybercrime fixtures, quizzes, and scenario version 2 branching workflows without overwriting existing learner history:
```bash
docker compose -f docker-compose.staging.yml exec backend node config/seed.js
```

### Step 5: Execute Automated Staging Smoke Tests
Run the production smoke test suite against the live staging environment:
```bash
node --test server/tests/stagingProductionSmoke.test.js
```

---

## 5. Reverse Proxy, HTTPS & DNS Setup

When deploying to a public VPS:

1. **DNS A Record**:
   - Point `staging.yourdomain.com` to the public IPv4 address of the staging host.
2. **TLS Certificate with Certbot (Let's Encrypt)**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d staging.yourdomain.com
   ```
3. **Nginx Host Configuration** (when running Nginx on the host outside Docker):
   ```nginx
   server {
       server_name staging.yourdomain.com;
       listen 443 ssl http2;
       ssl_certificate /etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/staging.yourdomain.com/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:80; # Forwards to Docker frontend Nginx
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto https;
       }
   }
   ```

---

## 6. Backup, Monitoring & Rollback Procedures

### Automated Backups
1. **Atlas Automated Snapshots**:
   - Ensure daily automated snapshots are enabled in MongoDB Atlas Backup Settings (retained for 7 days minimum).
2. **Manual Cold Backup (`mongodump`)**:
   ```bash
   mongodump --uri="$MONGODB_URI" --archive="backup_$(date +%Y%m%d_%H%M%S).gz" --gzip
   ```
3. **Restoration Protocol (`mongorestore`)**:
   ```bash
   mongorestore --uri="$MONGODB_URI" --archive="backup_file.gz" --gzip --drop
   ```

### Logging & Monitoring
- **Application Logs**: Monitored via `docker compose logs -f backend`. Centralized log collectors (e.g. Datadog, Papertrail, or Loki) can hook into Docker logging drivers.
- **Liveness & Readiness Monitoring**: Set external uptime checkers (e.g. UptimeRobot, Better Uptime) to poll `https://staging.yourdomain.com/api/health` every 60 seconds.

### Rollback Procedure
If a deployment defect is identified in staging:
1. **Container Rollback**:
   Re-deploy the previous known-good Git commit:
   ```bash
   git checkout <PREVIOUS_COMMIT_SHA>
   docker compose -f docker-compose.staging.yml up -d --build
   ```
2. **Database Rollback**:
   Since database seed scripts and migrations are strictly non-destructive and backward-compatible, code rollback can occur without requiring database state rewinds unless corrupted data was introduced. If necessary, restore snapshot via Atlas Point-in-Time Recovery (PITR).

---

## 7. Staging End-to-End Acceptance Checklist (18 Verification Points)

Every item below must be verified on the staging deployment with concrete evidence recorded before declaring production readiness:

| # | Test Item | Verification Procedure | Expected Outcome | Required Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **DNS & HTTPS** | Visit staging URL via browser and run `curl -I https://staging.domain` | HTTP 200, valid SSL certificate, HSTS header present (`max-age=31536000`). | Screenshot of browser padlock + cURL header output. |
| **2** | **Registration & Login** | Register new account `test_learner@staging.test`, log out, log back in. | JWT issued in localStorage, redirected to `/dashboard`. Duplicate email rejected. | HTTP 200 response with `token` payload; database document created. |
| **3** | **Auth & Session Isolation** | Verify unauthenticated request to `/api/progress` returns 401. Log in as Learner B and attempt to access Learner A's session. | Returns HTTP 401 (unauthenticated) and HTTP 403 (cross-user access forbidden). | HTTP status codes 401 and 403 in network tab. |
| **4** | **Dashboard Data** | Load `/dashboard` for newly registered learner. | Displays Stage 1 of 4, 0 completed lessons, First Check prompt, and empty radar/matrix. | Clean UI render without console errors. |
| **5** | **Baseline Assessment** | Launch and navigate "Your Digital Day" baseline assessment through all 13 stages. | Scenario stages load sequentially; terminal stage displays completion confirmation. | Assessment session document in MongoDB marked `status: 'completed'`. |
| **6** | **Authoritative 6D Scoring** | Complete baseline and inspect API response / database record. | All 6 metrics (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) computed server-side from 0–100. | Server response body contains `behaviourScores` map with all 6 dimensions. |
| **7** | **Adaptive Remediation** | Fetch `/api/progress/remediation` for completed baseline. | Ranks weaknesses by severity multiplier; returns targeted pathway recommendation. | JSON array of recommended pathways matching lowest score dimensions. |
| **8** | **Pathway Progression & Resumption** | Start recommended pathway, complete case study, reload page, complete practical prevention. | Progress persists across page refresh; resume step accurately reflects current stage. | MongoDB `userprogress` document contains completed step records. |
| **9** | **Checkpoint Evaluation** | Submit pathway checkpoint quiz with passing score ($\ge 70\%$). | Checkpoint graded; returns passing verdict; marks pathway `completedAt`. | JSON response `{ passed: true, score: ..., completedAt: ... }`. |
| **10** | **Knowledge Quizzes** | Take public quiz from `/quizzes` (e.g. Phishing Prevention). | Graded server-side; displays correct/incorrect answers with legal explanations. | Quiz result recorded in user quiz history table. |
| **11** | **Spaced Retrieval** | Advance clock or verify due review check via `/api/progress/reviews`. | Shows follow-up review for completed pathway; delivers review question; scores response. | Review item marked completed with next interval calculated. |
| **12** | **Final Assessment** | Complete branching Final Assessment (v2) with divergent choices. | Evaluates dynamic path (Safe 8A vs Risky 8B); calculates final 6-metric profile. | Final session marked completed with authoritative metrics in MongoDB. |
| **13** | **Behavioral Trajectory** | Load `/dashboard` and inspect "How Your Decisions Change" section. | 6-axis radial graph shows Baseline vs Final overlay; matrix displays habit shifts. | Visual rendering of SVG radial graph with 6 dimension buttons. |
| **14** | **Defensive Portfolio & PDF** | Navigate to `/record` (Portfolio) and trigger "Print Learning Record". | Renders three pillars (Interventions, Knowledge, Trajectory); print CSS formats cleanly. | PDF preview generated without clipped containers or missing charts. |
| **15** | **Admin RBAC & Privacy** | Log in as non-admin (403 on `/api/admin/*`); log in as Admin; view cohort analytics. | Non-admin blocked; Admin sees cohort summary; averages suppressed if $<5$ distinct users. | Admin dashboard renders; cohort suppression indicator displays when users $<5$. |
| **16** | **CORS, Rate Limiting & Headers** | Send cross-origin request from unlisted domain; send 25 rapid login attempts. | Untrusted origin receives 403 `CORS_FORBIDDEN`; request 21 receives 429 `RateLimit-Exceeded`. | HTTP 403 and HTTP 429 responses with `Retry-After` headers. |
| **17** | **MongoDB Disconnection & Recovery** | Temporarily pause MongoDB connection or block port; poll `/api/health`. | `/api/health` returns HTTP 503 (`status: degraded`). When restored, returns HTTP 200 (`healthy`). | Server logs show `Mongoose connection lost` followed by `reconnected`. |
| **18** | **Restart & Persistence** | Restart container via `docker compose restart backend`; reload learner dashboard. | Server boots cleanly; learner sessions, progress, scores, and portfolio intact. | All historical assessment sessions and progress data fully intact. |

