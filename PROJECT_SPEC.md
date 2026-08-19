# Project Blueprint: Cyber Law Awareness Portal

This document serves as an exhaustive, structured blueprint of the **Cyber Law Awareness Portal**. It defines the architecture, database schemas, interactive state machines, design languages, and recreation pathways so that any developer or AI agent can reconstruct the entire application from scratch.

---

## 1. Project Vision & Goals
* **Objective:** Bridge the gap between theoretical legislation and practical digital safety by connecting Indian Cyber Laws (IT Act, BNS, DPDP) to threat profiles and real-world incidents.
* **Core Philosophy:** Traditional education is static; this portal uses **experiential, interactive loops** (Experience ➔ Understand ➔ Learn ➔ Practice ➔ Improve).
* **Target Audience:** Citizens, students, and legal professionals looking for scannable, plain-English mappings of digital codes.

---

## 2. Technical Stack & Architecture
* **Frontend:** React.js (Single Page Application, React Router v6/v7).
* **Backend:** Node.js + Express.js REST API.
* **Database:** MongoDB (using Mongoose Object-Data Mappings).
* **Client-Side Persistence:** LocalStorage (for bookmarks, study notes, and baseline/final progress states).

```
[React Client SPA]  <---(JSON over REST REST API)--->  [Node/Express Server]
                                                            |
                                                   (Mongoose ODM Schemas)
                                                            v
                                                   [MongoDB Datastore]
```

---

## 3. Database Schemas (Mongoose Models)

### A. Law Section (`LawSection.js`)
Stores statutory clauses, plain-English translations, and interactive scenario matching data.
```javascript
const LawSectionSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  sectionNumber: { type: String, required: true },
  chapterNumber: { type: String },
  title: { type: String, required: true },
  legalStatus: { 
    type: String, 
    enum: ['CURRENT', 'OMITTED', 'REPEALED', 'AMENDED', 'PROPOSED', 'TEMPORARILY_SUSPENDED', 'NOT_YET_IN_FORCE', 'UNDER_REVIEW'], 
    default: 'CURRENT' 
  },
  commencementStatus: { type: String }, // e.g. "In force since 2008"
  amendmentStatus: { type: String },
  officialText: { type: String, required: true },
  plainEnglishText: { type: String, required: true },
  keywords: [{ type: String }],
  relatedCaseStudies: [{ type: String }], // References slug of CaseStudy
  relatedModules: [{ type: String }],
  
  // Mapped to the "Law Compass" Interactive Tool
  scenarioCompass: {
    questionText: String,
    options: [{
      optionText: String,
      isCorrect: Boolean,
      explanation: String
    }]
  },
  
  // Interactive mini-quizzes embedded in provisions
  quizzes: [{
    questionText: String,
    options: [String],
    correctOptionIndex: Number,
    explanation: String
  }]
});
```

### B. Cyber Crime Profile (`CyberCrime.js`)
Defines the threats, vectors, warning signs, and warning signals.
```javascript
const CyberCrimeSchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  shortDescription: { type: String, required: true },
  detailProfile: { type: String, required: true },
  warningSigns: [{
    title: String,
    explanation: String
  }],
  // Warning check interactive state
  spotRedFlags: {
    scenarioText: String,
    flags: [{
      textSegment: String,
      explanation: String,
      isFlag: Boolean
    }]
  }
});
```

### C. Incident Case Study (`CaseStudy.js`)
Tracks real or anonymized incident narratives, paused decision cards, timelines, and legal linkage.
```javascript
const CaseStudySchema = new mongoose.Schema({
  slug: { type: String, unique: true, required: true },
  caseNumber: { type: String, required: true }, // e.g., "CASE-2026-QR08"
  caseType: { 
    type: String, 
    enum: ['documented-case', 'educational-reconstruction', 'anonymized-incident', 'fictional-training-scenario'] 
  },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
  title: { type: String, required: true },
  attackVector: { type: String, required: true }, // e.g., "Phishing / QR Spoofing"
  incidentType: { type: String, required: true },
  shortDescription: { type: String, required: true },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  
  // Multi-step narrative sequence (split at decision points)
  narrativeSections: [{
    heading: String,
    body: String
  }],
  
  // Dynamic decision points that locks narrative progress until resolved
  decisionPoints: [{
    questionText: String,
    options: [{
      optionText: String,
      isCorrect: Boolean,
      explanation: String
    }]
  }],
  
  // Incident timeline event log
  timeline: [{
    time: String,
    label: String,
    type: { type: String, enum: ['contact', 'deception', 'decision', 'escalation', 'discovery'] },
    description: String
  }],
  
  attackerObjectives: [{ type: String }],
  warningSigns: [{
    title: String,
    explanation: String
  }],
  impact: {
    financial: String,
    account: String,
    privacy: String,
    operational: String
  },
  preventionLessons: [{ type: String }],
  legalContext: [{ type: String }], // e.g. ["Section 66C", "Section 66D"]
  sources: [{
    title: String,
    authority: String,
    publicationDate: String,
    url: String
  }]
});
```

---

## 4. Key Interactive Workflows & State Machines

### A. The "Law Compass" (Inside `Laws.jsx`)
Allows users to input scenarios and maps them to statutory sections.
* **State variables:** `selectedCompassCategory`, `compassStep`, `selectedOption`, `wizardFeedback`.
* **Execution:**
  1. User selects a category.
  2. The system loads relevant section questions.
  3. User picks an option. The system evaluates `isCorrect`, renders explanation, and links directly to the section card.

### B. Interactive Decision Pauses (Inside `Cases.jsx`)
Narratives lock before the outcome is revealed, placing the user in the target's position.
* **State variables:** `selectedChoiceIdx`, `decisionSubmitted`, `narrativeUnlocked`.
* **Lock Logic:**
  ```javascript
  // If narrative is locked, hide final outcome sections
  const showSection = idx < Math.max(1, totalSections - 2) || narrativeUnlocked;
  ```
* **Unlock Path:** User makes a choice ➔ system logs feedback ➔ user clicks "Audit Outcome" ➔ sets `narrativeUnlocked = true` ➔ remaining story, timeline, and legal codes fade in.

---

## 5. UI Design Language & Styled Components
The interface relies on a clean, scannable **editorial aesthetic** (avoiding neon/dark hacker themes):
* **Colors:**
  * Background: Warm off-white (`#fcfbfa` / `#f4f1ea`)
  * Primary Text: Deep Charcoal (`#1a1a1a` / `#222`)
  * Highlight Navy: Deep Navy (`#0a2540` / `#002d62`)
  * Risk Muted Red: Muted Carmine (`#c23b22` / `#d32f2f`)
  * Success Green: Muted Sage (`#388e3c` / `#2e7d32`)
* **Visual Components:**
  * **Sidebar Navigation:** Sticky `.sidebar` using flat active indicators (`border-left: 3px solid var(--accent-navy)`).
  * **Incident Path (SVG):** Inline flowchart trace highlighting choices dynamically:
    `1. BAIT ➔ 2. LEVERAGE ➔ 3. CHOICE ➔ 4. IMPACT ➔ 5. LAW`
  * **Timeline Connector:** Left-sided `2px dashed var(--color-border)` lines paired with styled circular state icon nodes.

---

## 6. Blueprint for Recreating the System (Step-by-Step)
1. **Initialize Workspace:** Build standard MERN application layout. Connect MongoDB.
2. **Build Backend Models:** Seed with baseline database records (11+ provisions spanning the IT Act, BNS, and DPDP rules).
3. **Set Up Routing Guards:** Lock API endpoint parameters (`req.body.role` check) during registrations. Strip correct option properties in public quiz hooks.
4. **Implement Frontend Core Mappings:** Write `Laws.jsx` (compass wizard + toggles) and `Cases.jsx` (decision mockups + dynamic SVG path header).
5. **Add Layout Styling:** Inject sidebar layouts and navigation highlights into `main.css`.
6. **Execute Tests:** Validate state boundaries via API scripts.
