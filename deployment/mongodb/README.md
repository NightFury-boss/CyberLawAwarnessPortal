# MongoDB Atlas Deployment Architecture & Security Guard

This directory documents the database architecture, network access requirements, and fail-closed isolation guards for MongoDB Atlas.

---

## 1. Architectural Overview

MongoDB Atlas provides a fully managed cloud document database:
* **Staging Tier**: Atlas Free Shared Cluster (**M0 Sandbox**, 512 MB storage, shared RAM/vCPU).
* **Production Tier**: Dedicated or shared Atlas cluster with automated backups.
* **Dedicated Staging Database**: Staging instances connect strictly to the isolated database namespace **`cyber_law_staging`**.

---

## 2. Fail-Closed Staging Database Guard

To prevent human configuration errors from ever routing staging or testing traffic to production databases, the backend enforces an invariant boot-time guard:
* Guard Implementation: [`server/config/stagingDatabaseGuard.js`](../../server/config/stagingDatabaseGuard.js)
* Guard Contract Suite: [`server/tests/stagingDatabaseGuard.test.js`](../../server/tests/stagingDatabaseGuard.test.js)

**Enforcement Rules & Guard Scope:**
1. When `ASSERT_STAGING_DB="true"`, the database connection string must explicitly validate the **database name** against `APPROVED_STAGING_DATABASE_NAMES` (or exact `EXPECTED_STAGING_DB_NAME`) and rejects production keywords (`cyber_law_portal`, `prod`, `live`, `master`, `primary`).
2. **Cluster Host Qualification:** The runtime guard validates the Atlas cluster **hostname only when `EXPECTED_STAGING_HOST` is explicitly configured**. Because database-name matching alone does not guarantee cluster/account isolation if an identical DB name exists elsewhere, operators **must** set `EXPECTED_STAGING_HOST` for strict cluster checks and independently verify staging cluster hosts and least-privilege database credentials.
3. For dedicated staging initialization scripts (`initializeStagingDatabase.js`, `createStagingAdmin.js`, `rollbackStagingInitialization.js`), `EXPECTED_STAGING_HOST` and `EXPECTED_STAGING_DB_NAME=cyber_law_staging` are mandatory via [`stagingInitGuard.js`](../../server/config/stagingInitGuard.js).

---

## 3. Dynamic IP Ingress (`0.0.0.0/0`) on Render Free Tier

Render Free Web Services execute on dynamic multi-tenant cloud infrastructure without dedicated static egress IP addresses.
* **Atlas Configuration Requirement**: Atlas Network Access must permit ingress from `0.0.0.0/0` (Allow Access from Anywhere).
* **Defense-in-Depth Model**:
  - SCRAM-SHA-256 database user authentication with unguessable 24+ character passwords.
  - Zero production data stored in the staging database (`cyber_law_staging`).
  - Mandatory TLS 1.3 encrypted transport (`mongodb+srv://`).
  - Least-privilege user permissions scoped exclusively to `cyber_law_staging`.

For complete step-by-step setup, see [**Free-Tier Staging Deployment Guide**](../../docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md).

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
