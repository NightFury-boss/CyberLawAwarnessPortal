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
          immediateBody: 'The individual answering the call poses as an electricity billing supervisor. He confirms your consumer number is flagged for immediate disconnection and claims the discom server failed to reconcile a ₹12 payment fee. To avoid the power cut, he instructs you to install a "Quick Support" app (a remote-access tool) from a link he sends, or enter payment details on an unverified web page to pay a token update fee.',
          escalatedTitle: 'Potential Later Escalation: Secondary Credential Harvesting & Deceptive Transfers',
          escalatedBody: 'Granting remote screen access may expose notification banners, displayed two-factor codes, or banking credentials depending on device operating permissions and active app settings. If payment credentials are submitted on an unverified form, a fraudulent transaction or card compromise may follow, though financial impact depends on authentication barriers and rapid cardholder intervention. Fraudsters frequently call back to demand further "security deposits" or threaten penalties to induce additional payments.',
          impactAssessment: Object.freeze({
            financialExposure: 'Substantial risk of fraudulent payment debits or subsequent secondary payment demands if remote access is granted or payment credentials are provided.',
            accountSafety: 'Compromised',
            legalConsiderations: 'Installing remote-access applications or submitting payment details under social engineering may facilitate unauthorized transactions or fraudulent transfers. For covered commercial banks, customer liability is governed by Part D of the RBI (Commercial Banks – Responsible Business Conduct) Directions, 2025; under Paragraph 68, where an unauthorised electronic banking transaction involves customer negligence, such as sharing payment credentials, the customer bears the entire loss occurred until the unauthorised transaction is reported to the bank, after which any subsequent loss is borne by the bank. Prompt reporting is essential, but zero liability cannot be assumed.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Remote desktop or screen-sharing applications may grant external viewers visibility of displayed two-factor authentication tokens and screen contents depending on granted OS permissions.',
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
        applicabilityNote: 'Section 56(1) of the Electricity Act, 2003 establishes that electricity distribution licensees must give not less than fifteen clear days\' notice in writing before disconnecting supply for non-payment of electricity charges. While local statutory procedures apply to lawful disconnections, immediate same-day disconnection threatened over personal phone calls or SMS messages for minor arrears is inconsistent with this statutory notice framework.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS facilitates inter-bank communication to request possible holds on beneficiary accounts across participating financial entities.',
      guidance: 'If funds were transferred or remote apps installed, call National Cybercrime Helpline 1930 immediately to log an incident for CFCFRMS hold coordination, uninstall unauthorized applications immediately, and file an incident report at cybercrime.gov.in. Note: Prompt reporting supports coordination and possible beneficiary-account holds; it does not guarantee that accounts will be frozen, funds will be recovered, or transactions will be reversed.'
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
          immediateTitle: 'Immediate Reaction: Credential Harvesting & OTP Presentation',
          immediateBody: 'The link opens a deceptive web form mimicking an official parcel delivery portal. After entering an address, a payment page prompts for a 16-digit card number, expiration date, CVV, and mobile number. When submitting the nominal fee, an OTP prompt is displayed on your device. However, entering an OTP does not by itself verify the transaction amount, beneficiary, or purpose; the authentic SMS from your card issuer may actually correspond to an international purchase, e-commerce charge, or merchant tokenization rather than a ₹15 redelivery fee.',
          escalatedTitle: 'Potential Later Escalation: Risk of Deceptive Transactions & Secondary Exploitation',
          escalatedBody: 'Submitting payment credentials and completing an authentication step under deception creates substantial exposure. A fraudulent debit exceeding the nominal fee may be executed, or the captured card data may be retained for future card-not-present exploitation across platforms with differing authentication rules. Scammers may also make follow-up calls posing as bank fraud investigators seeking additional codes, compounding the exposure.',
          impactAssessment: Object.freeze({
            financialExposure: 'Substantial risk of fraudulent card debits and subsequent secondary exploitation if card details and authentication codes are submitted.',
            accountSafety: 'Compromised',
            legalConsiderations: 'Entering card details or an OTP on a deceptive web form does not by itself establish legal authorization of a disputed charge, nor does credential sharing automatically place a transaction outside regulatory liability protections. For covered commercial banks, customer liability is governed by Part D of the RBI (Commercial Banks – Responsible Business Conduct) Directions, 2025; under Paragraph 68, where an unauthorised transaction involves customer negligence such as sharing payment credentials, the customer bears the loss until reporting the transaction to the bank, after which any subsequent loss is borne by the bank. Applicable liability depends on the issuer-specific regulatory framework, transaction facts, negligence determinations, and reporting timelines; zero liability or guaranteed reimbursement cannot be promised.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Deceptive payment portals harvest credential fields and present dynamic authentication screens without disclosing the true merchant or debit amount.',
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
        act: 'Reserve Bank of India (Commercial Banks – Responsible Business Conduct) Directions, 2025',
        section: 'Part D: Limiting Liability of Customers in Unauthorised Electronic Banking Transactions (Paragraph 68)',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Operative regulatory framework governing customer liability in electronic banking transactions for covered commercial banks.',
        applicabilityNote: 'For covered commercial banks, Part D establishes customer liability rules in electronic transactions. Entering card details or an OTP on a deceptive form does not automatically establish lawful authorization of an unexpected transaction, nor does sharing credentials automatically exclude a transaction from the unauthorised-transaction framework; under Paragraph 68, where an unauthorised transaction involves customer negligence such as sharing payment credentials, the customer bears the entire loss until reporting the transaction to the bank, after which subsequent losses are borne by the bank. For non-bank card issuers or other financial institutions, respective issuer-specific regulations apply. Liability determinations depend on transaction facts, negligence findings, and prompt reporting; zero liability or reimbursement is not guaranteed.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS facilitates inter-bank communication to request possible holds on beneficiary accounts across participating financial entities.',
      guidance: 'If card credentials or OTP were entered, block your card immediately through your bank\'s mobile app or hotline, call Helpline 1930 within the initial hours to request CFCFRMS hold coordination, and file a report on cybercrime.gov.in. Note: Prompt reporting supports coordination and possible beneficiary-account holds; it does not guarantee that accounts will be frozen, funds will be recovered, or transactions will be reversed.'
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
          immediateTitle: 'Immediate Reaction: Deceptive Payment Authorization & Account Debit',
          immediateBody: 'Your UPI application opens a payment approval screen. The screen displays a payment or collect request for ₹8,500 directed to an unknown merchant VPA. By entering your secret UPI PIN, you do not receive funds—instead, you authorize a debit of ₹8,500 from your linked bank account to the recipient account, completing a fraudulent transaction induced by deception.',
          escalatedTitle: 'Potential Later Escalation: Double-Debit "Reversal" Scam',
          escalatedBody: 'When you notice ₹8,500 deducted, the buyer immediately calls back expressing shock, claiming "a server glitch reversed the payout into a debit." He immediately sends a second QR code for ₹17,000, promising that scanning it will "reverse both transactions and refund ₹25,500." Victims trapped in panic often scan again, doubling their losses.',
          impactAssessment: Object.freeze({
            financialExposure: 'Immediate direct debit of ₹8,500 (or ₹25,500+ if secondary reversal scam is accepted).',
            accountSafety: 'At Risk',
            legalConsiderations: 'Distinguish between two distinct legal and operational situations: (1) An unauthorised electronic banking transaction, where Part D of the RBI (Commercial Banks – Responsible Business Conduct) Directions, 2025 governs customer liability for covered commercial banks, including the customer-negligence rules in Paragraph 68; and (2) A customer-approved UPI push payment induced by deception, where the customer affirmatively entered their PIN and approved the payment. Part D specifically concerns unauthorised electronic transactions and is not automatically applicable to determine liability or reimbursement for a customer-approved UPI payment merely because deception occurred. Instead, dispute resolution and potential recovery depend on the applicable payment-system dispute framework, issuer rules, specific transaction facts, and bank investigation findings; zero liability or guaranteed reimbursement cannot be promised.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'In the UPI framework, entering a secret PIN authorizes outgoing payments and debits from your linked bank account; receiving incoming transfers requires no PIN entry or payment approval from the recipient.',
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
          immediateBody: 'You inform the buyer: "Entering a UPI PIN authorizes payments, not receipts. To send money, transfer it directly to my registered UPI mobile number without sending a collect request or QR code." Knowing their exploit is unmasked, the scammer immediately disconnects the chat and deletes their profile.',
          escalatedTitle: 'Potential Later Escalation: Evidence Logged & Community Protected',
          escalatedBody: 'You capture screenshots of the chat, the buyer\'s claimed defense profile, and the fraudulent QR code image. You report the user to the classifieds marketplace safety team and submit the phone number to the Chakshu facility on Sanchar Saathi. Your funds and bank details remain completely secure.',
          impactAssessment: Object.freeze({
            financialExposure: 'None. Zero financial loss.',
            accountSafety: 'Secure',
            legalConsiderations: 'Active verification prevents fraudulent inducement, preserves evidentiary records, and maintains an uncompromised legal position.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'UPI transfers to a mobile number or VPA credit the recipient\'s account directly without requiring recipient authentication.',
            psychologicalFactor: 'Firm adherence to the rule that receiving funds never requires entering a PIN neutralizes deceptive payment requests.'
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
        act: 'Reserve Bank of India (Commercial Banks – Responsible Business Conduct) Directions, 2025',
        section: 'Part D: Limiting Liability of Customers in Unauthorised Electronic Banking Transactions (Comparative Regulatory Reference)',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Operative regulatory framework governing customer liability in unauthorised electronic banking transactions for covered commercial banks.',
        applicabilityNote: 'Provided as a comparative regulatory reference. Part D of the RBI (Commercial Banks – Responsible Business Conduct) Directions, 2025 sets forth the customer liability framework for unauthorised electronic banking transactions across covered commercial banks, including Paragraph 68 rules on customer negligence. However, Part D specifically concerns unauthorised transactions and is not automatically applicable to a customer-approved UPI push payment where the user entered their PIN to approve the transfer under social-engineering deception. For customer-approved payments induced by fraud, dispute resolution and liability depend on applicable payment-system dispute mechanisms, issuer policies, transaction facts, and bank investigation findings rather than automatic Part D unauthorised-transaction protections. Prompt notification to Helpline 1930 and the bank supports possible CFCFRMS beneficiary-account hold coordination without guaranteeing reimbursement.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS facilitates inter-bank communication to request possible holds on beneficiary accounts across participating financial entities.',
      guidance: 'If you entered your UPI PIN and completed a deceptive payment, call 1930 immediately within the initial hours to log transaction details (including the UTR reference number) for CFCFRMS hold coordination, notify your bank to dispute the fraudulent transaction, and submit an incident report at cybercrime.gov.in. Note: Prompt reporting supports coordination and possible beneficiary-account holds; it does not guarantee that accounts will be frozen, funds will be recovered, or transactions will be reversed.'
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
          immediateTitle: 'Immediate Reaction: Financial Transfer & Escalating Demands',
          immediateBody: 'Fearing immediate arrest, you execute the requested ₹50,000 transfer. Rather than closing the matter, the caller escalates demands, claiming that further suspicious accounts linked to your identity have been detected and ordering you to remain isolated on video while arranging additional payments.',
          escalatedTitle: 'Potential Later Escalation: Cumulative Financial Loss & Coercive Isolation',
          escalatedBody: 'Coercive isolation tactics may continue as long as the perpetrator perceives an ability to extract funds. Once the perpetrator severs contact, recovering transferred funds becomes difficult because payments are rapidly moved across multiple accounts. Contacting family or legal counsel is often delayed by shame and fear.',
          impactAssessment: Object.freeze({
            financialExposure: 'Immediate loss of transferred funds, with significant risk of further demands if coercion continues.',
            accountSafety: 'Compromised',
            legalConsiderations: 'Voluntary fund transfers executed under intimidation represent extortion and cheating by personation under BNS and IT Act. Inter-bank coordination via 1930 may assist hold requests, but fund recovery is not guaranteed.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Modern VoIP tools, forged letterheads, and video background props allow remote criminals to stage convincing pseudo-governmental environments.',
            psychologicalFactor: 'Exploitation of fear of legal authority, public disgrace, and physical confinement, amplified by coercive isolation that forbids consulting third parties.'
          })
        })
      }),

      Object.freeze({
        id: 'choice-arrest-inaction',
        label: 'Stay on the video call, argue your innocence, and attempt to plead with the caller for leniency',
        choiceType: 'passive-inaction',
        shortAction: 'Remained connected on video pleading innocence without disconnecting or verifying',
        consequence: Object.freeze({
          immediateTitle: 'Immediate Reaction: Prolonged Coercive Intimidation',
          immediateBody: 'You remain on the video call attempting to convince the caller of your innocence. The caller exploits your ongoing engagement to display forged legal documents and emblems on camera, shouting and threatening to notify employers or local officers, attempting to wear down your emotional resistance.',
          escalatedTitle: 'Potential Later Escalation: Heightened Risk of Concession Under Duress',
          escalatedBody: 'Prolonged exposure to intimidation and isolation impairs critical decision-making. Staying on the call allows the perpetrator to escalate pressure tactics, substantially increasing the risk that the learner might eventually yield to fraudulent payment demands to alleviate fear.',
          impactAssessment: Object.freeze({
            financialExposure: 'Substantial risk of eventual financial transfer if intimidation continues unmitigated.',
            accountSafety: 'At Risk',
            legalConsiderations: 'Engaging with an impersonator confers practical leverage on fraudulent threats; severing the communication channel is the most effective immediate defense.'
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
          immediateTitle: 'Immediate Reaction: Coercive Loop Broken Instantly',
          immediateBody: 'You recognize that a caller claiming to place you under "Digital Arrest" and demanding transfers to private accounts is not exercising lawful authority. You terminate the video call immediately. The scammer may attempt repeated callbacks from various numbers; you decline and block them, regaining composure.',
          escalatedTitle: 'Potential Later Escalation: Independent Channel Verification & Reporting',
          escalatedBody: 'You preserve the call records and screenshots, then independently contact the relevant police station or official authority through contact details obtained from verified government sources (not contact numbers provided by the caller). You report the impersonation attempt to the National Cybercrime Helpline 1930 and cybercrime.gov.in.',
          impactAssessment: Object.freeze({
            financialExposure: 'Zero. No funds or credentials transmitted.',
            accountSafety: 'Secure',
            legalConsiderations: 'Terminating the call terminates the coercive attempt. Seeking independent verification through verified official channels preserves safety and legal clarity.'
          }),
          whyItHappened: Object.freeze({
            technicalFactor: 'Hanging up terminates the attacker\'s sole communication and surveillance channel over the victim.',
            psychologicalFactor: 'Recognizing that "Digital Arrest" and demands for transfers to private "safe" accounts are hallmark scam indicators breaks psychological leverage.'
          })
        })
      })
    ])
  }),

  defensiveTakeaway: Object.freeze({
    coreRule: 'While legitimate judicial proceedings may use authorized video-conferencing processes under law (such as BNSS Section 530), a caller claiming to place you under "Digital Arrest" through a video call is not exercising lawful arrest authority, and demands to transfer money to private verification, safe, or escrow accounts to avoid arrest are unequivocal indicators of fraud.',
    actionableSteps: Object.freeze([
      'Never transfer money to any account claiming to be a "government verification," "safe," or "court escrow" account to avoid arrest.',
      'Immediately disconnect any video call from individuals claiming to place you under "Digital Arrest"—this term has no legal basis in Indian law.',
      'If you need to verify an official inquiry, independently contact the relevant police station or authority through contact details obtained from verified government sources.',
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
        section: 'Chapter V (Sections 35–62), Chapter VI (Sections 63–93) & Section 530',
        status: 'PROCEDURAL_STATUTE',
        plainSummary: 'Statutory criminal procedure governing arrest, processes to compel appearance, and electronic proceedings.',
        applicabilityNote: '"Digital Arrest" has no basis in Indian law. Arrest procedures are strictly governed by BNSS Chapter V (Sections 35–62). While BNSS Section 530 permits trials, inquiries, and proceedings to be conducted electronically (including by audio-video electronic means) pursuant to court rules, a caller claiming to effect an arrest over a video call is not exercising lawful arrest authority. Furthermore, under BNSS Section 35(3), an investigating police officer may issue a written notice to appear during investigation under Chapter V; this is distinct from a court summons under Chapter VI (Sections 63–93), with applicable savings under Section 531. Demanding transfers to private "safe" or "verification" accounts to avoid arrest is a hallmark fraud indicator.'
      })
    ]),
    officialReportingProtocol: Object.freeze({
      primaryChannel: '1930',
      reportingPortalUrl: 'https://cybercrime.gov.in',
      coordinationMechanism: 'CFCFRMS facilitates inter-bank communication to request possible holds on beneficiary accounts across participating financial entities.',
      guidance: 'If money was transferred, call 1930 immediately to log transaction details for CFCFRMS hold coordination, notify your bank\'s fraud desk, and lodge an immediate complaint on cybercrime.gov.in. Note: Prompt reporting supports coordination and possible beneficiary-account holds; it does not guarantee that accounts will be frozen, funds will be recovered, or transactions will be reversed.'
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
