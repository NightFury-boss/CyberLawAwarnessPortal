# Changelog

This document tracks all features, architectural changes, visual upgrades, and database modifications made to the **Cyber Law Awareness Portal**.

---

## 🏁 Starting Point (Baseline Status)
The project originated as a standard MERN (MongoDB, Express, React, Node) application featuring basic sections for Cyber Laws, Crimes Library, Case Studies, Prevention Centre, and Admin controls.
* **Architecture:** Traditional client-server model utilizing Mongoose models.
* **UI/UX:** Standard block lists, generic default alerts, and simple quiz loops.
* **CMS Form:** A single linear form for database editing in the admin panel.

---

## 🛠️ Major Changes & Milestones

### 1. Cyber Incident Archive (Case Studies Upgrade)
* **Investigative registry theme:** Restructured the Case Studies tab into an investigative registry for documented attack vectors.
* **Interactive Decision Points:** Integrated "Pause & Choose" situational mockups before revealing the rest of the incident story.
* **Deception ratings & warning signs:** Added detailed panels analyzing attacker objectives and warning markers.
* **Related legal context links:** Connected case studies directly to relevant Information Technology Act sections.

### 2. Indian Digital Law Learning Centre (Cyber Laws Upgrade)
* **Law Compass:** Implemented a scenario-to-provision auditing wizard that maps real situations to legal clauses.
* **Plain vs. Statutory Toggles:** Added side-by-side translation toggles for complex legal provisions.
* **Study bookmarks & notes:** Enabled local storage bookmarking and personal note drafting for student revisions.
* **Admin CMS Tabbed Forms:** Refactored the Admin panel form into structured categories (*Overview*, *Content*, *Metadata*, *Connections*) with status-dependent validation.
* **Database Reset Seeding:** Expanded `seed.js` with 11+ detailed provisions covering BNS 2023, IT Act 2000, DPDP Act 2023, Rules, and Supreme Court judgments.

### 3. About Project Story Redesign
* **Concise Academic Focus:** Streamlined the About page to highlight the project's educational loop, safety boundaries, and stack architecture.
* **Hero connected graph:** Added a connected SVG node flow illustrating how laws translate to safety actions.
* **Differentiators pathway:** Added a visual path comparing traditional learning cycles with the portal's experiential loop.
* **Simulation safety checklists:** Included checklist mappings of data collection limits (e.g. discarding passwords/OTPs).
* **Stack architecture visual:** Created a vertical MERN system model with core modules.

### 4. Navigation & Layout Visual Polish
* **Active Indicator Anchors:** Redesigned `.sidebar .nav-links a` styles to feature a solid `3px` left-border highlight, flat left corners, and updated active backgrounds.
* **SVG incident progression headers:** Embedded interactive stage lines (`Bait ➔ Leverage ➔ Choice ➔ Outcome ➔ Law`) within case audit pages.
* **Timeline upgrades:** Swapped solid timelines for connecting dashed layouts, customized icon symbols, and visual attacker vector ratings.

---

## 📋 How to Document Future Changes
When making updates to the portal, append them to this changelog using the following format:

```markdown
### [YYYY-MM-DD] - [Brief Summary]
* **Category:** (Frontend / Backend / Database)
* **Details:** Explain the problem, proposed solution, and files modified.
* **Verification:** Log testing commands or browser verification notes.
```
