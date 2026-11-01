const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
const LearningModule = require('../models/LearningModule');
const learningModulesData = require('./seedModulesData');

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
      await LearningModule.deleteMany({});
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

    let sourceITRules = await LegalSource.findOne({ title: /Intermediary Guidelines|IT Intermediary Rules/ });
    if (!sourceITRules) {
      sourceITRules = await LegalSource.create({
        title: 'IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021',
        authority: 'Ministry of Electronics and Information Technology',
        url: 'https://www.meity.gov.in/content/notification-it-rules-2021',
        sourceType: 'government-guidance',
        description: 'Regulatory rules governing social media intermediaries and digital platforms.'
      });
    }

    let sourceCERTIn = await LegalSource.findOne({ title: /CERT-In Directions/ });
    if (!sourceCERTIn) {
      sourceCERTIn = await LegalSource.create({
        title: 'CERT-In Directions on Information Security Practices, 2022',
        authority: 'Indian Computer Emergency Response Team (CERT-In), MeitY',
        url: 'https://www.cert-in.org.in/Directions2022.jsp',
        sourceType: 'government-guidance',
        description: 'Mandatory cybersecurity incident reporting within 6 hours and log retention directions issued under Section 70B(6).'
      });
    }

    let sourceBSA = await LegalSource.findOne({ title: /Bharatiya Sakshya Adhiniyam/ });
    if (!sourceBSA) {
      sourceBSA = await LegalSource.create({
        title: 'Bharatiya Sakshya Adhiniyam, 2023 Text',
        authority: 'Ministry of Home Affairs, Government of India',
        url: 'https://www.mha.gov.in',
        sourceType: 'legislation',
        description: 'Statutory rules on admissibility and proof of electronic records under Section 63, replacing Section 65B of Evidence Act.'
      });
    }

    let sourceRBI = await LegalSource.findOne({ title: /Reserve Bank of India Master Direction|RBI Master Direction/ });
    if (!sourceRBI) {
      sourceRBI = await LegalSource.create({
        title: 'RBI Master Direction on Digital Payment Security Controls',
        authority: 'Reserve Bank of India',
        url: 'https://www.rbi.org.in',
        sourceType: 'government-guidance',
        description: 'Regulatory framework governing digital payment security, multi-factor authentication, and customer liability limitation.'
      });
    }

    let sourceArjunPanditrao = await LegalSource.findOne({ title: /Arjun Panditrao Khotkar/ });
    if (!sourceArjunPanditrao) {
      sourceArjunPanditrao = await LegalSource.create({
        title: 'Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020)',
        authority: 'Supreme Court of India',
        url: 'https://main.sci.gov.in/judgments',
        sourceType: 'judgment',
        description: 'Three-Judge Bench landmark judgment clarifying certificate mandatory requirement for secondary electronic evidence admissibility.'
      });
    }

    let sourceI4C = await LegalSource.findOne({ title: /National Cybercrime Coordination Centre|I4C Citizen Advisories/ });
    if (!sourceI4C) {
      sourceI4C = await LegalSource.create({
        title: 'I4C Citizen Advisories on Digital Arrest & Financial Frauds',
        authority: 'National Cybercrime Coordination Centre (I4C), MHA',
        url: 'https://cybercrime.gov.in',
        sourceType: 'official-awareness',
        description: 'Official law enforcement warnings and standard operating procedures for digital arrest, mule accounts, and 1930 reporting.'
      });
    }

    // Clean up any historical duplicate legal source entries by title
    const uniqueSourceTitles = await LegalSource.distinct('title');
    for (const t of uniqueSourceTitles) {
      const records = await LegalSource.find({ title: t }).sort({ createdAt: 1 });
      if (records.length > 1) {
        const [keep, ...remove] = records;
        await LegalSource.deleteMany({ _id: { $in: remove.map(r => r._id) } });
      }
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
        commencementStatus: 'In force. Notified on 27th October 2009 via G.S.R. 775(E). Slated for omission under Section 44(2) of the DPDP Act, 2023 once gazetted; remains operative until official commencement.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008. Slated for omission under DPDP Act 2023 s. 44(2) upon official gazette appointment.',
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
        relatedCyberCrimes: ['vishing', 'upi-payment-fraud', 'marketplace-scams'],
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
        relatedCyberCrimes: ['marketplace-scams', 'upi-payment-fraud'],
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
        relatedCyberCrimes: ['identity-theft', 'online-impersonation'],
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
      },
      {
        sectionNumber: 'Section 43',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Penalty and compensation for damage to computer, computer system, etc.',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Establishes civil liability and financial compensation to the affected person if anyone without permission accesses a computer, downloads/copies data, introduces computer contaminants or viruses, damages data, or disrupts computer services. Under the IT Amendment Act 2008, compensation under Section 43 has no statutory upper ceiling; claims up to ₹5 crore are adjudicated by the State IT Adjudicating Officer under Section 46(1A), while claims exceeding ₹5 crore lie before the competent civil court.',
        officialText: 'If any person without permission of the owner or any other person who is incharge of a computer, computer system or computer network... accesses or secures access... downloads, copies or extracts any data... introduces or causes to be introduced any computer contaminant or computer virus... he shall be liable to pay damages by way of compensation to the person so affected.',
        whyItMatters: 'Foundational statutory basis for civil remedies against unauthorized database downloads, insider data extraction, and ransomware disruption. Victims can petition the State IT Adjudicating Officer for compensation up to ₹5 crore, or civil court for larger claims.',
        exampleScenario: 'A departing sales manager downloads 5,000 confidential client records to a personal flash drive without authorization before joining a competitor.',
        penaltyOrLegalEffect: 'Civil liability: Damages by way of compensation to the affected person without statutory cap (adjudicated by the State IT Adjudicating Officer for claims up to ₹5 crore under Section 46(1A); claims above ₹5 crore lie before the competent civil court).',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 17th October 2000; liability framework enhanced on 27th October 2009.',
        amendmentStatus: 'Amended via the IT Amendment Act, 2008 (Act 10 of 2009) to replace the original ₹1 crore penalty cap with uncapped compensatory damages, aligning with Section 46(1A) pecuniary jurisdiction.',
        keywords: ['unauthorized access', 'data theft', 'malware injection', 'compensation', 'adjudicating officer', 'section 43'],
        relatedCyberCrimes: ['malware', 'credential-theft', 'ransomware'],
        relatedCaseStudies: ['classified-marketplace-qr-fraud'],
        relatedModules: ['endpoint-security'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Computer related offences',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Criminalizes any act referred to in Section 43 (such as unauthorized access, hacking, system disruption, or data alteration) when committed dishonestly or fraudulently. Carries up to 3 years imprisonment.',
        officialText: 'If any person, dishonestly or fraudulently, does any act referred to in section 43, he shall be punishable with imprisonment for a term which may extend to three years or with fine which may extend to five lakh rupees or with both.',
        whyItMatters: 'The primary criminal section under Indian law for prosecuting hackers, illegal intrusion, server compromises, and unauthorized database modifications.',
        exampleScenario: 'An attacker exploits an SQL injection vulnerability to breach an e-commerce database, alter customer balances, and delete transaction logs.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years, or a fine of up to ₹5,00,000, or both.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Substituted by the IT Amendment Act, 2008, effective from 27th October 2009.',
        amendmentStatus: 'Substituted by IT Amendment Act, 2008 (originally designated as "hacking with computer system").',
        keywords: ['hacking', 'dishonest access', 'data alteration', 'system intrusion', 'section 66'],
        relatedCyberCrimes: ['malware', 'ransomware', 'account-takeover'],
        relatedCaseStudies: ['sim-swap-compromise'],
        relatedModules: ['endpoint-security'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 66B',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for dishonestly receiving stolen computer resource or communication device',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Punishes anyone who knowingly or with reasonable belief receives or retains any stolen computer, laptop, mobile phone, or communication device with up to 3 years imprisonment.',
        officialText: 'Whoever dishonestly receive or retains any stolen computer resource or communication device knowing or having reason to believe the same to be stolen computer resource or communication device, shall be punished with imprisonment of either description for a term which may extend to three years or with fine which may extend to one lakh rupees or with both.',
        whyItMatters: 'Directly targets grey market fencing operations and syndicates that purchase stolen smartphones used for SIM swapping and fraudulent financial transactions.',
        exampleScenario: 'A phone repair shop knowingly buys stolen iPhones without invoices from a thief for resale and digital extraction.',
        penaltyOrLegalEffect: 'Imprisonment of up to 3 years, or a fine of up to ₹1,00,000, or both.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['stolen device', 'grey market', 'stolen mobile', 'fencing', 'section 66b'],
        relatedCyberCrimes: ['sim-swapping', 'identity-theft'],
        relatedCaseStudies: ['sim-swap-compromise'],
        relatedModules: ['device-security'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 67B',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Punishment for publishing or transmitting material depicting children in sexually explicit act, etc., in electronic form',
        role: 'Core Cyber Law',
        plainLanguageExplanation: 'Strictly criminalizes creating, collecting, seeking, browsing, downloading, advertising, promoting, exchanging, or publishing Child Sexual Abuse Material (CSAM) in electronic format. Imposes mandatory non-bailable prison terms.',
        officialText: 'Whoever publishes or transmits or causes to be published or transmitted in the electronic form, any material which depicts children engaged in sexually explicit act... shall be punished on first conviction with imprisonment of either description for a term which may extend to five years and with fine which may extend to ten lakh rupees...',
        whyItMatters: 'Central pillar of India\'s statutory framework protecting minors in the digital ecosystem. Works alongside the POCSO Act, 2012 to mandate reporting and permanent removal by intermediaries.',
        exampleScenario: 'A user operates an invite-only Telegram group exchanging prohibited exploitation imagery. Police Cyber Cell intercepts the traffic and files an FIR under Section 67B.',
        penaltyOrLegalEffect: 'First conviction: Imprisonment up to 5 years and fine up to ₹10,00,000. Subsequent conviction: Imprisonment up to 7 years and fine up to ₹10,00,000.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['csam', 'child safety', 'child sexual abuse material', 'non-bailable', 'pocso', 'section 67b'],
        relatedCyberCrimes: ['online-harassment', 'sextortion'],
        relatedCaseStudies: [],
        relatedModules: ['child-safety'],
        officialSourceId: sourceIndiaCode._id
      },
      {
        sectionNumber: 'Section 70B',
        actName: 'Information Technology Act, 2000',
        officialTitle: 'Indian Computer Emergency Response Team to serve as national nodal agency for incident response',
        role: 'Sector Regulation',
        plainLanguageExplanation: 'Designates CERT-In as the national agency for monitoring cybersecurity incidents, issuing threat advisories, and emergency response. Under Directions No. 20(3)/2022-CERT-In issued under Section 70B(6), specified entities (service providers, intermediaries, data centres, body corporate, and government organizations) must report 20 categories of cybersecurity incidents to CERT-In within 6 hours. This mandatory 6-hour timeline applies to covered organizations and entities, not indiscriminately to individual citizens.',
        officialText: 'The Central Government shall, by notification in the Official Gazette, appoint an agency of the Government to be called the Indian Computer Emergency Response Team... (6) The service provider, intermediaries, data centres, body corporate and any other person shall fail to provide information to CERT-In or fail to comply with the direction... punishable with imprisonment up to one year or fine up to one lakh rupees.',
        whyItMatters: 'Statutory basis for national incident coordination and the mandatory 6-hour cybersecurity incident reporting obligation for covered organizations, critical infrastructure intermediaries, and body corporates under the 2022 Directions.',
        exampleScenario: 'A fintech payment gateway experiences a ransomware attack encrypting transaction databases. Under Section 70B(6) Directions, the corporate entity must report the incident to CERT-In within 6 hours of noticing it.',
        penaltyOrLegalEffect: 'Non-compliance with CERT-In directions: Imprisonment of up to 1 year, or a fine of up to ₹1,00,000, or both.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified on 27th October 2009. Binding Directions issued under subsection (6) on 28th April 2022.',
        amendmentStatus: 'Inserted via the IT Amendment Act, 2008.',
        keywords: ['cert-in', 'incident reporting', '6-hour rule', 'log retention', 'data breach notification', 'section 70b'],
        relatedCyberCrimes: ['ransomware', 'malware', 'data-breach'],
        relatedCaseStudies: ['phishing-credential-takeover'],
        relatedModules: ['incident-response'],
        officialSourceId: sourceCERTIn._id
      },
      {
        sectionNumber: 'BSA Section 63',
        actName: 'Bharatiya Sakshya Adhiniyam, 2023',
        officialTitle: 'Admissibility of electronic records and mandatory certification',
        role: 'Related Criminal Law',
        plainLanguageExplanation: 'Governs how digital evidence (WhatsApp chats, emails, CCTV footage, server logs, SMS transcripts) must be presented in Indian courts. Replaces Section 65B of the repealed Indian Evidence Act from 1 July 2024. Mandates submission of a certificate in terms of the BSA Schedule (Part A by the device owner/operator, and Part B by an expert where technical extraction is performed).',
        officialText: 'Any information contained in an electronic record which is printed on paper, stored, recorded or copied in optical or magnetic media or cloud... shall be deemed to be also a document... and shall be admissible in any proceedings, without further proof or production of the original... accompanied by a certificate signed by a person occupying a responsible official position in relation to the operation of the relevant device or the management of the relevant activities, or an expert.',
        whyItMatters: 'Printed chat screenshots or exported call logs are inadmissible in an Indian criminal or civil trial unless submitted with an accompanying Section 63(4) Schedule certificate specifying device make, model, IMEI, cloud identifiers, and affirming system integrity.',
        exampleScenario: 'In a cyber financial cheating trial, the victim submits printed bank SMS notifications and fraudster chat logs accompanied by a signed BSA Section 63 Schedule certificate detailing the phone IMEI and extraction method.',
        penaltyOrLegalEffect: 'Procedural evidentiary rule governing admissibility of digital records. Submitting a knowingly false certificate constitutes perjury under BNS.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified effective from 1st July 2024 via S.O. 852(E).',
        amendmentStatus: 'Replaces Section 65B of the repealed Indian Evidence Act, 1872.',
        keywords: ['electronic evidence', 'digital certificate', 'section 65b', 'bsa 63', 'admissibility', 'whatsapp evidence'],
        relatedCyberCrimes: ['upi-payment-fraud', 'identity-theft', 'sextortion'],
        relatedCaseStudies: ['classified-marketplace-qr-fraud', 'digital-arrest-impersonation'],
        relatedModules: ['digital-forensics'],
        officialSourceId: sourceBSA._id
      },
      {
        sectionNumber: 'BNS Section 78',
        actName: 'Bharatiya Nyaya Sanhita, 2023',
        officialTitle: 'Stalking (including cyberstalking and electronic surveillance of women)',
        role: 'Related Criminal Law',
        plainLanguageExplanation: 'Explicitly criminalizes cyberstalking: monitoring the use by a woman of the internet, email, or other form of electronic communication, or attempting contact repeatedly despite clear disinterest. Replaces IPC Section 354D.',
        officialText: 'Whoever follows a woman and contacts, or attempts to contact such woman to foster personal interaction repeatedly despite a clear indication of disinterest... or monitors the use by a woman of the internet, email or any other form of electronic communication, commits the offence of stalking.',
        whyItMatters: 'Primary criminal section against persistent online stalkers, spyware monitoring, unauthorized location tracking, and unwanted messaging.',
        exampleScenario: 'An individual creates multiple burner profiles to monitor a woman\'s posts, comment on every photo after being blocked, and sends tracking links.',
        penaltyOrLegalEffect: 'First conviction: Imprisonment of up to 3 years and fine. Second/subsequent conviction: Imprisonment of up to 5 years and fine.',
        legalStatus: 'CURRENT',
        commencementStatus: 'In force. Notified effective from 1st July 2024 via S.O. 850(E).',
        amendmentStatus: 'Replaces Section 354D of the repealed Indian Penal Code (IPC).',
        keywords: ['cyberstalking', 'stalking', 'bns 78', 'ipc 354d', 'harassment', 'electronic tracking'],
        relatedCyberCrimes: ['cyber-stalking', 'online-harassment'],
        relatedCaseStudies: [],
        relatedModules: ['privacy-governance'],
        officialSourceId: sourceBNS._id
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
        shortDescription: 'Extortion using recorded private video calls, compromised photos, or synthetic deepfakes.',
        whatIsIt: 'Sextortion is a form of cyber blackmail where perpetrators obtain or synthetically manufacture compromising private imagery or video recordings and threaten to broadcast them to the victim\'s family, colleagues, or social followers unless money is paid.',
        howItWorks: 'Attackers initiate contact on dating or social platforms, quickly shift to video calls, induce the victim into compromising situations while recording the screen, and immediately send extortion demands with screenshots of the victim\'s contact list.',
        attackerObjective: ['Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['Social Media', 'Video Call', 'Messaging'],
        legalContext: ['Section 66E', 'Section 66D', 'Section 67', 'Section 67A'],
        difficulty: 'Intermediate',
        warningSigns: [
          'Stranger on social media immediately suggesting video calls on third-party messaging apps',
          'Call screen displays pre-recorded looping video while demanding you turn on your camera',
          'Immediate threats to send recorded clips to your workplace or family within 15 minutes',
          'Sharing screenshots of your Facebook friends or Instagram follower list as leverage'
        ],
        attackerTactics: [
          { tactic: 'Panic & Humiliation', example: 'Threatens to upload recorded video to YouTube and send links to parents.', whyItWorks: 'Leverages acute social shame to force compliance before rational thinking.' }
        ],
        actionSteps: [
          'Do NOT pay any ransom. Paying never stops extortion; it signals that blackmail works and demands will escalate.',
          'Deactivate social media accounts temporarily and preserve unedited chat screenshots and payment links.',
          'Report immediately to 1930 and file a complaint on cybercrime.gov.in under "Women & Child Related Crime".'
        ],
        avoidSteps: [
          'Never agree to nude or compromising video calls with online strangers.',
          'Do not negotiate or agree to installment payments with extortionists.'
        ],
        ifTargetedSteps: [
          'Submit the original image hashes to StopNCII.org to prevent automatic platform resharing.',
          'Block the attacker across all numbers and report the extortion to police Cyber Cell.'
        ],
        mythFacts: [
          { myth: 'Paying the attacker once will make them delete the recorded video.', fact: 'Extortionists never delete compromising media upon payment; paying guarantees repeated demands for larger amounts.' }
        ],
        spotTheFlags: {
          messageType: 'Chat Message',
          messageText: 'I recorded your private video call. Here is your father\'s phone number and your company LinkedIn. Pay ₹45,000 to this UPI ID within 20 minutes or I send the full video to your entire office and post it on Facebook.',
          clickableFlags: [
            { textSegment: 'Here is your father\'s phone number', flagName: 'Public Contact Scraping', explanation: 'Scammers scrape public friend lists or truecaller records to intimidate victims.' },
            { textSegment: 'within 20 minutes', flagName: 'Extortion Pressure', explanation: 'Short deadlines are engineered to induce panic before the victim can seek legal or parental help.' },
            { textSegment: 'Pay ₹45,000 to this UPI ID', flagName: 'Financial Blackmail', explanation: 'Never pay extortion demands. Paying confirms you can be squeezed for further funds.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'An extortionist sends a clip of a private video call and demands ₹25,000 to delete it, threatening to message your relatives. What is your best response?',
          options: [
            { optionText: 'Pay the ₹25,000 immediately and ask for written confirmation that the video was deleted.', isCorrect: false, explanation: 'Incorrect! Paying will immediately trigger a higher second demand.' },
            { optionText: 'Do not pay, preserve screenshots with phone numbers/UPI IDs, block the sender, and report to 1930 / cybercrime.gov.in.', isCorrect: true, explanation: 'Correct! Never pay blackmailers. Rapid reporting and evidence preservation are the legally recommended steps.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'What is the primary danger of paying a sextortion demand?',
            options: [
              'The bank might block your UPI ID.',
              'The extortionist will inevitably demand more money because paying proves the blackmail is effective.',
              'The money is converted to foreign currency.',
              'The police cannot register a case if money was sent voluntarily.'
            ],
            correctOptionIndex: 1,
            explanation: 'Paying confirms you have financial resources and fear exposure, which causes perpetrators to continuously increase their demands.'
          }
        ]
      },
      {
        title: 'SIM Swapping Fraud',
        slug: 'sim-swapping',
        category: 'Account Takeover',
        shortDescription: 'Social engineering telecom operators to issue a duplicate SIM card, intercepting SMS OTPs and phone calls.',
        whatIsIt: 'SIM swapping is an account takeover technique where criminals convince your mobile carrier that your SIM card has been lost or damaged, obtaining an authorized duplicate SIM that diverts your phone calls, SMS OTPs, and authentication signals to the attacker\'s device.',
        howItWorks: 'Attackers harvest your identity documents (Aadhaar, PAN) via phishing or leaked databases. They submit a fraudulent replacement request at a telecom outlet using forged IDs. Once the new SIM activates, your original SIM loses signal, and the attacker resets your bank passwords and UPI accounts using intercepted SMS codes.',
        attackerObjective: ['Credentials', 'Account Access', 'Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['Phone', 'Identity Documents'],
        legalContext: ['Section 66C', 'Section 66D', 'Section 66B', 'BNS Section 319'],
        difficulty: 'Advanced',
        warningSigns: [
          'Sudden complete loss of mobile network signal with "No Service" or "Emergency Calls Only" in an area with good coverage',
          'Receiving an unexpected SMS from your telecom provider stating: "SIM replacement request received"',
          'Inability to make calls or receive texts despite restarting the device',
          'Notification emails stating account passwords or netbanking access details have been changed'
        ],
        attackerTactics: [
          { tactic: 'Credential Gathering & Impersonation', example: 'Scammer presents a forged Aadhaar photocopy at a telecom store.', whyItWorks: 'Exploits weak physical verification checks at third-party retail outlets.' }
        ],
        actionSteps: [
          'If your phone unexpectedly loses cellular connectivity for more than 15-30 minutes, immediately contact your mobile carrier from another phone.',
          'Check with your bank to freeze internet banking and UPI access immediately.',
          'Migrate sensitive two-factor authentication from SMS OTP to app-based authenticators or passkeys.'
        ],
        avoidSteps: [
          'Never ignore unexpected SMS alerts regarding SIM swap or duplicate SIM requests.',
          'Do not share identity document photocopies without watermarking the purpose (e.g. "For Broadband verification only").'
        ],
        ifTargetedSteps: [
          'Visit your telecom service center in person with original ID to reclaim your mobile number.',
          'Dial 1930 immediately to freeze financial transactions executed during the window of disconnection.'
        ],
        mythFacts: [
          { myth: 'SIM swapping can be done by someone simply knowing your phone number.', fact: 'Attackers require your personal identity documents (Aadhaar/PAN) or insider collusion at telecom retail outlets to authorize a duplicate SIM.' }
        ],
        spotTheFlags: {
          messageType: 'Telecom SMS Alert',
          messageText: 'ALERT: We have received your request for duplicate SIM activation on mobile ending in 4921. If you did not request this, please SMS NO to 121 within 2 hours or your current SIM will be deactivated.',
          clickableFlags: [
            { textSegment: 'request for duplicate SIM activation', flagName: 'Carrier Alert', explanation: 'Telecom providers send explicit warnings when a duplicate SIM has been requested.' },
            { textSegment: 'SMS NO to 121 within 2 hours', flagName: 'Action Window', explanation: 'Immediate response is required before the original SIM loses signal and cellular control transfers to the attacker.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'Your phone suddenly shows "No Service" in your home. Shortly before, you received an SMS about a SIM upgrade you never requested. What should you do first?',
          options: [
            { optionText: 'Wait 24 hours to see if carrier network maintenance resolves the issue.', isCorrect: false, explanation: 'Incorrect! Waiting gives attackers hours to drain your bank accounts using intercepted OTPs.' },
            { optionText: 'Immediately call your telecom operator from another phone to block the unauthorized SIM and inform your bank.', isCorrect: true, explanation: 'Correct! Rapid response within minutes prevents attackers from exploiting intercepted two-factor SMS codes.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'What is the most effective defense against SMS-based SIM swapping attacks for critical financial accounts?',
            options: [
              'Using longer passwords.',
              'Switching authentication from SMS OTP to hardware security keys, passkeys, or app-based authenticators.',
              'Turning off mobile data.',
              'Changing your phone number every six months.'
            ],
            correctOptionIndex: 1,
            explanation: 'App-based authenticators (like TOTP) and passkeys are bound to your physical device and are completely unaffected when an attacker swaps your cellular SIM card.'
          }
        ]
      },
      {
        title: 'Digital Arrest & Agency Impersonation',
        slug: 'digital-arrest-scam',
        category: 'Scams & Impersonation',
        shortDescription: 'Fraudsters impersonating CBI, Police, or ED officials on Skype/WhatsApp video calls demanding money under threat of fake digital arrest.',
        whatIsIt: 'Digital arrest fraud is a psychological extortion scam where syndicates impersonate law enforcement, customs, or judicial officers on video calls, falsely claiming your Aadhaar or mobile is linked to money laundering, drugs, or illegal couriers, and keeping you on camera under "digital confinement" while demanding fund transfers for "verification".',
        howItWorks: 'Victims receive an automated IVR call claiming an illegal parcel in their name was intercepted at an airport. The call transfers to an "investigator" on Skype wearing a police uniform with a staged police station backdrop. The attacker displays forged Supreme Court arrest warrants, orders the victim not to leave the camera under "digital arrest", and demands transferring all savings to a "government clearing account" which is promised to be returned.',
        attackerObjective: ['Money', 'Personal Information', 'Identity'],
        redFlagLevel: 'Critical',
        attackVectors: ['Phone', 'Video Call', 'Messaging'],
        legalContext: ['Section 66D', 'BNS Section 318', 'BNS Section 319'],
        difficulty: 'Medium',
        warningSigns: [
          'Law enforcement claiming to conduct investigations, trials, or "digital arrest" via Skype, WhatsApp, or video calls',
          'Commands to remain isolated in a closed room and stay in front of the camera continuously',
          'Demands to transfer your bank savings to a "verification account" or "RBI audit account"',
          'Forged official letters featuring multiple mismatched logos (CBI, ED, RBI, Supreme Court)'
        ],
        attackerTactics: [
          { tactic: 'Authority & Uniform Exploitation', example: 'Displays forged arrest warrant with Supreme Court seal on camera.', whyItWorks: 'Exploits natural respect and fear of law enforcement.' },
          { tactic: 'Isolation & Continuous Surveillance', example: 'Forbids telling family members or hanging up under threat of immediate physical arrest.', whyItWorks: 'Prevents victims from obtaining external counsel or sanity checks.' }
        ],
        actionSteps: [
          'Disconnect the video call immediately. Real Indian police and agencies never conduct arrests or interrogations via video calls.',
          'Dial 1930 and report the incident on cybercrime.gov.in immediately.'
        ],
        avoidSteps: [
          'Never transfer money to any account for "clearance", "verification", or "temporary holding".',
          'Never accept legal documents sent via WhatsApp or email as authentic court summons.'
        ],
        ifTargetedSteps: [
          'Note the phone numbers, Skype usernames, and bank account numbers provided by scammers.',
          'Dial 1930 within the Golden Hour to initiate bank freeze alerts through CFCFRMS.'
        ],
        mythFacts: [
          { myth: 'Police can place you under "digital arrest" and try your case over video call.', fact: 'There is no concept of "digital arrest" under Indian law (CrPC or BNSS). Police procedures strictly mandate written summons and physical presence.' }
        ],
        spotTheFlags: {
          messageType: 'Video Call / Document',
          messageText: 'CENTRAL BUREAU OF INVESTIGATION - ARREST NOTICE\nCase Ref: Contraband Parcel Mumbai Airport #4492\nYou are placed under DIGITAL ARREST under PMLA Section 19. You must remain on Skype video continuously and transfer ₹3,50,000 to RBI Audit Account #98721092839 to avoid non-bailable physical detention.',
          clickableFlags: [
            { textSegment: 'DIGITAL ARREST', flagName: 'Fabricated Legal Term', explanation: 'No Indian law provides for "digital arrest". It is an entirely manufactured phrase used by extortionists.' },
            { textSegment: 'Skype video continuously', flagName: 'Psychological Isolation', explanation: 'Scammers keep victims on camera to prevent them from contacting family, lawyers, or local police.' },
            { textSegment: 'transfer ₹3,50,000 to RBI Audit Account', flagName: 'Extortion Demand', explanation: 'Government agencies never ask citizens to transfer money to private accounts to "verify funds".' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'An individual in a police uniform calls you on Skype, claiming an illegal parcel was found with your Aadhaar, and commands you not to hang up. What do you do?',
          options: [
            { optionText: 'Transfer a small amount to prove cooperation while calling your lawyer.', isCorrect: false, explanation: 'Incorrect! Any transfer is lost permanently.' },
            { optionText: 'Disconnect immediately, block the caller, and file a complaint on cybercrime.gov.in or dial 1930.', isCorrect: true, explanation: 'Correct! Official law enforcement does not conduct online arrests or demand fund transfers.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'Does Indian criminal law authorize police or CBI officers to place citizens under "digital arrest" over video calls?',
            options: [
              'Yes, under IT Act emergency powers.',
              'Yes, but only for financial crimes above ₹1 crore.',
              'No. There is no concept of digital arrest in Indian law; all arrests require physical statutory procedures.',
              'Yes, if approved by a magistrate over email.'
            ],
            correctOptionIndex: 2,
            explanation: 'Indian law has no provision for "digital arrest". The phrase is an extortion technique used by criminal impersonation syndicates.'
          }
        ]
      },
      {
        title: 'AI Voice Cloning & Deepfake Impersonation',
        slug: 'deepfake-ai-impersonation',
        category: 'Online Deception',
        shortDescription: 'Using generative AI to synthesize voices or faces of family members and executives to conduct emergency extortion or financial fraud.',
        whatIsIt: 'AI voice cloning and deepfake fraud uses generative neural networks trained on brief audio or video snippets (from Instagram, YouTube, or voicemail) to produce real-time synthetic voice and video that convincing mimics a specific individual.',
        howItWorks: 'Attackers scrape a 3-second audio clip of your family member from social media. They call you using an AI voice model crying that they have been arrested or met with an accident in another city, demanding an immediate ₹50,000 transfer for hospital admission or police bail before you can verify.',
        attackerObjective: ['Money', 'Credentials'],
        redFlagLevel: 'Very High',
        attackVectors: ['Phone', 'Social Media', 'Video Call'],
        legalContext: ['Section 66D', 'BNS Section 318', 'BNS Section 319', 'IT Intermediary Rules'],
        difficulty: 'Intermediate',
        warningSigns: [
          'Caller sounds like a family member or friend but calls from an unknown number with extreme emotional urgency',
          'Insistence on immediate UPI transfer without allowing you to hang up and call back',
          'Robotic micro-artifacts, unnatural breathing rhythms, or background audio looping during the call',
          'Refusal to answer specific personal questions only the real family member would know'
        ],
        attackerTactics: [
          { tactic: 'Synthesized Panic', example: 'AI clone of a son weeping: "Papa, please transfer money to this hospital QR code now, my phone broke."', whyItWorks: 'Parents naturally react to a child\'s voice in distress, bypassing verification logic.' }
        ],
        actionSteps: [
          'Establish a secret family "safe word" or passphrase known only to your immediate household for emergency verification.',
          'Always hang up and call the family member back on their known regular phone number or through a secondary contact (roommate, hostel warden, spouse).'
        ],
        avoidSteps: [
          'Never transfer emergency funds based solely on voice recognition over an incoming call from an unknown number.',
          'Do not share high-quality uncurated voice recordings or public video clips with sensitive location tags.'
        ],
        ifTargetedSteps: [
          'Report the caller phone number on the Department of Telecommunications Chakshu portal (sancharsaathi.gov.in).',
          'File an impersonation report on cybercrime.gov.in citing IT Act Section 66D.'
        ],
        mythFacts: [
          { myth: 'Creating a voice clone requires hours of studio recordings.', fact: 'Modern diffusion-based voice synthesis models require as little as 3 seconds of clean audio from a public social media video to clone pitch and cadence.' }
        ],
        spotTheFlags: {
          messageType: 'Phone Call Alert',
          messageText: 'INCOMING CALL: Unknown Number (+91 98210-XXXXX)\nVOICE (sounds exactly like your daughter): "Papa! I had a car accident near college! A man is demanding ₹40,000 for damages right now or he will call the police. Please send it to this Google Pay number right now!"',
          clickableFlags: [
            { textSegment: 'Unknown Number (+91 98210-XXXXX)', flagName: 'Unverified Channel', explanation: 'Attackers spoof caller context by claiming the original phone is lost or broken.' },
            { textSegment: 'send it to this Google Pay number right now', flagName: 'Urgent Payment Demand', explanation: 'Urgency prevents you from cross-checking with college authorities.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'You receive an urgent call sounding like your brother asking for an emergency UPI transfer for hospital admission. What is the safest next action?',
          options: [
            { optionText: 'Send the money immediately to avoid medical delays, then call him later.', isCorrect: false, explanation: 'Incorrect! If it is a voice clone, your money is gone.' },
            { optionText: 'Ask a personal verification question that only your brother would know, or hang up and call his known phone number directly.', isCorrect: true, explanation: 'Correct! Secondary verification through a trusted channel defeats AI voice cloning instantly.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'What is the most effective operational defense against an AI voice cloning emergency scam?',
            options: [
              'Demanding to speak to a police officer.',
              'Hanging up and independently contacting the family member on their known primary number or verifying with a pre-arranged family passphrase.',
              'Recording the phone call for legal records.',
              'Paying through credit card instead of UPI.'
            ],
            correctOptionIndex: 1,
            explanation: 'Secondary channel verification breaks the scammer\'s control and immediately exposes whether the emergency is authentic.'
          }
        ]
      },
      {
        title: 'Predatory Loan App & Contact Extortion',
        slug: 'loan-app-extortion',
        category: 'Financial Fraud',
        shortDescription: 'Unregulated instant loan apps demanding access to your contacts and photos, followed by usurious rates and morphed photo blackmail.',
        whatIsIt: 'Predatory loan app fraud involves rogue, unapproved digital lending applications that lure borrowers with "instant no-documentation loans" of ₹2,000–₹10,000. Upon installation, the app harvests the user\'s entire contact list, photo gallery, and location data to weaponize against them.',
        howItWorks: 'The victim receives only a fraction of the loan (e.g. ₹3,000 for a ₹5,000 loan) with a repayment period of just 7 days at 300-500% interest. Within days, recovery agents message the borrower, morphing their photos onto obscene imagery and sending them to the victim\'s family, employers, and friends via WhatsApp.',
        attackerObjective: ['Money', 'Personal Information'],
        redFlagLevel: 'Critical',
        attackVectors: ['Mobile App', 'Messaging', 'Phone'],
        legalContext: ['Section 66E', 'BNS Section 351', 'BNS Section 78', 'Section 43'],
        difficulty: 'Intermediate',
        warningSigns: [
          'Loan app installed from APK download links outside the Google Play Store or App Store',
          'App demands unnecessary permissions during installation: Full Contact List, Photo Gallery, Storage, and Camera',
          'Absence of a verified Non-Banking Financial Company (NBFC) or registered bank partner on the RBI website',
          'Repayment period of under 30 days (RBI mandates minimum 90-day tenures for small personal loans)'
        ],
        attackerTactics: [
          { tactic: 'Social Shaming & Extortion', example: 'Sends morphed vulgar pictures of the victim to their parents and colleagues.', whyItWorks: 'Exploits fear of social ostracization to force immediate repayment of exorbitant interest.' }
        ],
        actionSteps: [
          'Verify that any digital lending platform is partnered with a legitimately registered NBFC or bank on the official RBI website (rbi.org.in), and check regulator warnings or report illegal apps on the RBI Sachet portal (sachet.rbi.org.in).',
          'Revoke contact and photo permissions immediately and uninstall rogue APK applications.',
          'File an emergency cybercrime report on cybercrime.gov.in under financial fraud and cyber harassment.'
        ],
        avoidSteps: [
          'Never install lending apps from third-party APK links sent on WhatsApp or SMS.',
          'Never grant contact book or photo gallery access to a financial lending application.'
        ],
        ifTargetedSteps: [
          'Do not pay continuous extortion demands. Inform close family contacts that an app has scraped your contacts and is sending fraudulent spam.',
          'File a complaint with police and the RBI Sachet portal, citing criminal intimidation under BNS Section 351.'
        ],
        mythFacts: [
          { myth: 'Digital loan apps are legally permitted to contact your relatives to collect repayments.', fact: 'RBI Digital Lending Guidelines strictly prohibit lenders from accessing mobile contacts or contacting any third party other than the borrower.' }
        ],
        spotTheFlags: {
          messageType: 'WhatsApp Extortion Notice',
          messageText: 'RECOVERY DESK: You failed to repay ₹6,500 due today. We have downloaded your 480 contacts and family photos. If payment is not sent to this UPI in 1 hour, your morphed nude photos will be broadcast to all contacts on your phone.',
          clickableFlags: [
            { textSegment: 'downloaded your 480 contacts', flagName: 'Permission Abuse', explanation: 'Legitimate RBI-regulated lenders never scrape contact books or threaten third parties.' },
            { textSegment: 'morphed nude photos will be broadcast', flagName: 'Criminal Intimidation', explanation: 'Extortion and photo morphing are serious criminal offenses under IT Act Section 66E and BNS Section 351.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'An unauthorized loan app recovery agent threatens to send your morphed photos to your WhatsApp contacts unless you pay triple the loan amount. What is your response?',
          options: [
            { optionText: 'Borrow from friends to pay the agent hoping they delete your photos.', isCorrect: false, explanation: 'Incorrect! Blackmailers never delete scraped data; they continue extortion cycles.' },
            { optionText: 'Do not pay, alert key contacts about the fraudulent blackmail, preserve chat evidence, and lodge an immediate complaint on cybercrime.gov.in.', isCorrect: true, explanation: 'Correct! Alerting contacts neutralizes the blackmailer\'s leverage, and filing an official police report initiates legal protection.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'Under Reserve Bank of India (RBI) digital lending guidelines, are lending apps permitted to access your mobile contact list or photo storage?',
            options: [
              'Yes, for credit risk evaluation.',
              'Yes, but only with user permission.',
              'No. RBI strictly prohibits accessing contact lists, photo galleries, or biometric data for digital lending.',
              'Yes, if the loan amount is under ₹10,000.'
            ],
            correctOptionIndex: 2,
            explanation: 'RBI rules strictly bar digital lending apps from accessing mobile contacts, media galleries, or phone call logs.'
          }
        ]
      },
      {
        title: 'Cyberstalking, Doxxing & Persistent Surveillance',
        slug: 'cyberstalking-doxxing',
        category: 'Online Harassment & Abuse',
        shortDescription: 'Persistent unwanted online tracking, electronic surveillance, and malicious public dissemination of private information.',
        whatIsIt: 'Cyberstalking and doxxing involve monitoring a person\'s digital activities, repeatedly sending unsolicited communications despite clear disinterest, and malicious "doxxing" (broadcasting personal phone numbers, home addresses, or private credentials) to incite collective harassment.',
        howItWorks: 'A stalker creates multiple fake profiles across Instagram, LinkedIn, and messaging apps to monitor a victim\'s whereabouts, comments on their posts, installs background tracker apps or stalkerware on their device, and posts their private contact details on public forums.',
        attackerObjective: ['Personal Information', 'Device Access'],
        redFlagLevel: 'High',
        attackVectors: ['Social Media', 'Messaging', 'Device'],
        legalContext: ['BNS Section 78', 'Section 66E', 'Section 67'],
        difficulty: 'Intermediate',
        warningSigns: [
          'Receiving messages from newly created burner accounts referencing your real-time physical location',
          'Phone battery draining rapidly or showing unexpected background location/microphone access icons',
          'Unsolicited calls or delivery requests ordered to your home address by unknown third parties',
          'Personal photographs or private conversations posted on public forums without your consent'
        ],
        attackerTactics: [
          { tactic: 'Relentless Persistence & Identity Rotation', example: 'Creates account_01, account_02, account_03 immediately after each block.', whyItWorks: 'Attempts to wear down the victim emotionally and force personal engagement.' }
        ],
        actionSteps: [
          'Document every occurrence: take uncropped screenshots showing date, time, handles, and URLs before blocking.',
          'Review device security: audit installed apps, revoke unknown device administrator permissions, and change master passwords.'
        ],
        avoidSteps: [
          'Do not engage in emotional arguments or retaliatory debates with a stalker online.',
          'Never delete threatening messages before capturing timestamped digital evidence.'
        ],
        ifTargetedSteps: [
          'File an online complaint on cybercrime.gov.in under the specialized "Report Women / Child Related Crime" section.',
          'Cite Section 78 of the Bharatiya Nyaya Sanhita, 2023 (electronic stalking) and Section 66E of the IT Act.'
        ],
        mythFacts: [
          { myth: 'Stalking laws only apply if a person follows you physically in the real world.', fact: 'Section 78 of the Bharatiya Nyaya Sanhita (replacing IPC 354D) explicitly criminalizes monitoring a woman\'s internet, email, or electronic communication.' }
        ],
        spotTheFlags: {
          messageType: 'Social Media Direct Message',
          messageText: 'I know you blocked my last 3 accounts. I saw you at the coffee shop in Indiranagar at 4 PM today wearing your blue jacket. You cannot hide from me. If you do not unblock me, I will post your home address on Reddit.',
          clickableFlags: [
            { textSegment: 'saw you at the coffee shop in Indiranagar at 4 PM', flagName: 'Physical Surveillance', explanation: 'Stalkers correlate social check-ins or device locations to demonstrate physical monitoring.' },
            { textSegment: 'post your home address on Reddit', flagName: 'Doxxing Threat', explanation: 'Threatening to publish private residential details is a criminal intimidation tactic.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'Someone creates continuous burner accounts to harass you online and threatens to publish your phone number. What is the most critical first step?',
          options: [
            { optionText: 'Reply angrily threatening to find their IP address.', isCorrect: false, explanation: 'Incorrect! Engaging rewards the stalker\'s attention-seeking behavior.' },
            { optionText: 'Take complete timestamped screenshots showing handles and URLs, adjust account privacy to private, and file a police cyber cell report.', isCorrect: true, explanation: 'Correct! Systematic evidence documentation without engagement is the legally established response.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'Under Section 78 of the Bharatiya Nyaya Sanhita, 2023 (BNS), does monitoring a woman\'s online browsing, email, or social media activity constitute the criminal offence of stalking?',
            options: [
              'No, stalking only applies to physical following on streets.',
              'Yes. Monitoring electronic communications, internet use, or email of a woman is explicitly defined as criminal stalking.',
              'Only if physical harm was threatened in writing.',
              'Only if committed by an employer.'
            ],
            correctOptionIndex: 1,
            explanation: 'BNS Section 78 (replacing IPC 354D) explicitly recognizes digital surveillance and monitoring of electronic communications as criminal stalking.'
          }
        ]
      },
      {
        title: 'Non-Consensual Intimate Imagery (NCII) & Image Abuse',
        slug: 'ncii-image-abuse',
        category: 'Online Harassment & Abuse',
        shortDescription: 'Capturing, publishing, or generating non-consensual private imagery or deepfakes to harass, humiliate, or extort individuals.',
        whatIsIt: 'Non-Consensual Intimate Imagery (NCII) encompasses capturing, sharing, or publishing intimate photographs or videos of a person without their consent. It includes synthetic image abuse, where regular photos are digitally altered or deepfaked using AI nude-generators.',
        howItWorks: 'Perpetrators acquire private photographs via relationship betrayal, device hacking, or social media scraping. They threaten to publish the material on adult forums or send it to family members, or deploy automated AI morphing tools to generate fabricated explicit imagery.',
        attackerObjective: ['Personal Information', 'Money'],
        redFlagLevel: 'Critical',
        attackVectors: ['Social Media', 'Messaging', 'Website'],
        legalContext: ['Section 66E', 'Section 67', 'Section 67A', 'IT Intermediary Rules'],
        difficulty: 'Intermediate',
        warningSigns: [
          'Threats from an ex-partner or acquaintance to release private photos if relationship demands are not met',
          'Discovery of altered or morphed pictures of yourself appearing on messaging groups or forum boards',
          'Requests from unfamiliar profiles offering to "remove" your private pictures in exchange for money'
        ],
        attackerTactics: [
          { tactic: 'Reputational Destruction Threat', example: 'Threatens to upload morphed photos to college group chat.', whyItWorks: 'Exploits high social vulnerability and fear of irreversible public damage.' }
        ],
        actionSteps: [
          'Create digital hashes of the imagery using StopNCII.org to prevent distribution across major participating platforms (Meta, Instagram, TikTok, Reddit).',
          'Under Rule 3(2)(b) of the IT Intermediary Rules, intermediaries are legally mandated to remove non-consensual intimate imagery within 24 hours of receiving a report.'
        ],
        avoidSteps: [
          'Never pay money to extortionists or online intermediaries promising removal.',
          'Do not delete original message links or threatening chats before capturing forensic evidence.'
        ],
        ifTargetedSteps: [
          'File a complaint on cybercrime.gov.in under the anonymous reporting category for women and children.',
          'Invoke IT Act Section 66E (privacy violation) and Section 67A (sexually explicit content).'
        ],
        mythFacts: [
          { myth: 'Social media platforms have 30 days to review intimate image removal complaints.', fact: 'Under Rule 3(2)(b) of the IT Intermediary Rules, platforms MUST remove or disable access to non-consensual intimate or morphed imagery within 24 hours.' }
        ],
        spotTheFlags: {
          messageType: 'Extortion Email / DM',
          messageText: 'I have created morphed explicit photos of you using your Instagram pictures. Pay ₹30,000 to this Bitcoin wallet by tonight or I will upload them to public adult portals and tag your workplace.',
          clickableFlags: [
            { textSegment: 'created morphed explicit photos of you', flagName: 'Synthetic Image Abuse', explanation: 'Generating and distributing deepfake intimate imagery is criminalized under IT Act Section 66E, 67A, and BNS provisions.' },
            { textSegment: 'Pay ₹30,000 to this Bitcoin wallet', flagName: 'Extortion Demand', explanation: 'Never send cryptocurrency or cash to image extortionists.' }
          ]
        },
        whatWouldYouDo: {
          questionText: 'You discover that an acquaintance has created a morphed intimate picture of you and posted it online. Under Indian law, what is the platform\'s legal obligation?',
          options: [
            { optionText: 'The platform can take up to 30 days to decide whether to remove it.', isCorrect: false, explanation: 'Incorrect! 30 days applies to general grievances, not intimate imagery.' },
            { optionText: 'Under Rule 3(2)(b) of the IT Intermediary Rules, the platform is legally obligated to take down the intimate content within 24 hours of notification.', isCorrect: true, explanation: 'Correct! Indian rules mandate emergency 24-hour takedown for non-consensual intimate imagery.' }
          ]
        },
        quickCheckQuestions: [
          {
            questionText: 'Under the Information Technology (Intermediary Guidelines) Rules, 2021, within what timeframe must a social media platform remove non-consensual intimate or morphed imagery once reported?',
            options: [
              '7 days',
              '72 hours',
              '24 hours',
              '15 days'
            ],
            correctOptionIndex: 2,
            explanation: 'Rule 3(2)(b) strictly requires intermediaries to remove or disable access to non-consensual intimate imagery within 24 hours of receipt of complaint.'
          }
        ]
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
        caseType: 'educational-reconstruction',
        incidentType: 'Social Engineering',
        attackVector: 'Phone / Video Call',
        shortDescription: 'Attackers impersonating police officers subjected the victim to a multi-hour "digital arrest" via video call, forcing them to transfer funds under threat of prosecution.',
        incidentDate: 'July 2025',
        publishedDate: 'August 2025',
        difficulty: 'Advanced',
        featured: false,
        sourceSummary: 'Synthesized educational reconstruction based on national advisories issued by the Indian Cyber Crime Coordination Centre (I4C) and state police cyber cells regarding digital arrest intimidation schemes.',
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
        caseType: 'educational-reconstruction',
        incidentType: 'Identity Theft',
        attackVector: 'Biometric Cloning',
        shortDescription: 'A property transaction at a local registry office resulted in leaked fingerprint data, which was cloned to drain bank accounts through the Aadhaar Enabled Payment System.',
        incidentDate: 'May 2025',
        publishedDate: 'June 2025',
        difficulty: 'Advanced',
        featured: false,
        sourceSummary: 'Synthesized educational reconstruction based on police advisories and UIDAI consumer guidance regarding silicone-based thumbprint duplication and AePS system exploits.',
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
      },
      {
        title: 'The Voice Clone Kidnapping Scam',
        slug: 'ai-voice-cloning-family-emergency',
        caseNumber: 'CASE FILE 009',
        caseType: 'educational-reconstruction',
        incidentType: 'AI Voice Cloning',
        attackVector: 'Phone',
        shortDescription: 'A retired father received a panicked phone call featuring his son\'s exact synthesized voice weeping and claiming to be in police custody following a hit-and-run, demanding an immediate ₹2,00,000 transfer.',
        incidentDate: 'January 2026',
        publishedDate: 'February 2026',
        difficulty: 'Intermediate',
        featured: true,
        sourceSummary: 'Reconstruction based on advisories issued by the Indian Cyber Crime Coordination Centre (I4C) regarding AI-enabled voice impersonation scams targeting families of students.',
        narrativeSections: [
          {
            heading: 'The Panicked Distress Call',
            body: 'Mr. Sharma, a retired bank employee in Lucknow, received an incoming call from an unfamiliar mobile number. Upon answering, he heard his 21-year-old son, who was pursuing an engineering degree in Bengaluru. The voice was crying hysterically: "Papa! Please help me! My friend\'s car hit someone near Whitefield! The police are locking us up unless we pay the injured person\'s hospital admission fee of ₹2,00,000 right now!"'
          },
          {
            heading: 'The Handover to the "Officer"',
            body: 'Before Mr. Sharma could ask detailed questions, a harsh voice took over the phone claiming to be Sub-Inspector Patil. The officer warned: "We have kept your son in the station van. If the compensation is not sent to this hospital UPI account within 15 minutes, we will file a non-bailable FIR and produce him in court tomorrow morning. Do not cut the call or he goes straight to jail."'
          },
          {
            heading: 'The Secondary Verification Pause',
            body: 'Mr. Sharma was on the verge of opening his netbanking app in sheer terror. However, he recalled a cybersecurity awareness talk stressing secondary channel verification. Keeping the extortionist on the line on his home landline, he picked up his mobile phone and dialed his son\'s campus hostel warden. The warden immediately checked the student\'s room and confirmed his son was sitting at his study desk soundly preparing for semester exams.'
          },
          {
            heading: 'The Exposure & Disconnection',
            body: 'When Mr. Sharma demanded the caller provide his son\'s middle name or childhood pet name, the scammer cursed aggressively and hung up. Subsequent forensic analysis showed the attackers had harvested a 10-second reel video from his son\'s public Instagram profile, training a voice synthesis model to clone his vocal timbre, accent, and weeping tone.'
          }
        ],
        timeline: [
          {
            time: '04:15 PM',
            label: 'Emergency Call Received',
            description: 'Unknown number calls victim with cloned son voice weeping in distress.',
            type: 'contact'
          },
          {
            time: '04:18 PM',
            label: 'Police Impersonation & Ultimatum',
            description: 'Fake police officer demands ₹2,00,000 within 15 minutes to prevent non-bailable FIR.',
            type: 'escalation'
          },
          {
            time: '04:22 PM',
            label: 'Secondary Verification Check',
            description: 'Father contacts hostel warden on separate phone; discovers son is safe in college.',
            type: 'decision'
          },
          {
            time: '04:25 PM',
            label: 'Scam Terminated',
            description: 'Attacker confronted with identity verification challenge and abruptly hangs up.',
            type: 'response'
          }
        ],
        decisionPoints: [
          {
            questionText: 'You receive an urgent call from an unknown number with what sounds unmistakably like your family member crying for emergency bail money. What is the safest immediate action?',
            options: [
              {
                optionText: 'Transfer the requested money immediately because delaying could result in physical jail or medical harm.',
                isCorrect: false,
                explanation: 'Incorrect! Extortionists manufacture extreme urgency precisely to prevent verification. Once transferred, money is quickly liquidated.'
              },
              {
                optionText: 'Keep calm, refuse immediate payment, ask a personal question only the real person knows, or independently call them or their local contacts (roommates, warden) on a separate line.',
                isCorrect: true,
                explanation: 'Correct! Secondary channel verification breaks the psychological trap and instantly exposes synthetic voice cloning.'
              }
            ]
          }
        ],
        warningSigns: [
          {
            title: 'Extreme Emotional Urgency & Noise',
            explanation: 'Attackers introduce crying, static, or background sirens to mask minor vocal synthesis artifacts.'
          },
          {
            title: 'Call Originating from Unknown Number',
            explanation: 'Attackers claim the victim\'s primary phone was seized, broken, or lost in the alleged accident.'
          },
          {
            title: 'Demand for Instant Non-Reversible Payment',
            explanation: 'Demanding UPI transfers to individual VPAs rather than official police or municipal treasury accounts.'
          }
        ],
        attackerObjectives: ['Money', 'Psychological Exploitation'],
        impact: {
          financial: '₹2,00,000 extortion demand prevented through verification.',
          account: 'No account compromise.',
          privacy: 'Public social media video audio harvested for voice model training.',
          emotional: 'Severe acute anxiety experienced by family members before verification.'
        },
        response: [
          'Reported the extortion phone number on DoT Chakshu portal (sancharsaathi.gov.in).',
          'Filed a complaint on cybercrime.gov.in under Section 66D of the IT Act.',
          'Advised student to switch social media accounts from public to private.'
        ],
        preventionLessons: [
          'Establish a secret family "emergency safe word" known only to immediate family members.',
          'Never transfer funds based purely on voice recognition from an unverified incoming number.',
          'Audit and restrict public video and voice recordings on open social media profiles.'
        ],
        legalContext: ['Section 66D', 'BNS Section 318', 'BNS Section 319'],
        relatedCrimes: ['deepfake-ai-impersonation', 'vishing', 'online-impersonation'],
        sources: [
          {
            title: 'Advisory on Deepfake and AI-Enabled Audio Impersonation Scams',
            authority: 'Indian Cyber Crime Coordination Centre (I4C), MHA',
            url: 'https://cybercrime.gov.in',
            publicationDate: 'December 2025',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Instant Cash App Contact Blackmail',
        slug: 'instant-loan-app-harassment',
        caseNumber: 'CASE FILE 010',
        caseType: 'educational-reconstruction',
        incidentType: 'Predatory Loan Extortion',
        attackVector: 'Mobile App',
        shortDescription: 'A university graduate downloaded an unauthorized instant lending APK for ₹3,000. When delayed by 24 hours, recovery agents broadcast morphed obscene photographs to his WhatsApp contacts.',
        incidentDate: 'November 2025',
        publishedDate: 'December 2025',
        difficulty: 'Beginner',
        featured: true,
        sourceSummary: 'Reconstruction based on RBI consumer protection warnings and police advisories regarding unregulated loan apps and mobile contact scraping syndicates.',
        narrativeSections: [
          {
            heading: 'The Fast Cash Promise',
            body: 'Arun, a 22-year-old preparing for competitive exams in Jaipur, needed ₹3,000 for application fees. He clicked on a social media advertisement promoting "Instant Cash in 5 Minutes — No CIBIL score required". He downloaded an application called "QuickRupee" via an APK link outside the Google Play Store.'
          },
          {
            heading: 'Permission Harvesting',
            body: 'During installation, the app presented rapid permission requests: Contact List, Media & Photos, Location, and SMS Storage. Believing these were standard identity verification requirements, Arun accepted all permissions. The app deposited ₹2,100 into his account (deducting ₹900 as "processing fee") and notified him that ₹3,500 was due in just 7 days.'
          },
          {
            heading: 'The Harassment Spiral',
            body: 'On the 7th day, before Arun could arrange the funds, recovery agents began messaging him with aggressive profanities on WhatsApp. When payment was delayed by 18 hours, an agent sent Arun an obscene morphed image combining his Facebook profile picture with a pornographic template, warning: "Pay ₹7,000 now or this picture will be broadcast to all 340 contacts in your phone book."'
          },
          {
            heading: 'Legal Intervention & Recovery',
            body: 'Recognizing criminal extortion, Arun did not pay. He immediately took complete screenshots of the threats, WhatsApp numbers, and UPI handles. He alerted his family and posted a public status explaining that an unauthorized app had scraped his contacts and was circulating malicious spam. He dialed 1930 and filed a formal complaint citing BNS Section 351 (criminal intimidation) and IT Act Section 66E (privacy violation).'
          }
        ],
        timeline: [
          {
            time: 'Day 1',
            label: 'App Installation & Permission Grant',
            description: 'User installs unverified APK granting access to contacts and photo gallery.',
            type: 'contact'
          },
          {
            time: 'Day 7',
            label: 'Predatory Repayment Demand',
            description: 'Lender demands ₹3,500 for a ₹2,100 net disbursement with usurious interest.',
            type: 'escalation'
          },
          {
            time: 'Day 8',
            label: 'Extortion & Photo Morphing Threat',
            description: 'Recovery agent sends morphed explicit photo threatening family broadcast.',
            type: 'decision'
          },
          {
            time: 'Day 8 (Night)',
            label: 'Evidence Documented & 1930 Alerted',
            description: 'Victim warns family contacts, refuses extortion payment, and logs police report.',
            type: 'response'
          }
        ],
        decisionPoints: [
          {
            questionText: 'An unauthorized loan app recovery agent threatens to send your morphed photos to your WhatsApp contacts unless you pay triple the original loan amount. What should you do?',
            options: [
              {
                optionText: 'Borrow money from friends to pay the agent, hoping they delete your photos.',
                isCorrect: false,
                explanation: 'Incorrect! Paying blackmailers guarantees repeated extortion demands for even larger amounts.'
              },
              {
                optionText: 'Do not pay, alert your close contacts that your phone contacts were scraped by an extortion scam, capture uncropped chat evidence, and report to 1930 / cybercrime.gov.in.',
                isCorrect: true,
                explanation: 'Correct! Notifying your network destroys the blackmailer\'s leverage, and filing an official police report initiates law enforcement action.'
              }
            ]
          }
        ],
        warningSigns: [
          {
            title: 'Third-Party APK Download Link',
            explanation: 'Rogue lending apps avoid app stores to bypass security vetting and permission abuse checks.'
          },
          {
            title: 'Demanding Contact Book & Photo Gallery Access',
            explanation: 'Legitimate RBI-regulated digital lenders are strictly barred from accessing contact books or personal photo galleries.'
          },
          {
            title: 'Repayment Periods Under 30 Days',
            explanation: 'RBI regulations require clear, fair repayment periods (typically 90+ days for consumer personal loans).'
          }
        ],
        attackerObjectives: ['Money', 'Extortion Leverage', 'Personal Information'],
        impact: {
          financial: '₹3,000 initial loan; extortion avoided through non-payment.',
          account: 'Contact list and device permissions compromised.',
          privacy: 'Personal photographs accessed and weaponized for blackmail.',
          emotional: 'Severe psychological distress and social anxiety.'
        },
        response: [
          'Uninstalled the rogue APK and revoked all device administrator rights.',
          'Preserved uncropped screenshots of threatening chats, phone numbers, and payment links with date stamps.',
          'Reported the app and lending entity on the RBI Sachet portal (sachet.rbi.org.in).',
          'Filed an FIR with the Cyber Crime Police Station under BNS Section 351 and IT Act Section 66E.'
        ],
        preventionLessons: [
          'Never install financial or loan apps from outside official app store repositories.',
          'Always verify if a digital lending platform is partnered with an RBI-registered NBFC on the official RBI whitelist.',
          'Never grant contact book or media gallery permissions to any lending or utility application.'
        ],
        legalContext: ['Section 66E', 'BNS Section 351', 'BNS Section 78', 'BSA Section 63'],
        relatedCrimes: ['loan-app-extortion', 'cyberstalking-doxxing', 'ncii-image-abuse'],
        sources: [
          {
            title: 'Regulatory Framework for Digital Lending',
            authority: 'Reserve Bank of India (RBI)',
            url: 'https://www.rbi.org.in',
            publicationDate: 'August 2022 / Updated 2024',
            sourceType: 'government'
          }
        ],
        published: true
      },
      {
        title: 'The Regional Clinic Ransomware Lockdown',
        slug: 'hospital-ransomware-certin-response',
        caseNumber: 'CASE FILE 011',
        caseType: 'educational-reconstruction',
        incidentType: 'Ransomware & Infrastructure',
        attackVector: 'Email',
        shortDescription: 'A regional multi-specialty diagnostic clinic suffered a complete patient records lockdown after an employee opened a weaponized invoice attachment. The management notified CERT-In within 6 hours and restored systems without paying ransom.',
        incidentDate: 'October 2025',
        publishedDate: 'November 2025',
        difficulty: 'Advanced',
        featured: true,
        sourceSummary: 'Reconstruction based on CERT-In directions and advisories on ransomware resilience in healthcare and essential public services.',
        narrativeSections: [
          {
            heading: 'The Weaponized Invoice Attachment',
            body: 'At 09:30 AM on a Monday, an administrative receptionist at a regional clinic received an email titled "Urgent: Revised Diagnostic Reagents Billing Invoice #INV-8821.zip". Believing it to be from their regular medical laboratory supplier, the employee unzipped the folder and double-clicked the enclosed PDF executable. Within seconds, a background PowerShell script initiated lateral movement across the local clinic network.'
          },
          {
            heading: 'The Network Encryption & Demand',
            body: 'By 11:00 AM, laboratory diagnostic terminals began crashing with blue screens. Desktop wallpapers were replaced with a text file: "ALL YOUR PATIENT FILES AND X-RAY DATABASES ARE ENCRYPTED WITH AES-256. Send 1.5 Bitcoin ($90,000) within 72 hours to the wallet address below or all files will be permanently deleted and leaked on the dark web."'
          },
          {
            heading: 'Immediate Incident Containment & CERT-In Notice',
            body: 'The clinic\'s IT administrator immediately disconnected the primary network router and severed all internet connections to isolate infected subnetworks. Following mandatory statutory protocols under Section 70B(6) of the IT Act, the clinic submitted an incident report to incident@cert-in.org.in within 4 hours, detailing the indicators of compromise (IOCs) and ransomware variant hash.'
          },
          {
            heading: 'Restoration from Air-Gapped Immutable Backups',
            body: 'The clinic leadership strictly refused to negotiate or pay the ransom. Because the clinic maintained an offline 3-2-1 backup topology with weekly immutable air-gapped tape drives, the IT team sanitized all workstations, re-imaged server operating systems, and restored patient databases up to the previous evening\'s backup by 08:00 AM the following morning with zero data loss.'
          }
        ],
        timeline: [
          {
            time: '09:30 AM',
            label: 'Malicious Attachment Executed',
            description: 'Employee opens ZIP attachment executing initial ransomware dropper.',
            type: 'contact'
          },
          {
            time: '11:00 AM',
            label: 'Network-Wide Encryption Triggered',
            description: 'Ransomware deploys across network shares and drops extortion note.',
            type: 'escalation'
          },
          {
            time: '11:20 AM',
            label: 'Physical Network Isolation',
            description: 'IT staff physically severs local area switches and internet gateways.',
            type: 'decision'
          },
          {
            time: '01:30 PM',
            label: 'CERT-In Statutory Report Filed',
            description: 'Formal incident notification submitted to CERT-In within the 6-hour window.',
            type: 'response'
          },
          {
            time: 'Next Day 08:00 AM',
            label: 'Air-Gapped Backup Restoration',
            description: 'Patient records completely restored from offline immutable backups with zero ransom paid.',
            type: 'discovery'
          }
        ],
        decisionPoints: [
          {
            questionText: 'When an organization\'s computer systems are infected with ransomware, why do national cybersecurity agencies (CERT-In) strongly advise against paying the ransom?',
            options: [
              {
                optionText: 'Because paying ransom is an automatic criminal confession of negligence.',
                isCorrect: false,
                explanation: 'Incorrect! While legal implications exist, that is not the primary operational reason.'
              },
              {
                optionText: 'Paying ransom does not guarantee receiving a working decryption key, funds criminal enterprises, and marks the organization as an easy target for repeat attacks.',
                isCorrect: true,
                explanation: 'Correct! National advisories strictly discourage ransom payments because statistics show many victims never receive working keys, and payment finances further cyber syndicates.'
              }
            ]
          }
        ],
        warningSigns: [
          {
            title: 'ZIP or ISO Attachments in Financial Emails',
            explanation: 'Attackers package executables inside archive files to bypass basic email antivirus filters.'
          },
          {
            title: 'Double File Extensions (e.g. invoice.pdf.exe)',
            explanation: 'Exploits default operating system behavior hiding known file extensions.'
          },
          {
            title: 'Unusual Lateral Network Traffic Spikes',
            explanation: 'Ransomware scans internal ports (SMB port 445, RDP port 3389) before triggering encryption.'
          }
        ],
        attackerObjectives: ['Money', 'Operational Disruption', 'Extortion'],
        impact: {
          financial: 'Zero ransom paid; operational recovery costs absorbed internally.',
          account: 'No credential leakage outside internal clinic network.',
          privacy: 'Patient data encrypted locally but exfiltration prevented due to rapid network severance.',
          operational: 'Diagnostic appointments delayed by 18 hours during offline re-imaging.'
        },
        response: [
          'Physically isolated all local subnetworks by unplugging ethernet switches.',
          'Submitted mandatory cybersecurity incident report to CERT-In under Section 70B within 6 hours.',
          'Restored all clinical operating records from offline air-gapped immutable backups.',
          'Deployed endpoint detection and response (EDR) software across all clinical terminals.'
        ],
        preventionLessons: [
          'Maintain an immutable 3-2-1 backup strategy: 3 copies, on 2 different media types, with 1 copy completely off-site and air-gapped.',
          'Enforce least-privilege access so regular employee accounts cannot execute administrative scripts.',
          'Implement mandatory email attachment sandboxing for all incoming administrative inboxes.'
        ],
        legalContext: ['Section 43', 'Section 66', 'Section 70B'],
        relatedCrimes: ['ransomware', 'malware', 'bec'],
        sources: [
          {
            title: 'Directions under sub-section (6) of section 70B of the Information Technology Act, 2000',
            authority: 'Indian Computer Emergency Response Team (CERT-In)',
            url: 'https://www.cert-in.org.in',
            publicationDate: 'April 2022',
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
    console.log('- Seeding quizzes (10 comprehensive categories)...');
    const quizzesData = [
      { title: 'Phishing Prevention Challenge', category: 'Phishing', description: 'Test your ability to spot mock websites and spoof emails.', difficulty: 'Beginner' },
      { title: 'Social Engineering & Vishing', category: 'Social Engineering', description: 'Test your defense against psychological manipulation and fake phone calls.', difficulty: 'Intermediate' },
      { title: 'UPI & Financial Safety', category: 'Financial Safety', description: 'Test your payment security habits and QR transaction awareness.', difficulty: 'Intermediate' },
      { title: 'Credentials & Account Security', category: 'Account Security', description: 'Test your account defense strength, password hygiene, and MFA checks.', difficulty: 'Advanced' },
      { title: 'Cyber Law & Privacy Basics', category: 'Cyber Law Basics', description: 'Test your understanding of the IT Act, 2000, and the DPDP Act, 2023.', difficulty: 'Beginner' },
      { title: 'Indian Cyber Law and IT Act', category: 'Indian Cyber Law and IT Act', description: 'Master the Information Technology Act, statutory rights, civil compensation, and penalties.', difficulty: 'Intermediate' },
      { title: 'Bharatiya Nyaya Sanhita Cybercrimes', category: 'BNS and cybercrime provisions', description: 'Criminal offences under BNS 2023 including impersonation, online extortion, and stalking.', difficulty: 'Intermediate' },
      { title: 'Digital Evidence and BSA Section 63', category: 'BSA and digital evidence', description: 'Admissibility of electronic records, Section 63 certificates, and forensic custody under BSA 2023.', difficulty: 'Advanced' },
      { title: 'Digital Personal Data Protection & Privacy', category: 'DPDP and privacy', description: 'Explore Data Principal rights, consent rules, child protections, and fiduciary duties.', difficulty: 'Intermediate' },
      { title: 'AI, Deepfakes and Emerging Threats', category: 'AI, deepfakes and emerging threats', description: 'Analyze neural voice cloning, video face-swaps, synthetic extortion, and takedown obligations.', difficulty: 'Intermediate' },
      { title: 'Incident Response and 1930 Helpline', category: 'Incident response and reporting', description: 'Essential steps during cyber fraud: Helpline 1930, the Golden Hour, and evidence preservation.', difficulty: 'Beginner' },
      { title: 'General Cybersecurity Awareness', category: 'General cybersecurity awareness', description: 'Core practical security: Wi-Fi safety, SIM PIN hygiene, and 3-2-1 backup strategies.', difficulty: 'Beginner' }
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
    let qPart3 = [];
    const p3Path = path.join(__dirname, 'quizQuestions_part3.json');
    if (fs.existsSync(p3Path)) {
      qPart3 = JSON.parse(fs.readFileSync(p3Path, 'utf8'));
    }
    const quizQuestionsData = [...qPart1, ...qPart2, ...qPart3];

    let questionIdx = 1;
    for (let qData of quizQuestionsData) {
      let targetCategory = qData.category;
      if (!quizMap[targetCategory]) {
        // Fallbacks for category aliasing
        if (targetCategory === 'Phishing and social engineering') targetCategory = 'Phishing';
        else if (targetCategory === 'UPI, banking and financial fraud') targetCategory = 'Financial Safety';
        else if (targetCategory === 'Identity theft and account security') targetCategory = 'Account Security';
      }
      const dbQuiz = quizMap[targetCategory] || quizMap['Cyber Law Basics'];
      if (!dbQuiz) {
        throw new Error(`Quiz not found for category: ${qData.category}`);
      }
      qData.quizId = dbQuiz._id;
      if (!qData.questionId) {
        const catPrefix = qData.category.replace(/[^A-Za-z]/g, '').substring(0, 5).toUpperCase();
        qData.questionId = `QZ-${catPrefix}-${String(questionIdx).padStart(3, '0')}`;
      }
      if (!qData.format) {
        qData.format = 'single_choice';
      }
      if (!qData.practicalTakeaway) {
        qData.practicalTakeaway = 'Remember: Always verify digital requests through trusted secondary channels and keep credentials private.';
      }
      if (!qData.whyIncorrect) {
        qData.whyIncorrect = 'This answer does not align with established statutory provisions or digital security guidelines.';
      }
      if (!qData.legalReferences || qData.legalReferences.length === 0) {
        const sec = qData.relatedLawSection ? qData.relatedLawSection.replace(/^section\s*/i, '').trim() : '66D';
        qData.legalReferences = [{ actName: 'Information Technology Act, 2000', sectionNumber: sec || '66D' }];
      }
      questionIdx++;

      await QuizQuestion.findOneAndUpdate(
        { questionText: qData.questionText },
        qData,
        { upsert: true, new: true }
      );
    }

    // Synchronize questions: remove legacy questions whose questionText is no longer in the fixture bank
    const activeQuestionTexts = new Set(quizQuestionsData.map(q => q.questionText));
    await QuizQuestion.deleteMany({ questionText: { $nin: Array.from(activeQuestionTexts) } });

    // 8. Scenario Engine Seeding (Baseline & Branching Final)
    console.log('- Seeding scenario engine nodes...');
    
    async function upsertStage(stageData) {
      const existing = await ScenarioStage.findOne({
        scenarioId: stageData.scenarioId,
        stageOrder: stageData.stageOrder
      });
      if (existing) {
        await ScenarioStage.updateOne({ _id: existing._id }, stageData);
        return ScenarioStage.findById(existing._id);
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
        return ScenarioDecision.findById(existing._id);
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
        scenario = await Scenario.findById(scenario._id);
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
          measurementFocus: stg.measurementFocus || [],
          targetSignals: stg.targetSignals || [],
          terminal: stg.terminal || false
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

        // Synchronize decisions for this stage to remove obsolete options from previous scenario versions
        const validDecisionTexts = dList.decisions.map(d => d.optionText);
        await ScenarioDecision.deleteMany({ stageId: parentStage._id, optionText: { $nin: validDecisionTexts } });

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
            scoreChange: dec.scoreChange || 0,
            categoryScoreWeights: dec.categoryScoreWeights || {},
            identifiedSignals: dec.identifiedSignals || [],
            behaviorEffects: dec.behaviorEffects || {
              recognition: 0,
              signalIdentification: 0,
              verification: 0,
              decisionQuality: 0,
              falsePositive: 0,
              unreviewedAcceptance: 0
            },
            riskLevel: dec.riskLevel || 'safe',
            isCriticalMistake: dec.isCriticalMistake || false,
            nextStageId: resolvedNextStageId,
            explanation: dec.explanation,
            outcomeType: dec.outcomeType || 'neutral'
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
      },
      {
        title: 'RBI Sachet Portal — Checking Regulatory Alerts & Reporting Illegal Entities',
        category: 'Government Resources',
        description: 'Multi-regulator State Level Coordination Committee (SLCC) portal by the Reserve Bank of India to lodge complaints against unauthorized financial entities, unregistered lending apps, and illegal deposit-taking schemes. Official lists of legitimately registered NBFCs and banks are maintained directly on the main RBI website (rbi.org.in).',
        link: 'https://sachet.rbi.org.in',
        downloadable: false
      },
      {
        title: 'Chakshu Portal (DoT Sanchar Saathi)',
        category: 'Reporting Service',
        description: 'Department of Telecommunications portal enabling citizens to report suspected fraudulent communications, spam calls, caller ID spoofing, and malicious SMS.',
        link: 'https://sancharsaathi.gov.in/sfc/',
        downloadable: false
      },
      {
        title: 'CERT-In Incident Reporting & Vulnerability Advisories',
        category: 'Government Resources',
        description: 'Official portal and technical advisories from the Indian Computer Emergency Response Team for reporting computer security incidents and ransomware.',
        link: 'https://www.cert-in.org.in',
        downloadable: false
      },
      {
        title: 'NCIIPC Critical Infrastructure Cybersecurity Portal',
        category: 'Awareness Guides',
        description: 'National nodal agency guidelines under Section 70A of the IT Act for securing critical power, transport, banking, and telecom networks.',
        link: 'https://nciipc.gov.in',
        downloadable: false
      }
    ];

    for (let resData of resourcesData) {
      await Resource.findOneAndUpdate({ title: resData.title }, resData, { upsert: true, new: true });
    }

    console.log('- Seeding Learning Modules (12 Structured Lessons)...');
    for (let lm of learningModulesData) {
      await LearningModule.findOneAndUpdate({ slug: lm.slug }, lm, { upsert: true, new: true });
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
