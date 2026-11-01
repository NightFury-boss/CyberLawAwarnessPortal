/**
 * 12 Original, Comprehensive Learning Modules for the Cyber Law Awareness Portal
 * Tracks: Foundations, Recognizing Threats, Indian Cyber Law, Defensive Practice
 */

const learningModulesData = [
  // =========================================================================
  // TRACK 1: FOUNDATIONS
  // =========================================================================
  {
    title: 'Understanding Your Digital Identity',
    slug: 'digital-identity-foundations',
    category: 'Foundations',
    summary: 'Learn how digital identifiers (IP addresses, cookies, browser fingerprints, email, and phone numbers) construct your online footprint, how data brokers harvest them, and how Indian legal standards protect your identity.',
    content: `Every action you take across the internet leaves an indelible digital footprint. This module explains the mechanics of digital telemetry, browser fingerprinting, and how individual data points are aggregated into persistent consumer profiles. We explore your legal rights under Indian cyber laws and practical steps to maintain privacy.`,
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    order: 1,
    icon: 'Fingerprint',
    keyTakeaways: [
      'Digital identity extends beyond explicit identifiers (name, PAN, Aadhaar) to telemetry such as device fingerprints, canvas rendering hashes, and IP history.',
      'Data brokers correlate disparate datasets to construct predictive behavioral dossiers without explicit individual awareness.',
      'Unauthorized access, harvesting, or extraction of personal computer data violates Section 43 of the Information Technology Act, 2000.',
      'The Digital Personal Data Protection Act, 2023 establishes statutory consent obligations for data fiduciaries handling personal identifiers.'
    ],
    sections: [
      {
        title: '1. What Constitutes Your Digital Identity?',
        content: `When most people think of digital identity, they think of credentials they actively choose: a username, an email address, or a profile picture. In reality, your digital identity is composed of two distinct layers:

1. **Declared Identity**: Information you knowingly provide — your full name, mobile number, date of birth, educational credentials, and government identifiers such as Aadhaar or PAN.
2. **Ambient & Telemetric Identity**: Data collected silently through your digital interaction — your public IP address, browser User-Agent string, device hardware specifications, battery status API readings, screen resolution, time zone, and web cookies.

When combined, ambient data points form a unique composite profile that can track your activity across thousands of unrelated websites without you ever typing your name.`
      },
      {
        title: '2. Device Fingerprinting and Cross-Site Tracking',
        content: `Traditional tracking relied on HTTP cookies stored in your browser. As users began clearing cookies, ad-tech platforms and surveillance syndicates developed **browser fingerprinting**.

By executing short JavaScript commands, a website can query your browser's supported audio codecs, installed system fonts, WebGL graphics rendering quirks, and CPU concurrency. Because every computer has a subtly different combination of software and hardware, this generates an almost unique mathematical hash — your browser fingerprint.

Even if you switch to 'Incognito' or 'Private Browsing' mode, your hardware and screen properties remain identical. Private browsing clears cookies on exit, but it does not alter your underlying device fingerprint.`
      },
      {
        title: '3. Legal Framework: Indian Statutory Protections',
        content: `Under Indian jurisprudence, digital identity and personal privacy are protected through multiple statutory layers:

- **IT Act Section 43**: Penalizes anyone who without permission downloads, copies, or extracts data from any computer resource. If an entity scrapes or steals your personal database without authorization, civil compensation can be claimed before the State IT Adjudicating Officer.
- **IT Act Section 66C**: Makes identity theft a criminal offence punishable with up to 3 years imprisonment for anyone who fraudulently or dishonestly uses another person's electronic signature, password, or unique identification feature.
- **DPDP Act, 2023 (Section 6)**: Requires data fiduciaries to obtain clear, unbundled, and informed consent before processing any personal data, providing citizens with rights to access, correction, and erasure.`
      },
      {
        title: '4. Practical Identity Hygiene: Steps You Can Take',
        content: `Protecting your digital identity requires proactive, intentional reduction of your digital footprint:

- **Audit Connected Accounts**: Check your Google, Apple, and social media account settings quarterly to revoke third-party app permissions for services you no longer use.
- **Use Encrypted DNS and Tracker Blocking**: Enable DNS-over-HTTPS (DoH) with built-in ad and tracker blocking on your home router and mobile devices.
- **Separate Personas**: Maintain separate email addresses for financial banking, professional communication, and casual web sign-ups or newsletters.`
      }
    ],
    quickCheck: {
      question: 'Which of the following describes how browser fingerprinting tracks a user across websites without using cookies?',
      options: [
        'It queries device attributes like screen resolution, installed fonts, and WebGL rendering to create a unique mathematical hash',
        'It downloads the user\'s physical Aadhaar card stored on their hard drive',
        'It requires the user to log into their government email address on every tab',
        'It reads the user\'s router admin password over plain HTTP'
      ],
      correctIndex: 0,
      explanation: 'Browser fingerprinting aggregates diverse hardware and software parameters (screen resolution, system fonts, WebGL rendering, CPU cores) into a composite hash that remains consistent even in incognito mode without relying on HTTP cookies.'
    },
    actionSteps: [
      'Navigate to your Google or Apple security settings and review all third-party apps with account access.',
      'Switch your browser default search engine to a privacy-first option that does not track your search history.',
      'Enable Encrypted DNS (DNS-over-HTTPS) on your personal smartphone and web browsers.'
    ],
    relatedLawSections: ['Section 43', 'Section 66C', 'DPDP Section 6'],
    relatedCyberCrimes: ['identity-theft', 'credential-theft'],
    relatedScenarios: ['baseline'],
    relatedCaseStudies: ['phishing-credential-takeover'],
    relatedResources: ['https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf'],
    published: true
  },
  {
    title: 'Passwords, MFA and Passkeys',
    slug: 'passwords-mfa-passkeys',
    category: 'Foundations',
    summary: 'Explore why traditional passwords fail against credential stuffing and rainbow tables, how multi-factor authentication (MFA) creates defense-in-depth, and why cryptographic passkeys (FIDO2/WebAuthn) neutralize phishing.',
    content: `Authentication is the digital gatekeeper to your financial, professional, and personal assets. This module demystifies credential-stuffing attacks, contrasts SMS-based OTPs with time-based authenticators, and explains the cryptographic architecture of modern FIDO2 passkeys.`,
    difficulty: 'Beginner',
    estimatedMinutes: 7,
    order: 2,
    icon: 'Key',
    keyTakeaways: [
      'Reusing the same password across multiple sites ensures that a single data breach compromises every account you own (Credential Stuffing).',
      'SMS-based OTP is vulnerable to SIM-swapping, SS7 interception, and social-engineering phishing pages.',
      'Hardware security keys and FIDO2 passkeys are cryptographically bound to the website domain, making them immune to fake phishing websites.',
      'Under IT Act Section 66C, the fraudulent acquisition and use of passwords and authentication credentials carries up to 3 years imprisonment.'
    ],
    sections: [
      {
        title: '1. Why Passwords Alone Have Failed',
        content: `For decades, the standard authentication method was a secret string of text. However, password security suffers from an inherent human limitation: users choose passwords they can remember, and they reuse those passwords across dozens of services.

When an obscure e-commerce website suffers a database breach, attackers harvest millions of email-and-password pairs. Through automated bots, they perform **credential stuffing** — testing those stolen credentials against banking portals, email providers, and social platforms. If you reuse your password, an attacker can compromise your primary email and bank without ever hacking your bank directly.`
      },
      {
        title: '2. Multi-Factor Authentication: The Defense Layers',
        content: `Multi-Factor Authentication (MFA) requires evidence from at least two different categories:
- **Something you know**: A password or PIN.
- **Something you have**: A smartphone authenticator app or hardware token.
- **Something you are**: Biometrics such as a fingerprint or facial geometry.

While SMS OTP is widely used in India, it is the weakest form of second factor due to SIM-swap fraud and malicious SMS-stealing apps. Dedicated authenticator apps (such as Google Authenticator, Microsoft Authenticator, or Aegis) generate Time-Based One-Time Passwords (TOTP) entirely offline, eliminating telecom network vulnerabilities.`
      },
      {
        title: '3. The Passkey Revolution: Eliminating Phishing',
        content: `Passkeys represent the biggest leap in online security in twenty years. Built on the open **FIDO2 / WebAuthn** standard, a passkey replaces passwords with public-key cryptography:

1. When you register with a website, your device generates a unique public-private key pair.
2. The public key is sent to the website; the private key never leaves your secure device hardware (Secure Enclave or TPM).
3. To log in, the website sends a cryptographic challenge. Your device signs the challenge using biometric verification (Face ID or fingerprint).

**Why Passkeys Neutralize Phishing:** The browser automatically cryptographically binds the authentication request to the exact domain in the URL bar. If you are tricked into visiting a fake website (e.g. \`login-secure-bank.com\`), your device detects that the domain does not match your stored passkey for \`bank.com\` and refuses to sign the challenge!`
      },
      {
        title: '4. Immediate Action Checklist',
        content: `Transitioning to modern authentication takes less than an hour:
- Install a reputable password manager (e.g., Bitwarden, 1Password) to generate unique 16+ character passwords for every account.
- Upgrade high-value accounts (Google, Apple, Microsoft, banking) from SMS OTP to app-based authenticators or passkeys.
- Store emergency backup codes in a secure, offline physical location.`
      }
    ],
    quickCheck: {
      question: 'Why are FIDO2 passkeys fundamentally resistant to remote phishing websites?',
      options: [
        'They cryptographically bind authentication to the verified domain in the browser bar, refusing to release signatures to cloned URLs',
        'They require entering your mother\'s maiden name before every login',
        'They send an encrypted SMS message through the Department of Telecommunications',
        'They delete your account if an incorrect password is entered three times'
      ],
      correctIndex: 0,
      explanation: 'Under the FIDO2/WebAuthn standard, your device evaluates the actual origin domain communicated by the browser. If the domain does not match the registered domain, the private key will never sign the challenge, rendering phishing pages completely useless.'
    },
    actionSteps: [
      'Install a reputable password manager and audit your accounts for reused or breached passwords.',
      'Enable an authenticator app (TOTP) or register a passkey for your primary email and cloud accounts.',
      'Download and print offline account recovery codes for your primary identity providers.'
    ],
    relatedLawSections: ['Section 43', 'Section 66', 'Section 66C'],
    relatedCyberCrimes: ['credential-theft', 'fake-login-pages', 'account-takeover'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['phishing-credential-takeover'],
    relatedResources: ['https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf'],
    published: true
  },
  {
    title: 'Encryption, Hashing and Digital Signatures',
    slug: 'encryption-hashing-digital-signatures',
    category: 'Foundations',
    summary: 'Demystify the mathematical foundations of digital trust: symmetric vs. asymmetric encryption, one-way cryptographic hashes, and how digital signatures achieve legal non-repudiation under Indian law.',
    content: `Cryptography is the cornerstone of information security, electronic governance, and lawful digital transactions. This module explains how mathematical algorithms protect confidentiality, guarantee integrity, and provide legal non-repudiation under the Information Technology Act, 2000.`,
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    order: 3,
    icon: 'Shield',
    keyTakeaways: [
      'Encryption provides confidentiality; cryptographic hashing ensures tamper detection and integrity; digital signatures establish authenticity and non-repudiation.',
      'Symmetric encryption uses a single shared secret key, while asymmetric encryption pairs a public key with a private key.',
      'Under Sections 3 and 3A of the IT Act, 2000, electronic signatures backed by licensed Certifying Authorities carry legal parity with physical ink signatures.',
      'Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 requires digital records to be authenticated with evidence of hash integrity and origin.'
    ],
    sections: [
      {
        title: '1. Confidentiality: Symmetric vs. Asymmetric Encryption',
        content: `Encryption scrambles readable text (plaintext) into an unreadable format (ciphertext) using a mathematical algorithm and a cryptographic key.

- **Symmetric Encryption (e.g., AES-256)**: Both sender and receiver share the same secret key. It is computationally fast and used for encrypting files on hard drives or bulk network traffic. However, safely sharing the key between remote parties is difficult.
- **Asymmetric Encryption (e.g., RSA, ECC)**: Uses a mathematically linked key pair:
  - **Public Key**: Shared freely with the world. Anyone can use it to encrypt a message for you.
  - **Private Key**: Kept strictly secret by you. Only your private key can decrypt messages encrypted with your public key.

Modern protocols like TLS (HTTPS) combine both: asymmetric encryption safely negotiates a shared symmetric key, which then encrypts the ongoing web session at high speed.`
      },
      {
        title: '2. Integrity: Cryptographic Hash Functions',
        content: `A cryptographic hash function (such as SHA-256) takes an input of any size and produces a fixed-length string of characters (the hash or 'digest'). Hashes have three vital properties:

1. **Deterministic**: The same input always produces the exact same hash.
2. **One-Way (Pre-image Resistance)**: It is computationally infeasible to reverse a hash back to its original input.
3. **Avalanche Effect**: Changing even a single comma in a 500-page document completely changes the resulting hash.

When digital investigators extract evidence from a seized smartphone or server, they compute its SHA-256 hash immediately. If the hash matches months later at trial, it conclusively proves the electronic evidence was not modified or planted.`
      },
      {
        title: '3. Authenticity & Non-Repudiation: Digital Signatures in Indian Law',
        content: `A **digital signature** reverses asymmetric encryption to prove authorship. The sender hashes the document and encrypts the hash using their **private key**. Anyone can decrypt the hash using the sender's public key and compare it to the document. If it matches:
- The signer's identity is authenticated.
- The document has not been altered since signing.

**Legal Validity under the IT Act, 2000:**
- **Section 3 & 3A**: Grants statutory recognition to electronic signatures authenticated through asymmetric cryptosystems or reliable electronic signature techniques.
- **Section 5**: Gives digital signatures the same legal status and evidentiary validity as physical handwritten signatures.
- **Controller of Certifying Authorities (CCA)**: Regulates licensed agencies (e.g., eMudhra, NSDL, CDAC) that issue Digital Signature Certificates (DSC) to citizens, corporate directors, and judicial officers.`
      },
      {
        title: '4. Everyday Applications and Caveats',
        content: `Digital signatures power income tax filings, corporate MCA filings, e-tendering, and Aadhaar eSign.

**Crucial Warning:** Never share your DSC USB token or its PIN with third parties, tax consultants, or accountants. Because digital signatures provide legal **non-repudiation** (you cannot claim in court that someone else signed on your behalf), any contract or filing signed with your private key is legally presumed to be executed by you!`
      }
    ],
    quickCheck: {
      question: 'Under Indian law (IT Act Section 3 & 5), why does a digital signature provide non-repudiation in court?',
      options: [
        'Because the document hash is encrypted with the signer\'s unique private key, which only the registered holder legally possesses',
        'Because the signer\'s photo is embedded in the background of the PDF',
        'Because the document is printed on legal stamp paper and scanned',
        'Because an SMS notification was sent to the recipient\'s mobile'
      ],
      correctIndex: 0,
      explanation: 'Digital signatures rely on asymmetric cryptography. Because the private key is held exclusively by the subscriber and certified by a CCA-licensed authority, a valid signature proves the holder executed the document, legally preventing them from repudiating their consent.'
    },
    actionSteps: [
      'Check that every web page where you enter credentials or payment data displays "https://" with a valid security certificate.',
      'Never delegate custody of your Digital Signature Certificate (DSC) USB dongle or e-Sign credentials to intermediaries.',
      'When downloading sensitive software or files, verify the published SHA-256 checksum to ensure the download has not been corrupted or tampered with.'
    ],
    relatedLawSections: ['Section 43', 'BSA Section 63'],
    relatedCyberCrimes: ['identity-theft', 'malware'],
    relatedScenarios: ['baseline'],
    relatedCaseStudies: ['classified-marketplace-qr-fraud'],
    relatedResources: ['https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf'],
    published: true
  },

  // =========================================================================
  // TRACK 2: RECOGNIZING THREATS
  // =========================================================================
  {
    title: 'Understanding Phishing and Social Engineering',
    slug: 'phishing-social-engineering',
    category: 'Recognizing Threats',
    summary: 'Uncover psychological manipulation techniques used by cybercriminals, including artificial urgency, fear, authority impersonation, and pretexting across email, SMS, and messaging apps.',
    content: `Cybersecurity is as much about human psychology as it is about technology. Attackers know that human brains make fast, heuristic-driven decisions when placed under acute stress, artificial deadlines, or perceived authority. This module deconstructs social engineering patterns and equips you with actionable cognitive firewalls.`,
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    order: 4,
    icon: 'AlertTriangle',
    keyTakeaways: [
      'Social engineering exploits emotions — fear, greed, curiosity, and respect for authority — to bypass technical firewalls.',
      'Phishing URLs mimic legitimate brand names through typosquatting and deceptive subdomains (e.g., sbi.banking-alert.com vs. sbi.co.in).',
      'Under IT Act Section 66D, cheating by personation using a computer resource is punishable with imprisonment up to 3 years and a ₹1,00,000 fine.',
      'The 60-Second Rule: Pausing to inspect communication out-of-band stops over 95% of social engineering attacks.'
    ],
    sections: [
      {
        title: '1. The Psychology of Deception',
        content: `Phishing is rarely a technical exploit; it is a psychological trap. Attackers engineer communications to invoke what cognitive scientists call 'System 1 thinking' — fast, instinctual, and emotion-driven.

The four universal levers used by fraudsters are:
1. **Urgency**: "Your electricity connection will be disconnected at 9:30 PM tonight."
2. **Fear & Coercion**: "FIR registered against you for money laundering; join this video call immediately."
3. **Greed & Opportunity**: "You have been selected for a ₹5,000/day work-from-home YouTube liking job."
4. **Authority**: Posing as senior bank managers, telecom inspectors, or police officers to compel compliance.`
      },
      {
        title: '2. Deconstructing Attack Vectors: Email, SMS, and Calls',
        content: `Social engineering manifests across three primary electronic channels:

- **Phishing (Email)**: Spear-phishing targets specific employees or individuals using gathered OSINT (Open Source Intelligence). Attackers craft emails with spoofed headers or lookalike domain names.
- **Smishing (SMS)**: Text messages claiming courier deliveries have been put on hold due to missing house numbers, prompting victims to click shortened links (e.g. \`bit.ly\` or \`tinyurl\`).
- **Vishing (Voice Call)**: Scammers call claiming your SIM card is being deactivated or an unauthorized transaction occurred, instructing you to download remote desktop apps (AnyDesk, TeamViewer) to 'help' resolve it.`
      },
      {
        title: '3. Anatomy of a Malicious URL',
        content: `To spot phishing links, you must read URLs from right to left starting at the primary domain:

- **Real Domain**: \`https://onlinesbi.sbi/portal\` -> The core domain is \`sbi\`.
- **Phishing Domain 1**: \`https://onlinesbi.sbi.com.verification-portal.in\` -> The actual domain is \`verification-portal.in\`.
- **Phishing Domain 2**: \`https://sbi-kyc-update-portal.org\` -> An entirely separate unregistered domain created days earlier.

Always look at the domain name immediately preceding the first single slash (\`/\`). Subdomains located before the domain name can be named anything the attacker wants.`
      },
      {
        title: '4. The 60-Second Out-of-Band Verification Protocol',
        content: `Whenever an incoming message or call demands urgent action:
1. **Stop & Breathe**: Recognize that artificial urgency is a weapon designed to bypass your judgment.
2. **Do Not Click**: Never use the phone numbers, links, or attachments provided in the unsolicited message.
3. **Verify Out-of-Band**: Independently open your web browser or official app, find the verified customer care number or official portal, and initiate the contact yourself.`
      }
    ],
    quickCheck: {
      question: 'You receive an urgent SMS: "Dear Customer, your electricity will be disconnected tonight at 9:30 PM due to unpaid bill. Call officer at 9876543210 immediately." What is the correct response?',
      options: [
        'Ignore the SMS number completely; check your electricity bill status directly on your state discom official app or web portal',
        'Call the number immediately to explain you always pay your bills on time',
        'Send a screenshot of your bank passbook to the sender via WhatsApp to prove payment',
        'Click any link in the SMS to pay a ₹10 token fee to stop disconnection'
      ],
      correctIndex: 0,
      explanation: 'Fake electricity disconnection notices are widespread smishing scams exploiting fear and urgency. Legitimate electricity boards never provide personal mobile numbers in warning SMS or disconnect service without formal written notice. Always verify out-of-band via official portals.'
    },
    actionSteps: [
      'Examine the sender address of unexpected emails by clicking the display name to reveal the true email address.',
      'Never install remote desktop software (e.g., AnyDesk, TeamViewer, RustDesk) at the request of an unsolicited caller.',
      'Report suspicious SMS senders to the Department of Telecommunications on the Chakshu Portal (sancharsaathi.gov.in).'
    ],
    relatedLawSections: ['Section 66D', 'BNS Section 318', 'BNS Section 319'],
    relatedCyberCrimes: ['phishing', 'smishing', 'vishing', 'spear-phishing'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['phishing-credential-takeover', 'fake-support-call-fraud'],
    relatedResources: ['https://sancharsaathi.gov.in/sfc/'],
    published: true
  },
  {
    title: 'UPI, QR Code and Digital Payment Fraud',
    slug: 'upi-qr-payment-fraud',
    category: 'Recognizing Threats',
    summary: 'Master the fundamental rule of Indian digital payments: QR codes and UPI PINs are strictly for sending money, never for receiving funds. Learn how refund, marketplace, and collect request scams operate.',
    content: `Unified Payments Interface (UPI) revolutionized financial inclusion in India, processing billions of transactions monthly. However, fraudsters actively exploit consumer misunderstandings of how QR codes and UPI PINs work. This module solidifies the golden rules of digital payments and dissects common transaction scams.`,
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    order: 5,
    icon: 'CreditCard',
    keyTakeaways: [
      'The Golden Rule of UPI: Entering your UPI PIN or scanning a QR code ALWAYS transfers money OUT of your account; you never enter a PIN to receive money.',
      'Collect Requests sent to your UPI app are payment demands, not credit notifications.',
      'Classified marketplace scams frequently involve fraudsters posing as military or defense personnel sending reverse QR codes to "verify" accounts.',
      'Victims of unauthorized transactions must report immediately to the National Cybercrime Helpline 1930 within the 2-3 hour Golden Hour.'
    ],
    sections: [
      {
        title: '1. The Golden Rule of UPI Architecture',
        content: `UPI transactions are fundamentally asymmetric:
- **Sending Money (Push Transaction)**: Requires you to authenticate with your secret 4-digit or 6-digit UPI PIN.
- **Receiving Money (Credit)**: Does not require any action from you. Funds are routed directly into your bank account via your VPA (Virtual Payment Address) or mobile number.

**Memorize This Rule:**
If anyone asks you to enter your UPI PIN, scan a QR code, or approve a request in your payment app in order to **receive** a refund, lottery prize, salary, or marketplace payment — **it is 100% a scam**.`
      },
      {
        title: '2. The Deceptive "Collect Request" Trap',
        content: `UPI apps feature a 'Collect Request' mechanism designed for merchant checkouts. Scammers send a Collect Request disguised as a credit notification:
- The description field is crafted to read: *"Payment of Rs. 15,000 received from buyer"*.
- The user sees the amount and believes they are confirming receipt of the payment.
- In reality, tapping 'Approve' and typing their UPI PIN authorizes their bank to debit ₹15,000 to the fraudster's account.

Always read the button text carefully: if the button says **"Pay"** or asks for your **UPI PIN**, money is leaving your account.`
      },
      {
        title: '3. Classified Marketplace & Military Officer Scams',
        content: `A rampant cyber fraud across platforms like OLX, Quikr, and Facebook Marketplace targets people selling used furniture, electronics, or vehicles:

1. A buyer contacts the seller immediately without haggling on price.
2. The buyer claims to be an Army, Air Force, or CRPF officer stationed at a military base, sharing forged military ID cards to build patriotic trust.
3. The fraudster claims their official army bank account requires an "escrow QR code verification" to transfer the payment.
4. They send a QR code for ₹1 to "test the connection". When you scan it, ₹1 is deducted. The scammer quickly sends ₹2 back to build false confidence.
5. They then send a QR code for ₹25,000. When scanned, your account is debited ₹25,000, and the scammer cuts off communication.`
      },
      {
        title: '4. Physical Retail Tampering: Counter QR Swaps',
        content: `Digital payment fraud also occurs offline. Scammers visit busy street food vendors, cafes, or retail stores during peak hours. Pretending to be customers, they paste their own printed QR code sticker directly over the shop's legitimate merchant QR stand.

Payments made by innocent customers are routed to the fraudster's mule account until the merchant notices missing credits. When paying at physical counters, always verify that the merchant name displayed in your payment app matches the physical store's registered business name.`
      }
    ],
    quickCheck: {
      question: 'A buyer on an online marketplace offers to buy your old sofa for ₹10,000. They send you a QR code on WhatsApp saying "Scan this in PhonePe and enter your PIN to receive the ₹10,000 advance." What will happen if you do so?',
      options: [
        '₹10,000 will be instantly deducted from your bank account and transferred to the scammer',
        '₹10,000 will be safely credited to your bank account',
        'The transaction will be held in escrow by the military banking portal',
        'Nothing will happen because QR codes can only store website URLs'
      ],
      correctIndex: 0,
      explanation: 'Scanning a QR code and typing your UPI PIN is exclusively an authorization to debit funds from your account. You NEVER scan a QR code or enter your secret UPI PIN to receive money.'
    },
    actionSteps: [
      'Never enter your UPI PIN to claim cashback, rewards, marketplace payments, or refunds.',
      'Check the merchant display name on your phone screen before confirming payment at physical retail counters.',
      'If defrauded via UPI, immediately dial 1930 and contact your bank to place a lien hold on the recipient transaction reference.'
    ],
    relatedLawSections: ['Section 66D', 'BNS Section 318', 'BNS Section 319'],
    relatedCyberCrimes: ['upi-payment-fraud', 'qr-code-scams', 'marketplace-scams'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['classified-marketplace-qr-fraud', 'restaurant-qr-code-scam'],
    relatedResources: ['tel:1930', 'https://cybercrime.gov.in'],
    published: true
  },
  {
    title: 'Digital Arrest and Impersonation Scams',
    slug: 'digital-arrest-impersonation-scams',
    category: 'Recognizing Threats',
    summary: 'Detailed breakdown of the nationwide "Digital Arrest" extortion scheme, where fraudsters pose as police, CBI, ED, or customs officials over Skype or WhatsApp video calls to coerce victims into transferring life savings.',
    content: `The 'Digital Arrest' scam is one of the most psychologically devastating cyber syndicates operating across India, disproportionately targeting senior citizens, working professionals, and students. This module exposes the operational playbook of these syndicates and arms you with definitive statutory facts to neutralize intimidation.`,
    difficulty: 'Intermediate',
    estimatedMinutes: 7,
    order: 6,
    icon: 'ShieldAlert',
    keyTakeaways: [
      'Indian law contains no statutory provision for "Digital Arrest". Police, CBI, ED, NIA, or judicial courts never conduct trials or arrests via Skype or video calls.',
      'Government agencies never order citizens to transfer funds into "secret government verification accounts" to prove their innocence.',
      'Attackers use forged letterheads, artificial police backdrops, and continuous video confinement to isolate victims from family.',
      'Immediate countermeasure: Sever the call immediately, do not transfer any funds, and report the caller details to 1930 and cybercrime.gov.in.'
    ],
    sections: [
      {
        title: '1. The Myth of the "Digital Arrest"',
        content: `Under the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) and the Indian Constitution, an arrest is a formal, physical legal procedure governed by strict statutory safeguards:
- Police officers must carry clear identification and wear visible name tags.
- A physical **Arrest Memo** must be prepared with the signature of an independent witness and family member.
- The arrested person must be physically produced before a judicial Magistrate within 24 hours.

**There is no such thing as a "Digital Arrest" under any Indian statute.** No legal authority in India has the power to restrict your movement, confine you to your bedroom, or place you under custody via a smartphone or computer screen.`
      },
      {
        title: '2. The Operational Playbook of the Syndicate',
        content: `Digital arrest syndicates execute a rehearsed multi-stage script:

1. **The Interception Hook**: An automated IVR call claims a courier parcel (DHL, FedEx) sent in your name containing passports, credit cards, or narcotics (MDMA) was seized by customs in Mumbai or Delhi.
2. **Transfer to Fake Law Enforcement**: The call is immediately transferred to someone claiming to be an officer with the Crime Branch, CBI, or Cyber Cell.
3. **The Video Interrogation**: The victim is instructed to download Skype or WhatsApp Video. On camera, the attacker sits in a staged office featuring police emblems, walkie-talkies, and uniform insignia.
4. **The Forged Documents**: The fraudster displays fake arrest warrants, Supreme Court notices, or RBI asset seizure orders containing official-looking stamps and government seals.
5. **Continuous Confinement**: The victim is told they are under "digital custody" and forbidden from hanging up, leaving camera view, or consulting family members.`
      },
      {
        title: '3. The Climax: Financial Verification Extortion',
        content: `Once the victim is terrified and exhausted from hours of continuous interrogation, the fraudsters introduce the trap:

*"To verify that your money is not tied to hawala or terror financing, you must liquidate your fixed deposits and transfer all savings to a Supreme Court / RBI Secret Clearance Account. Once our financial intelligence unit verifies the funds within 24 hours, the money will be returned to your account with a clearance certificate."*

In reality, the destination account is a temporary **mule account** controlled by a money-laundering syndicate. The moment funds arrive, they are instantly dispersed across hundreds of secondary accounts and converted into cryptocurrency or cash withdrawals.`
      },
      {
        title: '4. The Definitive Defense: Hang Up and Report',
        content: `If you or a family member receive a call claiming you are under digital arrest:
1. **Hang Up Immediately**: Do not argue, do not ask questions, and do not explain yourself.
2. **Understand Reality**: Real police officers never conduct video trials or demand money to clear charges.
3. **Contact Local Police**: If you have doubts, walk into your nearest local police station in person.
4. **Dial 1930**: Report the phone numbers, Skype usernames, and bank details to the National Cybercrime Reporting Portal immediately.`
      }
    ],
    quickCheck: {
      question: 'A Skype video caller wearing a police uniform displays an "arrest warrant" bearing your name and orders you to transfer ₹3,00,000 into an "RBI verification account" while remaining on camera. What is the statutory truth?',
      options: [
        'Indian law does not recognize "digital arrest"; no police agency or court ever conducts trials over Skype or demands funds for asset verification',
        'You must transfer the money immediately to avoid being arrested by local police tomorrow',
        'You must stay on the video call until they issue a written digital bail receipt',
        'You must negotiate the verification fee down to ₹50,000'
      ],
      correctIndex: 0,
      explanation: 'Under Indian criminal procedure (BNSS, 2023), arrest is a physical process with mandatory statutory memos and Magistrate presentation. "Digital arrest" is a pure criminal fabrication. No Indian agency ever demands fund transfers to prove innocence.'
    },
    actionSteps: [
      'Educate elderly family members that government agencies and police NEVER interrogate citizens over Skype or demand money.',
      'Disconnect immediately if an unknown caller threatens legal action regarding an unknown parcel or bank account.',
      'Report any impersonation attempts to the Chakshu portal and file a report at cybercrime.gov.in.'
    ],
    relatedLawSections: ['Section 66D', 'BNS Section 319', 'BSA Section 63'],
    relatedCyberCrimes: ['digital-arrest-scam', 'online-impersonation'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['digital-arrest-impersonation'],
    relatedResources: ['tel:1930', 'https://cybercrime.gov.in'],
    published: true
  },
  {
    title: 'AI Voice Cloning and Deepfake Fraud',
    slug: 'ai-voice-cloning-deepfakes',
    category: 'Recognizing Threats',
    summary: 'How generative AI and neural voice cloning are weaponized for family emergency scams, executive impersonation, and non-consensual deepfakes, and how to verify authenticity using out-of-band communication.',
    content: `Recent breakthroughs in generative artificial intelligence have made synthetic audio and video generation accessible to cyber syndicates. With just three seconds of audio sampled from a social media reel or voice message, AI models can clone an individual's vocal timbre, pitch, and speech patterns. This module analyzes AI voice cloning and explains defensive protocols.`,
    difficulty: 'Intermediate',
    estimatedMinutes: 7,
    order: 7,
    icon: 'Radio',
    keyTakeaways: [
      'Generative AI models can clone a human voice using just 3-5 seconds of clean audio scraped from public social media videos.',
      'Voice clone scams weaponize emotional crises (kidnappings, traffic accidents, police detentions) to force hasty financial transfers.',
      'Under IT Act Section 66D and Section 66E, synthetic impersonation and non-consensual deepfake generation carry severe criminal penalties.',
      'The Family Safe Word: Establishing an offline, unwritten secret passphrase within your family neutralizes AI voice impersonation entirely.'
    ],
    sections: [
      {
        title: '1. How Voice Cloning Technology Works',
        content: `Neural audio synthesis models convert human speech into spectrogram representations, learning the unique acoustic nuances of an individual's vocal cords, accent, inflection, and breathing patterns.

Scammers scrape audio from Instagram reels, YouTube videos, podcast appearances, or voicemail recordings. Once cloned, the attacker types arbitrary text into a Text-to-Speech (TTS) engine, and the model outputs synthetic audio that sounds indistinguishable from the real person, even to close family members.`
      },
      {
        title: '2. The "Family Emergency" Exploitation Script',
        content: `The primary attack pattern targeting families follows this sequence:

1. **The Distressed Call**: A parent receives a call from an unknown number. The voice sounds exactly like their son or daughter studying in another city, sobbing frantically: *"Papa, I was in a terrible car accident, someone is seriously hurt, and the police have taken my phone. Please help me!"*
2. **The "Bail" Demand**: A second caller claiming to be an inspector or lawyer takes over the phone, demanding an immediate UPI transfer of ₹50,000 for medical bills or to avoid an official FIR.
3. **The Panic Trap**: Because the voice sounded genuinely like their child, parents often transfer funds without hanging up to verify.`
      },
      {
        title: '3. Video Deepfakes: Face Swapping and Lip Sync',
        content: `Beyond audio, deepfake video technology allows attackers to map a person's facial features onto another actor's face in real-time video calls. These are deployed in:
- **Corporate Executive Impersonation**: Tricking finance managers into wiring corporate funds during a video conference.
- **Non-Consensual Intimate Imagery (NCII)**: Superimposing a victim's face onto explicit content to extort money. Under Rule 3(2)(b) of the IT Intermediary Rules, 2021, platforms must remove such content within 24 hours of notification.`
      },
      {
        title: '4. Defensive Countermeasures: The Family Safe Word',
        content: `Technological defenses (like deepfake detectors) lag behind generative models. The most effective countermeasure is a low-tech social protocol:

- **Establish a Family Safe Word**: Agree on an offline, secret word or phrase known only to your immediate family. It should never be written down in digital notes, messaging apps, or shared online.
- **Demand the Safe Word**: If someone calls claiming to be a family member in an emergency, ask them for the safe word. A synthetic AI clone or imposter will not be able to answer.
- **Hang Up and Call Directly**: Always disconnect and dial your family member on their verified, regular phone number or contact their local roommate or hostel warden.`
      }
    ],
    quickCheck: {
      question: 'You receive a frantic call sounding identical to your brother claiming he was arrested in another city and needs ₹40,000 sent via UPI immediately. What is the most secure response?',
      options: [
        'Disconnect immediately, dial your brother on his known phone number, and ask for the agreed family safe word',
        'Transfer half the money immediately to show good faith while waiting for a case number',
        'Ask the caller to send a photo of his police cell on WhatsApp',
        'Record the audio and submit it to an online audio analysis forum for advice'
      ],
      correctIndex: 0,
      explanation: 'AI voice cloning makes audio cues untrustworthy. Disconnecting and dialing your relative directly on their verified regular number — and requesting an offline family safe word — immediately breaks the impersonation attempt without financial loss.'
    },
    actionSteps: [
      'Sit down with your immediate family members and establish an unwritten, secret family safe word for emergencies.',
      'Never send emergency funds to third-party accounts without independent out-of-band verification.',
      'Report AI deepfakes and morphed content immediately to cybercrime.gov.in and the intermediary platform under IT Rules Rule 3(2)(b).'
    ],
    relatedLawSections: ['Section 66D', 'Section 66E', 'BNS Section 318'],
    relatedCyberCrimes: ['deepfake-ai-impersonation', 'online-impersonation'],
    relatedScenarios: ['final'],
    relatedCaseStudies: ['ai-voice-cloning-family-emergency'],
    relatedResources: ['https://cybercrime.gov.in'],
    published: true
  },

  // =========================================================================
  // TRACK 3: INDIAN CYBER LAW
  // =========================================================================
  {
    title: 'Understanding the Information Technology Act',
    slug: 'it-act-fundamentals',
    category: 'Indian Cyber Law',
    summary: 'A comprehensive guide to India\'s primary cyber statute (IT Act, 2000), clarifying civil compensation under Section 43, criminal penalties under Sections 66, 66C, 66D, 66E, 67, and intermediary duties.',
    content: `The Information Technology Act, 2000 is the bedrock of digital law in India. Enacted pursuant to the UNCITRAL Model Law on Electronic Commerce, it provides legal validity for electronic transactions while prescribing both civil liabilities and criminal penalties for cyber offences. This module provides an authoritative statutory breakdown.`,
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    order: 8,
    icon: 'BookOpen',
    keyTakeaways: [
      'The IT Act separates civil infractions (Section 43 compensation) from criminal offences (Section 66 imprisonment).',
      'Under the 2008 Amendment, Section 43 civil compensation is uncapped; the State IT Adjudicating Officer handles claims up to ₹5 crore (Section 46(1A)).',
      'Sections 66C (identity theft) and 66D (cheating by personation) are the most frequently invoked provisions in cyber fraud prosecutions.',
      'Section 66A was struck down as unconstitutional by the Supreme Court in Shreya Singhal (2015) and cannot be used in any FIR or prosecution.'
    ],
    sections: [
      {
        title: '1. Architecture of the IT Act, 2000',
        content: `The IT Act, 2000 (amended extensively in 2008) serves three principal functions:
1. **Legal Recognition**: Recognizes electronic records, digital signatures, and electronic contracts on par with physical paper documents.
2. **Civil Regulatory Mechanism (Chapter IX)**: Establishes a quasi-judicial framework where victims of data extraction, system disruption, and malware injection can petition the State IT Adjudicating Officer (typically the State IT Secretary) for monetary compensation.
3. **Penal Code for Cyber Crimes (Chapter XI)**: Defines specific cyber offences and mandates imprisonment and fines.`
      },
      {
        title: '2. Civil Liability (Section 43) vs Criminal Offence (Section 66)',
        content: `Understanding the relationship between Section 43 and Section 66 is critical for legal literacy:

- **Section 43 (Civil Infraction)**: Applies when someone without permission accesses a computer, downloads/copies data, introduces viruses, disrupts computer systems, or denies access. Under Section 43, the wrongdoer is liable to pay damages by way of compensation to the affected person. Crucially, the 2008 Amendment removed the previous ₹1 crore ceiling, making compensation uncapped. Under Section 46(1A), the State Adjudicating Officer adjudicates claims up to ₹5 crore; claims exceeding ₹5 crore lie before the competent civil court.
- **Section 66 (Criminal Prosecution)**: If any act listed in Section 43 is committed **dishonestly or fraudulently** (as defined under the Penal Code), it becomes a criminal offence punishable with imprisonment up to 3 years, a fine up to ₹5,00,000, or both.`
      },
      {
        title: '3. Core Criminal Provisions: 66C, 66D, 66E, and 67',
        content: `Specific provisions govern everyday digital harms:

- **Section 66C (Identity Theft)**: Penalizes fraudulently using another's electronic signature, password, or biometric feature (up to 3 years imprisonment + ₹1,00,000 fine).
- **Section 66D (Cheating by Personation)**: Targets phishing, fake profiles, and online scams where attackers pretend to be someone else over a computer network (up to 3 years imprisonment + ₹1,00,000 fine).
- **Section 66E (Privacy Violation)**: Criminalizes capturing, transmitting, or publishing images of the private area of any person without consent (up to 3 years imprisonment or ₹2,00,000 fine).
- **Section 67 & 67B**: Penalizes publishing or transmitting obscene content in electronic form; Section 67B specifically imposes non-bailable prison terms up to 5-7 years for Child Sexual Abuse Material (CSAM).`
      },
      {
        title: '4. Landmark Jurisprudence: The Invalidation of Section 66A',
        content: `In the historic judgment *Shreya Singhal v. Union of India (2015) 5 SCC 1*, the Supreme Court struck down Section 66A in its entirety, ruling that penalizing "grossly offensive" or "annoying" electronic messages violated Article 19(1)(a) freedom of speech.

In 2022 (*PUCL v. Union of India*), the Supreme Court directed all States and police forces to immediately halt registering FIRs or prosecuting citizens under Section 66A. If a police officer attempts to file an FIR citing Section 66A today, it is legally invalid and void ab initio.`
      }
    ],
    quickCheck: {
      question: 'What is the current legal status of Section 66A of the Information Technology Act, 2000?',
      options: [
        'It was struck down as unconstitutional by the Supreme Court in Shreya Singhal (2015) and cannot be used in any police FIR or prosecution',
        'It is an active law carrying 7 years imprisonment for rude comments',
        'It was amended in 2024 to apply only to artificial intelligence companies',
        'It remains valid but requires permission from the Chief Minister to file an FIR'
      ],
      correctIndex: 0,
      explanation: 'Section 66A was declared unconstitutional and void ab initio by the Supreme Court in Shreya Singhal v. Union of India (2015) for violating free speech under Article 19(1)(a). The Supreme Court reiterated in PUCL v. UOI (2022) that no FIR or prosecution can proceed under this section.'
    },
    actionSteps: [
      'If your company or personal computer is breached, file a petition for compensation before your State IT Adjudicating Officer under Section 43.',
      'Ensure police cite active provisions (Section 66, 66C, 66D) rather than the struck-down Section 66A in any cybercrime FIR.',
      'Review the IT Rules, 2021 to understand grievance officer timelines when reporting offensive or abusive web content.'
    ],
    relatedLawSections: ['Section 43', 'Section 66', 'Section 66A', 'Section 66C', 'Section 66D', 'Section 66E', 'Section 67'],
    relatedCyberCrimes: ['credential-theft', 'identity-theft', 'malware', 'phishing'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['phishing-credential-takeover'],
    relatedResources: ['https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf'],
    published: true
  },
  {
    title: 'Digital Evidence and BSA Section 63',
    slug: 'digital-evidence-bsa-63',
    category: 'Indian Cyber Law',
    summary: 'Understanding the strict evidentiary standards for electronic records under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (replacing former IEA 65B), and how to prepare a legally valid certificate for court.',
    content: `In modern trials, cyber evidence — such as WhatsApp chats, bank SMS alerts, CCTV clips, email threads, and server logs — decides the outcome of cases. However, because digital files can be easily manipulated, Indian law imposes strict admissibility requirements. This module explains BSA Section 63 and how to preserve admissible evidence.`,
    difficulty: 'Advanced',
    estimatedMinutes: 8,
    order: 9,
    icon: 'FileText',
    keyTakeaways: [
      'Printed screenshots or exported chat files are legally inadmissible in Indian courts unless accompanied by a signed Section 63 certificate under the Bharatiya Sakshya Adhiniyam, 2023.',
      'BSA Section 63 replaces Section 65B of the repealed Indian Evidence Act, 1872 starting 1 July 2024.',
      'The certificate must comply with the BSA Schedule: Part A is executed by the device owner/operator, and Part B by an expert where technical extraction is performed.',
      'The certificate must specify device identifiers (IMEI, MAC address, cloud account identifier) and affirm that the system was operating properly.'
    ],
    sections: [
      {
        title: '1. Why Digital Evidence Requires Special Certification',
        content: `Unlike physical documents written in ink, electronic records (bits and bytes) are intangible and susceptible to silent tampering, altering of metadata, or spoofing.

Indian law treats the primary electronic record as the storage medium itself (the original phone or server). Because bringing an entire server or seizing a victim's everyday smartphone for years is impractical, the law permits **secondary electronic evidence** (printed transcripts, USB drive exports, CD/DVD copies) only if accompanied by an authoritative statutory certificate.`
      },
      {
        title: '2. The Transition from IEA 65B to BSA Section 63',
        content: `Effective 1st July 2024 via Gazette Notification S.O. 852(E), the Bharatiya Sakshya Adhiniyam, 2023 (BSA) replaced the colonial Indian Evidence Act, 1872.

Under **Section 63 of the BSA**, electronic records printed on paper or stored in optical/magnetic media are admissible without producing the original device, provided the conditions of Section 63(2) are satisfied:
1. The computer was used regularly to store or process information.
2. Information was regularly fed into the computer in the ordinary course of activities.
3. The computer was operating properly during the material period.
4. The duplicate reproduces or is derived from the information fed into the computer.`
      },
      {
        title: '3. Mandatory Certificate Requirements under Section 63(4)',
        content: `Section 63(4) mandates that electronic secondary evidence must be accompanied by a Certificate signed by:
- A person occupying a responsible official position in relation to the operation of the device or management of activities (custodian), OR
- An expert.

The certificate must follow the format prescribed in the **Schedule to the BSA**:
- **Part A (Certificate by Owner/Custodian)**: Details the personal device, make, model, operating system, IMEI or serial number, cloud account email, extraction date, and an affirmation that no unauthorized alterations were made.
- **Part B (Certificate by Expert)**: Completed by a forensic examiner or cyber cell officer when forensic disk imaging or hash verification (SHA-256) is conducted.`
      },
      {
        title: '4. How Victims Should Prepare Electronic Evidence',
        content: `If you are preparing evidence for a cybercrime complaint or court proceeding:
1. **Never Edit Screenshots**: Take full-screen screenshots displaying the date, time, battery level, sender phone number, and status bar. Do not crop or blur any section.
2. **Export Raw Files**: In WhatsApp, use "Export Chat without Media" to produce a clean text transcript with timestamps.
3. **Preserve Original Device**: Do not factory-reset your smartphone or delete the source messaging thread, as the defense may demand inspection of the original record under Section 63(3).`
      }
    ],
    quickCheck: {
      question: 'Under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023, what is required to make printed WhatsApp screenshots admissible as evidence in an Indian court?',
      options: [
        'A signed certificate in terms of the BSA Schedule specifying device details and proper operation',
        'A notarized stamp from the local municipal corporation',
        'A physical letter of approval from Meta/WhatsApp corporate headquarters',
        'No certificate is needed if the screenshot is printed in full color'
      ],
      correctIndex: 0,
      explanation: 'Under BSA Section 63(4) (replacing former IEA Section 65B), secondary electronic evidence is legally inadmissible unless accompanied by a statutory certificate (Part A/Part B of the BSA Schedule) affirming device particulars, lawful custody, and proper operation.'
    },
    actionSteps: [
      'When preserving chat evidence, export the complete chat transcript without editing or cropping screenshots.',
      'Record the IMEI number, serial number, and operating system version of any device used to capture evidence.',
      'Work with your legal counsel or cyber cell investigating officer to ensure the BSA Section 63 Schedule certificate is attached to the chargesheet.'
    ],
    relatedLawSections: ['BSA Section 63'],
    relatedCyberCrimes: ['upi-payment-fraud', 'marketplace-scams', 'identity-theft', 'sextortion'],
    relatedScenarios: ['final'],
    relatedCaseStudies: ['classified-marketplace-qr-fraud', 'digital-arrest-impersonation'],
    relatedResources: ['https://cybercrime.gov.in'],
    published: true
  },
  {
    title: 'Privacy, Personal Data and the DPDP Act',
    slug: 'privacy-dpdp-act-2023',
    category: 'Indian Cyber Law',
    summary: 'Explore the Digital Personal Data Protection Act, 2023: consent requirements, Data Fiduciary obligations, individual rights as a Data Principal, and the phased transition from IT Act Section 43A.',
    content: `The enactment of the Digital Personal Data Protection Act, 2023 (DPDP Act) marked a watershed moment in India's digital legal regime. Grounded in the landmark Supreme Court Puttaswamy judgment affirming privacy as a fundamental right, this module breaks down the rights of citizens, corporate responsibilities, and the ongoing statutory transition.`,
    difficulty: 'Intermediate',
    estimatedMinutes: 7,
    order: 10,
    icon: 'Lock',
    keyTakeaways: [
      'The DPDP Act establishes individuals as "Data Principals" and organizations processing data as "Data Fiduciaries".',
      'Consent must be free, specific, informed, unconditional, and withdrawable with clear notice in English and 22 scheduled Indian languages.',
      'Significant penalties of up to ₹250 crore can be levied by the Data Protection Board of India for failing to prevent personal data breaches.',
      'Section 43A of the IT Act remains currently operative until the corresponding DPDP rules and commencement provisions under Section 1(2) are officially gazetted.'
    ],
    sections: [
      {
        title: '1. Constitutional Origin and Legislative Purpose',
        content: `In *Justice K.S. Puttaswamy (Retd.) v. Union of India (2017) 10 SCC 1*, a nine-judge constitution bench of the Supreme Court held that the Right to Privacy is an intrinsic part of the Right to Life and Personal Liberty under Article 21 of the Indian Constitution.

The DPDP Act, 2023 was enacted to operationalize this constitutional guarantee, establishing a governance framework for digital personal data that balances individual rights with lawful data processing for legitimate purposes.`
      },
      {
        title: '2. Core Terminology and Architecture',
        content: `The DPDP Act defines key relationships in the digital economy:

- **Data Principal**: The individual to whom the personal data relates (citizens, consumers, employees).
- **Data Fiduciary**: Any entity or individual that determines the purpose and means of processing personal data (banks, e-commerce apps, hospitals, edtech platforms).
- **Significant Data Fiduciary (SDF)**: Entities designated by the Central Government based on the volume, sensitivity of data handled, or risk to electoral democracy and national security. SDFs must appoint an India-based Data Protection Officer (DPO) and conduct Data Protection Impact Assessments (DPIA).`
      },
      {
        title: '3. Rights of the Data Principal (Section 11-13)',
        content: `As a Data Principal, the Act endows you with enforceable statutory rights:
1. **Right to Access Information**: You have the right to obtain a summary of personal data being processed, the identities of all third parties with whom it was shared, and the processing activities.
2. **Right to Correction and Erasure**: You can demand correction of inaccurate data, updating of incomplete records, and erasure of data no longer necessary for the original purpose.
3. **Right of Grievance Redressal**: Data Fiduciaries must provide accessible grievance resolution mechanisms before a complaint is escalated to the Data Protection Board.
4. **Right to Nominate**: You can designate an individual to exercise your data rights in the event of death or incapacity.`
      },
      {
        title: '4. The Section 43A Transition and Staggered Commencement',
        content: `A critical legal point often misunderstood:
- Under Section 1(2) of the DPDP Act, provisions come into force on dates appointed by Central Government gazette notifications.
- While the Act received Presidential assent in August 2023, the full operationalization of the Data Protection Board and specific implementation rules are subject to phased gazetting.
- **Section 44(2)** of the DPDP Act slates Section 43A of the IT Act, 2000 (and the SPDI Rules 2011) for omission. **However, until the DPDP provisions are formally commenced via official gazette, Section 43A remains active and operative law** governing corporate liability for failing to protect sensitive personal data.`
      }
    ],
    quickCheck: {
      question: 'What is the current legal relationship between Section 43A of the IT Act and the DPDP Act, 2023?',
      options: [
        'Section 43A remains operative law until the relevant DPDP Act commencement notifications under Section 1(2) are officially gazetted',
        'Section 43A was completely abolished with retroactive effect to 2000',
        'The DPDP Act was rejected by Parliament and never passed',
        'Section 43A only applies to foreign multinational corporations'
      ],
      correctIndex: 0,
      explanation: 'Under Section 1(2) of the DPDP Act, 2023, provisions take effect through appointed gazette dates. Although Section 44(2) slates Section 43A for omission, Section 43A and its SPDI Rules remain in force as the active transitional liability regime until the corresponding DPDP sections are commenced.'
    },
    actionSteps: [
      'Review privacy policies when signing up for services to understand what personal data is collected and shared.',
      'Exercise your right to withdraw consent for marketing communications or excessive app tracking.',
      'File formal grievance requests with company Data Protection Officers if personal information is retained without justification.'
    ],
    relatedLawSections: ['DPDP Section 6', 'DPDP Section 11', 'Section 43A'],
    relatedCyberCrimes: ['identity-theft', 'credential-theft'],
    relatedScenarios: ['baseline'],
    relatedCaseStudies: ['phishing-credential-takeover'],
    relatedResources: ['https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf'],
    published: true
  },

  // =========================================================================
  // TRACK 4: DEFENSIVE PRACTICE
  // =========================================================================
  {
    title: 'Securing Your Smartphone and Digital Accounts',
    slug: 'securing-smartphones-and-accounts',
    category: 'Defensive Practice',
    summary: 'Practical, hands-on security measures for smartphones: SIM PIN protection against SIM swaps, sideloaded APK dangers, app permission audits, and biometrics locking on Aadhaar.',
    content: `Your smartphone is no longer just a communication device; it is your digital wallet, identification token, confidential workspace, and primary authentication anchor. If an attacker gains physical or remote control of your phone, they control your entire digital life. This module delivers tactical, immediate defensive hardening steps.`,
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    order: 11,
    icon: 'Smartphone',
    keyTakeaways: [
      'Setting a 4-digit SIM PIN prevents thieves from taking your physical SIM card and placing it into another phone to bypass SMS OTPs.',
      'Sideloading unknown Android APK files from Telegram or WhatsApp bypasses Play Protect and frequently installs accessibility-stealing spyware.',
      'Locking your biometrics on the official UIDAI portal completely prevents unauthorized AePS fingerprint withdrawals.',
      'Reviewing runtime permissions (SMS, Contacts, Accessibility, Camera) shuts down spyware exfiltration paths.'
    ],
    sections: [
      {
        title: '1. The SIM Card Vulnerability and the SIM PIN Defense',
        content: `Most people lock their phone screen with a PIN or fingerprint, but leave their physical SIM card completely unprotected.

If a thief steals your smartphone, they do not need to crack your screen lock. They simply eject your SIM card with a paperclip, insert it into their own phone, and request password resets across your banking apps, Google, and WhatsApp via SMS OTP!

**The Immediate Fix: Enable SIM PIN**
1. Go to **Settings > Security & Privacy > More Security Settings > SIM Card Lock**.
2. Enable **Lock SIM card**.
3. Enter your default carrier SIM PIN (commonly 1234 or 0000; verify with your telecom operator to avoid blocking).
4. Change it to a secret 4-digit PIN known only to you.
Now, if your SIM card is ejected and inserted into another device, it will refuse to connect to the cellular network without the PIN.`
      },
      {
        title: '2. The Danger of Sideloaded APK Files',
        content: `Android allows users to install application packages (.apk) outside the official Google Play Store. Fraud syndicates exploit this heavily in:
- **Instant Loan Apps**: Scammers send an APK file on WhatsApp claiming instant credit approval.
- **RTO/Challan Scams**: SMS messages claim an unpaid traffic challan with a link downloading \`VahanChallan.apk\`.
- **Dating and Matrimonial Apps**: Fraudsters share malicious APKs that request 'Accessibility Services' permissions.

Once granted, Accessibility permissions allow the malicious app to read all text on your screen, silently harvest incoming 2FA SMS OTPs, and even tap banking buttons without your knowledge.`
      },
      {
        title: '3. Locking Your Aadhaar Biometrics (AePS Defense)',
        content: `The Aadhaar Enabled Payment System (AePS) allows customers to withdraw money at micro-ATMs simply by stating their Aadhaar number and pressing their thumb on a scanner. Scammers who harvest fingerprint impressions from registry office documents use silicone duplicates to drain bank accounts.

**How to Neutralize AePS Fraud in 2 Minutes:**
1. Download the official **mAadhaar** app or visit the UIDAI portal (\`resident.uidai.gov.in\`).
2. Log in using your Aadhaar number and OTP.
3. Tap **Lock Biometrics**.
Once locked, no biometric authentication (fingerprint or iris) can occur through your Aadhaar. When you genuinely need to use your fingerprint (e.g. for a SIM activation), you can temporarily unlock it for 10 minutes via the app, after which it locks again automatically.`
      },
      {
        title: '4. App Permission Hygiene',
        content: `Perform a monthly audit of runtime permissions:
- **SMS Permission**: Only your primary SMS messaging app should have access. A calculator, flashlight, or photo editor never needs SMS access.
- **Accessibility Services**: Ensure zero third-party apps have accessibility access unless specifically required for assistive accessibility devices.
- **Microphone & Camera**: Set to "Allow only while using the app".`
      }
    ],
    quickCheck: {
      question: 'Why should every smartphone user enable a SIM PIN in their phone settings today?',
      options: [
        'It prevents a thief from removing your physical SIM card, putting it in their own phone, and intercepting SMS OTPs to reset your bank passwords',
        'It increases 5G internet speeds provided by the telecom operator',
        'It stops telecom companies from charging monthly roaming fees',
        'It automatically forwards all scam calls to the police cyber cell'
      ],
      correctIndex: 0,
      explanation: 'Without a SIM PIN, an ejected physical SIM card can be inserted into any other phone, allowing an attacker to receive your incoming SMS OTPs and reset your banking, email, and social media passwords without knowing your screen lock PIN.'
    },
    actionSteps: [
      'Enable SIM Card Lock in your phone settings and set a custom 4-digit SIM PIN.',
      'Log into the official UIDAI resident portal or mAadhaar app and enable Biometric Lock.',
      'Open your phone App Permissions manager and revoke SMS and Contacts permissions from all non-essential apps.'
    ],
    relatedLawSections: ['Section 43', 'Section 66B'],
    relatedCyberCrimes: ['sim-swapping', 'loan-app-extortion', 'malware'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['sim-swap-compromise', 'aeps-biometric-theft'],
    relatedResources: ['https://sancharsaathi.gov.in/sfc/'],
    published: true
  },
  {
    title: 'Reporting Cybercrime and Preserving Evidence in India',
    slug: 'reporting-cybercrime-evidence-preservation',
    category: 'Defensive Practice',
    summary: 'A tactical action manual for cybercrime victims: how to report to National Helpline 1930 within the Golden Hour, filing on cybercrime.gov.in, preserving raw headers and chat exports, and notifying your bank.',
    content: `When a cybercrime occurs, the first few hours determine whether stolen funds can be frozen or if the criminal trail goes cold. Knowing the exact institutional reporting architecture in India turns panic into effective action. This module outlines the step-by-step reporting manual for financial fraud and online harassment.`,
    difficulty: 'Beginner',
    estimatedMinutes: 8,
    order: 12,
    icon: 'PhoneCall',
    keyTakeaways: [
      'Dial 1930 immediately: Reporting financial fraud within the 2-3 hour "Golden Hour" allows the CFCFRMS system to coordinate inter-bank holds before funds are cashed out.',
      'Reporting to 1930 or your bank does not guarantee full fund recovery, but significantly increases the probability of halting mule transfers.',
      'Always file a formal complaint on the National Cybercrime Reporting Portal (cybercrime.gov.in) to receive an official Acknowledgement Number.',
      'Preserve uncropped evidence: export chat transcripts, take full-screen screenshots with timestamps, and download bank account transaction statements.'
    ],
    sections: [
      {
        title: '1. The Golden Hour and National Helpline 1930',
        content: `When cybercriminals steal money via UPI, Netbanking, or debit card, the funds are not immediately converted to cash. Instead, automated scripts move the money through a multi-tier chain of **mule bank accounts** within minutes.

**The Golden Hour (First 2-3 Hours):**
If you report the incident immediately by calling **1930** (National Cybercrime Toll-Free Helpline operated by I4C, Ministry of Home Affairs):
1. The 1930 operator records transaction details: your bank account number, the fraudster's UPI/account details, transaction UTR/reference number, and time.
2. The incident is lodged into the **Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS)**.
3. CFCFRMS automatically triggers real-time fraud alerts to the compliance desks of the destination banks, payment gateways, and wallet providers.
4. If the funds have not yet been withdrawn at an ATM or converted to cryptocurrency, the destination bank places an immediate temporary lien (freeze) on the funds.`
      },
      {
        title: '2. Step-by-Step Reporting on cybercrime.gov.in',
        content: `Following your 1930 call, you must file a formal electronic complaint on the official portal:

1. Visit **\`https://cybercrime.gov.in\`**.
2. Select **"Report Cyber Crime"** (or "Report Crime Related to Women/Child" for harassment or NCII matters).
3. Register using your mobile number and state.
4. Fill in incident details: Date and time of incident, social media platforms or phone numbers used by suspects, and transaction reference numbers.
5. Upload evidence files: Bank statements, full uncropped screenshots of chats, fake receipts, and SMS records.
6. Submit and save the **Acknowledgement Number (e.g., 2026...)**. This number is your official reference for police FIR registration and bank insurance claims.`
      },
      {
        title: '3. Immediate Bank Notification and the 3-Day Rule',
        content: `Under official Reserve Bank of India (RBI) consumer protection directives:
- If an unauthorized electronic transaction occurs due to third-party breach where neither the customer nor the bank is at fault, **zero customer liability** applies if reported within **3 working days**.
- If the customer was negligent (such as voluntarily sharing an OTP or clicking a link), liability rests with the customer until the transaction is reported to the bank; any further unauthorized transactions after notifying the bank carry zero customer liability.

**Action Required:** Immediately contact your bank's dedicated 24x7 fraud reporting helpline, request blocking of your debit card and internet banking credentials, and secure an official Complaint Ticket Number.`
      },
      {
        title: '4. Evidence Preservation Protocol for Investigation',
        content: `To build an ironclad case for police cyber cell investigators:
- **Do Not Delete Messages**: Never block or delete the fraudster's conversation until you have exported the full chat history.
- **Export Raw Email Headers**: In Gmail or Outlook, click "Show Original" to capture the IP address of the sender's mail server.
- **Full-Screen Captures**: Screenshot transactions showing the full status bar, battery, time, and complete URL bar.
- **Prepare BSA Section 63 Certificate**: Under the Bharatiya Sakshya Adhiniyam, 2023, prepare the mandatory Schedule certificate detailing your device make, model, and IMEI to accompany printed evidence.`
      }
    ],
    quickCheck: {
      question: 'You realize that ₹50,000 was debited from your bank account 15 minutes ago via an unauthorized transaction. What is your immediate most effective action?',
      options: [
        'Dial National Cybercrime Helpline 1930 immediately to trigger CFCFRMS inter-bank holds, and simultaneously notify your bank to freeze credentials',
        'Wait 48 hours for the official monthly paper statement to arrive by postal mail',
        'Post an angry complaint on social media without contacting any authorities',
        'Delete your banking app from your phone'
      ],
      correctIndex: 0,
      explanation: 'Dialing 1930 within the 2-3 hour "Golden Hour" inputs the transaction into the CFCFRMS network, alerting the receiving bank to freeze the stolen funds before the fraudster can cash out at an ATM, while simultaneously notifying your bank preserves zero-liability protections.'
    },
    actionSteps: [
      'Save the National Cybercrime Toll-Free Helpline number 1930 in your mobile contacts right now.',
      'Bookmark the official reporting portal https://cybercrime.gov.in and Department of Telecom Chakshu portal https://sancharsaathi.gov.in/sfc/.',
      'If victimized, document all transaction UTR numbers and screenshots immediately before contacting authorities.'
    ],
    relatedLawSections: ['Section 66D', 'BSA Section 63', 'Section 70B'],
    relatedCyberCrimes: ['upi-payment-fraud', 'digital-arrest-scam', 'phishing'],
    relatedScenarios: ['baseline', 'final'],
    relatedCaseStudies: ['phishing-credential-takeover', 'classified-marketplace-qr-fraud'],
    relatedResources: ['tel:1930', 'https://cybercrime.gov.in', 'https://sancharsaathi.gov.in/sfc/'],
    published: true
  }
];

module.exports = learningModulesData;

