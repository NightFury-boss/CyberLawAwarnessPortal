/**
 * Stage 4 Wave 2: Expanded Assessment Bank & In-Lesson Quick Checks
 * Authoritative source: CYBER-LAW-STAGE4-BASELINE-AUDIT-FINAL-REV7 (§6.1 & §6.2)
 * Contains:
 * 1. Exactly 21 Expanded Assessment Questions (Q-P1-01 through Q-P7-03) across the 7 approved pillars
 * 2. Exactly 7 In-Lesson Quick Checks (QC-P1-01 through QC-P7-01) mapping to Modules 13-18
 */

const expandedQuestions = [
  {
    "questionId": "Q-P1-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Personal Data and Digital Identity",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "An online food delivery app mandates that customers provide their PAN and Aadhaar numbers to place an order for grocery delivery. When a user declines, the app refuses to process the payment. Under the prospective statutory principles enacted in Section 6(1) of the DPDP Act, 2023, what is the legal validity of the platform's condition?",
    "options": [
      "Valid, because commercial platforms have complete discretion over customer onboarding.",
      "Invalid, because consent cannot be made a condition for the provision of a service unless personal data is strictly necessary for that service.",
      "Valid, provided the platform displays the notice in both English and Hindi.",
      "Invalid only if the transaction value is under ₹500."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under Section 6(1) of the DPDP Act, 2023, consent must be free, specific, informed, and unambiguous. Conditioning the provision of a service on consent to process personal data that is not necessary for that service invalidates the consent.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under Section 6(1) of the DPDP Act, 2023, consent must be free, specific, informed, and unambiguous. Conditioning the provision of a service on consent to process personal data that is not necessary for that service invalidates the consent.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "DPDP Section 6(1)",
        "title": "Personal Data and Digital Identity - Conditional Consent",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "DPDP Section 6(1)",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 1",
    "relatedModule": "digital-identity-data-protection",
    "published": true
  },
  {
    "questionId": "Q-P1-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Personal Data and Digital Identity",
    "difficulty": "Beginner",
    "cognitiveLevel": "Level 2",
    "questionText": "Under Notification G.S.R. 843(E), while Sections 3–17 (excluding Section 6(9)) of the DPDP Act, 2023 are scheduled for commencement on 13 May 2027, what is the operational status of IT Act Section 43A and the SPDI Rules, 2011 on 6 November 2026?",
    "options": [
      "Section 43A was repealed immediately upon enactment on 11 August 2023.",
      "Section 43A and the SPDI Rules, 2011 remain in force because Section 44(2) of the DPDP Act has not yet commenced.",
      "Section 43A only applies to government departments.",
      "Section 43A has been replaced by the Bharatiya Nyaya Sanhita, 2023."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under G.S.R. 843(E), Section 44(2) of the DPDP Act (which omits IT Act Section 43A) commences 18 months post-notification (13 May 2027). Consequently, on 6 November 2026, Section 43A and the SPDI Rules, 2011 remain legally operative.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under G.S.R. 843(E), Section 44(2) of the DPDP Act (which omits IT Act Section 43A) commences 18 months post-notification (13 May 2027). Consequently, on 6 November 2026, Section 43A and the SPDI Rules, 2011 remain legally operative.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology Act, 2000",
        "sectionNumber": "Section 43A",
        "title": "Compensation for Failure to Protect Data & SPDI Rules",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology Act, 2000",
      "citation": "Section 43A / SPDI Rules, 2011",
      "year": 2000,
      "status": "Operative legal standard on 6 November 2026 baseline (DPDP Section 44(2) omission effective 13 May 2027)"
    },
    "topicTag": "PILLAR 1",
    "relatedModule": "digital-identity-data-protection",
    "published": true
  },
  {
    "questionId": "Q-P1-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Personal Data and Digital Identity",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "A scammer creates an artificial digital persona using the photograph, voice note, and name of a company director, pretending to be that director in messages to finance staff to solicit urgent gift-voucher purchases. Under Indian criminal law, which distinct offense specifically penalizes cheating by personation?",
    "options": [
      "Bharatiya Nyaya Sanhita (BNS) Section 318(4).",
      "Bharatiya Nyaya Sanhita (BNS) Section 319 (read with IT Act Section 66D).",
      "IT Act Section 72A.",
      "Copyright Act Section 65A."
    ],
    "correctOptionIndex": 1,
    "explanation": "BNS Section 319 specifically defines and penalizes cheating by personation (reproducing former IPC 416/419), alongside IT Act Section 66D. BNS Section 318(4) penalizes cheating and dishonestly inducing delivery of property.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. BNS Section 319 specifically defines and penalizes cheating by personation (reproducing former IPC 416/419), alongside IT Act Section 66D. BNS Section 318(4) penalizes cheating and dishonestly inducing delivery of property.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Bharatiya Nyaya Sanhita, 2023 / Information Technology Act, 2000",
        "sectionNumber": "BNS Section 319 / IT Act Section 66D",
        "title": "Cheating by Personation and Identity Spoofing",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Bharatiya Nyaya Sanhita, 2023 / Information Technology Act, 2000",
      "citation": "BNS Section 319 / IT Act Section 66D",
      "year": 2024,
      "status": "In force. Notified effective 1 July 2024 (BNS) / 17 October 2000 (IT Act)"
    },
    "topicTag": "PILLAR 1",
    "relatedModule": "digital-identity-data-protection",
    "published": true
  },
  {
    "questionId": "Q-P2-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Data Principal Rights",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "A user submits a formal erasure request to an online trading platform under Section 12(3) of the DPDP Act, 2023. The platform erases user behavioral history and marketing profiles, but retains KYC identity documents and trade logs, citing statutory mandates under SEBI regulations and the Prevention of Money Laundering Act (PMLA). Is the platform's retention lawful upon commencement of Section 12(3)?",
    "options": [
      "No, because the Data Principal's right to erasure under Section 12(3) overrides all financial regulations.",
      "Yes, because Section 12(3) erasure obligations apply unless retention of personal data is necessary for compliance with any law for the time being in force.",
      "No, because all electronic data must be erased within 24 hours of an account closure request.",
      "Yes, but only if the user explicitly consents to the retention in writing."
    ],
    "correctOptionIndex": 1,
    "explanation": "Section 12(3) of the DPDP Act, 2023 requires data fiduciaries to erase personal data upon request unless retention is required for compliance with any statutory obligation under any other law in force.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Section 12(3) of the DPDP Act, 2023 requires data fiduciaries to erase personal data upon request unless retention is required for compliance with any statutory obligation under any other law in force.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Sections 11-14 & Section 9",
        "title": "Data Principal Rights",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Sections 11-14 & Section 9",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 2",
    "relatedModule": "data-principal-rights-child-safeguards",
    "published": true
  },
  {
    "questionId": "Q-P2-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Data Principal Rights",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "Under Rule 12 and Part A of the Fourth Schedule to the DPDP Rules, 2025, a child transport service provider operates a GPS tracking system on school buses. Under what strict statutory boundary is this tracking exempt from Section 9(3) child tracking restrictions upon commencement?",
    "options": [
      "It is exempt for any commercial purpose approved by the school board.",
      "It is exempt strictly and solely for ensuring the physical safety and security of children during transit to and from the educational institution.",
      "It is exempt only if the vehicle is driven by a state police officer.",
      "It is exempt only during government examinations."
    ],
    "correctOptionIndex": 1,
    "explanation": "Part A of the Fourth Schedule to the DPDP Rules, 2025 explicitly restricts the child transport service provider exemption from Section 9(3) strictly to ensuring the physical safety and security of children during transit.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Part A of the Fourth Schedule to the DPDP Rules, 2025 explicitly restricts the child transport service provider exemption from Section 9(3) strictly to ensuring the physical safety and security of children during transit.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Sections 11-14 & Section 9",
        "title": "Data Principal Rights",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Sections 11-14 & Section 9",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 2",
    "relatedModule": "data-principal-rights-child-safeguards",
    "published": true
  },
  {
    "questionId": "Q-P2-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Data Principal Rights",
    "difficulty": "Beginner",
    "cognitiveLevel": "Level 2",
    "questionText": "Under Section 14 of the DPDP Act, 2023, what right is conferred upon a Data Principal to protect their digital data in the event of death or permanent incapacity?",
    "options": [
      "Right to have all online accounts permanently transferred to the Central Government.",
      "Right to nominate an individual who shall exercise Data Principal rights in accordance with the Act.",
      "Right to automatic monetary damages from all data fiduciaries.",
      "Right to convert personal data into public records."
    ],
    "correctOptionIndex": 1,
    "explanation": "Section 14 of the DPDP Act gives Data Principals the right to nominate another individual who shall exercise the rights of the Data Principal in the event of death or incapacity.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Section 14 of the DPDP Act gives Data Principals the right to nominate another individual who shall exercise the rights of the Data Principal in the event of death or incapacity.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Sections 11-14 & Section 9",
        "title": "Data Principal Rights",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Sections 11-14 & Section 9",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 2",
    "relatedModule": "data-principal-rights-child-safeguards",
    "published": true
  },
  {
    "questionId": "Q-P3-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Consent and Data Fiduciary Obligations",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "A consumer in West Bengal requests an e-commerce platform's consent notice in Bengali. The platform insists that it only provides notices in English. Under Section 5(3) of the DPDP Act, 2023, what is the platform's statutory obligation upon commencement?",
    "options": [
      "The platform may refuse because English is the sole statutory commercial language.",
      "The platform must provide the Data Principal the option to access the notice in English or any language specified in the Eighth Schedule to the Constitution of India (including Bengali).",
      "The platform must display the notice in all 22 scheduled languages simultaneously on one page.",
      "The platform must refer the request to the High Court."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under Section 5(3) of the DPDP Act, the notice accompanying a consent request must give the Data Principal the option to view it in English or any language specified in the Eighth Schedule to the Constitution.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under Section 5(3) of the DPDP Act, the notice accompanying a consent request must give the Data Principal the option to view it in English or any language specified in the Eighth Schedule to the Constitution.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Section 5(3)",
        "title": "Consent Notice in Eighth Schedule Languages",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Section 5(3)",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 3",
    "relatedModule": "notice-consent-fiduciary-obligations",
    "published": true
  },
  {
    "questionId": "Q-P3-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Consent and Data Fiduciary Obligations",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "When a personal data breach occurs under Section 8(6) of the DPDP Act, 2023, what is the mandatory reporting obligation of the Data Fiduciary upon commencement?",
    "options": [
      "Intimate the breach to the local police station within 12 hours.",
      "Give intimation of the personal data breach to the Data Protection Board of India and each affected Data Principal, in the form and manner prescribed.",
      "Publish a full-page apology in a national newspaper within 48 hours.",
      "Intimate only corporate shareholders and lenders."
    ],
    "correctOptionIndex": 1,
    "explanation": "Section 8(6) of the DPDP Act mandates that in the event of a personal data breach, the Data Fiduciary shall give the Board and each affected Data Principal intimation of the breach.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Section 8(6) of the DPDP Act mandates that in the event of a personal data breach, the Data Fiduciary shall give the Board and each affected Data Principal intimation of the breach.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Section 8(6)",
        "title": "Personal Data Breach Intimation",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Section 8(6)",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 May 2027 under G.S.R. 843(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 3",
    "relatedModule": "notice-consent-fiduciary-obligations",
    "published": true
  },
  {
    "questionId": "Q-P3-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "DPDP and privacy",
    "subtopic": "Consent and Data Fiduciary Obligations",
    "difficulty": "Beginner",
    "cognitiveLevel": "Level 2",
    "questionText": "Under G.S.R. 843(E) and G.S.R. 846(E), what is the scheduled commencement date for the Consent Manager registration framework under DPDP Act Section 6(9) and Rule 4 of the DPDP Rules, 2025?",
    "options": [
      "Immediately on 11 August 2023.",
      "Scheduled for commencement after one year, on 13 November 2026.",
      "Scheduled for commencement after 18 months, on 13 May 2027.",
      "Indefinitely deferred until 2030."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under G.S.R. 843(E) and G.S.R. 846(E), Section 6(9), Section 27(1)(d), and Rule 4 governing Consent Managers are scheduled for commencement after one year, on 13 November 2026.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under G.S.R. 843(E) and G.S.R. 846(E), Section 6(9), Section 27(1)(d), and Rule 4 governing Consent Managers are scheduled for commencement after one year, on 13 November 2026.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Digital Personal Data Protection Act, 2023",
        "sectionNumber": "Section 6(9) / Rule 4",
        "title": "Consent Manager Registration Framework",
        "status": "not_yet_in_force"
      }
    ],
    "sourceMetadata": {
      "actName": "Digital Personal Data Protection Act, 2023",
      "citation": "Section 6(9) / Rule 4",
      "year": 2023,
      "status": "Enacted; scheduled for commencement on 13 November 2026 under G.S.R. 843(E) / G.S.R. 846(E) (prospective standard on 6 November 2026 baseline)"
    },
    "topicTag": "PILLAR 3",
    "relatedModule": "notice-consent-fiduciary-obligations",
    "published": true
  },
  {
    "questionId": "Q-P4-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Grievance Redressal and Digital Governance",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "An online platform receives a communication via WhatsApp from a police Inspector requesting the takedown of an investigative article within 3 hours under Rule 3(1)(d) of the IT Rules, 2021. Does this communication legally obligate the platform to act within 3 hours?",
    "options": [
      "Yes, because any police request is binding under Rule 3(1)(d).",
      "No; Rule 3(1)(d) requires a court order or a reasoned written intimation issued by an authorized officer not below Joint Secretary (or Director fallback), or a specifically authorized police officer not below DIG rank.",
      "Yes, provided the Inspector shares their police badge number.",
      "No, because news articles are exempt from all IT Rules."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under Rule 3(1)(d) of the IT Rules (as amended by G.S.R. 120(E)), an executive takedown requires a qualifying written intimation from an authorized officer not below Joint Secretary/Director rank, or an authorized police officer not below DIG rank. An informal WhatsApp message from an Inspector does not satisfy the statutory requirements.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under Rule 3(1)(d) of the IT Rules (as amended by G.S.R. 120(E)), an executive takedown requires a qualifying written intimation from an authorized officer not below Joint Secretary/Director rank, or an authorized police officer not below DIG rank. An informal WhatsApp message from an Inspector does not satisfy the statutory requirements.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
        "sectionNumber": "Section 79 / IT Rules Rule 3",
        "title": "Grievance Redressal and Digital Governance",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
      "citation": "Section 79 / IT Rules Rule 3",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 4",
    "relatedModule": "platform-governance-intermediary-due-diligence",
    "published": true
  },
  {
    "questionId": "Q-P4-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Grievance Redressal and Digital Governance",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "A user submits a complaint to an intermediary's Resident Grievance Officer regarding content infringing their registered trademark under Rule 3(1)(b)(iv). What is the mandatory statutory resolution timeline under Rule 3(2)(a)(i) of the IT Rules, 2021?",
    "options": [
      "Acknowledge in 24 hours; resolve within 36 hours.",
      "Acknowledge in 24 hours; resolve within 7 calendar days.",
      "Resolve within two hours under the emergency track.",
      "Resolve within 30 days under the Trade Marks Act."
    ],
    "correctOptionIndex": 1,
    "explanation": "The proviso to Rule 3(2)(a)(i) excludes subclause (iv) (infringement of patent, trademark, copyright, or proprietary rights) from the 36-hour track. IP grievances fall under the standard 7-calendar-day resolution window.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. The proviso to Rule 3(2)(a)(i) excludes subclause (iv) (infringement of patent, trademark, copyright, or proprietary rights) from the 36-hour track. IP grievances fall under the standard 7-calendar-day resolution window.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
        "sectionNumber": "Section 79 / IT Rules Rule 3",
        "title": "Grievance Redressal and Digital Governance",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
      "citation": "Section 79 / IT Rules Rule 3",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 4",
    "relatedModule": "platform-governance-intermediary-due-diligence",
    "published": true
  },
  {
    "questionId": "Q-P4-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Grievance Redressal and Digital Governance",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "What is the precise statutory legal consequence if an intermediary fails to observe due diligence under Rule 3 of the IT Rules, 2021?",
    "options": [
      "The intermediary is automatically deemed guilty of an independent criminal offense.",
      "Section 79(1) safe harbour immunity does not apply, removing statutory protection and exposing the intermediary to potential liability under general substantive law.",
      "The company's bank accounts are frozen automatically by the Ministry of Corporate Affairs.",
      "Safe harbour remains intact unless revoked by a two-thirds majority in Parliament."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under Section 79(3)(a) and Rule 7 of the IT Rules, failure of due diligence forfeits safe harbour immunity under Section 79(1). It does not automatically create criminal guilt; liability depends on establishing the elements of an offense under general substantive law.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under Section 79(3)(a) and Rule 7 of the IT Rules, failure of due diligence forfeits safe harbour immunity under Section 79(1). It does not automatically create criminal guilt; liability depends on establishing the elements of an offense under general substantive law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
        "sectionNumber": "Section 79 / IT Rules Rule 3",
        "title": "Grievance Redressal and Digital Governance",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology (Intermediary Guidelines) Rules, 2021",
      "citation": "Section 79 / IT Rules Rule 3",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 4",
    "relatedModule": "platform-governance-intermediary-due-diligence",
    "published": true
  },
  {
    "questionId": "Q-P5-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Copyright and Intellectual Property",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "A video game reviewer captures a 40-second gameplay video snippet from a commercial copyrighted game, incorporating it into a 15-minute video critiquing the game's physics engine and graphics. The studio issues a copyright infringement strike. How is the reviewer's defense evaluated under Section 52(1)(a)(ii) of the Copyright Act, 1957?",
    "options": [
      "It is automatic infringement because any unauthorized copying of proprietary game graphics is illegal.",
      "Criticism or review is a statutorily recognized fair-dealing purpose under Section 52(1)(a)(ii), but whether the use is protected remains fact-sensitive, depending on factors such as the substantiality of the portion used and whether it competes with or substitutes for the original work.",
      "The defense succeeds automatically and unconditionally whenever a video is labelled as a review.",
      "Fair dealing only applies to non-profit universities and print media."
    ],
    "correctOptionIndex": 1,
    "explanation": "Section 52(1)(a)(ii) of the Copyright Act, 1957 establishes criticism or review as a recognized head of fair dealing. However, courts evaluate fair dealing on a fact-sensitive basis, considering the quantum and value of the matter taken, the purpose of the use, and the likelihood of market substitution. Merely invoking criticism does not confer an automatic or unqualified immunity.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Section 52(1)(a)(ii) of the Copyright Act, 1957 establishes criticism or review as a recognized head of fair dealing. However, courts evaluate fair dealing on a fact-sensitive basis, considering the quantum and value of the matter taken, the purpose of the use, and the likelihood of market substitution. Merely invoking criticism does not confer an automatic or unqualified immunity.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Copyright Act, 1957",
        "sectionNumber": "Section 52(1)(a)(ii), Section 65A, Section 65B",
        "title": "Copyright and Intellectual Property",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Copyright Act, 1957",
      "citation": "Section 52(1)(a)(ii), Section 65A, Section 65B",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 5",
    "relatedModule": "digital-copyright-fair-dealing-tpm",
    "published": true
  },
  {
    "questionId": "Q-P5-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Copyright and Intellectual Property",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "An individual intentionally circumvents an effective digital encryption wrapper (TPM) applied to an enterprise CAD engineering software package, without the authorization of the software copyright owner, with the specific intention of creating and distributing unlicensed copies for commercial profit. What statutory offense is committed under the Copyright Act, 1957?",
    "options": [
      "Section 65A(1) (Circumvention of technological protection measures with the intention of infringing copyright).",
      "Only breach of contract under the Indian Contract Act, 1872.",
      "Cheating under BNS Section 318.",
      "No offense, because encryption circumvention is legal in India."
    ],
    "correctOptionIndex": 0,
    "explanation": "Section 65A(1) of the Copyright Act, 1957 penalizes any person who circumvents an effective technological measure applied for protecting copyright with the intention of infringing such right (punishable with imprisonment up to 2 years and fine).",
    "optionExplanations": [
      "Correct. Section 65A(1) of the Copyright Act, 1957 penalizes any person who circumvents an effective technological measure applied for protecting copyright with the intention of infringing such right (punishable with imprisonment up to 2 years and fine).",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Copyright Act, 1957",
        "sectionNumber": "Section 52(1)(a)(ii), Section 65A, Section 65B",
        "title": "Copyright and Intellectual Property",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Copyright Act, 1957",
      "citation": "Section 52(1)(a)(ii), Section 65A, Section 65B",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 5",
    "relatedModule": "digital-copyright-fair-dealing-tpm",
    "published": true
  },
  {
    "questionId": "Q-P5-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Copyright and Intellectual Property",
    "difficulty": "Beginner",
    "cognitiveLevel": "Level 2",
    "questionText": "A website operator knowingly removes cryptographic author watermarks, licensing metadata, and digital copyright notices (electronic Rights Management Information) embedded in digital photographs, subsequently distributing the modified images online without authority. Which provision of the Copyright Act, 1957 provides remedies against this conduct?",
    "options": [
      "Section 65B (Protection of Rights Management Information).",
      "Section 45.",
      "Section 14(b).",
      "Section 52(1)(za)."
    ],
    "correctOptionIndex": 0,
    "explanation": "Section 65B of the Copyright Act, 1957 specifically provides remedies against the unauthorized, knowing removal or alteration of electronic Rights Management Information (RMI), or the knowing commercial distribution of works where RMI has been removed.",
    "optionExplanations": [
      "Correct. Section 65B of the Copyright Act, 1957 specifically provides remedies against the unauthorized, knowing removal or alteration of electronic Rights Management Information (RMI), or the knowing commercial distribution of works where RMI has been removed.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Copyright Act, 1957",
        "sectionNumber": "Section 52(1)(a)(ii), Section 65A, Section 65B",
        "title": "Copyright and Intellectual Property",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Copyright Act, 1957",
      "citation": "Section 52(1)(a)(ii), Section 65A, Section 65B",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 5",
    "relatedModule": "digital-copyright-fair-dealing-tpm",
    "published": true
  },
  {
    "questionId": "Q-P6-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Malware and Cyber Threats",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "An attacker transmits a malicious phishing attachment that installs a ransomware payload on a municipal utility server, encrypting consumer billing records. Which provisions of the IT Act, 2000 are directly violated?",
    "options": [
      "Section 43(c) (introducing computer contaminant) and Section 66 (computer-related offenses).",
      "Section 67A exclusively.",
      "Section 72A exclusively.",
      "Section 79."
    ],
    "correctOptionIndex": 0,
    "explanation": "Introducing a computer contaminant or ransomware violates Section 43(c) of the IT Act, which, when done dishonestly or fraudulently, is punishable as a criminal offense under Section 66 (imprisonment up to 3 years or fine up to ₹5 lakh, or both).",
    "optionExplanations": [
      "Correct. Introducing a computer contaminant or ransomware violates Section 43(c) of the IT Act, which, when done dishonestly or fraudulently, is punishable as a criminal offense under Section 66 (imprisonment up to 3 years or fine up to ₹5 lakh, or both).",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology Act, 2000",
        "sectionNumber": "Sections 43, 66, 72A",
        "title": "Malware and Cyber Threats",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology Act, 2000",
      "citation": "Sections 43, 66, 72A",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 6",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  },
  {
    "questionId": "Q-P6-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Malware and Cyber Threats",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "An IT support contractor at a hospital secures access to customer personal contact directories and medical patient appointment logs while providing services under a lawful maintenance contract. The contractor discloses this material containing personal information of patients to a private commercial agency without consent, with the intent to cause wrongful gain to himself and wrongful loss to the hospital. What is the statutory penalty under Section 72A of the IT Act, 2000?",
    "options": [
      "Imprisonment up to 3 years and fine up to ₹5 lakh.",
      "Penalty which may extend to twenty-five lakh rupees (₹25,00,000) under the Jan Vishwas Act, 2023.",
      "A civil fine capped at ₹50,000.",
      "Automatic corporate debarment without financial penalty."
    ],
    "correctOptionIndex": 1,
    "explanation": "All elements of Section 72A are satisfied: access secured while providing services under a lawful contract; material containing personal information of another person; disclosure without consent or in breach of contract; and mens rea of intent to cause wrongful loss or gain. Under the Jan Vishwas Act, 2023, the penalty extends up to ₹25 lakh.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. All elements of Section 72A are satisfied: access secured while providing services under a lawful contract; material containing personal information of another person; disclosure without consent or in breach of contract; and mens rea of intent to cause wrongful loss or gain. Under the Jan Vishwas Act, 2023, the penalty extends up to ₹25 lakh.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology Act, 2000",
        "sectionNumber": "Sections 43, 66, 72A",
        "title": "Malware and Cyber Threats",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology Act, 2000",
      "citation": "Sections 43, 66, 72A",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 6",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  },
  {
    "questionId": "Q-P6-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Malware and Cyber Threats",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "An Adjudicating Officer appointed under Section 46 of the Information Technology Act, 2000 secures access to electronic financial correspondence and business records of an enterprise in pursuance of statutory powers conferred under Chapter IX of the Act. The officer subsequently discloses these confidential electronic records to an unauthorized party without consent. Under which provision of the IT Act is this breach penalized?",
    "options": [
      "Section 72 (Breach of confidentiality and privacy by a person who has secured access to electronic records under powers conferred by the Act or rules).",
      "Section 66A.",
      "Section 67.",
      "Section 79."
    ],
    "correctOptionIndex": 0,
    "explanation": "Section 72 of the IT Act applies specifically to any person who, in pursuance of powers conferred under the Act, rules, or regulations, secures access to electronic records and discloses them without consent (penalty up to ₹5 lakh under Jan Vishwas Act).",
    "optionExplanations": [
      "Correct. Section 72 of the IT Act applies specifically to any person who, in pursuance of powers conferred under the Act, rules, or regulations, secures access to electronic records and discloses them without consent (penalty up to ₹5 lakh under Jan Vishwas Act).",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Information Technology Act, 2000",
        "sectionNumber": "Sections 43, 66, 72A",
        "title": "Malware and Cyber Threats",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Information Technology Act, 2000",
      "citation": "Sections 43, 66, 72A",
      "year": 2026,
      "status": "Operative legal standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 6",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  },
  {
    "questionId": "Q-P7-01",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "UPI, banking and financial fraud",
    "subtopic": "Defensive Digital Citizenship",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "A commercial bank experiences an internal core banking server glitch and unauthorized administrative credential compromise (contributory deficiency on the part of the bank), causing an unauthorized debit of ₹50,000 from a customer's savings account. The customer notices the debit 10 days later. Under Paragraph 67(1) and Paragraph 72 of the RBI Master Direction on Commercial Banks RBC Directions, what is the customer's liability?",
    "options": [
      "Capped at ₹10,000 because reporting was delayed beyond 7 days.",
      "Zero liability under Paragraph 67(1) because the fraud was due to bank deficiency, and the bank must provide a provisional shadow reversal under Paragraph 72 within 10 working days of notification.",
      "Capped at ₹25,000.",
      "The customer bears the entire loss because reporting exceeded 3 days."
    ],
    "correctOptionIndex": 1,
    "explanation": "Under Paragraph 67(1) of the RBI Commercial Banks RBC Directions, a customer has zero liability where an unauthorized transaction occurs due to contributory fraud, negligence, or deficiency on the part of the bank, irrespective of whether the transaction is reported by the customer. Under Paragraph 72, the bank must provide a provisional shadow reversal within 10 working days.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Under Paragraph 67(1) of the RBI Commercial Banks RBC Directions, a customer has zero liability where an unauthorized transaction occurs due to contributory fraud, negligence, or deficiency on the part of the bank, irrespective of whether the transaction is reported by the customer. Under Paragraph 72, the bank must provide a provisional shadow reversal within 10 working days.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Reserve Bank of India Master Directions",
        "sectionNumber": "RBI Commercial Bank RBC Para 67(1) / Para 72",
        "title": "Customer Protection - Contributory Bank Negligence & Shadow Reversal",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Reserve Bank of India Master Directions",
      "citation": "RBI Commercial Bank RBC Para 67(1) / Para 72",
      "year": 2017,
      "status": "Operative circular standard on 6 November 2026 baseline"
    },
    "topicTag": "PILLAR 7",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  },
  {
    "questionId": "Q-P7-02",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Defensive Digital Citizenship",
    "difficulty": "Advanced",
    "cognitiveLevel": "Level 4",
    "questionText": "A cyber fraud victim's funds are moved to a mule account. Following an investigation, the police Investigating Officer formally seizes the suspect bank account under BNSS Section 106(1) and forthwith reports the seizure to the Magistrate under Section 106(3). The tainted money is not produced before the Criminal Court during inquiry or trial. Under which provision of the Bharatiya Nagarik Suraksha Sanhita, 2023 must the Magistrate make an order respecting the delivery of the property to the person entitled to possession?",
    "options": [
      "Section 173.",
      "Section 503 (Procedure by police upon seizure of property when property seized is not produced before a Criminal Court).",
      "Section 497.",
      "Section 106(2)."
    ],
    "correctOptionIndex": 1,
    "explanation": "Where property is seized by a police officer under Section 106(1) and reported to a Magistrate under Section 106(3), but is not produced before a Criminal Court during an inquiry or trial, the disposal and delivery of such property to the entitled person is governed by BNSS Section 503 (formerly CrPC § 457). BNSS Section 497 applies to property produced before a Criminal Court.",
    "optionExplanations": [
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Correct. Where property is seized by a police officer under Section 106(1) and reported to a Magistrate under Section 106(3), but is not produced before a Criminal Court during an inquiry or trial, the disposal and delivery of such property to the entitled person is governed by BNSS Section 503 (formerly CrPC § 457). BNSS Section 497 applies to property produced before a Criminal Court.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Bharatiya Nagarik Suraksha Sanhita, 2023",
        "sectionNumber": "BNSS Section 106 & Section 503",
        "title": "Police Seizure and Magistrate Property Delivery",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Bharatiya Nagarik Suraksha Sanhita, 2023",
      "citation": "BNSS Section 106 & Section 503",
      "year": 2024,
      "status": "In force. Notified effective 1 July 2024"
    },
    "topicTag": "PILLAR 7",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  },
  {
    "questionId": "Q-P7-03",
    "format": "single_choice",
    "questionType": "scenario",
    "category": "Indian Cyber Law and IT Act",
    "subtopic": "Defensive Digital Citizenship",
    "difficulty": "Intermediate",
    "cognitiveLevel": "Level 3",
    "questionText": "A male tenant secretly installs a hidden spy camera in a residential bathroom and captures video footage of the private area of a female flatmate without her consent, while she is using the facilities under circumstances violating her privacy. Which statutory provisions of the Bharatiya Nyaya Sanhita, 2023 and the Information Technology Act, 2000 are directly violated?",
    "options": [
      "BNS Section 77 (Voyeurism by a man capturing the image of a woman engaging in a private act) and IT Act Section 66E (Capturing, publishing, or transmitting the image of a private area of any person without consent).",
      "Section 72A of the IT Act exclusively.",
      "Section 65 of the IT Act.",
      "Section 106 of the BNSS."
    ],
    "correctOptionIndex": 0,
    "explanation": "Capturing images of the private area of a person without consent explicitly satisfies Section 66E of the IT Act (punishable with imprisonment up to 3 years or fine up to ₹2 lakh, or both). Because the accused is male and the victim is female engaging in a private act where she had a reasonable expectation of privacy, it simultaneously constitutes the gender-specific offense of voyeurism under BNS Section 77.",
    "optionExplanations": [
      "Correct. Capturing images of the private area of a person without consent explicitly satisfies Section 66E of the IT Act (punishable with imprisonment up to 3 years or fine up to ₹2 lakh, or both). Because the accused is male and the victim is female engaging in a private act where she had a reasonable expectation of privacy, it simultaneously constitutes the gender-specific offense of voyeurism under BNS Section 77.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law.",
      "Incorrect. This option does not satisfy the statutory conditions specified in Indian law."
    ],
    "whyIncorrect": "Choosing an incorrect option fails to apply the precise statutory conditions and judicial standards enacted in Indian cyber and privacy law.",
    "practicalTakeaway": "Key Rule: Always verify statutory prerequisites, jurisdictional limits, and applicable notification timelines under operative Indian cyber and privacy enactments.",
    "legalReferences": [
      {
        "actName": "Bharatiya Nyaya Sanhita, 2023 / Information Technology Act, 2000",
        "sectionNumber": "BNS Section 77 / IT Act Section 66E",
        "title": "Voyeurism and Violation of Bodily Privacy",
        "status": "active"
      }
    ],
    "sourceMetadata": {
      "actName": "Bharatiya Nyaya Sanhita, 2023 / Information Technology Act, 2000",
      "citation": "BNS Section 77 / IT Act Section 66E",
      "year": 2024,
      "status": "In force. Notified effective 1 July 2024 (BNS) / 27 October 2009 (IT Act)"
    },
    "topicTag": "PILLAR 7",
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "published": true
  }
];

const quickChecks = [
  {
    "id": "QC-P1-01",
    "quickCheckNumber": 1,
    "moduleOrder": 13,
    "relatedModule": "digital-identity-data-protection",
    "pillar": "PILLAR 1: PERSONAL DATA AND DIGITAL IDENTITY",
    "scenario": "An incorporated healthcare analytics company (body corporate) stores medical diagnostic reports and patient biometric records (sensitive personal data) on its internal cloud database. The company fails to implement multi-factor authentication or standard encryption controls prescribed under the SPDI Rules, 2011. Due to this negligence, an external hacker exfiltrates patient diagnosis files and sells them on a darknet forum, directly causing financial loss and extortion to an affected patient.",
    "question": "On 6 November 2026, under which statutory provision is the company liable to pay compensation to the victim?",
    "options": [
      "Section 33 of the DPDP Act, 2023, because data protection penalties are currently operative.",
      "Section 43A of the Information Technology Act, 2000, because the body corporate was negligent in implementing reasonable security practices handling sensitive personal data, resulting in wrongful loss.",
      "Section 66A of the IT Act, 2000.",
      "No compensation is payable because corporate data breaches are strictly exempt until 13 May 2027."
    ],
    "correctOptionIndex": 1,
    "correctKey": "B",
    "explanation": "All five statutory conditions of Section 43A of the IT Act, 2000 are satisfied: an incorporated body corporate; possessing sensitive personal data (SPDI); in an owned/operated computer resource; negligent in maintaining reasonable security practices; causing wrongful loss. Because Section 44(2) of the DPDP Act (omitting Section 43A) does not commence until 18 months post-notification (13 May 2027), Section 43A remains fully in force on 6 November 2026."
  },
  {
    "id": "QC-P2-01",
    "quickCheckNumber": 2,
    "moduleOrder": 14,
    "relatedModule": "data-principal-rights-child-safeguards",
    "pillar": "PILLAR 2: DATA PRINCIPAL RIGHTS",
    "scenario": "An online educational school app tracks the real-time keystroke rhythm, app session duration, and navigation patterns of 13-year-old enrolled students. The app uses these behavioral metrics to deliver commercial advertisements for external fashion brands and soft drinks. The school claims it is exempt from Section 9(3) under Rule 12 and Part A of the Fourth Schedule to the DPDP Rules, 2025.",
    "question": "Upon the scheduled commencement of the DPDP Act and Rules on 13 May 2027, does the Fourth Schedule exempt the school's advertising?",
    "options": [
      "Yes, because recognized educational institutions have a blanket exemption from all child data obligations under Section 9.",
      "No; under Rule 12 and Part A of the Fourth Schedule, the exemption for educational institutions permits tracking solely for the educational activities of the institution or the safety of enrolled children; commercial behavioral advertising remains non-exempt.",
      "Yes, provided parental consent was obtained during school admission.",
      "No, because educational institutions are only covered under Part B."
    ],
    "correctOptionIndex": 1,
    "correctKey": "B",
    "explanation": "Rule 12 and Part A of the Fourth Schedule to the DPDP Rules, 2025 exempt educational institutions from Section 9(3) tracking and monitoring strictly where undertaken for the educational activities of the institution or ensuring child safety. Commercial advertising and marketing profiling are not covered by the exemption."
  },
  {
    "id": "QC-P3-01",
    "quickCheckNumber": 3,
    "moduleOrder": 15,
    "relatedModule": "notice-consent-fiduciary-obligations",
    "pillar": "PILLAR 3: CONSENT AND DATA FIDUCIARY OBLIGATIONS",
    "scenario": "A user installs a basic offline torch/flashlight utility app on an Android device. The app presents a terms-of-service screen requiring the user to consent to the continuous harvesting of their contact book, GPS location, and microphone audio before the torch toggle will function.",
    "question": "Under the prospective statutory principles enacted in Section 6(1) of the DPDP Act, 2023, what is the legal validity of this consent?",
    "options": [
      "Valid, because consent was clicked prior to app usage.",
      "Invalid, because consent cannot be made conditional on granting access to personal data that is not necessary for the performance of that service.",
      "Valid, provided the app developer maintains a registered office in India.",
      "Invalid only if the user is a senior citizen."
    ],
    "correctOptionIndex": 1,
    "correctKey": "B",
    "explanation": "Under Section 6(1) of the DPDP Act, 2023, consent must be free, specific, informed, unconditional, and unambiguous. Conditioning the provision of a basic service on consent to collect personal data unnecessary for that service vitiates consent."
  },
  {
    "id": "QC-P4-01",
    "quickCheckNumber": 4,
    "moduleOrder": 16,
    "relatedModule": "platform-governance-intermediary-due-diligence",
    "pillar": "PILLAR 4: GRIEVANCE REDRESSAL AND DIGITAL GOVERNANCE",
    "scenario": "A college student discovers that an ex-partner has uploaded intimate, non-consensual sexually explicit photographs to an online content-sharing platform. The victim submits an urgent grievance to the platform's Resident Grievance Officer with direct links.",
    "question": "What is the platform's mandatory statutory removal timeline under Rule 3(2)(b) of the IT Rules, 2021 (as amended February 2026)?",
    "options": [
      "Within 24 hours of receiving the grievance.",
      "Within two hours of receiving the grievance, and taking reasonable and practicable measures to prevent recurrence.",
      "Within 36 hours under the expedited grievance track.",
      "Within 7 days after the victim obtains a formal court injunction."
    ],
    "correctOptionIndex": 1,
    "correctKey": "B",
    "explanation": "Under Rule 3(2)(b) of the IT Rules, 2021 as amended by G.S.R. 120(E), intermediaries must remove or disable access to non-consensual intimate imagery within two hours of receipt of a grievance, and take reasonable and practicable measures to prevent its re-uploading or recurrence."
  },
  {
    "id": "QC-P5-01",
    "quickCheckNumber": 5,
    "moduleOrder": 17,
    "relatedModule": "digital-copyright-fair-dealing-tpm",
    "pillar": "PILLAR 5: COPYRIGHT AND INTELLECTUAL PROPERTY",
    "scenario": "A cybersecurity auditing firm is formally engaged under a written security testing contract by the operator and owner of a secure cloud software distribution network. The auditor circumvents the technological protection measure (TPM) protecting the application solely to test for authentication bypass vulnerabilities, reporting all findings directly to the network operator without distributing pirated copies.",
    "question": "Is the auditor's circumvention protected under Section 65A of the Copyright Act, 1957?",
    "options": [
      "Yes, because Section 65A(2)(d) explicitly exempts circumvention conducted for testing, investigating, or correcting the security of a computer system with the authorization of the system owner or operator.",
      "No, because circumvention of any technological measure is an absolute criminal offence under Section 65A(1).",
      "Yes, but only if the auditor obtained advance written permission from the Registrar of Copyrights.",
      "No, because copyright law does not recognize cybersecurity exceptions."
    ],
    "correctOptionIndex": 0,
    "correctKey": "A",
    "explanation": "Section 65A(1) of the Copyright Act, 1957 penalizes intentional circumvention of effective TPMs for infringing copyright. Section 65A(2)(d) provides a statutory exemption for security testing conducted with the explicit authorization of the owner or operator of the computer system or network."
  },
  {
    "id": "QC-P6-01",
    "quickCheckNumber": 6,
    "moduleOrder": 18,
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "pillar": "PILLAR 6: MALWARE AND CYBER THREATS",
    "scenario": "A senior systems administrator at a business process outsourcing (BPO) firm accesses client database servers while performing routine maintenance under a lawful IT services contract. The administrator extracts spreadsheets containing customer phone numbers, home addresses, and personal financial profiles. Knowing a competitor will pay for the leads, the administrator sells the personal data without customer consent, with the intent to cause wrongful gain to himself and wrongful loss to the contracting firm.",
    "question": "What statutory violation has the administrator committed under the Information Technology Act, 2000?",
    "options": [
      "Violation of IT Act Section 72A (disclosure of personal information in breach of lawful contract with intent to cause wrongful loss or gain), liable to a penalty up to ₹25 lakh.",
      "Only an internal company disciplinary breach.",
      "Violation of Section 66A of the IT Act.",
      "Copyright infringement under Section 63."
    ],
    "correctOptionIndex": 0,
    "correctKey": "A",
    "explanation": "All statutory elements of Section 72A of the IT Act, 2000 are satisfied: access secured while providing services under a lawful contract; material containing personal information of another person; disclosure without consent or in breach of contract; and mens rea of intent to cause wrongful gain or wrongful loss. Under the Jan Vishwas Act, 2023, the penalty extends up to ₹25 lakh."
  },
  {
    "id": "QC-P7-01",
    "quickCheckNumber": 7,
    "moduleOrder": 18,
    "relatedModule": "malware-professional-confidentiality-defensive-citizenship",
    "pillar": "PILLAR 7: DEFENSIVE DIGITAL CITIZENSHIP",
    "scenario": "A customer of a Regional Rural Bank (RRB) discovers an unauthorized electronic debit of ₹12,000 on Tuesday morning caused by an external third-party breach (neither bank nor customer deficiency). The customer notifies the RRB in writing on Wednesday afternoon (within two working days).",
    "question": "What is the customer's liability and the RRB's obligation under Paragraphs 119 and 124 of the RBI Master Directions for Regional Rural Banks?",
    "options": [
      "Zero liability under Paragraph 119(2), and the RRB must credit the account (provisional shadow reversal) within 10 working days under Paragraph 124.",
      "Capped at ₹5,000 under the Basic Savings Bank Deposit limit.",
      "The customer bears 100% of the loss until the cyber police complete investigation.",
      "The RRB must resolve the matter within 24 hours."
    ],
    "correctOptionIndex": 0,
    "correctKey": "A",
    "explanation": "Under Paragraph 119(2) of the Master Directions for RRBs (Circular DCBR.CO.RRB.BC.No.06/31.05.001/2017-18), a customer has zero liability where an unauthorized transaction occurs due to a third-party breach and the customer notifies within 3 working days. Under Paragraph 124, the RRB must provide a shadow reversal within 10 working days."
  }
];

// Primary export is array of 21 questions with quickChecks attached as property
expandedQuestions.expandedQuestions = expandedQuestions;
expandedQuestions.quickChecks = quickChecks;

module.exports = expandedQuestions;
