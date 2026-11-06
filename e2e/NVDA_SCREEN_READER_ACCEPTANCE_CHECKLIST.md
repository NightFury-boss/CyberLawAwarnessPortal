# Stage 3 Wave 3: NVDA Screen-Reader Manual Acceptance Checklist
**Cyber Law Awareness Portal — Counterfactual Scenario Learning**  
**Target Environment:** Windows 10/11 | NVDA (NonVisual Desktop Access) | Chrome / Firefox  
**Document Status:** Approved Human Acceptance Protocol  

> [!IMPORTANT]
> **Human Acceptance Requirement**: In accordance with accessibility verification standards, automated testing tools (such as axe-core) verify DOM attributes, ARIA roles, and contrast ratios, but cannot verify human auditory intelligibility, speech timing, reading order fluidity, or focus stability. **Formal screen-reader acceptance requires recorded human evaluation following this protocol.**

---

## 1. Evaluator Setup & Environment Configuration

### Prerequisites
1. **Operating System:** Windows 10 or Windows 11 (64-bit).
2. **Screen Reader:** NVDA (NonVisual Desktop Access), version 2024.1 or later (free, open-source from [NV Access](https://www.nvaccess.org/)).
3. **Browser:** Google Chrome (latest stable) or Mozilla Firefox (latest stable).
4. **App Server:** Cyber Law Awareness Portal running locally on `http://localhost:5173` or served via static preview on `http://localhost:4173`.

### Configuration Steps
1. Launch NVDA (`Ctrl + Alt + N` or from Windows Start Menu).
2. Open NVDA Menu: Press `NVDA Key + N` (Default `NVDA Key` is `Insert` or `Caps Lock`).
3. Enable Speech Viewer for verification: Navigate to `Tools` -> `Speech Viewer` and check it. Keep the Speech Viewer window visible to inspect speech transcripts concurrently.
4. Set Synthesizer: `NVDA Key + Ctrl + S` -> Select `Windows OneCore Voices` or `eSpeak NG`.
5. Ensure Browse Mode vs Focus Mode transitions are audible (NVDA plays a low/high click when switching modes).

### Essential Navigation Keystrokes Reference
| Keystroke | Function |
| :--- | :--- |
| `Insert` or `Caps Lock` | `NVDA Key` (modifier) |
| `H` / `Shift + H` | Next / Previous Heading |
| `1` – `6` | Jump directly to Heading Level 1 – 6 |
| `Tab` / `Shift + Tab` | Next / Previous Interactive Element (links, buttons, inputs) |
| `Enter` / `Space` | Activate focused button, link, or radio button |
| `Down Arrow` / `Up Arrow` | Linear read through elements in Browse Mode |
| `T` / `Shift + T` | Next / Previous Table |
| `Ctrl + Alt + Left/Right/Up/Down` | Cell-by-cell Table Navigation |
| `Escape` | Switch from Focus Mode back to Browse Mode |
| `NVDA Key + Space` | Toggle between Browse Mode and Focus Mode |

---

## 2. Seven Execution-Ready Acceptance Flows

### Flow 1: Scenario Catalog & Heading Navigation
- **Target URL:** `http://localhost:4173/#/counterfactual`
- **Objective:** Verify logical heading hierarchy, landmark navigation, card discovery, and status cues.
- **Step-by-Step Procedure:**
  1. Open the URL. Press `H` repeatedly to cycle through all headings.
  2. Verify NVDA announces `Heading level 1: Counterfactual Decision Scenarios`.
  3. Verify each scenario card is announced as a discrete heading (`Heading level 2` or `level 3`) with its title:
     - Scenario 1: *Midnight Power Cut SMS Scam*
     - Scenario 2: *Customs / Courier Drug Parcel Threat*
     - Scenario 3: *The Refund QR Code Trap*
     - Scenario 4: *Digital Arrest by "CBI Cyber Cell"*
  4. Press `Tab` through each card. Verify the scenario card link/button states and metadata pills (e.g., category, time estimate) are announced without redundant repetitive titles.
  5. Verify completed scenarios announce a "Completed" badge when marked in `localStorage`.
- **Auditory Acceptance Criteria:**
  - [ ] Heading order is logical (H1 -> H2/H3) with no skipped levels.
  - [ ] Card interactive boundaries are announced clearly.
  - [ ] Speech Viewer transcript reflects accurate names without undefined/null strings.

---

### Flow 2: Scenario Stimulus & Decision Choices
- **Target URL:** `http://localhost:4173/#/counterfactual/midnight-power-cut-sms`
- **Objective:** Verify stimulus narrative reading order, junction announcement, and choice radio/button labels.
- **Step-by-Step Procedure:**
  1. Navigate into Scenario 1.
  2. Use `Down Arrow` to read the incident background stimulus narrative. Verify timestamps, incoming SMS text, urgency cues, and sender IDs are announced in natural grammatical order.
  3. Press `H` to locate the Decision Junction (`Heading level 2` / `level 3`).
  4. Press `Tab` to navigate through the three choices:
     - *Choice 1: Call the electricity helpline number provided in the SMS immediately.*
     - *Choice 2: Wait until morning to inspect the physical meter.*
     - *Choice 3: Verify independently using official discom app / 1912 helpline.*
  5. Verify each choice announces its sequential index, full descriptive text, and focus outline.
- **Auditory Acceptance Criteria:**
  - [ ] Stimulus text does not trap focus or cause erratic cursor jumping.
  - [ ] Each decision option announces clear differentiating text and index.
  - [ ] Selected vs unselected option states are distinctly voiced.

---

### Flow 3: Outcome Timeline & Consequence Announcements
- **Target URL:** Scenario 1 with Choice 1 selected
- **Objective:** Verify that branching results, timeline milestones, and statutory analysis are read chronologically.
- **Step-by-Step Procedure:**
  1. Activate Choice 1 (`Enter` or `Space`).
  2. Verify NVDA announces the consequence view load or updates live region.
  3. Use `H` to cycle through consequence section headings.
  4. Use `Down Arrow` to step through the chronological outcome timeline nodes:
     - Immediate reaction node.
     - Secondary consequence node (financial debits, OTP harvesting).
     - Legal and regulatory outcome node.
  5. Read statutory references: Ensure citations such as "IT Act Section 66D", "BNS Section 318(4)", and "BNS Section 319(2)" are enunciated legibly by speech synthesizer.
- **Auditory Acceptance Criteria:**
  - [ ] Timeline events are announced in chronological sequence.
  - [ ] Statutory sections and penalties are spoken without phonetic corruption.
  - [ ] No visual-only formatting artifacts (e.g. `*`, `_`, raw SVGs) are read aloud as text.

---

### Flow 4: Rewind Interaction & Branch Selection
- **Target URL:** Scenario 1 Consequence View
- **Objective:** Verify rewind button accessibility, focus handoff, and alternate branch exploration.
- **Step-by-Step Procedure:**
  1. Press `Tab` to navigate to the "Rewind to Decision Junction" button.
  2. Verify NVDA announces: *"Rewind to Decision Junction, button"*.
  3. Activate the button (`Enter` or `Space`).
  4. Verify focus returns smoothly to the Decision Junction heading or choices container without being dropped to `<body>`.
  5. Press `Tab` to select Choice 2 or Choice 3, and activate it.
  6. Verify the alternative consequence timeline loads and is immediately navigable.
- **Auditory Acceptance Criteria:**
  - [ ] Rewind button purpose is unambiguously stated.
  - [ ] Focus does not reset erratically to top-of-document (`<html>`/`<body>`).
  - [ ] Switching between branches announces the newly activated outcome distinctly.

---

### Flow 5: Comparative Matrix Navigation
- **Target URL:** Scenario 1 Comparative Matrix (`/matrix` tab or button)
- **Objective:** Verify semantic table markup, column/row headers, and cell readability using table navigation.
- **Step-by-Step Procedure:**
  1. Press `Tab` to the "Compare All Paths" or "Decision Matrix" button and press `Enter`.
  2. Press `T` to jump directly to the comparison table.
  3. Verify NVDA announces: *"Table with 4 columns and 4 rows"* (or applicable dimensions).
  4. Use `Ctrl + Alt + Right Arrow` to move through column headers:
     - Verify headers are announced as column headers: *Dimension*, *Branch A (Compliance)*, *Branch B (Inaction)*, *Branch C (Verification)*.
  5. Use `Ctrl + Alt + Down Arrow` to navigate down each row (e.g., *Immediate Consequence*, *Legal Exposure*, *Financial Loss Risk*).
  6. Verify NVDA announces both the current row header and column header when entering each data cell.
- **Auditory Acceptance Criteria:**
  - [ ] Table uses semantic `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<th scope="row">`.
  - [ ] Header-cell relationships are voiced accurately on every cell navigation.
  - [ ] No table cell contains unannounced clipped content.

---

### Flow 6: Defensive Takeaway Card & Completion Announcement
- **Target URL:** Scenario 1 Takeaway View
- **Objective:** Verify actionable cybersecurity guidance, emergency numbers, and completion persistence cues.
- **Step-by-Step Procedure:**
  1. Press `Tab` to navigate to the "Defensive Takeaways" / "Summary" section.
  2. Press `H` to locate the Takeaways heading.
  3. Use `Down Arrow` to read the protective rules:
     - Official verification channels.
     - National Cybercrime Helpline **1930**.
     - Portal `cybercrime.gov.in`.
     - 2–3 hour "Golden Hour" inter-bank hold coordination (CFCFRMS).
  4. Verify the scenario completion confirmation is voiced.
  5. Navigate back to the Catalog and verify that NVDA announces the scenario as "Completed".
- **Auditory Acceptance Criteria:**
  - [ ] Emergency contact details (**1930** and `cybercrime.gov.in`) are prominently announced.
  - [ ] Golden Hour timeline recommendations are clear and intelligible.
  - [ ] Scenario completion state persists across route changes.

---

### Flow 7: Invalid-Route Recovery & Return Navigation
- **Target URL:** `http://localhost:4173/#/counterfactual/non-existent-scenario-slug`
- **Objective:** Verify error messaging, focus confinement, and recovery button.
- **Step-by-Step Procedure:**
  1. Enter an invalid slug in the browser address bar.
  2. Verify NVDA announces page load and reads `Heading level 1` or `level 2`: *"Scenario Not Found"* or *"Invalid Scenario"*.
  3. Verify the error explanation is announced in Browse mode: *"The requested counterfactual scenario does not exist or has moved."*
  4. Press `Tab` to reach the recovery button: *"Return to Scenarios Catalog, button"*.
  5. Press `Enter`. Verify navigation lands on the catalog page with focus managed cleanly.
- **Auditory Acceptance Criteria:**
  - [ ] Error message is read automatically or immediately available via heading.
  - [ ] Recovery action button is in the natural tab order.
  - [ ] Return navigation successfully restores catalog context without error loops.

---

## 3. Human Acceptance Verification Sign-Off

*This section must be completed by the human QA evaluator performing the live auditory tests.*

| Evaluation Parameter | Evaluator Entry |
| :--- | :--- |
| **Human Evaluator Name** | __________________________________________ |
| **Date & Time of Evaluation** | __________________________________________ |
| **Operating System & Build** | Windows 11 Pro / Build _____________________ |
| **NVDA Version Tested** | NVDA ______________________________________ |
| **Browser & Version** | Chrome / Firefox Version __________________ |
| **Audio Output Device** | Headphones / Internal Speakers |

### Flow Sign-Off Status
- [ ] **Flow 1 (Scenario Catalog & Heading Navigation):** PASS / FAIL / REMARKS: ___________________
- [ ] **Flow 2 (Scenario Stimulus & Decision Choices):** PASS / FAIL / REMARKS: ___________________
- [ ] **Flow 3 (Outcome Timeline & Consequence Announcements):** PASS / FAIL / REMARKS: ___________
- [ ] **Flow 4 (Rewind Interaction & Branch Selection):** PASS / FAIL / REMARKS: ___________________
- [ ] **Flow 5 (Comparative Matrix Navigation):** PASS / FAIL / REMARKS: _________________________
- [ ] **Flow 6 (Defensive Takeaway Card & Completion):** PASS / FAIL / REMARKS: ___________________
- [ ] **Flow 7 (Invalid-Route Recovery & Return Navigation):** PASS / FAIL / REMARKS: _____________

**Overall Human Auditory Acceptance Verdict:** `[  ] ACCEPTED   [  ] REVISIONS REQUIRED`  
**Evaluator Signature:** _____________________________________________  

