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

    // 1. Clear Existing Data ONLY if isReset is true (Destructive Reset)
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

    let sourceDPDP = await LegalSource.findOne({ title: /Digital Personal Data Protection Act/ });
    if (!sourceDPDP) {
      sourceDPDP = await LegalSource.create({
        title: 'Digital Personal Data Protection Act, 2023 Text',
        authority: 'Ministry of Law and Justice, Government of India',
        url: 'https://www.meity.gov.in/content/digital-personal-data-protection-act-2023',
        sourceType: 'legislation',
        description: 'Official text of India\'s comprehensive digital privacy regulation.'
      });
    }

    let sourceBNS = await LegalSource.findOne({ title: /Bharatiya Nyaya Sanhita/ });
    if (!sourceBNS) {
      sourceBNS = await LegalSource.create({
        title: 'Bharatiya Nyaya Sanhita, 2023 Text',
        authority: 'Ministry of Home Affairs, Government of India',
        url: 'https://www.mha.gov.in',
        sourceType: 'legislation',
        description: 'Official text of India\'s updated penal code replacing the Indian Penal Code (IPC).'
      });
    }

    let sourcePuttaswamy = await LegalSource.findOne({ title: /Justice K.S. Puttaswamy/ });
    if (!sourcePuttaswamy) {
      sourcePuttaswamy = await LegalSource.create({
        title: 'Justice K.S. Puttaswamy v. Union of India (2017)',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in/jonew/judgments/puttaswamy.pdf',
        sourceType: 'judgment',
        description: 'Landmark judgment declaring the Right to Privacy as a fundamental right under Article 21.'
      });
    }

    let sourceITRules = await LegalSource.findOne({ title: /IT Intermediary Rules/ });
    if (!sourceITRules) {
      sourceITRules = await LegalSource.create({
        title: 'IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021',
        authority: 'Ministry of Electronics and Information Technology',
        url: 'https://www.meity.gov.in/content/notification-it-rules-2021',
        sourceType: 'government-guidance',
        description: 'Regulatory rules governing social media intermediaries and digital platforms.'
      });
    }

    // 4. Law Sections
    console.log('- Seeding law sections...');
    const lawSectionsData = [
      {
        sectionNumber: 'Section 43A',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Compensation for failure to protect data',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'If a body corporate possessing sensitive personal data is negligent in maintaining reasonable security practices, causing wrongful loss or wrongful gain to any person, they are liable to pay compensation to the affected user.',
        officialText: 'Where a body corporate, possessing, dealing or handling any sensitive personal data or information in a computer resource which it owns, controls or operates, is negligent in implementing and maintaining reasonable security practices and procedures and thereby causes wrongful loss or wrongful gain to any person, such body corporate shall be liable to pay damages by way of compensation to the person so affected.',
        whyItMatters: 'Holds businesses accountable. If a service provider leaks your personal data or credit card numbers due to poor security, you can sue for compensation.',
        exampleScenario: 'An online delivery application stores customer credit cards in raw text. A database hack leaks 10,000 credit profiles. The company is liable under Section 43A.',
        penaltyOrLegalEffect: 'Civil compensation damages to victims. No statutory maximum upper limit.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['data leak', 'negligence', 'compensation', 'sensitive personal data', 'privacy'],
        relatedCyberCrimes: ['identity-theft', 'data-breach'],
        relatedCaseStudies: ['classified-marketplace-qr-fraud'],
        relatedModules: ['credential-safety'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66C',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for identity theft',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Criminalizes the fraudulent or dishonest use of another person\'s electronic signature, password, or unique identification features.',
        officialText: 'Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to rupees one lakh.',
        whyItMatters: 'Protects your digital profile assets. If a scammer hacks your account, steals your biometric patterns, or steals your Aadhaar/UPI credentials, it is a criminal offense under Section 66C.',
        exampleScenario: 'A roommate memorizes your phone login PIN and uses it to access your corporate chat. They send fake notices under your name.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years and a fine of up to ₹1,00,000.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['identity theft', 'password theft', 'biometric cloning', 'hack', 'credential theft'],
        relatedCyberCrimes: ['identity-theft'],
        relatedCaseStudies: ['phishing-credential-takeover'],
        relatedModules: ['credential-safety'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66D',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for cheating by personation using computer resource',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Imposes penalties on individuals who use any communication device or computer network to cheat by pretending to be someone else.',
        officialText: 'Whoever, by means of any communication device or computer resource cheats by personation, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to one lakh rupees.',
        whyItMatters: 'Covers most caller scams, profile impersonators, and phishing websites pretending to represent banks or institutions.',
        exampleScenario: 'A scammer creates a WhatsApp profile with your cousin\'s photo and texts you claiming a medical emergency to request funds.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years and a fine of up to ₹1,00,000.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['caller spoofing', 'impersonation', 'cheating', 'whatsapp scam', 'vishing'],
        relatedCyberCrimes: ['vishing', 'online-cheating'],
        relatedCaseStudies: ['fake-support-call-fraud', 'fake-job-offer-scam', 'digital-arrest-impersonation'],
        relatedModules: ['phishing-awareness'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66E',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for violating privacy',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Criminalizes capturing, publishing, or transmitting images of private parts of any person without consent, violating their privacy.',
        officialText: 'Whoever, intentionally or knowingly captures, publishes or transmits the image of a private area of any person without his or her consent, under circumstances violating the privacy of that person, shall be punished with imprisonment which may extend to three years or with fine not exceeding two lakh rupees, or with both.',
        whyItMatters: 'Strictly outlaws non-consensual sharing of intimate images or camera spy operations.',
        exampleScenario: 'A hidden camera is installed in a retail store changing room. The footage is transmitted online without customers\' consent.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years, or a fine of up to ₹2,00,000, or both.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['privacy violation', 'hidden camera', 'non-consensual sharing', 'spy camera'],
        relatedCyberCrimes: ['cyber-stalking', 'online-harassment'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 67',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for publishing obscene material in electronic form',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Punishes publishing or transmitting obscene materials in electronic form.',
        officialText: 'Whoever publishes or transmits or causes to be published or transmitted in the electronic form, any material which is lascivious or appeals to the prurient interest or if its effect is such as to tend to deprave and corrupt persons... shall be punished on first conviction with imprisonment... up to three years and fine up to five lakh rupees.',
        whyItMatters: 'Targets sharing, hosting, or publishing of sexually explicit or obscene content online.',
        exampleScenario: 'Sending explicit videos via email or chat forums without verifying the legal status of content.',
        penaltyOrLegalEffect: 'First conviction: Imprisonment of up to 3 years and fine up to ₹5,00,000. Subsequent: Up to 5 years and fine up to ₹10,00,000.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 17th October 2000.',
        amendmentStatus: 'Amended by IT Amendment Act, 2008.',
        keywords: ['obscenity', 'pornography', 'illegal content', 'obscene material'],
        relatedCyberCrimes: ['cyber-stalking'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66A',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for sending offensive messages through communication service (OMITTED)',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Previously criminalized sending messages that were deemed offensive, causing annoyance, or menacing. It was completely struck down by the Supreme Court of India in the Shreya Singhal (2015) judgment because its vague wording violated freedom of speech.',
        officialText: 'Whoever sends, by means of a computer resource or a communication device,— (a) any information that is grossly offensive or has menacing character; or (b) any information which he knows to be false, but for the purpose of causing annoyance, inconvenience, danger, obstruction, insult, injury, criminal intimidation, enmity, hatred or ill will, persistently by making use of such computer resource or a communication device... shall be punishable with imprisonment... up to three years.',
        whyItMatters: 'Section 66A is OMITTED. It is unconstitutional and police cannot arrest or file FIRs against citizens under this section.',
        exampleScenario: 'Writing a post criticizing local municipal governance. Threatening arrest under Section 66A is illegal.',
        penaltyOrLegalEffect: 'Struck down and declared unconstitutional. Invalidated.',
        legalStatus: 'OMITTED',
        commencementStatus: 'Inserted in 2008. Struck down/Omitted in March 2015.',
        amendmentStatus: 'Omitted via Supreme Court judgment in Shreya Singhal v. Union of India (2015).',
        keywords: ['shreya singhal', 'free speech', 'offensive messages', 'unconstitutional', 'struck down'],
        relatedCyberCrimes: ['online-harassment'],
        relatedCaseStudies: [],
        relatedModules: [],
        officialSourceId: sourceShreyaSinghal._id
      },
      {
        sectionNumber: 'DPDP Section 6',
        actName: 'Digital Personal Data Protection Act, 2023',
        officialTitle: 'Consent requirements for processing personal data',
        role: 'Data Protection',
        plainLanguageExplanation: 'Requires consent of the individual for processing their personal data to be free, specific, informed, unconditional, and unambiguous, through a clear affirmative action.',
        officialText: 'Consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action, and shall signify agreement to the processing of her personal data for the specified purpose and be limited to such personal data as is necessary for such specified purpose.',
        whyItMatters: 'Ensures apps cannot hide sweeping data tracking permissions behind tiny, pre-ticked checkboxes or long legal jargon.',
        exampleScenario: 'A fitness application pre-ticks a box allowing third-party ad networks to read your location logs. Under DPDP Section 6, this consent is invalid.',
        penaltyOrLegalEffect: 'Administrative penalties on data fiduciaries up to ₹250 crore for significant breaches.',
        legalStatus: 'NOT_YET_IN_FORCE',
        commencementStatus: 'Passed by Parliament in August 2023. Not yet notified in force, pending establishment of the Data Protection Board (DPBI).',
        amendmentStatus: 'New enactment under the DPDP Act, 2023.',
        keywords: ['consent', 'privacy', 'personal data', 'tracking', 'data principal'],
        relatedCyberCrimes: ['data-breach'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceDPDP._id
      },
      {
        sectionNumber: 'DPDP Section 11',
        actName: 'Digital Personal Data Protection Act, 2023',
        officialTitle: 'Right to access and rectification',
        role: 'Data Protection',
        plainLanguageExplanation: 'Grants individuals the right to obtain a summary of personal data being processed, details of processors, and request correction, completion, or erasure of their data.',
        officialText: 'The Data Principal shall have the right to obtain from the Data Fiduciary: (a) a summary of personal data being processed... (b) right to correction, completion, updating and erasure of her personal data for the processing of which she has previously given consent...',
        whyItMatters: 'Empowers you to ask companies to delete your data or rectify errors in their customer profiles.',
        exampleScenario: 'You delete your account on an online shopping portal and request they purge all your phone logs. They must comply under Section 11.',
        penaltyOrLegalEffect: 'Obligation on Data Fiduciary. Non-compliance invites penalties.',
        legalStatus: 'NOT_YET_IN_FORCE',
        commencementStatus: 'Passed in August 2023. Staggered commencement pending notification.',
        amendmentStatus: 'New enactment under the DPDP Act, 2023.',
        keywords: ['right to be forgotten', 'erasure', 'rectification', 'access data', 'delete account'],
        relatedCyberCrimes: ['data-breach'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceDPDP._id
      },
      {
        sectionNumber: 'BNS Section 318',
        actName: 'Bharatiya Nyaya Sanhita, 2023',
        officialTitle: 'Punishment for cheating',
        role: 'Related Criminal Law',
        plainLanguageExplanation: 'Punishes cheating, which includes dishonestly inducing someone to deliver property or money. Replaces Section 420 of the Indian Penal Code (IPC).',
        officialText: 'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person... shall be punished with imprisonment of either description for a term which may extend to seven years, and shall also be liable to fine.',
        whyItMatters: 'The primary general penal section for cyber frauds, online transaction scams, and financial cheating.',
        exampleScenario: 'Tricking someone into paying money for goods listed on an online classifieds site that you never deliver.',
        penaltyOrLegalEffect: 'Imprisonment of up to 7 years and a fine.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified effective from 1st July 2024.',
        amendmentStatus: 'Replaces IPC Section 420.',
        keywords: ['cheating', 'ipc 420', 'online scam', 'advance fee fraud', 'bns 318'],
        relatedCyberCrimes: ['online-cheating', 'upi-payment-fraud'],
        relatedCaseStudies: ['classified-marketplace-qr-fraud', 'fake-job-offer-scam'],
        relatedModules: ['phishing-awareness'],
        officialSourceId: sourceBNS._id
      },
      {
        sectionNumber: 'BNS Section 319',
        actName: 'Bharatiya Nyaya Sanhita, 2023',
        officialTitle: 'Cheating by personation',
        role: 'Related Criminal Law',
        plainLanguageExplanation: 'Criminalizes cheating by pretending to be some other person, or substituting one person for another. Replaces Section 419 of the IPC.',
        officialText: 'A person is said to cheat by personation if he cheats by pretending to be some other person, or by knowingly substituting one person for another, or representing that he or any other person is a person other than he or such other person really is.',
        whyItMatters: 'Fits alongside IT Act 66D when charging identity frauds and profile spoofers under general law.',
        exampleScenario: 'Creating a fake profile of a bank representative on Skype to cheat people during customer reviews.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years, or fine, or both.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified effective from 1st July 2024.',
        amendmentStatus: 'Replaces IPC Section 419.',
        keywords: ['impersonation', 'bns 319', 'ipc 419', 'profile spoofing'],
        relatedCyberCrimes: ['identity-theft', 'online-cheating'],
        relatedCaseStudies: ['digital-arrest-impersonation'],
        relatedModules: [],
        officialSourceId: sourceBNS._id
      },
      {
        sectionNumber: 'IT Intermediary Rules',
        actName: 'Information Technology Act Rules',
        officialTitle: 'Grievance redressal by online intermediaries',
        role: 'Government Rule / Notification',
        plainLanguageExplanation: 'Mandates social media platforms and messaging apps to set up grievance officers and remove illegal content within strict timelines.',
        officialText: 'An intermediary shall observe due diligence... including publishing privacy policy, terms of use, and acting on reports of offensive content, deepfakes, or impersonations within 24-36 hours.',
        whyItMatters: 'Gives you the power to force social media platforms to take down deepfakes or impersonating profiles.',
        exampleScenario: 'You find a fake profile using your photos on Instagram. Under the Intermediary Rules, the platform must take it down within 24-36 hours of notification.',
        penaltyOrLegalEffect: 'Loss of Safe Harbour immunity under Section 79 of the IT Act if platforms fail to comply.',
        legalStatus: 'CURRENT',
        commencementStatus: 'Notified on 25th February 2021. In force.',
        amendmentStatus: 'Amended subsequently in 2022 and 2023.',
        keywords: ['intermediaries', 'facebook', 'instagram', 'deepfakes', 'take down request', 'safe harbour'],
        relatedCyberCrimes: ['online-harassment', 'identity-theft'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceITRules._id
      }
    ];

    for (let secData of lawSectionsData) {
      await LawSection.findOneAndUpdate(
        { sectionNumber: secData.sectionNumber },
        secData,
        { upsert: true, new: true }
      );
    }

    // 5. Seeding Expanded Cybercrime Dataset (24 topics)
    console.log('- Seeding expanded cybercrime database (24 items)...');
    const crimesData = [
      {
        title: 'Phishing',
        slug: 'phishing',
        category: 'Phishing & Messaging Scams',
        shortDescription: 'Deceptive messages designed to trick you into clicking malicious links or sharing details.',
        whatIsIt: 'Phishing is a method where attackers send spoof communications (like emails or messages) designed to look like trustworthy organizations to trick you into entering credentials.',
        howItWorks: 'Attackers create cloned websites (like a mock bank or service verification screen) and direct you to enter credentials or OTPs under the pretense of security reviews.',
        attackerObjective: ['Credentials', 'Account Access', 'Personal Information'],
        redFlagLevel: 'High',
        attackVectors: ['Email', 'Website'],
        legalContext: ['Section 66D', 'Section 66C'],
        difficulty: 'Easy',
        warningSigns: [
          'Urgent deadlines (threats of locking your profile in 2 hours)',
          'Mismatched domain names (e.g. login-sbi-portal.com instead of sbi.co.in)',
          'Generic salutations ("Dear Valued Customer") instead of your real name',
          'Requesting passwords or net OTP inputs on unsecured HTTP connections'
        ],
        attackerTactics: [
          { tactic: 'Urgency', example: 'Verify within 2 hours or face suspension.', whyItWorks: 'Creates panic and bypasses slow logical analysis.' },
          { tactic: 'Authority', example: 'BharatConnect Verification Desk notification.', whyItWorks: 'Exploits natural trust in institutions.' }
        ],
        actionSteps: [
          'Hover over hyperlinks to inspect the destination URL address',
          'Always check the sender email domain spelling carefully.'
        ],
        avoidSteps: [
          'Do not click links inside unsolicited warning emails.',
          'Never enter passwords on unencrypted HTTP web pages.'
        ],
        ifTargetedSteps: [
          'Change compromised passwords immediately on all accounts.',
          'Enable Multi-Factor Authentication (MFA) to isolate your profile.'
        ],
        mythFacts: [
          { myth: 'Phishing only targets inexperienced users.', fact: 'Anyone can fall for a phishing scam if the timing and context exploit a moment of distraction.' }
        ],
        spotTheFlags: {
          messageType: 'Email',
          messageText: 'SENDER: support@sbi-online-security.com\nSUBJECT: URGENT: Verify SBI Netbanking immediately!\n\nDear Customer, your bank access will be suspended in 30 minutes. Click here to verify now: http://sbi-verification.in/login. Please enter your profile passwords and UPI PIN.',
          clickableFlags: [
            { textSegment: 'support@sbi-online-security.com', flagName: 'Spoof Sender Address', explanation: 'SBI official emails only come from domains ending in .co.in or .sbi, never third-party security domains.' },
            { textSegment: 'suspended in 30 minutes', flagName: 'Artificial Urgency', explanation: 'Scammers pressure you with short deadlines to prevent you from calling your bank to verify.' },
            { textSegment: 'http://sbi-verification.in/login', flagName: 'Unsecured Cloned URL', explanation: 'The link is unencrypted (HTTP) and uses a fake domain instead of official banking addresses.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'An email from your email host claims your storage is full and directs you to a portal to upgrade. What is your response?',
          options: [
            { optionText: 'Click the link and login to buy more storage space.', isCorrect: false, explanation: 'Incorrect! This exposes your password to credential harvesting.' },
            { optionText: 'Verify your account status by opening the official settings portal directly in your browser.', isCorrect: true, explanation: 'Correct! Opening settings independently is the safest way to verify account notices.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'What is the safest way to verify a warning email from your bank?',
            options: [
              'Click the button provided in the email.',
              'Reply to the email asking if it is authentic.',
              'Call your branch or log in separately through the official bank app.',
              'Search the email subject on Google.'
            ],
            correctOptionIndex: 2,
            explanation: 'Calling your branch or accessing the official app independently avoids fake links entirely.'
          }
        ]
      },
      {
        title: 'UPI Payment & QR Fraud',
        slug: 'upi-payment-fraud',
        category: 'Financial Fraud',
        shortDescription: 'Tricking victims into scanning QR codes or entering PINs to "receive" cash-back or payments.',
        whatIsIt: 'UPI payment scams involve tricking individuals into scanning QR codes or entering PIN codes, falsely claiming that doing so will deposit cash back or rewards into their accounts.',
        howItWorks: 'A buyer on an escrow portal claims they want to send an advance payment. They send a custom QR code via chat and tell you to scan it. Entering your UPI PIN immediately authorizes an outgoing transaction.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['SMS', 'Messaging', 'Phone'],
        legalContext: ['Section 66D', 'Section 43A'],
        difficulty: 'Medium',
        warningSigns: [
          'Prompts that require you to scan a code and enter your PIN to "receive" or "refund" money',
          'Buyers who refuse meeting in person or using banking numbers directly',
          'High pressure to accept cash-back rewards via UPI links'
        ],
        attackerTactics: [
          { tactic: 'Reward', example: 'Scan this code to receive cashback of ₹5,000.', whyItWorks: 'Lures victims with free incentives.' }
        ],
        actionSteps: [
          'Remember that UPI PIN is exclusively for authorizing debits (sending money), never for receiving.',
          'Always check the recipient\'s display name inside the secure payment gate interface before confirming.'
        ],
        avoidSteps: [
          'Do not scan QR codes sent by unknown online accounts under any circumstances.',
          'Never enter your UPI PIN on private chat forums.'
        ],
        ifTargetedSteps: [
          'Report fraudulent transfers immediately within 1 hour by calling 1930.',
          'File a complaint at the cybercrime portal.'
        ],
        mythFacts: [
          { myth: 'Scanning a QR code can deposit money into your account.', fact: 'QR codes and UPI PINs are only used to send money out of your account.' }
        ],
        spotTheFlags: {
          messageType: 'SMS',
          messageText: 'CONGRATULATIONS! You won ₹10,000 cashback! Scan this QR code and type your UPI PIN to claim rewards instantly: http://paytm-rewards.in/claim',
          clickableFlags: [
            { textSegment: 'won ₹10,000 cashback', flagName: 'Lure Scenario', explanation: 'Cashback offers that require scanner actions are standard bait setups.' },
            { textSegment: 'type your UPI PIN', flagName: 'Request for authorization key', explanation: 'UPI PIN is only typed to spend money, never to receive credits.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'An online marketplace buyer insists on sending money via UPI QR code scan instead of standard bank transfer. What should you do?',
          options: [
            { optionText: 'Scan the QR and verify your PIN to confirm the credit.', isCorrect: false, explanation: 'Incorrect! This authorizes a payment to the buyer.' },
            { optionText: 'Decline to scan, and demand standard cash or account transfer.', isCorrect: true, explanation: 'Correct! Refusing PIN inputs protects your account balances.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'When should you enter your UPI PIN?',
            options: [
              'When receiving cash back from Paytm.',
              'When confirming a deposit from a buyer.',
              'Only when you are making a payment or transferring money out.',
              'To verify your phone connection.'
            ],
            correctOptionIndex: 2,
            explanation: 'UPI PIN is only used for outgoing debits, never for credits.'
          }
        ]
      },
      {
        title: 'QR Code Scams',
        slug: 'qr-code-scams',
        category: 'Financial Fraud',
        shortDescription: 'Scanning malicious QR codes that debits your account instead of crediting it.',
        whatIsIt: 'Attackers generate payment QR codes and send them to victims via chat, claiming they are payment receipts or cashback vouchers.',
        howItWorks: 'The victim scans the code using a mobile wallet. The app prompts for a UPI PIN. Once entered, the money is instantly debited from the victim\'s account.',
        attackerObjective: ['Money'],
        redFlagLevel: 'High',
        attackVectors: ['Messaging', 'Payment'],
        legalContext: ['Section 66D'],
        difficulty: 'Easy',
        warningSigns: [
          'Codes sent via private chat rather than generated by official merchant checkouts.',
          'Instructing you to scan a code to accept money.'
        ],
        attackerTactics: [
          { tactic: 'Familiarity', example: 'Scammer poses as a local merchant.', whyItWorks: 'Reduces skepticism.' }
        ],
        actionSteps: [
          'Double check transaction details displayed on screen before typing your PIN.',
          'Verify merchant names.'
        ],
        avoidSteps: [
          'Do not scan random QRs in chat threads.',
          'Never enter your UPI PIN on screens showing "Pay" buttons.'
        ],
        ifTargetedSteps: [
          'De-authorize linked wallets.',
          'Contact your bank to freeze transactions.'
        ],
        mythFacts: [
          { myth: 'QR codes are only for payments.', fact: 'QRs are just visual representations of links. They can lead to malware downloads as well.' }
        ],
        spotTheFlags: {
          messageType: 'SMS',
          messageText: 'QuickPay Escrow: Scan this code to collect your ₹4,000 marketplace refund.',
          clickableFlags: [
            { textSegment: 'Scan this code to collect', flagName: 'Collect by scanning scam', explanation: 'Scanning is exclusively for sending money.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'A seller sends a payment QR link on WhatsApp. What is the safest action?',
          options: [
            { optionText: 'Scan it to check if it opens Paytm.', isCorrect: false, explanation: 'Unsafe. Keep transactions inside the official platform.' },
            { optionText: 'Insist on paying in cash or official in-app gateway.', isCorrect: true, explanation: 'Correct action. Minimizes out-of-band payment fraud.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'What is a QR code conceptually?',
            options: [
              'A secure connection directly to your bank account.',
              'A visual link representing a URL or text segment.',
              'A government certified payment receipt.',
              'A hardware key.'
            ],
            correctOptionIndex: 1,
            explanation: 'QR codes are simply visual links that redirect your browser or payment application.'
          }
        ]
      },
      // 21 More short threats to hit the target of 24
      {
        title: 'Smishing',
        slug: 'smishing',
        category: 'Phishing & Messaging Scams',
        shortDescription: 'Phishing attacks conducted via SMS text messages.',
        whatIsIt: 'Smishing is the SMS equivalent of email phishing, targeting mobile users with text links.',
        howItWorks: 'You receive an SMS warning that your electricity connection or PAN card is blocked. A link directs you to a fake verification screen.',
        attackerObjective: ['Credentials', 'Personal Information'],
        redFlagLevel: 'High',
        attackVectors: ['SMS'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Vishing',
        slug: 'vishing',
        category: 'Phishing & Messaging Scams',
        shortDescription: 'Voice phishing scams conducted over telephone calls.',
        whatIsIt: 'Scammers call posing as bank managers, card verification offices, or police officers.',
        howItWorks: 'The caller uses social engineering to induce panic and request credit card details or OTPs to prevent profile locking.',
        attackerObjective: ['Credentials', 'Money'],
        redFlagLevel: 'Very High',
        attackVectors: ['Phone'],
        legalContext: ['Section 66C', 'Section 66D']
      },
      {
        title: 'Spear Phishing',
        slug: 'spear-phishing',
        category: 'Phishing & Messaging Scams',
        shortDescription: 'Highly targeted phishing emails directed at specific individuals.',
        whatIsIt: 'Attackers customize emails with target details (like your name or repository projects) to seem authentic.',
        howItWorks: 'Posing as your professor or manager, the attacker requests you run code snippets or NDAs containing malware.',
        attackerObjective: ['Credentials', 'Device Access'],
        redFlagLevel: 'Very High',
        attackVectors: ['Email'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Business Email Compromise (BEC)',
        slug: 'bec',
        category: 'Identity & Credential Theft',
        shortDescription: 'Impersonating corporate officers to redirect commercial payments.',
        whatIsIt: 'BEC scams target corporate finances by spoofing executive email profiles.',
        howItWorks: 'The scammer hacks a manager account and emails finance teams to wire funds to new contractor bank routes.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['Email'],
        legalContext: ['Section 66D', 'Section 43A']
      },
      {
        title: 'Credential Theft',
        slug: 'credential-theft',
        category: 'Identity & Credential Theft',
        shortDescription: 'Harvesting user passwords, security tokens, or authentication keys.',
        whatIsIt: 'Stealing usernames and passwords to gain unauthorized portal access.',
        howItWorks: 'Attackers run keyloggers, credential stuffing, or fake forms to capture and compile user key pairings.',
        attackerObjective: ['Credentials', 'Account Access'],
        redFlagLevel: 'High',
        attackVectors: ['Website', 'Device'],
        legalContext: ['Section 66C']
      },
      {
        title: 'Fake Login Pages',
        slug: 'fake-login-pages',
        category: 'Identity & Credential Theft',
        shortDescription: 'Cloned web forms designed to capture login information.',
        whatIsIt: 'Perfect visual clones of login screens (Facebook, SBI, Google).',
        howItWorks: 'Victims are redirected to these screens and enter credentials, which are sent directly to the hacker.',
        attackerObjective: ['Credentials'],
        redFlagLevel: 'High',
        attackVectors: ['Website'],
        legalContext: ['Section 66D', 'Section 66C']
      },
      {
        title: 'Account Takeover',
        slug: 'account-takeover',
        category: 'Account Takeover',
        shortDescription: 'Scammers lock victims out of their profiles to exploit identity assets.',
        whatIsIt: 'Gaining exclusive access to user bank, email, or social accounts.',
        howItWorks: 'Hackers login, change authentication emails/phones, and lock you out permanently.',
        attackerObjective: ['Account Access', 'Identity'],
        redFlagLevel: 'Very High',
        attackVectors: ['Website'],
        legalContext: ['Section 66C']
      },
      {
        title: 'Identity Theft',
        slug: 'identity-theft',
        category: 'Identity & Credential Theft',
        shortDescription: 'Stealing personal details to act in the victim\'s name.',
        whatIsIt: 'Acquiring Aadhaar numbers, biometric scans, or signatures fraudulently.',
        howItWorks: 'Attackers buy documents on dark markets and use them to activate unauthorized credit lines.',
        attackerObjective: ['Identity', 'Money'],
        redFlagLevel: 'Very High',
        attackVectors: ['Website', 'Phone'],
        legalContext: ['Section 66C']
      },
      {
        title: 'Online Impersonation',
        slug: 'online-impersonation',
        category: 'Online Deception',
        shortDescription: 'Pretending to be family or government officials on social networks.',
        whatIsIt: 'Setting up fake social media handles or WhatsApp profiles using real photos.',
        howItWorks: 'Messaging friends claiming you are in emergency situations and need immediate money.',
        attackerObjective: ['Money', 'Personal Information'],
        redFlagLevel: 'High',
        attackVectors: ['Social Media', 'Messaging'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Payment App Scams',
        slug: 'payment-app-scams',
        category: 'Financial Fraud',
        shortDescription: 'Fake rewards or cashback links on wallets like Google Pay.',
        whatIsIt: 'Scams built around scratch cards and cash deposit links.',
        howItWorks: 'Promised rewards are linked to pay triggers, debiting balances instead of depositing.',
        attackerObjective: ['Money'],
        redFlagLevel: 'High',
        attackVectors: ['Payment', 'Messaging'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Fake Customer Support Scams',
        slug: 'fake-customer-support',
        category: 'Scams & Impersonation',
        shortDescription: 'Listing fake customer helpline numbers on public directories.',
        whatIsIt: 'Attackers edit Google Maps coordinates to list fake bank/wallet helplines.',
        howItWorks: 'When victims call to resolve payment glitches, the support agent requests OTPs or remote access keys.',
        attackerObjective: ['Credentials', 'Money', 'Device Access'],
        redFlagLevel: 'Very High',
        attackVectors: ['Phone', 'Website'],
        legalContext: ['Section 66D', 'Section 66C']
      },
      {
        title: 'Fake Job Scams',
        slug: 'fake-job-scams',
        category: 'Job & Recruitment Scams',
        shortDescription: 'Fake employment offers requiring payment for training or tasks.',
        whatIsIt: 'Recruiters offering high payout tasks via Telegram or WhatsApp.',
        howItWorks: 'Victims pay processing fees or perform social media tasks before being blocked.',
        attackerObjective: ['Money', 'Personal Information'],
        redFlagLevel: 'High',
        attackVectors: ['Messaging', 'Social Media'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Investment Scams',
        slug: 'investment-scams',
        category: 'Financial Fraud',
        shortDescription: 'Guaranteed high return stock, crypto, or forex group tips.',
        whatIsIt: 'Fraudulent investment advice groups on WhatsApp or Telegram.',
        howItWorks: 'Victims are directed to fake trading portals that display fake profits and block withdrawals.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['Messaging', 'Social Media'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Romance Scams',
        slug: 'romance-scams',
        category: 'Online Deception',
        shortDescription: 'Catfishing individuals to form fake relationships and extort money.',
        whatIsIt: 'Establishing relationships on dating apps to build trust before requesting cash.',
        howItWorks: 'Attackers request money for travel, custom clearing, or medical emergencies.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Moderate',
        attackVectors: ['Social Media', 'Messaging'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Marketplace Scams',
        slug: 'marketplace-scams',
        category: 'E-commerce & Marketplace Fraud',
        shortDescription: 'Fake listings or fake advance payments on classified portals.',
        whatIsIt: 'Fraud on sites like OLX or classified boards.',
        howItWorks: 'Sellers request shipping deposits and vanish, or buyers trick sellers using QR links.',
        attackerObjective: ['Money'],
        redFlagLevel: 'High',
        attackVectors: ['Website', 'Messaging'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Tech Support Scams',
        slug: 'tech-support-scams',
        category: 'Scams & Impersonation',
        shortDescription: 'Fake computer virus alerts directing you to helpline desks.',
        whatIsIt: 'Browser pop-ups claiming your computer is infected.',
        howItWorks: 'Alerts demand you call a support number to purchase system packages.',
        attackerObjective: ['Money', 'Device Access'],
        redFlagLevel: 'Moderate',
        attackVectors: ['Website', 'Phone'],
        legalContext: ['Section 66D']
      },
      {
        title: 'Malware',
        slug: 'malware',
        category: 'Malware & Device Threats',
        shortDescription: 'Rogue executables designed to damage or compromise systems.',
        whatIsIt: 'Trojans, worms, and viruses downloaded from unverified files.',
        howItWorks: 'Software runs hidden scripts to steal cookies, keys, or log files.',
        attackerObjective: ['Device Access', 'Credentials'],
        redFlagLevel: 'High',
        attackVectors: ['Device', 'Email'],
        legalContext: ['Section 43A']
      },
      {
        title: 'Ransomware',
        slug: 'ransomware',
        category: 'Malware & Device Threats',
        shortDescription: 'Encrypting victim data and demanding payment for decryption keys.',
        whatIsIt: 'Extortion malware that locks down personal or enterprise networks.',
        howItWorks: 'Systems are encrypted and pop-ups demand Bitcoin payments to unlock the drive.',
        attackerObjective: ['Money', 'Device Access'],
        redFlagLevel: 'Critical',
        attackVectors: ['Device', 'Email'],
        legalContext: ['Section 43A']
      },
      {
        title: 'Spyware',
        slug: 'spyware',
        category: 'Malware & Device Threats',
        shortDescription: 'Tracking background activity, inputs, or webcam feeds without consent.',
        whatIsIt: 'Spy software installed via cracked applications.',
        howItWorks: 'Transmits photos, browser history, or input logs back to server hosts.',
        attackerObjective: ['Personal Information', 'Device Access'],
        redFlagLevel: 'High',
        attackVectors: ['Device'],
        legalContext: ['Section 43A']
      },
      {
        title: 'Sextortion',
        slug: 'sextortion',
        category: 'Online Harassment & Abuse',
        shortDescription: 'Extortion using compromised webcam feeds or private photos.',
        whatIsIt: 'Blackmailing victims with threats of publishing private calls.',
        howItWorks: 'Scammers record video chats and threaten to send clips to family members.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Very High',
        attackVectors: ['Phone', 'Social Media'],
        legalContext: ['Section 66E', 'Section 66D']
      },
      {
        title: 'SIM Swapping',
        slug: 'sim-swapping',
        category: 'Account Takeover',
        shortDescription: 'Social engineering mobile carriers to assign a victim\'s number to a new card.',
        whatIsIt: 'Stealing your mobile carrier routing signals.',
        howItWorks: 'Attackers spoof carrier support to issue clone SIMs, capturing your SMS OTPs.',
        attackerObjective: ['Credentials', 'Account Access'],
        redFlagLevel: 'Critical',
        attackVectors: ['Phone'],
        legalContext: ['Section 66C', 'Section 66D']
      }
    ];

    for (let crime of crimesData) {
      await CyberCrime.findOneAndUpdate({ slug: crime.slug }, crime, { upsert: true, new: true });
    }

    // 6. Case Studies
    console.log('- Seeding case studies...');
    const caseStudiesData = [
      {
        title: 'The Fake Service Warning Trap',
        slug: 'phishing-credential-takeover',
        caseNumber: 'CASE FILE 001',
        caseType: 'educational-reconstruction',
        incidentType: 'Phishing',
        attackVector: 'Email',
        shortDescription: 'A user received an urgent account security warning. Following the provided link led them to enter their Netbanking password, which the attacker immediately used to drain funds.',
        incidentDate: 'October 2025',
        publishedDate: 'November 2025',
        difficulty: 'Beginner',
        featured: true,
        sourceSummary: 'Synthesized from multiple bank phishing advisories published by the RBI.',
        narrativeSections: [
          {
            heading: 'The Unexpected Contact',
            body: 'On a busy Tuesday morning, a software developer received an email styled with official banking logos. The subject line read: "URGENT: Suspicious logins detected. Your account access will be terminated within 2 hours unless you verify your identity."'
          },
          {
            heading: 'The Believable Interface',
            body: 'The email contained a button labeled "Verify Account". Clicking it redirected the user to a page that looked identical to their bank\'s Netbanking portal, complete with login input fields. The URL in the address bar was "netbanking-verify-sbi.com" instead of the official banking domain.'
          },
          {
            heading: 'The Pressure Decision',
            body: 'A timer on the page was counting down from 2 minutes, warning that failure to login immediately would result in permanent account locking. Fearing account suspension, the developer quickly typed their username and netbanking password.'
          },
          {
            heading: 'The Turning Point',
            body: 'After submitting, the site asked for a "One-Time Password (OTP) sent to your registered mobile number". The developer received a real SMS from their bank containing an OTP code. Without reading the transaction details in the SMS text, they typed the OTP into the web page.'
          },
          {
            heading: 'The Realization',
            body: 'Within ten seconds of submitting the OTP, the developer received a debit notification SMS from their real bank: "Rs. 75,000 debited to digital wallet X." The developer realized the website was a clone, and the OTP they typed was actually a transaction authorization OTP for transferring money, not a login OTP.'
          }
        ],
        timeline: [
          {
            time: '09:30 AM',
            label: 'Email Received',
            description: 'Received urgent warning email regarding suspicious logins.',
            type: 'contact'
          },
          {
            time: '09:32 AM',
            label: 'Cloned Site Opened',
            description: 'Clicked the link and opened a replica netbanking portal.',
            type: 'deception'
          },
          {
            time: '09:34 AM',
            label: 'Credentials Submitted',
            description: 'Entered username and password on the phishing portal.',
            type: 'decision'
          },
          {
            time: '09:35 AM',
            label: 'OTP Intercepted',
            description: 'Attacker triggered a real Rs. 75,000 transfer, prompting the bank to send an OTP to the user.',
            type: 'escalation'
          },
          {
            time: '09:36 AM',
            label: 'OTP Submitted',
            description: 'User entered the OTP on the fake site, authorizing the transfer.',
            type: 'decision'
          },
          {
            time: '09:38 AM',
            label: 'Funds Stolen',
            description: 'SMS notification received showing Rs. 75,000 debited.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'The warning email threatens account locking in 2 hours and provides a quick link. What is the safest response?',
            options: [
              {
                optionText: 'Click the link immediately to ensure your account remains active.',
                isCorrect: false,
                explanation: 'Time pressure is a classic scam trigger used to panic you. Clicking unsolicited links is unsafe.'
              },
              {
                optionText: 'Close the email, open a new browser tab, and log into your bank manually or via the official app.',
                isCorrect: true,
                explanation: 'Accessing services through official channels entirely avoids counterfeit websites.'
              }
            ],
            explanation: 'Unexpected warnings should always be verified independently.'
          }
        ],
        warningSigns: [
          {
            title: 'Urgent Deadlines',
            explanation: 'Demanding immediate action under threat of suspension bypasses standard security checks.'
          },
          {
            title: 'Irregular Domains',
            explanation: 'The URL was "netbanking-verify-sbi.com" instead of the official sbi.co.in domain.'
          }
        ],
        attackerObjectives: ['Credentials', 'Account Access', 'Money'],
        impact: {
          financial: 'Loss of Rs. 75,000.',
          account: 'Netbanking credentials compromised.',
          privacy: 'Personal data exposed.',
          operational: 'Bank account frozen for investigation.',
          emotional: 'High stress and sense of violation.'
        },
        response: [
          'Contacted the bank customer care line immediately to block Netbanking credentials.',
          'Filed a complaint on the national cybercrime reporting portal (cybercrime.gov.in).'
        ],
        preventionLessons: [
          'Never use hyperlinks inside emails or SMS messages to access login pages.',
          'Always read the full SMS text of an OTP; check if it says "for login" or "for transaction of Rs. X".'
        ],
        legalContext: ['Section 66D', 'Section 66C'],
        relatedCrimes: ['phishing'],
        sources: [
          {
            title: 'RBI Cyber Security Advisory on Phishing Links',
            authority: 'Reserve Bank of India',
            url: 'https://rbi.org.in',
            publicationDate: 'July 2025',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Fake Military Officer QR Trap',
        slug: 'classified-marketplace-qr-fraud',
        caseNumber: 'CASE FILE 002',
        caseType: 'educational-reconstruction',
        incidentType: 'UPI/Payment Scams',
        attackVector: 'WhatsApp / UPI',
        shortDescription: 'A seller on a classified marketplace was tricked into scanning a QR code and inputting their UPI PIN to "receive" an advance payment.',
        incidentDate: 'August 2025',
        publishedDate: 'September 2025',
        difficulty: 'Beginner',
        featured: false,
        sourceSummary: 'Based on recurring UPI QR code scams reported by state cyber cell advisories.',
        narrativeSections: [
          {
            heading: 'The Classified Listing',
            body: 'A college student listed their camera for sale on an online marketplace. Within 30 minutes, they received a WhatsApp message from a buyer who claimed to be an Army officer stationed in a remote area.'
          },
          {
            heading: 'The Quick Trust Build',
            body: 'To establish trust, the buyer sent a photo of a fake military ID card. The buyer stated they would purchase the camera immediately without negotiating the price and send an army truck to collect it later. First, they wanted to wire a Rs. 15,000 deposit via UPI.'
          },
          {
            heading: 'The QR Code WhatsApp Text',
            body: 'The buyer sent a QR code image to the student on WhatsApp. The buyer said: "This is a merchant credit QR code. Scan this in your UPI app, and the Rs. 15,000 will be credited directly to your bank account."'
          },
          {
            heading: 'The Action and Realization',
            body: 'The student opened their UPI app, scanned the QR code image from WhatsApp, and entered their UPI PIN. Instantly, their phone buzzed showing Rs. 15,000 was debited from their account, and the buyer immediately blocked them on WhatsApp.'
          }
        ],
        timeline: [
          {
            time: '11:15 AM',
            label: 'Ad Listed',
            description: 'Student listed camera on online marketplace.',
            type: 'contact'
          },
          {
            time: '11:45 AM',
            label: 'Buyer Contacts',
            description: 'Buyer claims to be military officer, sends fake ID card.',
            type: 'deception'
          },
          {
            time: '12:00 PM',
            label: 'QR Code Shared',
            description: 'Buyer sends WhatsApp image of QR code to credit money.',
            type: 'deception'
          },
          {
            time: '12:05 PM',
            label: 'UPI PIN Submission',
            description: 'User scanned code and entered UPI PIN.',
            type: 'decision'
          },
          {
            time: '12:06 PM',
            label: 'Debit Notification',
            description: 'Rs. 15,000 debited; buyer blocked number.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'A buyer sends you a QR code and states that you need to scan it and type your UPI PIN to receive money. What is the rule of UPI?',
            options: [
              {
                optionText: 'Scan the QR code but do not type the PIN.',
                isCorrect: false,
                explanation: 'Simply scanning a QR code is safe, but entering your PIN is a payment command.'
              },
              {
                optionText: 'Never scan a code or enter a PIN to receive money. Receiving money requires only sharing your UPI ID.',
                isCorrect: true,
                explanation: 'A UPI PIN is strictly used to authenticate outgoing debit transactions. Receiving money never requires a PIN.'
              }
            ],
            explanation: 'Scanning codes or typing PINs is always a payment instruction.'
          }
        ],
        warningSigns: [
          {
            title: 'Military Impersonation',
            explanation: 'Scammers frequently claim military or police background to bypass negotiations and deter suspicion.'
          },
          {
            title: 'QR Code to Receive Money',
            explanation: 'Claiming that scanning a code is necessary to receive a credit is a major red flag.'
          }
        ],
        attackerObjectives: ['Money'],
        impact: {
          financial: 'Loss of Rs. 15,000.',
          account: 'No compromise, but phone number flagged by scammer database.',
          privacy: 'Personal phone number and bank branch details exposed.',
          operational: 'UPI account blocked for transaction dispute.',
          emotional: 'Frustration and stress over financial loss.'
        },
        response: [
          'Reported transaction to UPI provider and filed dispute.',
          'Registered UPI fraud incident at cybercrime.gov.in.'
        ],
        preventionLessons: [
          'Remember: You only enter your UPI PIN to send money, never to receive it.',
          'Be suspicious of buyers who make quick decisions without inspecting physical products.'
        ],
        legalContext: ['Section 66D'],
        relatedCrimes: ['upi-payment-fraud'],
        sources: [
          {
            title: 'National UPI Safety Advisory: QR Codes Scams',
            authority: 'National Payments Corporation of India (NPCI)',
            url: 'https://www.npci.org.in',
            publicationDate: 'May 2025',
            sourceType: 'official'
          }
        ],
        published: true
      },
      {
        title: 'The Fake Banking Support Call',
        slug: 'fake-support-call-fraud',
        caseNumber: 'CASE FILE 003',
        caseType: 'anonymized-incident',
        incidentType: 'Vishing',
        attackVector: 'Phone',
        shortDescription: 'A phone call claiming to represent a bank credit card department urged the victim to share an OTP in order to waive card annual fees.',
        incidentDate: 'June 2025',
        publishedDate: 'July 2025',
        difficulty: 'Intermediate',
        featured: false,
        sourceSummary: 'Compiled from anonymized case records of bank customer support vishing attacks.',
        narrativeSections: [
          {
            heading: 'The Direct Call',
            body: 'An accountant received a phone call from an Indian mobile number. The caller introduced himself as an executive from the customer service division of the victim\'s credit card provider, mentioning the victim\'s name and credit card brand correctly.'
          },
          {
            heading: 'The Annual Fee Waive Offer',
            body: 'The caller stated that the card\'s annual fee of Rs. 4,999 was scheduled to be debited. However, due to the victim\'s excellent credit history, the bank was offering a lifetime waiver if the victim updated their card profile details over the phone.'
          },
          {
            heading: 'The OTP Request',
            body: 'The caller asked the victim to verify their credit card expiration date. Following this, the caller said: "I am sending a verification code to your registered mobile number to confirm the fee waiver. Please read it to me to complete the request."'
          },
          {
            heading: 'The Turning Point',
            body: 'The victim received an SMS containing a 6-digit OTP code. The caller pressed the victim: "Sir, the code expires in 30 seconds. Please read it quickly so I can apply the waiver."'
          },
          {
            heading: 'The Realization',
            body: 'The victim read the OTP to the caller. Immediately after the call ended, they received an SMS from their credit card showing a transaction of Rs. 98,000 processed at an e-commerce platform.'
          }
        ],
        timeline: [
          {
            time: '02:15 PM',
            label: 'Phone Call Received',
            description: 'Caller introduces himself as credit card executive.',
            type: 'contact'
          },
          {
            time: '02:18 PM',
            label: 'Waiver Incentive Offered',
            description: 'Annual fee waiver proposed to build interest.',
            type: 'deception'
          },
          {
            time: '02:20 PM',
            label: 'OTP Sent',
            description: 'Scammer triggers transaction OTP to victim\'s phone.',
            type: 'escalation'
          },
          {
            time: '02:22 PM',
            label: 'OTP Read to Caller',
            description: 'Victim shares the OTP under pressure.',
            type: 'decision'
          },
          {
            time: '02:23 PM',
            label: 'Debit Notification',
            description: 'Rs. 98,000 card charge notification received.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'A bank support executive calls and requests you to read a code sent to your phone. What should you check?',
            options: [
              {
                optionText: 'Check if the caller knows your full card details first before reading it.',
                isCorrect: false,
                explanation: 'Scammers often acquire leaked credit card lists with partial info to build trust.'
              },
              {
                optionText: 'Read the text content of the SMS. If it contains words like "transaction of Rs. X" or warns "Never share this code", hang up immediately.',
                isCorrect: true,
                explanation: 'Banks never call users to ask for transaction OTPs. OTPs are private authentication tokens.'
              }
            ],
            explanation: 'Never share codes over the phone.'
          }
        ],
        warningSigns: [
          {
            title: 'Call from Mobile Number',
            explanation: 'Official customer support usually calls from registered landline numbers or official toll-free shortcodes, not standard mobile numbers.'
          },
          {
            title: 'Waiving Fees via OTP',
            explanation: 'Applying discounts or waiving account fees never requires sharing a transaction OTP.'
          }
        ],
        attackerObjectives: ['Money', 'OTP'],
        impact: {
          financial: 'Loss of Rs. 98,000.',
          account: 'Credit card details compromised.',
          privacy: 'Personal cell number and banking relationship exposed.',
          operational: 'Card blocked and replaced.',
          emotional: 'Frustration and stress over disputed liability.'
        },
        response: [
          'Called credit card provider immediately to block the card.',
          'Reported transaction to national cybercrime helpline (1930) within 30 minutes.'
        ],
        preventionLessons: [
          'Under no circumstances share OTPs, passwords, or CVV codes with anyone calling on the phone, even if they claim to be banking staff.',
          'If a call seems suspicious, hang up and call the number printed on the back of your physical card.'
        ],
        legalContext: ['Section 66D', 'Section 66C'],
        relatedCrimes: ['vishing'],
        sources: [
          {
            title: 'Vishing & Support Impersonation Advisories',
            authority: 'State Cyber Cell Coordination Desk',
            url: 'https://cybercrime.gov.in',
            publicationDate: 'March 2025',
            sourceType: 'official'
          }
        ],
        published: true
      },
      {
        title: 'The Telegram Part-Time Job Scam',
        slug: 'fake-job-offer-scam',
        caseNumber: 'CASE FILE 004',
        caseType: 'educational-reconstruction',
        incidentType: 'Job Scams',
        attackVector: 'Telegram / SMS',
        shortDescription: 'A victim was lured into a fake remote job completing simple tasks, which escalated into a prepaid cryptocurrency "investment" trap.',
        incidentDate: 'September 2025',
        publishedDate: 'October 2025',
        difficulty: 'Intermediate',
        featured: false,
        sourceSummary: 'Reconstructed from recurring task-based Telegram job fraud files.',
        narrativeSections: [
          {
            heading: 'The Unsolicited Offer',
            body: 'A graduate looking for a job received an SMS offering a remote, flexible position: "Earn Rs. 3,000 to Rs. 8,000 daily by rating hotels and liking YouTube videos. Contact our HR manager on Telegram."'
          },
          {
            heading: 'The Easy Payouts',
            body: 'The graduate messaged the Telegram handle and was assigned 3 test tasks (liking specific hotel pages). After completion, they were asked for their bank details and received a real transfer of Rs. 450. This immediate payoff convinced them the job was genuine.'
          },
          {
            heading: 'The Investment Upgrade',
            body: 'The next day, they were added to a Telegram group with 50 other members who shared screenshots of massive daily earnings. The HR manager explained that to unlock higher-tier tasks, they needed to complete prepaid "crypto purchase tasks", where they pay cash and receive 130% back in credits on a mock trading dashboard.'
          },
          {
            heading: 'The Escalation Trap',
            body: 'The graduate paid Rs. 2,000 and received Rs. 2,600 back. Encouraged, they participated in a larger task, sending Rs. 20,000. This time, the dashboard showed their balance was Rs. 26,000, but when they tried to withdraw it, the manager claimed: "You made an input error. You must deposit Rs. 30,000 more to unlock the withdrawal channel."'
          },
          {
            heading: 'The Realization',
            body: 'Desperate to recover their money, they sent the Rs. 30,000. The manager then demanded another Rs. 50,000 to cover "income tax clearance". The victim realized they were caught in an endless deposit loop and would never get their money back.'
          }
        ],
        timeline: [
          {
            time: '10:00 AM',
            label: 'SMS Received',
            description: 'Received SMS offering high daily earnings for hotel ratings.',
            type: 'contact'
          },
          {
            time: '11:00 AM',
            label: 'First Payout',
            description: 'Completed basic hotel tasks and received Rs. 450 bank credit.',
            type: 'deception'
          },
          {
            time: '02:00 PM',
            label: 'Telegram Group Add',
            description: 'Added to group chat showing massive returns on prepaid tasks.',
            type: 'deception'
          },
          {
            time: '04:00 PM',
            label: 'First Prepaid Task',
            description: 'Deposited Rs. 2,000 and received Rs. 2,600 back.',
            type: 'decision'
          },
          {
            time: '05:30 PM',
            label: 'The Trap Lock',
            description: 'Sent Rs. 20,000. Withdrawal blocked; manager demands Rs. 30,000 more.',
            type: 'escalation'
          },
          {
            time: '06:00 PM',
            label: 'Loss Discovery',
            description: 'Sent Rs. 30,000, blocked from withdrawing again, manager demands Rs. 50,000.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'You complete a task and your balance is frozen. The manager demands a deposit to "unlock" your funds. What should you do?',
            options: [
              {
                optionText: 'Send the deposit to secure the extraction of your previous money.',
                isCorrect: false,
                explanation: 'Scammers will create fake fees, tax demands, and deposit blocks indefinitely. Sending more money only increases your loss.'
              },
              {
                optionText: 'Refuse to send any more money. Realize it is a scam, capture chat screenshots, and report it to the authorities.',
                isCorrect: true,
                explanation: 'A legitimate employer never requires employees to pay money or purchase packages to withdraw earnings.'
              }
            ],
            explanation: 'Never pay money to get paid.'
          }
        ],
        warningSigns: [
          {
            title: 'Prepaid Work Tasks',
            explanation: 'Being asked to deposit money or buy cryptocurrency packages as part of a "part-time job" is a massive red flag.'
          },
          {
            title: 'Earnings Group chats',
            explanation: 'Telegram groups filled with users constantly posting receipts of huge earnings are often composed of bot accounts or co-conspirators.'
          }
        ],
        attackerObjectives: ['Money'],
        impact: {
          financial: 'Loss of Rs. 50,000.',
          account: 'Bank details shared with scammers.',
          privacy: 'Personal Telegram account identity flagged.',
          operational: 'Loss of savings.',
          emotional: 'Deep regret, embarrassment, and stress.'
        },
        response: [
          'Stopped all communication with the Telegram handle.',
          'Filed transaction dispute with bank and logged case on national portal (cybercrime.gov.in).'
        ],
        preventionLessons: [
          'Ignore unsolicited remote job offers sent via SMS or messaging apps.',
          'Understand that legitimate businesses do not run employee operations through anonymous Telegram chats.'
        ],
        legalContext: ['Section 66D'],
        relatedCrimes: ['fake-job-scam'],
        sources: [
          {
            title: 'Prepaid Telegram Job Fraud Advisory',
            authority: 'Indian Cyber Crime Coordination Centre (I4C)',
            url: 'https://cybercrime.gov.in',
            publicationDate: 'June 2025',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Digital Arrest Extortion Incident',
        slug: 'digital-arrest-impersonation',
        caseNumber: 'CASE FILE 005',
        caseType: 'documented-case',
        incidentType: 'Social Engineering',
        attackVector: 'Phone / Video Call',
        shortDescription: 'Attackers impersonating police officers subjected the victim to a multi-hour "digital arrest" via video call, forcing them to transfer funds under threat of prosecution.',
        incidentDate: 'July 2025',
        publishedDate: 'August 2025',
        difficulty: 'Advanced',
        featured: false,
        sourceSummary: 'Based on actual national police advisories on digital arrest fraud schemes.',
        narrativeSections: [
          {
            heading: 'The Courier Warning',
            body: 'A retired teacher received an automated phone call claiming a parcel sent in her name containing illegal contraband (passports and drugs) had been intercepted by customs. She was transferred to an "investigator" claiming to represent the CBI.'
          },
          {
            heading: 'The Skype Video Trial',
            body: 'The investigator commanded the victim to download Skype and join a video call. On screen, the attacker wore a realistic police uniform and sat in front of a backdrop resembling a police station. He accused the victim of laundering money and presented a forged warrant with official court stamps.'
          },
          {
            heading: 'The Digital Arrest Command',
            body: 'The attacker ordered the victim to remain on camera continuously and forbade her from contacting family or leaving the room, calling it a "digital arrest" pending judicial review. He threatened immediate jail if she turned off the video.'
          },
          {
            heading: 'The Secret Verification Audit',
            body: 'To "verify her assets and clear her name", the attacker instructed the victim to transfer all her savings (Rs. 4,50,000) to a designated "government audit account". He promised the funds would be returned within 24 hours after verification.'
          },
          {
            heading: 'The Rescue',
            body: 'Frightened and isolated, the victim transferred the funds. The video call stayed connected for another hour until her daughter returned home, saw the Skype screen, and disconnected the call. The money was already gone.'
          }
        ],
        timeline: [
          {
            time: '11:00 AM',
            label: 'Call Interception',
            description: 'Automated call claims parcel intercepted with drugs.',
            type: 'contact'
          },
          {
            time: '11:15 AM',
            label: 'Skype Call Initiated',
            description: 'Joined Skype call with police-uniformed impersonator.',
            type: 'deception'
          },
          {
            time: '12:00 PM',
            label: 'Digital Arrest Declared',
            description: 'Ordered to stay on camera under threat of jail.',
            type: 'escalation'
          },
          {
            time: '01:30 PM',
            label: 'Money Transfer',
            description: 'Transferred Rs. 4,50,000 to "audit account" under pressure.',
            type: 'decision'
          },
          {
            time: '02:45 PM',
            label: 'Daughter Intervention',
            description: 'Daughter disconnects Skype call, realizing fraud.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'A caller claiming to be a CBI/police official states you are under "digital arrest" and requires you to remain on video call. What is the legal truth?',
            options: [
              {
                optionText: 'Obey the commands to avoid facing actual police custody.',
                isCorrect: false,
                explanation: 'Scammers rely on intimidation and isolation to coerce you into compliance.'
              },
              {
                optionText: 'Understand that "Digital Arrest" does not exist under Indian law. Hang up immediately, and report the caller to the police.',
                isCorrect: true,
                explanation: 'Police and CBI do not conduct investigations or arrests via Skype/WhatsApp video calls, nor do they request money transfers to verify accounts.'
              }
            ],
            explanation: 'Law enforcement agencies never ask for funds over the phone.'
          }
        ],
        warningSigns: [
          {
            title: 'The Concept of Digital Arrest',
            explanation: 'No Indian law enforcement agency has the power or procedure to place a citizen under digital arrest over Skype/video.'
          },
          {
            title: 'Payment to Audit Accounts',
            explanation: 'Official judicial inquiries never require transferring money to secret government nodes to "prove innocence".'
          }
        ],
        attackerObjectives: ['Money'],
        impact: {
          financial: 'Loss of Rs. 4,50,000.',
          account: 'No credential compromise, but banking details recorded.',
          privacy: 'Personal address and ID cards shown to scammers.',
          operational: 'CBI complaint logged.',
          emotional: 'Severe psychological trauma and fear.'
        },
        response: [
          'Immediate filing of cyber fraud complaint at local police cell.',
          'Logged emergency block request with the bank.'
        ],
        preventionLessons: [
          'Hang up immediately on any call threatening arrest over parcel intercepts.',
          'Never make financial decisions or transfers under phone threat. Call your local police helpline directly to confirm.'
        ],
        legalContext: ['Section 66D', 'Section 66C'],
        relatedCrimes: ['online-impersonation'],
        sources: [
          {
            title: 'CBI Public Advisory on Digital Arrest Extortion',
            authority: 'Central Bureau of Investigation (CBI)',
            url: 'https://cbi.gov.in',
            publicationDate: 'June 2025',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Aadhaar Enabled Biometric Theft',
        slug: 'aeps-biometric-theft',
        caseNumber: 'CASE FILE 006',
        caseType: 'documented-case',
        incidentType: 'Identity Theft',
        attackVector: 'Biometric Cloning',
        shortDescription: 'A property transaction at a local registry office resulted in leaked fingerprint data, which was cloned to drain bank accounts through the Aadhaar Enabled Payment System.',
        incidentDate: 'May 2025',
        publishedDate: 'June 2025',
        difficulty: 'Advanced',
        featured: false,
        sourceSummary: 'Based on actual police reports regarding silicone-based thumbprint duplication and AePS system exploits.',
        narrativeSections: [
          {
            heading: 'The Land Registration',
            body: 'A property owner visited a local land registry office to complete a sale. As part of the standard documentation, he was required to press his thumb onto a biometric fingerprint scanner to authenticate details.'
          },
          {
            heading: 'The Silicone Clone',
            body: 'Unbeknownst to the owner, details from the registry database (including Aadhaar numbers and fingerprint images) were leaked by registry staff. The scammers used a simple chemical process to print the owner\'s fingerprint onto a soft silicone sheet.'
          },
          {
            heading: 'The AePS Withdrawal Loop',
            body: 'Using the owner\'s Aadhaar number and the cloned silicone print, the attackers accessed an Aadhaar Enabled Payment System (AePS) micro-ATM device. AePS allows biometric withdrawals without credit cards, pins, or SMS OTP confirmation.'
          },
          {
            heading: 'The Silent Debits',
            body: 'Over the course of 48 hours, the attackers withdrew Rs. 10,000 (the maximum daily limit per transaction) multiple times from the owner\'s account. Since he did not have SMS notifications active on that specific secondary bank account, he did not notice the withdrawals immediately.'
          },
          {
            heading: 'The Discovery',
            body: 'The owner discovered the theft only when he updated his bank passbook at a physical branch, showing Rs. 50,000 missing via cash payouts made through biometric terminal endpoints.'
          }
        ],
        timeline: [
          {
            time: '10:00 AM',
            label: 'Biometric Input',
            description: 'Owner authenticated property sale on registry scanner.',
            type: 'contact'
          },
          {
            time: '01:00 PM',
            label: 'Data Interception',
            description: 'Fingerprint images leaked and silicon thumbprint cloned.',
            type: 'deception'
          },
          {
            time: '09:00 PM',
            label: 'AePS Withdrawal 1',
            description: 'Attacker processes biometric withdrawal on micro-ATM.',
            type: 'decision'
          },
          {
            time: '09:05 PM',
            label: 'AePS Withdrawal 2',
            description: 'Attacker repeats withdrawals at a different terminal.',
            type: 'escalation'
          },
          {
            time: '04:00 PM',
            label: 'Passbook Discovery',
            description: 'User notices Rs. 50,000 debit logs in passbook details.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'How can you protect your Aadhaar biometric details from being used by micro-ATM endpoints without your knowledge?',
            options: [
              {
                optionText: 'Avoid using fingerprint scanners entirely for official registration.',
                isCorrect: false,
                explanation: 'Registry authentication is a legal requirement; you cannot simply refuse biometrics.'
              },
              {
                optionText: 'Use the official mAadhaar app or UIDAI web portal to lock your biometrics. Unlock them only when you are physically registering, and lock them immediately after.',
                isCorrect: true,
                explanation: 'Locking biometrics on UIDAI prevents AePS terminals from executing authentication lookups, neutralizing cloned fingerprint attacks.'
              }
            ],
            explanation: 'Aadhaar biometric locks are highly effective prevention tools.'
          }
        ],
        warningSigns: [
          {
            title: 'Lack of SMS Notifications',
            explanation: 'Having secondary accounts without active SMS alerts prevents immediate detection of silent withdrawals.'
          },
          {
            title: 'No Biometric Locks',
            explanation: 'Leaving Aadhaar biometrics permanently unlocked leaves you vulnerable if fingerprint logs leak.'
          }
        ],
        attackerObjectives: ['Money', 'Biometrics'],
        impact: {
          financial: 'Loss of Rs. 50,000.',
          account: 'Secondary bank account debited.',
          privacy: 'Biometric records and Aadhaar number stolen.',
          operational: 'Aadhaar card biometrics locked manually.',
          emotional: 'Deep worry over physical biometric safety.'
        },
        response: [
          'Logged into UIDAI portal and executed immediate Biometric Lock.',
          'Filed police cell complaint with fingerprint audit request from UIDAI.'
        ],
        preventionLessons: [
          'Keep your biometrics locked on the mAadhaar app at all times except during verification.',
          'Monitor bank accounts regularly and ensure SMS notifications are active on all profiles.'
        ],
        legalContext: ['Section 66C'],
        relatedCrimes: ['identity-theft'],
        sources: [
          {
            title: 'UIDAI Security Guidelines on AePS and Biometric Locking',
            authority: 'Unique Identification Authority of India (UIDAI)',
            url: 'https://uidai.gov.in',
            publicationDate: 'April 2025',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Restaurant Table QR Code Swap',
        slug: 'restaurant-qr-code-scam',
        caseNumber: 'CASE FILE 007',
        caseType: 'educational-reconstruction',
        incidentType: 'Payment Scams',
        attackVector: 'QR Code',
        shortDescription: 'A customer scanned a malicious QR code sticker pasted over a restaurant\'s official checkout code, directing them to a fake portal that captured UPI credentials.',
        incidentDate: 'November 2025',
        publishedDate: 'December 2025',
        difficulty: 'Beginner',
        featured: false,
        sourceSummary: 'Reconstructed from merchant QR swap advisories issued by retail payment providers.',
        narrativeSections: [
          {
            heading: 'The Quick Lunch Checkout',
            body: 'A customer finished dining at a busy central restaurant. Rather than queuing at the register, they decided to pay using the quick-checkout UPI QR code sticker affixed to the table card.'
          },
          {
            heading: 'The QR Code Replacement',
            body: 'An attacker had entered the restaurant earlier and pasted a malicious QR code sticker directly over the restaurant\'s real QR code. The sticker looked identical but pointed to a custom URL instead of a standard payment endpoint.'
          },
          {
            heading: 'The Cloned Payment Gateway',
            body: 'Scanning the QR code redirected the customer\'s browser to a web page cloned to resemble the restaurant\'s mobile payment screen. The screen prompted: "Enter your bank name, phone number, and UPI transaction PIN to complete transaction of Rs. 650."'
          },
          {
            heading: 'The Submission',
            body: 'The customer typed their bank name and entered their UPI PIN into the web interface. Immediately after clicking submit, the page threw a connection error.'
          },
          {
            heading: 'The Discovery',
            body: 'Suspecting a glitch, the customer checked their banking app. Instead of Rs. 650 paid to the restaurant, they saw a debit of Rs. 25,000 sent to a peer-to-peer wallet address.'
          }
        ],
        timeline: [
          {
            time: '01:30 PM',
            label: 'QR Scanned',
            description: 'Scanned the QR code pasted on the dining table.',
            type: 'contact'
          },
          {
            time: '01:32 PM',
            label: 'Fake Gateway Opened',
            description: 'Browser redirected to cloned checkout screen.',
            type: 'deception'
          },
          {
            time: '01:34 PM',
            label: 'PIN entered on Web',
            description: 'Entered UPI PIN on the webpage input forms.',
            type: 'decision'
          },
          {
            time: '01:35 PM',
            label: 'Transaction Error',
            description: 'Page errors out; attacker drains Rs. 25,000 from banking API.',
            type: 'escalation'
          },
          {
            time: '01:37 PM',
            label: 'Check Statement',
            description: 'Discovered unauthorized Rs. 25,000 transfer in transaction history.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'You scan a physical QR code to pay a bill, and it redirects you to a web browser page asking you to type your UPI PIN. Is this safe?',
            options: [
              {
                optionText: 'Yes, if the page matches the restaurant logo.',
                isCorrect: false,
                explanation: 'Visual designs are easily copied. Legitimate UPI transactions never input PINs in standard web browsers.'
              },
              {
                optionText: 'No, UPI PINs should only be typed inside official payment apps (like Google Pay, PhonePe, Paytm), never on a web browser page.',
                isCorrect: true,
                explanation: 'Web browsers do not have UPI terminal privileges. Any browser page asking for a UPI PIN is a credential-harvesting trap.'
              }
            ],
            explanation: 'Keep your PIN inside official payment apps.'
          }
        ],
        warningSigns: [
          {
            title: 'Redirect to Browser',
            explanation: 'A payment QR code should prompt your phone to open your selected UPI application directly, not a web browser page.'
          },
          {
            title: 'Pasted Stickers',
            explanation: 'Physical QR codes that are stickers pasted over other materials suggest physical manipulation.'
          }
        ],
        attackerObjectives: ['UPI PIN', 'Money'],
        impact: {
          financial: 'Loss of Rs. 25,000.',
          account: 'UPI PIN compromised, requiring immediate change.',
          privacy: 'Bank name and phone number captured.',
          operational: 'UPI account locked and reset.',
          emotional: 'Frustration and hyper-awareness at public venues.'
        },
        response: [
          'Changed UPI PIN immediately inside the official payment app.',
          'Notified restaurant management of the tampered table sticker.',
          'Reported incident to UPI provider and cybercell.'
        ],
        preventionLessons: [
          'Verify the name of the payee displayed on your UPI app screen before clicking send.',
          'Never enter your UPI PIN on web browser interfaces.'
        ],
        legalContext: ['Section 66D'],
        relatedCrimes: ['upi-payment-fraud'],
        sources: [
          {
            title: 'Retail Merchant Tampering Advisories',
            authority: 'Unified Payments Interface (UPI) Security Desk',
            url: 'https://www.npci.org.in',
            publicationDate: 'October 2025',
            sourceType: 'official'
          }
        ],
        published: true
      },
      {
        title: 'The SIM Swap Credential Hijack',
        slug: 'sim-swap-compromise',
        caseNumber: 'CASE FILE 008',
        caseType: 'anonymized-incident',
        incidentType: 'Account Takeover',
        attackVector: 'SIM Swap',
        shortDescription: 'Attackers social-engineered a mobile network outlet to deactivate a user\'s SIM card and issue a duplicate, intercepting SMS OTPs to drain netbanking profiles.',
        incidentDate: 'December 2025',
        publishedDate: 'January 2026',
        difficulty: 'Advanced',
        featured: false,
        sourceSummary: 'Anonymized case file from mobile security and financial fraud registry.',
        narrativeSections: [
          {
            heading: 'The Network Loss',
            body: 'A business owner noticed his smartphone suddenly lost network connection in the middle of a workday. The screen displayed "No Service". Thinking it was a temporary network tower glitch, he ignored it and connected to his office Wi-Fi.'
          },
          {
            heading: 'The Duplicate SIM Issuance',
            body: 'Earlier that day, attackers presenting forged identity documents and claiming to be the owner visited a mobile network branch. They requested a duplicate SIM card, asserting their phone was lost. The branch staff deactivated the owner\'s real SIM and activated the new duplicate card in the attacker\'s device.'
          },
          {
            heading: 'The Netbanking Access',
            body: 'The attackers, who already possessed the victim\'s netbanking username and password through a previous data leak, requested a password reset on the bank\'s portal. The bank sent the OTP text to the registered mobile number, which was received by the attackers\' duplicate SIM.'
          },
          {
            heading: 'The Drain',
            body: 'Using the intercepted SMS OTP, the attackers bypassed the bank\'s two-factor authentication, logged into the account, added multiple beneficiary profiles, and initiated transfers totaling Rs. 8,00,000.'
          },
          {
            heading: 'The Discovery',
            body: 'The business owner realized the extent of the compromise only the next morning when he visited a mobile network store to check his connection, where staff told him: "Your duplicate SIM request was processed yesterday."'
          }
        ],
        timeline: [
          {
            time: '11:00 AM',
            label: 'No Service Error',
            description: 'Smartphone loses signal; displays "No Service".',
            type: 'contact'
          },
          {
            time: '11:15 AM',
            label: 'Duplicate SIM Issued',
            description: 'Attackers get clone SIM activated at mobile carrier shop.',
            type: 'deception'
          },
          {
            time: '12:30 PM',
            label: 'Password Reset',
            description: 'Attackers trigger banking password reset, intercepting OTP.',
            type: 'escalation'
          },
          {
            time: '01:00 PM',
            label: 'Funds Transferred',
            description: 'Rs. 8,00,000 transferred out of account over 4 transactions.',
            type: 'decision'
          },
          {
            time: '09:00 AM',
            label: 'Carrier Review',
            description: 'Owner visits store, discovering duplicate activation.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'Your mobile phone suddenly loses signal permanently and displays "No Service". What is the safest immediate action?',
            options: [
              {
                optionText: 'Wait 24 hours to see if network coverage is restored.',
                isCorrect: false,
                explanation: 'Waiting allows attackers plenty of time to capture OTPs and compromise your accounts.'
              },
              {
                optionText: 'Contact your mobile carrier immediately from another device to check if a duplicate SIM was requested, and check your bank statements.',
                isCorrect: true,
                explanation: 'Immediate reporting minimizes the window attackers have to capture SMS security codes.'
              }
            ],
            explanation: 'Always verify sudden network loss.'
          }
        ],
        warningSigns: [
          {
            title: 'Sudden Network Loss',
            explanation: 'Sudden and permanent loss of cell service in areas with historically good coverage is a warning sign of unauthorized SIM swapping.'
          },
          {
            title: 'Unsolicited OTP SMS Logs',
            explanation: 'Receiving password-reset OTP logs shortly before signal loss indicates credential probing.'
          }
        ],
        attackerObjectives: ['SMS Interception', 'Money'],
        impact: {
          financial: 'Loss of Rs. 8,00,000.',
          account: 'Netbanking password and SIM card compromised.',
          privacy: 'Personal identity records leaked.',
          operational: 'Company payroll accounts disrupted.',
          emotional: 'Extreme anxiety, panic, and distress.'
        },
        response: [
          'Instructed mobile carrier to deactivate the duplicate SIM immediately.',
          'Instructed bank to freeze all corporate and personal banking profiles.',
          'Filed police complaint and registered case with state cyber cell.'
        ],
        preventionLessons: [
          'Do not ignore sudden and unexplained cellular service deactivation. Contact your operator immediately.',
          'Use app-based or token-based authenticator tools instead of SMS OTP codes for banking security where possible.'
        ],
        legalContext: ['Section 66C', 'Section 66D'],
        relatedCrimes: ['sim-swapping'],
        sources: [
          {
            title: 'SIM Swapping Financial Scams Advisory',
            authority: 'Telecom Regulatory Authority of India (TRAI)',
            url: 'https://www.trai.gov.in',
            publicationDate: 'September 2025',
            sourceType: 'government'
          }
        ],
        published: true
      }
    ];

    for (let cs of caseStudiesData) {
      await CaseStudy.findOneAndUpdate({ slug: cs.slug }, cs, { upsert: true, new: true });
    }

    // 7. Quizzes
    console.log('- Seeding quizzes...');
    const quizzesData = [
      { title: 'Phishing Prevention Challenge', category: 'Phishing', description: 'Test your ability to spot mock websites and spoof emails.', difficulty: 'Beginner' },
      { title: 'Social Engineering & Vishing', category: 'Social Engineering', description: 'Test your defense against psychological manipulation and fake phone calls.', difficulty: 'Intermediate' },
      { title: 'UPI & Financial Safety', category: 'Financial Safety', description: 'Test your payment security habits and QR transaction awareness.', difficulty: 'Intermediate' },
      { title: 'Credentials & Account Security', category: 'Account Security', description: 'Test your account defense strength, password hygiene, and MFA checks.', difficulty: 'Advanced' },
      { title: 'Cyber Law & Privacy Basics', category: 'Cyber Law Basics', description: 'Test your understanding of the IT Act, 2000, and the DPDP Act, 2023.', difficulty: 'Beginner' }
    ];

    const quizMap = {};
    for (let quizData of quizzesData) {
      let quiz = await Quiz.findOne({ title: quizData.title });
      if (!quiz) {
        quiz = await Quiz.create(quizData);
      } else {
        await Quiz.updateOne({ _id: quiz._id }, quizData);
      }
      quizMap[quizData.category] = quiz;
    }

    const fs = require('fs');
    const qPart1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'quizQuestions_part1.json'), 'utf8'));
    const qPart2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'quizQuestions_part2.json'), 'utf8'));
    const quizQuestionsData = [...qPart1, ...qPart2];

    for (let qData of quizQuestionsData) {
      const dbQuiz = quizMap[qData.category];
      if (!dbQuiz) {
        throw new Error(`Quiz not found for category: ${qData.category}`);
      }
      qData.quizId = dbQuiz._id;
      await QuizQuestion.findOneAndUpdate(
        { quizId: qData.quizId, questionText: qData.questionText },
        qData,
        { upsert: true, new: true }
      );
    }

    // 8. Scenario Engine Seeding (Baseline & Branching Final)
    console.log('- Seeding scenario engine nodes...');
    
    async function upsertStage(stageData) {
      const existing = await ScenarioStage.findOne({
        scenarioId: stageData.scenarioId,
        stageOrder: stageData.stageOrder
      });
      if (existing) {
        await ScenarioStage.updateOne({ _id: existing._id }, stageData);
        return existing;
      }
      return ScenarioStage.create(stageData);
    }

    async function upsertDecision(decisionData) {
      const existing = await ScenarioDecision.findOne({
        stageId: decisionData.stageId,
        optionText: decisionData.optionText
      });
      if (existing) {
        await ScenarioDecision.updateOne({ _id: existing._id }, decisionData);
        return existing;
      }
      return ScenarioDecision.create(decisionData);
    }

    const scenariosData = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenarios.json'), 'utf8'));

    for (let sData of scenariosData) {
      let scenario = await Scenario.findOne({ slug: sData.scenario.slug, version: sData.scenario.version });
      if (!scenario) {
        scenario = await Scenario.create(sData.scenario);
      } else {
        await Scenario.updateOne({ _id: scenario._id }, sData.scenario);
      }

      const stageMap = {};
      const decisionsList = [];

      for (let stg of sData.stages) {
        const stagePayload = {
          scenarioId: scenario._id,
          stageOrder: stg.stageOrder,
          title: stg.title,
          description: stg.description,
          mockInterfaceType: stg.mockInterfaceType,
          mockInterfaceData: stg.mockInterfaceData,
          eventClassification: stg.eventClassification,
          terminal: stg.terminal
        };

        const dbStage = await upsertStage(stagePayload);
        stageMap[stg.stageOrder] = dbStage;

        if (stg.decisions && stg.decisions.length > 0) {
          decisionsList.push({
            stageOrder: stg.stageOrder,
            decisions: stg.decisions
          });
        }
      }

      for (let dList of decisionsList) {
        const parentStage = stageMap[dList.stageOrder];
        const decisionIds = [];

        for (let dec of dList.decisions) {
          let resolvedNextStageId = null;
          if (dec.nextStageOrder !== null && dec.nextStageOrder !== undefined) {
            const nextStageObj = stageMap[dec.nextStageOrder];
            if (nextStageObj) {
              resolvedNextStageId = nextStageObj._id;
            }
          }

          const decisionPayload = {
            stageId: parentStage._id,
            optionText: dec.optionText,
            scoreChange: dec.scoreChange,
            categoryScoreWeights: dec.categoryScoreWeights,
            riskLevel: dec.riskLevel,
            isCriticalMistake: dec.isCriticalMistake,
            nextStageId: resolvedNextStageId,
            explanation: dec.explanation,
            outcomeType: dec.outcomeType
          };

          const dbDecision = await upsertDecision(decisionPayload);
          decisionIds.push(dbDecision._id);
        }

        await ScenarioStage.updateOne(
          { _id: parentStage._id },
          { $set: { availableDecisionIds: decisionIds } }
        );
      }
    }

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
