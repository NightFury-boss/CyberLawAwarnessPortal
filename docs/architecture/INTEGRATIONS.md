# Service Integrations & Platform Specifications

This document outlines the hosting platforms, third-party services, and runtime tools integrated with the Cyber Law Awareness Portal.

---

## 1. Frontend: Netlify Platform Integration

- **Role**: High-availability static single-page application (SPA) hosting and asset distribution.
- **Repository Root Config**: `netlify.toml`
  - Base Directory: `client`
  - Build Command: `npm run build`
  - Publish Directory: `dist` (interpreted as `client/dist`)
- **SPA Rewrite Handling**:
  - `/* /index.html 200` rewrite rule configured in both `netlify.toml` and `client/public/_redirects`.
  - Guarantees direct browser reloads on deep routes (`/dashboard`, `/quizzes`, `/laws`) serve `index.html`.
- **Environment Detection Heuristics**:
  - The client API automatically treats `*.netlify.app` subdomains as staging unless explicitly overridden.
  - **Production Requirement**: For production sites deployed on default `*.netlify.app` subdomains, `VITE_APP_ENV=production` must be configured in Netlify Site Configuration to guarantee neutral user-facing status messages and standard 15-second timeouts.

---

## 2. Backend: Render Free Web Service Integration

- **Role**: Node.js + Express API backend hosting.
- **Repository Root Config**: `render.yaml`
  - Blueprint Type: `web`
  - Plan: `free`
  - Root Directory: `server`
  - Build Command: `npm install`
  - Start Command: `node server.js`
  - Health Check Endpoint: `/api/health`
- **Inactivity Spin-Down & Cold Starts**:
  - Render spins down free containers after **15 minutes of inactivity**.
  - Waking requests incur **30 to 50 seconds** of container boot and connection handshake latency.
  - The frontend client accommodates this via an adaptive 60-second timeout, `ColdStartNotice` status notifications, and background health pings on mount.
- **Reverse Proxy Trust**:
  - Express runs behind Render's single-hop TLS terminating proxy.
  - Handled via `TRUST_PROXY=1` (`app.set('trust proxy', 1)`).

---

## 3. Database: MongoDB Atlas (M0 Sandbox & Production)

- **Role**: Cloud-hosted document datastore.
- **Staging Namespace**: Dedicated namespace **`cyber_law_staging`**.
- **Fail-Closed Guard**:
  - Enforced via `ASSERT_STAGING_DB="true"` and `EXPECTED_STAGING_DB_NAME=cyber_law_staging`.
  - Halts process boot if connection string references production databases (`cyber_law_portal` or names containing `prod`, `live`, or `master`).
- **Dynamic IP Ingress Requirement (`0.0.0.0/0`)**:
  - Render's free tier runs on dynamic multi-tenant infrastructure without static egress IPs.
  - Atlas Network Access must permit `0.0.0.0/0`.
  - Defense-in-depth is maintained by zero production data, SCRAM-SHA-256 authentication, 24+ char unguessable passwords, TLS 1.3 encryption, and least-privilege scoping to the staging database.
