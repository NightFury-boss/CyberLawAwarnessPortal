# Cyber Law Awareness Portal — Deployment Hub

Welcome to the central deployment architecture and infrastructure reference for the Cyber Law Awareness Portal.

This directory and its subdirectories explain the configuration, discovery mechanisms, environment templates, and operational runbooks for all supported deployment environments.

---

## 1. Supported Deployment Architectures

The portal supports two distinct production-grade deployment architectures:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURE A: Decoupled Zero-Cost Cloud Staging (Netlify + Render + Atlas M0)  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Client SPA (Netlify)            Backend API (Render)         Database (Atlas)  │
│   ┌────────────────────┐          ┌───────────────────┐        ┌──────────────┐  │
│   │  React 19 + Vite   │──(HTTPS)─▶  Node.js + Express│──(TLS)─▶  MongoDB M0  │  │
│   │  *.netlify.app     │◀─────────│  *.onrender.com   │◀───────│  (Dedicated  │  │
│   └────────────────────┘  (CORS)  └───────────────────┘        │   Staging DB)│  │
│                                   (Cold-Start Aware)           └──────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ARCHITECTURE B: Self-Hosted Containerized Production (Docker Compose + VPS)      │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Host Nginx Reverse Proxy (SSL / TLS 1.3 Termination)                           │
│   ┌──────────────────────────────────────────────────────────────────────────┐   │
│   │  upstream: 127.0.0.1:8080 (Frontend)  |  upstream: 127.0.0.1:5000 (API)  │   │
│   └──────────────────────────────────────────────────────────────────────────┘   │
│          │                                          │                            │
│          ▼ (Port 80)                                ▼ (Port 5000)                │
│   ┌────────────────────┐                     ┌────────────────────┐              │
│   │  cyberlaw_frontend │                     │  cyberlaw_backend  │              │
│   │  (Alpine + Nginx)  │                     │  (Node.js Alpine)  │              │
│   └────────────────────┘                     └────────────────────┘              │
│          │                                          │                            │
│          └───────────────── bridge network ─────────┘                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Provider Guides

Platform-specific architecture documentation and configuration guides are organized as follows:

| Directory | Scope | Configuration Files Referenced |
| :--- | :--- | :--- |
| [**`docker/`**](./docker/README.md) | Self-hosted Docker Compose, VPS, container builds, and Nginx. | `docker-compose.staging.yml`, `client/Dockerfile`, `server/Dockerfile`, `nginx/staging.conf` |
| [**`netlify/`**](./netlify/README.md) | Static SPA hosting, rewrite rules, and environment detection. | `netlify.toml`, `client/public/_redirects` |
| [**`render/`**](./render/README.md) | Node.js web services, Blueprint discovery, and cold starts. | `render.yaml`, `server/server.js` |
| [**`mongodb/`**](./mongodb/README.md) | Atlas M0 cluster setup, staging namespace, and fail-closed guard. | `server/config/stagingDatabaseGuard.js`, `server/config/db.js` |
| [**`scripts/`**](./scripts/README.md) | Deployment pre-flight, validation, and container automation scripts. | `scripts/validate-staging-env.js`, `scripts/staging-deploy.sh`, `scripts/staging-deploy.ps1` |

---

## 3. Path-by-Path Deployment Asset Inventory & Location Rationale

Every deployment configuration file and template has a verified technical justification for its exact filesystem location:

| File / Asset | Authoritative Location | Classification | Location Rationale & Constraints |
| :--- | :--- | :--- | :--- |
| **`render.yaml`** | Repository root | **Retained at root** | Render Blueprint Infrastructure-as-Code strictly requires `render.yaml` at repository root for Blueprint sync and auto-deploy declaration. |
| **`netlify.toml`** | Repository root | **Retained at root** | Netlify build bot discovers root `netlify.toml` to configure client base directory (`client`), build command (`npm run build`), and edge redirect rules. |
| **`docker-compose.staging.yml`** | Repository root | **Retained at root** | Docker Compose service build contexts (`./server`, `./client`) and automation scripts (`staging-deploy.sh`, `staging-deploy.ps1`) require root evaluation. |
| **`.dockerignore`** | Repository root | **Retained at root** | Defines build ignore patterns for Docker daemon executing builds from the repository root. |
| **`nginx/staging.conf`** | `nginx/staging.conf` | **Retained in `nginx/`** | Host Nginx reverse proxy template for self-hosted VPS, referenced by VPS provisioning documentation. |
| **`.env.staging.example`** | Repository root | **Retained at root** | Safe template for root Docker Compose staging environment variables (`docker compose --env-file .env.staging`). |
| **`client/.env.example`** | `client/.env.example` | **Retained in `client/`** | Safe development environment template for Vite frontend client. |
| **`client/.env.staging.example`**| `client/.env.staging.example`| **Retained in `client/`** | Safe staging environment template for Netlify deployment (`VITE_API_URL`, `VITE_APP_ENV`). |
| **`server/.env.example`** | `server/.env.example` | **Retained in `server/`** | Safe development environment template for Node.js Express backend. |
| **`server/.env.staging.example`**| `server/.env.staging.example`| **Retained in `server/`** | Safe staging environment template for Render deployment (`ASSERT_STAGING_DB`, `EXPECTED_STAGING_DB_NAME`). |
| **`scripts/staging-deploy.sh`** | `scripts/` | **Retained in `scripts/`** | Shell deployment script for Linux/macOS staging, catalogued in `scripts/README.md`. |
| **`scripts/staging-deploy.ps1`**| `scripts/` | **Retained in `scripts/`** | PowerShell deployment script for Windows staging, catalogued in `scripts/README.md`. |
| **`scripts/validate-staging-env.js`**| `scripts/` | **Retained in `scripts/`** | Pre-flight validator executed via root `npm run validate:staging`. |
| **`docs/deployment/`** | `docs/deployment/` | **Authoritative Docs** | Contains step-by-step runbooks: `FREE_TIER_DEPLOYMENT_GUIDE.md` and `DOCKER_VPS_DEPLOYMENT.md`. |
| **`deployment/`** | `deployment/` | **Infrastructure Hub** | Central architectural reference and provider guides (`docker/`, `netlify/`, `render/`, `mongodb/`, `scripts/`). |

---

## 4. Environment Configuration & Safe Templates

No live credentials or unmasked connection strings are ever committed to git. Use the following safe template files:

| Template File | Purpose | Key Variables |
| :--- | :--- | :--- |
| [`.env.staging.example`](../.env.staging.example) | Root staging environment template. | `STAGING_HOST_BIND`, `STAGING_PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` |
| [`client/.env.example`](../client/.env.example) | Client development environment template. | `VITE_API_URL` |
| [`client/.env.staging.example`](../client/.env.staging.example) | Client staging environment template. | `VITE_API_URL`, `VITE_APP_ENV=staging`, `VITE_COLD_START_THRESHOLD_MS=2500` |
| [`server/.env.example`](../server/.env.example) | Server development environment template. | `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` |
| [`server/.env.staging.example`](../server/.env.staging.example) | Server staging environment template. | `PORT`, `NODE_ENV=production`, `ASSERT_STAGING_DB=true`, `EXPECTED_STAGING_DB_NAME=cyber_law_staging` |

---

## 5. Health Checks & Cold-Start Strategy

1. **Backend Health Endpoint (`/api/health`)**:
   - Responds with `HTTP 200 { status: 'healthy', database: 'connected' }` when Mongoose is active.
   - Responds with `HTTP 503 { status: 'degraded', database: 'disconnected' }` without leaking connection secrets when database is disconnected.
2. **Render Cold-Start Lifecycle**:
   - Render spins down inactive containers after **15 minutes**.
   - Container wake latency is **30–50 seconds**.
   - The frontend API client automatically applies an adaptive **60-second timeout**, issues background health probes on mount, and surfaces an editorial status notice via `<ColdStartNotice />`.

---

## 6. Authoritative Step-by-Step Runbooks

For end-to-end deployment instructions, consult the step-by-step guides in the documentation hub:

* 📖 [**Free-Tier Staging Deployment Guide (Netlify + Render + Atlas)**](../docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md)
* 📖 [**Docker & VPS Production Deployment Guide**](../docs/deployment/DOCKER_VPS_DEPLOYMENT.md)
