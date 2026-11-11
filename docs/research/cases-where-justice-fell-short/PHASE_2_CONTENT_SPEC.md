# Proposed Case-Study Content Specification

**Collection:** Cases Where Justice Fell Short  
**Status:** Editorial proposal, approved as content direction  
**Implementation status:** Not authorized  
**Important:** This is an editorial content specification, not an instruction to create a new database schema or redesign the case-study UI.

## 1. Purpose

Turn the ten approved research cases into consistent, evidence-led learning narratives. Each case should help a learner understand:

- what happened;
- what is established versus alleged;
- what the relevant institution did or failed to do;
- what the court, tribunal, regulator or official record actually decided;
- what legal or procedural lesson follows;
- what a citizen can do differently in a comparable situation.

The collection must not sensationalize harm, overstate legal findings or imply that one case establishes a universal rule.

## 2. Proposed six-part narrative

### Part 1 — Case at a glance
- Clear case title.
- Date range and jurisdiction.
- Relevant institution / court / regulator.
- Collection category.
- Evidence classification and a plain-language explanation of what that label means.
- A short, neutral summary.

### Part 2 — What happened
- Chronological account.
- Relevant actors and systems.
- Concrete amounts, dates and case numbers where supported.
- Avoid unnecessary personal details and graphic descriptions.
- For ongoing or unresolved matters, state the status and avoid a false ending.

### Part 3 — Evidence: established, alleged and unresolved
Use explicit sub-sections or labels:
- **Established by primary record**
- **Alleged by a party / agency**
- **Disputed or not independently verified**
- **Unknown / not publicly available**

Every material claim should map to at least one source-register entry. Statistics must include date, period, definition and attribution.

### Part 4 — Institutional response and outcome
- Police, regulator, bank, platform, government or court response.
- Judicial / tribunal outcome, if any.
- Separate interim orders, provisional attachments, cognizance, chargesheets, acquittals, convictions and final disposal.
- Do not describe an investigation as complete unless the source says so.

### Part 5 — Law and procedural lesson
- Relevant law at the time of the conduct.
- Current legal position, if different.
- Explain transitional provisions where relevant.
- Avoid retroactive application of later laws.
- Distinguish legal admissibility, evidentiary weight, civil compensation, criminal liability, regulatory findings and provisional attachment.

### Part 6 — Practical learning and reflection
- One concise central learning point.
- Two to four practical actions or warning signs appropriate to the case.
- A short reflection prompt or decision point where pedagogically useful.
- Do not invent a legal remedy or promise a guaranteed outcome.
- For emergency financial fraud, direct learners to the official 1930 / NCRP reporting channel while avoiding claims of guaranteed recovery.

## 3. Evidence classification vocabulary

Use only the approved collection vocabulary:

- **Established Institutional Failure:** A specific institution's failure is supported by a judicial, tribunal or other sufficiently authoritative finding. Always state the scope of that finding.
- **Documented Procedural Shortcoming:** A specific process, inquiry, communication or evidence-handling shortcoming is documented, without asserting broader institutional guilt.
- **Unresolved Incident:** Material attribution, cause or outcome remains unestablished.

Do not use the label as a generic severity score. The classification is editorial and evidence-based, not a legal verdict.

## 4. Collection taxonomy

| Category | Cases |
|---|---|
| Investigative & Evidentiary Gaps | 01, 08 |
| Banking & Regulatory Inquiries | 02, 04, 09 |
| Platform & Marketplace Lags | 03, 05 |
| Critical Infrastructure & Complex Attribution | 06, 07, 10 |

## 5. Suggested content metadata (proposal only)

The following are conceptual fields for mapping to the existing model after inspection. They are not approved schema names:

- case title and stable slug;
- collection identifier;
- collection category;
- evidence classification;
- date range;
- jurisdiction;
- involved authorities;
- summary;
- six narrative sections;
- established facts;
- allegations / disputed claims;
- unresolved questions;
- legal provisions at time of event;
- current-law explanation;
- practical learning points;
- source references;
- source verification status;
- last reviewed date;
- editorial status.

Antigravity must inspect the current Mongoose `CaseStudy` model, seed data, API response contract and `Cases.jsx` before proposing any data migration. Reuse existing fields where possible. Avoid duplicating data that can be derived or represented through the existing model.

## 6. Source model and citations

Each claim with legal or factual significance must have a traceable source. The source register should preserve:
- official document title;
- issuing body;
- date;
- case / question / report number;
- official URL;
- pinpoint paragraph, page or table;
- which claim it supports;
- whether it is a primary or secondary source;
- whether the source is current, superseded, sealed or otherwise limited.

A case may cite multiple sources. Do not attach a single generic source to an entire long narrative if different claims depend on different documents.

## 7. Accessibility and interaction principles

- Keep text readable and scannable.
- Distinguish facts from allegations with labels and text, not color alone.
- Provide keyboard-accessible controls and visible focus.
- Do not hide essential legal caveats in tooltips.
- Avoid excessive animation, sensational imagery or punitive gamification.
- Preserve responsive behavior and the existing navigation / route boundaries.
- Any interactive decision point must have a clear educational purpose and must not imply that a learner's choice changes the real-world legal outcome.

## 8. Editorial acceptance checklist

A case is publishable only when:
- [ ] title, date and jurisdiction are accurate;
- [ ] classification is consistent with the Product Owner decision;
- [ ] all material claims are sourced;
- [ ] facts, allegations, submissions and inferences are separated;
- [ ] monetary and statistical figures include definitions and cut-off dates;
- [ ] historical and current laws are distinguished;
- [ ] procedural status is current or explicitly caveated;
- [ ] privacy and pseudonymization safeguards are satisfied;
- [ ] practical learning point is accurate and non-misleading;
- [ ] source-register links resolve to the cited primary documents or are clearly marked outstanding.

## 9. Do not expand scope

This specification does not authorize:
- broad visual redesign;
- a new case-study navigation system;
- changes to the assessment engine;
- changes to the six behavioral metrics;
- changes to historical published scenarios;
- new AI-generated legal conclusions;
- new legal-advice functionality;
- a new source-management subsystem without an approved design proposal.
