# Phase 3: Targeted Remediation & Micro-Learning Pathways — Research

## 1. Domain & Problem Analysis
Following the completion of the Authoritative Six-Metric Migration, users receive their 6 normalized behavioral metrics (`TR`, `SI`, `VB`, `DQ`, `FP`, `UA`) without artificial composite scores.
Currently, after viewing their habit profile (Baseline) or habit shift (Final), there is no structured guidance pointing them to specific learning resources that address their individual weaknesses.

### Core Objectives for Phase 3:
1. **Dynamic Metric Evaluation:** Analyze the user's latest 6-metric profile and identify the 1–2 lowest scoring behavioral dimensions (or any metric $< 75\%$).
2. **Pedagogical Mapping:** Map each of the 6 dimensions directly to existing portal content (Case Studies, Crimes Library, Cyber Law Provisions, Prevention Guidelines).
3. **Calm Guidance UI:** Present targeted micro-learning cards on:
   - `BaselineAssessment.jsx` (immediate post-baseline recommendation: "Targeted Focus Before Your Day Continues")
   - `FinalAssessment.jsx` (post-final reinforcement: "Habit Maintenance Pathways")
   - `Dashboard.jsx` (persistent recommendation banner based on current completion status)
4. **Deep Linking:** Provide seamless navigation to specific case studies, crime entries, law provisions, or practice quizzes with pre-focused state.

---

## 2. Six-Metric Pedagogical Mapping Matrix

| Metric Dimension | Core Behavioral Vulnerability | Recommended Case Study | Relevant Law Provision | Micro-Lesson Focus & Practical Rule | Target Route |
|---|---|---|---|---|---|
| **Threat Recognition (TR)** | Missing disguised lures in routine communications (courier, lottery, salary). | "The Courier Delivery Trap (Smishing)" | IT Act Sec 66D (Cheating by personation) | How to spot unsolicited delivery SMS and unexpected notifications. | `/cases?id=courier-trap` or `/crimes?id=phishing` |
| **Signal Identification (SI)** | Failing to inspect lookalike domains, fake headers, and urgency cues. | "The Fake Job Offer (Recruitment Fraud)" | BNS Sec 318 / 319 (Cheating & Personation) | Domain syntax analysis (`.gov.in` vs `.in-track.org`), upfront fee traps. | `/cases?id=job-fraud` or `/crimes?id=financial-fraud` |
| **Verification Behaviour (VB)** | In-channel verification (asking the scammer for proof) instead of out-of-band checks. | "The Digital Arrest Coercion (Vishing)" | IT Act Sec 66C & BNS Sec 308 (Extortion) | The Out-of-Band Rule: Always hang up and call official numbers from a secondary device. | `/cases?id=digital-arrest` or `/laws?section=66C` |
| **Decision Quality (DQ)** | Inconsistent digital hygiene, rushed decisions, or deferring critical actions. | "Malware Distribution via Pirated Utilities" | IT Act Sec 43 (Damage to computer systems) | Routine daily digital safety checklist, verified app repositories. | `/prevention#hygiene` or `/crimes?id=malware` |
| **False Positive Control (FP)** | Paranoia/over-reporting legitimate automated bank/system alerts. | "Discerning Legitimate Bank Alerts" | IT Act Sec 72A (Data confidentiality) | Evidence-based triage: identifying legitimate automated headers vs spoofed sender IDs. | `/prevention#triaging` |
| **Unreviewed Acceptance (UA)** | Autopilot clicking, broad permission grants, and UPI collect PIN approvals. | "The UPI Cashback Collect Trap" | DPDP Act Sec 6 (Consent) & IT Act Sec 66C | The Golden UPI Rule: "UPI PIN is ONLY entered to send money, NEVER to receive." | `/cases?id=upi-fraud` or `/laws?section=dpdp-6` |

---

## 3. Architecture & Data Contracts

### 3.1 Remediation Engine: `remediationService.js`
A client-side utility module (`client/src/services/remediationService.js`) exposing:
- `getRecommendedPathways(behaviourScores)`:
  - Input: `{ recognition, signalIdentification, verification, decisionQuality, falsePositive, unreviewedAcceptance }`
  - Logic:
    1. Filter dimensions scoring $< 80\%$ (or lowest 2 if all $\ge 80\%$).
    2. Rank by lowest score first.
    3. Return array of pathway objects:
       ```javascript
       {
         metricKey: 'unreviewedAcceptance',
         metricName: 'Unreviewed Acceptance Control',
         score: 33,
         headline: 'Avoid Autopilot Actions & Protect Your UPI PIN',
         rationale: 'Observed habit of granting broad device permissions and authorizing transactions without reviewing payee VPAs.',
         actionUrl: '/cases#upi-trap',
         actionLabel: 'Explore UPI Case Study',
         legalClause: 'DPDP Act 2023 Section 6 & IT Act 66C',
         readTime: '3 min read'
       }
       ```
- `getPathwayForMetric(metricKey)`: Returns single pathway definition for a given metric.

### 3.2 UI Component: `RemediationCards.jsx`
A reusable, calm React component (`client/src/components/RemediationCards.jsx`):
- Non-punitive editorial presentation adhering to the portal's design tokens.
- Displays dynamic badges (e.g. `Focus Area`, `Recommended Habit`, `3 min read`).
- Provides direct clickable navigation to target learning modules.

---

## 4. Verification & Testing Strategy
- Unit tests for `remediationService.js`:
  - Test ranking algorithm (lowest metric correctly prioritized).
  - Test edge case (perfect scores across all metrics defaults to advanced habit maintenance).
  - Test edge case (missing or partial metric maps gracefully handled).
- Component integration:
  - Test rendering inside `BaselineAssessment.jsx` upon assessment completion.
  - Test rendering inside `FinalAssessment.jsx` upon assessment completion.
  - Test rendering on `Dashboard.jsx` reflecting persisted user progress.
- Build and regression verification:
  - `npm run build --prefix client` builds cleanly with 0 errors.
  - All existing automated test suites (`digitalDay.test.js`, `deltaIsolation.test.js`, `behavioralAuthoritativeResult.test.js`, `api.test.js`) remain 100% passing.
