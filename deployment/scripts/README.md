# Deployment & Staging Validation Scripts

This directory documents the deployment automation scripts and staging environment validators used across deployment workflows.

---

## 1. Script Catalog

| Script | Path | Language | Purpose |
| :--- | :--- | :--- | :--- |
| `validate-staging-env.js` | [`scripts/validate-staging-env.js`](../../scripts/validate-staging-env.js) | Node.js | Pre-flight validator evaluating environment variable formatting, database isolation guards, and staging URLs. |
| `staging-deploy.sh` | [`scripts/staging-deploy.sh`](../../scripts/staging-deploy.sh) | Bash | Automated container deployment and restart script for Linux VPS staging environments. |
| `staging-deploy.ps1` | [`scripts/staging-deploy.ps1`](../../scripts/staging-deploy.ps1) | PowerShell | Automated container deployment and restart script for Windows staging environments. |
| `serve_dist.js` | [`scripts/serve_dist.js`](../../scripts/serve_dist.js) | Node.js | Static web server used by Playwright E2E suites to serve client production builds locally. |

---

## 2. Usage Examples

### Pre-flight Environment Validation
Before deploying to staging or booting production containers, execute the pre-flight validator:
```bash
npm run validate:staging
```
Checks verified:
* `NODE_ENV === 'production'`
* `JWT_SECRET` is defined, non-default, and at least 32 characters.
* `CLIENT_URL` is a valid HTTPS or approved staging URL.
* `MONGODB_URI` is validated against `assertApprovedStagingDatabase` **before** attempting `mongoose.connect()` (`STAGING_DB_GUARD`), rejecting production or unapproved database targets fail-closed before any handshake. (Set `EXPECTED_STAGING_HOST` as well to bind cluster host validation.)

### Automated Container Deployment
*(Secondary self-hosted Docker/VPS workflow — distinct from the active Netlify + Render cloud staging flow in [`FREE_TIER_DEPLOYMENT_GUIDE.md`](../../docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md).)*

On a self-hosted VPS, deploy staging updates via:
```bash
# Linux/macOS (probes frontend published address 127.0.0.1:${STAGING_PORT:-8080}/api/health when Docker Compose is used)
./scripts/staging-deploy.sh server/.env.staging

# Windows PowerShell
.\scripts\staging-deploy.ps1 -EnvFile server/.env.staging
```

---

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the exhaustive 45-script repository catalogue, see [**Scripts README**](../../scripts/README.md).
