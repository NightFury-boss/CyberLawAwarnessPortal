const fs = require('fs');
const path = require('path');

const stages13Data = [
  {
    stageOrder: 1,
    title: "Salary Credit Alert",
    description: "You check your morning notifications and notice an SMS regarding your monthly salary deposit.",
    mockInterfaceType: "notification",
    mockInterfaceData: {
      title: "HDFC Bank Alert",
      body: "Dear Customer, INR 68,500.00 credited to A/C ending XX4912 on 01-Sep-26 towards Salary. Clear Balance: INR 74,210.00. Thank you for banking with HDFC.",
      dateString: "Today 8:30 AM"
    },
    eventClassification: "legitimate",
    measurementFocus: ["FALSE_POSITIVE_CONTROL", "DECISION_QUALITY"],
    targetSignals: [],
    terminal: false,
    decisions: [
      {
        optionText: "Acknowledge the notification and check account balance normally",
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 2,
        explanation: "Optimal. This is a routine, legitimate bank notification with accurate partial account digits.",
        outcomeType: "correct"
      },
      {
        optionText: "Report SMS as fraud / attempt to block bank",
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 2,
        explanation: "Over-reporting error. Flagging an authentic bank credit notification creates unnecessary panic and service disruption.",
        outcomeType: "false-positive"
      },
      {
        optionText: "Dismiss notification without checking",
        scoreChange: 0,
        behaviorEffects: { decisionQuality: 1, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 2,
        explanation: "Acceptable disengagement, but reviewing verified account statements is standard financial hygiene.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 2,
    title: "SpeedPost Delivery Notice",
    description: "You receive an SMS claiming an India Post parcel could not be delivered to your address.",
    mockInterfaceType: "sms",
    mockInterfaceData: {
      sender: "VK-INDPOST",
      senderNumber: "VK-INDPOST",
      body: "SpeedPost parcel #IN-84920 could not be delivered due to incomplete street address. Update house number within 12 hours at indiapost-resched.top to prevent immediate return to sender.",
      dateString: "10:15 AM"
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "SIGNAL_IDENTIFICATION", "VERIFICATION", "DECISION_QUALITY"],
    targetSignals: ["unexpected_domain", "urgency"],
    terminal: false,
    decisions: [
      {
        optionText: "Click link immediately to update delivery address",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 3,
        explanation: "Unsafe. The link points to an unauthorized non-government domain (indiapost-resched.top) designed to steal card details.",
        outcomeType: "incorrect"
      },
      {
        optionText: "Open the official India Post website separately to track consignment number",
        scoreChange: 20,
        identifiedSignals: ["unexpected_domain", "urgency"],
        behaviorEffects: { recognition: 2, signalIdentification: 2, verification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 3,
        explanation: "Excellent independent verification. Using official channels (indiapost.gov.in) protects you from lookalike phishing links.",
        outcomeType: "correct"
      },
      {
        optionText: "Delete the message without checking tracking status",
        scoreChange: 5,
        behaviorEffects: { recognition: 1, signalIdentification: 0, verification: 0, decisionQuality: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 3,
        explanation: "Cautious avoidance prevents harm, but independent verification provides certainty regarding legitimate postal deliveries.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 3,
    title: "Freelance Career Inquiry",
    description: "An unsolicited recruiter message reaches you on professional messaging offering flexible remote work.",
    mockInterfaceType: "messaging",
    mockInterfaceData: {
      sender: "Global HR Solutions",
      body: "Hi there! We reviewed your profile and shortlisted you for our Part-Time App Reviewer position. Earn ₹15,000/week working 1 hour daily. To activate your starter pack and access corporate training materials, an onboarding registration fee of ₹499 is required.",
      dateString: "11:45 AM"
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "SIGNAL_IDENTIFICATION", "DECISION_QUALITY"],
    targetSignals: ["unexpected_payment_request", "mismatched_branding"],
    terminal: false,
    decisions: [
      {
        optionText: "Pay ₹499 upfront fee to secure the job position",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, signalIdentification: 0, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 4,
        explanation: "Unsafe. Paying upfront fees for job offers is a hallmark of task-based employment fraud.",
        outcomeType: "incorrect"
      },
      {
        optionText: "Decline the upfront payment and independently verify the job posting through the employer's official careers portal",
        scoreChange: 20,
        identifiedSignals: ["unexpected_payment_request", "mismatched_branding"],
        behaviorEffects: { recognition: 2, signalIdentification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 4,
        explanation: "Optimal contextual reasoning. Unexpected upfront payments and informal contact methods require independent verification through the employer's official careers portal.",
        outcomeType: "correct"
      },
      {
        optionText: "Inquire about the fee within the same chat and request further details",
        scoreChange: 5,
        identifiedSignals: ["unexpected_payment_request"],
        behaviorEffects: { recognition: 1, signalIdentification: 1, decisionQuality: 1 },
        riskLevel: "medium-risk",
        isCriticalMistake: false,
        nextStageOrder: 4,
        explanation: "Partial recognition. You noticed the unusual payment, but questioning a scammer within the same chat allows them to deploy persuasive social engineering scripts.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 4,
    title: "UPI Cashback Collect Request",
    description: "While checking your payment app around lunch, a full-screen notification request appears.",
    mockInterfaceType: "checkout",
    mockInterfaceData: {
      merchantName: "RewardBazaar Offers (rewardbazaar@ybl)",
      amount: "1.00",
      warningText: "Message from requester: Enter UPI PIN to claim your ₹2,500 festive cash bonus."
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "VERIFICATION", "UNREVIEWED_ACCEPTANCE", "DECISION_QUALITY"],
    targetSignals: ["unexpected_payment_request", "urgency"],
    terminal: false,
    decisions: [
      {
        optionText: "Enter UPI PIN to authorize the transaction",
        scoreChange: -30,
        behaviorEffects: { recognition: 0, verification: 0, unreviewedAcceptance: 2, decisionQuality: 0 },
        riskLevel: "critical",
        isCriticalMistake: true,
        nextStageOrder: 5,
        explanation: "Critical security mistake! Entering your UPI PIN always authorizes money leaving your account, never receiving cashback.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Decline the collect request on screen",
        scoreChange: 15,
        behaviorEffects: { recognition: 2, verification: 0, unreviewedAcceptance: 0, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 5,
        explanation: "Safe refusal. Declining the prompt prevents unauthorized debits from your bank account.",
        outcomeType: "correct"
      },
      {
        optionText: "Decline the request and report the unknown VPA inside the payment app",
        scoreChange: 20,
        behaviorEffects: { recognition: 2, verification: 2, unreviewedAcceptance: 0, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 5,
        explanation: "Optimal response. Refusing the debit and reporting the fraudulent VPA protects the wider payments ecosystem.",
        outcomeType: "correct"
      }
    ]
  },
  {
    stageOrder: 5,
    title: "New Browser Sign-In Prompt",
    description: "A system dialog appears on your phone asking to verify a recent browser sign-in.",
    mockInterfaceType: "notification",
    mockInterfaceData: {
      title: "Google Account Security",
      body: "New sign-in on Chrome (Windows) from your current city. Device: Desktop Workstation. Time: Just now. Was this you?",
      dateString: "2:00 PM"
    },
    eventClassification: "legitimate",
    measurementFocus: ["FALSE_POSITIVE_CONTROL", "DECISION_QUALITY"],
    targetSignals: [],
    terminal: false,
    decisions: [
      {
        optionText: "Review device and location on screen, confirm \"Yes, it's me\"",
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 6,
        explanation: "Optimal. Confirming legitimate activity after checking the device details and local timestamp maintains account access smoothly.",
        outcomeType: "correct"
      },
      {
        optionText: "Panicked click on \"No, secure account\"",
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 6,
        explanation: "False positive reaction. Rejecting authentic sign-ins locks your own active sessions and triggers unnecessary password resets.",
        outcomeType: "false-positive"
      },
      {
        optionText: "Dismiss prompt without reviewing",
        scoreChange: 0,
        behaviorEffects: { decisionQuality: 1, falsePositive: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 6,
        explanation: "Neglecting authentication prompts leaves legitimate sign-ins unverified, creating potential security ambiguities.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 6,
    title: "Document Scanner Permissions",
    description: "You install a third-party mobile document scanner utility, and an Android permission sheet pops up.",
    mockInterfaceType: "browser",
    mockInterfaceData: {
      title: "QuickScan PDF Pro — Permissions",
      url: "android://com.quickscan.pdf/permissions",
      bodyText: "QuickScan PDF Pro requests the following permissions:\n• Camera (Capture documents)\n• Contacts (Read address book)\n• SMS (Read text messages)\n• Location (Precise GPS coordinates)"
    },
    eventClassification: "malicious",
    measurementFocus: ["VERIFICATION", "UNREVIEWED_ACCEPTANCE", "DECISION_QUALITY"],
    targetSignals: ["unusual_permission"],
    terminal: false,
    decisions: [
      {
        optionText: "Tap \"Allow All Permissions\" to proceed quickly",
        scoreChange: -20,
        behaviorEffects: { verification: 0, unreviewedAcceptance: 2, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 7,
        explanation: "High-risk unreviewed acceptance. Granting SMS and Contacts access to a camera tool exposes private data and OTPs.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Review requested permissions, allow Camera only, and deny Contacts, SMS, Location",
        scoreChange: 20,
        behaviorEffects: { verification: 2, unreviewedAcceptance: 0, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 7,
        explanation: "Optimal permission hygiene. Enforcing the principle of least privilege allows the app to function without compromising personal privacy.",
        outcomeType: "correct"
      },
      {
        optionText: "Cancel installation and remove the application",
        scoreChange: 10,
        behaviorEffects: { verification: 1, unreviewedAcceptance: 0, decisionQuality: 1 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 7,
        explanation: "Safe disengagement. Rejecting intrusive software is a solid defensive choice.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 7,
    title: "Telecom Disconnection Call",
    description: "Your phone rings with an automated IVR call claiming urgent government regulatory action.",
    mockInterfaceType: "phone_call",
    mockInterfaceData: {
      callerName: "Telecom Regulatory Alert",
      callerNumber: "+91 8000-TELECOM",
      bodyText: "\"This is an urgent automated alert from the Department of Telecommunications. Your primary mobile number is linked to 18 unauthorized SIM cards flagged in financial cybercrimes. All telecom services across your Aadhaar will be disconnected within 2 hours. Press 9 immediately to speak with the cybercrime verification officer.\""
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "VERIFICATION", "DECISION_QUALITY"],
    targetSignals: ["authority_impersonation", "urgency"],
    terminal: false,
    decisions: [
      {
        optionText: "Hang up and check connection status directly with telecom provider through official customer care",
        scoreChange: 20,
        behaviorEffects: { recognition: 2, verification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 8,
        explanation: "Optimal independent verification. TRAI and DoT never make automated disconnection calls; checking directly with your telecom provider verifies reality.",
        outcomeType: "correct"
      },
      {
        optionText: "Press 9 in panic to connect with the investigation desk",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, verification: 0, decisionQuality: 0 },
        riskLevel: "critical",
        isCriticalMistake: false,
        nextStageOrder: 9,
        explanation: "Unsafe compliance. Pressing 9 routes your call directly to organized cyber fraud operators impersonating law enforcement.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Hang up immediately and ignore the call without independent verification",
        scoreChange: 10,
        behaviorEffects: { recognition: 1, verification: 0, decisionQuality: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 8,
        explanation: "Cautious disengagement avoids immediate harm, though independently confirming your account standing provides complete assurance.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 8,
    title: "E-Commerce Order Dispatched",
    description: "You check your email in the late afternoon and see a shipping update for an item you ordered yesterday.",
    mockInterfaceType: "email",
    mockInterfaceData: {
      senderName: "Amazon.in Shipping Updates",
      senderEmail: "shipment-tracking@amazon.in",
      subject: "Your package has shipped: Noise Cancelling Earbuds",
      body: "Hi Rohan,\n\nGood news! Your order #402-9182301-81923 has shipped via BlueDart. Tracking Number: BD84920194.\n\nEstimated Delivery: Tomorrow by 8:00 PM.\nYou can track your delivery directly inside your Amazon account.",
      dateString: "5:00 PM"
    },
    eventClassification: "legitimate",
    measurementFocus: ["FALSE_POSITIVE_CONTROL", "DECISION_QUALITY"],
    targetSignals: [],
    terminal: false,
    decisions: [
      {
        optionText: "Review order status and delivery date normally",
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 10,
        explanation: "Optimal. This is a verified shipping confirmation originating from legitimate retail sender infrastructure.",
        outcomeType: "correct"
      },
      {
        optionText: "Report dispatch confirmation email as phishing attempt",
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 10,
        explanation: "False positive reaction. Reporting legitimate purchase dispatch emails as phishing disrupts genuine merchant communications.",
        outcomeType: "false-positive"
      },
      {
        optionText: "Archive email",
        scoreChange: 5,
        behaviorEffects: { decisionQuality: 1, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 10,
        explanation: "Acceptable inbox management, though reviewing delivery details is routine digital hygiene.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 9,
    title: "Digital Arrest Video Demand",
    description: "Having pressed 9 on the IVR call, you are connected to a high-pressure Skype video session.",
    mockInterfaceType: "chat",
    mockInterfaceData: {
      sender: "Cyber Investigation Cell — New Delhi",
      body: "Officer Sharma on screen in uniform with police emblems: \"A non-bailable arrest warrant has been issued under PMLA Section 45 against your identity. To avoid physical detention and remand, you must deposit ₹25,000 as a refundable security clearance bond into the Supreme Court escrow account immediately.\"",
      dateString: "5:00 PM"
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "VERIFICATION", "DECISION_QUALITY"],
    targetSignals: ["authority_impersonation", "unexpected_payment_request"],
    terminal: false,
    decisions: [
      {
        optionText: "Disconnect call immediately and report the incident via official cybercrime channels",
        scoreChange: 20,
        behaviorEffects: { recognition: 2, verification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 10,
        explanation: "Decisive recovery. Indian law enforcement and courts never conduct 'digital arrest' or demand financial security bonds over video calls.",
        outcomeType: "correct"
      },
      {
        optionText: "Transfer ₹25,000 security deposit to the provided clearance account",
        scoreChange: -30,
        behaviorEffects: { recognition: 0, verification: 0, decisionQuality: 0 },
        riskLevel: "critical",
        isCriticalMistake: true,
        nextStageOrder: 10,
        explanation: "Extorted. Real police officers never accept funds, bonds, or clearance payments via electronic transfer.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Ask for written notice by official mail while keeping caller on hold",
        scoreChange: 5,
        behaviorEffects: { recognition: 1, verification: 1, decisionQuality: 1 },
        riskLevel: "medium-risk",
        isCriticalMistake: false,
        nextStageOrder: 10,
        explanation: "Partial resistance, but remaining engaged on the line allows extortionists to escalate intimidation and threats.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 10,
    title: "Cafe Counter QR Sticker",
    description: "While paying for an evening snack at a local cafe, you scan the countertop payment stand with your UPI app.",
    mockInterfaceType: "checkout",
    mockInterfaceData: {
      merchantName: "Cafe QuickPay (quickpay-terminal09@axis)",
      amount: "180.00",
      warningText: "Notice: The paper sticker on the counter stand looks freshly glued and slightly misaligned over the store's original metal plaque."
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "SIGNAL_IDENTIFICATION", "VERIFICATION", "UNREVIEWED_ACCEPTANCE", "DECISION_QUALITY"],
    targetSignals: ["mismatched_branding", "unexpected_payment_request"],
    terminal: false,
    decisions: [
      {
        optionText: "Enter amount and pay without reviewing merchant name",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, signalIdentification: 0, verification: 0, unreviewedAcceptance: 2, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 11,
        explanation: "Unsafe unreviewed acceptance. Tampered QR stickers redirect payments to fraudster bank accounts instead of the merchant.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Notice merchant name mismatch on payment screen, pause payment, and alert staff",
        scoreChange: 20,
        identifiedSignals: ["mismatched_branding", "unexpected_payment_request"],
        behaviorEffects: { recognition: 2, signalIdentification: 2, verification: 2, unreviewedAcceptance: 0, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 11,
        explanation: "Outstanding physical and digital verification. Checking the merchant name on your UPI screen before authorizing payments thwarts QR code tampering.",
        outcomeType: "correct"
      },
      {
        optionText: "Pay with cash instead without reporting",
        scoreChange: 5,
        identifiedSignals: ["mismatched_branding"],
        behaviorEffects: { recognition: 1, signalIdentification: 1, verification: 0, unreviewedAcceptance: 0, decisionQuality: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 11,
        explanation: "Cautious personal protection, though alerting the shopkeeper prevents other customers from being defrauded.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 11,
    title: "Streaming Auto-Renewal",
    description: "An email notification arrives claiming an unexpected charge for an annual streaming subscription.",
    mockInterfaceType: "email",
    mockInterfaceData: {
      senderName: "Streaming Services Billing",
      senderEmail: "billing-support@stream-premium-renew.com",
      subject: "Invoice Paid: ₹3,999 Annual 4K Membership Renewal",
      body: "Thank you for renewing your Ultra HD 4K Annual Plan. A charge of ₹3,999 has been scheduled on your default card within 24 hours.\n\nIf you did not authorize this charge or wish to cancel your subscription immediately, click the cancellation link below:\n\n[Cancel Subscription & Request Refund]",
      dateString: "7:30 PM"
    },
    eventClassification: "malicious",
    measurementFocus: ["THREAT_RECOGNITION", "SIGNAL_IDENTIFICATION", "VERIFICATION", "DECISION_QUALITY"],
    targetSignals: ["unexpected_domain", "urgency"],
    terminal: false,
    decisions: [
      {
        optionText: "Click \"Cancel Subscription\" link in the email",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 12,
        explanation: "Unsafe. The email uses artificial urgency and an unofficial sender domain (stream-premium-renew.com) to drive you to a credential-harvesting clone.",
        outcomeType: "incorrect"
      },
      {
        optionText: "Spot fake sender domain and verify subscription status inside official app",
        scoreChange: 20,
        identifiedSignals: ["unexpected_domain", "urgency"],
        behaviorEffects: { recognition: 2, signalIdentification: 2, verification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 12,
        explanation: "Optimal verification habit. Never click renewal cancellation links inside emails; always verify subscription billing directly inside your official app account.",
        outcomeType: "correct"
      },
      {
        optionText: "Delete email without checking account status",
        scoreChange: 5,
        identifiedSignals: ["urgency"],
        behaviorEffects: { recognition: 1, signalIdentification: 1, verification: 0, decisionQuality: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 12,
        explanation: "Cautious avoidance avoids the phishing site, though verifying your genuine subscription ensures you have no unexpected recurring debits.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 12,
    title: "Friend's Emergency Medical Transfer",
    description: "You receive a late-evening WhatsApp message from a close friend's profile requesting immediate funds.",
    mockInterfaceType: "messaging",
    mockInterfaceData: {
      sender: "Aakash (College Friend)",
      body: "Hey, are you free? I'm in a clinic with an urgent family emergency and my UPI daily limit is maxed out. Can you please send ₹4,000 to doctor-deposit@axl? I will transfer it back to you first thing tomorrow morning.",
      dateString: "8:45 PM"
    },
    eventClassification: "ambiguous",
    measurementFocus: ["THREAT_RECOGNITION", "VERIFICATION", "DECISION_QUALITY"],
    targetSignals: ["urgency", "unusual_contact_method"],
    terminal: false,
    decisions: [
      {
        optionText: "Send ₹4,000 immediately without verifying",
        scoreChange: -20,
        behaviorEffects: { recognition: 0, verification: 0, decisionQuality: 0 },
        riskLevel: "high-risk",
        isCriticalMistake: false,
        nextStageOrder: 13,
        explanation: "Unsafe. Account takeovers on WhatsApp frequently exploit social trust and urgency to extort emergency funds from contacts.",
        outcomeType: "unsafe-action"
      },
      {
        optionText: "Contact friend through an independent trusted channel, such as their normal cellular phone number",
        scoreChange: 20,
        behaviorEffects: { recognition: 2, verification: 2, decisionQuality: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 13,
        explanation: "Strong independent verification. Calling your friend on their normal cellular line outside the messaging app immediately confirms whether their account was compromised.",
        outcomeType: "correct"
      },
      {
        optionText: "Request additional confirmation or specific shared personal detail within the same chat",
        scoreChange: 10,
        behaviorEffects: { recognition: 1, verification: 1, decisionQuality: 1 },
        riskLevel: "medium-risk",
        isCriticalMistake: false,
        nextStageOrder: 13,
        explanation: "Partial verification. Asking a personal question in the chat adds some verification, but an attacker who has read previous message history may still answer convincingly.",
        outcomeType: "neutral"
      },
      {
        optionText: "Decline the transfer citing personal balance limits without verifying",
        scoreChange: 5,
        behaviorEffects: { recognition: 1, verification: 0, decisionQuality: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 13,
        explanation: "Cautious avoidance avoids financial loss, though it misses the opportunity to establish truth if your friend genuinely needed help or their account was hacked.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 13,
    title: "OS Critical Patch Notification",
    description: "As you wind down for the night, an official system update prompt appears on your device.",
    mockInterfaceType: "notification",
    mockInterfaceData: {
      title: "Android System Security Update",
      body: "Security Patch Level: September 2026. Fixes critical kernel vulnerabilities and enhances Bluetooth encryption. Tap to restart and apply now.",
      dateString: "9:30 PM"
    },
    eventClassification: "legitimate",
    measurementFocus: ["FALSE_POSITIVE_CONTROL", "DECISION_QUALITY"],
    targetSignals: [],
    terminal: false,
    decisions: [
      {
        optionText: "Schedule or install official security update",
        scoreChange: 10,
        behaviorEffects: { decisionQuality: 2, falsePositive: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 14,
        explanation: "Optimal. Promptly installing authentic operating system security patches closes zero-day vulnerabilities.",
        outcomeType: "correct"
      },
      {
        optionText: "Block update service as potential spyware",
        scoreChange: -10,
        behaviorEffects: { decisionQuality: 0, falsePositive: 2 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: 14,
        explanation: "False positive reaction. Disabling core system updates leaves your device vulnerable to known exploits.",
        outcomeType: "false-positive"
      },
      {
        optionText: "Postpone update indefinitely",
        scoreChange: 0,
        behaviorEffects: { decisionQuality: 1, falsePositive: 1 },
        riskLevel: "low-risk",
        isCriticalMistake: false,
        nextStageOrder: 14,
        explanation: "Neglecting essential security patches leaves known security holes unpatched on your device.",
        outcomeType: "neutral"
      }
    ]
  },
  {
    stageOrder: 14,
    title: "Evening Closure",
    description: "Your digital day is complete. You have navigated routine communications, alerts, and interactions from morning to night.",
    mockInterfaceType: "website",
    mockInterfaceData: {
      title: "Your Digital Day: Daily Wrap-Up",
      url: "https://cyberlawportal.in/day-complete",
      bodyText: "You have reached the end of your day. Every choice you made — what you noticed, where you verified, what you accepted, and where you hesitated — offers valuable insight into your everyday cybersecurity habits."
    },
    eventClassification: "legitimate",
    measurementFocus: [],
    targetSignals: [],
    terminal: true,
    decisions: [
      {
        optionText: "View Your Digital Habits Breakdown",
        scoreChange: 0,
        behaviorEffects: { recognition: 0, signalIdentification: 0, verification: 0, decisionQuality: 0, falsePositive: 0, unreviewedAcceptance: 0 },
        riskLevel: "safe",
        isCriticalMistake: false,
        nextStageOrder: null,
        explanation: "Transitioning to your personalized behavioral reveal.",
        outcomeType: "correct"
      }
    ]
  }
];

const finalScenarioV2 = {
  scenario: {
    title: "Your Digital Day: Final Branching Assessment",
    slug: "final",
    code: "final",
    description: "Experience a full 13-stage day in your digital life, navigating realistic communications, payments, and system prompts from morning to night. Your decisions reveal your intuitive security habits.",
    version: 2,
    assessmentType: "final",
    status: "published",
    type: "mixed",
    domain: "WEB",
    difficulty: "Intermediate",
    estimatedDuration: 10,
    active: true,
    learningObjectives: [
      "Navigate ordinary digital communications safely",
      "Recognize contextual warning signs without absolute rules",
      "Perform independent verification through trusted external channels",
      "Differentiate between legitimate notifications and deceptive lures"
    ],
    configuredWeights: {
      "Phishing awareness": 25,
      "Social engineering": 25,
      "URL verification": 25,
      "Credential safety": 25
    }
  },
  stages: stages13Data
};

const baselineScenarioV2 = {
  scenario: {
    title: "Your Digital Day: Baseline Assessment",
    slug: "baseline",
    code: "baseline",
    description: "Experience everyday digital situations from morning to night to establish your default cybersecurity habits before beginning training modules.",
    version: 2,
    assessmentType: "baseline",
    status: "published",
    type: "mixed",
    domain: "WEB",
    difficulty: "Intermediate",
    estimatedDuration: 10,
    active: true,
    learningObjectives: [
      "Establish initial behavioral metrics across everyday digital decisions",
      "Observe initial threat recognition and verification habits",
      "Identify false positive and autopilot tendencies before training"
    ],
    configuredWeights: {
      "Phishing awareness": 25,
      "Social engineering": 25,
      "URL verification": 25,
      "Credential safety": 25
    }
  },
  stages: stages13Data
};

// Read current scenarios.json
const scenariosJsonPath = path.join(__dirname, 'scenarios.json');
let currentScenarios = JSON.parse(fs.readFileSync(scenariosJsonPath, 'utf8'));

// Filter out any existing version 2 records if already present, to ensure idempotency
currentScenarios = currentScenarios.filter(s => !(s.scenario.version === 2 && (s.scenario.slug === 'final' || s.scenario.slug === 'baseline')));

// Append the v2 scenarios
currentScenarios.push(baselineScenarioV2);
currentScenarios.push(finalScenarioV2);

fs.writeFileSync(scenariosJsonPath, JSON.stringify(currentScenarios, null, 2), 'utf8');
console.log(`Successfully updated scenarios.json with baseline v2 and final v2 (${stages13Data.length} stages each)! Total scenarios in file: ${currentScenarios.length}`);
