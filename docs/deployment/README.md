# Cyber Law Awareness Portal — Deployment Documentation Index

This directory contains the definitive, step-by-step operational runbooks for deploying the Cyber Law Awareness Portal across supported environments.

---

## Authoritative Deployment Runbooks

| Runbook | Architecture | Target Platform | Description |
| :--- | :--- | :--- | :--- |
| [**Free-Tier Staging Deployment Guide**](./FREE_TIER_DEPLOYMENT_GUIDE.md) | **Decoupled Jamstack + Microservice** | **Netlify + Render + MongoDB Atlas** | Definitive 10-step zero-cost staging runbook, cold-start handling, CORS synchronization, and environment variable configuration. |
| [**Docker & VPS Deployment Guide**](./DOCKER_VPS_DEPLOYMENT.md) | **Containerized Monorepo** | **Docker Compose / VPS / Nginx** | Production container orchestration, multi-stage builds, reverse proxy configuration, and multi-tenant hosting. |

---

## Related Specifications & Infrastructure Hubs

- [**System Deployment Hub**](../../deployment/README.md): Architecture specifications, platform requirements, and provider configuration guides.
- [**Service Integrations Specification**](../architecture/INTEGRATIONS.md): Technical integration contracts for Netlify, Render, and MongoDB Atlas.
- [**Deployment Scripts**](../../scripts/README.md#1-operational--deployment-utilities): Pre-flight validation and container deployment automation.
- [**Deployment Audit Archive**](../audits/archive/): Historical readiness reviews and safety evaluation records.
