/**
 * Authoritative Remediation Catalog
 * Phase 3: Targeted Remediation & Micro-Learning Pathways
 * Phase 4 Extension: Curated Learning Checkpoints
 *
 * NON-NEGOTIABLE ARCHITECTURAL PRINCIPLES:
 * 1. A behavioral metric is NOT a statutory offence.
 * 2. Legal references are optional. Pure cyber-safety pathways (DQ, FP) have empty legalReferences.
 * 3. Never represent DPDP Act Section 6 as currently in force as of 9 September 2026.
 * 4. Section 43A (corporate liability) and Section 72A are excluded from individual habit remediation.
 * 5. Every content slug must match seeded MongoDB database records.
 * 6. Checkpoints test practical habits authoritatively on the server; passingScore is enforced server-side.
 */

const remediationCatalog = [
  // 1. UNREVIEWED ACCEPTANCE (UA)
  {
    pathwayId: 'pathway-ua-upi-consent',
    metricKey: 'unreviewedAcceptance',
    habitTitle: 'Autopilot Control & UPI PIN Safety',
    pedagogicalFocus: 'Eliminating reflexive approvals, auditing device permissions, and mastering UPI transaction mechanics.',
    coreRule: 'A UPI PIN is entered ONLY to SEND money, NEVER to receive funds, cashback, or refunds.',
    difficulty: 'Essential',
    estimatedMinutes: 3,
    crimeSlug: 'payment-app-scams',
    caseStudySlug: 'classified-marketplace-qr-fraud',
    preventionAnchor: '#payments',
    primaryLawSectionNumber: 'Section 66C',
    legalReferences: [
      {
        act: 'Information Technology Act, 2000',
        section: 'Section 66C',
        officialTitle: 'Punishment for identity theft',
        status: 'IN_FORCE',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes the perpetrator who fraudulently captures or utilizes another person’s electronic signature, password, or UPI authentication credentials.',
        educationalContext: 'Section 66C of the IT Act addresses fraudulent use of electronic passwords and unique identification features, imposing up to three years imprisonment for perpetrators who steal payment credentials.'
      },
      {
        act: 'Digital Personal Data Protection Act, 2023',
        section: 'Section 6',
        officialTitle: 'Consent',
        status: 'ENACTED_FUTURE_COMMENCEMENT',
        commencementNote: 'Enacted August 2023; Notification S.O. 4932(E) dated 13 Nov 2025 appoints commencement after 18 months (May 2027). Not in force as of 9 September 2026.',
        relationshipType: 'CONTEXTUAL',
        attribution: 'Imposes statutory obligations upon the Data Fiduciary (the service provider) to request only specific, informed, and necessary consent.',
        educationalContext: 'Section 6 of the DPDP Act establishes the upcoming legislative standard requiring service providers to seek clear, informed consent. Understanding this principle helps users identify when applications request access beyond legitimate service needs.'
      }
    ],
    actionLabel: 'Review UPI Scam Case Study',
    actionRoute: '/cases?slug=classified-marketplace-qr-fraud',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-ua-1',
          questionText: 'When receiving money or a cashback reward via UPI, when should you enter your UPI PIN?',
          options: [
            'Only after verifying the sender mobile number.',
            'Never; a UPI PIN is only entered to send money or check balance, never to receive funds.',
            'Whenever the UPI app displays a green cashback voucher banner.',
            'Only if the transaction amount exceeds Rs. 2,000.'
          ],
          correctOptionIndex: 1,
          explanation: 'A UPI PIN is an authorization credential to debit funds from your account. You NEVER enter your PIN to receive money or cashback.'
        },
        {
          questionId: 'chk-ua-2',
          questionText: 'You receive a pop-up requesting access to SMS, Contacts, and Accessibility services for a simple flashlight app. What is the safest response?',
          options: [
            'Approve all permissions because Android sandbox protects sensitive data.',
            'Deny broad permissions and uninstall the application immediately.',
            'Approve permissions temporarily and revoke them in settings later.',
            'Turn on Airplane Mode before granting the requested permissions.'
          ],
          correctOptionIndex: 1,
          explanation: 'A flashlight utility has no legitimate operational need for SMS or accessibility services. Over-granting permissions creates an autopilot vulnerability.'
        },
        {
          questionId: 'chk-ua-3',
          questionText: 'Under Indian cyber jurisprudence, why does Section 66C of the IT Act penalize someone who steals another person\'s UPI authentication PIN?',
          options: [
            'Because it is classified as theft of electronic signature or password/identification credentials.',
            'Because UPI PINs are regulated under corporate data fiduciary compliance.',
            'Because entering a PIN constitutes an irrevocable digital arrest warrant.',
            'Because Section 66C regulates telecommunication frequency allocations.'
          ],
          correctOptionIndex: 0,
          explanation: 'Section 66C of the IT Act criminalizes identity theft, which explicitly covers fraudulently using another person’s unique identification password, PIN, or electronic signature.'
        }
      ]
    }
  },

  // 2. VERIFICATION BEHAVIOUR (VB)
  {
    pathwayId: 'pathway-vb-out-of-band',
    metricKey: 'verification',
    habitTitle: 'Independent Out-of-Band Verification',
    pedagogicalFocus: 'Replacing in-channel questioning with independent secondary-channel verification during urgent or coercive contacts.',
    coreRule: 'Never verify an authority using the contact information they provide. Disconnect and call official numbers found through an independent directory.',
    difficulty: 'Intermediate',
    estimatedMinutes: 4,
    crimeSlug: 'online-impersonation',
    caseStudySlug: 'digital-arrest-impersonation',
    preventionAnchor: '#reporting',
    primaryLawSectionNumber: 'Section 66D',
    legalReferences: [
      {
        act: 'Information Technology Act, 2000',
        section: 'Section 66D',
        officialTitle: 'Punishment for cheating by personation by using computer resource',
        status: 'IN_FORCE',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes perpetrators who fraudulently impersonate police, CBI, or judicial officers over computer resources.',
        educationalContext: 'Section 66D of the IT Act penalizes cheating by personation using any computer resource or communication device with up to three years imprisonment.'
      },
      {
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 308(2)',
        officialTitle: 'Extortion',
        status: 'IN_FORCE',
        commencementNote: 'In force w.e.f. 1 July 2024, replacing Section 384 of the Indian Penal Code.',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes coercing victims by putting them in fear of injury or arrest to force immediate financial transfers.',
        educationalContext: 'Section 308(2) of the BNS penalizes extortion through fear of arrest, directly addressing the intimidation tactics used in digital arrest schemes.'
      },
      {
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 319',
        officialTitle: 'Cheating by personation',
        status: 'IN_FORCE',
        commencementNote: 'In force w.e.f. 1 July 2024, replacing Section 419 of the Indian Penal Code.',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes pretending to be someone else or representing that one is an authorized government official.',
        educationalContext: 'Section 319 of the BNS criminalizes cheating by pretending to be someone else or representing that one is an official whom one is not.'
      }
    ],
    actionLabel: 'Explore Digital Arrest Breakdown',
    actionRoute: '/cases?slug=digital-arrest-impersonation',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-vb-1',
          questionText: 'A caller claiming to be a police officer or customs inspector contacts you over video call and demands you remain on the line to avoid arrest. What is the authoritative Out-of-Band verification protocol?',
          options: [
            'Ask the caller to state their police badge number and show their ID card to the camera.',
            'Immediately disconnect, look up the official agency landline number from their verified government portal, and call them independently.',
            'Transfer nominal surety funds to the official bank account they dictate over the phone.',
            'Switch to an encrypted messaging platform to confirm the officer\'s identity.'
          ],
          correctOptionIndex: 1,
          explanation: 'Never verify an authority using the channel they control. Always disconnect and verify independently through official published government contact directories.'
        },
        {
          questionId: 'chk-vb-2',
          questionText: 'Under Indian criminal law, which provision of the Bharatiya Nyaya Sanhita (BNS) penalizes putting a person in fear of arrest to coerce money transfers?',
          options: [
            'BNS Section 308(2) (Extortion).',
            'BNS Section 101 (Murder).',
            'BNS Section 281 (Rash driving).',
            'BNS Section 351 (Criminal trespass).'
          ],
          correctOptionIndex: 0,
          explanation: 'Coercing a victim by placing them in fear of injury, arrest, or detention to force financial transfers constitutes Extortion under Section 308(2) of the BNS.'
        },
        {
          questionId: 'chk-vb-3',
          questionText: 'If you receive an urgent email from your bank asking you to call a \'Direct Security Helpline\' phone number printed in the email, how should you verify it?',
          options: [
            'Call the number in the email but ask for the agent\'s employee badge ID.',
            'Discard the number in the email and dial the verified customer care number printed on the back of your physical debit card.',
            'Reply to the email asking the sender to confirm their official email address.',
            'Search the phone number on social media to see if anyone reported it.'
          ],
          correctOptionIndex: 1,
          explanation: 'Scammers print fake helpline numbers in phishing alerts. The trusted out-of-band channel is the customer service number embossed on your actual bank card.'
        }
      ]
    }
  },

  // 3. THREAT RECOGNITION (TR)
  {
    pathwayId: 'pathway-tr-lure-detection',
    metricKey: 'recognition',
    habitTitle: 'Threat Lure Spotting in Routine Contacts',
    pedagogicalFocus: 'Spotting disguised malicious stimuli in delivery notifications, salary alerts, and account warnings.',
    coreRule: 'Inspect unexpected urgency cues and delivery failures directly on official courier portals, never via SMS links.',
    difficulty: 'Beginner',
    estimatedMinutes: 3,
    crimeSlug: 'phishing',
    caseStudySlug: 'phishing-credential-takeover',
    preventionAnchor: '#browsing',
    primaryLawSectionNumber: 'Section 66D',
    legalReferences: [
      {
        act: 'Information Technology Act, 2000',
        section: 'Section 66D',
        officialTitle: 'Punishment for cheating by personation by using computer resource',
        status: 'IN_FORCE',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes threat actors who spoof brand names or courier delivery services using computer resources.',
        educationalContext: 'Section 66D of the IT Act penalizes creating fake web portals or fraudulent communication handles to deceive victims.'
      }
    ],
    actionLabel: 'Inspect Phishing Case File',
    actionRoute: '/cases?slug=phishing-credential-takeover',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-tr-1',
          questionText: 'You receive an SMS stating: "Your parcel delivery failed due to incorrect address. Update details within 2 hours at bit.ly/del-track to avoid return." What is the primary deception marker?',
          options: [
            'The message mentions parcel delivery.',
            'Artificial extreme urgency combined with a shortened/generic tracking link instead of an official courier domain.',
            'The message was sent in English rather than the regional language.',
            'The delivery fee is quoted in Indian Rupees.'
          ],
          correctOptionIndex: 1,
          explanation: 'Scammers fabricate extreme time urgency (e.g. 2 hours) paired with obfuscated or lookalike URLs to bypass critical thinking.'
        },
        {
          questionId: 'chk-tr-2',
          questionText: 'What is the safest way to check the status of an expected courier parcel after receiving an unexpected SMS alert?',
          options: [
            'Click the SMS link and type a test tracking number.',
            'Open a browser independently and enter the tracking number directly on the official courier portal or shopping app where you placed the order.',
            'Forward the SMS to five friends to check if they received it.',
            'Call the mobile number from which the SMS originated.'
          ],
          correctOptionIndex: 1,
          explanation: 'Always inspect delivery progress directly inside your original e-commerce application or official courier website.'
        },
        {
          questionId: 'chk-tr-3',
          questionText: 'Which section of the Information Technology Act penalizes impersonating brand names or logistics providers over computer resources to cheat users?',
          options: [
            'Section 66D (Cheating by personation by using computer resource).',
            'Section 43A (Corporate sensitive personal data compliance).',
            'Section 72A (Intermediary contractual breach).',
            'Section 85 (Offences by companies).'
          ],
          correctOptionIndex: 0,
          explanation: 'Section 66D of the IT Act specifically punishes cheating by personation using any computer resource with imprisonment up to three years.'
        }
      ]
    }
  },

  // 4. SIGNAL IDENTIFICATION (SI)
  {
    pathwayId: 'pathway-si-syntax-analysis',
    metricKey: 'signalIdentification',
    habitTitle: 'Technical Signal & Domain Inspection',
    pedagogicalFocus: 'Identifying deception markers: lookalike sender domains, mismatched VPAs, and advance-fee task lures.',
    coreRule: 'Inspect root domains in the address bar before entering details. Legitimate employers never charge advance task or registration fees.',
    difficulty: 'Intermediate',
    estimatedMinutes: 4,
    crimeSlug: 'fake-job-scams',
    caseStudySlug: 'fake-job-offer-scam',
    preventionAnchor: '#browsing',
    primaryLawSectionNumber: 'BNS Section 318',
    legalReferences: [
      {
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 318(4)',
        officialTitle: 'Cheating and dishonestly inducing delivery of property',
        status: 'IN_FORCE',
        commencementNote: 'In force w.e.f. 1 July 2024, replacing Section 420 of the Indian Penal Code.',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes the fraudster who deceives job seekers with fake employment tasks to induce payment of advance deposits.',
        educationalContext: 'Under Section 318(4) of the BNS, deceiving any person to dishonestly induce the delivery of money carries imprisonment up to seven years and fines.'
      },
      {
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 319',
        officialTitle: 'Cheating by personation',
        status: 'IN_FORCE',
        commencementNote: 'In force w.e.f. 1 July 2024, replacing Section 419 of the Indian Penal Code.',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes representing oneself as an authorized corporate recruitment agency.',
        educationalContext: 'Section 319 of the BNS addresses cheating by pretending to be a representative of an organization that one does not represent.'
      }
    ],
    actionLabel: 'Review Fake Recruitment Tactics',
    actionRoute: '/cases?slug=fake-job-offer-scam',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-si-1',
          questionText: 'You are evaluating an email from a job recruiter claiming to represent the Government National Informatics Centre. Which sender address is an authentic government domain?',
          options: [
            'recruitment@nic-gov-india.org',
            'careers@nic.gov.in',
            'hr-officer@nic.in-verification.com',
            'nic-desk@gov-careers.net'
          ],
          correctOptionIndex: 1,
          explanation: 'Official Indian government agencies operate under the reserved top-level domain .gov.in. Subdomains like nic-gov-india.org are third-party lookalikes.'
        },
        {
          questionId: 'chk-si-2',
          questionText: 'A prospective freelance employer sends you an online offer letter and asks you to pay an advance "refundable security deposit" of Rs. 1,500 for equipment dispatch. What does this signal?',
          options: [
            'Standard corporate onboarding procedure for remote workers.',
            'A classic advance-fee task/job scam where deposits are stolen and no genuine work exists.',
            'A statutory requirement under the Companies Act 2013.',
            'An RBI-mandated escrow deposit for freelance independent contractors.'
          ],
          correctOptionIndex: 1,
          explanation: 'Legitimate employers never charge candidates registration fees, task security deposits, or software fees during recruitment.'
        },
        {
          questionId: 'chk-si-3',
          questionText: 'Under Bharatiya Nyaya Sanhita (BNS) Section 318(4), what conduct in fake employment schemes constitutes cheating?',
          options: [
            'Rejecting an unqualified candidate during a formal interview.',
            'Dishonestly inducing a person to deliver property (advance fee) by deception.',
            'Negotiating remote salary packages below industry averages.',
            'Posting employment listings on multiple job aggregator boards.'
          ],
          correctOptionIndex: 1,
          explanation: 'Section 318(4) of the BNS penalizes dishonestly inducing any person to deliver property or money by deceptive promises.'
        }
      ]
    }
  },

  // 5. DECISION QUALITY (DQ) — PURE CYBER-SAFETY (NO STATUTE FORCED)
  {
    pathwayId: 'pathway-dq-digital-hygiene',
    metricKey: 'decisionQuality',
    habitTitle: 'Daily Digital Prudence & System Hygiene',
    pedagogicalFocus: 'Establishing deliberate pause habits before executing system updates, installing utilities, or scanning physical QR codes.',
    coreRule: 'Never scan a table QR code to receive money, and schedule OS updates only through official system settings.',
    difficulty: 'Essential',
    estimatedMinutes: 3,
    crimeSlug: 'malware',
    caseStudySlug: 'restaurant-qr-code-scam',
    preventionAnchor: '#browsing',
    primaryLawSectionNumber: null, // Intentionally null; pure practical hygiene
    legalReferences: [],           // Intentionally empty; no forced statute
    actionLabel: 'Explore QR & Hygiene Case Study',
    actionRoute: '/cases?slug=restaurant-qr-code-scam',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-dq-1',
          questionText: 'While seated at a restaurant, you notice a QR code sticker pasted on the dining table claiming "Scan here to win 50% cashback on your bill". How should you handle this QR code?',
          options: [
            'Scan it immediately because it is physically affixed to the table.',
            'Do not scan unverified promotional stickers; verify payment details directly with the restaurant manager.',
            'Scan it and approve any transaction request under Rs. 100.',
            'Scan it using a secondary camera app that ignores hyperlinks.'
          ],
          correctOptionIndex: 1,
          explanation: 'Physical tampering (QR sticker overlay) is common in public venues. Only scan official bill payment QR codes verified with staff.'
        },
        {
          questionId: 'chk-dq-2',
          questionText: 'A web browser pop-up claims "Your computer is infected with 7 Trojans! Click here to run Free Antivirus Cleanup Utility". What is the prudent course of action?',
          options: [
            'Click the button to let the cloud scanner remove the infected files.',
            'Close the browser tab immediately and run a scan through your operating system\'s built-in security software.',
            'Download the file and save it to an external USB drive first.',
            'Enter your administrative password to grant the installer cleanup privileges.'
          ],
          correctOptionIndex: 1,
          explanation: 'Browser pop-ups claiming malware infections are scareware lures designed to trick users into downloading malicious software.'
        },
        {
          questionId: 'chk-dq-3',
          questionText: 'Why is software sideloading from random file-sharing websites risky compared to official application stores?',
          options: [
            'Sideloaded APKs bypass cryptographic signing and repository security vetting, potentially bundling malware.',
            'Sideloading requires paying international currency exchange taxes.',
            'Application stores are legally prohibited in India.',
            'Third-party websites only host open-source firmware.'
          ],
          correctOptionIndex: 0,
          explanation: 'Official app stores vet binaries for known malware and policy violations. Sideloading untrusted utilities exposes the device to credential stealers.'
        }
      ]
    }
  },

  // 6. FALSE POSITIVE CONTROL (FP) — PURE CYBER-SAFETY (NO STATUTE FORCED)
  {
    pathwayId: 'pathway-fp-evidence-triage',
    metricKey: 'falsePositive',
    habitTitle: 'Evidence-Based Alert Triage',
    pedagogicalFocus: 'Distinguishing standard automated receipts from deceptive urgency traps to prevent alarm fatigue and unnecessary disruption.',
    coreRule: 'Legitimate services inform you of completed account activities without requesting credentials. Do not block legitimate alerts prematurely.',
    difficulty: 'Intermediate',
    estimatedMinutes: 3,
    crimeSlug: 'identity-theft',
    caseStudySlug: 'fake-support-call-fraud',
    preventionAnchor: '#evidence',
    primaryLawSectionNumber: null, // Intentionally null; Section 72A removed
    legalReferences: [],           // Intentionally empty; pure alert triage
    actionLabel: 'Learn Alert Triage Rules',
    actionRoute: '/prevention#evidence',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-fp-1',
          questionText: 'You receive an automated SMS from your bank: "Acct XX1234 debited INR 500 at Supermarket POS on 08-Sep. Avail Bal INR 12,400. If not you, SMS BLOCK to 56767." There is no link, no request for credentials, and you did make this purchase. What should you do?',
          options: [
            'Block all bank accounts and report fraudulent debit to cyber police.',
            'Recognize this as a routine transactional confirmation and take no disruptive action.',
            'Immediately reply with your ATM PIN to verify account authenticity.',
            'Call emergency 1930 to file a financial cyber fraud complaint.'
          ],
          correctOptionIndex: 1,
          explanation: 'Legitimate automated bank transaction receipts inform you of authorized activity without asking for PINs or clicking suspicious links. Over-reporting creates alert fatigue.'
        },
        {
          questionId: 'chk-fp-2',
          questionText: 'What is the key difference between a legitimate security alert and a deceptive phishing lure?',
          options: [
            'Phishing lures are always written with obvious spelling mistakes.',
            'Legitimate alerts provide verifiable facts without coercive threats; phishing lures manufacture panic and demand urgent credential/money input.',
            'Legitimate alerts always ask you to click a link to cancel a transaction.',
            'Phishing alerts only come through postal mail.'
          ],
          correctOptionIndex: 1,
          explanation: 'Threat actors use manufactured urgency and coercive deadlines to bypass scrutiny. Legitimate notifications inform without coercing immediate credential input.'
        },
        {
          questionId: 'chk-fp-3',
          questionText: 'If you are unsure whether a critical account notification is real or fake, what is the best evidence-based triage approach?',
          options: [
            'Panic and post the alert across social media handles.',
            'Check your official banking application transaction history independently before raising an alarm.',
            'Click the alert link in private browsing mode to see where it leads.',
            'Ignore all communications from banks permanently.'
          ],
          correctOptionIndex: 1,
          explanation: 'Cross-referencing claims against your official bank app\'s verified passbook/statement provides objective proof without exposing credentials.'
        }
      ]
    }
  },

  // 7. MAINTENANCE / ADVANCED REINFORCEMENT
  {
    pathwayId: 'pathway-maintenance-reinforcement',
    metricKey: 'reinforcement',
    habitTitle: 'Advanced Defense & Secondary Channel Hardening',
    pedagogicalFocus: 'Maintaining high digital vigilance across complex threats including SIM swapping and biometric exploits.',
    coreRule: 'When basic habits are solid, protect secondary channels: lock biometric authentication via mAadhaar and enable SIM PINs.',
    difficulty: 'Advanced',
    estimatedMinutes: 4,
    crimeSlug: 'sim-swapping',
    caseStudySlug: 'sim-swap-compromise',
    preventionAnchor: '#passwords',
    primaryLawSectionNumber: 'Section 66C',
    legalReferences: [
      {
        act: 'Information Technology Act, 2000',
        section: 'Section 66C',
        officialTitle: 'Punishment for identity theft',
        status: 'IN_FORCE',
        relationshipType: 'DIRECT',
        attribution: 'Penalizes fraudsters who duplicate or misuse unique electronic identification features to hijack subscriber accounts.',
        educationalContext: 'Section 66C of the IT Act addresses identity theft, protecting subscriber authentication features including SIM card identities and biometric records.'
      }
    ],
    actionLabel: 'Explore SIM Swap Defense',
    actionRoute: '/cases?slug=sim-swap-compromise',
    checkpoint: {
      passingScore: 67,
      questions: [
        {
          questionId: 'chk-maint-1',
          questionText: 'What is the primary risk of a SIM Swap attack against an individual\'s digital security?',
          options: [
            'The threat actor physically steals your smartphone from your pocket.',
            'The threat actor convinces the telecom provider to port your mobile number to their SIM card, intercepting your SMS OTPs and two-factor codes.',
            'The threat actor changes your phone\'s screen wallpaper.',
            'The threat actor disables your home Wi-Fi router.'
          ],
          correctOptionIndex: 1,
          explanation: 'SIM swapping redirects SMS OTPs to the attacker\'s SIM, enabling them to hijack banking and email accounts that rely on SMS-based 2FA.'
        },
        {
          questionId: 'chk-maint-2',
          questionText: 'Which defensive action provides the strongest secondary channel protection for your Aadhaar biometric data against unauthorized authentication?',
          options: [
            'Locking your biometrics via the official mAadhaar application or UIDAI portal.',
            'Laminating your physical Aadhaar PVC card with tamper-evident tape.',
            'Sharing your Aadhaar number only over SMS.',
            'Printing your biometric fingerprints on paper receipts.'
          ],
          correctOptionIndex: 0,
          explanation: 'Locking biometrics through UIDAI/mAadhaar prevents anyone (including banking agents or fraudsters) from executing biometric authentication until you temporarily unlock it.'
        },
        {
          questionId: 'chk-maint-3',
          questionText: 'Under Section 66C of the Information Technology Act, what penalty applies to fraudsters who steal or duplicate unique electronic identification credentials (such as biometric data or digital signatures)?',
          options: [
            'Imprisonment of up to three years and fine.',
            'Community service for 24 hours.',
            'Mandatory revocation of passport only.',
            'No penal consequences under civil cyber law.'
          ],
          correctOptionIndex: 0,
          explanation: 'Section 66C of the IT Act penalizes identity theft using electronic signatures, passwords, or unique identification features with imprisonment up to three years and fines.'
        }
      ]
    }
  }
];

module.exports = remediationCatalog;
