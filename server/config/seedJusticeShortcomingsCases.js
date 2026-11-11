/**
 * Dedicated Insert-Only Seed Script: Cases Where Justice Fell Short
 * Authoritative Collection Baseline: Product Owner Decisions (8 November 2026)
 * 
 * Invariants & Safeguards:
 * 1. Strictly Insert-Only: zero update operators; aborts if any target slug exists.
 * 2. Preflight Collision Check: asserts zero target slugs exist before opening write transactions.
 * 3. Pre-Seed Snapshot: captures baseline count (11) and deterministic SHA-256 digests.
 * 4. Provenance Tracking: stamps each inserted document with a unique batch UUID (seedBatchId).
 * 5. Post-Seed ID Manifest: exports exact inserted MongoDB IDs for verifiable rollback.
 * 6. Database Connection Guard: requires explicit --confirm flag to execute database operations.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
let dotenv;
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.NODE_ENV !== 'test' &&
  process.env.ASSERT_STAGING_DB !== 'true'
) {
  try {
    dotenv = require('dotenv');
  } catch (e) {
    try {
      dotenv = require('../node_modules/dotenv');
    } catch (e2) {}
  }
  if (dotenv) {
    dotenv.config({ path: path.join(__dirname, '../.env') });
  }
}
const { validateSeedExecutionTarget } = require('./seedSecurityGuard');
const { logSafeServerError } = require('../utils/apiErrorResponder');
const mongoose = require('mongoose');
let connectDB = null;
try {
  connectDB = require('./db');
} catch (e) {}
const CaseStudy = require('../models/CaseStudy');

// Target collection identifier
const COLLECTION_NAME = 'Cases Where Justice Fell Short';

// Approved 10 target slugs (Strict Whitelist)
const TARGET_SLUGS = [
  'sulli-deals-bulli-bai-investigation-delays',
  'jaiprakash-kulkarni-v-banking-ombudsman',
  'cyberabad-instant-loan-app-syndicates',
  'harshada-bindu-dholepatil-v-vodafone-idea',
  'aeps-biometric-cloned-deed-exploits',
  'aiims-new-delhi-ransomware-incident',
  'pegasus-technical-committee-inquiry',
  'ravinder-singh-v-state-of-punjab',
  'cfcfrms-1930-restitution-gap',
  'kudankulam-administrative-network-malware'
];

// Deterministic canonical JSON serialization (RFC 8785 standard key sorting)
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const entries = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`);
  return '{' + entries.join(',') + '}';
}

// Compute deterministic SHA-256 digest
function computeDocumentDigest(doc) {
  return crypto.createHash('sha256').update(canonicalStringify(doc)).digest('hex');
}

// Pure function simulating the preflight collision check
function checkSlugCollisions(targetSlugs, existingSlugs) {
  const existingSet = new Set(existingSlugs);
  const collisions = targetSlugs.filter(slug => existingSet.has(slug));
  return {
    hasCollisions: collisions.length > 0,
    collisions
  };
}

// The 10 authored case study records for "Cases Where Justice Fell Short"
const justiceShortcomingsCasesData = [
  // -------------------------------------------------------------------------
  // Case 01: Sulli Deals & Bulli Bai
  // -------------------------------------------------------------------------
  {
    title: 'The Cross-Border Harassment Case',
    officialCaseName: 'Sulli Deals & Bulli Bai: Cross-Border Platform Evidence & Procedural Delays',
    slug: 'sulli-deals-bulli-bai-investigation-delays',
    caseNumber: 'CS-JS-01',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Investigative & Evidentiary Gaps',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Cross-Border Digital Harassment & Platform Impunity',
    attackVector: 'Open-Source Repository Abuse & Image Misappropriation',
    shortDescription: 'An examination of how domestic investigative notices encountered jurisdictional limits when requesting subscriber metadata from foreign-hosted open-source platforms in targeted online harassment incidents.',
    difficulty: 'Advanced',
    featured: true,
    sourceSummary: 'Lok Sabha Unstarred Question 4143 (29 Mar 2022); GitHub 2021 Transparency Report; Supreme Court Order in Aumkareshwar Thakur v. State of NCT of Delhi (1 Dec 2025).',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'In July 2021 and January 2022, two separate applications—Sulli Deals and Bulli Bai—were hosted on the foreign open-source code hosting platform GitHub. The applications misappropriated publicly accessible photographs of prominent Muslim women without consent, presenting them in a mock-auction format accompanied by derogatory and communal commentary. Although Delhi and Mumbai Police registered FIRs, investigators encountered substantive delays in obtaining foreign-hosted user logs and IP metadata through domestic procedural notices, necessitating formal international legal assistance.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'In July 2021, Sulli Deals appeared on GitHub. Delhi Police Cyber Prevention and Awareness Branch issued notices to the intermediary seeking account creation IP addresses and access logs. Under its established international data disclosure policy, GitHub routed foreign law enforcement requests through formal international mechanisms. In January 2022, a separate application, Bulli Bai, was deployed by different individuals. Multiple state police forces coordinated arrests in early 2022. On 1 December 2025, the Supreme Court disposed of connected writ petitions (W.P. (Crl.) 27/2022) with liberty to pursue statutory trial remedies as magistrate proceedings progressed.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary record: (1) Sulli Deals and Bulli Bai were distinct incidents involving separate perpetrators, confirmed by MHA Lok Sabha UQ 4143 (29 March 2022). (2) GitHub transparency disclosures confirm foreign law enforcement requests require formal legal process through the US Department of Justice. Alleged: Police submissions alleged that domestic delay impeded preventive interception; however, judicial findings do not establish direct legal causation between the first inquiry delay and the second incident. Unresolved: Case-specific MLAT correspondence and transmission timestamps remain non-public.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'Law enforcement filed charge-sheets under Sections 153A, 153B, 354A, and 509 of the Indian Penal Code, alongside Section 67 of the IT Act. Subsequent magistrate proceedings in Mumbai and Delhi addressed bail applications and discharge requests (including discharge rejection for Mayank Rawat and discharge report for Vishal Jha in 2026). The Supreme Court closed constitutional petitions in December 2025, directing that challenges be adjudicated within regular trial courts.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Section 91 CrPC (now Section 94 BNSS) empowers police to compel document production from entities within Indian jurisdiction. However, extraterritorial cloud platforms incorporated abroad operate under foreign privacy legislation (e.g., US Stored Communications Act, 18 U.S.C. § 2701). Evidentiary requests for non-content subscriber data frequently necessitate formal Mutual Legal Assistance Treaties (MLAT) or Letters Rogatory, creating procedural lag times that domestic cyber cells cannot circumvent by unilateral demand.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'When facing online targeted harassment or image-based abuse: (1) Document and preserve URLs, repository identifiers, and full-screen captures with timestamps immediately. (2) File complaints through the National Cybercrime Reporting Portal (cybercrime.gov.in) under the Women/Child Crime reporting category. (3) Report the violation simultaneously to the hosting intermediary under IT Rules 2021 grievance mechanisms, citing impersonation and non-consensual imagery.'
      }
    ],
    timeline: [
      { time: 'July 2021', label: 'Sulli Deals Creation', description: 'Application deployed on GitHub; initial FIRs registered in Delhi.', type: 'contact' },
      { time: 'August 2021', label: 'Intermediary Process Initiated', description: 'Police issue statutory production notices to overseas platform.', type: 'escalation' },
      { time: 'January 2022', label: 'Bulli Bai Deployed', description: 'Second application deployed; inter-state police action yields arrests.', type: 'discovery' },
      { time: 'December 2025', label: 'Supreme Court Disposal', description: 'Supreme Court disposes connected writ petitions with liberty for trial remedies.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'When digital harassment content is hosted on a foreign service provider, what is the legal consequence of issuing a domestic Section 91 CrPC notice?',
        options: [
          { optionText: 'The foreign provider is legally compelled to instantly delete all accounts within 24 hours under domestic contempt rules.', isCorrect: false, explanation: 'Domestic summons cannot unilaterally execute extraterritorial jurisdiction over foreign entities without international legal treaties.' },
          { optionText: 'The provider may require formal international legal process (MLAT/Letters Rogatory) through the Ministry of Home Affairs.', isCorrect: true, explanation: 'Cross-border data disclosures often require formal sovereign treaties or reciprocal legal assistance protocols.' },
          { optionText: 'The notice immediately freezes all domestic bank accounts belonging to the foreign company.', isCorrect: false, explanation: 'Section 91 CrPC is an evidentiary production summons, not an inter-bank asset attachment order.' }
        ],
        explanation: 'Intermediaries incorporated abroad are governed by their domestic privacy statutes and established cross-border treaty frameworks.'
      }
    ],
    warningSigns: [
      { title: 'Cross-Border Repository Abuse', explanation: 'Perpetrators leveraging overseas code repositories to bypass domestic platform verification.' },
      { title: 'Non-Consensual Image Scraping', explanation: 'Systematic harvesting of public social media profiles for malicious secondary hosting.' }
    ],
    attackerObjectives: [
      'Targeted communal harassment and intimidation of prominent women.',
      'Exploitation of jurisdictional friction between domestic police and overseas platforms.',
      'Anonymized dissemination of defamatory content via public code-hosting infrastructure.'
    ],
    impact: {
      financial: 'Direct legal and procedural expenses incurred by victims pursuing complaints.',
      account: 'Compromise and weaponization of public social media imagery.',
      privacy: 'Severe breach of informational privacy, personal dignity, and bodily autonomy.',
      operational: 'Substantive procedural lag across multi-jurisdictional law enforcement inquiries.',
      emotional: 'Extensive psychological distress, communal harassment, and safety concerns.'
    },
    response: [
      'Delhi and Mumbai Cyber Cells registered multiple FIRs under IPC and IT Act.',
      'Coordination with CERT-In and MEA/MHA for cross-border platform communication.',
      'Deployment of emergency intermediary grievance escalation channels.'
    ],
    preventionLessons: [
      'Digital evidence hosted abroad requires prompt preservation requests under Section 91 CrPC / Section 94 BNSS (and 18 U.S.C. § 2703(f) for US-based hosts) alongside formal MLAT processing.',
      'Intermediary grievance officers in India must be served with verified takedown requests under IT Rules Rule 3(2)(b).'
    ],
    legalContext: ['IT Act Section 66', 'IT Act Section 67', 'IT Rules 2021 Rule 3(2)(b)', 'IPC Section 153A', 'IPC Section 354A', 'IPC Section 509'],
    relatedCrimes: ['cyberstalking', 'identity-theft'],
    relatedModules: ['module-07', 'module-14'],
    sources: [
      {
        title: 'Lok Sabha Unstarred Question 4143: Action on Sulli Deals and Bulli Bai',
        authority: 'Ministry of Home Affairs, Government of India',
        url: 'https://sansad.in/ls',
        publicationDate: '2022-03-29',
        sourceType: 'government',
        citation: 'Lok Sabha UQ 4143',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      },
      {
        title: 'GitHub Transparency Report 2021: Government and Law Enforcement Requests',
        authority: 'GitHub Inc.',
        url: 'https://github.blog',
        publicationDate: '2021-12-31',
        sourceType: 'official',
        citation: 'GitHub Transparency Report 2021',
        documentType: 'Corporate Transparency Report',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Aumkareshwar Thakur v. State of NCT of Delhi, W.P. (Crl.) 27/2022',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in',
        publicationDate: '2025-12-01',
        sourceType: 'court',
        citation: 'W.P. (Crl.) 27/2022',
        documentType: 'Supreme Court Order',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 02: Jaiprakash Kulkarni v. Banking Ombudsman
  // -------------------------------------------------------------------------
  {
    title: 'The Unauthorized Bank Transfer Dispute',
    officialCaseName: 'Jaiprakash Kulkarni & Anr. v. Banking Ombudsman: Delivery of Electronic Banking Alerts',
    slug: 'jaiprakash-kulkarni-v-banking-ombudsman',
    caseNumber: 'CS-JS-02',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Banking & Regulatory Inquiries',
    evidentiaryClassification: 'Established Institutional Failure',
    incidentType: 'Unauthorized Commercial Banking Transfers',
    attackVector: 'Corporate Net-Banking Compromise & Beneficiary Manipulation',
    shortDescription: 'The Bombay High Court set aside a Banking Ombudsman rejection after determining that the bank failed to establish actual delivery of beneficiary-addition alerts, ordering a refund of ₹76,90,017 with interest.',
    difficulty: 'Advanced',
    featured: true,
    sourceSummary: 'Bombay High Court Judgment in W.P. 1150/2023 (13 Jun 2024); RBI Customer Protection Circular DBR.No.Leg.BC.78/09.07.005/2017-18; Cyber Cell Audit Records.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'On 1 and 2 October 2022, unauthorized electronic fund transfers totaling ₹76,90,017 were siphoned via RTGS and NEFT from the corporate current account of Pharma Search Ayurveda Pvt. Ltd. at Bank of Baroda. The Banking Ombudsman rejected the account holders complaint on the presumption that two-factor authentication (2FA) SMS messages had been generated. On 13 June 2024, the Bombay High Court quashed the Ombudsman rejection, establishing that mere generation of SMS records does not prove delivery to the customer.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'On Saturday 1 October 2022, fraudulent actors accessed the net-banking portal and initiated multiple third-party beneficiary additions. The bank generated beneficiary alerts, but telco delivery logs confirmed these alerts were never delivered to the registered phone or email. On Sunday 2 October, large RTGS/NEFT transfers occurred. Transaction OTPs were generated and sent to the phone, but corresponding debit confirmation emails were not delivered. The petitioner reported the fraud immediately on Monday morning. The Ombudsman summarily dismissed the complaint, prompting writ proceedings in the High Court.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary judicial record: (1) Bombay High Court verified that beneficiary-addition SMS alerts on 1 October 2022 were undelivered. (2) The Court distinguished the ordered refund of ₹76,90,017 with 6% annual interest from the Cyber Cell transaction ledger showing ₹76,90,444.70. Alleged: The bank alleged customer negligence in credential storage; the Court held the bank failed to discharge its statutory burden of proof under RBI directions. Unresolved: The technical compromise vector of the original net-banking password was not conclusively established in the civil writ.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'In its landmark ruling (2024:BHC-OS:8627-DB), the Division Bench held that the Banking Ombudsman failed to conduct an adequate inquiry into the factual delivery of mandatory security alerts. The High Court quashed the Ombudsman order and directed Bank of Baroda to refund the entire ₹76,90,017 together with 6% per annum interest from 2 October 2022 until actual payment, affirming customer protection principles.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Under RBI Customer Protection Directions (DBR.No.Leg.BC.78/09.07.005/2017-18), where customer negligence is not established and reporting occurs within three working days, zero liability applies. The burden of proving customer negligence lies squarely on the bank. The High Court established that the transmission of an electronic alert is an incomplete legal defense unless the financial institution can substantiate actual, timely receipt by the registered customer.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'For corporate and individual account holders: (1) Audit SMS and email delivery logs with your telecom service provider immediately following any disputed debit. (2) Maintain a written and stamped timestamp of your initial branch complaint alongside the 1930 portal acknowledgment. (3) Challenge perfunctory Ombudsman rejections by citing non-delivery of beneficiary addition notices under the 6 July 2017 RBI Master Circular.'
      }
    ],
    timeline: [
      { time: '1 Oct 2022', label: 'Beneficiary Addition Attempt', description: 'Fraudulent third-party beneficiaries added; alerts fail to deliver.', type: 'contact' },
      { time: '2 Oct 2022', label: 'Unauthorized Transfers', description: 'Over ₹76.9 lakh siphoned across RTGS/NEFT debit transactions.', type: 'escalation' },
      { time: '3 Oct 2022', label: 'Prompt Fraud Reporting', description: 'Account holder alerts bank branch, Cyber Cell, and 1930.', type: 'discovery' },
      { time: '13 Jun 2024', label: 'High Court Refund Ruling', description: 'Bombay High Court orders full refund of ₹76,90,017 plus 6% interest.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Under RBI directions, if a bank proves that an OTP was generated on its server, is the customer automatically liable for the resulting unauthorized debit?',
        options: [
          { optionText: 'Yes, because server-side generation of an OTP completes the bank legal obligation.', isCorrect: false, explanation: 'The High Court held that server generation does not prove delivery or customer receipt.' },
          { optionText: 'No, the bank must prove both customer negligence and actual delivery of required transaction/beneficiary alerts.', isCorrect: true, explanation: 'The burden of proof remains with the institution under the RBI 2017 customer liability framework.' },
          { optionText: 'Yes, unless the customer obtains an immediate High Court stay within 24 hours.', isCorrect: false, explanation: 'High Court writ jurisdiction is an appellate remedy, not a prerequisite for statutory zero-liability protection.' }
        ],
        explanation: 'Generation of a notification code on an internal server is legally distinct from verifiable transmission and delivery to the customer registered device.'
      }
    ],
    warningSigns: [
      { title: 'Absence of Beneficiary Confirmation Alerts', explanation: 'Failure of routine SMS alerts to arrive during critical net-banking profile changes.' },
      { title: 'Off-Hours High-Value Corporate Debits', explanation: 'Large batch transfers scheduled over weekends or national holidays to exploit bank branch closures.' }
    ],
    attackerObjectives: [
      'Silently compromise corporate internet banking credentials.',
      'Exploit non-delivery gaps in SMS gateways to add unauthorized payee accounts.',
      'Execute multi-lakh fund diversion across rapid RTGS and NEFT channels.'
    ],
    impact: {
      financial: 'Temporary loss of ₹76,90,017 corporate operating capital for over 20 months.',
      account: 'Severe disruption of commercial current account operations.',
      privacy: 'Compromise of corporate online banking authentication credentials.',
      operational: 'Prolonged litigation across the Banking Ombudsman and High Court.',
      emotional: 'Significant business distress and uncertainty regarding institutional insolvency.'
    },
    response: [
      'Immediate physical complaint lodged at Bank of Baroda branch.',
      'Formal cyber fraud report filed with Mumbai Cyber Crime Police Station.',
      'Writ Petition filed under Article 226 of the Constitution of India.'
    ],
    preventionLessons: [
      'Enterprises should mandate cooling-off periods and out-of-band phone verification for high-value beneficiary additions.',
      'Regularly reconcile telecom delivery status logs with bank transaction registers.'
    ],
    legalContext: ['RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18', 'IT Act Section 43A', 'Constitution of India Article 226', 'Banking Ombudsman Scheme 2021'],
    relatedCrimes: ['phishing', 'identity-theft'],
    relatedModules: ['module-04', 'module-12'],
    sources: [
      {
        title: 'Jaiprakash Kulkarni & Anr. v. Banking Ombudsman & Anr., W.P. 1150/2023',
        authority: 'High Court of Judicature at Bombay',
        url: 'https://bombayhighcourt.nic.in',
        publicationDate: '2024-06-13',
        sourceType: 'court',
        citation: '2024:BHC-OS:8627-DB',
        documentType: 'High Court Judgment',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions',
        authority: 'Reserve Bank of India',
        url: 'https://www.rbi.org.in',
        publicationDate: '2017-07-06',
        sourceType: 'official',
        citation: 'RBI/2017-18/15 DBR.No.Leg.BC.78/09.07.005/2017-18',
        documentType: 'RBI Master Circular',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 03: Cyberabad Instant Micro-Lending Investigations
  // -------------------------------------------------------------------------
  {
    title: 'The Predatory Loan App Ring',
    officialCaseName: 'Cyberabad Instant Micro-Lending Investigations: Fintech Syndicates & NBFC Outsourcing',
    slug: 'cyberabad-instant-loan-app-syndicates',
    caseNumber: 'CS-JS-03',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Platform & Marketplace Lags',
    evidentiaryClassification: 'Established Institutional Failure',
    incidentType: 'Predatory Digital Lending & Coercive Recovery',
    attackVector: 'Mobile Application Permission Harvesting & Regulatory Arbitrage',
    shortDescription: 'Inter-agency enforcement against unregulated instant lending applications that harvested borrower contacts and leveraged non-compliant NBFC outsourcing arrangements.',
    difficulty: 'Advanced',
    featured: false,
    sourceSummary: 'Telangana High Court W.P. (PIL) 13/2021; Enforcement Directorate Press Release (23 Aug 2024); Appellate Tribunal under SAFEMA Order (5 Jan 2026); RBI Digital Lending Directions 2025.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'Between 2020 and 2024, law enforcement agencies across Telangana, Maharashtra, and Karnataka investigated syndicates operating hundreds of mobile instant-loan applications. These apps disbursed micro-credit with deductions exceeding 30% and interest exceeding 100% APR, demanding repayment within seven days. When borrowers defaulted, call centers deployed harvested phone contacts, edited photographs, and abusive messages. Regulatory and tribunal proceedings revealed widespread evasion of RBI lending norms via nominal partnerships with Non-Banking Financial Companies (NBFCs).'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'In 2020–2021, Cyberabad and Rachakonda police registered 43 FIRs. In W.P. (PIL) 13/2021, the Telangana DGP filed an affidavit identifying 290 loan apps on Google Play, detailing 66 criminal cases across the state. The Enforcement Directorate initiated PMLA investigations, leading to prosecution complaints in August 2024. In January 2026, the Appellate Tribunal under SAFEMA dismissed appeals by entities including Pawan Finvest and Uu Cash, upholding provisional attachment of funds derived from unauthorized fintech outsourcing arrangements.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary record: (1) The Telangana DGP affidavit established 290 identified applications and 66 police cases. (2) The Appellate Tribunal (5 Jan 2026) confirmed that regulated NBFCs unlawfully outsourced core customer onboarding, underwriting, and recovery functions to offshore fintech entities. (3) High Court rulings in Smartcoin (Nov 2024) and Krazybee (Mar 2025) quashed specific ECIR proceedings solely on individual petitioner facts. Alleged: Coercive tactics and extortion were alleged in ED complaint filings. Unresolved: Police records cite IPC 306 references in six cases, but direct legal causation between specific app harassment and individual suicide outcomes was not conclusively established by uniform judicial decree.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'The Reserve Bank of India issued historical Digital Lending Guidelines in September 2022, culminating in the comprehensive RBI Digital Lending Directions, 2025 (issued 8 May 2025). The Appellate Tribunal under SAFEMA affirmed ED provisional attachments in January 2026, establishing that profits generated through unlawful outsourcing of credit functions constitute proceeds of crime subject to forfeiture.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Regulated entities cannot contract out their statutory obligations under the Reserve Bank of India Act, 1934. Storing borrower contact lists, biometric records, or gallery media violates RBI digital lending mandates and Section 43A of the IT Act. Furthermore, non-consensual contact scraping violates the Digital Personal Data Protection Act, 2023, while threatening communications violate Section 308 BNS (extortion) and Section 351 BNS (criminal intimidation).'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'Before downloading any loan application: (1) Verify whether the application is officially partnered with an RBI-registered NBFC or Bank via the RBI Sachet portal (sachet.rbi.org.in). (2) Never grant contacts, SMS, or camera gallery permissions to lending apps. (3) If subjected to recovery harassment, immediately report the incident to 1930 and file a complaint on the RBI CMS portal against the partnering NBFC.'
      }
    ],
    timeline: [
      { time: '2020–2021', label: 'Syndicate Onset', description: 'Over 290 predatory apps identified; Cyberabad and Rachakonda register 43 FIRs.', type: 'contact' },
      { time: 'Nov 2021', label: 'High Court PIL Order', description: 'Telangana High Court reviews DGP affidavit regarding app takedowns.', type: 'escalation' },
      { time: 'Aug 2024', label: 'ED Prosecution Complaint', description: 'ED files prosecution complaint; Special Court takes cognizance.', type: 'discovery' },
      { time: 'Jan 2026', label: 'SAFEMA Tribunal Ruling', description: 'Appellate Tribunal upholds provisional attachments against non-compliant NBFC-fintech entities.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Can a regulated NBFC legally transfer its complete loan recovery and borrower contact collection operations to an independent third-party mobile app?',
        options: [
          { optionText: 'Yes, provided the third party offers competitive processing fees and cloud hosting.', isCorrect: false, explanation: 'Core lending functions cannot be delegated to evade regulatory oversight.' },
          { optionText: 'No, RBI Digital Lending Directions strictly prohibit outsourcing of core functions and unauthorized contact harvesting.', isCorrect: true, explanation: 'Regulated lenders maintain non-delegable statutory responsibility for borrower data privacy and fair practices.' },
          { optionText: 'Yes, but only if the mobile application is hosted on an overseas cloud server.', isCorrect: false, explanation: 'Overseas cloud hosting does not exempt entities from domestic financial regulations.' }
        ],
        explanation: 'The RBI framework holds the regulated entity strictly responsible for compliance with fair recovery practices and data minimization.'
      }
    ],
    warningSigns: [
      { title: 'Intrusive Mobile Permission Requests', explanation: 'Mandatory requests to read all personal contacts, call logs, and image galleries prior to loan approval.' },
      { title: 'Tenures Below 30 Days with 30%+ Processing Deductions', explanation: 'Instant loans demanding full repayment within 7–14 days with exorbitant upfront deductions.' }
    ],
    attackerObjectives: [
      'Harvest borrower phone books to build coercive social-shaming contact lists.',
      'Extract usurious interest and roll-over penalties under threat of reputation damage.',
      'Funnel illicit lending yields through complex shell corporate and crypto accounts.'
    ],
    impact: {
      financial: 'Massive cumulative extortion of vulnerable citizens across micro-loan penalties.',
      account: 'Compromise of borrower personal address books, contacts, and personal images.',
      privacy: 'Widespread non-consensual disclosure of borrower loan distress to family and employers.',
      operational: 'Multijurisdictional regulatory enforcement involving RBI, ED, and state police forces.',
      emotional: 'Extreme emotional distress, humiliation, and severe social harassment.'
    },
    response: [
      'Telangana Cyber Crime units issued app takedown requests to app marketplaces.',
      'Enforcement Directorate attached hundreds of crores in fintech and payment-gateway balances.',
      'RBI issued mandatory Digital Lending Directions banning contact and gallery access.'
    ],
    preventionLessons: [
      'Borrowers must verify lender registration on the RBI official portal before installing credit applications.',
      'Revoke and deny contact access permissions on Android and iOS devices for all financial tools.'
    ],
    legalContext: ['RBI Digital Lending Directions 2025', 'PMLA 2002 Section 5', 'IT Act Section 43A', 'BNS Section 308', 'BNS Section 351'],
    relatedCrimes: ['cyberstalking', 'identity-theft'],
    relatedModules: ['module-04', 'module-14'],
    sources: [
      {
        title: 'Telangana High Court Order in W.P. (PIL) 13/2021',
        authority: 'High Court for the State of Telangana',
        url: 'https://tshc.gov.in',
        publicationDate: '2021-11-09',
        sourceType: 'court',
        citation: 'W.P. (PIL) 13/2021',
        documentType: 'High Court Order',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Press Release: ED Files Prosecution Complaint in Instant Loan App Case',
        authority: 'Directorate of Enforcement, Government of India',
        url: 'https://enforcementdirectorate.gov.in',
        publicationDate: '2024-08-23',
        sourceType: 'official',
        citation: 'ED PR 23-Aug-2024',
        documentType: 'Enforcement Press Release',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Appellate Tribunal under SAFEMA Order in Appeals involving Pawan Finvest & Ors.',
        authority: 'Appellate Tribunal under SAFEMA, New Delhi',
        url: 'https://atfp.gov.in',
        publicationDate: '2026-01-05',
        sourceType: 'court',
        citation: 'Appeals under PMLA Section 26',
        documentType: 'Tribunal Appellate Order',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 04: Harshada Bindu Dholepatil v. Vodafone Idea Ltd.
  // -------------------------------------------------------------------------
  {
    title: 'The Franchisee SIM Swap Case',
    officialCaseName: 'Harshada Bindu Dholepatil v. Vodafone Idea Ltd.: Duplicate SIM Issuance & Identity Verification',
    slug: 'harshada-bindu-dholepatil-v-vodafone-idea',
    caseNumber: 'CS-JS-04',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Banking & Regulatory Inquiries',
    evidentiaryClassification: 'Established Institutional Failure',
    incidentType: 'Franchisee-Level SIM Swap Fraud',
    attackVector: 'Mismatched Identity Verification & Cellular Hijack',
    shortDescription: 'TDSAT affirmed compensation of ₹3,00,000 with 12% compound interest against a telecom provider after a franchisee issued a duplicate SIM against mismatched identity records, facilitating financial fraud.',
    difficulty: 'Intermediate',
    featured: false,
    sourceSummary: 'TDSAT Cyber Appeal 7/2019 (Judgment dated 25 Sep 2024); Maharashtra Adjudicating Officer Order; DoT Subscriber Verification Directives.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'On 13 January 2014, an unauthorized individual visited a telecom franchisee in Pune and requested a duplicate SIM for the mobile number registered to the complainant. The franchisee issued the replacement SIM card despite clear discrepancies between the submitted identity proofs and the original subscriber documentation. With the original subscriber SIM deactivated, fraudulent actors intercepted net-banking OTPs and siphoned ₹3,00,000 via unauthorized NEFT transfers.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'Upon sudden deactivation of cellular service on 13 January 2014, the subscriber visited the franchisee to inquire into network failure. The franchisee informed her that a replacement SIM had been issued. During the outage window, two unauthorized fund transfers of ₹1.5 lakh each took place. The subscriber filed an application before the Maharashtra Adjudicating Officer under Section 43/46 IT Act, which awarded ₹3,00,000 compensation. The telecom company appealed to TDSAT, which delivered its final judgment on 25 September 2024.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary tribunal record: (1) TDSAT confirmed that the telecom franchisee issued the replacement SIM without verifying the identity proof against original customer records, violating DoT mandatory guidelines. (2) TDSAT ordered Vodafone Idea Ltd. to pay ₹3,00,000 compensation with 12% compound interest from 2014. Alleged: The telecom provider contended that bank OTP interception mechanics were unproven; the Tribunal held that cellular deactivation was the proximate cause enabling account takeover. Unresolved: Criminal prosecution of the individual fraudulent recipient was conducted in separate criminal proceedings.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'The Telecom Disputes Settlement and Appellate Tribunal (TDSAT) firmly rejected the telecom appeal. The Tribunal held that telecommunication providers are vicariously liable for gross procedural negligence committed by their authorized retail franchisees during subscriber onboarding and SIM replacement verification.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Under Department of Telecommunications (DoT) subscriber verification mandates, issuing duplicate SIM cards requires strict verification of original identity documentation, physical signature matching, and biometric confirmation. Failure to observe these statutory safeguards constitutes actionable negligence under Section 43(g) of the Information Technology Act, 2000.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'To protect against SIM-swap fraud: (1) If your mobile handset abruptly displays "No Service" or "SIM Inactive" without an obvious cause, contact your mobile network operator immediately from an alternative line. (2) Notify your primary bank to freeze internet banking and UPI access pending SIM verification. (3) Register an inquiry at the DoT TAFCOP portal (tafcop.sancharsaathi.gov.in) to monitor mobile numbers issued against your identity.'
      }
    ],
    timeline: [
      { time: '13 Jan 2014', label: 'Fraudulent SIM Issuance', description: 'Franchisee issues replacement SIM against mismatched ID records.', type: 'contact' },
      { time: '13 Jan 2014', label: 'Unauthorized Transfers', description: 'Two NEFT transfers totaling ₹3 lakh siphoned during cellular outage.', type: 'escalation' },
      { time: '18 Jan 2019', label: 'Adjudicating Officer Award', description: 'Maharashtra AO awards ₹3 lakh compensation under Section 43 IT Act.', type: 'discovery' },
      { time: '25 Sep 2024', label: 'TDSAT Final Affirmation', description: 'TDSAT upholds award with 12% compound interest against telecom operator.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Is a mobile telecommunication company legally responsible if an authorized third-party retail franchisee issues a duplicate SIM without verifying customer documents?',
        options: [
          { optionText: 'No, the franchisee is an independent contractor and bears sole individual liability.', isCorrect: false, explanation: 'TDSAT ruled that telecom operators bear vicarious liability for authorized franchisee negligence.' },
          { optionText: 'Yes, the principal telecommunication provider is vicariously liable for procedural failures by its authorized agents.', isCorrect: true, explanation: 'Telecom operators cannot escape liability for regulatory verification breaches by delegating to franchisees.' },
          { optionText: 'No, liability rests entirely with the banking institution that sent the SMS OTPs.', isCorrect: false, explanation: 'Telecom negligence in SIM issuance is a distinct statutory wrong under DoT and IT Act rules.' }
        ],
        explanation: 'Telecommunication licensees have an affirmative non-delegable duty to maintain subscriber verification integrity.'
      }
    ],
    warningSigns: [
      { title: 'Sudden Unexplained Cellular Signal Loss', explanation: 'Loss of mobile network connectivity while others in the vicinity maintain normal signal strength.' },
      { title: 'SMS Inquiries Regarding Duplicate SIM Requests', explanation: 'Unprompted carrier notifications stating that a SIM replacement or upgrade request has been registered.' }
    ],
    attackerObjectives: [
      'Hijack the victim phone number to intercept banking and email 2FA OTP codes.',
      'Bypass transaction verification mechanisms to execute unauthorized fund transfers.',
      'Exploit procedural laxity at decentralized retail cellular service outlets.'
    ],
    impact: {
      financial: 'Direct fraudulent withdrawal of ₹3,00,000 from the victim bank account.',
      account: 'Complete loss of cellular mobile service and primary communications.',
      privacy: 'Exposure of transactional and communications metadata to malicious third parties.',
      operational: 'Over ten years of legal appeals between state regulatory bodies and TDSAT.',
      emotional: 'Persistent frustration and distress resulting from institutional evasion of liability.'
    },
    response: [
      'Immediate in-person complaint lodged with telecom franchisee and bank.',
      'Statutory petition filed before the State Adjudicating Officer under IT Act.',
      'Defense of compensation award in appellate proceedings before TDSAT.'
    ],
    preventionLessons: [
      'Citizens must treat sudden mobile network deactivation as an urgent security emergency.',
      'Telecommunication companies must enforce multi-layered verification before activating replacement SIMs.'
    ],
    legalContext: ['IT Act Section 43', 'IT Act Section 46', 'Indian Telegraph Act 1885', 'DoT Subscriber Verification Guidelines'],
    relatedCrimes: ['sim-swap', 'financial-fraud'],
    relatedModules: ['module-04', 'module-14'],
    sources: [
      {
        title: 'Vodafone Idea Ltd. v. Harshada Bindu Dholepatil, Cyber Appeal 7/2019',
        authority: 'Telecom Disputes Settlement and Appellate Tribunal',
        url: 'https://tdsat.gov.in',
        publicationDate: '2024-09-25',
        sourceType: 'court',
        citation: 'Cyber Appeal 7/2019',
        documentType: 'Tribunal Judgment',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Instructions on Verification of New Mobile Subscribers',
        authority: 'Department of Telecommunications, Government of India',
        url: 'https://dot.gov.in',
        publicationDate: '2012-08-09',
        sourceType: 'government',
        citation: 'DoT Guidelines No. 800-09/2010-VAS',
        documentType: 'Government Directive',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 05: AePS Biometric Cloned-Deed Exploits
  // -------------------------------------------------------------------------
  {
    title: 'The Cloned Fingerprint Cash-Outs',
    officialCaseName: 'AePS Biometric Cloned-Deed Exploits: Land Registry Exposure & Authentication Deficits',
    slug: 'aeps-biometric-cloned-deed-exploits',
    caseNumber: 'CS-JS-05',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Platform & Marketplace Lags',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Biometric Replay & AePS Cash-Out Fraud',
    attackVector: 'Public Land Registry Scraping & Polymer Fingerprint Cloning',
    shortDescription: 'Syndicates exploited publicly accessible land-registry deed scans containing latent fingerprints to clone biometric impressions on polymer sheets and execute unauthorized micro-ATM withdrawals.',
    difficulty: 'Advanced',
    featured: false,
    sourceSummary: 'Hyderabad Police Press Note (22 Nov 2023); Haryana Web HALRIS Masking Memorandum; MHA Parliamentary Data on NCRP AePS Reporting (July 2024); RBI AePS Directions 2025.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'During 2023, cyber syndicates in multiple states exploited the Aadhaar-enabled Payment System (AePS) to withdraw funds without account holder knowledge. The perpetrators did not breach central biometric databases; instead, they scraped publicly accessible state land registration portals (such as Web HALRIS in Haryana and related deed repositories) that hosted unmasked sale deeds containing high-resolution thumb impressions and Aadhaar numbers. By etching latent prints onto polymer sheets and silicone molds, syndicates tricked basic AePS micro-ATMs into processing unauthorized cash withdrawals.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'In November 2023, Hyderabad Police dismantled an interstate gang. According to the police press note (22 November 2023), investigators uncovered approximately 2,500 downloaded land-registration deeds, approximately 1,000 cloned fingerprints, and over 2,500 illicit transactions totaling ₹10 lakh in losses, arresting six individuals. Following multiple exposures, state revenue departments issued directives to mask fingerprints on registry portals. In June 2025, RBI issued comprehensive AePS Touchpoint Operator Due Diligence Directions, effective 1 January 2026.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary record: (1) Hyderabad Police press releases documented the physical seizure of cloned polymer prints and biometric scanners. (2) Official Haryana Revenue Department memoranda confirmed that unmasked registered deeds had allowed public exposure of biometrics and ordered masking. (3) MHA parliamentary answers recorded approximately 29,000 AePS fraud incidents in NCRP. Crucial Distinction: No evidence establishes a compromise of UIDAI central Aadhaar database (CIDR). Alleged vs Fact: Unverified claims that NPCI mandated universal liveness detection on 1 January 2024 were contradicted by NPCI committee records showing phased rollout.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'State revenue authorities retroactively deployed redaction software on property portals. The Reserve Bank of India enacted the RBI AePS Touchpoint Operator Due Diligence Directions, 2025 (effective 1 January 2026), mandating continuous biometric operator due diligence, terminal binding, and biometric liveness detection.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Aadhaar biometric data constitutes Sensitive Personal Data under the IT Act and Protected Digital Personal Data under Section 2(t) of the DPDP Act, 2023. State agencies publishing unredacted property documents violated data minimization principles. Furthermore, micro-ATM point-of-sale systems that accepted static fingerprint impressions violated regulatory security requirements under Section 43A IT Act.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'To protect your accounts against AePS cloning: (1) Use the official mAadhaar application or UIDAI portal (myaadhaar.uidai.gov.in) to permanently LOCK your biometric data, unlocking it only temporarily when biometric authentication is required. (2) Instruct your bank to disable AePS transaction functionality on accounts where micro-ATM cash withdrawals are not needed. (3) Report unauthorized AePS debits within three days to qualify for zero-liability protection under RBI rules.'
      }
    ],
    timeline: [
      { time: 'Late 2023', label: 'Syndicate Exposure', description: 'Hyderabad Police seize 1,000+ cloned polymer fingerprints from deed downloads.', type: 'contact' },
      { time: 'Nov 2023', label: 'Enforcement Action', description: 'Six syndicate operators apprehended; ₹5 lakh cash recovered.', type: 'escalation' },
      { time: 'Mid 2024', label: 'Parliamentary Scrutiny', description: 'MHA reports ~29,000 AePS fraud complaints filed on NCRP.', type: 'discovery' },
      { time: 'Jan 2026', label: 'RBI Directions Effective', description: 'RBI AePS Touchpoint Operator Due Diligence Directions take legal effect.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Can an individual permanently protect their bank accounts against unauthorized biometric AePS withdrawals if their fingerprint was exposed on a public deed?',
        options: [
          { optionText: 'No, because once a fingerprint is compromised, biometric accounts can never be secured.', isCorrect: false, explanation: 'Biometric locking through UIDAI completely disables AePS authentication until explicitly unlocked.' },
          { optionText: 'Yes, by activating the "Biometric Lock" feature in the mAadhaar app or requesting the bank disable AePS.', isCorrect: true, explanation: 'Locking biometrics in the UIDAI portal blocks all AePS authentication requests at the central server.' },
          { optionText: 'Yes, but only by changing the physical fingerprint via an affidavit before a notary.', isCorrect: false, explanation: 'Physical fingerprints cannot be changed; cryptographic system locking is the legal and technical remedy.' }
        ],
        explanation: 'UIDAI Biometric Lock prevents authentication requests from succeeding regardless of cloned physical prints.'
      }
    ],
    warningSigns: [
      { title: 'SMS Alerts for Micro-ATM Withdrawals', explanation: 'Debit notifications citing AePS or Business Correspondent (BC) cash withdrawals without card use.' },
      { title: 'Unmasked Public Records', explanation: 'Government property or registration portals displaying unredacted thumbprints alongside Aadhaar numbers.' }
    ],
    attackerObjectives: [
      'Scrape high-resolution fingerprint scans from open state land-deed web portals.',
      'Fabricate silicone and polymer print facsimiles capable of bypassing optical sensors.',
      'Execute unauthorized micro-ATM withdrawals via compromised business correspondent terminals.'
    ],
    impact: {
      financial: 'Direct micro-debits ranging from ₹1,000 to ₹10,000 targeting rural and elder accounts.',
      account: 'Compromise of primary bank balances linked to Aadhaar numbers.',
      privacy: 'Irrevocable public exposure of biometric identifiers across land registry archives.',
      operational: 'Necessity for state-wide digital document redacting and hardware retrofitting.',
      emotional: 'Severe anxiety stemming from the compromise of an unchangeable bodily identifier.'
    },
    response: [
      'Inter-state police operations in Hyderabad and Haryana arrested key clone operators.',
      'State revenue departments retroactively masked deed registration archives.',
      'RBI enacted enhanced Touchpoint Operator Due Diligence Directions.'
    ],
    preventionLessons: [
      'All citizens should keep Aadhaar biometrics locked by default via the official mAadhaar portal.',
      'Public portals must implement automated redaction of biometric data prior to publishing public deeds.'
    ],
    legalContext: ['Aadhaar Act 2016 Section 29', 'IT Act Section 43A', 'DPDP Act 2023 Section 8', 'RBI AePS Touchpoint Directions 2025'],
    relatedCrimes: ['identity-theft', 'financial-fraud'],
    relatedModules: ['module-04', 'module-14'],
    sources: [
      {
        title: 'Press Note: Busting of Interstate Gang Cloning Fingerprints for AePS Frauds',
        authority: 'Hyderabad City Police, Cyber Crime Police Station',
        url: 'https://hyderabadpolice.gov.in',
        publicationDate: '2023-11-22',
        sourceType: 'official',
        citation: 'Hyderabad Police Press Note 22-Nov-2023',
        documentType: 'Police Press Release',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Memorandum regarding Masking of Biometrics and Personal Data on Web HALRIS',
        authority: 'Revenue & Disaster Management Department, Government of Haryana',
        url: 'https://haryanarevenue.gov.in',
        publicationDate: '2023-12-05',
        sourceType: 'government',
        citation: 'Memo No. 4567-Rev/2023',
        documentType: 'Government Memorandum',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Reserve Bank of India (Aadhaar Enabled Payment System - Touchpoint Operators) Directions, 2025',
        authority: 'Reserve Bank of India',
        url: 'https://www.rbi.org.in',
        publicationDate: '2025-06-27',
        sourceType: 'official',
        citation: 'RBI/2025-26/45 DOS.CO.PPG.No.78/11.01.005/2025-26',
        documentType: 'RBI Master Direction',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 06: AIIMS New Delhi Ransomware Incident
  // -------------------------------------------------------------------------
  {
    title: 'The Hospital Ransomware Lockdown',
    officialCaseName: 'AIIMS New Delhi Ransomware Incident: Critical Healthcare Network Disruption',
    slug: 'aiims-new-delhi-ransomware-incident',
    caseNumber: 'CS-JS-06',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Critical Infrastructure & Complex Attribution',
    evidentiaryClassification: 'Unresolved Incident',
    incidentType: 'Healthcare Critical Infrastructure Ransomware',
    attackVector: 'Improper Network Segmentation & Server Encryption',
    shortDescription: 'A debilitating ransomware attack encrypted five physical e-Hospital servers at AIIMS New Delhi, forcing manual hospital workflows for nearly two weeks while backup systems enabled functional recovery.',
    difficulty: 'Intermediate',
    featured: false,
    sourceSummary: 'MoHFW Lok Sabha UQ 1837 (16 Dec 2022); MeitY Lok Sabha UQ 2310 (21 Dec 2022); CERT-In Technical Security Advisory.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'On 23 November 2022, the digital e-Hospital network at the All India Institute of Medical Sciences (AIIMS) in New Delhi was disrupted by a targeted ransomware attack. The incident crippled patient registrations, outpatient appointments, billing, admission, discharge, and laboratory report distribution across the premier national healthcare institution. Medical personnel reverted to manual paper-based registers for nearly two weeks to maintain critical clinical operations.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'At approximately 7:00 AM on 23 November 2022, system administrators discovered that virtualized e-Hospital server instances were unresponsive and encrypted. MoHFW and MeitY deployed CERT-In, Delhi Police Intelligence Fusion and Strategic Operations (IFSO), and National Critical Information Infrastructure Protection Centre (NCIIPC) teams. Government parliamentary answers on 16 and 21 December 2022 confirmed that five physical NIC e-Hospital servers were encrypted. Data backups on an uninfected secondary server allowed data restoration to newly sanitized physical infrastructure, restoring essential digital workflows by 6 December 2022.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary parliamentary record: (1) MoHFW confirmed five physical servers were encrypted and that approximately 1.3 TB of data was encrypted. (2) MeitY reported that CERT-In preliminary analysis attributed the incident to unknown threat actors and cited improper network segmentation as a primary contributing factor. (3) The Government explicitly denied reports of a specific ₹200 crore ransom demand. Unresolved: No verified evidence established actual data exfiltration (encryption does not equal exfiltration), and official agencies have not conclusively attributed the intrusion to any named foreign nation-state syndicate.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'Delhi Police IFSO unit registered an FIR under Section 385 IPC (extortion) and Section 66F IT Act (cyber terrorism). AIIMS, NIC, and CERT-In established air-gapped server environments, tightened firewall ACLs, deployed endpoint detection and response (EDR) software, and sanitized all 5,000 endpoint workstations before reconnecting them to the internal network.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Under Section 70 of the Information Technology Act, 2000, healthcare facilities processing critical patient records can be designated Critical Information Infrastructure (CII). Section 70B mandates immediate notification of cyber security incidents to CERT-In within the prescribed 6-hour window. This incident emphasized that technical perimeter defenses are insufficient without rigorous internal network segmentation (VLAN isolation) between general administrative intranets and critical server subnets.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'For digital healthcare administrators and institutional network engineers: (1) Implement strict network segmentation ensuring that staff administrative workstations cannot directly route to core database servers. (2) Maintain immutable, offline (air-gapped) backups tested regularly for rapid bare-metal restoration. (3) Conduct mandatory incident drill exercises to ensure clinical staff can transition seamlessly to offline emergency workflows without patient care disruption.'
      }
    ],
    timeline: [
      { time: '23 Nov 2022', label: 'Ransomware Discovered', description: 'Five physical e-Hospital servers encrypted; manual procedures activated.', type: 'contact' },
      { time: '25 Nov 2022', label: 'Agency Deployment', description: 'CERT-In, IFSO, and NCIIPC deploy on-site to isolate infected network segments.', type: 'escalation' },
      { time: '6 Dec 2022', label: 'Core Services Restored', description: 'Data successfully restored from secondary backup server to newly deployed hardware.', type: 'discovery' },
      { time: '16–21 Dec 2022', label: 'Parliamentary Answers', description: 'Government confirms 1.3 TB encrypted, refutes specific ransom figure, cites segmentation gaps.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Under CERT-In directions and IT Act Section 70B, what is the mandatory reporting window for a critical infrastructure ransomware attack?',
        options: [
          { optionText: 'Within 30 calendar days following the completion of forensic root-cause analysis.', isCorrect: false, explanation: 'Mandatory reporting cannot be deferred until completion of full investigation.' },
          { optionText: 'Within 6 hours of noticing or being brought to notice of the incident.', isCorrect: true, explanation: 'CERT-In directions of April 2022 mandate reporting of critical cyber incidents within 6 hours.' },
          { optionText: 'Only after the perpetrator makes a verified monetary ransom communication.', isCorrect: false, explanation: 'Reporting obligations apply upon incident detection, irrespective of ransom demands.' }
        ],
        explanation: 'Mandatory reporting within 6 hours ensures rapid national coordination and technical mitigation.'
      }
    ],
    warningSigns: [
      { title: 'Flat Internal Network Architecture', explanation: 'Absence of VLAN segmentation between general office computers and critical hospital databases.' },
      { title: 'Simultaneous File Extension Alterations', explanation: 'Rapid mass encryption and renaming of database volumes accompanied by README ransom text files.' }
    ],
    attackerObjectives: [
      'Disrupt critical national healthcare infrastructure to cause public crisis and panic.',
      'Deploy enterprise-wide file encryption to paralyze electronic health records (EHR).',
      'Test defensive incident response and attribution readiness of national cyber agencies.'
    ],
    impact: {
      financial: 'Substantive institutional costs for hardware sanitization, forensic review, and upgrades.',
      account: 'Temporary unavailability of centralized patient portal accounts and lab history.',
      privacy: 'Potential exposure of patient records, though exfiltration remains unproven.',
      operational: 'Over 14 days of manual offline hospital registration, admission, and pharmacy logs.',
      emotional: 'Extensive anxiety among patients and families awaiting urgent surgeries and oncology care.'
    },
    response: [
      'CERT-In and Delhi Police IFSO seized infected servers for forensic imaging.',
      'Network completely isolated and rebuilt with zero-trust network access controls.',
      'Data restored from clean offline backup infrastructure without paying ransom.'
    ],
    preventionLessons: [
      'Critical health institutions must maintain isolated, immutable offline backups.',
      'Enforce multi-factor authentication across all remote access and server administrative portals.'
    ],
    legalContext: ['IT Act Section 70', 'IT Act Section 70B', 'IT Act Section 66F', 'IPC Section 385', 'CERT-In Directions April 2022'],
    relatedCrimes: ['ransomware', 'data-breach'],
    relatedModules: ['module-06', 'module-14'],
    sources: [
      {
        title: 'Lok Sabha Unstarred Question 1837: Cyber Attack on AIIMS',
        authority: 'Ministry of Health and Family Welfare, Government of India',
        url: 'https://sansad.in/ls',
        publicationDate: '2022-12-16',
        sourceType: 'government',
        citation: 'Lok Sabha UQ 1837',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Lok Sabha Unstarred Question 2310: Cyber Security in Government Infrastructure',
        authority: 'Ministry of Electronics and Information Technology, Government of India',
        url: 'https://sansad.in/ls',
        publicationDate: '2022-12-21',
        sourceType: 'government',
        citation: 'Lok Sabha UQ 2310',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 07: Pegasus Technical Committee Inquiry
  // -------------------------------------------------------------------------
  {
    title: 'The Mobile Spyware Inquiry',
    officialCaseName: 'Pegasus Technical Committee Inquiry: Device Examination & Attribution Limits',
    slug: 'pegasus-technical-committee-inquiry',
    caseNumber: 'CS-JS-07',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Critical Infrastructure & Complex Attribution',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Targeted Commercial Spyware Allegations',
    attackVector: 'Zero-Click Mobile Kernel Exploitation & Forensic Non-Cooperation',
    shortDescription: 'An independent Supreme Court-appointed committee examined 29 mobile devices, finding malware on five, but could not conclusively attribute the payload to Pegasus spyware amidst institutional non-cooperation.',
    difficulty: 'Advanced',
    featured: false,
    sourceSummary: 'Supreme Court Judgment in Manohar Lal Sharma v. Union of India (27 Oct 2021); Supreme Court Proceedings & Order (25 Aug 2022); Judicial Observation Records.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'In July 2021, an international investigative consortium alleged that military-grade commercial spyware developed by the NSO Group, known as Pegasus, had been used to compromise smartphones belonging to journalists, activists, and public figures in India. Following multiple writ petitions, the Supreme Court of India on 27 October 2021 constituted an independent Technical Committee supervised by former Supreme Court judge Justice R.V. Raveendran to conduct a forensic investigation into the allegations.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'The Supreme Court rejected the Union Governments limited affidavit, declaring that the State does not get a free pass merely by raising the phantom of national security. The technical committee examined 29 mobile phones submitted by citizens. On 25 August 2022, the committee submitted its report in sealed covers. In open court proceedings, the Chief Justice of India summarized that malware was detected on five devices, but the committee could not reach a conclusive finding that the malware was Pegasus spyware. The Court also publicly recorded the committee observation that the Government had not cooperated.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary judicial record: (1) Supreme Court orders confirm 29 devices were forensically examined. (2) Malware-related findings were identified on five devices. (3) The committee could not conclusively confirm the malware was Pegasus. (4) The Supreme Court publicly recorded that the Union Government had not provided specific responses to the committee questionnaire. Crucial Distinctions: A leaked list of telephone numbers indicates potential targeting interest, not proof of successful device infection. Unresolved: The detailed technical reports remain in sealed covers; no final public order has determined sovereign deployment.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'The Supreme Court retained the technical reports in sealed custody. While the matter appeared in tentative advance lists during 2025 and 2026, no final substantive determination or public declassification of the technical findings was completed in the verified judicial records.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'In *Manohar Lal Sharma v. Union of India* (2021), the Supreme Court reiterated that privacy is a fundamental right under Article 21, citing *K.S. Puttaswamy (Privacy-9J)*. Any state surveillance must satisfy the threefold requirement of legality, legitimate aim, and proportionality. Section 69 of the IT Act and Section 5(2) of the Telegraph Act permit interception only under strict statutory rules; arbitrary deployment of commercial zero-click surveillance tools violates constitutional protections.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'For digital security practitioners, journalists, and rights defenders: (1) Recognize that advanced zero-click spyware operates without user interaction and cannot be prevented by password discipline alone. (2) Utilize platform lockdown features (such as Apple Lockdown Mode or Android strict sandbox protections) which restrict complex message parsing. (3) Regularly reboot mobile devices to disrupt non-persistent memory-resident malware payloads.'
      }
    ],
    timeline: [
      { time: 'July 2021', label: 'Consortium Allegations', description: 'Reports published alleging surveillance targeting Indian citizens using Pegasus.', type: 'contact' },
      { time: '27 Oct 2021', label: 'Independent Committee Formed', description: 'Supreme Court constitutes technical committee under Justice R.V. Raveendran.', type: 'escalation' },
      { time: '25 Aug 2022', label: 'Sealed Report Submission', description: 'Malware found on 5 of 29 devices; attribution to Pegasus remains inconclusive.', type: 'discovery' },
      { time: '2025–2026', label: 'Procedural Status Caveat', description: 'Technical reports remain in sealed custody pending final formal disposal.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Can the State decline to provide technical information in a surveillance inquiry solely by invoking national security before the constitutional courts?',
        options: [
          { optionText: 'Yes, because the executive assertion of national security completely divests courts of judicial review.', isCorrect: false, explanation: 'The Supreme Court held that national security cannot be used as a blanket exemption from judicial scrutiny.' },
          { optionText: 'No, the State must substantiate its claims before the Court, which balances security against fundamental rights.', isCorrect: true, explanation: 'The Supreme Court in the Pegasus order held that national security does not grant a free pass from judicial inquiry.' },
          { optionText: 'Yes, but only if the surveillance software was procured from a certified foreign vendor.', isCorrect: false, explanation: 'Vendor certification has no bearing on constitutional judicial review.' }
        ],
        explanation: 'Constitutional jurisprudence requires the executive to demonstrate lawful authority and proportionality when fundamental rights are infringed.'
      }
    ],
    warningSigns: [
      { title: 'Rapid Unexplained Battery Depletion', explanation: 'High background process utilization and anomalous telemetry data transmission on idle mobile handsets.' },
      { title: 'Anomalous Gateway Crashes', explanation: 'Silent system process restarts resulting from memory corruption attempts in background messaging daemons.' }
    ],
    attackerObjectives: [
      'Achieve complete covert access to microphone, camera, encrypted messaging, and geolocation.',
      'Deploy zero-click exploits requiring zero user interaction or link clicks to establish persistence.',
      'Evade domestic forensic identification through encrypted and ephemeral memory-only execution.'
    ],
    impact: {
      financial: 'Massive procurement and deployment costs associated with military-grade cyber capabilities.',
      account: 'Complete surveillance and silent monitoring of private communications across targeted devices.',
      privacy: 'Catastrophic violation of constitutional privacy, journalistic confidentiality, and speech.',
      operational: 'Prolonged judicial controversy and institutional stalemate regarding sovereign disclosure.',
      emotional: 'Chilling effect on investigative reporting, democratic advocacy, and civic participation.'
    },
    response: [
      'Supreme Court established independent three-member technical forensic committee.',
      'Forensic acquisition and triage of 29 physical devices carried out in controlled laboratory.',
      'Technical findings and recommendations submitted under sealed cover to the Supreme Court registry.'
    ],
    preventionLessons: [
      'High-risk individuals should activate operating system Lockdown Mode to minimize exploit surface.',
      'Regular daily device reboots disrupt non-persistent memory payloads and prevent long-term persistence.'
    ],
    legalContext: ['IT Act Section 69', 'Indian Telegraph Act Section 5(2)', 'Constitution of India Article 21', 'K.S. Puttaswamy (2017) 10 SCC 1'],
    relatedCrimes: ['cyberstalking', 'identity-theft'],
    relatedModules: ['module-07', 'module-14'],
    sources: [
      {
        title: 'Manohar Lal Sharma v. Union of India & Ors., W.P. (Crl.) 314/2021',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in',
        publicationDate: '2021-10-27',
        sourceType: 'court',
        citation: '(2022) 11 SCC 781',
        documentType: 'Supreme Court Judgment',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Order in Manohar Lal Sharma v. Union of India, 25 August 2022',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in/supremecourt/2021/17094/17094_2021_1_34_30472_Order_25-Aug-2022.pdf',
        publicationDate: '2022-08-25',
        sourceType: 'court',
        citation: 'Order in W.P. (Crl.) 314/2021',
        documentType: 'Supreme Court Order',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 08: Ravinder Singh @ Kaku v. State of Punjab
  // -------------------------------------------------------------------------
  {
    title: 'The Flawed Digital Evidence Appeal',
    officialCaseName: 'Ravinder Singh @ Kaku v. State of Punjab: Admissibility of Electronic Records & CDR Certificates',
    slug: 'ravinder-singh-v-state-of-punjab',
    caseNumber: 'CS-JS-08',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Investigative & Evidentiary Gaps',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Evidentiary Inadmissibility in Serious Criminal Proceedings',
    attackVector: 'Uncertified Secondary Call Detail Records & Broken Chain of Custody',
    shortDescription: 'The Supreme Court acquitted the accused after finding multiple circumstantial weaknesses, holding that secondary electronic records (CDRs) without mandatory certification under Section 65B(4) IEA are inadmissible.',
    difficulty: 'Intermediate',
    featured: false,
    sourceSummary: 'Supreme Court Judgment in Ravinder Singh @ Kaku v. State of Punjab, 2022 INSC 505; Arjun Panditrao Khotkar (2020); Bharatiya Sakshya Adhiniyam 2023.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'In September 2009, two minor children were kidnapped and murdered in Moga, Punjab. The prosecution charged Ravinder Singh @ Kaku and co-accused on the basis of circumstantial evidence, heavily relying on telecommunication Call Detail Records (CDRs) to establish conspiratorial communication and geographic proximity. On 4 May 2022, the Supreme Court of India set aside the convictions and death sentence, ruling that the circumstantial chain was incomplete and that the uncertified secondary electronic CDR evidence was legally inadmissible.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'The trial court and Punjab & Haryana High Court had convicted the accused under IPC Sections 302 and 364. On appeal, the Supreme Court closely scrutinized the prosecution evidence: the alleged motive was unsubstantiated, recovery witnesses were contradictory, and the alleged last-seen testimonies lacked credibility. The prosecution had produced printed CDRs obtained from cellular service providers but failed to produce a valid certificate under Section 65B(4) of the Indian Evidence Act, 1872.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary judicial record: (1) The Supreme Court confirmed that the secondary electronic CDR printouts lacked the statutory Section 65B certificate. (2) The Court held that electronic records without certification cannot be admitted into evidence. Crucial Distinction: The Supreme Court did not acquit solely because of the missing electronic certificate; acquittal was based on cumulative failures across the entire circumstantial chain, including broken witness links and contradictory recovery evidence.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'The Supreme Court acquitted the appellant and directed his release. The judgment reinforced the mandatory nature of electronic evidence certification established in *Arjun Panditrao Khotkar* (2020), clarifying that police investigators cannot rely on unauthenticated printouts in serious criminal trials where personal liberty is at stake.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Under historical Section 65B of the Indian Evidence Act, secondary electronic records (printouts, copies, optical discs) require an accompanying certificate signed by an authorized manager of the computer device. Under current law, Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA) governs electronic admissibility, accompanied by the mandatory Schedule certificate. Admissibility is a threshold condition: a legally admitted digital record must still be evaluated for substantive evidentiary weight and corroboration.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'For law enforcement, legal advocates, and citizens presenting digital records in legal proceedings: (1) Understand that a screenshot or printed email is secondary evidence that requires formal certification under BSA Section 63. (2) If presenting original digital evidence directly from your physical mobile phone or primary drive, the original device exception under *Arjun Panditrao* applies. (3) Maintain strict forensic chain of custody for all digital media from initial seizure through court exhibit marking.'
      }
    ],
    timeline: [
      { time: 'Sep 2009', label: 'Alleged Offense', description: 'Tragic kidnapping and murder in Moga; investigation relies on CDRs.', type: 'contact' },
      { time: '2012–2019', label: 'Trial & High Court Conviction', description: 'Trial court and High Court convict based on circumstantial chain and CDR printouts.', type: 'escalation' },
      { time: '4 May 2022', label: 'Supreme Court Acquittal', description: 'Supreme Court sets aside conviction; establishes CDR inadmissibility and chain gaps.', type: 'discovery' },
      { time: '1 July 2024', label: 'BSA 2023 Commenced', description: 'Section 63 BSA and Schedule certificate replace historical Section 65B framework.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'Under the Indian Evidence Act (and modern BSA Section 63), can a printed copy of a Call Detail Record (CDR) be admitted in court without a certificate?',
        options: [
          { optionText: 'Yes, if the investigating police officer verbally swears that the printout is authentic.', isCorrect: false, explanation: 'Verbal witness testimony cannot substitute for mandatory written statutory electronic certification.' },
          { optionText: 'No, secondary electronic records require the mandatory statutory certificate signed by an authorized system manager.', isCorrect: true, explanation: 'Both IEA Section 65B and BSA Section 63 make written certification a mandatory prerequisite for secondary electronic evidence.' },
          { optionText: 'Yes, because CDR records maintained by telecom companies are deemed automatically self-proving.', isCorrect: false, explanation: 'There is no automatic presumption of authenticity for uncertified secondary telecom printouts.' }
        ],
        explanation: 'Mandatory electronic evidence certification is designed to safeguard against digital tampering, selective editing, and extraction errors.'
      }
    ],
    warningSigns: [
      { title: 'Absence of Certificate for Secondary Digital Prints', explanation: 'Presenting printouts of SMS, WhatsApp chats, or server logs without formal Section 65B / BSA Schedule certification.' },
      { title: 'Unbroken Chain of Custody Omissions', explanation: 'Failure to record serial numbers, hash values, and custodial signatures when seizing digital storage media.' }
    ],
    attackerObjectives: [
      'Exploit investigative shortcuts and procedural errors to challenge prosecution electronic evidence.',
      'Introduce doubt regarding call provenance, metadata extraction integrity, and geographic timing.'
    ],
    impact: {
      financial: 'Substantive procedural costs incurred across thirteen years of trial and appellate advocacy.',
      account: 'Not applicable (homicide and circumstantial criminal prosecution).',
      privacy: 'Extensive evidentiary examination of subscriber metadata and historical call logs.',
      operational: 'Complete collapse of the prosecution circumstantial case at the final appellate stage.',
      emotional: 'Devastating loss for victim families without conclusive legal resolution of the crime.'
    },
    response: [
      'Supreme Court conducted exhaustive audit of forensic record and witness contradictions.',
      'Supreme Court issued definitive guidance on the mandatory nature of electronic certificates.'
    ],
    preventionLessons: [
      'Investigative agencies must obtain contemporaneous certified digital records directly from telecom nodal officers.',
      'Defense advocates must assert statutory admissibility objections at the threshold stage of document exhibit marking.'
    ],
    legalContext: ['Indian Evidence Act Section 65B', 'Bharatiya Sakshya Adhiniyam Section 63', 'Arjun Panditrao Khotkar (2020) 7 SCC 1', 'IPC Section 302'],
    relatedCrimes: ['cyberstalking', 'identity-theft'],
    relatedModules: ['module-07', 'module-14'],
    sources: [
      {
        title: 'Ravinder Singh @ Kaku v. State of Punjab, Criminal Appeal 1307/2019',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in',
        publicationDate: '2022-05-04',
        sourceType: 'court',
        citation: '2022 INSC 505, (2022) 7 SCC 581',
        documentType: 'Supreme Court Judgment',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal & Ors.',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in',
        publicationDate: '2020-07-14',
        sourceType: 'court',
        citation: '(2020) 7 SCC 1',
        documentType: 'Supreme Court Judgment',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 09: CFCFRMS / 1930 Restitution Gap
  // -------------------------------------------------------------------------
  {
    title: 'The Frozen Funds Recovery Maze',
    officialCaseName: 'CFCFRMS / 1930 Cyber-Fraud Restitution: Fund Freezes vs Timely Victim Restoration',
    slug: 'cfcfrms-1930-restitution-gap',
    caseNumber: 'CS-JS-09',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Banking & Regulatory Inquiries',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Financial Cyber-Fraud Restitution Friction',
    attackVector: 'Inter-Bank Multi-Layered Mule Routing & Jurisdictional Procedural Lags',
    shortDescription: 'An examination of the Citizen Financial Cyber Fraud Reporting and Management System (1930), illustrating the operational divergence between emergency inter-bank lien marking and final restitution.',
    difficulty: 'Intermediate',
    featured: false,
    sourceSummary: '54th Report of Parliamentary Standing Committee on Communications & IT (Feb 2024); MHA Lok Sabha Answer (17 Mar 2026); MHA Cybercrime Response Update (22 Jul 2026); BNSS 2023.',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'The National Cybercrime Helpline 1930 and Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS), operated by the Indian Cyber Crime Coordination Centre (I4C), enable immediate inter-bank coordination when victims report financial fraud within the critical 2–3 hour "Golden Hour." While the system has successfully frozen thousands of crores across layered mule bank accounts, victims face substantial administrative and procedural hurdles when attempting to obtain the actual release and refund of held funds.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'The 54th Report of the Parliamentary Standing Committee on Communications and IT (February 2024) highlighted a significant restitution gap as of 31 October 2023: out of ₹8,586.71 crore reported lost across 16.28 lakh complaints, ₹878.87 crore was lien-marked in suspect accounts, but only ₹4.15 crore had been formally returned to victims. By 30 June 2026, MHA reported over ₹11,158 crore saved across 32.80 lakh complaints, with over ₹9,079 crore lien-marked and over ₹206 crore refunded between FY 2023–24 and FY 2025–26. In April 2026, the Money Restoration Module (MRM) was rolled out to streamline court-directed releases.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary parliamentary and executive records: (1) Parliamentary reports establish that "saved", "held", "lien-marked", and "refunded" represent distinct operational categories. (2) A lien-mark freeze is a temporary inter-bank hold, not an immediate customer credit. Excluded claim: An alleged 6 August 2024 Lok Sabha answer claiming ₹11,000 crore restitution was excluded as unverified. Unresolved: While a national SOP was issued on 2 January 2026, the full administrative text remains restricted to participating law enforcement and banking nodal officers.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'To address procedural bottlenecks, I4C introduced the Money Restoration Portal, allowing victims to initiate release requests using their 14-digit NCRP acknowledgment numbers. Police and courts utilize provisions under BNSS to issue disposal orders without requiring prolonged trial completion.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Under historical criminal procedure (Sections 451 and 457 CrPC) and modern criminal law (Sections 497 and 503 BNSS), money seized by police or frozen in bank accounts can only be released upon application to a competent Magistrate. Furthermore, Section 107 BNSS provides a distinct statutory framework for attachment, forfeiture, and restoration of property derived from criminal activity. Citizens must recognize that helpline 1930 halts fund movement, but judicial orders are typically required to transfer funds back.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'If you fall victim to financial cyber fraud: (1) Dial 1930 immediately within the first two hours to maximize chances of freezing stolen funds across initial mule accounts. (2) Record your 14-digit NCRP acknowledgement number. (3) Request the investigating Cyber Cell officer to furnish the list of lien-marked accounts and file a formal application under Section 503 BNSS before the jurisdictional Magistrate for timely release.'
      }
    ],
    timeline: [
      { time: 'Oct 2023', label: 'Parliamentary Audit', description: '54th Committee Report highlights gap: ₹878 cr held, but only ₹4.15 cr restored.', type: 'contact' },
      { time: 'Dec 2025', label: 'System Scaling', description: 'MHA reports over ₹7,130 crore saved across 23 lakh complaints.', type: 'escalation' },
      { time: 'Jan 2026', label: 'National SOP Issued', description: 'MHA issues standardized operational procedures to fast-track inter-bank refunding.', type: 'discovery' },
      { time: 'July 2026', label: 'Restitution Progress', description: 'MHA reports ₹11,158 cr saved and over ₹206 cr refunded via operational MRM modules.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'When National Cybercrime Helpline 1930 successfully freezes stolen funds in a fraudulent bank account, is the money immediately re-credited to the victim account?',
        options: [
          { optionText: 'Yes, 1930 has automatic executive authority to reverse NEFT/UPI transfers immediately without court orders.', isCorrect: false, explanation: '1930 coordinates emergency holds; it cannot unilaterally adjudicate ownership or reverse funds without statutory process.' },
          { optionText: 'No, a lien-mark halts movement of funds, but final return typically requires a Magistrate disposal order under BNSS.', isCorrect: true, explanation: 'A lien-mark prevents further siphoning; judicial orders under Section 503 BNSS are needed to release held funds to victims.' },
          { optionText: 'Yes, but only if the victim account is maintained at a nationalized public sector bank.', isCorrect: false, explanation: 'Bank ownership category does not alter statutory criminal property release rules.' }
        ],
        explanation: 'Halting money movement in the inter-bank ledger is step one; legal restitution requires completing formal judicial or SOP disposal processes.'
      }
    ],
    warningSigns: [
      { title: 'Conflating "Funds Saved" with "Funds Returned"', explanation: 'Assuming that an official confirmation of a lien-mark means money has been deposited back into your account.' },
      { title: 'Multi-Layered Fund Splitting', explanation: 'Fraudulent transactions split across 5 to 10 digital wallets and accounts within minutes of transfer.' }
    ],
    attackerObjectives: [
      'Rapidly route stolen funds through multiple layers of mule accounts within the first 60 minutes.',
      'Convert digital funds into crypto assets or cash withdrawals at remote micro-ATMs before holds trigger.',
      'Exploit jurisdictional boundaries and inter-bank communication latencies.'
    ],
    impact: {
      financial: 'Temporary or prolonged lock-in of substantial victim savings in frozen intermediary accounts.',
      account: 'Lien-marking of multiple intermediary accounts, sometimes freezing innocent second-hop recipients.',
      privacy: 'Submission of bank statements and identity documentation to police and magistrates.',
      operational: 'Significant procedural backlog across magistrate courts handling property release petitions.',
      emotional: 'Frustration resulting from knowing funds are frozen while facing bureaucratic delays in recovery.'
    },
    response: [
      'I4C operates 24x7 1930 helpline integrated with 250+ scheduled banks and payment gateways.',
      'Deployment of automated Money Restoration Portal for online victim tracking.',
      'Standardized Operating Procedures issued to state police cyber cells for expedited magistrate filings.'
    ],
    preventionLessons: [
      'Immediate 1930 reporting within the Golden Hour is the single most effective action to stop fund loss.',
      'Victims must proactively follow up with cyber cell nodal officers to petition magistrates for fund disposal.'
    ],
    legalContext: ['BNSS 2023 Section 107', 'BNSS 2023 Section 497', 'BNSS 2023 Section 503', 'CrPC 1973 Section 451', 'CrPC 1973 Section 457'],
    relatedCrimes: ['financial-fraud', 'phishing'],
    relatedModules: ['module-12', 'module-14'],
    sources: [
      {
        title: '54th Report: Citizen Data Security and Cyber Crime Prevention',
        authority: 'Parliamentary Standing Committee on Communications & IT',
        url: 'https://sansad.in',
        publicationDate: '2024-02-08',
        sourceType: 'government',
        citation: 'Report No. 54 (17th Lok Sabha)',
        documentType: 'Parliamentary Committee Report',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Lok Sabha Unstarred Question on Cyber Financial Restitution',
        authority: 'Ministry of Home Affairs, Government of India',
        url: 'https://sansad.in/ls',
        publicationDate: '2026-03-17',
        sourceType: 'government',
        citation: 'Lok Sabha Answer 17-Mar-2026',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Update on National Cybercrime Prevention and CFCFRMS 2.0 Modules',
        authority: 'Ministry of Home Affairs, Government of India',
        url: 'https://pib.gov.in',
        publicationDate: '2026-07-22',
        sourceType: 'official',
        citation: 'PIB Release 22-Jul-2026',
        documentType: 'Government Press Release',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  },

  // -------------------------------------------------------------------------
  // Case 10: Kudankulam Nuclear Power Plant Administrative Network Malware
  // -------------------------------------------------------------------------
  {
    title: 'The Critical Plant Network Intrusion',
    officialCaseName: 'Kudankulam Nuclear Power Plant Administrative Network Malware: Incident Communications & Network Segmentation',
    slug: 'kudankulam-administrative-network-malware',
    caseNumber: 'CS-JS-10',
    caseType: 'documented-case',
    collection: COLLECTION_NAME,
    collectionCategory: 'Critical Infrastructure & Complex Attribution',
    evidentiaryClassification: 'Documented Procedural Shortcoming',
    incidentType: 'Critical Infrastructure Administrative Network Intrusion',
    attackVector: 'Administrative Network Malware Infection & Contradictory Public Disclosures',
    shortDescription: 'A documented malware infection on an Internet-connected administrative personal computer at KKNPP that illustrated the necessity of rigorous IT/OT air-gaps and clear incident disclosure protocols.',
    difficulty: 'Advanced',
    featured: false,
    sourceSummary: 'KKNPP Press Release (29 Oct 2019); NPCIL Press Release (30 Oct 2019); DAE Lok Sabha UQ 659 (20 Nov 2019); DAE Rajya Sabha Q 481 (21 Nov 2019).',
    narrativeSections: [
      {
        heading: 'Part 1 — Case at a Glance',
        body: 'In late October 2019, public reports emerged that systems at the Kudankulam Nuclear Power Plant (KKNPP) in Tamil Nadu had suffered a cyber intrusion. On 29 October 2019, initial public communication from the plant administration categorically denied any cyber attack on plant control systems. However, on 30 October 2019, the Nuclear Power Corporation of India Limited (NPCIL) issued an official press release confirming that malware had indeed been detected on an Internet-connected administrative PC, while reaffirming that critical nuclear operational and safety control systems were completely isolated and unaffected.'
      },
      {
        heading: 'Part 2 — Chronological Incident Progression',
        body: 'On 4 September 2019, CERT-In notified the Department of Atomic Energy (DAE) and NPCIL of a malicious intrusion. Specialist investigators conducted forensic analysis and identified an infected personal computer connected to the administrative intranet. Public controversy arose on 29 October when a plant-level official communication dismissed reports of an attack. Within 24 hours, NPCIL corporate headquarters clarified the position, acknowledging the administrative infection. Subsequent parliamentary answers in November 2019 confirmed that the infected administrative PC was segregated from plant operational technology.'
      },
      {
        heading: 'Part 3 — Evidence: Established, Alleged and Unresolved',
        body: 'Established by primary parliamentary record: (1) NPCIL and DAE (Lok Sabha UQ 659, 20 Nov 2019; Rajya Sabha Q 481, 21 Nov 2019) confirmed that a malware infection occurred on an Internet-connected administrative PC. (2) The Government established that critical nuclear reactor control and instrumentation systems are air-gapped and were completely unaffected. Crucial Distinctions: Public reports suggesting that the reactor was "hacked" conflated administrative office IT with operational reactor control technology. Unresolved: Independent technical reports alleging specific Dtrack malware variants or foreign nation-state attribution were not formally adopted as official findings in the cited primary parliamentary records.'
      },
      {
        heading: 'Part 4 — Institutional Response & Adjudication Outcome',
        body: 'DAE and NPCIL implemented immediate containment measures: isolating the infected machine, auditing all administrative workstations, restricting removable media (USB drives), and blocking command-and-control IP addresses. Subsequent security enhancements scoping both IT networks and physical facilities were enacted between 2019 and 2022.'
      },
      {
        heading: 'Part 5 — Law & Procedural Lessons',
        body: 'Nuclear installations are designated Critical Information Infrastructure under Section 70 of the IT Act. The incident illustrated that operational air-gapping must be paired with clear, unified crisis communication protocols. Under CERT-In directions, public statements must accurately scope security incidents to prevent public panic while preserving transparency.'
      },
      {
        heading: 'Part 6 — Practical Learning & Citizen Guidance',
        body: 'For security practitioners and critical infrastructure operators: (1) Maintain strict physical and logical air-gaps between Operational Technology (OT/SCADA) and Internet-connected enterprise networks. (2) Never connect personal storage media or portable devices across both administrative and operational enclaves. (3) Establish centralized, pre-approved public communication protocols to ensure incident disclosures are factually precise and coordinated.'
      }
    ],
    timeline: [
      { time: '4 Sep 2019', label: 'CERT-In Notification', description: 'CERT-In alerts DAE/NPCIL to malware detection on administrative computer.', type: 'contact' },
      { time: '29 Oct 2019', label: 'Initial Plant Denial', description: 'KKNPP communication states any attack on control systems is impossible.', type: 'escalation' },
      { time: '30 Oct 2019', label: 'NPCIL Confirmation', description: 'NPCIL press release confirms malware on administrative PC; control systems safe.', type: 'discovery' },
      { time: '20–28 Nov 2019', label: 'Parliamentary Explanations', description: 'DAE answers in Lok Sabha and Rajya Sabha delineate IT/OT isolation.', type: 'response' }
    ],
    decisionPoints: [
      {
        questionText: 'In critical infrastructure facilities like nuclear power plants, what is the architectural relationship between administrative office IT and operational control systems (OT)?',
        options: [
          { optionText: 'They share the same local network subnet to facilitate rapid executive reporting.', isCorrect: false, explanation: 'Critical industrial control systems must never share network subnets with enterprise office IT.' },
          { optionText: 'They are strictly air-gapped and physically isolated so administrative network infections cannot bridge to reactor controls.', isCorrect: true, explanation: 'Strict air-gapping ensures that internet-borne malware on office computers cannot reach industrial control systems.' },
          { optionText: 'They connect through a single consumer Wi-Fi router protected by a basic alphanumeric password.', isCorrect: false, explanation: 'Critical infrastructure is governed by rigorous NCIIPC and CERT-In air-gap security guidelines.' }
        ],
        explanation: 'Air-gapping and perimeter segmentation isolate sensitive industrial control systems from internet-facing networks.'
      }
    ],
    warningSigns: [
      { title: 'Contradictory Public Disclosures', explanation: 'Initial denial from local plant officials contradicted within 24 hours by corporate entity admissions.' },
      { title: 'Use of Removable Media in High-Security Enclaves', explanation: 'Connecting thumb drives or laptops between administrative internet desks and operational areas.' }
    ],
    attackerObjectives: [
      'Infiltrate enterprise networks to harvest internal administrative directories and personnel emails.',
      'Probe lateral movement opportunities from administrative IT into operational engineering networks.',
      'Establish covert command-and-control communication for reconnaissance.'
    ],
    impact: {
      financial: 'Substantive expenditure for comprehensive network security audits and hardware sanitization.',
      account: 'Compromise of administrative user credentials on isolated office workstations.',
      privacy: 'Potential exposure of non-sensitive administrative emails and internal office records.',
      operational: 'Temporary disruption of administrative office communications; plant generation was uninterrupted.',
      emotional: 'Widespread public alarm and media controversy resulting from contradictory communication.'
    },
    response: [
      'CERT-In specialist team conducted comprehensive forensic image analysis of affected equipment.',
      'DAE deployed centralized security incident response and hardened perimeter firewalls.',
      'NPCIL formalized unified public communications protocols for cybersecurity incident handling.'
    ],
    preventionLessons: [
      'Never bridge the physical divide between administrative IT networks and operational control equipment.',
      'Establish coherent crisis communication channels to deliver accurate, non-conflicting public disclosures.'
    ],
    legalContext: ['IT Act Section 70', 'IT Act Section 70B', 'Atomic Energy Act 1962', 'CERT-In Directions April 2022'],
    relatedCrimes: ['malware', 'data-breach'],
    relatedModules: ['module-06', 'module-14'],
    sources: [
      {
        title: 'Press Release: Clarification on Cyber Attack at Kudankulam Nuclear Power Plant',
        authority: 'Nuclear Power Corporation of India Limited (NPCIL)',
        url: 'https://npcil.nic.in',
        publicationDate: '2019-10-30',
        sourceType: 'official',
        citation: 'NPCIL PR 30-Oct-2019',
        documentType: 'Corporate Press Release',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Lok Sabha Unstarred Question 659: Cyber Attack on KKNPP',
        authority: 'Department of Atomic Energy, Prime Minister Office',
        url: 'https://sansad.in/ls',
        publicationDate: '2019-11-20',
        sourceType: 'government',
        citation: 'Lok Sabha UQ 659',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      },
      {
        title: 'Rajya Sabha Question 481: Malware Incident at Kudankulam',
        authority: 'Department of Atomic Energy, Government of India',
        url: 'https://sansad.in/rs',
        publicationDate: '2019-11-21',
        sourceType: 'government',
        citation: 'Rajya Sabha Q 481',
        documentType: 'Parliamentary Answer',
        verificationDate: '2026-11-08'
      }
    ],
    published: true
  }
];

// Execute Seeding (Guardrails Protected)
async function seedJusticeShortcomingsCases({ dryRun = true } = {}) {
  console.log('======================================================================');
  console.log('DEDICATED INSERT-ONLY SEED UTILITY: CASES WHERE JUSTICE FELL SHORT');
  console.log(`Mode: ${dryRun ? 'DRY-RUN SIMULATION (Zero DB Writes)' : 'LIVE EXECUTION (Requires Authorization)'}`);
  console.log('======================================================================\n');

  // Step 1: Preflight Data Integrity Check
  console.log(`[PREFLIGHT] Validating ${justiceShortcomingsCasesData.length} authored cases...`);
  assert(justiceShortcomingsCasesData.length === 10, 'Expected exactly 10 authored case objects');

  const authoredSlugs = justiceShortcomingsCasesData.map(c => c.slug);
  const slugCollisions = checkSlugCollisions(authoredSlugs, TARGET_SLUGS);
  assert(slugCollisions.collisions.length === 10, 'All 10 authored cases must match approved TARGET_SLUGS whitelist');

  console.log('  [PASS] All 10 cases match approved target slug whitelist');

  // Validate Mongoose schema for each authored case in-memory
  for (const [idx, item] of justiceShortcomingsCasesData.entries()) {
    const doc = new CaseStudy(item);
    const err = doc.validateSync();
    if (err) {
      console.error(`  [FAIL] Schema validation error on case #${idx} (${item.slug}):`, err.message);
      throw err;
    }
  }
  console.log('  [PASS] All 10 authored cases pass Mongoose schema validation');

  if (dryRun) {
    console.log('\n[DRY-RUN] Preflight validation successful.');
    console.log('[DRY-RUN] In dry-run mode. Zero database connections or writes were initiated.');
    return {
      status: 'DRY_RUN_SUCCESS',
      validatedCount: justiceShortcomingsCasesData.length,
      targetSlugs: authoredSlugs
    };
  }

  // Live Execution (Checkpoint 5 Authorized Only)
  console.log('\n[LIVE EXECUTION] Checking database connectivity...');
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection must be established before running live insertion.');
  }

  // Preflight Database Collision Query
  console.log('[LIVE EXECUTION] Querying database for existing target slugs...');
  const existingRecords = await CaseStudy.find({ slug: { $in: TARGET_SLUGS } }).lean();
  if (existingRecords.length > 0) {
    console.error(`[ABORT] Insert-only violation! ${existingRecords.length} target slug(s) already exist in database.`);
    existingRecords.forEach(r => console.error(` - Found existing slug: "${r.slug}" (ID: ${r._id})`));
    throw new Error('ABORT: Target slugs already exist in database. Insert-only policy prohibits overwriting.');
  }
  console.log('  [PASS] Zero target slugs exist in database. Proceeding to snapshot export.');

  // Pre-Seed Baseline Snapshot
  const baselineRecords = await CaseStudy.find({}).lean();
  if (baselineRecords.length !== 11) {
    throw new Error(`ABORT: Expected exactly 11 legacy records in baseline, found ${baselineRecords.length}.`);
  }

  const seedBatchId = `batch_js_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const preSeedSnapshotPath = path.join(backupDir, `casestudies_preseed_${seedBatchId}.json`);
  const snapshotData = {
    seedBatchId,
    timestamp: new Date().toISOString(),
    recordCount: baselineRecords.length,
    records: baselineRecords.map(doc => ({
      _id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      digest: computeDocumentDigest(doc),
      fullDocument: doc
    }))
  };
  fs.writeFileSync(preSeedSnapshotPath, JSON.stringify(snapshotData, null, 2));
  console.log(`  [PASS] Pre-seed snapshot exported to: ${preSeedSnapshotPath}`);

  // Stamp batch ID on authored objects
  const recordsToInsert = justiceShortcomingsCasesData.map(item => ({
    ...item,
    seedBatchId
  }));

  // Transaction-aware insertion with replica set topology check
  let session = null;
  let useTransactions = false;
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.serverStatus();
    const isReplicaSet = Boolean(status.repl);

    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransactions = true;
      console.log('[LIVE EXECUTION] Replica set detected. Transaction started.');
    } else {
      console.log('[LIVE EXECUTION] Standalone deployment detected (transactions unsupported without replica set). Using ordered insertMany.');
    }
  } catch (_topoErr) {
    console.log('[LIVE EXECUTION] Standalone deployment or topology check fallback. Using ordered insertMany.');
    if (session) {
      try { await session.endSession(); } catch (_) {}
    }
    session = null;
    useTransactions = false;
  }

  let insertedDocs = [];
  try {
    if (useTransactions) {
      insertedDocs = await CaseStudy.create(recordsToInsert, { session, ordered: true });
      await session.commitTransaction();
      await session.endSession();
      console.log('  [PASS] Transaction committed successfully.');
    } else {
      insertedDocs = await CaseStudy.insertMany(recordsToInsert, { ordered: true });
      console.log('  [PASS] insertMany completed successfully.');
    }
  } catch (insertErr) {
    console.error('[ABORT] Insertion failed:', insertErr.message);
    if (useTransactions && session) {
      await session.abortTransaction();
      await session.endSession();
      console.log('[ABORT] Transaction rolled back. Zero documents persisted.');
    } else {
      console.log('[CLEANUP] Purging partial inserts matching seedBatchId...');
      await CaseStudy.deleteMany({ seedBatchId, slug: { $in: TARGET_SLUGS } });
      console.log('[CLEANUP] Partial purge complete.');
    }
    throw insertErr;
  }

  // Export Post-Seed ID Manifest
  const postSeedPath = path.join(backupDir, `casestudies_postseed_${seedBatchId}.json`);
  const postSeedData = {
    seedBatchId,
    timestamp: new Date().toISOString(),
    insertedCount: insertedDocs.length,
    insertedIds: insertedDocs.map(d => d._id.toString()),
    insertedSlugs: insertedDocs.map(d => d.slug),
    insertedDigests: insertedDocs.map(d => ({
      _id: d._id.toString(),
      slug: d.slug,
      digest: computeDocumentDigest(typeof d.toObject === 'function' ? d.toObject() : d)
    }))
  };
  fs.writeFileSync(postSeedPath, JSON.stringify(postSeedData, null, 2));
  console.log(`  [PASS] Post-seed manifest exported to: ${postSeedPath}`);
  console.log(`\n======================================================================`);
  console.log(`SUCCESS: Inserted ${insertedDocs.length} new records under batch ID: ${seedBatchId}`);
  console.log(`Total database count is now 21 (11 legacy + 10 new).`);
  console.log(`======================================================================`);

  return {
    status: 'LIVE_INSERTION_SUCCESS',
    seedBatchId,
    insertedCount: insertedDocs.length,
    manifestPath: postSeedPath,
    snapshotPath: preSeedSnapshotPath
  };
}

// Module exports
module.exports = {
  COLLECTION_NAME,
  TARGET_SLUGS,
  canonicalStringify,
  computeDocumentDigest,
  checkSlugCollisions,
  justiceShortcomingsCasesData,
  seedJusticeShortcomingsCases
};

// Safe CLI Runner: Only runs dry-run unless --confirm and --execute are explicitly passed
if (require.main === module) {
  const args = process.argv.slice(2);
  const isLive = args.includes('--confirm') && args.includes('--execute');
  if (isLive) {
    (async () => {
      try {
        const targetGuard = validateSeedExecutionTarget({ env: process.env, isReset: false, allowReset: false });
        console.log(`[LIVE EXECUTION] Initializing validated database connection (${targetGuard.redactedUri})...`);
        await mongoose.connect(targetGuard.targetUri, { family: 4 });
        const result = await seedJusticeShortcomingsCases({ dryRun: false });
        console.log('[LIVE EXECUTION] Completed successfully with status:', result.status);
        await mongoose.disconnect();
        console.log('[Database] Disconnected cleanly.');
        process.exit(0);
      } catch (err) {
        logSafeServerError('[LIVE EXECUTION ERROR]', err);
        if (mongoose.connection.readyState !== 0) {
          await mongoose.disconnect();
        }
        process.exit(1);
      }
    })();
  } else {
    seedJusticeShortcomingsCases({ dryRun: true })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}
