/**
 * Expanded Question Bank Seed Data
 * Target: Comprehensive coverage of Indian Cyber Law, BNS, BSA, DPDP, Emerging Threats,
 * Incident Response, and 8 Question Formats with supportive explanations and practical takeaways.
 */

const expandedQuestions = [
  // =========================================================================
  // 1. BHARATIYA NYAYA SANHITA (BNS) & CYBERCRIME PROVISIONS (Target: 35)
  // =========================================================================
  {
    questionId: 'QZ-BNS-001',
    format: 'single_choice',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Cheating by Personation',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Under the Bharatiya Nyaya Sanhita, 2023 (in force from July 1, 2024), which section defines cheating by personation, such as pretending to be a bank official or police officer over digital media?',
    options: [
      'Section 319 of BNS, 2023',
      'Section 420 of IPC, 1860',
      'Section 302 of BNS, 2023',
      'Section 500 of BNS, 2023'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 319 of the Bharatiya Nyaya Sanhita (BNS), 2023 specifically defines cheating by personation (pretending to be someone else, or knowingly substituting one person for another). This replaces Section 416 of the erstwhile IPC.',
    optionExplanations: [
      'Correct. Section 319 of BNS defines cheating by personation, punishing fraudsters who impersonate police, judges, or bank executives.',
      'Incorrect. Section 420 was part of the Indian Penal Code 1860, which was replaced by the BNS on July 1, 2024.',
      'Incorrect. Section 302 of BNS deals with snatching, not digital impersonation.',
      'Incorrect. Section 500 does not define cheating by personation.'
    ],
    whyIncorrect: 'Citing the repealed IPC (Section 420) ignores that crimes committed on or after July 1, 2024 are prosecuted under the Bharatiya Nyaya Sanhita, 2023.',
    practicalTakeaway: 'Remember: In FIRs registered after July 1, 2024, online impersonation and cheating are charged under BNS Sections 318 and 319, alongside IT Act Section 66D.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 319', title: 'Cheating by personation', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024 via S.O. 850(E)' }
  },
  {
    questionId: 'QZ-BNS-002',
    format: 'legal_application',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Dishonest Inducement of Property',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'A scammer creates a fake e-commerce portal and convinces buyers to transfer Rs. 45,000 for mobile phones that are never delivered. Under BNS 2023, which provision punishes cheating and dishonestly inducing delivery of property?',
    options: [
      'Section 318(4) of BNS, 2023',
      'Section 66A of IT Act',
      'Section 124A of IPC',
      'Section 103 of BNS, 2023'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 318(4) of BNS, 2023 prescribes punishment (imprisonment up to 7 years and fine) for anyone who cheats and dishonestly induces the delivery of any property. This corresponds to the former Section 420 of the IPC.',
    optionExplanations: [
      'Correct. Section 318(4) directly penalizes cheating that induces transfer of money or property with up to 7 years imprisonment.',
      'Incorrect. Section 66A of the IT Act was declared unconstitutional by the Supreme Court in Shreya Singhal (2015) and has zero legal validity.',
      'Incorrect. IPC is repealed and Section 124A was the sedition clause, entirely irrelevant to financial cyber fraud.',
      'Incorrect. Section 103 of BNS prescribes punishment for murder.'
    ],
    whyIncorrect: 'Relying on struck-down or unrelated statutory clauses will weaken legal complaints. Section 318(4) of BNS is the specific provision for online scams where money was fraudulently obtained.',
    practicalTakeaway: 'Remember: When money is fraudulently transferred in an online scam, Section 318(4) of BNS applies alongside IT Act Section 66D (cheating by personation using computer resource).',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 318(4)', title: 'Cheating and dishonestly inducing delivery of property', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-003',
    format: 'scenario_decision',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Cyberstalking',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 4',
    questionText: 'An individual repeatedly monitors a colleague\'s internet usage, creates anonymous social accounts to send unwanted messages despite clear disinterest, and posts her real-time location. Under BNS 2023, which provision criminalizes cyberstalking?',
    options: [
      'Section 78 of BNS, 2023 (Stalking)',
      'Section 354D of IPC (still sole authority)',
      'Section 77 of BNS, 2023 (Voyeurism)',
      'Section 66F of IT Act (Cyber terrorism)'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 78 of BNS, 2023 comprehensively defines stalking, specifically including monitoring the use by a woman of the internet, email, or any other form of electronic communication. This replaces erstwhile Section 354D of the IPC.',
    optionExplanations: [
      'Correct. Section 78 of BNS directly includes monitoring internet/email usage and electronic communications as criminal stalking.',
      'Incorrect. Section 354D was in the IPC, which has been superseded by Section 78 of BNS for offences after July 1, 2024.',
      'Incorrect. Section 77 deals with voyeurism (capturing or publishing images of private acts without consent).',
      'Incorrect. Section 66F of the IT Act deals with cyber terrorism affecting the sovereignty or critical infrastructure of India.'
    ],
    whyIncorrect: 'While IPC 354D previously governed stalking, the operative criminal statute in India is now Section 78 of the Bharatiya Nyaya Sanhita, 2023.',
    practicalTakeaway: 'Remember: Cyberstalking is a cognizable offence under BNS Section 78. Victims should preserve chat logs, URLs, and timestamps and report immediately at cybercrime.gov.in or Helpline 1930.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 78', title: 'Stalking', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-004',
    format: 'multiple_choice',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Voyeurism and Image-Based Abuse',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Which of the following acts constitute the offence of voyeurism under Section 77 of the Bharatiya Nyaya Sanhita, 2023? (Select all that apply)',
    options: [
      'Capturing the image of a woman engaging in a private act where privacy is reasonably expected',
      'Disseminating or publishing intimate images captured in private circumstances without consent',
      'Forwarding a publicly broadcast television news segment',
      'Installing a covert camera in a commercial changing room'
    ],
    correctOptionIndices: [0, 1, 3],
    explanation: 'Section 77 of BNS, 2023 punishes anyone who watches, captures, or disseminates images of a woman engaging in a private act where she would reasonably expect privacy. This includes both the capture and downstream distribution, as well as covert recording in changing rooms.',
    optionExplanations: [
      'Correct. Capturing images in private spaces is the foundational element of Section 77.',
      'Correct. Disseminating or sharing such intimate images without consent is explicitly punishable under Section 77.',
      'Incorrect. A publicly broadcast news segment is already in public domain and does not constitute voyeurism.',
      'Correct. Installing covert cameras in changing rooms constitutes criminal voyeurism.'
    ],
    whyIncorrect: 'Only private acts carry the expectation of privacy under Section 77. Publicly broadcast content does not satisfy the statutory threshold of private intimacy.',
    practicalTakeaway: 'Remember: Section 77 of BNS criminalizes both recording private acts and sharing/forwarding non-consensual intimate imagery (NCII). Forwarding is as much an offence as recording.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 77', title: 'Voyeurism', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-005',
    format: 'true_false',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Extortion and Blackmail',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'True or False: Under Section 308 of the Bharatiya Nyaya Sanhita, 2023, threatening to release sensitive personal photos unless money is paid constitutes the criminal offence of Extortion.',
    options: ['True', 'False'],
    correctOptionIndex: 0,
    explanation: 'True. Under Section 308 of BNS, intentionally putting any person in fear of injury (including reputational and psychological injury) to dishonestly induce them to deliver money or property constitutes Extortion.',
    optionExplanations: [
      'Correct. Threatening reputational destruction or leaks to demand money is textbook extortion under BNS Section 308.',
      'Incorrect. It is true; digital blackmail for ransom or funds is legally classified as extortion.'
    ],
    whyIncorrect: 'Extortion does not require physical violence; threat of injury to reputation or electronic release of sensitive data fulfills the statutory definition.',
    practicalTakeaway: 'Remember: If someone threatens to publish your private chats or photos unless you pay ("sextortion"), never pay. Paying guarantees more demands. Report immediately to 1930.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 308', title: 'Extortion', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-006',
    format: 'matching',
    category: 'BNS and cybercrime provisions',
    subtopic: 'BNS vs Repealed IPC Mapping',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 4',
    questionText: 'Match each BNS, 2023 cyber-relevant provision with its corresponding subject matter:',
    matchingPairs: [
      { left: 'BNS Section 318(4)', right: 'Cheating and dishonestly inducing delivery of money' },
      { left: 'BNS Section 319', right: 'Cheating by personation (impersonating officials)' },
      { left: 'BNS Section 78', right: 'Stalking (including internet and email monitoring)' },
      { left: 'BNS Section 351', right: 'Criminal intimidation (threats via electronic messages)' }
    ],
    explanation: 'BNS provisions map modern criminal offenses to updated sections: Section 318(4) covers property cheating, 319 covers impersonation, 78 covers stalking including online telemetry, and 351 covers criminal intimidation.',
    optionExplanations: [],
    whyIncorrect: 'Mismatched sections confuse the operative criminal charges in cyber FIRs.',
    practicalTakeaway: 'Remember: Knowing the modern BNS sections ensures your cybercrime complaints and police statements reference active Indian law.',
    legalReferences: [
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 318(4)', title: 'Cheating', status: 'active' },
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 319', title: 'Personation', status: 'active' },
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 78', title: 'Stalking', status: 'active' },
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 351', title: 'Criminal Intimidation', status: 'active' }
    ],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-007',
    format: 'single_choice',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Criminal Intimidation Online',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'A cyberbully sends anonymous death threats and threats of acid attack via WhatsApp and Instagram DMs. Which section of BNS 2023 applies to criminal intimidation via digital messages?',
    options: [
      'Section 351 of BNS, 2023',
      'Section 66A of IT Act',
      'Section 295 of BNS, 2023',
      'Section 144 of CrPC'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 351 of BNS, 2023 defines and penalizes criminal intimidation. Threatening someone with injury to person, reputation, or property—regardless of whether transmitted in person or via electronic messaging—is punishable under Section 351(2) and (3).',
    optionExplanations: [
      'Correct. Section 351 of BNS defines and punishes criminal intimidation by any means, including digital messages.',
      'Incorrect. Section 66A was struck down in 2015 and cannot be invoked.',
      'Incorrect. Section 295 deals with public nuisances and places of worship.',
      'Incorrect. CrPC Section 144 relates to executive magistrate prohibitory orders, not criminal intimidation.'
    ],
    whyIncorrect: 'Do not invoke Section 66A for online threats; Section 351 of BNS is the legitimate statutory provision for criminal intimidation.',
    practicalTakeaway: 'Remember: Online threats are not protected speech. They constitute criminal intimidation under BNS Section 351. Keep screenshots and export chat backups before blocking.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 351', title: 'Criminal intimidation', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BNS-008',
    format: 'single_choice',
    category: 'BNS and cybercrime provisions',
    subtopic: 'Organized Crime Syndicates',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 4',
    questionText: 'A transnational syndicate operating mule bank accounts and call center hubs across state lines is busted for defrauding thousands of pensioners. Which groundbreaking provision in BNS 2023 can be invoked against organized cybercrime syndicates?',
    options: [
      'Section 111 of BNS, 2023 (Organized Crime)',
      'Section 43 of IT Act',
      'Section 67 of IT Act',
      'Section 100 of BNS, 2023'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 111 of BNS, 2023 introduced a dedicated statutory framework for "Organized Crime", covering continuing unlawful activity by a member of a crime syndicate by use of violence, intimidation, or cyber fraud to obtain financial advantage.',
    optionExplanations: [
      'Correct. Section 111 specifically penalizes organized crime syndicates, including large-scale coordinated cyber fraud networks.',
      'Incorrect. Section 43 of IT Act is a civil compensation remedy for computer damage, not an organized crime penalty.',
      'Incorrect. Section 67 penalizes publishing obscene material electronically.',
      'Incorrect. Section 100 defines culpable homicide not amounting to murder.'
    ],
    whyIncorrect: 'Small-scale cheating provisions alone fail to capture the syndication and financial infrastructure of organized mule-account networks. Section 111 provides severe penalties for organized crime syndicates.',
    practicalTakeaway: 'Remember: Indian law now treats coordinated call center scams and mule networks as Organized Crime under BNS Section 111 with severe non-bailable penalties.',
    legalReferences: [{ actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 111', title: 'Organized Crime', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Nyaya Sanhita', citation: 'Act 45 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },

  // =========================================================================
  // 2. BHARATIYA SAKSHYA ADHINIYAM (BSA) & DIGITAL EVIDENCE (Target: 25)
  // =========================================================================
  {
    questionId: 'QZ-BSA-001',
    format: 'single_choice',
    category: 'BSA and digital evidence',
    subtopic: 'Admissibility of Electronic Records',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Under the Bharatiya Sakshya Adhiniyam, 2023 (BSA, in force from July 1, 2024), which section governs the admissibility of electronic records in Indian courts, replacing Section 65B of the Indian Evidence Act, 1872?',
    options: [
      'Section 63 of BSA, 2023',
      'Section 65B of BSA, 2023',
      'Section 100 of IT Act',
      'Section 43A of BSA, 2023'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 specifically governs the admissibility of electronic records (emails, server logs, CCTV footage, mobile extractions), replacing Section 65B of the repealed Indian Evidence Act, 1872.',
    optionExplanations: [
      'Correct. Section 63 of BSA is the exact statutory successor to Section 65B for electronic evidence admissibility.',
      'Incorrect. There is no Section 65B in BSA; BSA renumbered and updated evidentiary sections.',
      'Incorrect. The IT Act does not contain a Section 100.',
      'Incorrect. Section 43A was in the IT Act, not the Evidence statute.'
    ],
    whyIncorrect: 'While lawyers frequently referred to "65B certificates" for decades, under the BSA in force since July 1, 2024, digital certificates are mandated under Section 63.',
    practicalTakeaway: 'Remember: Whenever presenting WhatsApp chats, call recordings, or emails in court or police inquiries today, the certificate is submitted under Section 63 of BSA, 2023.',
    legalReferences: [{ actName: 'Bharatiya Sakshya Adhiniyam', sectionNumber: 'Section 63', title: 'Admissibility of electronic records', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Sakshya Adhiniyam', citation: 'Act 47 of 2023', year: 2023, status: 'In force from 01.07.2024 via S.O. 848(E)' }
  },
  {
    questionId: 'QZ-BSA-002',
    format: 'legal_application',
    category: 'BSA and digital evidence',
    subtopic: 'Section 63 Certificate Requirements',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 4',
    questionText: 'A victim of online defamation prints out copies of offensive Facebook comments from her personal laptop to submit to the magistrate. Why is the printed screenshot alone insufficient as substantive evidence under Section 63(4) of BSA?',
    options: [
      'Because secondary electronic evidence requires a Section 63 certificate signed by the person in lawful control of the device',
      'Because printed documents are never admissible in Indian courts',
      'Because only the Central Government can print electronic records',
      'Because social media evidence is completely prohibited under Indian law'
    ],
    correctOptionIndex: 0,
    explanation: 'Under Section 63(4) of BSA, 2023 (affirming principles from Arjun Panditrao), an electronic record produced as secondary evidence requires a mandatory certificate identifying the electronic record, describing the device, and signed by a person in lawful management or an authorized expert.',
    optionExplanations: [
      'Correct. Without a Section 63 certificate establishing lawful control and authenticity of the computer printout, it remains inadmissible secondary evidence.',
      'Incorrect. Printed documents are admissible provided they comply with statutory certificate conditions.',
      'Incorrect. Any lawful device owner or authorized technical officer can sign the certificate.',
      'Incorrect. Social media evidence is widely admissible when properly certified.'
    ],
    whyIncorrect: 'Paper printouts can be easily edited or fabricated with browser developer tools; the Section 63 certificate affirms under penalty of perjury that the computer was operating properly and the output matches the original record.',
    practicalTakeaway: 'Remember: When printing electronic messages for court, always execute a certificate under BSA Section 63 detailing your device model, operating condition, and the truth of the printout.',
    legalReferences: [{ actName: 'Bharatiya Sakshya Adhiniyam', sectionNumber: 'Section 63(4)', title: 'Conditions for electronic record certificate', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Sakshya Adhiniyam', citation: 'Act 47 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BSA-003',
    format: 'ordering',
    category: 'BSA and digital evidence',
    subtopic: 'Digital Evidence Preservation Chain',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 4',
    questionText: 'Arrange the following digital evidence handling steps in their correct forensic sequence from initial discovery to court presentation:',
    sequenceItems: [
      '1. Isolate the target device (e.g. airplane mode or Faraday bag) to prevent remote wiping',
      '2. Document the device state, screen content, hardware serial numbers, and physical condition',
      '3. Create a bit-stream forensic image and calculate cryptographic SHA-256 hash',
      '4. Store the original media in tamper-evident secure custody maintaining a Chain of Custody log',
      '5. Prepare and execute the Section 63 BSA certificate for court submission'
    ],
    explanation: 'Correct forensic sequence: 1. Isolate the device immediately to block remote wipe commands; 2. Document physical & logical state; 3. Acquire bit-stream image with cryptographic hash; 4. Secure original with chain of custody; 5. Formulate Section 63 certificate.',
    optionExplanations: [],
    whyIncorrect: 'Failing to isolate the device first risks remote wipe by fraudsters. Analyzing the original instead of a forensic clone risks altering metadata timestamps.',
    practicalTakeaway: 'Remember: Never alter the original device. First isolate, clone with cryptographic hash verification, and secure the chain of custody.',
    legalReferences: [{ actName: 'Bharatiya Sakshya Adhiniyam', sectionNumber: 'Section 63', title: 'Admissibility of electronic records', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Sakshya Adhiniyam', citation: 'Act 47 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BSA-004',
    format: 'true_false',
    category: 'BSA and digital evidence',
    subtopic: 'Cryptographic Hashing in Evidence',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'True or False: Under digital forensics standards recognized by Indian courts under BSA Section 63, if a single character inside a 10 GB disk image is modified, its SHA-256 cryptographic hash value will change completely.',
    options: ['True', 'False'],
    correctOptionIndex: 0,
    explanation: 'True. Cryptographic hash functions exhibit the "avalanche effect": changing even a single bit in the input produces a completely different, unpredictable output hash, mathematically proving whether electronic evidence was tampered with.',
    optionExplanations: [
      'Correct. The avalanche effect guarantees that any tampering, however minor, destroys hash matching and exposes evidence alteration.',
      'Incorrect. It is true; cryptographic hashing is deterministic and highly sensitive to single-bit alterations.'
    ],
    whyIncorrect: 'Hashes are not loose approximations; they are mathematical fingerprints that must match byte-for-byte to verify evidence integrity.',
    practicalTakeaway: 'Remember: Forensic investigators always verify that the acquisition hash matches the court presentation hash to prove evidence was never modified.',
    legalReferences: [{ actName: 'Bharatiya Sakshya Adhiniyam', sectionNumber: 'Section 63', title: 'Electronic record integrity', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Sakshya Adhiniyam', citation: 'Act 47 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },
  {
    questionId: 'QZ-BSA-005',
    format: 'multiple_choice',
    category: 'BSA and digital evidence',
    subtopic: 'Section 63(4) Certificate Signatories',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 4',
    questionText: 'Under Section 63(4) of the Bharatiya Sakshya Adhiniyam, 2023, who among the following is legally competent to sign the electronic evidence certificate? (Select all that apply)',
    options: [
      'A person occupying a responsible official position in relation to the operation of the relevant device or management of the relevant activities',
      'An expert appointed or recognized under law',
      'Any random individual who glanced at the computer screen once',
      'The lawful owner or manager who routinely operates the computer system'
    ],
    correctOptionIndices: [0, 1, 3],
    explanation: 'Section 63(4) of BSA requires the certificate to be signed by a person occupying a responsible official position in relation to the operation of the device, or an authorized technical expert, or the person in lawful management/ownership of the computer.',
    optionExplanations: [
      'Correct. Official managers overseeing corporate or institutional servers are authorized signatories.',
      'Correct. Recognized digital forensics experts under Section 79A of the IT Act can execute the certificate.',
      'Incorrect. A bystander without lawful control or technical responsibility cannot lawfully certify electronic records.',
      'Correct. The personal computer owner who created or stored the files in ordinary course of activity can certify.'
    ],
    whyIncorrect: 'The certificate cannot be signed by a stranger or unauthorized observer; it requires lawful authority, technical control, or designated expert qualification.',
    practicalTakeaway: 'Remember: If you extracted chats from your own personal phone, you can sign your own Section 63 BSA certificate as the lawful owner in control of the device.',
    legalReferences: [{ actName: 'Bharatiya Sakshya Adhiniyam', sectionNumber: 'Section 63(4)', title: 'Signatories of electronic certificates', status: 'active' }],
    sourceMetadata: { actName: 'Bharatiya Sakshya Adhiniyam', citation: 'Act 47 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },

  // =========================================================================
  // 3. DIGITAL PERSONAL DATA PROTECTION ACT (DPDP) & PRIVACY (Target: 25)
  // =========================================================================
  {
    questionId: 'QZ-DPDP-001',
    format: 'single_choice',
    category: 'DPDP and privacy',
    subtopic: 'Commencement Status',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 1',
    questionText: 'What is the current operational commencement status of the Digital Personal Data Protection Act (DPDP Act), 2023?',
    options: [
      'It was enacted in August 2023, and Section 1(2) specifies that its provisions will come into force on dates appointed by Central Government notification in the Official Gazette',
      'It came into full operational effect on January 1, 2020',
      'It was struck down as unconstitutional by the Supreme Court',
      'It automatically repealed all provisions of the IT Act on August 11, 2023'
    ],
    correctOptionIndex: 0,
    explanation: 'The DPDP Act received Presidential assent on August 11, 2023. Under Section 1(2), its operational commencement is staggered and subject to notifications in the Official Gazette as rules and the Data Protection Board are established.',
    optionExplanations: [
      'Correct. The DPDP Act is enacted law awaiting operational commencement of substantive sections via Gazette notifications.',
      'Incorrect. The DPDP Act was enacted in 2023, not 2020.',
      'Incorrect. The DPDP Act has not been struck down; it is a valid Parliamentary enactment.',
      'Incorrect. Substantive IT Act provisions remain active; Section 44(2) of DPDP will amend Section 43A only upon notification.'
    ],
    whyIncorrect: 'Assuming the DPDP Act is already fully implemented ignores Section 1(2), which requires Gazette notification for substantive sections to become operational.',
    practicalTakeaway: 'Remember: In examinations and legal pleadings, state that DPDP Act 2023 is enacted statute awaiting Gazette notification for operational commencement.',
    legalReferences: [{ actName: 'Digital Personal Data Protection Act', sectionNumber: 'Section 1(2)', title: 'Commencement', status: 'pending_commencement' }],
    sourceMetadata: { actName: 'Digital Personal Data Protection Act', citation: 'Act 22 of 2023', year: 2023, status: 'Enacted; commencement pending' }
  },
  {
    questionId: 'QZ-DPDP-002',
    format: 'single_choice',
    category: 'DPDP and privacy',
    subtopic: 'Data Principal & Data Fiduciary',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Under the DPDP Act, 2023, what is the statutory term used for an individual to whom personal data relates?',
    options: [
      'Data Principal',
      'Data Fiduciary',
      'Data Processor',
      'Consent Manager'
    ],
    correctOptionIndex: 0,
    explanation: 'Under Section 2(t) of the DPDP Act, 2023, "Data Principal" means the individual to whom the personal data relates (and includes parents/lawful guardians if the individual is a child or person with disability).',
    optionExplanations: [
      'Correct. The individual whose data is collected and processed is the Data Principal.',
      'Incorrect. A Data Fiduciary is the entity that determines the purpose and means of processing personal data.',
      'Incorrect. A Data Processor is an entity that processes data on behalf of a Data Fiduciary.',
      'Incorrect. A Consent Manager is an interoperable platform facilitating consent management.'
    ],
    whyIncorrect: 'Confusing Data Principal with Data Fiduciary flips the rights-holder and the compliance-bearer under Indian data protection law.',
    practicalTakeaway: 'Remember: As an individual user or citizen in India, you are the "Data Principal"; companies handling your personal information are "Data Fiduciaries".',
    legalReferences: [{ actName: 'Digital Personal Data Protection Act', sectionNumber: 'Section 2(t)', title: 'Definition of Data Principal', status: 'pending_commencement' }],
    sourceMetadata: { actName: 'Digital Personal Data Protection Act', citation: 'Act 22 of 2023', year: 2023, status: 'Enacted' }
  },
  {
    questionId: 'QZ-DPDP-003',
    format: 'multiple_choice',
    category: 'DPDP and privacy',
    subtopic: 'Rights of Data Principals',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Which of the following rights are explicitly granted to Data Principals under Chapter III of the DPDP Act, 2023? (Select all that apply)',
    options: [
      'Right to access information about personal data processed (Section 11)',
      'Right to correction, completion, and erasure of personal data (Section 12)',
      'Right to grievance redressal by the Data Fiduciary (Section 13)',
      'Right to demand unconditional physical currency payments from search engines'
    ],
    correctOptionIndices: [0, 1, 2],
    explanation: 'Chapter III of the DPDP Act provides: Section 11 (Right to access info), Section 12 (Right to correction and erasure), Section 13 (Right to grievance redressal), and Section 14 (Right to nominate). There is no right to demand cash from search engines.',
    optionExplanations: [
      'Correct. Data Principals have the right to a summary of personal data and identities of entities with whom it was shared.',
      'Correct. Data Principals can request correction of inaccurate data and erasure of data no longer necessary.',
      'Correct. Data Fiduciaries must provide readily available grievance redressal mechanisms.',
      'Incorrect. There is no statutory right to demand currency payouts from search engines.'
    ],
    whyIncorrect: 'Data protection grants informational self-determination, rectification, and erasure—not arbitrary commercial compensation without breach.',
    practicalTakeaway: 'Remember: Under DPDP Act, you have the statutory right to see what data an organization holds on you and request its correction or deletion.',
    legalReferences: [
      { actName: 'Digital Personal Data Protection Act', sectionNumber: 'Section 11', title: 'Right to access', status: 'pending_commencement' },
      { actName: 'Digital Personal Data Protection Act', sectionNumber: 'Section 12', title: 'Right to correction and erasure', status: 'pending_commencement' }
    ],
    sourceMetadata: { actName: 'Digital Personal Data Protection Act', citation: 'Act 22 of 2023', year: 2023, status: 'Enacted' }
  },
  {
    questionId: 'QZ-DPDP-004',
    format: 'legal_application',
    category: 'DPDP and privacy',
    subtopic: 'Processing Children\'s Personal Data',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 4',
    questionText: 'An online gaming app tracks the behavioral geolocation of 14-year-old users in India to serve personalized behavioral advertisements. Under Section 9 of the DPDP Act, 2023, why is this prohibited?',
    options: [
      'Because Section 9 explicitly prohibits tracking, behavioral monitoring, or targeted advertising directed at children (under 18)',
      'Because children are forbidden from ever using smartphones in India',
      'Because game developers must pay a 50% state tax to track children',
      'Because only the United Nations can approve mobile games'
    ],
    correctOptionIndex: 0,
    explanation: 'Section 9 of the DPDP Act, 2023 establishes strict safeguards for children (individuals under 18 years): Data Fiduciaries must obtain verifiable parental consent and shall not undertake tracking, behavioral monitoring, or targeted advertising directed at children.',
    optionExplanations: [
      'Correct. Section 9(3) strictly bans tracking, behavioral monitoring, and targeted ads directed at children.',
      'Incorrect. Children can use smartphones; the restriction applies to corporate behavioral tracking and lack of parental consent.',
      'Incorrect. Taxation is completely unrelated to data protection restrictions.',
      'Incorrect. The UN has no licensing role in domestic mobile applications.'
    ],
    whyIncorrect: 'Children\'s data carries heightened statutory protections under DPDP Section 9; commercial behavioral profiling of minors is strictly barred.',
    practicalTakeaway: 'Remember: Under Indian data protection law, anyone under 18 is a child, and platforms are prohibited from tracking their behavior for targeted ads.',
    legalReferences: [{ actName: 'Digital Personal Data Protection Act', sectionNumber: 'Section 9', title: 'Processing of personal data of children', status: 'pending_commencement' }],
    sourceMetadata: { actName: 'Digital Personal Data Protection Act', citation: 'Act 22 of 2023', year: 2023, status: 'Enacted' }
  },

  // =========================================================================
  // 4. AI, DEEPFAKES & EMERGING THREATS (Target: 25)
  // =========================================================================
  {
    questionId: 'QZ-AITHREAT-001',
    format: 'scenario_decision',
    category: 'AI, deepfakes and emerging threats',
    subtopic: 'AI Voice Cloning Scams',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 3',
    questionText: 'A father receives a phone call with his son\'s exact voice, crying in panic and claiming he has been arrested after an accident and needs Rs. 80,000 sent via UPI immediately. What is the safest immediate action?',
    options: [
      'Hang up and immediately call the son directly on his normal phone number or contact another family member to verify',
      'Immediately transfer the Rs. 80,000 because hearing his exact voice proves it cannot be a scam',
      'Post the son\'s Aadhaar card on Twitter asking if anyone saw the accident',
      'Pay half the money and ask the caller to send the police station address'
    ],
    correctOptionIndex: 0,
    explanation: 'Generative AI voice cloning tools can replicate an individual\'s voice pitch, accent, and breathing cadence from just a few seconds of audio extracted from social media. The universal defense is secondary channel verification: hang up and dial the person directly on their known number.',
    optionExplanations: [
      'Correct. Calling the family member back directly on their trusted number bypasses the cloned spoofed call immediately.',
      'Incorrect. Hearing a familiar voice is no longer definitive proof of identity due to neural voice cloning technology.',
      'Incorrect. Leaking personal identity documents on public social media enables further identity theft.',
      'Incorrect. Sending any funds rewards the fraudster and proves your willingness to pay.'
    ],
    whyIncorrect: 'Believing that audio familiarity is unforgeable is a dangerous cognitive vulnerability. Modern AI clones human speech with near-perfect fidelity.',
    practicalTakeaway: 'Remember: When you receive an urgent emergency call from a loved one demanding money, pause. Hang up and dial them directly on their known number.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66D', title: 'Cheating by personation using computer resource', status: 'active' }],
    sourceMetadata: { actName: 'IT Act & BNS', citation: 'Section 66D IT Act & Section 318 BNS', year: 2023, status: 'Active' }
  },
  {
    questionId: 'QZ-AITHREAT-002',
    format: 'single_choice',
    category: 'AI, deepfakes and emerging threats',
    subtopic: 'IT Rules 2021 Takedown Obligations',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Under Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, within what timeframe must a social media intermediary remove non-consensual sexually explicit content or deepfakes after receiving a complaint?',
    options: [
      'Within 24 hours of receiving the complaint',
      'Within 30 days of receiving the complaint',
      'Within 6 months after court judgment only',
      'Intermediaries have zero obligation to remove any content'
    ],
    correctOptionIndex: 0,
    explanation: 'Rule 3(2)(b) of the IT Rules, 2021 mandates that an intermediary must take down or disable access to content exposing the private area of an individual, showing full or partial nudity, or depicting them in artificial/morphed non-consensual sexual acts within 24 hours of receiving a complaint.',
    optionExplanations: [
      'Correct. The statutory timeline under Rule 3(2)(b) for non-consensual intimate or morphed imagery is strictly 24 hours.',
      'Incorrect. 30 days is the standard periodic reporting window, far too slow for intimate abuse.',
      'Incorrect. A court order is not required for Rule 3(2)(b) intimate imagery complaints.',
      'Incorrect. Intermediaries lose safe harbor immunity under Section 79 if they fail to comply with takedown rules.'
    ],
    whyIncorrect: 'Failing to cite the emergency 24-hour window leaves victims unaware of their immediate statutory rights under IT Rules 2021.',
    practicalTakeaway: 'Remember: Social media platforms must remove non-consensual intimate or deepfake images within 24 hours of a complaint under Rule 3(2)(b).',
    legalReferences: [{ actName: 'Information Technology (Intermediary Guidelines) Rules', sectionNumber: 'Rule 3(2)(b)', title: 'Removal of intimate imagery within 24 hours', status: 'active' }],
    sourceMetadata: { actName: 'IT Rules 2021', citation: 'G.S.R. 139(E)', year: 2021, status: 'Active' }
  },
  {
    questionId: 'QZ-AITHREAT-003',
    format: 'indicator_identification',
    category: 'AI, deepfakes and emerging threats',
    subtopic: 'Detecting Video Deepfakes',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Inspect the following description of a suspicious video clip claiming to show a cabinet minister announcing emergency bank account freezes. Click the indicators that reveal it is an AI deepfake:',
    textToInspect: 'A video shows the Minister speaking with unnatural mouth-to-jaw boundary blending, perfectly static non-blinking eyes for 45 seconds, synthetic metallic audio cadence, and the official PIB verified logo is visibly blurred.',
    indicators: [
      { id: 'ind-1', text: 'unnatural mouth-to-jaw boundary blending', isSuspicious: true, explanation: 'Artifact of facial reenactment models failing to blend skin textures around lips' },
      { id: 'ind-2', text: 'static non-blinking eyes for 45 seconds', isSuspicious: true, explanation: 'Early generative models struggle with natural corneal reflection and realistic blink frequencies' },
      { id: 'ind-3', text: 'synthetic metallic audio cadence', isSuspicious: true, explanation: 'TTS (text-to-speech) and voice cloning models often introduce robotic audio harmonics' },
      { id: 'ind-4', text: 'PIB verified logo is visibly blurred', isSuspicious: true, explanation: 'Scammers frequently overlay blurred official logos to feign legitimacy' }
    ],
    explanation: 'Deepfake videos frequently display telltale generative artifacts: distorted teeth, inconsistent lip synchronization, unnatural blink rates, blurred edges around face boundaries, and robotic audio cadence.',
    optionExplanations: [],
    whyIncorrect: 'All four indicators are classic forensic artifacts of synthetic generative manipulation.',
    practicalTakeaway: 'Remember: Look closely at eye blinking, mouth boundaries, and audio cadence. Always cross-check viral claims against official PIB Fact Check portals.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66D', title: 'Cheating by personation', status: 'active' }],
    sourceMetadata: { actName: 'MeitY Advisories on Deepfakes', citation: 'MeitY Advisory 2023', year: 2023, status: 'Active' }
  },
  {
    questionId: 'QZ-AITHREAT-004',
    format: 'true_false',
    category: 'AI, deepfakes and emerging threats',
    subtopic: 'Safe Harbor Immunity and Deepfakes',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 4',
    questionText: 'True or False: Under Section 79 of the IT Act, 2000, an intermediary retains complete immunity from prosecution even if it intentionally ignores government notices to remove deepfake videos created to incite public disorder.',
    options: ['True', 'False'],
    correctOptionIndex: 1,
    explanation: 'False. Section 79 provides "safe harbor" protection only if the intermediary observes due diligence. Under Section 79(3)(b), if the intermediary fails to expeditiously remove unlawful content upon receiving actual knowledge or government order, its legal immunity is extinguished.',
    optionExplanations: [
      'Incorrect. Safe harbor is conditional upon due diligence; ignoring takedown orders forfeits immunity.',
      'Correct. An intermediary loses its Section 79 immunity if it fails to act on government removal directions.'
    ],
    whyIncorrect: 'Section 79 is not an absolute shield; it is conditional safe harbor contingent on strict adherence to due diligence and takedown compliance.',
    practicalTakeaway: 'Remember: Social media platforms lose their legal immunity if they refuse to remove illegal deepfakes when notified by authorities.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 79(3)(b)', title: 'Loss of Intermediary Safe Harbor', status: 'active' }],
    sourceMetadata: { actName: 'Information Technology Act', citation: 'Section 79 IT Act', year: 2000, status: 'Active' }
  },

  // =========================================================================
  // 5. INCIDENT RESPONSE & REPORTING (Target: 25)
  // =========================================================================
  {
    questionId: 'QZ-INCIDENT-001',
    format: 'single_choice',
    category: 'Incident response and reporting',
    subtopic: 'National Cybercrime Helpline',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 1',
    questionText: 'What is the official nationwide toll-free helpline number in India for immediate reporting of cyber financial fraud?',
    options: [
      '1930',
      '100',
      '1098',
      '1800-111-222'
    ],
    correctOptionIndex: 0,
    explanation: '1930 (formerly 155260) is the dedicated national toll-free helpline operationalized by the Ministry of Home Affairs (MHA) through the Indian Cyber Crime Coordination Centre (I4C) for financial cyber fraud reporting.',
    optionExplanations: [
      'Correct. 1930 is the official National Cyber Crime Reporting Portal helpline.',
      'Incorrect. 100/112 is general emergency police, but 1930 connects directly to the Citizen Financial Cyber Fraud Reporting System (CFCFRMS).',
      'Incorrect. 1098 is Childline India.',
      'Incorrect. 1800-111-222 is a generic non-existent toll-free sequence.'
    ],
    whyIncorrect: 'Dialing general emergency numbers instead of 1930 wastes critical initial minutes when funds are moving between beneficiary mule accounts.',
    practicalTakeaway: 'Remember: Save 1930 in your phone today. If money is stolen online, dialing 1930 within the first 2-3 hours gives the highest chance of freezing the funds.',
    legalReferences: [{ actName: 'Citizen Financial Cyber Fraud Reporting and Management System', sectionNumber: 'Helpline 1930', title: 'National Cybercrime Helpline', status: 'active' }],
    sourceMetadata: { actName: 'MHA I4C Directive', citation: 'I4C MHA 2021', year: 2021, status: 'Active' }
  },
  {
    questionId: 'QZ-INCIDENT-002',
    format: 'single_choice',
    category: 'Incident response and reporting',
    subtopic: 'The Golden Hour in Cyber Fraud',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'In Indian cyber fraud response, what does the term "The Golden Hour" refer to?',
    options: [
      'The initial 2 to 3 hours immediately following a fraudulent financial transaction when inter-bank holds are most feasible',
      'The hour right before the stock market opens in Mumbai',
      'A one-hour daily window when cybercrime police stations offer free legal advice',
      'The time it takes to recharge your smartphone battery'
    ],
    correctOptionIndex: 0,
    explanation: 'The "Golden Hour" refers to the first 2 to 3 hours after unauthorized money transfer. During this period, funds typically sit in primary or secondary mule bank accounts before being cashed out at ATMs or converted to crypto, making inter-bank holds through CFCFRMS feasible.',
    optionExplanations: [
      'Correct. The Golden Hour is the critical initial 2-3 hour window to alert 1930 and trigger inter-bank hold workflows.',
      'Incorrect. The stock market schedule has nothing to do with cyber fraud response.',
      'Incorrect. Cyber police stations operate 24/7; there is no single "free advice hour".',
      'Incorrect. Battery recharge time is irrelevant.'
    ],
    whyIncorrect: 'Waiting until the next day to report makes recovery almost impossible because syndicates layer and withdraw stolen funds within hours.',
    practicalTakeaway: 'Remember: Act within the Golden Hour. Call 1930 immediately with your transaction UTR, debit account, and timestamp. Speed is everything.',
    legalReferences: [{ actName: 'I4C Operational Framework', sectionNumber: 'CFCFRMS Protocols', title: 'Golden Hour Coordination', status: 'active' }],
    sourceMetadata: { actName: 'MHA I4C Guidelines', citation: 'I4C Standard Operating Procedure', year: 2022, status: 'Active' }
  },
  {
    questionId: 'QZ-INCIDENT-003',
    format: 'ordering',
    category: 'Incident response and reporting',
    subtopic: 'Step-by-step Cybercrime Reporting',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Order the critical actions you should take immediately upon discovering an unauthorized bank debit:',
    sequenceItems: [
      '1. Block your debit card/UPI access immediately using the bank\'s official mobile app',
      '2. Call National Helpline 1930 to trigger inter-bank lien/freeze alerts via CFCFRMS',
      '3. Collect transaction UTR numbers, account statements, and SMS/chat screenshots',
      '4. File a formal complaint on the official national portal at cybercrime.gov.in',
      '5. Submit an official written dispute to your bank branch within 3 days for RBI zero-liability protection'
    ],
    explanation: 'Immediate sequence: First block card/UPI access to stop ongoing theft; next dial 1930 to initiate inter-bank hold; gather UTR/SMS proof; file at cybercrime.gov.in; notify home bank in writing within 3 days.',
    optionExplanations: [],
    whyIncorrect: 'Filing police paperwork before freezing the card allows the criminal to drain remaining funds. Ordering actions by time-sensitivity saves money.',
    practicalTakeaway: 'Remember: Block card first -> Call 1930 -> File on cybercrime.gov.in -> Submit written bank dispute within 3 days.',
    legalReferences: [{ actName: 'RBI Customer Protection Circular', sectionNumber: 'DBR.No.Leg.BC.78/09.07.005/2017-18', title: 'Zero Liability of a Customer', status: 'active' }],
    sourceMetadata: { actName: 'RBI Notifications', citation: 'RBI/2017-18/15', year: 2017, status: 'Active' }
  },
  {
    questionId: 'QZ-INCIDENT-004',
    format: 'single_choice',
    category: 'Incident response and reporting',
    subtopic: 'CERT-In Incident Reporting',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 3',
    questionText: 'Under the CERT-In Directions issued on April 28, 2022 under Section 70B of the IT Act, within what timeframe must service providers, intermediaries, and body corporates report reportable cybersecurity incidents to CERT-In?',
    options: [
      'Within 6 hours of noticing the incident',
      'Within 72 hours of noticing the incident',
      'Within 30 calendar days',
      'Only at the end of the financial year'
    ],
    correctOptionIndex: 0,
    explanation: 'Under direction 5.1 of the CERT-In Directions, 2022 issued under Section 70B(6) of the IT Act, covered entities must report any of the 20 specified cybersecurity incidents (ransomware, data breaches, system intrusions) within 6 hours of noticing them.',
    optionExplanations: [
      'Correct. The CERT-In 2022 direction established a strict 6-hour reporting mandate for specified cybersecurity incidents.',
      'Incorrect. 72 hours is the standard under European GDPR, but Indian CERT-In directions mandate 6 hours.',
      'Incorrect. 30 days is the log retention compliance reference period, not incident reporting.',
      'Incorrect. Annual reporting does not meet mandatory incident response timelines.'
    ],
    whyIncorrect: 'Confusing GDPR\'s 72-hour window with CERT-In\'s strict 6-hour obligation is a common regulatory compliance mistake in India.',
    practicalTakeaway: 'Remember: In India, corporate data breaches and ransomware attacks must be reported to CERT-In within 6 hours under the 2022 Directions.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 70B', title: 'CERT-In 6-Hour Reporting Directions', status: 'active' }],
    sourceMetadata: { actName: 'CERT-In Directions', citation: 'No. 20(3)/2022-CERT-In', year: 2022, status: 'Active' }
  },
  {
    questionId: 'QZ-INCIDENT-005',
    format: 'true_false',
    category: 'Incident response and reporting',
    subtopic: 'Guaranteed Fund Recovery Fallacy',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'True or False: Calling 1930 guarantees that 100% of your stolen money will always be refunded to your bank account within 24 hours.',
    options: ['True', 'False'],
    correctOptionIndex: 1,
    explanation: 'False. Calling 1930 initiates the CFCFRMS workflow to request receiving banks to place a temporary lien/freeze on the fraudster\'s account. However, if the scammer has already withdrawn the money via ATM or transferred it through multiple mule accounts, a freeze may not be possible. Recovery also requires court/magistrate release orders under Section 503 of BNSS (erstwhile CrPC 457).',
    optionExplanations: [
      'Incorrect. No legal or banking mechanism can guarantee 100% recovery if funds were already withdrawn.',
      'Correct. 1930 maximizes freezing chances, but cannot guarantee recovery, especially if funds have exited the banking network.'
    ],
    whyIncorrect: 'Promising guaranteed refunds creates false expectations. Inter-bank holds depend on speed, available balances in mule accounts, and subsequent magistrate release orders.',
    practicalTakeaway: 'Remember: 1930 coordinates bank holds, but never guarantees recovery. Prevent fraud before it happens by protecting PINs and verifying links.',
    legalReferences: [{ actName: 'Bharatiya Nagarik Suraksha Sanhita', sectionNumber: 'Section 503', title: 'Magistrate order for disposal of property', status: 'active' }],
    sourceMetadata: { actName: 'BNSS 2023', citation: 'Act 46 of 2023', year: 2023, status: 'In force from 01.07.2024' }
  },

  // =========================================================================
  // 6. GENERAL CYBERSECURITY AWARENESS (Target: 25)
  // =========================================================================
  {
    questionId: 'QZ-GENAWARE-001',
    format: 'single_choice',
    category: 'General cybersecurity awareness',
    subtopic: 'Public Wi-Fi Security',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Why is conducting net-banking or entering debit card credentials while connected to an open, unencrypted public airport Wi-Fi network dangerous?',
    options: [
      'Attackers on the same network can conduct adversary-in-the-middle (AiTM) sniffing or deploy rogue clone access points to intercept unencrypted traffic',
      'Public Wi-Fi automatically deletes your bank balance',
      'The airport authority owns all money transferred over their Wi-Fi',
      'Smartphones lose their cellular signal permanently on public Wi-Fi'
    ],
    correctOptionIndex: 0,
    explanation: 'Open public Wi-Fi networks lack client isolation and encryption. Malicious actors on the same network can intercept unencrypted data packets, spoof DNS queries, or set up "Evil Twin" hotspots with identical SSID names to harvest credentials.',
    optionExplanations: [
      'Correct. Open networks allow packet sniffing, ARP poisoning, and rogue hotspot attacks.',
      'Incorrect. Wi-Fi has no direct mechanism to alter your bank ledger balances.',
      'Incorrect. The venue authority has no statutory ownership over transmitted funds.',
      'Incorrect. Wi-Fi connections do not permanently damage cellular connectivity.'
    ],
    whyIncorrect: 'Assuming all public Wi-Fi networks are secure exposes login sessions and cookies to eavesdropping and session hijacking.',
    practicalTakeaway: 'Remember: Never access banking or sensitive accounts on public open Wi-Fi. Use your cellular mobile data (4G/5G) or a trusted encrypted VPN.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 43', title: 'Unauthorized access and extraction', status: 'active' }],
    sourceMetadata: { actName: 'CERT-In Public Advisory', citation: 'CIAD-2021-0012', year: 2021, status: 'Active' }
  },
  {
    questionId: 'QZ-GENAWARE-002',
    format: 'single_choice',
    category: 'General cybersecurity awareness',
    subtopic: '3-2-1 Backup Rule',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'What is the universally recognized "3-2-1 Backup Strategy" for safeguarding vital digital files against ransomware and hardware loss?',
    options: [
      'Keep 3 copies of your data, on 2 different media types, with at least 1 copy kept offline or off-site',
      'Keep 3 passwords, changed every 2 months, with 1 capital letter',
      'Backup data 3 times a day for 2 weeks in 1 folder',
      'Store data on 3 computers in the same room'
    ],
    correctOptionIndex: 0,
    explanation: 'The 3-2-1 rule is the global standard in data resilience: maintain at least 3 total copies of important data; store on 2 different storage media (e.g. internal drive + external SSD); and store at least 1 copy off-site or offline (cloud or disconnected cold storage to survive ransomware).',
    optionExplanations: [
      'Correct. 3 copies, 2 media types, 1 offsite/offline copy guarantees recovery against ransomware and physical disasters.',
      'Incorrect. Password rotations have nothing to do with data backup.',
      'Incorrect. Backing up 3 times daily into the same folder offers zero protection against drive failure.',
      'Incorrect. Keeping computers in the same room risks loss from local fire, theft, or network-wide malware propagation.'
    ],
    whyIncorrect: 'Relying on a single external drive connected continuously to your computer leaves the backup vulnerable to being encrypted alongside primary files during a ransomware infection.',
    practicalTakeaway: 'Remember: Follow the 3-2-1 backup rule. Keep one backup drive completely disconnected from your computer when not backing up.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 43(c)', title: 'Introduction of computer contaminants/ransomware', status: 'active' }],
    sourceMetadata: { actName: 'NIST Special Publication', citation: 'NIST SP 800-209', year: 2020, status: 'Active' }
  },
  {
    questionId: 'QZ-GENAWARE-003',
    format: 'multiple_choice',
    category: 'General cybersecurity awareness',
    subtopic: 'Smartphone Security Hygiene',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Which of the following are essential smartphone security habits to protect against account takeover and physical theft? (Select all that apply)',
    options: [
      'Setting up a 4 to 6 digit SIM card PIN to prevent the SIM from working in another phone',
      'Disabling lock-screen notification previews for SMS and messaging apps',
      'Sideloading unverified APK files from random Telegram channels',
      'Enabling biometric or alphanumeric screen lock with short auto-lock timeout'
    ],
    correctOptionIndices: [0, 1, 3],
    explanation: 'A SIM PIN prevents thieves who steal your phone from moving your physical SIM card to another phone to receive your bank OTPs. Hiding lock-screen SMS previews stops strangers from reading OTPs without unlocking your device. Screen locks secure local access. Sideloading unverified APKs is dangerous.',
    optionExplanations: [
      'Correct. SIM PIN blocks OTP extraction if the physical card is stolen.',
      'Correct. Hiding lock screen previews stops OTP sniffing by bystanders.',
      'Incorrect. Sideloading unknown APKs is a leading vector for Android banking trojans.',
      'Correct. Robust screen locks prevent unauthorized physical access.'
    ],
    whyIncorrect: 'Installing third-party APKs from Telegram or WhatsApp groups bypasses Google Play Protect and often installs spyware with SMS-forwarding permissions.',
    practicalTakeaway: 'Remember: Enable a SIM PIN in your phone settings and turn off lock screen SMS notifications so thieves cannot read your OTPs.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66C', title: 'Identity theft', status: 'active' }],
    sourceMetadata: { actName: 'CERT-In Mobile Security Guidelines', citation: 'CERT-In 2022', year: 2022, status: 'Active' }
  },

  // =========================================================================
  // 7. INDIAN CYBER LAW & IT ACT (FORMAT EXPANSIONS)
  // =========================================================================
  {
    questionId: 'QZ-ITACT-041',
    format: 'legal_application',
    category: 'Indian Cyber Law and IT Act',
    subtopic: 'Section 66A Voidness',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'A police officer registers an FIR against a blogger under Section 66A of the Information Technology Act for posting sharp criticism of local municipal roads. Based on Supreme Court jurisprudence, what is the legal validity of this FIR?',
    options: [
      'The FIR under Section 66A is void and illegal because the Supreme Court struck down Section 66A in Shreya Singhal (2015) and reiterated in PUCL (2022) that no citizen can be prosecuted under it',
      'The FIR is completely valid because municipal criticism is a cybercrime',
      'The FIR is valid only if approved by the State Governor',
      'The FIR is valid if the blogger has more than 10,000 followers'
    ],
    correctOptionIndex: 0,
    explanation: 'In Shreya Singhal v. Union of India (2015), the Supreme Court struck down Section 66A of the IT Act in its entirety as unconstitutional for violating Article 19(1)(a). In 2022 (PUCL v. UOI), the Court explicitly directed that no citizen shall face prosecution or trial under Section 66A and directed states to withdraw all such cases.',
    optionExplanations: [
      'Correct. Section 66A is dead law and any FIR registered under it is void and illegal.',
      'Incorrect. Section 66A has zero legal force in India.',
      'Incorrect. Executive officials cannot resurrect an unconstitutional statutory provision.',
      'Incorrect. Follower count has no bearing on constitutional voidness.'
    ],
    whyIncorrect: 'Section 66A cannot be enforced under any circumstance. Its invocation by police reflects illegal zombie prosecution.',
    practicalTakeaway: 'Remember: Section 66A of the IT Act was struck down in 2015. No one can legally be booked or arrested under Section 66A for social media posts.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66A (Omitted)', title: 'Unconstitutional / Void Provision', status: 'repealed' }],
    sourceMetadata: { actName: 'Supreme Court of India', citation: 'Shreya Singhal v. UOI (2015) 5 SCC 1', year: 2015, status: 'Struck down' }
  },
  {
    questionId: 'QZ-ITACT-042',
    format: 'multiple_choice',
    category: 'Indian Cyber Law and IT Act',
    subtopic: 'Civil vs Criminal Remedies in IT Act',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 4',
    questionText: 'Which of the following provisions of the IT Act, 2000 are criminal offences adjudicated by criminal courts, as opposed to civil contraventions adjudicated by the Adjudicating Officer? (Select all that apply)',
    options: [
      'Section 66 (Computer related offences with dishonest/fraudulent intent)',
      'Section 66C (Identity theft and password theft)',
      'Section 66D (Cheating by personation using computer resource)',
      'Section 43 (Compensation for damage to computer system without fraudulent mens rea)'
    ],
    correctOptionIndices: [0, 1, 2],
    explanation: 'Sections 66, 66C, and 66D are criminal penal offences in Chapter XI of the IT Act punishable with imprisonment and fines, tried before criminal magistrate courts. Section 43 is a civil liability provision in Chapter IX for damages and compensation, adjudicated by the IT Adjudicating Officer (IT Secretary).',
    optionExplanations: [
      'Correct. Section 66 prescribes up to 3 years imprisonment for dishonest/fraudulent computer interference.',
      'Correct. Section 66C is a criminal offense punishing password theft and biometric misuse with up to 3 years prison.',
      'Correct. Section 66D is a criminal offense punishing online impersonation cheating with up to 3 years prison.',
      'Incorrect. Section 43 provides civil compensation for damages, not criminal imprisonment.'
    ],
    whyIncorrect: 'Confusing Section 43 (civil damages) with Section 66 (criminal penalty) leads to wrong jurisdictional filings in legal proceedings.',
    practicalTakeaway: 'Remember: Section 43 is for civil monetary compensation before the IT Adjudicating Officer; Sections 66, 66C, and 66D are criminal offences leading to police FIRs and imprisonment.',
    legalReferences: [
      { actName: 'Information Technology Act', sectionNumber: 'Section 43', title: 'Civil compensation for computer damage', status: 'active' },
      { actName: 'Information Technology Act', sectionNumber: 'Section 66', title: 'Computer related offences', status: 'active' }
    ],
    sourceMetadata: { actName: 'Information Technology Act', citation: 'Act 21 of 2000', year: 2000, status: 'Active' }
  },
  {
    questionId: 'QZ-ITACT-043',
    format: 'true_false',
    category: 'Indian Cyber Law and IT Act',
    subtopic: 'Section 43 Compensation Ceiling',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'True or False: Following the Information Technology (Amendment) Act, 2008, Section 43 of the IT Act removed the original Rs. 1 crore cap on compensation, allowing the Adjudicating Officer to award damages for actual substantiated injury without a statutory ceiling.',
    options: ['True', 'False'],
    correctOptionIndex: 0,
    explanation: 'True. In the original 2000 enactment, Section 43 contained a Rs. 1 crore ceiling. The 2008 Amendment deleted the words "not exceeding one crore rupees" and substituted "to pay damages by way of compensation to the person so affected", removing the fixed ceiling for Adjudicating Officer awards.',
    optionExplanations: [
      'Correct. The 2008 amendment eliminated the Rs. 1 crore ceiling in Section 43 for civil compensation.',
      'Incorrect. It is true; there is no longer a fixed Rs. 1 crore statutory ceiling in Section 43.'
    ],
    whyIncorrect: 'Relying on outdated textbook editions that mention a Rs. 1 crore ceiling overlooks the critical 2008 legislative amendment.',
    practicalTakeaway: 'Remember: Section 43 of the IT Act allows compensation based on actual verified damages without a fixed Rs. 1 crore cap.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 43', title: 'Damages by way of compensation', status: 'active' }],
    sourceMetadata: { actName: 'IT (Amendment) Act 2008', citation: 'Act 10 of 2009', year: 2008, status: 'Active' }
  },

  // =========================================================================
  // 8. UPI, BANKING & FINANCIAL FRAUD (FORMAT EXPANSIONS)
  // =========================================================================
  {
    questionId: 'QZ-UPI-036',
    format: 'scenario_decision',
    category: 'UPI, banking and financial fraud',
    subtopic: 'QR Code Collection Scam',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'You list an old bicycle on OLX for Rs. 4,000. A buyer messages saying: "I have sent you a payment QR code. Please scan this QR code and enter your UPI PIN to receive the Rs. 4,000 in your bank account." What will happen if you scan and enter your PIN?',
    options: [
      'Rs. 4,000 will be instantly deducted from your bank account and sent to the scammer',
      'Rs. 4,000 will be safely deposited into your bank account',
      'The money will be converted into reward points',
      'OLX will hold the money in escrow until you deliver the bicycle'
    ],
    correctOptionIndex: 0,
    explanation: 'The Golden Rule of UPI in India: Scanning a QR code or entering your UPI PIN ALWAYS transfers money OUT of your account. You NEVER need to enter your UPI PIN or scan a QR code to RECEIVE money.',
    optionExplanations: [
      'Correct. Entering your UPI PIN authorizes a DEBIT from your account. The Rs. 4,000 will be stolen.',
      'Incorrect. Entering your PIN never deposits money; it only authorizes money going out.',
      'Incorrect. No reward points are generated; it is a direct fraudulent money transfer.',
      'Incorrect. Genuine UPI transfers are peer-to-peer and do not involve OLX escrow codes.'
    ],
    whyIncorrect: 'Believing that scanning a QR code or entering a PIN can credit money into your account is the single most common cause of UPI marketplace fraud in India.',
    practicalTakeaway: 'Remember: PIN is for paying, not receiving. You NEVER enter your UPI PIN or scan a QR code to receive money.',
    legalReferences: [{ actName: 'NPCI UPI Safety Directives', sectionNumber: 'NPCI Safety Circular 2021', title: 'Golden Rule of UPI', status: 'active' }],
    sourceMetadata: { actName: 'NPCI Guidelines', citation: 'NPCI/UPI/2021', year: 2021, status: 'Active' }
  },
  {
    questionId: 'QZ-UPI-037',
    format: 'scenario_decision',
    category: 'UPI, banking and financial fraud',
    subtopic: 'Screen Sharing Remote Access Scam',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'A caller claiming to be from customer support asks you to download "AnyDesk" or "TeamViewer QuickSupport" onto your phone to fix an incomplete electricity bill payment. Why is downloading this app catastrophic?',
    options: [
      'It grants the scammer full real-time screen sharing and remote control of your phone, allowing them to see your banking screen and read OTPs as they arrive',
      'It will delete your contacts permanently',
      'It forces your phone to update to a beta operating system',
      'It sends your electricity bill to the municipal corporation'
    ],
    correctOptionIndex: 0,
    explanation: 'Remote access tools (AnyDesk, TeamViewer, RustDesk) allow external parties to view your screen in real time. Once you grant permissions, the scammer watches you open your banking app, captures your credentials, and reads incoming SMS OTPs directly from your screen notification bar.',
    optionExplanations: [
      'Correct. Remote desktop apps expose your screen and incoming OTPs, allowing fraudsters to drain your accounts.',
      'Incorrect. Contact deletion is not the objective; financial theft is.',
      'Incorrect. It does not update your OS.',
      'Incorrect. It is not an electricity bill utility; it is a remote screen-sharing tool.'
    ],
    whyIncorrect: 'Treating AnyDesk as an official utility app allows fraudsters complete remote control over your mobile banking environment.',
    practicalTakeaway: 'Remember: Never install AnyDesk, TeamViewer, or screen-sharing tools on instructions from an incoming caller. Genuine support executives never ask for screen sharing.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 43(a)', title: 'Securing unauthorized access', status: 'active' }],
    sourceMetadata: { actName: 'RBI Security Advisory', citation: 'RBI/2019-20/Advisory', year: 2019, status: 'Active' }
  },
  {
    questionId: 'QZ-UPI-038',
    format: 'single_choice',
    category: 'UPI, banking and financial fraud',
    subtopic: 'RBI Zero Liability Timeline',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Under the Reserve Bank of India (RBI) circular on Customer Protection, what is your liability if you report an unauthorized electronic banking transaction arising from third-party breach (where the deficiency lies neither with you nor the bank) within 3 working days?',
    options: [
      'Zero liability (the bank must credit the full amount to your account)',
      '100% liability (you bear the entire loss)',
      'Flat Rs. 10,000 penalty',
      'Your account is permanently closed'
    ],
    correctOptionIndex: 0,
    explanation: 'Under RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18, if an unauthorized transaction occurs due to third-party breach and the customer notifies the bank within 3 working days of receiving communication from the bank, the customer has ZERO liability. The bank must provide shadow credit within 10 working days.',
    optionExplanations: [
      'Correct. Reporting within 3 working days provides statutory Zero Liability protection under RBI rules.',
      'Incorrect. Full liability only occurs if the customer shared credentials or failed to report beyond 7 working days.',
      'Incorrect. No statutory flat penalty exists for timely reporting.',
      'Incorrect. The bank cannot shut your account for reporting an unauthorized debit.'
    ],
    whyIncorrect: 'Many bank branches initially attempt to reject liability. Knowing the RBI 3-day Zero Liability rule empowers you to demand formal shadow reversal.',
    practicalTakeaway: 'Remember: Check bank SMS alerts daily. If you see an unauthorized debit, notify your bank in writing within 3 working days for RBI Zero Liability.',
    legalReferences: [{ actName: 'RBI Customer Protection Circular', sectionNumber: 'Circular DBR.No.Leg.BC.78/2017-18', title: 'Zero Liability for Third-Party Breach', status: 'active' }],
    sourceMetadata: { actName: 'RBI Master Circular', citation: 'RBI/2017-18/15', year: 2017, status: 'Active' }
  },

  // =========================================================================
  // 9. IDENTITY THEFT & ACCOUNT SECURITY (FORMAT EXPANSIONS)
  // =========================================================================
  {
    questionId: 'QZ-IDSEC-026',
    format: 'single_choice',
    category: 'Identity theft and account security',
    subtopic: 'Aadhaar Biometric Lock',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'How can an Indian citizen prevent unauthorized AePS (Aadhaar-enabled Payment System) biometric cloning and spoofing fraud on their bank account?',
    options: [
      'Lock their biometrics using the official mAadhaar mobile app or UIDAI resident portal',
      'Laminate their physical Aadhaar card with plastic',
      'Write their Aadhaar number on their cheque book',
      'Share their Aadhaar OTP with the local ration shop'
    ],
    correctOptionIndex: 0,
    explanation: 'Scammers have exploited leaked registry fingerprints using silicon molds to execute fraudulent AePS cash withdrawals. The definitive preventative measure is locking your biometrics via UIDAI/mAadhaar app. When locked, biometric authentication fails instantly, protecting your funds until you unlock it temporarily for legitimate use.',
    optionExplanations: [
      'Correct. Locking biometrics via mAadhaar blocks all AePS biometric transactions until explicitly unlocked by you.',
      'Incorrect. Plastic lamination provides zero cryptographic or digital authentication defense.',
      'Incorrect. Writing numbers on cheque books makes your identity details more vulnerable.',
      'Incorrect. Never share Aadhaar OTPs with third parties.'
    ],
    whyIncorrect: 'Physical security of the paper Aadhaar does not prevent AePS fraud because biometric fingerprints can be harvested from public deed registries.',
    practicalTakeaway: 'Remember: Open the mAadhaar app or myaadhaar.uidai.gov.in and lock your biometrics today. Unlock it only for the 10 minutes when you need to authenticate.',
    legalReferences: [{ actName: 'Aadhaar (Targeted Delivery of Financial and Other Subsidies) Act', sectionNumber: 'Section 29', title: 'Restriction on sharing biometric information', status: 'active' }],
    sourceMetadata: { actName: 'UIDAI Security Advisory', citation: 'UIDAI Circular 2023', year: 2023, status: 'Active' }
  },
  {
    questionId: 'QZ-IDSEC-027',
    format: 'scenario_decision',
    category: 'Identity theft and account security',
    subtopic: 'SIM Swap Fraud Detection',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'Your mobile phone suddenly displays "No Service" or "Emergency Calls Only" in the middle of a business day, despite having an active postpaid plan. Simultaneously, your email notifies you of a password change attempt on your primary bank account. What has likely occurred?',
    options: [
      'A SIM Swap attack: a fraudster obtained a duplicate physical SIM card with your mobile number to intercept all SMS OTPs',
      'Your phone battery is low',
      'The telecom operator upgraded all phones to 6G satellite mode',
      'Your mobile phone case is blocking the signal'
    ],
    correctOptionIndex: 0,
    explanation: 'In a SIM Swap fraud, scammers use forged identity documents to convince a telecom store to issue a replacement SIM for your number. Once activated, your original SIM loses cellular signal ("No Service"), while the fraudster receives your phone calls and bank SMS OTPs.',
    optionExplanations: [
      'Correct. Sudden unexpected "No Service" coupled with banking alerts is the hallmark signature of SIM Swap fraud.',
      'Incorrect. Low battery does not cause network disconnection while the phone is running.',
      'Incorrect. 6G satellite upgrades do not disable subscriber SIM cards.',
      'Incorrect. A regular case does not suddenly sever cellular reception in normal areas.'
    ],
    whyIncorrect: 'Assuming sudden "No Service" is a routine temporary network glitch gives scammers hours of uninterrupted access to reset all your bank and email passwords.',
    practicalTakeaway: 'Remember: If your phone unexpectedly loses service in a normal area, check with your telecom provider immediately from another phone. Never ignore unexpected loss of signal.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66C', title: 'Identity theft', status: 'active' }],
    sourceMetadata: { actName: 'DoT Guidelines on SIM Issuance', citation: 'DoT Letter No. 800-09/2021', year: 2021, status: 'Active' }
  },
  {
    questionId: 'QZ-IDSEC-028',
    format: 'single_choice',
    category: 'Identity theft and account security',
    subtopic: 'Passkeys vs Traditional Passwords',
    difficulty: 'Advanced',
    cognitiveLevel: 'Level 3',
    questionText: 'Why are modern FIDO2 / WebAuthn "Passkeys" fundamentally immune to traditional credential phishing websites, unlike alphanumeric passwords and SMS OTPs?',
    options: [
      'Passkeys use public-key cryptography where the private key never leaves your device, and the browser cryptographically verifies the origin domain before signing the challenge',
      'Passkeys are written on paper by the police',
      'Passkeys only work during daylight hours',
      'Passkeys require you to type your mother\'s maiden name'
    ],
    correctOptionIndex: 0,
    explanation: 'Passkeys replace shared secrets with asymmetric cryptography. Your device creates a unique public/private key pair bound specifically to the authentic domain (e.g. google.com). If you visit a phishing clone (e.g. google-verify.xyz), your browser detects the domain mismatch and refuses to sign the authentication challenge.',
    optionExplanations: [
      'Correct. Origin binding ensures that a phishing website cannot intercept or replay a Passkey authentication signature.',
      'Incorrect. Passkeys are cryptographic digital keys stored in hardware secure enclaves, not paper.',
      'Incorrect. Passkeys function 24/7.',
      'Incorrect. Passkeys eliminate security questions and passwords completely.'
    ],
    whyIncorrect: 'Thinking passkeys are just long passwords misses the cryptographic breakthrough: passkeys are bound to the domain name, making phishing mathematically impossible.',
    practicalTakeaway: 'Remember: Enable Passkeys for your Google, Apple, and banking accounts wherever supported. They cannot be phished even if you click a fake link.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66C', title: 'Identity theft prevention', status: 'active' }],
    sourceMetadata: { actName: 'FIDO Alliance Specifications', citation: 'FIDO2 / W3C WebAuthn', year: 2022, status: 'Active' }
  },

  // =========================================================================
  // 10. PHISHING & SOCIAL ENGINEERING (FORMAT EXPANSIONS)
  // =========================================================================
  {
    questionId: 'QZ-PHISH-036',
    format: 'indicator_identification',
    category: 'Phishing and social engineering',
    subtopic: 'Electricity Disconnection SMS Phishing',
    difficulty: 'Beginner',
    cognitiveLevel: 'Level 2',
    questionText: 'Analyze the following viral fraud SMS received from an unknown personal mobile number. Identify the red flag indicators of a phishing attack:',
    textToInspect: 'Dear consumer your electricity power will be disconnected tonight at 9.30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210. Thank you.',
    indicators: [
      { id: 'ind-1', text: 'will be disconnected tonight at 9.30 PM', isSuspicious: true, explanation: 'Fabricated extreme urgency to induce immediate panic' },
      { id: 'ind-2', text: 'contact our electricity officer at 9876543210', isSuspicious: true, explanation: 'State discoms never provide random 10-digit mobile numbers for bill payments' },
      { id: 'ind-3', text: 'from electricity office', isSuspicious: true, explanation: 'Vague generic phrasing instead of naming the actual state power distribution company (e.g. BSES, TNEB, UPPCL)' },
      { id: 'ind-4', text: 'Thank you', isSuspicious: false, explanation: 'Standard generic closing text' }
    ],
    explanation: 'Electricity disconnection scams rely on three hallmarks: manufactured urgency ("power cut tonight"), generic authority ("electricity office" without utility name), and providing an unverified personal 10-digit phone number.',
    optionExplanations: [],
    whyIncorrect: 'Legitimate power discoms communicate through verified alphanumeric sender headers (e.g., AD-BSESDL) and direct consumers to official apps or bill counters.',
    practicalTakeaway: 'Remember: State electricity boards never send disconnection threats from personal 10-digit mobile numbers. Always check your bill status on your official utility app.',
    legalReferences: [{ actName: 'Information Technology Act', sectionNumber: 'Section 66D', title: 'Cheating by personation using computer resource', status: 'active' }],
    sourceMetadata: { actName: 'TRAI DLT Directives', citation: 'TRAI Commercial Communications Regulations', year: 2020, status: 'Active' }
  },
  {
    questionId: 'QZ-PHISH-037',
    format: 'scenario_decision',
    category: 'Phishing and social engineering',
    subtopic: 'Digital Arrest Scam Protocol',
    difficulty: 'Intermediate',
    cognitiveLevel: 'Level 3',
    questionText: 'A man in a police uniform on a WhatsApp video call claims to be a CBI officer. He shows a fake arrest warrant with your name, says a parcel with illegal narcotics was seized in Mumbai in your name, and orders you to stay on video in "Digital Arrest" while transferring your savings to a "RBI secret verification account". What is the definitive legal reality?',
    options: [
      'There is no concept of "Digital Arrest" in Indian law; police and investigative agencies (CBI, ED, Police) NEVER conduct arrests, interrogations, or demand money over Skype, WhatsApp, or video calls',
      'Digital Arrest is a real provision under Section 41 of CrPC for high-speed online investigations',
      'You must stay on video and transfer the money to prove your innocence to the CBI',
      'The Supreme Court conducts video trials for everyone who sends courier parcels'
    ],
    correctOptionIndex: 0,
    explanation: 'Indian law recognizes zero concept of "Digital Arrest". Neither the Bharatiya Nagarik Suraksha Sanhita (BNSS), the CrPC, the IT Act, nor the CBI/ED conduct arrests or custody via video call. Furthermore, no law enforcement agency or the RBI ever maintains "verification bank accounts" to hold citizen funds.',
    optionExplanations: [
      'Correct. Digital Arrest is a 100% fabricated extortion scheme. Agencies never interrogate or demand funds over video calls.',
      'Incorrect. Section 41 governs physical arrest procedures by police, not video call confinement.',
      'Incorrect. Never transfer funds; transferring money feeds the extortion syndicate.',
      'Incorrect. The Supreme Court does not hold courier parcel trials over WhatsApp video.'
    ],
    whyIncorrect: 'Believing that video calls can constitute legal custody allows extortion syndicates to hold victims hostage in their own homes for days.',
    practicalTakeaway: 'Remember: There is NO SUCH THING as "Digital Arrest" in Indian law. If someone on a video call claims to be police or CBI demanding money, disconnect and dial 1930 immediately.',
    legalReferences: [
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 319', title: 'Impersonation of Public Servant', status: 'active' },
      { actName: 'Bharatiya Nyaya Sanhita', sectionNumber: 'Section 308', title: 'Extortion', status: 'active' }
    ],
    sourceMetadata: { actName: 'MHA Advisory on Digital Arrest Scams', citation: 'MHA Cyber Dost Advisory 2024', year: 2024, status: 'Active' }
  }
];

module.exports = expandedQuestions;

