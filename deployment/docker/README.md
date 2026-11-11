# Docker & VPS Deployment Architecture

This directory documents the containerized deployment architecture for the Cyber Law Awareness Portal.

---

## 1. Architectural Overview

The Docker Compose configuration (`docker-compose.staging.yml`) runs two production containers on a private bridge network (`staging_network`):
1. **`cyberlaw_backend_staging`**: Node.js 20 Alpine container running Express API on internal port 5000.
2. **`cyberlaw_frontend_staging`**: Multi-stage build (Node.js build stage -> Nginx unprivileged Alpine runtime) serving optimized Vite static bundles on port 80, mapped to `127.0.0.1:8080` on the host.

---

## 2. File Locations & Root Invariance

The Docker Compose file remains at the repository root:
* Root Compose File: [`docker-compose.staging.yml`](../../docker-compose.staging.yml)
* Client Container Spec: [`client/Dockerfile`](../../client/Dockerfile)
* Client Nginx Spec: [`client/nginx.conf`](../../client/nginx.conf)
* Server Container Spec: [`server/Dockerfile`](../../server/Dockerfile)
* Host Nginx Reverse Proxy Config: [`nginx/staging.conf`](../../nginx/staging.conf)

**Root Location Invariance:**
`docker-compose.staging.yml` must remain at the repository root because:
1. Compose service build contexts (`./server` and `./client`) require root evaluation to access directory structures cleanly without relative context escalation (`../`).
2. Deployment automation scripts (`scripts/staging-deploy.sh`, `scripts/staging-deploy.ps1`) reference `docker-compose.staging.yml` directly from the repository root.

---

## 3. Operational Commands

```bash
# Validate staging environment
npm run validate:staging

# Build and start staging containers in background
docker compose -f docker-compose.staging.yml up -d --build

# View real-time container logs
docker compose -f docker-compose.staging.yml logs -f

# Verify service health status
docker compose -f docker-compose.staging.yml ps
```

For complete VPS provisioning, TLS certificate issuance, and Nginx configuration, see [**Docker & VPS Deployment Guide**](../../docs/deployment/DOCKER_VPS_DEPLOYMENT.md).

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
