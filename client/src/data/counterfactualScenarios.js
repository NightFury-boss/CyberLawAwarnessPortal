/**
 * @file counterfactualScenarios.js
 * @description Authoritative declarative data fixtures for Stage 3: Counterfactual Scenario Learning.
 * 
 * Provides four self-contained, educational "What If?" simulation fixtures illustrating
 * divergent causal consequence branches and statutory grounding under Indian cyber law.
 * 
 * INVARIANTS:
 * - Content-driven, client-side only (Option A).
 * - Zero imports from backend controllers, models, or assessment scoring services.
 * - All identifiers, phone numbers, and URLs are unmistakably fictional (.invalid domains, +91-00000-0000X).
 * - All legal provisions include explicit commencement status and fact-conditional applicability notes.
 * - No guarantees of zero liability, fund freezing, or recovery.
 * - Prominent hypothetical educational model disclosures.
 */

/**
 * Common educational disclaimer applied to all counterfactual fixtures.
 */
export const COUNTERFACTUAL_DISCLAIMER = Object.freeze({
  badge: 'Hypothetical Educational Simulation',
  text: 'Educational Simulation: Hypothetical Counterfactual Model. Scenarios and consequence branches are educational models designed to teach causal reasoning and defensive habits under Indian law. They do not represent specific individuals, documented cases, or guaranteed legal/financial outcomes.'
});

/**
 * Scenario 1: The Midnight Power Cut SMS
 */
export const SCENARIO_1_MIDNIGHT_POWER_CUT_SMS = Object.freeze({
  id: 'cf-midnight-power-cut-sms',
  slug: 'midnight-power-cut-sms',
  title: 'The Midnight Power Cut SMS',
  scenarioType: 'counterfactual-simulation',
  category: 'Utility Scam',
  difficulty: 'Beginner',
  estimatedMinutes: 3,

  disclaimer: COUNTERFACTUAL_DISCLAIMER.text,

  incidentContext: Object.freeze({
    summary: 'A late-evening SMS alleging immediate electrical power cutoff due to an un-updated bill, directing the recipient to contact a personal mobile number or access an unverified update link.',
    targetVector: 'Spoofed SMS Header + Manufactured Urgency (Imminent Midnight Disconnection)',
    mockInterfaceType: 'sms',
    mockInterfaceData: Object.freeze({
      senderId: 'VD-DISCOM-ALRT',
      timestamp: 'Today, 08:42 PM',
      messageBody: 'Dear Consumer (Account: CA-0000-0000), your electricity supply will be disconnected tonight at 09:30 PM from the power station because your previous month\'s bill payment was not updated. Please immediately contact our Electricity Verification Officer at +91-00000-00001 or update your record at https://discom-bill-update.example.invalid to avoid cutoff.',
      warningIndicator: 'Unofficial private contact number provided for utility bill update; tight 48-minute cutoff deadline.'
    })
  }),

  decisionJunction: Object.freeze({
    prompt: 'You receive this message on your personal phone at 8:42 PM while cooking dinner. What is your immediate response?',
    choices: Object.freeze([
      Object.freeze({
        id: 'choice-power-compliance',
        label: 'Call the personal mobile number provided in the SMS and follow the instructions to prevent disconnection',
        choiceType: 'reflexive-compliance',
        shortAction: 'Called the private number and followed verbal directions',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Coerced App Installation & Screen Access',
          immediateBody: 'The individual answering the call poses as an electricity billing supervisor. He confirms your consumer number is flagged for immediate disconnection and claims the discom server failed to reconcile a ₹12 payment fee. To avoid the power cut, he instructs you to install a "Quick Support" app (a remote-access tool) from a link he sends, or enter your card details on an unverified payment page to pay a token ₹10 update fee.',
          escalatedTitle: 'Potential Later Escalation: Secondary Credential Harvesting & Unauthorized Debits',
          escalatedBody: 'Granting remote screen access allows the perpetrator to view incoming OTPs or harvest banking credentials. If card or UPI details are entered on the unverified link, unauthorized debits follow. Once a victim complies once, fraudsters often call back demanding further "security deposits" or threaten criminal action for non-payment, escalating financial losses.',
          impactAssessment: Object.freeze({
            financialExposure: 'High risk of unauthorized payment debits and subsequent secondary extortion attempts.',
            accountSafety: 'Compromised',
            legalConsiderations: 'Voluntarily installing remote-access applications or entering credentials under social engineering complicates regulatory dispute resolution. Limiting liability rules under RBI directives apply strictly to unauthorized transactions, not automatically to customer-authorized transfers induced by deception.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Remote desktop or screen-sharing applications grant outsiders visibility of two-factor authentication tokens and device contents without hacking carrier networks.',
            psychologicalFactor: 'Manufactured urgency (a 48-minute deadline before power cut) induces panic, intentionally suppressing the critical pause needed to inspect the sender\'s authenticity.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-power-inaction',
        label: 'Delete or ignore the SMS entirely and do not verify your consumer account',
        choiceType: 'passive-inaction',
        shortAction: 'Ignored the message without confirming authentic utility account status',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Fraud Averted, But Uncertainty Remains',
          immediateBody: 'By ignoring the message and refusing to call the personal mobile number or click the link, you prevent remote application installation and credential capture. However, because you took no steps to verify your authentic utility account, anxiety persists about whether your electricity bill is actually unpaid.',
          escalatedTitle: 'Potential Later Escalation: Ongoing Hesitation Regarding Legitimate Utility Notices',
          escalatedBody: 'While no scammer accesses your financial accounts, complete inaction leaves you vulnerable to future similar scams because you have not verified the genuine discom communication policy. Furthermore, if you did happen to have an authentic billing discrepancy, ignoring official accounts could lead to legitimate late fees, though statutory disconnection requires formal written notice.',
          impactAssessment: Object.freeze({
            financialExposure: 'None from the fraudulent message.',
            accountSafety: 'Secure',
            legalConsiderations: 'Passive inaction incurs no legal or financial liability, but misses an opportunity to gather header evidence or report the scam attempt to authorities.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Scam mechanisms require active victim engagement (calling, clicking, installing) to succeed; non-engagement breaks the exploit chain.',
            psychologicalFactor: 'Avoidance behavior deflects immediate threat but leaves residual anxiety unresolved due to unverified underlying facts.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-power-verification',
        label: 'Verify account balance independently via the official state electricity discom website or mobile app',
        choiceType: 'active-verification',
        shortAction: 'Accessed the official portal directly via known bookmark or consumer application',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Confirmation of Current Account & Scam Identification',
          immediateBody: 'You open your bookmarked discom portal or official mobile application and enter your consumer number (CA-0000-0000). The official billing portal confirms your account is fully paid with zero arrears. A prominent advisory on the discom homepage states: "Discom officers never call from personal mobile numbers or threaten immediate midnight disconnection."',
          escalatedTitle: 'Potential Later Escalation: Vector Neutralized & Public Evidence Preserved',
          escalatedBody: 'You take a screenshot of the fraudulent SMS, note the spoofed header and personal phone number, and report the message to the National Cybercrime Portal (cybercrime.gov.in) and the telecom carrier via the Chakshu facility on Sanchar Saathi. Your financial assets and devices remain fully secure.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. Zero financial or credential exposure.',
            accountSafety: 'Secure',
            legalConsiderations: 'Independent verification preserves clean legal posture and generates actionable cybercrime reporting intelligence without exposure to fraudulent liability.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Out-of-band verification via authenticated official servers bypasses the closed communication environment controlled by the attacker.',
            psychologicalFactor: 'Exercising cognitive pause replaces panic-driven compliance with deliberate fact-checking against authoritative sources.'
          })
        })
      })
    ])
  }),

  defensiveTakeaway: Object.freeze({
    coreRule: 'Legitimate public utilities follow statutory disconnection procedures with formal advance notice; they do not issue same-day cutoff threats via personal mobile numbers demanding payments to private accounts.',
    actionableSteps: Object.freeze([
      'Never call personal phone numbers or tap links embedded in unsolicited utility disconnection messages.',
      'Check your bill status exclusively through official discom mobile applications or bookmarked utility websites using your official Consumer ID.',
      'Report deceptive utility SMS messages on the Chakshu facility (sancharsaathi.gov.in) and cybercrime.gov.in.'
    ]),
    statutoryFramework: Object.freeze([
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 318(4)',
        status: 'IN_FORCE',
        plainSummary: 'Cheating and dishonestly inducing delivery of property, punishable with imprisonment up to seven years and fine.',
        applicabilityNote: 'Applies conditionally where a perpetrator dishonestly deceives a consumer to deliver money, payment authorizations, or valuable security under false pretenses of an overdue utility bill.'
      }),
      Object.freeze({
        act: 'Information Technology Act, 2000',
        section: 'Section 66D',
        status: 'IN_FORCE',
        plainSummary: 'Punishment for cheating by personation by using computer resource, punishable with imprisonment up to three years and fine up to one lakh rupees.',
        applicabilityNote: 'Applies conditionally where telecom or computer resources (SMS gateways, VoIP, spoofed headers) are utilized to personate a state electricity board or discom official.'
      }),
      Object.freeze({
        act: 'Electricity Act, 2003',
        section: 'Section 56(1)',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Statutory notice requirement for disconnection of supply due to unpaid electricity charges.',
        applicabilityNote: 'Establishes that electricity distribution licensees must give not less than fifteen clear days\' notice in writing before disconnecting supply for bill default; immediate same-day cutoff over phone/SMS has no statutory basis.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) facilitates inter-bank hold requests across participating commercial banks, payment aggregators, and wallets.',
      guidance: 'If funds were transferred or remote apps installed, call National Cybercrime Helpline 1930 immediately to log an incident for CFCFRMS inter-bank hold coordination, uninstall unauthorized applications immediately, and file an incident report at cybercrime.gov.in. Note: Reporting assists inter-bank coordination but does not guarantee fund recovery or account unfreezing.'
    })
  })
});

/**
 * Scenario 2: The Nominal ₹15 Parcel Fee
 */
export const SCENARIO_2_NOMINAL_PARCEL_FEE = Object.freeze({
  id: 'cf-nominal-parcel-fee',
  slug: 'nominal-parcel-fee',
  title: 'The Nominal ₹15 Parcel Fee',
  scenarioType: 'counterfactual-simulation',
  category: 'Courier Fraud',
  difficulty: 'Intermediate',
  estimatedMinutes: 3,

  disclaimer: COUNTERFACTUAL_DISCLAIMER.text,

  incidentContext: Object.freeze({
    summary: 'A delivery exception SMS claiming an incoming package is suspended due to an incomplete street address, demanding address updates and a nominal ₹15 fee on an unverified domain.',
    targetVector: 'Deceptive Smishing Link + Low-Friction Financial Hook (Nominal ₹15 Fee)',
    mockInterfaceType: 'sms',
    mockInterfaceData: Object.freeze({
      senderId: 'IN-POST-DELIV',
      timestamp: 'Today, 11:15 AM',
      messageBody: 'Your package (Tracking: AWB-0000-0000) cannot be delivered due to incomplete street address details. Please update your address and pay a nominal re-delivery fee of ₹15 within 12 hours at https://delivery-update.example.invalid or the consignment will be returned to sender.',
      warningIndicator: 'External non-governmental domain (.example.invalid); request for payment to update address.'
    })
  }),

  decisionJunction: Object.freeze({
    prompt: 'You are expecting several online orders this week. How do you respond to this parcel suspension notification?',
    choices: Object.freeze([
      Object.freeze({
        id: 'choice-parcel-compliance',
        label: 'Click the link, enter your updated address, and enter debit/credit card details to pay the nominal ₹15 fee',
        choiceType: 'reflexive-compliance',
        shortAction: 'Accessed the link and entered card details on the form',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Credential Harvesting & OTP Interception',
          immediateBody: 'The link opens a convincing mock page replicating a national logistics service. After entering your address, a payment gateway page prompts for your 16-digit card number, expiration date, CVV, and mobile number. You submit a ₹15 transaction, and an OTP screen appears. However, the OTP generated by your bank is actually for a larger unauthorized authorization or international wallet registration.',
          escalatedTitle: 'Potential Later Escalation: High-Value Secondary Fraud & Data Resale',
          escalatedBody: 'By entering the OTP, you authorize an unexpected transaction far exceeding ₹15. Furthermore, your card details are stored by the phishing kit and may be used for repeated card-not-present debits on international platforms or sold on cybercrime forums. Fraudsters may also call weeks later posing as bank fraud officers claiming to "investigate" the leak to extract further credentials.',
          impactAssessment: Object.freeze({
            financialExposure: 'High risk of unauthorized card debits and secondary financial exploitation.',
            accountSafety: 'Compromised',
            legalConsiderations: 'Voluntarily entering card credentials and OTP into a third-party phishing interface complicates bank dispute resolution. Under RBI card directions, banks investigate whether customer negligence occurred; zero customer liability is not automatic.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Phishing kits use reverse-proxy techniques to capture credentials and relay real-time OTP requests to banking gateways.',
            psychologicalFactor: 'The nominal fee (₹15) falls below the threshold of suspicion, leading victims to treat the transaction as trivial administrative overhead rather than a security event.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-parcel-inaction',
        label: 'Ignore the message and wait for the courier to arrive without checking tracking status',
        choiceType: 'passive-inaction',
        shortAction: 'Ignored the message without verifying order tracking',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Credentials Preserved, Order Status Unknown',
          immediateBody: 'By ignoring the link and refusing to enter payment details, you completely protect your debit/credit card from compromise. However, if you actually have an active delivery from an authentic retailer, you remain unaware of whether any legitimate delivery exception actually occurred.',
          escalatedTitle: 'Potential Later Escalation: Residual Uncertainty in Order Fulfillment',
          escalatedBody: 'If the SMS was purely unsolicited spam (you had no pending package), no impact occurs. If you did have a genuine package with another courier, ignoring delivery issues could cause the merchant to return the item to warehouse. However, your financial and digital identity remains entirely unharmed.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. No fraudulent payment executed and card credentials remain protected.',
            accountSafety: 'Secure',
            legalConsiderations: 'No legal or financial injury sustained; no personal data transmitted.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Phishing attacks require the victim to load the web asset and transmit form data; inaction halts data exfiltration.',
            psychologicalFactor: 'Passive skepticism prevents compliance but does not resolve informational ambiguity.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-parcel-verification',
        label: 'Check the tracking code directly on the official courier portal or within your merchant order history',
        choiceType: 'active-verification',
        shortAction: 'Cross-referenced the tracking ID against official merchant and courier platforms',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Deceptive Tracking Exposed & Link Defused',
          immediateBody: 'You open the official shopping application where you placed your orders and inspect the actual tracking numbers assigned by the seller. The authentic delivery has a completely different tracking ID and is out for delivery without fees. Entering the SMS tracking code (AWB-0000-0000) on the official logistics website returns "Invalid Tracking Number."',
          escalatedTitle: 'Potential Later Escalation: Proactive Defense & Carrier Reporting',
          escalatedBody: 'Recognizing the smishing attempt, you mark the sender as spam, submit the malicious domain (delivery-update.example.invalid) to Sanchar Saathi (Chakshu) and the National Cybercrime Reporting Portal, and alert colleagues to the active parcel scam vector.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. Financial assets and credentials remain unexposed.',
            accountSafety: 'Secure',
            legalConsiderations: 'Independent verification prevents credential compromise and supports public reporting without legal complications.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Authentic order management systems store authoritative tracking metadata that cannot be altered by third-party smishers.',
            psychologicalFactor: 'Cross-referencing claims against an independent source of truth breaks the illusion created by the deceptive message.'
          })
        })
      })
    ])
  }),

  defensiveTakeaway: Object.freeze({
    coreRule: 'Legitimate postal and courier services do not require small fee payments over unsolicited SMS links to update incomplete delivery addresses.',
    actionableSteps: Object.freeze([
      'Never tap shortened or unverified web links claiming delivery exceptions.',
      'Check shipment status exclusively on the merchant order page where the item was purchased or the official courier website via bookmark.',
      'If card details were entered on an unverified site, call your bank immediately to block the card and dispute any pending debits.'
    ]),
    statutoryFramework: Object.freeze([
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 318(4)',
        status: 'IN_FORCE',
        plainSummary: 'Cheating and dishonestly inducing delivery of property, punishable with imprisonment up to seven years and fine.',
        applicabilityNote: 'Applies conditionally where a perpetrator fraudulently induces payment of redelivery fees or valuable security under false logistics pretenses.'
      }),
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 319',
        status: 'IN_FORCE',
        plainSummary: 'Cheating by personation, punishable with imprisonment up to five years and fine.',
        applicabilityNote: 'Applies conditionally only where the perpetrator personates a specific courier representative or authorized logistics agency entity (representing oneself to be someone else).'
      }),
      Object.freeze({
        act: 'Information Technology Act, 2000',
        section: 'Section 66C',
        status: 'IN_FORCE',
        plainSummary: 'Punishment for identity theft, punishable with imprisonment up to three years and fine up to one lakh rupees.',
        applicabilityNote: 'Applies conditionally only where the perpetrator fraudulently or dishonestly makes use of another person\'s electronic signature, password, or any other unique identification feature. Merely collecting card details on a form does not automatically satisfy § 66C until the perpetrator fraudulently makes use of qualifying unique identification features.'
      }),
      Object.freeze({
        act: 'RBI Master Direction – Credit Card and Debit Card – Issuance and Conduct Directions, 2022',
        section: 'Chapter VI (Customer Protection)',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Regulatory standards for cardholder liability in electronic transactions.',
        applicabilityNote: 'Operative regulatory protections limiting cardholder liability apply strictly to unauthorised transactions. Where card details and OTPs are shared or entered on third-party sites, banks investigate customer negligence; zero liability is not automatic.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS enables quick inter-bank hold requests across commercial banks and payment gateways upon prompt notification.',
      guidance: 'If card credentials or OTP were entered, block your card immediately through your bank\'s mobile app or hotline, call Helpline 1930 within the initial hours to request CFCFRMS hold coordination, and file a report on cybercrime.gov.in. Note: Prompt reporting assists inter-bank coordination but does not guarantee fund recovery.'
    })
  })
});

/**
 * Scenario 3: The "Approve Payment" QR Code
 */
export const SCENARIO_3_APPROVE_PAYMENT_QR = Object.freeze({
  id: 'cf-approve-payment-qr',
  slug: 'approve-payment-qr',
  title: 'The "Approve Payment" QR Code',
  scenarioType: 'counterfactual-simulation',
  category: 'Marketplace Fraud',
  difficulty: 'Intermediate',
  estimatedMinutes: 3,

  disclaimer: COUNTERFACTUAL_DISCLAIMER.text,

  incidentContext: Object.freeze({
    summary: 'A classifieds marketplace buyer agrees to buy listed furniture immediately without inspection, sending a QR code and instructing the seller to scan it and enter their UPI PIN to "receive" funds.',
    targetVector: 'Reverse-QR Collect Exploit + Social Engineering (Eager Buyer Impersonating Defense Official)',
    mockInterfaceType: 'qr_code',
    mockInterfaceData: Object.freeze({
      senderId: '+91-00000-00002',
      buyerProfile: 'Capt. Rajesh S. (Claimed Army Transit Officer)',
      itemPrice: '₹8,500',
      qrPlaceholder: '[NON-FUNCTIONAL EDUCATIONAL MOCK QR CODE — DO NOT SCAN]',
      messageBody: 'I have generated an instant merchant payout QR code for ₹8,500 from my defense canteen allowance. Scan this in your Google Pay/PhonePe/Paytm app and enter your UPI PIN to approve the credit deposit into your bank account.',
      warningIndicator: 'Instruction to enter UPI PIN to receive money; non-standard payment flow.'
    })
  }),

  decisionJunction: Object.freeze({
    prompt: 'The buyer insists he can only pay via this official military payout QR code. What is your response?',
    choices: Object.freeze([
      Object.freeze({
        id: 'choice-qr-compliance',
        label: 'Scan the QR code in your UPI application and enter your 6-digit UPI PIN as requested by the buyer',
        choiceType: 'reflexive-compliance',
        shortAction: 'Scanned the QR code and entered UPI PIN on the mobile screen',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Direct Account Debit & Immediate Loss',
          immediateBody: 'Your UPI application opens a payment approval screen. The screen prominently displays a "PAY" or "COLLECT REQUEST" for ₹8,500 directed to an unknown merchant VPA. By entering your secret UPI PIN, you do not receive funds—instead, you instantly authorize a debit of ₹8,500 from your linked bank account to the fraudster\'s account.',
          escalatedTitle: 'Potential Later Escalation: Double-Debit "Reversal" Scam',
          escalatedBody: 'When you notice ₹8,500 deducted, the buyer immediately calls back expressing shock, claiming "a server glitch reversed the payout into a debit." He immediately sends a second QR code for ₹17,000, promising that scanning it will "reverse both transactions and refund ₹25,500." Victims trapped in panic often scan again, doubling their losses.',
          impactAssessment: Object.freeze({
            financialExposure: 'Immediate direct debit of ₹8,500 (or ₹25,500+ if secondary reversal scam is accepted).',
            accountSafety: 'At Risk',
            legalConsiderations: 'Because the debit was authorized with your personal, secret UPI PIN, regulatory zero-liability rules under RBI Master Directions for unauthorized transactions do not automatically apply. Recourse relies on rapid dispute lodging and CFCFRMS inter-bank hold coordination.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'UPI architecture is structurally asymmetric: entering a PIN is exclusively an authorization to debit funds from an account; receiving funds requires zero user authentication.',
            psychologicalFactor: 'Eagerness to complete a profitable sale combined with confusion about QR code bidirectional capability blinds the seller to the debit warning on the screen.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-qr-inaction',
        label: 'Decline the QR code and stop communicating entirely without explaining or offering a safe alternative',
        choiceType: 'passive-inaction',
        shortAction: 'Cut off communication and abandoned the sale without educational clarity',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Account Protected, But Opportunity Lost',
          immediateBody: 'By refusing to scan the QR code or enter your UPI PIN, you completely avoid financial loss. However, abruptly terminating the conversation leaves you uncertain about why the buyer used that method, and the fraudster simply moves on to target another seller.',
          escalatedTitle: 'Potential Later Escalation: Ongoing Marketplace Vulnerability',
          escalatedBody: 'While your funds remain intact, passive withdrawal does not develop affirmative knowledge about safe marketplace selling protocols. The scammer remains active on the platform using the same fictitious profile until reported.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. No funds debited and secret UPI PIN was not entered.',
            accountSafety: 'Secure',
            legalConsiderations: 'No financial loss or compromise incurred; missed opportunity to report the fraudulent VPA to marketplace safety.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Declining to scan the QR code stops the UPI transaction sequence before any collect request can be confirmed.',
            psychologicalFactor: 'Instinctive distrust prevents fraud but lacks the technical grounding needed to articulate why the request was hazardous.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-qr-verification',
        label: 'Explain that receiving UPI funds never requires a PIN, reject the QR code, and insist on direct IMPS/NEFT transfer or cash on pickup',
        choiceType: 'active-verification',
        shortAction: 'Stated the core UPI security rule, rejected the QR code, and demanded direct transfer',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Scam Collapses & Buyer Flees',
          immediateBody: 'You inform the buyer: "UPI PIN is only entered to send money, never to receive it. Please send the payment directly to my registered UPI mobile number or bank account via IMPS." Knowing their exploit is unmasked, the scammer immediately disconnects the chat and deletes their profile.',
          escalatedTitle: 'Potential Later Escalation: Evidence Logged & Community Protected',
          escalatedBody: 'You capture screenshots of the chat, the buyer\'s claimed defense profile, and the fraudulent QR code image. You report the user to the classifieds marketplace safety team and submit the phone number to the Chakshu facility on Sanchar Saathi. Your funds and bank details remain completely secure.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. Zero financial loss.',
            accountSafety: 'Secure',
            legalConsiderations: 'Active verification prevents fraudulent inducement, preserves evidentiary records, and maintains an uncompromised legal position.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'UPI transfers to a mobile number or VPA credit the recipient\'s account instantly without requiring recipient intervention.',
            psychologicalFactor: 'Firm adherence to an invariant rule ("PIN is for paying only") neutralizes even sophisticated social engineering.'
          })
        })
      })
    ])
  }),

  defensiveTakeaway: Object.freeze({
    coreRule: 'Entering a UPI PIN authorizes a transaction that can debit your account. You do not need to enter your UPI PIN to receive money. Always verify the payee and transaction details before authorizing a payment.',
    actionableSteps: Object.freeze([
      'Never scan a QR code sent by a buyer to receive payment for an item you are selling.',
      'Never enter your UPI PIN on any screen that you expect to credit money to your account.',
      'To receive money on UPI, share only your phone number or UPI VPA; no confirmation or PIN entry is required on your device.',
      'Report fraudulent VPAs and mobile numbers on the National Cybercrime Portal (cybercrime.gov.in).'
    ]),
    statutoryFramework: Object.freeze([
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 318(4)',
        status: 'IN_FORCE',
        plainSummary: 'Cheating and dishonestly inducing delivery of property, punishable with imprisonment up to seven years and fine.',
        applicabilityNote: 'Applies conditionally where a buyer falsely induces a seller to authorize a debit transaction under the fraudulent pretense of receiving money.'
      }),
      Object.freeze({
        act: 'Information Technology Act, 2000',
        section: 'Section 66D',
        status: 'IN_FORCE',
        plainSummary: 'Punishment for cheating by personation by using computer resource, punishable with imprisonment up to three years and fine up to one lakh rupees.',
        applicabilityNote: 'Applies conditionally where computer resources or digital messaging platforms are used to personate defense personnel or verified buyers.'
      }),
      Object.freeze({
        act: 'Statutory Clarification (IT Act § 43)',
        section: 'Section 43 Inapplicability Note',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Statutory boundary clarification on computer system access.',
        applicabilityNote: 'IT Act § 43 does not apply to voluntary PIN entry on a user\'s own mobile device; § 43 governs unauthorized system access, data extraction, or network damage.'
      }),
      Object.freeze({
        act: 'Master Direction on Customer Service in Banks & Digital Payment Security Controls',
        section: 'Operative RBI Directions',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Customer protection and dispute reporting guidelines for digital payments.',
        applicabilityNote: 'Because the customer authorized the transaction using their secret UPI PIN, zero-liability rules for unauthorized transactions do not automatically apply. Immediate reporting to 1930 enables CFCFRMS inter-bank hold coordination, but recovery cannot be guaranteed.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS facilitates inter-bank hold coordination across participating banks to freeze recipient mule accounts before funds are siphoned.',
      guidance: 'If you entered your UPI PIN and suffered an unauthorized debit, call 1930 immediately within the initial hours to log the transaction reference number (UTR) for CFCFRMS hold coordination, notify your bank to register a dispute, and submit a cybercrime report at cybercrime.gov.in. Note: Inter-bank coordination assists hold requests but cannot guarantee fund recovery.'
    })
  })
});

/**
 * Scenario 4: The Video Summons "Digital Arrest"
 */
export const SCENARIO_4_VIDEO_SUMMONS_DIGITAL_ARREST = Object.freeze({
  id: 'cf-video-summons-digital-arrest',
  slug: 'video-summons-digital-arrest',
  title: 'The Video Summons "Digital Arrest"',
  scenarioType: 'counterfactual-simulation',
  category: 'Public Impersonation',
  difficulty: 'Advanced',
  estimatedMinutes: 4,

  disclaimer: COUNTERFACTUAL_DISCLAIMER.text,

  incidentContext: Object.freeze({
    summary: 'A video call from an individual wearing a police uniform seated in front of simulated official insignia, alleging a seized narcotic parcel in the learner\'s name and coercing a ₹50,000 transfer to a "verification account" under threat of immediate arrest.',
    targetVector: 'Coercive Law Enforcement Impersonation + Video Setting Fabrication + Spurious Legal Claims',
    mockInterfaceType: 'phone_call',
    mockInterfaceData: Object.freeze({
      senderId: '+91-00000-00003',
      callerIdentity: 'Investigating Officer, Cyber Crime Branch',
      callDuration: '04:12',
      simulatedVisual: 'Man in khaki police uniform seated in front of forged state police banner and emblem.',
      messageBody: 'A consignment containing 140 grams of narcotics and fake passports under your Aadhaar number was seized at Mumbai Customs. Under the Bharatiya Nagarik Suraksha Sanhita, an immediate arrest warrant has been issued. You are placed under "Digital Arrest" and must not disconnect this video call. To prove your accounts are not linked to money laundering, transfer ₹50,000 immediately to the Supreme Court verification account "VERIFY-SAFE-0000" via RTGS for asset verification.',
      warningIndicator: 'Demands for fund transfers to "verification" accounts; claims of "Digital Arrest" over video call.'
    })
  }),

  decisionJunction: Object.freeze({
    prompt: 'The caller threatens that disconnecting the video call will prompt an armed squad to arrive at your home within thirty minutes. What do you do?',
    choices: Object.freeze([
      Object.freeze({
        id: 'choice-arrest-compliance',
        label: 'Comply with the demands out of fear, remain on video, and transfer ₹50,000 to the "verification" account',
        choiceType: 'reflexive-compliance',
        shortAction: 'Remained on video and transferred funds to the designated account',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Financial Loss & Intensified Coercion',
          immediateBody: 'Terrified by the threat of arrest, you transfer ₹50,000 via RTGS. Rather than releasing you, the caller intensifies the intimidation, stating that "further suspicious transactions totaling ₹4,00,000 have been uncovered on your Aadhaar." They order you to keep the video call active overnight and liquidate fixed deposits or borrow from relatives to clear the remaining "verification bond."',
          escalatedTitle: 'Potential Later Escalation: Severe Financial Ruin & Severe Emotional Trauma',
          escalatedBody: 'Coercive isolation continues until your financial resources are completely exhausted. Once the fraudsters realize no further money can be extracted, they disconnect the call and block your number. By the time you speak with family or legal counsel, your life savings have been transferred through multiple layers of mule accounts.',
          impactAssessment: Object.freeze({
            financialExposure: 'Catastrophic financial loss (₹50,000 immediate, scaling to total available savings).',
            accountSafety: 'Compromised',
            legalConsiderations: 'Voluntary wire transfer made under severe intimidation. Immediate legal remedy requires filing a formal criminal complaint under BNS and IT Act, but fund recovery depends on immediate inter-bank hold coordination.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Modern VoIP tools, forged letterheads, and video background props allow remote criminals to stage convincing pseudo-governmental environments.',
            psychologicalFactor: 'Exploitation of deep fear of legal authority, public disgrace, and physical confinement, amplified by coercive isolation that forbids consulting third parties.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-arrest-inaction',
        label: 'Stay on the video call, argue your innocence, and attempt to plead with the caller for leniency',
        choiceType: 'passive-inaction',
        shortAction: 'Remained connected on video pleading innocence without disconnecting or verifying',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Prolonged Psychological Intimidation',
          immediateBody: 'You remain on the video call trying to convince the caller that your Aadhaar was misused and begging them not to send a police vehicle. The scammer exploits your compliance to show forged "Supreme Court orders" and "arrest warrants" on camera, shouting and threatening to notify your employer and neighbours, wearing down your emotional resistance.',
          escalatedTitle: 'Potential Later Escalation: Eventual Capitulation Under Exhaustion',
          escalatedBody: 'Prolonged emotional exhaustion and cognitive overload systematically break down rational defense mechanisms. After two hours of relentless pressure, most victims who stay on the line ultimately yield and execute the requested money transfer out of sheer desperation to end the ordeal.',
          impactAssessment: Object.freeze({
            financialExposure: 'Extremely high risk of eventual financial capitulation.',
            accountSafety: 'At Risk',
            legalConsiderations: 'Pleading with impersonators confers unearned legitimacy on their threats and maintains the psychological trap.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Continuous video presence gives the attacker real-time biometric and emotional feedback to calibrate coercive tactics.',
            psychologicalFactor: 'Pleading accepts the scammer\'s false jurisdiction; negotiating within a fabricated reality prevents taking the decisive step to sever contact.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-arrest-verification',
        label: 'Terminate the video call immediately, refuse to transfer any funds, and independently verify with local police or Helpline 1930',
        choiceType: 'active-verification',
        shortAction: 'Disconnected the call immediately, transferred nothing, and reported to authorities',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Psychological Trap Broken Instantly',
          immediateBody: 'You remember that legitimate authorities never conduct arrests or demand money transfers via video calls. You hang up the video call. The scammer calls back repeatedly from multiple numbers; you refuse to answer and block them. The immediate terror dissipates as you regain control of your environment.',
          escalatedTitle: 'Potential Later Escalation: Independent Confirmation & Formal Reporting',
          escalatedBody: 'You contact your nearest local police station or dial the National Cybercrime Helpline 1930. Officers confirm that "Digital Arrest" is a complete fraud with no standing in Indian law, and that no warrant exists against you. You preserve the call records and video screenshot to support ongoing cybercrime investigations.',
          impactAssessment: Object.freeze({
            financialExposure: 'Zero. All assets remain fully protected.',
            accountSafety: 'Secure',
            legalConsiderations: 'Severing communication terminates the extortion attempt and preserves clean legal status without compromise.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Hanging up terminates the attacker\'s sole communication and surveillance channel over the victim.',
            psychologicalFactor: 'Recognizing a structural impossibility under Indian law ("Digital Arrest does not exist") destroys the attacker\'s psychological leverage.'
          })
        })
      })
    ])
  }),

  defensiveTakeaway: Object.freeze({
    coreRule: 'Legitimate law enforcement and judicial authorities do not conduct arrests, trials, or asset verification over video calls, nor do they require citizens to transfer money to "safe" or "escrow" accounts to avoid arrest.',
    actionableSteps: Object.freeze([
      'Never transfer money to any account claiming to be a "government verification," "safe," or "court escrow" account.',
      'Immediately disconnect any video call from individuals claiming to place you under "Digital Arrest."',
      'Remember that "Digital Arrest" has zero basis in Indian criminal procedure.',
      'Report impersonation attempts immediately to National Cybercrime Helpline 1930 and cybercrime.gov.in.'
    ]),
    statutoryFramework: Object.freeze([
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 204',
        status: 'IN_FORCE',
        plainSummary: 'Impersonating a public servant, punishable with imprisonment up to three years and fine.',
        applicabilityNote: 'Applies to falsely pretending to hold an office as a public servant (such as a police officer or customs official) and doing an act under color of such office.'
      }),
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 308',
        status: 'IN_FORCE',
        plainSummary: 'Extortion, punishable with imprisonment up to seven years and fine.',
        applicabilityNote: 'Applies conditionally where the statutory elements of extortion are satisfied: intentionally putting a person in fear of injury (such as wrongful arrest, confinement, or injury to reputation) and thereby dishonestly inducing the person to deliver property or valuable security. Threats of arrest in cyber scams do not automatically establish extortion in every instance without satisfying all statutory elements.'
      }),
      Object.freeze({
        act: 'Bharatiya Nyaya Sanhita, 2023',
        section: 'Section 318(4)',
        status: 'IN_FORCE',
        plainSummary: 'Cheating and dishonestly inducing delivery of property, punishable with imprisonment up to seven years and fine.',
        applicabilityNote: 'Applies to inducing transfer of funds by false representations of seized narcotics or legal warrants.'
      }),
      Object.freeze({
        act: 'Information Technology Act, 2000',
        section: 'Section 66D',
        status: 'IN_FORCE',
        plainSummary: 'Cheating by personation by using computer resource, punishable with imprisonment up to three years and fine up to one lakh rupees.',
        applicabilityNote: 'Applies to impersonating police or judicial authorities over video conferencing platforms or computer networks.'
      }),
      Object.freeze({
        act: 'Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
        section: 'Chapter V (Sections 35–62) & Chapter VI (Sections 63–93)',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Statutory criminal procedure governing arrest and processes to compel appearance.',
        applicabilityNote: '"Digital Arrest" has zero basis in Indian law. Arrest procedures are strictly codified under BNSS Chapter V (Sections 35–62). Under BNSS Section 35(3), a police officer investigating an offense punishable with imprisonment up to seven years may issue a written notice to appear directing the person to appear before the officer; this is an investigative notice under Chapter V, not a court summons under Chapter VI (which governs processes to compel appearance issued by courts under Sections 63–93), with applicable savings under Section 531. Legitimate authorities do not conduct arrests or trials over video calls, nor do they require citizens to transfer money to private "safe" or "verification" accounts to avoid arrest.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS enables fast inter-bank hold coordination across participating banks to freeze recipient mule accounts before funds are siphoned.',
      guidance: 'If money was transferred, call 1930 immediately to log transaction and account details for CFCFRMS hold coordination, notify your bank\'s fraud desk, and lodge an immediate complaint on cybercrime.gov.in. Note: Inter-bank coordination assists hold requests but does not guarantee fund recovery or account unfreezing.'
    })
  })
});

/**
 * Authoritative array of all four counterfactual scenario data fixtures.
 */
export const COUNTERFACTUAL_SCENARIOS = Object.freeze([
  SCENARIO_1_MIDNIGHT_POWER_CUT_SMS,
  SCENARIO_2_NOMINAL_PARCEL_FEE,
  SCENARIO_3_APPROVE_PAYMENT_QR,
  SCENARIO_4_VIDEO_SUMMONS_DIGITAL_ARREST
]);

/**
 * Retrieve a counterfactual scenario fixture by its unique ID.
 * @param {string} id - e.g. 'cf-midnight-power-cut-sms'
 * @returns {object|null}
 */
export function getCounterfactualScenarioById(id) {
  if (!id || typeof id !== 'string') return null;
  return COUNTERFACTUAL_SCENARIOS.find(scenario => scenario.id === id) || null;
}

/**
 * Retrieve a counterfactual scenario fixture by its unique URL slug.
 * @param {string} slug - e.g. 'midnight-power-cut-sms'
 * @returns {object|null}
 */
export function getCounterfactualScenarioBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  return COUNTERFACTUAL_SCENARIOS.find(scenario => scenario.slug === slug) || null;
}

/**
 * Strict schema validation utility for counterfactual scenario fixtures.
 * @param {object} scenario - Scenario object to validate
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateCounterfactualScenario(scenario) {
  const errors = [];

  if (!scenario || typeof scenario !== 'object') {
    return { isValid: false, errors: ['Scenario fixture must be a non-null object.'] };
  }

  // Top-level identity fields
  if (!scenario.id || typeof scenario.id !== 'string') errors.push('Missing or invalid id.');
  if (!scenario.slug || typeof scenario.slug !== 'string') errors.push('Missing or invalid slug.');
  if (!scenario.title || typeof scenario.title !== 'string') errors.push('Missing or invalid title.');
  if (scenario.scenarioType !== 'counterfactual-simulation') errors.push('scenarioType must be "counterfactual-simulation".');
  if (!scenario.category || typeof scenario.category !== 'string') errors.push('Missing or invalid category.');
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(scenario.difficulty)) errors.push('Invalid difficulty level.');
  if (typeof scenario.estimatedMinutes !== 'number' || scenario.estimatedMinutes <= 0) errors.push('Invalid estimatedMinutes.');
  if (!scenario.disclaimer || typeof scenario.disclaimer !== 'string') errors.push('Missing disclaimer.');

  // Incident Context
  if (!scenario.incidentContext || typeof scenario.incidentContext !== 'object') {
    errors.push('Missing incidentContext.');
  } else {
    if (!scenario.incidentContext.summary) errors.push('Missing incidentContext.summary.');
    if (!scenario.incidentContext.targetVector) errors.push('Missing incidentContext.targetVector.');
    if (!['sms', 'email', 'messaging', 'browser', 'phone_call', 'qr_code'].includes(scenario.incidentContext.mockInterfaceType)) {
      errors.push('Invalid incidentContext.mockInterfaceType.');
    }
    if (!scenario.incidentContext.mockInterfaceData || typeof scenario.incidentContext.mockInterfaceData !== 'object') {
      errors.push('Missing incidentContext.mockInterfaceData.');
    }
  }

  // Decision Junction
  if (!scenario.decisionJunction || typeof scenario.decisionJunction !== 'object') {
    errors.push('Missing decisionJunction.');
  } else {
    if (!scenario.decisionJunction.prompt) errors.push('Missing decisionJunction.prompt.');
    if (!Array.isArray(scenario.decisionJunction.choices) || scenario.decisionJunction.choices.length !== 3) {
      errors.push('decisionJunction.choices must contain exactly 3 choices.');
    } else {
      const choiceTypes = scenario.decisionJunction.choices.map(c => c.choiceType);
      const expectedTypes = ['reflexive-compliance', 'passive-inaction', 'active-verification'];
      for (const exp of expectedTypes) {
        if (!choiceTypes.includes(exp)) {
          errors.push(`decisionJunction.choices must include a "${exp}" choice.`);
        }
      }

      scenario.decisionJunction.choices.forEach((choice, idx) => {
        if (!choice.id) errors.push(`Choice #${idx + 1} missing id.`);
        if (!choice.label) errors.push(`Choice #${idx + 1} missing label.`);
        if (!choice.shortAction) errors.push(`Choice #${idx + 1} missing shortAction.`);
        if (!choice.consequence || typeof choice.consequence !== 'object') {
          errors.push(`Choice #${idx + 1} missing consequence object.`);
        } else {
          const c = choice.consequence;
          if (!c.immediateTitle || !c.immediateBody) errors.push(`Choice #${idx + 1} missing immediate consequence text.`);
          if (!c.escalatedTitle || !c.escalatedBody) errors.push(`Choice #${idx + 1} missing escalated consequence text.`);
          if (!c.impactAssessment || typeof c.impactAssessment !== 'object') {
            errors.push(`Choice #${idx + 1} missing impactAssessment.`);
          } else {
            if (!c.impactAssessment.financialExposure) errors.push(`Choice #${idx + 1} missing financialExposure.`);
            if (!['Secure', 'At Risk', 'Compromised'].includes(c.impactAssessment.accountSafety)) {
              errors.push(`Choice #${idx + 1} invalid accountSafety.`);
            }
            if (!c.impactAssessment.legalConsiderations) errors.push(`Choice #${idx + 1} missing legalConsiderations.`);
          }
          if (!c.whyItHappened || typeof c.whyItHappened !== 'object') {
            errors.push(`Choice #${idx + 1} missing whyItHappened.`);
          } else {
            if (!c.whyItHappened.technicalFactor || !c.whyItHappened.psychologicalFactor) {
              errors.push(`Choice #${idx + 1} missing whyItHappened factors.`);
            }
          }
        }
      });
    }
  }

  // Defensive Takeaway
  if (!scenario.defensiveTakeaway || typeof scenario.defensiveTakeaway !== 'object') {
    errors.push('Missing defensiveTakeaway.');
  } else {
    if (!scenario.defensiveTakeaway.coreRule) errors.push('Missing defensiveTakeaway.coreRule.');
    if (!Array.isArray(scenario.defensiveTakeaway.actionableSteps) || scenario.defensiveTakeaway.actionableSteps.length === 0) {
      errors.push('Missing defensiveTakeaway.actionableSteps.');
    }
    if (!Array.isArray(scenario.defensiveTakeaway.statutoryFramework) || scenario.defensiveTakeaway.statutoryFramework.length === 0) {
      errors.push('Missing defensiveTakeaway.statutoryFramework.');
    } else {
      scenario.defensiveTakeaway.statutoryFramework.forEach((law, idx) => {
        if (!law.act) errors.push(`Statutory entry #${idx + 1} missing act.`);
        if (!law.section) errors.push(`Statutory entry #${idx + 1} missing section.`);
        if (!['IN_FORCE', 'ENACTED_FUTURE_COMMENCEMENT', 'PROCEDURAL_STATUTE'].includes(law.status)) {
          errors.push(`Statutory entry #${idx + 1} invalid status.`);
        }
        if (!law.plainSummary) errors.push(`Statutory entry #${idx + 1} missing plainSummary.`);
        if (!law.applicabilityNote) errors.push(`Statutory entry #${idx + 1} missing applicabilityNote.`);
      });
    }
    if (!scenario.defensiveTakeaway.officialReportingProtocol || typeof scenario.defensiveTakeaway.officialReportingProtocol !== 'object') {
      errors.push('Missing officialReportingProtocol.');
    } else {
      const p = scenario.defensiveTakeaway.officialReportingProtocol;
      if (!p.primaryChannel) errors.push('Missing officialReportingProtocol.primaryChannel.');
      if (!p.reportingPortalUrl) errors.push('Missing officialReportingProtocol.reportingPortalUrl.');
      if (!p.coordinationMechanism) errors.push('Missing officialReportingProtocol.coordinationMechanism.');
      if (!p.guidance) errors.push('Missing officialReportingProtocol.guidance.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate all counterfactual scenarios currently defined in COUNTERFACTUAL_SCENARIOS.
 * @returns {{ isValid: boolean, scenarioResults: Array<{ id: string, slug: string, isValid: boolean, errors: string[] }> }}
 */
export function validateAllCounterfactualScenarios() {
  const scenarioResults = COUNTERFACTUAL_SCENARIOS.map(scenario => {
    const validation = validateCounterfactualScenario(scenario);
    return {
      id: scenario.id,
      slug: scenario.slug,
      isValid: validation.isValid,
      errors: validation.errors
    };
  });

  return {
    isValid: scenarioResults.every(r => r.isValid),
    scenarioResults
  };
}
