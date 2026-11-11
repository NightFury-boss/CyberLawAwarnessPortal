# Engineering & Editorial Conventions

This document establishes the official coding standards, architectural invariants, visual design rules, and legal content guidelines for the Cyber Law Awareness Portal.

---

## 1. Visual Identity & Aesthetic Philosophy

### The Constitutional Atelier (Forest Cream v1.1)
The Cyber Law Awareness Portal uses an editorial, institutional, and calm aesthetic inspired by constitutional legal texts and academic archives.

- **Canvas & Surfaces**:
  - Main Canvas: `#F9F5E6` (`--color-background`)
  - Elevated Cards: `#FFFDF8` (`--color-surface-card`)
  - Inset Panels: `#EEF4F0` (`--color-surface-inset`)
  - Neutral Borders: `#D9CBB1` (`--color-border`)
- **Typography & Ink**:
  - Primary Text: `#26352B` (`--color-text-primary`)
  - Secondary Text: `#4B554A` (`--color-text-secondary`)
  - Muted Text: `#535C52` (`--color-text-muted`)
- **Editorial Accents**:
  - Forest Green: `#1F4D3A` (`--color-accent-forest`)
  - Terracotta: `#805B43` (`--color-accent-terracotta`)
  - Gold Highlight: `#F6E39A` (`--color-accent-gold`)

### Strict Design Tropes to Avoid
- **No Cyberpunk or Neon**: Do not use dark neon cyan/green, glowing scanlines, glitch effects, or matrix aesthetics.
- **No Flashy Gamification**: Do not introduce arcade sounds, confetti explosions, or frivolous badges. Keep gamification respectful and educationally rigorous.
- **No Generic SaaS Clichés**: Avoid loud gradient buttons, floating glassmorphic blobs, and bloated whitespace.

---

## 2. Legal Content & Plain Language Standards

1. **Statutory Accuracy**:
   - Legal references must be verified against primary Indian statutes:
     - Information Technology Act, 2000 (as amended).
     - Digital Personal Data Protection Act, 2023 (DPDP).
     - Bharatiya Nyaya Sanhita, 2023 (BNS).
   - Accurately state repealed vs. active provisions (e.g. IPC replaced by BNS).
   - Explicitly highlight unconstitutional provisions (e.g. IT Act Section 66A struck down in *Shreya Singhal v. Union of India (2015)*).
2. **Plain English Comparative Interpretation**:
   - Present statutory text alongside plain-language explanations without distorting the legal standard.
   - Use plain, active phrasing (e.g. "Unauthorized access to computer systems" rather than archaic legalisms).
3. **Emergency Reporting Protocol**:
   - Prioritize National Cybercrime Helpline **1930** and portal `cybercrime.gov.in`.
   - Explain the 2–3 hour **Golden Hour** and inter-bank coordination (CFCFRMS) accurately without guaranteeing fund recovery.
4. **Mandatory Educational Disclaimer**:
   - Content provides educational awareness and does NOT constitute formal legal counsel.

---

## 3. Engineering & Code Quality Invariants

1. **Server-Authoritative Evaluation**:
   - The browser never calculates scores or mutates assessment outcomes.
   - All 6 dimensions (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) are strictly computed on the backend.
2. **Idempotency & Concurrency**:
   - Submissions must supply an `idempotencyKey` and check session versions.
   - Mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) must NEVER be retried automatically.
3. **Fail-Closed Security**:
   - Missing required configuration (JWT secrets, staging database names) must halt server boot immediately.
   - Staging environments must enforce `ASSERT_STAGING_DB=true`.
4. **Component Modularization**:
   - Place shell layout components under `client/src/components/layout/`.
   - Re-export facades should be maintained when reorganizing shared component paths to avoid breaking downstream consumers.
