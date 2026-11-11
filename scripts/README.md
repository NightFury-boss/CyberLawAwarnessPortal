# Cyber Law Awareness Portal — Script Catalog & Usage Guide

This directory contains operational tools, deployment runners, database maintenance utilities, and automated browser verification harnesses developed across project milestones.

---

## 1. Operational & Deployment Utilities

| Script | Purpose | Execution Command |
| :--- | :--- | :--- |
| `validate-staging-env.js` | Pre-flight validator checking environment variables, database URI safety, and staging configurations. | `npm run validate:staging` or `node scripts/validate-staging-env.js` |
| `serve_dist.js` | Lightweight static server used by Playwright E2E test suites to serve `client/dist`. | Used automatically by `playwright.config.js` |
| `staging-deploy.sh` | Bash deployment script for Linux/macOS staging environments. | `./scripts/staging-deploy.sh .env.staging` |
| `staging-deploy.ps1` | PowerShell deployment script for Windows staging environments. | `.\scripts\staging-deploy.ps1 -EnvFile .env.staging` |

---

## 2. Database Maintenance & Verification Utilities

| Script | Purpose | Execution Command |
| :--- | :--- | :--- |
| `rollbackJusticeShortcomingsCases.js` | Safe, insert-only rollback utility for the "Cases Where Justice Fell Short" collection. Imported by tests. | `node scripts/rollbackJusticeShortcomingsCases.js --dry-run` |
| `safeOrphanRecovery.js` | Fail-closed utility to preview and purge orphaned synthetic test accounts created during smoke tests. | `node scripts/safeOrphanRecovery.js --run-id <ID> [--confirm]` |
| `preflightDatabaseAudit.js` | Offline Mongoose schema validation for authored case studies before database insertion. | `node scripts/preflightDatabaseAudit.js` |
| `verifyPostSeedDatabase.js` | Validates database collection integrity, counts, and slug uniqueness after seeding. | `node scripts/verifyPostSeedDatabase.js` |

---

## 3. Quality, Accessibility & Release Validation Suites

| Script | Purpose | Execution Command |
| :--- | :--- | :--- |
| `verifyPreBetaRelease.js` | Comprehensive 26-point validation suite testing all 7 public routes and authenticated workspaces. | `node scripts/verifyPreBetaRelease.js` |
| `auditLawsAccessibility.js` | Automated WCAG 2.1 accessibility and contrast scanner for the Laws portal. | `node scripts/auditLawsAccessibility.js` |
| `verify_counterfactual_ui.js` | 13-checkpoint browser verification harness for counterfactual scenarios and consequence progression. | `node scripts/verify_counterfactual_ui.js` |
| `browser_resumption_smoke_test.js` | Validates session resumption, mid-session reloads, and state persistence in live browsers. | `node scripts/browser_resumption_smoke_test.js` |
| `browser_si_smoke_test.js` | Statutory Interpretation decision tree browser validation harness. | `node scripts/browser_si_smoke_test.js` |
| `verifyCasesApi.js` | REST API endpoint validator for case law collections and relationships. | `node scripts/verifyCasesApi.js` |
| `verify_responsive_fixes.js` | Multi-viewport responsive layout checker (mobile 375px/390px, tablet 768px, desktop). | `node scripts/verify_responsive_fixes.js` |
| `verify_closing_cta_viewports.js` | Viewport alignment validator for homepage call-to-action sections. | `node scripts/verify_closing_cta_viewports.js` |
| `testPedagogyOverflow.js` | Content overflow detector for interactive pedagogical cards. | `node scripts/testPedagogyOverflow.js` |
| `reproduceScrollBug.js` | Diagnostic test script for sticky header scroll offset tracking. | `node scripts/reproduceScrollBug.js` |
| `verifyAboutBrowser.js` | About page browser rendering and contrast validation harness. | `node scripts/verifyAboutBrowser.js` |
| `verifyCasesBrowser.js` | Case Studies page browser rendering and filter verification harness. | `node scripts/verifyCasesBrowser.js` |
| `verifyCrimesBrowser.js` | Cyber Crimes catalog browser rendering and modal verification harness. | `node scripts/verifyCrimesBrowser.js` |
| `verifyLawsBrowser.js` | Indian Digital Law Center browser rendering and plain English toggle test. | `node scripts/verifyLawsBrowser.js` |
| `verifyPreventionBrowser.js` | Prevention and Incident Response page browser validation harness. | `node scripts/verifyPreventionBrowser.js` |
| `verifyResourcesBrowser.js` | Official Resources and Helplines directory browser validation harness. | `node scripts/verifyResourcesBrowser.js` |
| `verify_phase2_profile.js` | Digital Awareness Profile visualization and metric calculations validator. | `node scripts/verify_phase2_profile.js` |

---

## 4. Brand Asset Generation & Optical Inspection Tools

These utilities were used during the Brand Identity milestone to generate, vectorize, and validate multi-resolution favicons and official brand logos stored in `client/public/`:

* `build_final_brand_and_favicons.js`: Master favicon generation pipeline.
* `build_brand_identity.js`: Generates SVG brand marks from design specifications.
* `build_brand_svgs.js`: Generates resolution-independent vector assets.
* `build_optics_favicon_suite.js`: Generates multi-resolution raster icons (16px to 512px).
* `clean_monogram_mask.js`: Cleans vector paths for monogram badges.
* `extract_monograms.js` & `extract_initial_crops.js`: Crops and extracts vector marks from source assets.
* `generate_faithful_brand_assets.js`: Faithful asset rendering pipeline.
* `inspect_stacked_and_favicons.js`: Visual verification inspector for generated favicon outputs.
* `use_exact_user_logo.cjs`: Generates client brand assets from approved logo marks.
* `verify_real_browser_favicon.js`: Validates favicon visibility across Chrome and Firefox tabs.
* `analyze_favicon_scale.js` & `analyze_dark_pill.js`: Optical contrast and scale analyzers.
* `audit_computed_styles.js` & `verify_computed_palette.js`: Design token palette validators.
* `capture-dashboard-review.js`, `capture-first-time-experience.js`, `capture-global-colors.js`, `capture_phase3_acceptance.js`: Milestone visual acceptance capture tools.
* `test_dedicated_variants.js`: Diagnostic tool for dedicated variant icons.
* `diagnose_responsive_overflow.js`: Zero-overflow diagnostic inspector.
