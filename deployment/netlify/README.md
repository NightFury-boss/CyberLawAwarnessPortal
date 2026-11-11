# Netlify Frontend Deployment Architecture

This directory documents the Netlify deployment configuration and operational requirements for the Cyber Law Awareness Portal.

---

## 1. Architectural Overview

Netlify hosts the React 19 single-page application (SPA) client as high-availability static assets distributed across Netlify's global Edge network.

Key architecture features:
* **Base Directory**: `client`
* **Build Command**: `npm run build` (runs Vite production compilation)
* **Publish Directory**: `dist` (resolved by Netlify relative to `client`, yielding `client/dist`)
* **SPA Routing Fallback**: `/* /index.html 200` rewrite rule in both `netlify.toml` and `client/public/_redirects`. Ensures deep-link refreshes (`/quizzes`, `/dashboard`, `/laws`) load `index.html`.

---

## 2. Configuration Files & Root Invariance

* Root Netlify Config: [`netlify.toml`](../../netlify.toml)
* Static Redirects Rule: [`client/public/_redirects`](../../client/public/_redirects)
* Safe Environment Template: [`client/.env.staging.example`](../../client/.env.staging.example)

**Root Location Invariance:**
`netlify.toml` must remain at the repository root. Netlify's build bot inspects the repository root upon git push to discover build commands, environment scopes, redirect rules, and security headers before initiating the containerized build image.

---

## 3. Environment Detection Heuristics

The client application incorporates smart environment detection (`client/src/services/api.js`):
1. **Staging Subdomains**: By default, hostnames matching `*.netlify.app` are treated as staging environments with adaptive 60-second timeouts and warm-up pings.
2. **Production Override**: If a production deployment uses a default Netlify subdomain (`*.netlify.app`), the environment variable `VITE_APP_ENV=production` must be configured in Netlify Site Configuration to guarantee neutral user-facing status messages and standard 15-second timeouts.

For complete step-by-step setup, see [**Free-Tier Staging Deployment Guide**](../../docs/deployment/FREE_TIER_DEPLOYMENT_GUIDE.md).

For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
For the central deployment architecture and provider comparison, return to the [**Deployment Hub**](../README.md).
