const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./db');

// Import Models
const User = require('../models/User');
const LegalSource = require('../models/LegalSource');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const Resource = require('../models/Resource');
const UserProgress = require('../models/UserProgress');

async function seed(isReset = false) {
  try {
    console.log(`Seeding MongoDB database (Reset Mode: ${isReset})...`);
    await connectDB();

    // 1. Clear Existing Data ONLY if isReset is explicitly true (Destructive Reset)
    if (isReset) {
      console.log('- Destructive Reset: Clearing all collections...');
      await User.deleteMany({});
      await LegalSource.deleteMany({});
      await LawSection.deleteMany({});
      await CyberCrime.deleteMany({});
      await CaseStudy.deleteMany({});
      await Quiz.deleteMany({});
      await QuizQuestion.deleteMany({});
      await Scenario.deleteMany({});
      await ScenarioStage.deleteMany({});
      await ScenarioDecision.deleteMany({});
      await Resource.deleteMany({});
      await UserProgress.deleteMany({});
    }

    // 2. Create Users (Admin & User)
    console.log('- Seeding users...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberlawportal.test';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    
    let adminUser = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!adminUser) {
      adminUser = await User.create({
        fullName: 'Cyber Portal Security Admin',
        email: adminEmail.toLowerCase(),
        passwordHash: bcrypt.hashSync(adminPassword, 10),
        role: 'admin',
        isActive: true
      });
    }

    let demoUser = await User.findOne({ email: 'user@example.com' });
    if (!demoUser) {
      demoUser = await User.create({
        fullName: 'Rohan Sharma',
        email: 'user@example.com',
        passwordHash: bcrypt.hashSync('UserPass123!', 10),
        role: 'user',
        isActive: true
      });

      // Create progress profile
      await UserProgress.create({
        userId: demoUser._id,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 0
      });
    }

    // 3. Legal Sources
    console.log('- Seeding legal sources...');
    let sourceIndiaCode = await LegalSource.findOne({ title: /IT Act Legislative Text/ });
    if (!sourceIndiaCode) {
      sourceIndiaCode = await LegalSource.create({
        title: 'IT Act Legislative Text',
        authority: 'Ministry of Law and Justice, Government of India',
        url: 'https://www.indiacode.nic.in/handle/123456789/1999',
        sourceType: 'legislation',
        description: 'Official digital repository of Central Acts of the Indian Parliament.'
      });
    }

    let sourceShreyaSinghal = await LegalSource.findOne({ title: /Shreya Singhal/ });
    if (!sourceShreyaSinghal) {
      sourceShreyaSinghal = await LegalSource.create({
        title: 'Shreya Singhal v. Union of India Judgment (2015)',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in/jonew/judgments/shreya.pdf',
        sourceType: 'judgment',
        description: 'Supreme Court ruling striking down Section 66A of the IT Act as unconstitutional.'
      });
    }

    // 4. Law Sections
    console.log('- Seeding law sections...');
    const lawSectionsData = [
      {
        sectionNumber: 'Section 43A',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Compensation for failure to protect data',
        plainLanguageExplanation: 'If a corporate body deals with sensitive personal data and neglects reasonable security practices, causing wrongful loss or gain, they are liable to pay damages to affected users.',
        whyItMatters: 'Holds businesses accountable. If a service provider leaks your personal data or credit card numbers due to poor security, you can sue for compensation.',
        exampleScenario: 'An online delivery application stores customer credit cards in raw text. A database hack leaks 10,000 credit profiles. The company is liable under Section 43A.',
        penaltyOrLegalEffect: 'Civil compensation damages to victims. No statutory maximum upper limit.',
        legalStatus: 'current',
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66C',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for identity theft',
        plainLanguageExplanation: 'Criminalizes the fraudulent or dishonest use of another person\'s electronic signature, password, or unique identification features.',
        whyItMatters: 'Protects your digital profile assets. If a scammer hacks your account, steals your biometric patterns, or steals your Aadhaar/UPI credentials, it is a criminal offense under Section 66C.',
        exampleScenario: 'A roommate memorizes your phone login PIN and uses it to access your corporate chat. They send fake notices under your name.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years and a fine of up to ₹1,00,000.',
        legalStatus: 'current',
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66D',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for cheating by personation using computer resource',
        plainLanguageExplanation: 'Imposes penalties on individuals who use any communication device or computer network to cheat by pretending to be someone else.',
        whyItMatters: 'Covers most caller scams, profile impersonators, and phishing websites pretending to represent banks or institutions.',
        exampleScenario: 'A scammer creates a WhatsApp profile with your cousin\'s photo and texts you claiming a medical emergency to request funds.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years and a fine of up to ₹1,00,000.',
        legalStatus: 'current',
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66A',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for sending offensive messages through communication service (OMITTED)',
        plainLanguageExplanation: 'Previously criminalized sending messages that were deemed offensive, causing annoyance, or menacing. It was completely struck down by the Supreme Court of India in the Shreya Singhal (2015) judgment because its vague wording violated freedom of speech.',
        whyItMatters: 'Section 66A is OMITTED. It is unconstitutional and police cannot arrest or file FIRs against citizens under this section.',
        exampleScenario: 'Writing a post criticizing local municipal governance. Threatening arrest under Section 66A is illegal.',
        penaltyOrLegalEffect: 'Struck down and declared unconstitutional. Invalidated.',
        legalStatus: 'omitted',
        officialSourceId: sourceShreyaSinghal._id
      }
    ];

    for (let secData of lawSectionsData) {
      await LawSection.findOneAndUpdate(
        { sectionNumber: secData.sectionNumber },
        secData,
        { upsert: true, new: true }
      );
    }

    // 5. Cybercrime Categories
    console.log('- Seeding cybercrimes...');
    const crimesData = [
      {
        title: 'Phishing & Fake Sites',
        category: 'Phishing',
        whatIsIt: 'Phishing is a method where attackers send spoof communications (like emails, SMS, or direct messages) designed to look like trustworthy organizations to trick you into entering credentials.',
        howItWorks: 'Attackers create cloned websites (like a mock bank or service verification screen) and direct you to enter credentials or OTPs under the pretense of security reviews.',
        warningSigns: [
          'Urgent deadlines (threats of locking your profile in 2 hours)',
          'Mismatched domain names (e.g. login-sbi-portal.com instead of sbi.co.in)',
          'Generic salutations ("Dear Valued Customer") instead of your real name',
          'Requesting passwords or net OTP inputs on unsecured HTTP connections'
        ],
        actionSteps: [
          'Hover over hyperlinks to inspect the destination URL address',
          'Always verify if the domain matches the official government (.gov.in) TLD',
          'Enable Multi-Factor Authentication (MFA) to isolate your profile'
        ],
        avoidSteps: [
          'Do not click links inside unsolicited warning emails',
          'Never write passwords or credit numbers on unencrypted HTTP web pages'
        ],
        legalContext: ['Section 66C', 'Section 66D']
      },
      {
        title: 'UPI Payment & QR Fraud',
        category: 'UPI/Payment Scams',
        whatIsIt: 'UPI payment scams involve tricking individuals into scanning QR codes or entering PIN codes, falsely claiming that doing so will deposit cash back or rewards into their accounts.',
        howItWorks: 'A buyer on an escrow portal claims they want to send an advance payment. They send a custom QR code via chat and tell you to scan it. Entering your UPI PIN immediately authorizes an outgoing transaction.',
        warningSigns: [
          'Prompts that require you to scan a code and enter your PIN to "receive" or "refund" money',
          'Buyers who refuse meeting in person or using banking numbers directly',
          'High pressure to accept cash-back rewards via UPI links'
        ],
        actionSteps: [
          'Remember that UPI PIN is exclusively for authorizing debits (sending money), never for receiving credits.',
          'Always check the recipient\'s display name inside the secure payment gate interface before confirming.',
          'Report fraudulent transfers immediately within 1 hour by calling 1930.'
        ],
        avoidSteps: [
          'Do not scan QR codes sent by unknown online accounts under any circumstances.',
          'Never disclose your UPI PIN or banking details on private chat forums.'
        ],
        legalContext: ['Section 66D', 'Section 43A']
      }
    ];

    for (let crime of crimesData) {
      await CyberCrime.findOneAndUpdate({ title: crime.title }, crime, { upsert: true, new: true });
    }

    // 6. Case Studies
    console.log('- Seeding case studies...');
    const caseStudiesData = [
      {
        title: 'The Fictional Classified Marketplace QR Trap',
        slug: 'classified-marketplace-qr-fraud',
        incidentDescription: 'A student listed a camera for sale on an online marketplace. Within hours, a buyer claiming to be a military officer offered to purchase the device and wire an advance payment. The buyer sent a QR code via WhatsApp chat and instructed the seller to scan it to receive the payment. The seller scanned the code, inputted their UPI PIN, and immediately realized ₹15,000 had been debited from their account instead of credited.',
        incidentType: 'UPI/Payment Scams',
        victimImpact: 'Loss of ₹15,000, high anxiety, and failed recovery because the transaction was authorized with a PIN.',
        warningSigns: [
          'Buyer was highly urgent and refused in-person inspection of the product.',
          'Asserted that UPI PIN input was required to confirm a credit transaction.',
          'Sent transaction codes via WhatsApp instead of the marketplace app.'
        ],
        legalContext: ['Section 66D'],
        preventionTips: [
          'Understand that you never input PINs or scan codes to receive money on UPI.',
          'Decline transactions with buyers who refuse standard cash or bank account transfers.'
        ],
        lessonsLearned: 'Always verify buyer identities, and educate family members that typing a PIN is exclusively a payment command.',
        sources: ['National Cybercrime portal warnings']
      }
    ];

    for (let cs of caseStudiesData) {
      await CaseStudy.findOneAndUpdate({ slug: cs.slug }, cs, { upsert: true, new: true });
    }

    // 7. Quizzes
    console.log('- Seeding quizzes...');
    let quizPhish = await Quiz.findOne({ title: 'Phishing Prevention Challenge' });
    if (!quizPhish) {
      quizPhish = await Quiz.create({
        title: 'Phishing Prevention Challenge',
        category: 'Phishing',
        description: 'Test your ability to spot mock websites and spoof emails.',
        difficulty: 'Easy'
      });
    }

    const quizQuestionsData = [
      {
        quizId: quizPhish._id,
        questionText: 'Which of the following elements is the most reliable indicator of a secure, official website?',
        options: [
          'The logo of the organization displayed on the page.',
          'A lock icon in the browser address bar alongside an official verified HTTPS domain.',
          'A banner claiming the site is "Safe and Certified by RBI".',
          'The color scheme matching the company\'s official branding.'
        ],
        correctOptionIndex: 1,
        explanation: 'Visual elements like logos and banners are easily copied by hackers. The only verifiable check is the browser address bar checking for secure HTTPS and a correctly spelled official domain.',
        relatedLawSection: 'Section 66D'
      },
      {
        quizId: quizPhish._id,
        questionText: 'Under the Information Technology Act, 2000, what is the status of Section 66A?',
        options: [
          'It is an active law carrying a 3-year prison sentence for offensive texts.',
          'It has been omitted (struck down as unconstitutional by the Supreme Court).',
          'It covers cases of biometric identity theft.',
          'It governs UPI fraud damages.'
        ],
        correctOptionIndex: 1,
        explanation: 'Section 66A was declared unconstitutional by the Supreme Court of India in the Shreya Singhal case (2015) and is omitted from active legal enforcement.',
        relatedLawSection: 'Section 66A'
      }
    ];

    for (let qData of quizQuestionsData) {
      await QuizQuestion.findOneAndUpdate(
        { quizId: qData.quizId, questionText: qData.questionText },
        qData,
        { upsert: true, new: true }
      );
    }

    // 8. Scenario Engine Seeding (Baseline & Branching Final)
    console.log('- Seeding scenario engine nodes...');
    
    // Baseline Scenario Setup
    let scBase = await Scenario.findOne({ slug: 'baseline', version: 1 });
    if (scBase) {
      // Clean up previous stages & decisions to recreate graph correctly (safe because scenarios are configuration)
      const stages = await ScenarioStage.find({ scenarioId: scBase._id });
      for (let stg of stages) {
        await ScenarioDecision.deleteMany({ stageId: stg._id });
      }
      await ScenarioStage.deleteMany({ scenarioId: scBase._id });
      await Scenario.deleteOne({ _id: scBase._id });
    }

    scBase = await Scenario.create({
      title: 'Cyber Security Baseline Assessment',
      slug: 'baseline',
      code: 'baseline',
      description: 'Experience a simulated account security notification. Your decisions will establish your default defense habits and identify training goals.',
      version: 1,
      assessmentType: 'baseline',
      status: 'published',
      type: 'phishing',
      configuredWeights: {
        'Phishing awareness': 35,
        'Social engineering': 25,
        'URL verification': 20,
        'Credential safety': 20
      }
    });

    const stageBase1 = await ScenarioStage.create({
      scenarioId: scBase._id,
      stageOrder: 1,
      title: 'Suspicious Security Alert',
      description: 'You check your inbox in the morning and see a red alert from "BharatConnect Support Desk".',
      mockInterfaceType: 'email',
      mockInterfaceData: {
        senderName: 'BharatConnect Verification Desk',
        senderEmail: 'support-alert@bharatconnect-verify.in',
        subject: 'CRITICAL: Immediate Account Verification Required',
        body: 'Dear User,\n\nWe detected a security login attempt on your BharatConnect profile from St. Petersburg, Russia. To protect your linked accounts, you must click the link below and verify your identity within 2 hours. Failure to verify will result in permanent profile lock.',
        ctaText: 'Verify Account Identity Now',
        dateString: 'Today (3 mins ago)'
      },
      eventClassification: 'malicious',
      terminal: false
    });

    const stageBaseLogin = await ScenarioStage.create({
      scenarioId: scBase._id,
      stageOrder: 2,
      title: 'Unsecured Profile Verification Page',
      description: 'The verification button has redirected you to this form. Check the URL and indicators.',
      mockInterfaceType: 'website',
      mockInterfaceData: {
        title: 'BharatConnect Secure Login',
        url: 'http://bharatconnect-verify.in/secure/auth',
        warningText: 'Connection is not secure (HTTP)'
      },
      eventClassification: 'malicious',
      terminal: true // Stage 2 is terminal in this scenario
    });

    // Stage 1 Choices:
    const decBaseInspect = await ScenarioDecision.create({
      stageId: stageBase1._id,
      optionText: 'Inspect the sender email header, identify the fake domain (verify.in instead of .gov.in), and report the message.',
      scoreChange: 40,
      categoryScoreWeights: {
        'Phishing awareness': 40,
        'Social engineering': 30,
        'URL verification': 30
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: null, // Ends scenario successfully (direct route)
      explanation: 'Excellent action! You spotted the spoof domain header and reported it, isolating the threat.',
      outcomeType: 'correct'
    });

    const decBaseIgnore = await ScenarioDecision.create({
      stageId: stageBase1._id,
      optionText: 'Delete the email immediately and check your banking status manually through the official web app later.',
      scoreChange: 20,
      categoryScoreWeights: {
        'Phishing awareness': 20,
        'Social engineering': 10
      },
      riskLevel: 'low-risk',
      isCriticalMistake: false,
      nextStageId: null, // Ends scenario neutrally
      explanation: 'Deleting prevents immediate account compromise, although reporting is the best practice.',
      outcomeType: 'safe-action'
    });

    const decBaseClick = await ScenarioDecision.create({
      stageId: stageBase1._id,
      optionText: 'Click the "Verify Account Identity Now" link to review the security alert details.',
      scoreChange: -10,
      categoryScoreWeights: {
        'Phishing awareness': -20,
        'Social engineering': -20,
        'URL verification': -20
      },
      riskLevel: 'medium-risk',
      isCriticalMistake: false,
      nextStageId: stageBaseLogin._id, // Leads to login portal
      explanation: 'Clicking the link exposes you to cloned mock websites. Always inspect domain headers first.',
      outcomeType: 'unsafe-action'
    });

    // Stage 2 Choices:
    const decBaseSubmit = await ScenarioDecision.create({
      stageId: stageBaseLogin._id,
      optionText: 'Enter simulated login credentials and verification code to unlock your profile.',
      scoreChange: -30,
      categoryScoreWeights: {
        'Credential safety': -40,
        'Phishing awareness': -20
      },
      riskLevel: 'critical',
      isCriticalMistake: true,
      nextStageId: null, // Ends
      explanation: 'Entering passwords on unencrypted HTTP cloned sites is a critical mistake, exposing credentials to theft.',
      outcomeType: 'incorrect'
    });

    const decBaseClose = await ScenarioDecision.create({
      stageId: stageBaseLogin._id,
      optionText: 'Close the tab immediately after noticing the HTTP alert and mismatched browser URL.',
      scoreChange: 30,
      categoryScoreWeights: {
        'URL verification': 40,
        'Credential safety': 30
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: null, // Ends
      explanation: 'Smart escape. Recognizing HTTP connection alerts and fake domains prevents credentials theft.',
      outcomeType: 'correct'
    });

    // Link options to Stage 1 & 2
    await ScenarioStage.findByIdAndUpdate(stageBase1._id, {
      $push: { availableDecisionIds: [decBaseInspect._id, decBaseIgnore._id, decBaseClick._id] }
    });
    await ScenarioStage.findByIdAndUpdate(stageBaseLogin._id, {
      $push: { availableDecisionIds: [decBaseSubmit._id, decBaseClose._id] }
    });


    // Final Scenario Setup
    let scFinal = await Scenario.findOne({ slug: 'final', version: 1 });
    if (scFinal) {
      const stages = await ScenarioStage.find({ scenarioId: scFinal._id });
      for (let stg of stages) {
        await ScenarioDecision.deleteMany({ stageId: stg._id });
      }
      await ScenarioStage.deleteMany({ scenarioId: scFinal._id });
      await Scenario.deleteOne({ _id: scFinal._id });
    }

    scFinal = await Scenario.create({
      title: 'Cyber Security Final Assessment',
      slug: 'final',
      code: 'final',
      description: 'Navigate "A Day in Your Digital Life". Make sequential choices across mixed legitimate and suspicious situations.',
      version: 1,
      assessmentType: 'final',
      status: 'published',
      type: 'mixed',
      configuredWeights: {
        'Phishing awareness': 20,
        'Social engineering': 20,
        'Financial safety': 25,
        'Credential safety': 15,
        'Digital Hygiene': 20
      }
    });

    // Final Stage 1: Recruiter NDA email (Malicious)
    const stageFinal1 = await ScenarioStage.create({
      scenarioId: scFinal._id,
      stageOrder: 1,
      title: 'The Freelance Offer (Morning)',
      description: 'You receive an email from a recruiter offering a freelance assignment, with details inside an attached ZIP folder.',
      mockInterfaceType: 'email',
      mockInterfaceData: {
        senderName: 'Vikas Sen (Infotech HR)',
        senderEmail: 'hr@infotech-contracts.com',
        subject: 'Urgent: Freelance Developer NDA & Contract Setup',
        body: 'Hi Rohan,\n\nWe saw your repository work and want to hire you starting today. The payout is ₹80,000 for 2 weeks.\n\nPlease find the project specifications and NDA setup executable in the attached ZIP folder. Run it to get started.',
        attachmentName: 'NDA_agreement_contract.zip',
        dateString: '9:15 AM'
      },
      eventClassification: 'malicious',
      terminal: false
    });

    // Final Stage 2A: Browser patch alert (Legitimate Mixed Event!)
    const stageFinal2A = await ScenarioStage.create({
      scenarioId: scFinal._id,
      stageOrder: 2,
      title: 'System Security Update Notification (Afternoon)',
      description: 'Your browser outputs a local modal prompting you to download a critical security patch.',
      mockInterfaceType: 'browser',
      mockInterfaceData: {
        title: 'Google Chrome Update Service',
        url: 'chrome://settings/help',
        bodyText: 'A security patch is available. Please click Update to restart your browser and protect against active WebGL vulnerabilities.'
      },
      eventClassification: 'legitimate',
      terminal: false
    });

    // Final Stage 2B: Cloned CPU scareware warning (Malicious)
    const stageFinal2B = await ScenarioStage.create({
      scenarioId: scFinal._id,
      stageOrder: 2,
      title: 'Suspicious Software Update Prompt (Afternoon)',
      description: 'A pop-up window suddenly opens while browsing, claiming your computer is infected.',
      mockInterfaceType: 'website',
      mockInterfaceData: {
        title: 'Critical Windows System Warning',
        url: 'http://free-antivirus-scan.in/alert',
        bodyText: 'Your device registry is infected with spyware. Install our certified scanner to clean your CPU immediately!'
      },
      eventClassification: 'malicious',
      terminal: false
    });

    // Final Stage 3: QR concert payment (Malicious)
    const stageFinal3 = await ScenarioStage.create({
      scenarioId: scFinal._id,
      stageOrder: 3,
      title: 'Concert Tickets Checkout (Evening)',
      description: 'You are buying tickets from an online classified forum. The seller requests payments via their secure QR link.',
      mockInterfaceType: 'qr_code',
      mockInterfaceData: {
        title: 'QuickPay Merchant Escrow Gate',
        amount: '₹4,500',
        instructions: 'Scan this QR code using Paytm or Google Pay and enter your UPI PIN to claim tickets.'
      },
      eventClassification: 'malicious',
      terminal: true
    });

    // Decisions for Stage 1 (Recruiter ZIP)
    const decFinal1a = await ScenarioDecision.create({
      stageId: stageFinal1._id,
      optionText: 'Download the attachment, extract the ZIP file, and run the NDA setup script.',
      scoreChange: -30,
      categoryScoreWeights: {
        'Digital Hygiene': -30,
        'Social engineering': -10
      },
      riskLevel: 'critical',
      isCriticalMistake: true,
      nextStageId: stageFinal2B._id, // Goes to compromised path (2B)
      explanation: 'Running executable installers inside unknown ZIP folders is the primary entry point for trojans.',
      outcomeType: 'incorrect'
    });

    const decFinal1b = await ScenarioDecision.create({
      stageId: stageFinal1._id,
      optionText: 'Verify the HR domain on search engines first, identify it as generic spoofing, and delete the message.',
      scoreChange: 30,
      categoryScoreWeights: {
        'Digital Hygiene': 30,
        'Social engineering': 20
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: stageFinal2A._id, // Goes to safe path (2A)
      explanation: 'Excellent. Investigating domains before downloading files shields your machine from malware payloads.',
      outcomeType: 'correct'
    });

    // Decisions for Stage 2A (Chrome Update - Legitimate!)
    const decFinal2a_agree = await ScenarioDecision.create({
      stageId: stageFinal2A._id,
      optionText: 'Click Update to restart the browser and apply official software patches.',
      scoreChange: 30,
      categoryScoreWeights: {
        'Digital Hygiene': 30
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: stageFinal3._id,
      explanation: 'Correct action. Keeping system files and web browsers updated isolates against zero-day exploits.',
      outcomeType: 'correct'
    });

    const decFinal2a_report = await ScenarioDecision.create({
      stageId: stageFinal2A._id,
      optionText: 'Block the prompt and report it as a malware attack warning.',
      scoreChange: 10, // False Positive Penalty!
      categoryScoreWeights: {
        'Digital Hygiene': 10
      },
      riskLevel: 'low-risk',
      isCriticalMistake: false,
      nextStageId: stageFinal3._id,
      explanation: 'Safe but unnecessary caution (False Positive). That was a legitimate browser notification (`chrome://` settings block). Blocking it keeps you secure but delays patching.',
      outcomeType: 'false-positive' // Flagged explicitly!
    });

    // Decisions for Stage 2B (Suspicious clone CPU scanner)
    const decFinal2b_run = await ScenarioDecision.create({
      stageId: stageFinal2B._id,
      optionText: 'Click the Install link to run the security software scanner.',
      scoreChange: -40,
      categoryScoreWeights: {
        'Digital Hygiene': -40
      },
      riskLevel: 'critical',
      isCriticalMistake: true,
      nextStageId: stageFinal3._id,
      explanation: 'You downloaded rogue software. Banners claiming infections are scareware tricks designed to download spyware.',
      outcomeType: 'incorrect'
    });

    const decFinal2b_close = await ScenarioDecision.create({
      stageId: stageFinal2B._id,
      optionText: 'Close the pop-up and exit the website immediately.',
      scoreChange: 30,
      categoryScoreWeights: {
        'Digital Hygiene': 30
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: stageFinal3._id,
      explanation: 'Spot on. Exiting scareware blocks prevent payload installs.',
      outcomeType: 'correct'
    });

    // Decisions for Stage 3 (QR checkout)
    const decFinal3_scan = await ScenarioDecision.create({
      stageId: stageFinal3._id,
      optionText: 'Scan the QR code with PhonePe and type your UPI PIN to claim tickets.',
      scoreChange: -40,
      categoryScoreWeights: {
        'Financial safety': -40
      },
      riskLevel: 'critical',
      isCriticalMistake: true,
      nextStageId: null,
      explanation: 'You fell for QR escrow fraud. UPI PIN is exclusively for authorizing debits (sending money), never for receiving.',
      outcomeType: 'incorrect'
    });

    const decFinal3_decline = await ScenarioDecision.create({
      stageId: stageFinal3._id,
      optionText: 'Decline to scan, and require standard escrow transactions or in-person cash handover.',
      scoreChange: 30,
      categoryScoreWeights: {
        'Financial safety': 30
      },
      riskLevel: 'safe',
      isCriticalMistake: false,
      nextStageId: null,
      explanation: 'Smart refusal. Escrow QR codes are standard vishing hooks used by marketplace scammers.',
      outcomeType: 'correct'
    });

    // Link options to Stage 1, 2A, 2B, 3
    await ScenarioStage.findByIdAndUpdate(stageFinal1._id, {
      $push: { availableDecisionIds: [decFinal1a._id, decFinal1b._id] }
    });
    await ScenarioStage.findByIdAndUpdate(stageFinal2A._id, {
      $push: { availableDecisionIds: [decFinal2a_agree._id, decFinal2a_report._id] }
    });
    await ScenarioStage.findByIdAndUpdate(stageFinal2B._id, {
      $push: { availableDecisionIds: [decFinal2b_run._id, decFinal2b_close._id] }
    });
    await ScenarioStage.findByIdAndUpdate(stageFinal3._id, {
      $push: { availableDecisionIds: [decFinal3_scan._id, decFinal3_decline._id] }
    });

    // 9. Seeding Portal Resources
    console.log('- Seeding resources...');
    const resourcesData = [
      {
        title: 'National Cyber Crime Reporting Portal',
        category: 'Government Resources',
        description: 'Official government portal to log cybercrime complaints online.',
        link: 'https://cybercrime.gov.in',
        downloadable: false
      },
      {
        title: 'National Cybercrime Toll-Free Helpline (1930)',
        category: 'Helpline',
        description: 'Immediately call 1930 to freeze transactions in cases of payment fraud.',
        link: 'tel:1930',
        downloadable: false
      },
      {
        title: 'Cyber Security Handbook for Citizens',
        category: 'Awareness Guides',
        description: 'Detailed security handbooks issued by MeitY, Government of India.',
        link: 'https://www.meity.gov.in/writereaddata/files/handbook_cyber_security_citizens.pdf',
        downloadable: true
      }
    ];

    for (let resData of resourcesData) {
      await Resource.findOneAndUpdate({ title: resData.title }, resData, { upsert: true, new: true });
    }

    console.log('Database successfully seeded!');
    if (require.main === module) {
      mongoose.connection.close();
    }
  } catch (err) {
    console.error('Error seeding database:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
}

// Support executing directly in CLI
if (require.main === module) {
  seed(false);
}

module.exports = seed;
