# Render Backend Web Service Deployment Architecture

This directory documents the Render deployment configuration and operational requirements for the Cyber Law Awareness Portal.

---

## 1. Architectural Overview

Render hosts the Node.js + Express API backend as an auto-managed Web Service.

Key architecture features:
* **Blueprint Specification**: Defined declaratively via `render.yaml`.
* **Root Directory**: `server`
* **Build Command**: `npm install`
* **Start Command**: `node server.js`
* **Health Check Path**: `/api/health`
* **Proxy Trust**: Express runs behind Render's single-hop TLS reverse proxy. Configured via `TRUST_PROXY=1` (`app.set('trust proxy', 1)`).

---

## 2. Configuration Files & Root Invariance

* Root Render Blueprint: [`render.yaml`](../../render.yaml)
* Server Environment Template: [`server/.env.staging.example`](../../server/.env.staging.example)
* Express Health Endpoint: [`server/server.js`](../../server/server.js)

**Root Location Invariance:**
Render Blueprint Infrastructure-as-Code strictly requires `render.yaml` to be located in the repository root. When creating a Blueprint instance, Render scans the repository root for `render.yaml`. Moving this file breaks Render Blueprint discovery and automated sync.

---

## 3. Inactivity Spin-Down & Cold-Start Strategy

Render spins down free-tier instances after **15 minutes of inactivity**.
* **Wake Latency**: Initial cold-start requests take between **30 to 50 seconds** while the container boots and connects to MongoDB Atlas.
* **Frontend Adaptation**:
  - The frontend client extends its timeout to **60 seconds** when in staging or when awaiting wake-up.
  - An unobtrusive `<ColdStartNotice />` banner informs users that the free backend is waking up.
  - Background health pings on page load proactively warm the container before user interactions.
  - Proxy-generated errors (HTTP 502/503/504) are treated as transient cold starts and safely retried for non-mutating `GET` requests.

For complete step-by-step setup, see [**Free-Tier Staging Deployment Guide**](../../docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md).

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
