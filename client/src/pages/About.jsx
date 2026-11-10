import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';

/**
 * About the Portal — The Constitutional Atelier
 * Visual Identity: Interactive Journey & Civic Engineering Monograph
 * Consolidated Content Architecture across Seven Chapters:
 *   01. The Opening: Why This Matters (Connect) — Real-world alert & 3 systemic fractures
 *   02. The Central Idea: Four-Point Progression (Explore) — LAW → THREAT → DECISION → LEARNING
 *   03. The Guide: Explore the Portal (Discovery) — Interactive Defense Constellation (Sole Ecosystem Owner)
 *   04. The Method: How Learning Happens (Understand) — Decision Sandbox Micro-Simulator & Digital Day
 *   05. The Deeper Layer: How Assessment Works (Demonstration) — Six Discrete Behavioral Dimensions
 *   06. The Principles & Boundaries: What Guides the Project (Trust) — Modest Mission, Principles & Architecture
 *   07. The Closing: Put Awareness into Action (Act) — Concise Invitation & Pathways
 */

// -----------------------------------------------------------------------------
// 1. FOUR-POINT JOURNEY DATA (WITH NEXT-STAGE CAUSALITY)
// -----------------------------------------------------------------------------
const JOURNEY_STAGES = [
  {
    id: 'law',
    index: '01',
    label: 'LAW',
    title: 'Statutory Foundation',
    color: '#2C465E', // Deep Navy
    targetId: 'ecosystem',
    linkPath: '/laws',
    linkText: 'Explore Laws Directory',
    coreQuestion: 'What are my statutory rights and legal boundaries before an incident occurs?',
    summary: 'Demystifying statutory rights and legal boundaries before an incident occurs.',
    philosophy: 'Statutes are usually written for courtroom litigation, not for ordinary citizens navigating a smartphone screen. We translate technical provisions across the IT Act 2000, Bharatiya Nyaya Sanhita 2023, and DPDP Act 2023 into plain language while preserving strict statutory fidelity.',
    realWorld: 'A citizen receives an unexpected demand for personal data or an unverified payment. Understanding whether the demand violates Section 43A or Section 72 of the IT Act provides the statutory anchor for calm judgment.',
    portalAction: 'Side-by-side plain translation, Section 43A vs DPDP timelines, and the Law Compass situation-matching engine.',
    nextBridge: 'Legal rights establish the perimeter, but cybercriminals never attack the statute directly—they exploit human psychology to bypass legal awareness. This leads directly to THREAT recognition.'
  },
  {
    id: 'threat',
    index: '02',
    label: 'THREAT',
    title: 'Cognitive & Forensic Recognition',
    color: '#8C4024', // Muted Deep Terracotta
    targetId: 'problem',
    linkPath: '/crimes',
    linkText: 'Inspect Threat Catalog',
    coreQuestion: 'What psychological trick or technical pretext is being weaponized against me right now?',
    summary: 'Deconstructing the psychological levers and technical anatomy of social engineering.',
    philosophy: 'Attacks rarely exploit technical vulnerabilities alone; they exploit human urgency, fear of authority, and family obligation. Recognizing manufactured panic is the most critical defensive skill a digital citizen can acquire.',
    realWorld: 'An urgent voice call impersonates a police officer threatening "digital arrest" unless funds are transferred to a verification account. The victim complies not from ignorance of law, but from sudden adrenaline and manufactured terror.',
    portalAction: 'Threat anatomy breakdowns, deceptive pretext scripts, technical signal checklists, and forensic red-flag indicators across 29 active Indian cybercrime vectors.',
    nextBridge: 'Recognizing a threat is only half the battle. Spotting deceit without knowing how to respond under emotional duress leads to paralysis. The critical defense happens in the pause—leading to calibrated DECISION.'
  },
  {
    id: 'decision',
    index: '03',
    label: 'DECISION',
    title: 'The Calibrated Action',
    color: '#704E1B', // Muted Deep Gold
    targetId: 'pedagogy',
    linkPath: '/prevention',
    linkText: 'Open Safety Quick-Guide',
    coreQuestion: 'What calm 30-second action stops this attack without causing panic or irreversible harm?',
    summary: 'Transforming theoretical awareness into 30-second autonomic protective reflexes.',
    philosophy: 'Under emotional pressure, knowing that a crime is illegal does not prevent someone from sharing an OTP or sending funds. True security is built on muscle memory: taking the out-of-band verification pause, quarantining unknown APKs, and preserving digital evidence.',
    realWorld: 'Pausing for thirty seconds to independently search for an official customer care number, rather than dialing the mobile number provided inside an alarming utility disconnection SMS.',
    portalAction: 'Emergency Helpline 1930 protocols, Golden Hour bank hold coordination, Section 63 BSA evidence preservation, and the client-side Incident Docket Generator.',
    nextBridge: 'Every decision you make reveals underlying digital habits. Reflecting on those choices transforms temporary caution into permanent mastery—leading to the fourth stage: durable LEARNING.'
  },
  {
    id: 'learning',
    index: '04',
    label: 'LEARNING',
    title: 'Durable Behavioral Growth',
    color: '#1B5E3F', // Forest Green
    targetId: 'assessment',
    linkPath: '/dashboard',
    linkText: 'Enter Learner’s Space',
    coreQuestion: 'How do my everyday instincts improve so I stay prepared and confident in future situations?',
    summary: 'Cultivating enduring confidence through non-punitive diagnostic observation.',
    philosophy: 'Multiple-choice quizzes test memory, not instinct. We replace test-guessing with immersive chronological simulations that evaluate decisions across six discrete behavioral dimensions without shame, alarms, or score counters.',
    realWorld: 'Experiencing realistic simulated messaging hooks during "Your Digital Day," allowing learners to safely discover their personal blind spots (such as autopilot consent) in a risk-free environment.',
    portalAction: 'The "Your Digital Day" scenario engine, authoritative server scoring, and independent psychometric profiling across 6 behavioral dimensions.',
    nextBridge: 'Durable learning completes the closed loop: as behavioral reflexes strengthen, understanding of statutory rights deepens—returning to LAW with informed civic confidence.'
  }
];

// -----------------------------------------------------------------------------
// 2. REAL-WORLD SITUATION DATA (02:14 PM ALERT)
// -----------------------------------------------------------------------------
const REAL_WORLD_ALERT = {
  time: 'Tuesday · 02:14 PM',
  sender: 'VM-ELEC-DL',
  badge: 'SMS Notification',
  message: 'URGENT: Household electricity connection #4092 will be disconnected tonight at 9:30 PM due to an unverified meter update fee. Call Nodal Officer at 98765-XXXXX immediately or download our quick update tool: discom-bill-update.apk',
  lenses: [
    {
      id: 'hook',
      title: '1. The Manufactured Panic',
      detail: 'The attacker does not exploit software flaws on your phone; they exploit your afternoon schedule. Threatening a power blackout in seven hours induces immediate anxiety, making normal skepticism feel like an unaffordable risk for your family.'
    },
    {
      id: 'signals',
      title: '2. The Forensic Red Flags',
      detail: 'Legitimate electricity distribution companies (discoms) in India never send personal 10-digit mobile numbers for billing disputes, and never distribute raw Android installation packages (.apk files) through unsolicited SMS messages.'
    },
    {
      id: 'statute',
      title: '3. The Statutory Reality',
      detail: 'Section 66D of the IT Act and Section 319 BNS classify deceptive impersonation as a criminal offense committed by the perpetrator. However, knowing that law exists on paper does not prevent an impulse tap at 02:14 PM without a trained reflex to pause and verify.'
    }
  ]
};

// -----------------------------------------------------------------------------
// 3. THE THREE FRACTURES DATA
// -----------------------------------------------------------------------------
const SYSTEMIC_FRACTURES = [
  {
    id: 'fracture-legalese',
    num: '01',
    title: 'The Legalese Barrier',
    shortDesc: 'Laws written for courtrooms, not citizens under stress.',
    problem: 'Statutes like Section 66D of the IT Act or Section 318(4) of the Bharatiya Nyaya Sanhita are drafted in complex legal terminology. Ordinary citizens only discover them after suffering catastrophic financial or personal loss, when navigating legal text is confusing and overwhelming.',
    remedy: 'Dual-translation editorial engine presenting statutory clauses side-by-side with plain-language explanations, contextual examples, and the Law Compass scenario finder.'
  },
  {
    id: 'fracture-advice',
    num: '02',
    title: 'Generic Advice Paralysis',
    shortDesc: '"Do not click links" fails against legitimate-looking pretexts.',
    problem: 'Traditional awareness campaigns rely on generic slogans like "stay alert" or "do not share OTPs." When an attacker crafts an authentic-looking utility bill disconnection notice or courier re-delivery SMS with official logos, generic advice collapses under manufactured urgency.',
    remedy: 'Investigative forensic threat breakdowns that dissect exact social engineering pretexts, verifiable domain header cues, and step-by-step crisis containment playbooks.'
  },
  {
    id: 'fracture-testing',
    num: '03',
    title: 'Test-Guessing vs. Real Decisions',
    shortDesc: 'Multiple-choice quizzes test memory, not autonomic reflexes.',
    problem: 'Conventional corporate training asks predictable questions with artificial clues like obvious spelling errors. In reality, cyber fraud succeeds because attackers manipulate adrenaline and urgency. Test-takers score 100% on quizzes yet fall victim to live social engineering.',
    remedy: '"Your Digital Day" simulation: an immersive chronological workflow where score counters and alarm badges are suppressed, observing authentic human decision reflexes in a safe sandbox.'
  }
];

// -----------------------------------------------------------------------------
// 4. ECOSYSTEM PILLARS DATA (SOLE CANONICAL OWNERSHIP)
// -----------------------------------------------------------------------------
const ECOSYSTEM_PILLARS = [
  {
    id: 'laws',
    num: '01',
    role: 'Statute Grounding',
    title: 'Indian Cyber Laws',
    path: '/laws',
    actionText: 'Explore Laws Directory',
    summary: 'Side-by-side statutory and plain-English translations of operative provisions across IT Act 2000, BNS 2023, DPDP 2023, and BSA 2023.',
    connections: 'Establishes the primary statutory boundaries that underpin the threat profiles and case studies.',
    highlights: ['Law Compass Matcher', 'Plain vs Statutory Toggle', 'Active vs Enacted Status']
  },
  {
    id: 'crimes',
    num: '02',
    role: 'Threat Recognition',
    title: 'Cyber Crime Library',
    path: '/crimes',
    actionText: 'Inspect Threat Catalog',
    summary: 'Deconstructed attack vectors, psychological pretext scripts, and calibrated warning signals across 29 active Indian cyber fraud patterns.',
    connections: 'Deconstructs the modus operandi of crimes recognized in /laws, linking directly to prevention playbooks.',
    highlights: ['29 Deconstructed Vectors', 'Pretext Dialectics', 'Red-Flag Indicators']
  },
  {
    id: 'cases',
    num: '03',
    role: 'Forensic Precedents',
    title: 'Case Studies Archive',
    path: '/cases',
    actionText: 'Review Judicial Cases',
    summary: 'Reconstructed investigations and court precedents featuring Paused Decision Points where learners evaluate inflection points before seeing outcomes.',
    connections: 'Examines how Indian courts and investigators resolved actual cases involving the provisions in /laws.',
    highlights: ['21 Precedent Studies', 'Paused Decision Cards', 'Judicial Takeaways']
  },
  {
    id: 'prevention',
    num: '04',
    role: 'Defensive Action',
    title: 'Prevention Quick-Guide',
    path: '/prevention',
    actionText: 'Open Safety Quick-Guide',
    summary: 'Protective habits, psychological red-flag field guide, financial crisis commands (1930 Helpline), and the client-side Incident Docket Generator.',
    connections: 'Converts statutory awareness into immediate defensive checklists and evidence preservation tools.',
    highlights: ['Helpline 1930 Integration', 'BSA Section 63 Certificate', 'Zero-Telemetry Docket']
  },
  {
    id: 'resources',
    num: '05',
    role: 'Official Redress',
    title: 'Official Assistance',
    path: '/resources',
    actionText: 'Find Official Help',
    summary: 'Curated, direct directory of verified Indian authorities: National Cybercrime Portal, RBI Banking Ombudsman CMS, CERT-In, and State Police desks.',
    connections: 'Routes citizens to formal grievance mechanisms when an incident requires official regulatory intervention.',
    highlights: ['Verified Helplines', 'Direct Portal Links', 'Grievance Ombudsmen']
  },
  {
    id: 'dashboard',
    num: '06',
    role: 'Experiential Practice',
    title: 'Learner’s Space',
    path: '/dashboard',
    actionText: 'Enter Learner’s Space',
    summary: 'Interactive curriculum pathways, scenario quick checks, and the "Your Digital Day" simulation evaluating 6 discrete behavioral dimensions.',
    connections: 'Integrates all portal areas into structured scenarios with authoritative server-side scoring.',
    highlights: ['"Your Digital Day" Engine', '6-Metric Diagnostic', 'Server-Authoritative Scoring']
  }
];

// -----------------------------------------------------------------------------
// 5. LIVE DECISION SANDBOX MICRO-SIMULATOR OPTIONS
// (RIGOROUSLY DISTINGUISHING BEHAVIORAL OBSERVATION FROM LEGAL IMPLICATIONS)
// -----------------------------------------------------------------------------
const SANDBOX_OPTIONS = [
  {
    id: 'A',
    label: 'Choice A',
    text: 'Send ₹4,500 immediately via UPI to help your friend in the clinic.',
    type: 'danger',
    badge: 'Urgent Compliance · High Vulnerability',
    behavioralAnalysis: 'Urgent Compliance Reflex (TR/VB Deficit). You acted out of empathy and distress, but skipped independent verification. Attackers intentionally manufacture medical crises because emotional urgency rushes human judgment. In actual fraud incidents, money transferred to unknown UPI handles is moved through mule accounts within minutes.',
    legalImplications: 'Statutory Context: The perpetrator’s action constitutes deceptive impersonation, which may be prosecuted under Section 66D of the Information Technology Act (cheating by personation) and Section 319 of the Bharatiya Nyaya Sanhita (BNS). Important distinction: Transferring money under deceptive duress does NOT make you legally liable—you are the targeted victim. If money is sent, reporting within 2–3 hours to Helpline 1930 is vital for inter-bank hold coordination (CFCFRMS).',
    remedy: 'Safe Protocol: Train the 30-second pause. Never transfer money based solely on an incoming text message, no matter how urgent the claim.'
  },
  {
    id: 'B',
    label: 'Choice B',
    text: 'Ask them a personal question on the same chat to verify their identity.',
    type: 'warning',
    badge: 'In-Band Verification · Vulnerable Reflex',
    behavioralAnalysis: 'In-Band Verification Deficit. Questioning the sender shows healthy skepticism, but verifying inside the compromised channel is fundamentally unsafe. If an attacker has compromised your friend’s device, session tokens, or chat backup, they can view message history and easily answer personal questions.',
    legalImplications: 'Statutory Context: Unauthorized access to a messaging account involves identity theft under Section 66C of the IT Act committed by the perpetrator. Legally and forensically, answers provided inside a compromised channel do not constitute reliable verification of identity.',
    remedy: 'Safe Protocol: Break the channel. Always confirm through an independent out-of-band communication method (such as calling their regular phone number directly).'
  },
  {
    id: 'C',
    label: 'Choice C',
    text: 'Call your friend’s original phone number or reach a mutual contact out-of-band.',
    type: 'success',
    badge: 'Exemplary Reflex · Out-of-Band Verification',
    behavioralAnalysis: 'Exemplary Reflex (Verification Behaviour [VB]). Social engineering attacks rely entirely on channel isolation—keeping you trapped inside a single messaging thread where the attacker controls the narrative. By calling through an independent external path, you instantly collapse the deception in under thirty seconds.',
    legalImplications: 'Statutory Context: Out-of-band verification neutralizes the attack before an offense is completed, protecting your funds and alerting your friend so they can report Section 66C identity theft to their service provider and law enforcement.',
    remedy: 'Safe Protocol: This is the primary reflex conditioned throughout the portal’s "Your Digital Day" simulation: calm, autonomic out-of-band verification.'
  },
  {
    id: 'D',
    label: 'Choice D',
    text: 'Block the number immediately and ignore the message without replying.',
    type: 'neutral',
    badge: 'Blind Disengagement · False Alarm Risk',
    behavioralAnalysis: 'Blind Disengagement (False Positive Risk [FP]). While blocking stops immediate personal financial loss, total disengagement without verification leaves unresolved questions: is your friend genuinely in danger, or is their identity being actively spoofed to defraud other contacts?',
    legalImplications: 'Statutory Context: Disengaging without verifying leaves your friend unaware of the impersonation and prevents timely preservation of digital evidence (Section 63 BSA 2023) or coordination with Helpline 1930.',
    remedy: 'Safe Protocol: Balanced resilience pairs skepticism with calm verification: independently confirm before taking final action.'
  }
];

// -----------------------------------------------------------------------------
// 6. DIGITAL DAY TIMELINE MOMENTS
// -----------------------------------------------------------------------------
const DIGITAL_DAY_MOMENTS = [
  {
    time: '08:30 AM',
    title: 'The Morning Courier Alert',
    vector: 'SMS / Smishing Hook',
    scenario: 'A text arrives regarding an undelivered parcel with a shortened URL demanding address confirmation to avoid package return.',
    reflexTested: 'Signal Identification (SI) — Inspecting sender header, URL structure, and rejecting urgent clickthrough.'
  },
  {
    time: '11:15 AM',
    title: 'The Banking Collect Request',
    vector: 'UPI Fraud / Deceptive Request',
    scenario: 'An unexpected notification requesting ₹5,000 to "receive payment confirmation" with an official bank lookalike handle.',
    reflexTested: 'Verification Behaviour (VB) — Recognizing that receiving money never requires entering a UPI PIN.'
  },
  {
    time: '02:30 PM',
    title: 'The Workplace Impersonation',
    vector: 'Business Email / Executive Pretext',
    scenario: 'An urgent instant message from a senior colleague asking for an emergency vendor voucher purchase from personal accounts.',
    reflexTested: 'Deliberation Quality (DQ) — Verifying out-of-band via phone call before executing financial instructions.'
  },
  {
    time: '05:45 PM',
    title: 'The Utility Disconnection Call',
    vector: 'Vishing / Authority Coercion',
    scenario: 'A voice call warning that household power will be disconnected at 8:00 PM unless an outstanding ₹12 fee is settled via custom APK.',
    reflexTested: 'Threat Recognition (TR) — Recognizing manufactured panic and refusing remote-access screen sharing tools.'
  },
  {
    time: '08:00 PM',
    title: 'The Evening Device Permission',
    vector: 'App Privilege Escalation',
    scenario: 'A downloaded utility requesting broad device permissions: accessibility service, contacts, and SMS reading access.',
    reflexTested: 'Unreviewed Acceptance Control (UA) — Resisting autopilot agreement and denying unnecessary permissions.'
  }
];

// -----------------------------------------------------------------------------
// 7. SIX BEHAVIORAL DIMENSIONS
// -----------------------------------------------------------------------------
const BEHAVIORAL_METRICS = [
  {
    code: 'TR',
    name: 'Threat Recognition',
    formula: '0–2 Additive',
    focus: 'Perception of Coercion & Urgency',
    definition: 'Ability to detect malicious intent, manufactured time panic, artificial authority impersonation, and unsolicited credential solicitations.',
    realWorld: 'Recognizing that legitimate police officers or tax officials never demand money transfers via instant messaging or video calls.',
    color: '#8C4024',
    bgTint: 'rgba(140, 64, 36, 0.08)',
    scaleCategory: 'Additive Calibration (0–2 Scale)',
    evaluationModel: 'Evaluated additively during realistic decision points: 0 points for compliance under manufactured pressure, 1 point for hesitation, and 2 points for decisive identification of the threat vector.',
    statutoryAnchor: 'IT Act Section 66D (Cheating by Personation) & BNS Section 319',
    encounterScenario: 'SMS from "IT-REFUND": "Your income tax refund of ₹14,280 is pending. Update your bank IFSC within 15 minutes to prevent forfeiture."',
    autopilotImpulse: 'Rushing to claim the pending refund before the 15-minute countdown expires.',
    calibratedReflex: 'Recognizing artificial urgency as a core social-engineering trigger and rejecting unsolicited credential requests.'
  },
  {
    code: 'SI',
    name: 'Signal Identification',
    formula: '0–2 Additive',
    focus: 'Technical Indicator Inspection',
    definition: 'Precision in spotting technical discrepancies: lookalike domain variations (typosquatting), spoofed SMS headers, anomalous UPI handles, and forged seals.',
    realWorld: 'Noticing that a link reads "bank-support-login.com" rather than the verified institutional second-level domain.',
    color: '#2C465E',
    bgTint: 'rgba(44, 70, 94, 0.08)',
    scaleCategory: 'Additive Calibration (0–2 Scale)',
    evaluationModel: 'Evaluated additively on forensic attention: 0 points for missing blatant domain typosquatting, 1 point for general skepticism, and 2 points for isolating the anomalous technical artifact.',
    statutoryAnchor: 'IT Act Section 66C (Identity Theft) & Section 43 (Unauthorized Access)',
    encounterScenario: 'Email from "security@hdfc-verify-portal.net" requesting immediate KYC credential re-validation.',
    autopilotImpulse: 'Glancing at the bank logo in the email header and assuming the message is authentic.',
    calibratedReflex: 'Inspecting the sender address and domain suffix, identifying the spoofed third-level domain before clicking.'
  },
  {
    code: 'VB',
    name: 'Verification Behaviour',
    formula: '0–2 Additive',
    focus: 'Out-of-Band Corroboration',
    definition: 'The habit of independently confirming unexpected notices via trusted external channels, strictly distinguishing independent checks from in-channel queries.',
    realWorld: 'Calling a utility company’s official billing helpline rather than dialing the mobile number sent inside an urgent warning SMS.',
    color: '#1F4D3A',
    bgTint: 'rgba(31, 77, 58, 0.08)',
    scaleCategory: 'Additive Calibration (0–2 Scale)',
    evaluationModel: 'Evaluated additively on independent confirmation habits: 0 points for verifying within the attacker\'s channel, 1 point for seeking secondary verification, and 2 points for executing out-of-band checks.',
    statutoryAnchor: 'BSA 2023 Section 63 (Admissibility of Electronic Records & Chain of Custody)',
    encounterScenario: 'WhatsApp message from a contact\'s profile stating their phone is broken and requesting ₹4,500 transferred to a new clinic UPI ID.',
    autopilotImpulse: 'Replying inside the same chat thread or transferring money immediately based on familiarity.',
    calibratedReflex: 'Placing a direct phone call to the known, pre-saved contact number (out-of-band) or speaking to family before transferring.'
  },
  {
    code: 'DQ',
    name: 'Decision Quality',
    formula: '0–2 Additive',
    focus: 'Composure & Containment',
    definition: 'Selection of safe containment and defensive closure over rushed, compliance-driven action when faced with ambiguous browser alerts or OS patch prompts.',
    realWorld: 'Closing a browser tab and disconnecting Wi-Fi when a warning siren appears, rather than calling the pop-up phone number.',
    color: '#26352B',
    bgTint: 'rgba(38, 53, 43, 0.08)',
    scaleCategory: 'Additive Calibration (0–2 Scale)',
    evaluationModel: 'Evaluated additively on containment judgment: 0 points for active exposure or downloading suspect files, 1 point for partial closure, and 2 points for safe operational containment.',
    statutoryAnchor: 'IT Act Section 43(c) (Computer Contaminants) & Section 66 (Hacking)',
    encounterScenario: 'Full-screen browser pop-up with a siren: "Critical Windows Trojan detected! Call toll-free 1800-XXX-XXXX immediately to protect data."',
    autopilotImpulse: 'Panicking and calling the toll-free number or installing the suggested remote desktop assist tool.',
    calibratedReflex: 'Force-closing the browser tab, terminating suspicious processes via Task Manager, and scanning the system offline.'
  },
  {
    code: 'FP',
    name: 'False Positive Control',
    formula: 'Penalty Ratio',
    focus: 'Calm Discernment vs. Paranoia',
    definition: 'Evaluating calm discernment: differentiating legitimate institutional communications from scams without succumbing to unnecessary paranoia or operational paralysis.',
    realWorld: 'Distinguishing an actual scheduled OTP from a malicious prompt without rejecting all legitimate banking services.',
    color: '#704E1B',
    bgTint: 'rgba(112, 78, 27, 0.08)',
    scaleCategory: 'Behavioral Penalty Ratio',
    evaluationModel: 'Tracked as a penalty ratio: evaluates whether the user excessively suspects or flags legitimate administrative, banking, or educational notifications, measuring operational paralysis.',
    statutoryAnchor: 'RBI Customer Protection Directives & Standard Operating Protocols',
    encounterScenario: 'Bank SMS with registered sender ID ("VK-HDFCBK") sending a login OTP requested by you 10 seconds ago on your laptop.',
    autopilotImpulse: 'Rejecting the OTP and reporting the bank number as fraudulent out of blanket suspicion.',
    calibratedReflex: 'Calmly cross-referencing the recent action and transaction context before entering the OTP securely.'
  },
  {
    code: 'UA',
    name: 'Unreviewed Acceptance Control',
    formula: 'Penalty Ratio',
    focus: 'Resisting Autopilot Consent',
    definition: 'Resisting habitual, autopilot consent when prompted for high-privilege device permissions, SMS reading access, or unverified UPI collect approvals.',
    realWorld: 'Reading permission dialogues before tapping "Allow" and questioning why a calculator app requires contact list and SMS permissions.',
    color: '#943A24',
    bgTint: 'rgba(148, 58, 36, 0.08)',
    scaleCategory: 'Behavioral Penalty Ratio',
    evaluationModel: 'Tracked as a penalty ratio: penalizes unreflective approval of high-privilege Android permissions (SMS reading, accessibility services) or automated UPI collect requests.',
    statutoryAnchor: 'DPDP Act 2023 Section 6 (Purpose-Limited, Informed Citizen Consent)',
    encounterScenario: 'A newly installed PDF utility requests permissions for "Read all SMS", "Access contacts", and "Manage phone calls".',
    autopilotImpulse: 'Rapidly tapping "Allow", "Allow", "Allow" on every system modal without reading the permission names.',
    calibratedReflex: 'Denying unnecessary device permissions, reviewing app manifest requirements, and uninstalling over-reaching apps.'
  }
];

// -----------------------------------------------------------------------------
// 8. GUIDING PRINCIPLES
// -----------------------------------------------------------------------------
const GUIDING_PRINCIPLES = [
  {
    num: 'I',
    tag: 'FIDELITY',
    title: 'Authoritative Statutory Rigor',
    desc: 'Every legal claim is verified against primary Indian legislative gazettes. We strictly distinguish active statutory provisions from repealed laws, unconstitutional clauses (such as IT Act Section 66A struck down in Shreya Singhal), and enacted provisions awaiting operational commencement.'
  },
  {
    num: 'II',
    tag: 'CLARITY',
    title: 'Plain-Language Demystification',
    desc: 'We translate dense statutory clauses into lucid, everyday language without stripping statutory nuance or creating misleading expectations. Legal education must be accessible to every citizen, regardless of formal legal training.'
  },
  {
    num: 'III',
    tag: 'PRIVACY',
    title: 'Privacy by Architecture',
    desc: 'The portal is built to educate, not to harvest. Interactive tools like the Incident Docket Generator and assessment simulations run completely client-side in the browser. We never collect, transmit, or store real passwords, OTPs, bank credentials, or Aadhaar numbers.'
  },
  {
    num: 'IV',
    tag: 'DIGNITY',
    title: 'Non-Punitive Citizen Dignity',
    desc: 'We categorically reject victim-blaming and fear-mongering. Social engineering attacks exploit human kindness, family duty, and professional diligence. Our assessments provide calm, non-judgmental behavioral reflection to cultivate confidence.'
  },
  {
    num: 'V',
    tag: 'EVIDENCE',
    title: 'Empirical Forensic Accuracy',
    desc: 'All threat lifecycles, warning signals, and case narratives are reconstructed from verified judicial precedents, high court rulings, RBI circulars, and official CERT-In advisories. We do not invent fictional attack capabilities or unsubstantiated penalties.'
  },
  {
    num: 'VI',
    tag: 'ACTION',
    title: 'Actionable Official Redress',
    desc: 'Awareness without actionable recourse is hollow. Every threat profile connects directly to practical defensive habits, evidence preservation standards under Section 63 BSA 2023, and verified official escalation routes like Helpline 1930 and the RBI Ombudsman.'
  }
];

export default function About() {
  const [activeSection, setActiveSection] = useState('problem');
  const [activeJourneyIdx, setActiveJourneyIdx] = useState(0);
  const [activeAlertLens, setActiveAlertLens] = useState('hook');
  const [activeFractureId, setActiveFractureId] = useState(SYSTEMIC_FRACTURES[0].id);
  const [activePillarId, setActivePillarId] = useState(ECOSYSTEM_PILLARS[0].id);
  const [sandboxChoice, setSandboxChoice] = useState(null);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeMetricCode, setActiveMetricCode] = useState(BEHAVIORAL_METRICS[0].code);

  const isClickScrolling = useRef(false);
  const clickTimeout = useRef(null);

  const currentJourneyStage = JOURNEY_STAGES[activeJourneyIdx];
  const currentFracture = SYSTEMIC_FRACTURES.find((f) => f.id === activeFractureId) || SYSTEMIC_FRACTURES[0];
  const currentPillar = ECOSYSTEM_PILLARS.find((p) => p.id === activePillarId) || ECOSYSTEM_PILLARS[0];
  const currentDayMoment = DIGITAL_DAY_MOMENTS[activeDayIdx];
  const currentMetric = BEHAVIORAL_METRICS.find((m) => m.code === activeMetricCode) || BEHAVIORAL_METRICS[0];
  const currentSandboxResult = SANDBOX_OPTIONS.find((opt) => opt.id === sandboxChoice);

  // Sticky subnavigator sections (preserving canonical IDs)
  const NAV_SECTIONS = [
    { id: 'problem', label: 'The Problem' },
    { id: 'journey', label: 'Four-Point Journey' },
    { id: 'mission', label: 'Mission & Vision' },
    { id: 'ecosystem', label: 'Portal Ecosystem' },
    { id: 'pedagogy', label: 'Pedagogy' },
    { id: 'assessment', label: 'Behavioral Metrics' },
    { id: 'principles', label: 'Principles' },
    { id: 'project', label: 'Architecture' },
    { id: 'transparency', label: 'Scope & Limits' }
  ];

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -60% 0px',
      threshold: 0
    };

    const handleIntersect = (entries) => {
      if (isClickScrolling.current) return;
      const visible = entries.find((e) => e.isIntersecting);
      if (visible) {
        setActiveSection(visible.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    NAV_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => {
      observer.disconnect();
      if (clickTimeout.current) clearTimeout(clickTimeout.current);
    };
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    isClickScrolling.current = true;
    setActiveSection(id);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerOffset = 110;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 750);
  };

  const handleNextStage = () => {
    setActiveJourneyIdx((prev) => (prev + 1) % JOURNEY_STAGES.length);
  };

  const handlePrevStage = () => {
    setActiveJourneyIdx((prev) => (prev - 1 + JOURNEY_STAGES.length) % JOURNEY_STAGES.length);
  };

  const currentMetricIdx = BEHAVIORAL_METRICS.findIndex((m) => m.code === activeMetricCode);

  const handleNextMetric = () => {
    const nextIdx = (currentMetricIdx + 1) % BEHAVIORAL_METRICS.length;
    setActiveMetricCode(BEHAVIORAL_METRICS[nextIdx].code);
  };

  const handlePrevMetric = () => {
    const prevIdx = (currentMetricIdx - 1 + BEHAVIORAL_METRICS.length) % BEHAVIORAL_METRICS.length;
    setActiveMetricCode(BEHAVIORAL_METRICS[prevIdx].code);
  };

  const handleMetricKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (idx + 1) % BEHAVIORAL_METRICS.length;
      setActiveMetricCode(BEHAVIORAL_METRICS[nextIdx].code);
      document.getElementById(`tab-metric-${BEHAVIORAL_METRICS[nextIdx].code}`)?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (idx - 1 + BEHAVIORAL_METRICS.length) % BEHAVIORAL_METRICS.length;
      setActiveMetricCode(BEHAVIORAL_METRICS[prevIdx].code);
      document.getElementById(`tab-metric-${BEHAVIORAL_METRICS[prevIdx].code}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveMetricCode(BEHAVIORAL_METRICS[0].code);
      document.getElementById(`tab-metric-${BEHAVIORAL_METRICS[0].code}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIdx = BEHAVIORAL_METRICS.length - 1;
      setActiveMetricCode(BEHAVIORAL_METRICS[lastIdx].code);
      document.getElementById(`tab-metric-${BEHAVIORAL_METRICS[lastIdx].code}`)?.focus();
    }
  };

  const handleJourneyKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (idx + 1) % JOURNEY_STAGES.length;
      setActiveJourneyIdx(nextIdx);
      document.getElementById(`tab-${JOURNEY_STAGES[nextIdx].id}`)?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (idx - 1 + JOURNEY_STAGES.length) % JOURNEY_STAGES.length;
      setActiveJourneyIdx(prevIdx);
      document.getElementById(`tab-${JOURNEY_STAGES[prevIdx].id}`)?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveJourneyIdx(0);
      document.getElementById(`tab-${JOURNEY_STAGES[0].id}`)?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIdx = JOURNEY_STAGES.length - 1;
      setActiveJourneyIdx(lastIdx);
      document.getElementById(`tab-${JOURNEY_STAGES[lastIdx].id}`)?.focus();
    }
  };

  return (
    <div className="about-page-container">
      {/* ------------------------------------------------------------------
          OVERTURE HEADER: EMOTIONAL HOOK & BREADCRUMB
          ------------------------------------------------------------------ */}
      <header className="about-monograph-hero">
        <WorkspaceBreadcrumb />
        
        <div className="about-hero-header-block">
          <EditorialPageHeader
            eyebrow="CIVIC ENGINEERING MONOGRAPH · ARCHITECTURAL ESSAY"
            title="Understanding the Portal"
            subtitle="Where Indian legal statutes meet everyday human instinct."
            description="An open academic initiative bridging the divide between statutory cyber laws and practical digital defense, turning theoretical awareness into calibrated reflexes."
          />
        </div>

        {/* Editorial Stat Strip */}
        <div className="about-stat-strip" aria-label="Project metrics at a glance">
          <div className="about-stat-item">
            <span className="about-stat-value">14+</span>
            <span className="about-stat-label">Statutes Translated</span>
          </div>
          <div className="about-stat-divider" aria-hidden="true" />
          <div className="about-stat-item">
            <span className="about-stat-value">29</span>
            <span className="about-stat-label">Deconstructed Threats</span>
          </div>
          <div className="about-stat-divider" aria-hidden="true" />
          <div className="about-stat-item">
            <span className="about-stat-value">6</span>
            <span className="about-stat-label">Behavioral Dimensions</span>
          </div>
          <div className="about-stat-divider" aria-hidden="true" />
          <div className="about-stat-item">
            <span className="about-stat-value">0</span>
            <span className="about-stat-label">Telemetry Harvested</span>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------
          STICKY EDITORIAL SUBNAVIGATOR
          ------------------------------------------------------------------ */}
      <nav className="about-subnav-sticky" aria-label="About page section navigation">
        <div className="about-subnav-inner">
          <div className="about-subnav-links">
            {NAV_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`about-subnav-btn ${activeSection === sec.id ? 'active' : ''}`}
                aria-current={activeSection === sec.id ? 'true' : 'false'}
              >
                {sec.label}
              </button>
            ))}
          </div>
          <span className="about-subnav-badge" aria-hidden="true">
            Atelier Monograph
          </span>
        </div>
      </nav>

      {/* ==================================================================
          CHAPTER 01: THE OPENING — WHY THIS MATTERS (CONNECT)
          A Relatable Real-World Moment: 02:14 PM Alert
          ================================================================== */}
      <div id="overview" className="about-anchor-target" aria-hidden="true" />
      <section id="problem" className="about-chapter-section" aria-labelledby="heading-problem">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 01 · THE OPENING</span>
          <h2 id="heading-problem" className="about-chapter-title">Why This Portal Exists</h2>
          <p className="about-chapter-standfirst">
            In an era where everyday life, savings, and family security run through a glass screen, knowing how to tap a button is not the same as knowing how to protect yourself when something goes wrong.
          </p>
        </div>

        {/* Relatable Real-World Incident Simulation */}
        <div className="about-realworld-moment">
          <div className="about-moment-badge-row">
            <span className="about-moment-tag">A Real-World Moment</span>
            <span className="about-moment-time">{REAL_WORLD_ALERT.time}</span>
          </div>

          <div className="about-moment-screen">
            <div className="about-sim-notification">
              <div className="about-sim-notif-header">
                <span className="about-sim-notif-icon" aria-hidden="true">💬</span>
                <span className="about-sim-notif-sender">{REAL_WORLD_ALERT.sender} · {REAL_WORLD_ALERT.badge}</span>
                <span className="about-sim-notif-timestamp">Just now</span>
              </div>
              <p className="about-sim-notif-body">
                <strong>URGENT:</strong> Your electricity power connection (#4092) is scheduled for disconnection tonight at 9:30 PM due to an unverified meter update fee. Immediately call Nodal Officer at <strong>98765-XXXXX</strong> or download our quick update tool: <code>discom-bill-update.apk</code>
              </p>
            </div>

            <div className="about-moment-dilemma">
              <p className="about-moment-dilemma-lead">
                <strong>The Human Reality:</strong> You pay your bills on time. But your pulse quickens. What if a payment failed? You have seven hours before your home goes dark.
              </p>
              
              <div className="about-lens-selector" role="tablist" aria-label="Anatomy of deception">
                {REAL_WORLD_ALERT.lenses.map((lens) => (
                  <button
                    key={lens.id}
                    type="button"
                    role="tab"
                    id={`tab-lens-${lens.id}`}
                    aria-selected={activeAlertLens === lens.id}
                    className={`about-lens-btn ${activeAlertLens === lens.id ? 'is-active' : ''}`}
                    onClick={() => setActiveAlertLens(lens.id)}
                  >
                    {lens.title}
                  </button>
                ))}
              </div>

              <div className="about-lens-content" role="tabpanel" aria-labelledby={`tab-lens-${activeAlertLens}`}>
                <p>{REAL_WORLD_ALERT.lenses.find((l) => l.id === activeAlertLens)?.detail}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="about-narrative-essay">
          <div className="about-essay-lead-block">
            <p className="about-essay-paragraph is-lead">
              India executes billions of digital payment transactions every month. Over 800 million citizens rely on digital channels for pensions, admissions, family remittances, and utility payments. But digital adoption has outpaced defensive awareness.
            </p>
            <p className="about-essay-paragraph">
              When an urgent alert arrives, attacks succeed not through software exploits, but through manufactured panic. Under emotional duress, human judgment is rushed into irreversible decisions.
            </p>
          </div>

          {/* Interactive Three Fractures Dossier */}
          <div className="about-fractures-dossier">
            <div className="about-dossier-intro">
              <span className="about-sub-eyebrow">STRUCTURAL AUDIT</span>
              <h3 className="about-fractures-title">The Three Systemic Failures in Cyber Awareness</h3>
              <p className="about-fractures-intro-text">
                Traditional education fails because it addresses the wrong problem. Inspect each systemic failure below to see how our engineering architecture resolves it:
              </p>
            </div>

            <div className="about-fracture-pills" role="tablist" aria-label="Three systemic failures">
              {SYSTEMIC_FRACTURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  id={`tab-${f.id}`}
                  aria-selected={activeFractureId === f.id}
                  aria-controls={`panel-${f.id}`}
                  onClick={() => setActiveFractureId(f.id)}
                  className={`about-fracture-tab ${activeFractureId === f.id ? 'is-active' : ''}`}
                >
                  <span className="about-tab-num">{f.num}</span>
                  <span className="about-tab-title">{f.title}</span>
                </button>
              ))}
            </div>

            <div
              id={`panel-${currentFracture.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${currentFracture.id}`}
              className="about-fracture-display"
            >
              <div className="about-display-head">
                <h4 className="about-display-heading">{currentFracture.title}</h4>
                <p className="about-display-short">{currentFracture.shortDesc}</p>
              </div>

              <div className="about-display-split">
                <div className="about-display-box is-problem">
                  <span className="about-box-tag">The Structural Deficit</span>
                  <p>{currentFracture.problem}</p>
                </div>
                <div className="about-display-box is-remedy">
                  <span className="about-box-tag">The Portal’s Architectural Remedy</span>
                  <p>{currentFracture.remedy}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Central Thesis Callout */}
        <div className="about-thesis-monograph">
          <blockquote className="about-thesis-quote">
            "Knowing that a law exists does not prevent a citizen from losing their life savings in thirty seconds. Security is a reflex; justice requires literacy."
          </blockquote>
          <p className="about-thesis-author">
            — Foundational Directive of the Cyber Law Awareness Portal
          </p>
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            To bridge these three fractures, the portal organizes legal awareness around one continuous journey &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 02: THE CENTRAL IDEA — FOUR-POINT PROGRESSION (EXPLORE)
          LAW → THREAT → DECISION → LEARNING
          ================================================================== */}
      <section id="journey" className="about-chapter-section" aria-labelledby="heading-journey">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 02 · THE CENTRAL THREAD</span>
          <h2 id="heading-journey" className="about-chapter-title">The Four-Point Progression</h2>
          <p className="about-chapter-standfirst">
            A person encounters a digital threat. They need to understand what happened, what the law says, what decision to make, and how to become better prepared next time.
          </p>
        </div>

        {/* Heroic Progression Pavilion */}
        <div className="about-pavilion-card">
          {/* Stage Rail Navigation */}
          <div className="about-pavilion-rail" role="tablist" aria-label="Four-point progression stages">
            {JOURNEY_STAGES.map((stage, idx) => {
              const isActive = activeJourneyIdx === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  id={`tab-${stage.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${stage.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveJourneyIdx(idx)}
                  onKeyDown={(e) => handleJourneyKeyDown(e, idx)}
                  className={`about-rail-node ${isActive ? 'is-active' : ''}`}
                  style={{
                    '--stage-accent': stage.color
                  }}
                >
                  <span className="about-rail-badge">{stage.index}</span>
                  <span className="about-rail-label">{stage.label}</span>
                  <span className="about-rail-sub">{stage.title}</span>
                </button>
              );
            })}
          </div>

          {/* Connected SVG Gradient Path Trace */}
          <div className="about-progression-track" aria-hidden="true">
            <svg
              className="about-progression-svg"
              viewBox="0 0 800 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="group"
              aria-label="Progression connection graphic"
            >
              <defs>
                <linearGradient id="journey-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2C465E" />
                  <stop offset="100%" stopColor="#8C4024" />
                </linearGradient>
                <linearGradient id="journey-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8C4024" />
                  <stop offset="100%" stopColor="#704E1B" />
                </linearGradient>
                <linearGradient id="journey-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#704E1B" />
                  <stop offset="100%" stopColor="#1B5E3F" />
                </linearGradient>
              </defs>

              <path
                d="M 100 32 C 160 32, 200 32, 260 32"
                stroke="url(#journey-grad-1)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <path
                d="M 300 32 C 360 32, 400 32, 460 32"
                stroke="url(#journey-grad-2)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />
              <path
                d="M 500 32 C 560 32, 600 32, 660 32"
                stroke="url(#journey-grad-3)"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              <circle cx="100" cy="32" r="8" fill="#2C465E" />
              <circle cx="300" cy="32" r="8" fill="#8C4024" />
              <circle cx="500" cy="32" r="8" fill="#704E1B" />
              <circle cx="700" cy="32" r="8" fill="#1B5E3F" />
            </svg>
          </div>

          {/* Active Stage Lens Studio */}
          <div
            id={`panel-${currentJourneyStage.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${currentJourneyStage.id}`}
            className="about-stage-dossier"
            style={{
              borderLeftColor: currentJourneyStage.color
            }}
          >
            <div className="about-dossier-header">
              <div className="about-dossier-pill-wrap">
                <span
                  className="about-dossier-pill"
                  style={{
                    backgroundColor: currentJourneyStage.color,
                    color: '#FFFDF8'
                  }}
                >
                  STAGE {currentJourneyStage.index} · {currentJourneyStage.label}
                </span>
                <span className="about-dossier-stage-name">{currentJourneyStage.title}</span>
              </div>

              {/* Stepper Controls */}
              <div className="about-dossier-stepper">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="about-dossier-stepper-btn"
                  title="Go to previous stage"
                >
                  &larr; Previous
                </button>
                <span className="about-dossier-step-counter" aria-live="polite">
                  {activeJourneyIdx + 1} of {JOURNEY_STAGES.length}
                </span>
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="about-dossier-stepper-btn"
                  title="Go to next stage"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

            <p className="about-dossier-question">
              "{currentJourneyStage.coreQuestion}"
            </p>

            <p className="about-dossier-summary">
              {currentJourneyStage.summary}
            </p>

            <div className="about-dossier-grid">
              <div className="about-dossier-box">
                <span className="about-dossier-box-label">The Underlying Philosophy</span>
                <p>{currentJourneyStage.philosophy}</p>
              </div>

              <div className="about-dossier-box">
                <span className="about-dossier-box-label">Real-World Trigger</span>
                <p>{currentJourneyStage.realWorld}</p>
              </div>
            </div>

            <div className="about-dossier-box" style={{ marginTop: '16px' }}>
              <span className="about-dossier-box-label">The Portal’s Working Tool</span>
              <p>{currentJourneyStage.portalAction}</p>
            </div>

            {/* Next Stage Connection Bridge */}
            <div className="about-dossier-bridge">
              <span className="about-bridge-badge">Next-Stage Causality</span>
              <p className="about-bridge-text">{currentJourneyStage.nextBridge}</p>
            </div>

            <div className="about-dossier-footer">
              <Link to={currentJourneyStage.linkPath} className="about-dossier-action-btn">
                <span>{currentJourneyStage.linkText}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('pedagogy')}
                className="about-dossier-secondary-link"
              >
                See Decision Simulation Below &darr;
              </button>
            </div>
          </div>
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            Next: How this four-point journey is embodied across the six pillars of the portal &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 03: THE GUIDE — EXPLORE THE PORTAL (DISCOVERY)
          Interactive Defense Constellation (Sole Canonical Ownership)
          ================================================================== */}
      <section id="ecosystem" className="about-chapter-section" aria-labelledby="heading-ecosystem">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 03 · THE GUIDE</span>
          <h2 id="heading-ecosystem" className="about-chapter-title">The Portal Ecosystem</h2>
          <p className="about-chapter-standfirst">
            A connected interactive map of the six canonical areas of the portal. Select any pillar to inspect its defensive role and how it connects to the rest of the system.
          </p>
        </div>

        {/* Interactive Defense Constellation */}
        <div className="about-constellation-pavilion">
          <div className="about-constellation-rail" aria-label="Six ecosystem pillars">
            {ECOSYSTEM_PILLARS.map((pillar) => {
              const isCur = activePillarId === pillar.id;
              return (
                <article
                  key={pillar.id}
                  id={`pillar-card-${pillar.id}`}
                  className={`about-pillar-node ${isCur ? 'is-active' : ''}`}
                  onClick={() => setActivePillarId(pillar.id)}
                >
                  <div className="about-pillar-top">
                    <span className="about-pillar-num">{pillar.num}</span>
                    <span className="about-pillar-role">{pillar.role}</span>
                  </div>
                  <h3 className="about-pillar-title">
                    <button
                      type="button"
                      className="about-pillar-select-btn"
                      onClick={() => setActivePillarId(pillar.id)}
                      aria-pressed={isCur}
                    >
                      {pillar.title}
                    </button>
                  </h3>
                  <Link
                    to={pillar.path}
                    className="about-pillar-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>Open Section</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </article>
              );
            })}
          </div>

          {/* Active Console Focus */}
          <div
            id={`panel-pillar-${currentPillar.id}`}
            className="about-constellation-console"
            aria-live="polite"
          >
            <div className="about-console-header">
              <div className="about-console-meta">
                <span className="about-console-role-tag">{currentPillar.role}</span>
                <h3 className="about-console-title">{currentPillar.title}</h3>
              </div>
              <Link to={currentPillar.path} className="about-console-launch-btn">
                <span>{currentPillar.actionText}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            <p className="about-console-summary">{currentPillar.summary}</p>

            <div className="about-console-connections">
              <span className="about-conn-label">How It Connects to Other Pillars:</span>
              <p className="about-conn-text">{currentPillar.connections}</p>
            </div>

            <div className="about-console-highlights">
              <span className="about-highlights-label">Core Working Capabilities:</span>
              <div className="about-highlight-chips">
                {currentPillar.highlights.map((h, i) => (
                  <span key={i} className="about-highlight-chip">&bull; {h}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            Next: Moving from passive reading to active, calibrated decision-making &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 04: THE METHOD — HOW LEARNING HAPPENS (UNDERSTAND)
          Interactive Decision Sandbox Micro-Simulator & Digital Day
          ================================================================== */}
      <div id="method" className="about-anchor-target" aria-hidden="true" />
      <section id="pedagogy" className="about-chapter-section" aria-labelledby="heading-pedagogy">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 04 · THE METHOD</span>
          <h2 id="heading-pedagogy" className="about-chapter-title">Rote Memory vs. Experiential Reflex</h2>
          <p className="about-chapter-standfirst">
            Traditional cybersecurity education teaches people to pass multiple-choice tests. The portal conditions autonomic reflexes in safe, realistic decision environments.
          </p>
        </div>

        {/* Live Decision Sandbox Micro-Simulator */}
        <div className="about-micro-sandbox">
          <div className="about-sandbox-header">
            <div className="about-sandbox-badge-wrap">
              <span className="about-sandbox-badge">Interactive Reflex Check</span>
              <span className="about-sandbox-sub">Explore the situation at your own pace without time pressure</span>
            </div>
            {sandboxChoice && (
              <button
                type="button"
                onClick={() => setSandboxChoice(null)}
                className="about-sandbox-reset-btn"
              >
                Reset &amp; Try Another Choice &#8634;
              </button>
            )}
          </div>

          <div className="about-sandbox-scenario-card">
            <div className="about-sandbox-prompt-header">
              <span className="about-sandbox-prompt-tag">Simulated Situation</span>
              <span className="about-sandbox-prompt-time">Instant Messaging Hook</span>
            </div>
            <p className="about-sandbox-prompt-text">
              An unfamiliar number with your close friend's profile picture messages you:
              <br />
              <em>"Hey, my phone and wallet were stolen in an emergency. I am stranded at the hospital clinic with a friend. Please send ₹4,500 immediately to this clinic pharmacy UPI ID: <strong>clinic-care@oksbi</strong> while I sort out my SIM card. Very urgent!"</em>
            </p>
          </div>

          <div className="about-sandbox-options-grid" role="group" aria-label="Decision choices">
            {SANDBOX_OPTIONS.map((opt) => {
              const isSelected = sandboxChoice === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSandboxChoice(opt.id)}
                  className={`about-sandbox-option-btn ${isSelected ? 'is-selected' : ''}`}
                >
                  <span className="about-sandbox-opt-badge">{opt.label}</span>
                  <span className="about-sandbox-opt-text">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {currentSandboxResult && (
            <div className={`about-sandbox-debrief-card is-${currentSandboxResult.type}`}>
              <div className="about-debrief-top">
                <span className="about-debrief-pill">{currentSandboxResult.badge}</span>
              </div>
              <div className="about-debrief-section">
                <span className="about-debrief-label">Behavioral Observation</span>
                <p className="about-debrief-text">{currentSandboxResult.behavioralAnalysis}</p>
              </div>
              <div className="about-debrief-section is-legal">
                <span className="about-debrief-label">Statutory &amp; Legal Context</span>
                <p className="about-debrief-text">{currentSandboxResult.legalImplications}</p>
              </div>
              <div className="about-debrief-takeaway">
                <strong>Portal Action:</strong> {currentSandboxResult.remedy}
              </div>
            </div>
          )}
        </div>

        {/* Chronological Inspector: "Your Digital Day" */}
        <div className="about-pedagogy-duo">
          <div className="about-pedagogy-panel">
            <h3 className="about-pedagogy-title">The "Your Digital Day" Experience</h3>
            <p className="about-pedagogy-lead">
              Rather than generic test questions, our simulation follows an ordinary working day across five vulnerable checkpoints:
            </p>

            <div className="about-timeline-inspector" role="tablist" aria-label="Digital Day checkpoints">
              {DIGITAL_DAY_MOMENTS.map((m, idx) => {
                const isSelected = activeDayIdx === idx;
                return (
                  <button
                    key={m.time}
                    type="button"
                    role="tab"
                    id={`tab-moment-${idx}`}
                    aria-selected={isSelected}
                    aria-controls={`panel-moment-${idx}`}
                    onClick={() => setActiveDayIdx(idx)}
                    className={`about-moment-btn ${isSelected ? 'is-active' : ''}`}
                  >
                    <span className="about-moment-btn-time">{m.time}</span>
                    <span className="about-moment-btn-title">{m.title}</span>
                  </button>
                );
              })}
            </div>

            <div
              id={`panel-moment-${activeDayIdx}`}
              role="tabpanel"
              aria-labelledby={`tab-moment-${activeDayIdx}`}
              className="about-moment-detail-card"
            >
              <div className="about-moment-detail-head">
                <span className="about-moment-detail-time">{currentDayMoment.time}</span>
                <span className="about-moment-detail-vector">{currentDayMoment.vector}</span>
              </div>
              <h4 className="about-moment-detail-title">{currentDayMoment.title}</h4>
              <p className="about-moment-detail-desc">{currentDayMoment.scenario}</p>
              <div className="about-moment-detail-reflex">
                <strong>Behavior Observed:</strong> {currentDayMoment.reflexTested}
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#455246', lineHeight: '1.6', margin: '16px 0 0 0' }}>
              No score counters tick during the simulation. No "Correct" or "Wrong" alarms flash. The simulation calmly observes the user's natural decision reflexes.
            </p>
          </div>

          {/* Comparative Shift Panel */}
          <div className="about-pedagogy-panel">
            <h3 className="about-pedagogy-title">A Fundamental Shift in Training</h3>
            <p className="about-pedagogy-lead">
              A side-by-side comparison of conventional training against our experiential assessment engine:
            </p>

            <div className="about-comparison-table-wrap">
              <table className="about-comparison-table" aria-label="Comparison between traditional cyber training and portal approach">
                <thead>
                  <tr>
                    <th scope="col">Traditional Security Training</th>
                    <th scope="col">The Portal Approach</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Isolated Multiple Choice</strong>
                      Abstract questions detached from real emotional or operational pressure.
                    </td>
                    <td>
                      <strong>Immersive Decision Sandbox</strong>
                      Authentic interactive representations of SMS, WhatsApp, and browser prompts.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Punitive Composite % Score</strong>
                      Reduces human behavior to a meaningless grade (e.g. "You scored 72%").
                    </td>
                    <td>
                      <strong>Discrete Behavioral Diagnostic</strong>
                      6 independent metrics evaluating verification, false alarms, and autopilot habits.
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <strong>Victim-Blaming &amp; Shame</strong>
                      Labels users "careless" or "paranoid," inducing anxiety rather than vigilance.
                    </td>
                    <td>
                      <strong>Non-Punitive Reflection</strong>
                      Constructive debriefing linking choices directly to statutory protections and safe protocols.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="about-pedagogy-quote-card">
              <p className="about-pedagogy-quote-text">
                "You weren't being tested on whether you could guess what was a scam. You were being observed on how you make everyday digital decisions."
              </p>
              <p className="about-pedagogy-quote-author">
                — System Post-Assessment Philosophy
              </p>
            </div>
          </div>
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            If we reject a single percentage score, how is defensive readiness measured? &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 05: THE DEEPER LAYER — HOW ASSESSMENT WORKS (DEMONSTRATION)
          Six Discrete Behavioral Dimensions
          ================================================================== */}
      <section id="assessment" className="about-chapter-section" aria-labelledby="heading-assessment">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 05 · THE DEEPER LAYER</span>
          <h2 id="heading-assessment" className="about-chapter-title">The Six-Metric Behavioral Measurement Model</h2>
          <p className="about-chapter-standfirst">
            Defensive competence cannot be captured by an arbitrary percentage. We evaluate decision reflexes across six discrete behavioral dimensions.
          </p>
        </div>

        {/* 1. Interactive Dimension Navigation System Deck */}
        <div className="about-metrics-nav-deck">
          <div className="about-metrics-nav-header">
            <span className="about-metrics-nav-kicker">DIMENSION NAVIGATOR</span>
            <span className="about-metrics-nav-hint">Select a dimension to inspect its cognitive reflex, scoring mechanics, and statutory anchor</span>
          </div>

          <div className="about-metrics-selector-row" role="tablist" aria-label="Six behavioral dimensions">
            {BEHAVIORAL_METRICS.map((m, idx) => {
              const isCur = activeMetricCode === m.code;
              return (
                <button
                  key={m.code}
                  type="button"
                  role="tab"
                  id={`tab-metric-${m.code}`}
                  aria-selected={isCur}
                  aria-controls={`panel-metric-${m.code}`}
                  onClick={() => setActiveMetricCode(m.code)}
                  onKeyDown={(e) => handleMetricKeyDown(e, idx)}
                  className={`about-metric-tab-btn ${isCur ? 'is-active' : ''}`}
                  style={{ '--metric-accent': m.color, '--metric-bg-tint': m.bgTint }}
                >
                  <div className="about-metric-tab-top">
                    <span className="about-metric-tab-index">0{idx + 1}</span>
                    <span className="about-metric-code-pill">{m.code}</span>
                  </div>
                  <span className="about-metric-tab-label">{m.name}</span>
                  <div className="about-metric-tab-bottom">
                    <span className="about-metric-tab-scale">{m.formula}</span>
                    {isCur && <span className="about-metric-active-pip" aria-hidden="true" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Active Dimension Deep Dive Console (Spotlight) */}
        <div
          id={`panel-metric-${currentMetric.code}`}
          role="tabpanel"
          aria-labelledby={`tab-metric-${currentMetric.code}`}
          className="about-dimension-spotlight"
          style={{ '--spotlight-accent': currentMetric.color, '--spotlight-tint': currentMetric.bgTint }}
        >
          <div className="about-spotlight-top">
            <div className="about-spotlight-badge-group">
              <span className="about-spotlight-code">{currentMetric.code}</span>
              <div className="about-spotlight-title-group">
                <span className="about-spotlight-kicker">
                  BEHAVIORAL DIMENSION 0{currentMetricIdx + 1} OF 06 · {currentMetric.scaleCategory}
                </span>
                <h3 className="about-spotlight-title">{currentMetric.name}</h3>
              </div>
            </div>
            <div className="about-spotlight-stepper" aria-label="Cycle dimensions">
              <button
                type="button"
                onClick={handlePrevMetric}
                aria-label="Previous dimension"
                className="about-stepper-btn"
              >
                <span aria-hidden="true">&larr;</span> Previous
              </button>
              <span className="about-stepper-counter">
                {currentMetricIdx + 1} of {BEHAVIORAL_METRICS.length}
              </span>
              <button
                type="button"
                onClick={handleNextMetric}
                aria-label="Next dimension"
                className="about-stepper-btn"
              >
                Next <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          {/* Lead Focus & Explanation Card */}
          <div className="about-spotlight-lead-card">
            <div className="about-spotlight-lead-header">
              <span className="about-spotlight-lead-tag">COGNITIVE OBSERVATION FOCUS</span>
              <h4 className="about-spotlight-focus">{currentMetric.focus}</h4>
            </div>
            <p className="about-spotlight-desc">{currentMetric.definition}</p>
          </div>

          <div className="about-spotlight-diptych">
            {/* Card 1: Behavioral Mechanism & Scoring Model */}
            <div className="about-spotlight-card">
              <div className="about-spotlight-sub-block">
                <h4 className="about-spotlight-card-heading">Authoritative Scoring Formula</h4>
                <p className="about-spotlight-sub-text">{currentMetric.evaluationModel}</p>
              </div>

              <div className="about-spotlight-sub-block">
                <h4 className="about-spotlight-card-heading">Statutory &amp; Regulatory Anchor</h4>
                <p className="about-statutory-anchor-code">{currentMetric.statutoryAnchor}</p>
              </div>
            </div>

            {/* Card 2: Decision Encounter Scenario & Calibrated Reflex */}
            <div className="about-spotlight-card">
              <div className="about-spotlight-sub-block">
                <h4 className="about-spotlight-card-heading">Everyday Decision Encounter</h4>
                <p className="about-spotlight-scenario">"{currentMetric.encounterScenario}"</p>
              </div>

              <div className="about-spotlight-contrast">
                <div className="about-contrast-item is-autopilot">
                  <span className="about-contrast-badge">Autopilot Impulse</span>
                  <p className="about-contrast-text">{currentMetric.autopilotImpulse}</p>
                </div>
                <div className="about-contrast-item is-calibrated">
                  <span className="about-contrast-badge">Calibrated Defensive Reflex</span>
                  <p className="about-contrast-text">{currentMetric.calibratedReflex}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-spotlight-footer">
            <strong>Everyday Citizen Habit:</strong> {currentMetric.realWorld}
          </div>
        </div>

        {/* 3. Six Metric Overview Cards (Compact Taxonomy Reference Grid) */}
        <div className="about-metrics-overview-section">
          <div className="about-metrics-overview-header">
            <div className="about-metrics-overview-titles">
              <span className="about-overview-kicker">TAXONOMY OVERVIEW</span>
              <h3 className="about-overview-title">All Six Dimensions at a Glance</h3>
            </div>
            <p className="about-overview-subtitle">
              Select any card to load its complete decision scenario and statutory anchor into the active console above.
            </p>
          </div>

          <div className="about-metrics-overview-grid" role="region" aria-label="Overview cards for all six dimensions">
            {BEHAVIORAL_METRICS.map((m) => {
              const isCur = activeMetricCode === m.code;
              return (
                <article
                  key={m.code}
                  className={`about-metric-overview-card ${isCur ? 'is-active' : ''}`}
                  style={{ '--card-accent': m.color, '--card-tint': m.bgTint }}
                  onClick={() => setActiveMetricCode(m.code)}
                >
                  <div className="about-overview-card-top">
                    <span className="about-overview-card-code">{m.code}</span>
                    <span className="about-overview-card-scale">{m.formula}</span>
                  </div>

                  <h4 className="about-overview-card-name">{m.name}</h4>
                  <p className="about-overview-card-focus">{m.focus}</p>

                  <div className="about-overview-card-anchor">
                    <span className="about-overview-anchor-label">Statutory Anchor</span>
                    <span className="about-overview-anchor-text">{m.statutoryAnchor.split(' & ')[0]}</span>
                  </div>

                  <div className="about-overview-card-footer">
                    <button
                      type="button"
                      className={`about-overview-inspect-btn ${isCur ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMetricCode(m.code);
                      }}
                      aria-pressed={isCur}
                    >
                      {isCur ? (
                        <>
                          <span className="about-overview-status-dot" aria-hidden="true" /> Active in Console
                        </>
                      ) : (
                        <>
                          Inspect Dimension <span aria-hidden="true">&rarr;</span>
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="about-no-composite-box">
          <strong>Why We Reject Composite Percentage Scores:</strong> Digital safety is not an average. A citizen may demonstrate 95% overall caution, but if they routinely yield to unreviewed consent (UA) or fail out-of-band verification (VB), an attacker needs only one opportunity to compromise their account. Evaluating these six dimensions discretely allows learners to pinpoint exact behavioral habits that need strengthening.
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            Observing human behavior requires uncompromised ethics, privacy, and clear boundaries &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 06: THE PRINCIPLES & BOUNDARIES — WHAT GUIDES THE PROJECT (TRUST)
          Mission, Principles, System Architecture & Scope
          ================================================================== */}
      <section id="principles" className="about-chapter-section" aria-labelledby="heading-principles">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 06 · TRUST &amp; PRINCIPLES</span>
          <h2 id="heading-principles" className="about-chapter-title">Institutional Standards &amp; Architecture</h2>
          <p className="about-chapter-standfirst">
            Clear ethical commitments, open engineering standards, and honest demarcation of what the portal provides.
          </p>
        </div>

        {/* Mission & Vision Diptych */}
        <div id="mission" className="about-anchor-target" aria-hidden="true" />
        <div className="about-mission-diptych">
          <article className="about-mandate-card is-mission">
            <div className="about-mandate-seal" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <span className="about-mandate-eyebrow">OUR MISSION</span>
            <h3 className="about-mandate-title">Make Indian Cyber Laws Clear &amp; Practical</h3>
            <p className="about-mandate-body">
              To explain Indian digital statutes in plain language, highlight common cybercrime patterns, and provide everyday internet users with practical, actionable steps to protect themselves and report incidents through official channels.
            </p>
            <div className="about-mandate-credo">
              Clear Explanations · Everyday Safety · Zero Fear
            </div>
          </article>

          <article className="about-mandate-card is-vision">
            <div className="about-mandate-seal" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <span className="about-mandate-eyebrow">OUR VISION</span>
            <h3 className="about-mandate-title">Informed Digital Decisions for Everyday Users</h3>
            <p className="about-mandate-body">
              A helpful learning platform where students, working individuals, and families can look up unfamiliar digital situations, understand what the law says, and make safer, more confident choices when using technology.
            </p>
            <div className="about-mandate-credo">
              Practical Awareness · Informed Choice · Restrained Confidence
            </div>
          </article>
        </div>

        {/* 6 Guiding Principles Grid */}
        <div className="about-principles-block">
          <h3 className="about-sub-heading">Six Core Ethical Commitments</h3>
          <div className="about-principles-grid">
            {GUIDING_PRINCIPLES.map((pr) => (
              <article key={pr.num} className="about-principle-card">
                <div className="about-principle-num">{pr.num} / {pr.tag}</div>
                <h4 className="about-principle-title">{pr.title}</h4>
                <p className="about-principle-body">{pr.desc}</p>
              </article>
            ))}
          </div>
        </div>

        {/* System Architecture Section */}
        <div id="project" className="about-anchor-target" aria-hidden="true" />
        <section className="about-arch-block" aria-labelledby="heading-project">
          <h3 id="heading-project" className="about-sub-heading">System Architecture &amp; Academic Profile</h3>
          
          <div className="about-project-layout">
            <div className="about-arch-card">
              <h4 className="about-arch-title">The MERN Engineering Stack</h4>
              <div className="about-stack-layers">
                <div className="about-stack-node">
                  <div className="about-stack-node-head">
                    <span className="about-stack-tier">Client Presentation Tier</span>
                    <span className="about-stack-tech">React 18 · Vite · Vanilla CSS</span>
                  </div>
                  <p className="about-stack-desc">
                    Single-Page Application (SPA) utilizing design tokens from The Constitutional Atelier. WCAG 2.1 AA accessible, responsive across viewports, with zero-telemetry local compilation.
                  </p>
                </div>

                <div className="about-connector-arrow" aria-hidden="true">&darr; (Secure REST API / JSON Payloads)</div>

                <div className="about-stack-node">
                  <div className="about-stack-node-head">
                    <span className="about-stack-tier">Application API Tier</span>
                    <span className="about-stack-tech">Node.js · Express.js · JWT Auth</span>
                  </div>
                  <p className="about-stack-desc">
                    Authoritative server-side scoring engine (`assessmentScoringService`), parameter isolation guards, atomic stage transitions (CAS), and cryptographic password hashing (bcrypt).
                  </p>
                </div>

                <div className="about-connector-arrow" aria-hidden="true">&darr; (Mongoose Data Mapping)</div>

                <div className="about-stack-node">
                  <div className="about-stack-node-head">
                    <span className="about-stack-tier">Persistent Datastore</span>
                    <span className="about-stack-tech">MongoDB Atlas · Mongoose</span>
                  </div>
                  <p className="about-stack-desc">
                    Schema-validated storage for learning modules, statutory catalogs, and immutable historical assessment sessions (`readyState === 0` offline test isolation).
                  </p>
                </div>
              </div>
            </div>

            <div className="about-arch-card">
              <h4 className="about-arch-title">Academic Origins &amp; Engineering Rigor</h4>
              <ul className="about-academic-spec-list">
                <li className="about-academic-spec-item">
                  <span className="about-academic-spec-bullet">&bull;</span>
                  <div>
                    <strong>Academic Context:</strong> Developed as a Bachelor of Technology (BTech) Computer Science &amp; Engineering capstone project focusing on public digital literacy, statutory clarity, and practical cyber awareness.
                  </div>
                </li>
                <li className="about-academic-spec-item">
                  <span className="about-academic-spec-bullet">&bull;</span>
                  <div>
                    <strong>Authoritative Server Scoring:</strong> All 6 behavioral dimension metrics are authoritatively computed on the server. The client cannot forge or tamper with diagnostic evaluation results.
                  </div>
                </li>
                <li className="about-academic-spec-item">
                  <span className="about-academic-spec-bullet">&bull;</span>
                  <div>
                    <strong>Session Version Isolation:</strong> Assessment scenarios are version-pinned; historical completed sessions remain strictly immutable even when new curriculum versions are deployed.
                  </div>
                </li>
                <li className="about-academic-spec-item">
                  <span className="about-academic-spec-bullet">&bull;</span>
                  <div>
                    <strong>Continuous Automated Verification:</strong> Hardened with comprehensive offline automated test suites (86+ unit and integration tests) and Playwright multi-viewport browser QA.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Transparency & Scope Charter */}
        <div id="disclaimer" className="about-anchor-target" aria-hidden="true" />
        <div id="transparency" className="about-transparency-block" aria-labelledby="heading-transparency">
          <h3 id="heading-transparency" className="about-sub-heading">Transparency, Responsibility &amp; Scope</h3>
          
          <div className="about-charter-grid">
            <div className="about-charter-box is-portal">
              <h4 className="about-charter-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>What the Portal Is</span>
              </h4>
              <ul className="about-charter-list">
                <li className="about-charter-item">
                  <span className="about-charter-marker">&check;</span>
                  <div>
                    <strong>An Open Educational Resource:</strong> A civic literacy initiative designed to demystify Indian cyber statutes and explain everyday digital risk.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker">&check;</span>
                  <div>
                    <strong>A Defensive Decision Sandbox:</strong> A safe, risk-free environment where learners calibrate recognition reflexes across realistic everyday scenarios.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker">&check;</span>
                  <div>
                    <strong>A Citizen Evidence Helper:</strong> A client-side workspace assisting victims in formatting chronologies and electronic evidence under Section 63 BSA 2023.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker">&check;</span>
                  <div>
                    <strong>An Authoritative Signpost:</strong> A structured directory routing citizens directly to verified national helplines, police units, and regulatory ombudsmen.
                  </div>
                </li>
              </ul>
            </div>

            <div className="about-charter-box is-not-portal">
              <h4 className="about-charter-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span>What the Portal Is NOT</span>
              </h4>
              <ul className="about-charter-list">
                <li className="about-charter-item">
                  <span className="about-charter-marker is-cross">&times;</span>
                  <div>
                    <strong>Not Legal Advice:</strong> Content is strictly educational and does not constitute formal legal counsel, attorney-client representation, or statutory certification.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker is-cross">&times;</span>
                  <div>
                    <strong>Not an Emergency Dispatcher:</strong> This portal does not operate police dispatchers, cannot register First Information Reports (FIRs), and cannot initiate bank account freezes.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker is-cross">&times;</span>
                  <div>
                    <strong>Not an Official Government Body:</strong> We are an independent academic initiative, not an affiliate of the Ministry of Home Affairs or law enforcement.
                  </div>
                </li>
                <li className="about-charter-item">
                  <span className="about-charter-marker is-cross">&times;</span>
                  <div>
                    <strong>Not a Data Harvester:</strong> We do not sell user data, track personal profiles across the web, or collect passwords, OTPs, or bank credentials.
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Emergency Referral Banner */}
          <div className="about-emergency-referral-banner">
            <div className="about-emergency-seal" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div className="about-emergency-text-wrap">
              <h4 className="about-emergency-heading">Experiencing Active Financial Cyber Fraud Right Now?</h4>
              <p className="about-emergency-body">
                Do not wait. The first <strong>2 to 3 hours (The Golden Hour)</strong> are crucial for inter-bank hold coordination (CFCFRMS). Call the National Cybercrime Helpline immediately or lodge an incident on the national reporting portal.
              </p>
              <div className="about-emergency-actions">
                <a href="tel:1930" className="about-btn-emergency">
                  <span className="about-btn-icon" aria-hidden="true">&#9742;</span>
                  <span>Dial National Helpline 1930 (Toll-Free)</span>
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-btn-portal-ext"
                >
                  <span>cybercrime.gov.in</span>
                  <span aria-hidden="true">&nearr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Chapter Connector */}
        <div className="about-chapter-connector" aria-hidden="true">
          <span className="about-connector-line" />
          <span className="about-connector-caption">
            Awareness is valuable only when applied in everyday life &darr;
          </span>
          <span className="about-connector-line" />
        </div>
      </section>

      {/* ==================================================================
          CHAPTER 07: THE CLOSING — PUT AWARENESS INTO ACTION (ACT)
          ================================================================== */}
      <section id="action" className="about-chapter-section is-closing" aria-labelledby="heading-closing">
        <div className="about-chapter-prologue">
          <span className="about-chapter-numeral">CHAPTER 07 · CLOSING</span>
          <h2 id="heading-closing" className="about-chapter-title">Put Awareness into Action</h2>
          <p className="about-chapter-standfirst">
            Understanding digital risk is not an academic exercise—it is an everyday civic skill. Choose where you want to begin:
          </p>
        </div>

        {/* Three Action Pathways */}
        <div className="about-action-pathways">
          <article className="about-action-card">
            <span className="about-action-tag">PRACTICAL TEST</span>
            <h3 className="about-action-title">Test Your Decision Instincts</h3>
            <p className="about-action-body">
              Experience the non-punitive "Your Digital Day" scenario to discover how your natural reflexes respond to everyday digital pressure.
            </p>
            <Link to="/dashboard" className="about-action-btn is-primary">
              <span>Start Baseline Assessment</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </article>

          <article className="about-action-card">
            <span className="about-action-tag">STATUTORY CLARITY</span>
            <h3 className="about-action-title">Understand Common Threats</h3>
            <p className="about-action-body">
              Browse plain-language translations of operative Indian cyber statutes and inspect deconstructed threat scripts across 29 vectors.
            </p>
            <Link to="/crimes" className="about-action-btn">
              <span>Explore Threat Catalog</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </article>

          <article className="about-action-card">
            <span className="about-action-tag">PREVENTATIVE REFLEX</span>
            <h3 className="about-action-title">Know What to Do in an Emergency</h3>
            <p className="about-action-body">
              Review crisis response playbooks, evidence preservation steps under Section 63 BSA, or generate a structured incident docket.
            </p>
            <Link to="/prevention" className="about-action-btn">
              <span>Open Safety Quick-Guide</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </article>
        </div>

        {/* Closing Editorial Monograph Seal */}
        <div className="about-closing-seal-block">
          <div className="about-seal-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <blockquote className="about-closing-quote">
            "Justice requires legal literacy. Security requires calibrated reflexes. The Cyber Law Awareness Portal exists to ensure that every citizen possesses both."
          </blockquote>
          <p className="about-closing-motto">
            The Constitutional Atelier · Empowering Citizens Through Digital Literacy
          </p>
        </div>

        {/* Mandatory Statutory Disclaimer */}
        <div className="about-statutory-disclaimer" role="note" aria-label="Statutory disclaimer">
          <p className="about-disclaimer-text">
            <strong>STATUTORY &amp; EDUCATIONAL DISCLAIMER:</strong> The Cyber Law Awareness Portal is an independent academic project developed for civic education and digital literacy purposes. The explanations of statutes—including the Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, Digital Personal Data Protection Act 2023, and Bharatiya Sakshya Adhiniyam 2023—are provided for general informational awareness and do not constitute formal legal advice, judicial interpretation, or an attorney-client relationship. In cases of active cyber fraud, identity theft, or unauthorized fund transfers, citizens should report immediately to the National Cybercrime Reporting Helpline (1930), the official portal (cybercrime.gov.in), their respective banking institution, or local law enforcement authorities.
          </p>
        </div>
      </section>
    </div>
  );
}
