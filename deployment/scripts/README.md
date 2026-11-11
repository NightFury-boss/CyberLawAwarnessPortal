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
* `MONGODB_URI` does not reference production databases and satisfies staging guards.

### Automated Container Deployment
On a self-hosted VPS, deploy staging updates via:
```bash
# Linux/macOS
./scripts/staging-deploy.sh .env.staging

# Windows PowerShell
.\scripts\staging-deploy.ps1 -EnvFile .env.staging
```

---

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the exhaustive 45-script repository catalogue, see [**Scripts README**](../../scripts/README.md).
