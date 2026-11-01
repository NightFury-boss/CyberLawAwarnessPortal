import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';

function Laws() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation, Filter & Scrollspy States
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeFamilyId, setActiveFamilyId] = useState('it-act');
  const [activeStatus, setActiveStatus] = useState('All'); // 'All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null); // 'Chapter IX', 'Chapter XI'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // Law Compass Guided Flow States
  const [compassStep, setCompassStep] = useState(1);
  const [selectedSituation, setSelectedSituation] = useState(null);

  // LocalStorage Bookmarks & Notes
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState({}); // { sectionNumber: 'note text' }
  const [editingNoteSection, setEditingNoteSection] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  // Toggles for plain language vs official text
  const [textViews, setTextViews] = useState({}); // { sectionNumber: 'plain' | 'official' }

  // Knowledge Check States
  const [quizAnswers, setQuizAnswers] = useState({}); // { sectionNumber: optionIndex }
  const [submittedQuizzes, setSubmittedQuizzes] = useState({}); // { sectionNumber: true }

  const isScrollingToTarget = useRef(false);
  const scrollTimeout = useRef(null);

  // Law Families Static Mapping
  const lawFamilies = [
    {
      id: 'it-act',
      name: 'Information Technology Act, 2000',
      displayName: 'Information Technology Act, 2000',
      filter: (l) => l.actName === 'Information Technology Act, 2000' && l.role !== 'Judicial Interpretation' && l.role !== 'Government Rule / Notification'
    },
    {
      id: 'dpdp-act',
      name: 'Digital Personal Data Protection Act, 2023',
      displayName: 'Digital Personal Data Protection Act, 2023',
      filter: (l) => l.actName === 'Digital Personal Data Protection Act, 2023'
    },
    {
      id: 'bns',
      name: 'Bharatiya Nyaya Sanhita, 2023',
      displayName: 'Bharatiya Nyaya Sanhita, 2023',
      filter: (l) => l.actName === 'Bharatiya Nyaya Sanhita, 2023'
    },
    {
      id: 'bsa',
      name: 'Bharatiya Sakshya Adhiniyam, 2023',
      displayName: 'Digital Evidence (BSA, 2023)',
      filter: (l) => l.actName === 'Bharatiya Sakshya Adhiniyam, 2023'
    },
    {
      id: 'judgments',
      name: 'Important Judgments',
      displayName: 'Important Judgments',
      filter: (l) => l.role === 'Judicial Interpretation'
    },
    {
      id: 'rules',
      name: 'Rules & Regulations',
      displayName: 'Rules & Regulations',
      filter: (l) => l.role === 'Government Rule / Notification'
    }
  ];

  // Law Compass Scenarios Mapping
  const compassSituations = [
    {
      id: 'impersonation',
      title: 'Scammer impersonated someone online / created a fake profile',
      type: 'Identity Theft & Fraud',
      provisions: ['Section 66C', 'Section 66D', 'BNS Section 319'],
      crime: 'Identity Theft',
      crimeSlug: 'identity-theft',
      caseStudy: 'digital-arrest-impersonation',
      advice: 'Combine IT Act Section 66D for computer-based personation and Section 66C for password/ID theft. Police can also apply BNS Section 319.'
    },
    {
      id: 'upi_scam',
      title: 'Tricked into making a fraudulent UPI transaction',
      type: 'Financial Cyber Fraud',
      provisions: ['Section 66D', 'BNS Section 318'],
      crime: 'UPI / Payment Scams',
      crimeSlug: 'upi-payment-fraud',
      caseStudy: 'classified-marketplace-qr-fraud',
      advice: 'Online cheating is prosecuted under IT Act Section 66D. BNS Section 318 (replacing IPC 420) addresses the dishonest inducement of funds.'
    },
    {
      id: 'data_leak',
      title: 'Company leaked my personal data / credit cards due to poor security',
      type: 'Privacy Breach',
      provisions: ['Section 43A', 'DPDP Section 6'],
      crime: 'Data Breach Liabilities',
      crimeSlug: 'data-breach',
      caseStudy: 'classified-marketplace-qr-fraud',
      advice: 'Section 43A provides civil compensation. The upcoming DPDP Act Section 6 mandates strict consent requirements and sets massive administrative penalties.'
    },
    {
      id: 'privacy_harassment',
      title: 'Intimate photos or private pictures shared online without consent',
      type: 'Online Harassment',
      provisions: ['Section 66E', 'Section 67'],
      crime: 'Cyber Stalking',
      crimeSlug: 'cyber-stalking',
      caseStudy: '',
      advice: 'Section 66E directly punishes violating physical privacy. Obscene media dissemination is prosecuted under Section 67.'
    },
    {
      id: 'erasure_request',
      title: 'Want a portal to completely delete my registered personal data',
      type: 'Data Protection Rights',
      provisions: ['DPDP Section 11'],
      crime: 'Privacy & Data Rights',
      crimeSlug: 'data-breach',
      caseStudy: '',
      advice: 'DPDP Section 11 grants you the Right to Erasure, Rectification, and summary access of your personal data held by data fiduciaries.'
    },
    {
      id: 'deepfake_takedown',
      title: 'Social platform refuses to remove a fake profile or deepfake of me',
      type: 'Platform Intermediary Duties',
      provisions: ['IT Intermediary Rules'],
      crime: 'Identity Spoofing',
      crimeSlug: 'identity-theft',
      caseStudy: '',
      advice: 'Under the IT Intermediary Rules, digital platforms lose safe harbor immunity if they fail to take down impersonation content within 24-36 hours.'
    },
    {
      id: 'digital_arrest',
      title: 'Fraudster on video call claiming to be Police/CBI/ED threatening "digital arrest"',
      type: 'Government Impersonation & Extortion',
      provisions: ['Section 66D', 'BNS Section 318', 'BNS Section 319'],
      crime: 'Digital Arrest Scams',
      crimeSlug: 'digital-arrest-scam',
      caseStudy: 'digital-arrest-impersonation',
      advice: 'No Indian law enforcement agency or court conducts "digital arrests" via Skype/WhatsApp. Cut the call, preserve call records, and dial 1930 immediately.'
    },
    {
      id: 'predatory_loan',
      title: 'Instant loan app accessing contacts and sending morphed images to relatives',
      type: 'Extortion & Harassment',
      provisions: ['Section 66E', 'BNS Section 351', 'BNS Section 78', 'Section 43'],
      crime: 'Loan App Extortion',
      crimeSlug: 'loan-app-extortion',
      caseStudy: 'instant-loan-app-harassment',
      advice: 'Lenders cannot harass contacts or threaten bodily privacy. File an emergency report on cybercrime.gov.in and check the lender against the RBI Sachet whitelist.'
    },
    {
      id: 'voice_clone_fraud',
      title: 'Received panicked call from family member claiming accident/arrest with cloned voice',
      type: 'AI Impersonation Fraud',
      provisions: ['Section 66D', 'BNS Section 319'],
      crime: 'Deepfake & AI Impersonation',
      crimeSlug: 'deepfake-ai-impersonation',
      caseStudy: 'ai-voice-cloning-family-emergency',
      advice: 'Never transfer emergency funds without secondary verification. Call the family member back directly on cellular network or verify through hostel/workplace contacts.'
    },
    {
      id: 'electronic_evidence',
      title: 'Need to submit WhatsApp chats, emails, or call recordings as legal court evidence',
      type: 'Digital Evidence Admissibility',
      provisions: ['BSA Section 63'],
      crime: 'Digital Evidence & Forensics',
      crimeSlug: 'phishing',
      caseStudy: 'classified-marketplace-qr-fraud',
      advice: 'Under BSA Section 63 (replacing Section 65B of Evidence Act), electronic records require an accompanying certificate signed by the device custodian to be legally admissible in court.'
    },
    {
      id: 'cyberstalking_harassment',
      title: 'Obsessive online tracking, repeated unwanted messages, or location stalking',
      type: 'Cyberstalking & Personal Safety',
      provisions: ['BNS Section 78', 'Section 66E'],
      crime: 'Cyberstalking & Doxxing',
      crimeSlug: 'cyberstalking-doxxing',
      caseStudy: '',
      advice: 'BNS Section 78 explicitly criminalizes electronic monitoring of women. Document all timestamps and handles without replying; file on cybercrime.gov.in.'
    }
  ];

  // IT Act Chapters Map
  const itActChapters = [
    {
      id: 'Chapter IX',
      title: 'Chapter IX: Penalties, Compensation and Adjudication',
      desc: 'Governs civil liabilities, failures to secure data, and details structures.',
      sections: ['Section 43A']
    },
    {
      id: 'Chapter XI',
      title: 'Chapter XI: Cyber Offences',
      desc: 'Defines criminal offences, arrest powers, and jail sentences.',
      sections: ['Section 66C', 'Section 66D', 'Section 66E', 'Section 67', 'Section 66A']
    }
  ];

  useEffect(() => {
    fetchLaws();
    // Load Bookmarks and Notes
    const savedBookmarks = JSON.parse(localStorage.getItem('law_bookmarks') || '[]');
    const savedNotes = JSON.parse(localStorage.getItem('law_notes') || '{}');
    setBookmarks(savedBookmarks);
    setNotes(savedNotes);

    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Hash Navigation Handler
  useEffect(() => {
    if (laws.length > 0 && window.location.hash) {
      const targetId = decodeURIComponent(window.location.hash.substring(1));
      const normalizedId = targetId.replace(/\s+/g, '-');
      setTimeout(() => {
        const element = document.getElementById(`section-card-${normalizedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [laws]);

  const fetchLaws = async () => {
    setLoading(true);
    try {
      const data = await api.getLaws();
      setLaws(data);
    } catch (err) {
      setError('Failed to fetch cyber law database records.');
    } finally {
      setLoading(false);
    }
  };

  // Scrollspy Observer Setup
  useEffect(() => {
    if (loading || laws.length === 0 || isMobile) return;

    const observerOptions = {
      root: null, // Viewport
      rootMargin: '-120px 0px -60% 0px', // Active triggers near top header clearance
      threshold: 0
    };

    const observerCallback = (entries) => {
      if (isScrollingToTarget.current) return;
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) {
        const sectionNum = visible.target.getAttribute('data-section-num');
        const familyId = visible.target.getAttribute('data-family-id');
        if (sectionNum) setActiveSectionId(sectionNum);
        if (familyId) setActiveFamilyId(familyId);
      }
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    laws.forEach(sec => {
      const el = document.getElementById(`section-card-${sec.sectionNumber.replace(/\s+/g, '-')}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [laws, loading, isMobile]);

  // Sidebar Auto-Scroll Adjustment
  useEffect(() => {
    if (activeSectionId && !isMobile) {
      const activeNavEl = document.getElementById(`nav-item-${activeSectionId.replace(/\s+/g, '-')}`);
      if (activeNavEl) {
        activeNavEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeSectionId, isMobile]);

  const scrollToElement = (elementId, sectionNum, familyId) => {
    const el = document.getElementById(elementId);
    if (el) {
      isScrollingToTarget.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

      if (sectionNum) setActiveSectionId(sectionNum);
      if (familyId) setActiveFamilyId(familyId);

      // Smooth scroll target
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });

      scrollTimeout.current = setTimeout(() => {
        isScrollingToTarget.current = false;
      }, 900);
    }
  };

  // Bookmark Toggle
  const toggleBookmark = (secNumber) => {
    let nextBookmarks;
    if (bookmarks.includes(secNumber)) {
      nextBookmarks = bookmarks.filter(b => b !== secNumber);
    } else {
      nextBookmarks = [...bookmarks, secNumber];
    }
    setBookmarks(nextBookmarks);
    localStorage.setItem('law_bookmarks', JSON.stringify(nextBookmarks));
  };

  // Study Note Save
  const handleSaveNote = (secNumber) => {
    const nextNotes = { ...notes, [secNumber]: noteInput };
    setNotes(nextNotes);
    localStorage.setItem('law_notes', JSON.stringify(nextNotes));
    setEditingNoteSection(null);
    setNoteInput('');
  };

  const handleStartEditingNote = (secNumber) => {
    setEditingNoteSection(secNumber);
    setNoteInput(notes[secNumber] || '');
  };

  const handleDeleteNote = (secNumber) => {
    const nextNotes = { ...notes };
    delete nextNotes[secNumber];
    setNotes(nextNotes);
    localStorage.setItem('law_notes', JSON.stringify(nextNotes));
  };

  // Statutory concept check questions mapped to provisions for inline check
  const getKnowledgeCheck = (secNumber) => {
    switch (secNumber) {
      case 'Section 43A':
        return {
          statusBadge: 'CURRENT STATUTE (SLATED FOR OMISSION UNDER DPDP ACT S. 44(2))',
          statusType: 'current',
          question: 'Under Section 43A of the IT Act, when is a body corporate held liable to pay compensation for personal data leaks?',
          options: [
            'Only when corporate leadership intentionally distributes proprietary user records to foreign buyers.',
            'When it is negligent in implementing and maintaining reasonable security practices, causing wrongful loss or wrongful gain.',
            'Whenever an enterprise cloud hosting infrastructure experiences temporary unplanned downtime.'
          ],
          correctIdx: 1,
          explanation: 'Section 43A of the IT Act mandates that bodies corporate possessing or handling Sensitive Personal Data or Information (SPDI) must maintain reasonable security practices. Negligence resulting in wrongful loss or gain triggers civil compensation damages, adjudicated by the State Adjudicating Officer under Section 46 of the IT Act. (Statutory Accuracy Note: Under Section 44(2) of the Digital Personal Data Protection Act, 2023, Section 43A is slated for omission once that provision is notified in the Official Gazette pursuant to DPDP Act Section 1(2). As of the current date, that commencement notification has not been gazetted, so Section 43A and the SPDI Rules 2011 remain active operative law. Educational guidance; not formal legal counsel).'
        };
      case 'Section 66C':
        return {
          statusBadge: 'CURRENT STATUTE (CRIMINAL OFFENCE)',
          statusType: 'current',
          question: 'Under Section 66C of the IT Act, which of the following is considered a criminal identity theft offence?',
          options: [
            'Sharing political opinions or news links on public discussion forums.',
            'Dishonestly or fraudulently using another person\'s electronic signature, password, UPI PIN, or unique biometric identifier.',
            'Voluntarily sharing public check-in location markers on social media profiles.'
          ],
          correctIdx: 1,
          explanation: 'Section 66C strictly criminalizes the fraudulent or dishonest use of another person\'s electronic signature, password, or any other unique identification feature. The offence is punishable with imprisonment of either description for up to 3 years and a fine of up to ₹1,00,000.'
        };
      case 'Section 66D':
        return {
          statusBadge: 'CURRENT STATUTE (CRIMINAL OFFENCE)',
          statusType: 'current',
          question: 'If a scammer sets up a mock website pretending to be an official bank or creates a fake customer support account to cheat a victim of funds, which section applies?',
          options: [
            'Section 66A',
            'Section 66D (Cheating by Personation using Computer Resource)',
            'Section 43A (Corporate Compensation)'
          ],
          correctIdx: 1,
          explanation: 'Section 66D criminalizes cheating by personation by means of any communication device or computer resource, punishable with imprisonment for up to 3 years and a fine of up to ₹1,00,000. In cyber fraud investigations, police routinely charge Section 66D alongside general penal cheating provisions (BNS Section 318/319).'
        };
      case 'Section 66E':
        return {
          statusBadge: 'CURRENT STATUTE (CRIMINAL OFFENCE)',
          statusType: 'current',
          question: 'What conduct is explicitly criminalized under Section 66E of the IT Act?',
          options: [
            'Intentionally capturing, publishing, or transmitting images of private areas of any person without consent.',
            'Recording internal customer service training calls without audible beep tones.',
            'Screen-recording a public video webinar without the host\'s prior written approval.'
          ],
          correctIdx: 0,
          explanation: 'Section 66E criminalizes intentionally or knowingly capturing, publishing, or transmitting the image of a private area of any person without consent under circumstances violating privacy. The offence carries imprisonment of up to 3 years, or a fine up to ₹2,00,000, or both.'
        };
      case 'Section 67':
        return {
          statusBadge: 'CURRENT STATUTE (CRIMINAL OFFENCE)',
          statusType: 'current',
          question: 'What is the scope of Section 67 of the Information Technology Act?',
          options: [
            'Regulating software licensing agreements and open-source copyright exemptions.',
            'Punishing the electronic publication or transmission of obscene material.',
            'Governing inter-state taxation on e-commerce logistics providers.'
          ],
          correctIdx: 1,
          explanation: 'Section 67 punishes the publication or transmission in electronic form of material that is lascivious or appeals to the prurient interest (first conviction: imprisonment up to 3 years and fine up to ₹5,00,000; subsequent convictions: up to 5 years and fine up to ₹10,00,000). Note that Sections 67A and 67B provide specialized, more severe penalties for sexually explicit acts and child abuse materials.'
        };
      case 'Section 66A':
        return {
          statusBadge: 'STRUCK DOWN / UNCONSTITUTIONAL (VOID)',
          statusType: 'omitted',
          question: 'What is the current legal status of Section 66A of the IT Act?',
          options: [
            'It is fully active and allows local authorities to arrest users for annoying online messages.',
            'It was struck down as unconstitutional by the Supreme Court in Shreya Singhal (2015) and cannot be legally invoked.',
            'It was expanded by the DPDP Act 2023 to apply to international data transmissions.'
          ],
          correctIdx: 1,
          explanation: 'In Shreya Singhal v. Union of India (2015) 5 SCC 1, the Supreme Court of India struck down Section 66A in its entirety as unconstitutional for violating the fundamental right to freedom of speech and expression under Article 19(1)(a). It is completely invalid and has no legal force. The Supreme Court has repeatedly ordered that no police officer or court may register complaints or prosecute citizens under this omitted provision.'
        };
      case 'DPDP Section 6':
        return {
          statusBadge: 'ENACTED (COMMENCEMENT PENDING NOTIFICATION)',
          statusType: 'pending',
          question: 'Under Section 6 of the Digital Personal Data Protection Act 2023, what standard is required for consent to be valid?',
          options: [
            'A pre-ticked checkbox hidden inside standard terms of service documents.',
            'A free, specific, informed, unconditional, and unambiguous affirmative action.',
            'A general website footer notice stating that user analytics cookies are collected.'
          ],
          correctIdx: 1,
          explanation: 'DPDP Act Section 6 mandates that consent given by a Data Principal must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action, limited to necessary processing. Pre-ticked checkboxes and bundled consents do not meet this standard. (Statutory Status: The DPDP Act received Presidential assent in August 2023; operational commencement of substantive sections is pending notification of DPDP Rules and establishment of the Data Protection Board of India).'
        };
      case 'DPDP Section 11':
        return {
          statusBadge: 'ENACTED (COMMENCEMENT PENDING NOTIFICATION)',
          statusType: 'pending',
          question: 'Which statutory right does Section 11 of the DPDP Act 2023 guarantee to individuals (Data Principals)?',
          options: [
            'The right to receive free broadband internet from public utilities.',
            'The right to obtain a summary of processed personal data and request correction, completion, or erasure.',
            'The right to trade anonymized medical data on public exchanges.'
          ],
          correctIdx: 1,
          explanation: 'DPDP Act Section 11 guarantees Data Principals the right to obtain a summary of their personal data processed by a Data Fiduciary, the identities of all processors, and the right to correction, completion, updating, and erasure of personal data that is no longer necessary for the specified purpose. (Statutory Status: Enacted statute; operational enforcement pending notification).'
        };
      case 'BNS Section 318':
        return {
          statusBadge: 'CURRENT STATUTE (REPLACES IPC 420 AS OF 1 JULY 2024)',
          statusType: 'current',
          question: 'Which erstwhile provision of the Indian Penal Code (IPC) is replaced by Section 318 of the Bharatiya Nyaya Sanhita (BNS)?',
          options: [
            'IPC Section 302 (Punishment for murder)',
            'IPC Section 420 (Cheating and dishonestly inducing delivery of property)',
            'IPC Section 124A (Sedition)'
          ],
          correctIdx: 1,
          explanation: 'BNS Section 318 replaced IPC Section 420 effective 1 July 2024. It is the core general penal provision punishing cheating and dishonestly inducing delivery of property, carrying imprisonment of up to 7 years and fine. It is routinely invoked in financial cyber fraud cases.'
        };
      case 'BNS Section 319':
        return {
          statusBadge: 'CURRENT STATUTE (REPLACES IPC 419 AS OF 1 JULY 2024)',
          statusType: 'current',
          question: 'How does BNS Section 319 (Cheating by personation) apply in cyber fraud cases?',
          options: [
            'It penalizes attackers who cheat by pretending to be someone else or substituting identities, replacing IPC Section 419.',
            'It applies exclusively to intellectual property copyright disputes between corporations.',
            'It regulates broadband spectrum allocation among telecommunications carriers.'
          ],
          correctIdx: 0,
          explanation: 'BNS Section 319 replaced IPC Section 419 on 1 July 2024, punishing cheating by personation with imprisonment for up to 3 years, or fine, or both. It operates alongside IT Act Section 66D for online identity impersonation.'
        };
      case 'IT Intermediary Rules':
        return {
          statusBadge: 'SUBORDINATE LEGISLATION (IN FORCE)',
          statusType: 'current',
          question: 'Under the Information Technology Intermediary Rules, what is the consequence if an online platform fails to observe mandatory due diligence?',
          options: [
            'The platform immediately loses its registered domain names.',
            'The platform loses its statutory safe harbour immunity under Section 79 of the IT Act.',
            'The platform\'s executives receive an automatic fine from the Ministry of Finance.'
          ],
          correctIdx: 1,
          explanation: 'Under Section 79 of the IT Act, an intermediary enjoys safe harbour immunity from liability for third-party user content conditional upon observing due diligence under the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended). Failing to observe due diligence or failing to act expeditiously upon lawful takedown notices forfeits this safe harbour under Section 79(2)/(3).'
        };
      default:
        return null;
    }
  };

  const handleQuizAnswerSelect = (secNumber, optIdx) => {
    setQuizAnswers({ ...quizAnswers, [secNumber]: optIdx });
  };

  const handleQuizSubmit = (secNumber) => {
    setSubmittedQuizzes({ ...submittedQuizzes, [secNumber]: true });
  };

  const handleQuizReset = (secNumber) => {
    const nextAnswers = { ...quizAnswers };
    delete nextAnswers[secNumber];
    setQuizAnswers(nextAnswers);
    const nextSubmitted = { ...submittedQuizzes };
    delete nextSubmitted[secNumber];
    setSubmittedQuizzes(nextSubmitted);
  };

  // Client Filter Logic (Filters the provisions pool dynamically)
  const lawsSearchConfig = {
    sectionNumber: 50,
    officialTitle: 30,
    actName: 20,
    keywords: 10,
    plainLanguageExplanation: 5,
    whyItMatters: 2,
    role: 2
  };

    const filteredLaws = searchItems(
    laws,
    searchQuery,
    lawsSearchConfig,
    (l) => {
      const matchesStatus = activeStatus === 'All' || l.legalStatus === activeStatus;
      const matchesChapter = !selectedChapter || 
        (selectedChapter === 'Chapter IX' && itActChapters[0].sections.includes(l.sectionNumber)) ||
        (selectedChapter === 'Chapter XI' && itActChapters[1].sections.includes(l.sectionNumber));
      return matchesStatus && matchesChapter;
    }
  );

  const getSectionsByFamily = (family) => {
    return filteredLaws.filter(family.filter);
  };

  // Helper to render provision details using clean hierarchy and soft dividers (No double borders!)
  const renderSectionCard = (section, familyId) => {
    const isOmitted = section.legalStatus === 'OMITTED' || section.legalStatus === 'omitted';
    const isNotYetInForce = section.legalStatus === 'NOT_YET_IN_FORCE';
    const textToggleView = textViews[section.sectionNumber] || 'plain';
    const hasBookmark = bookmarks.includes(section.sectionNumber);
    const noteText = notes[section.sectionNumber] || '';
    const inlineQuiz = getKnowledgeCheck(section.sectionNumber);
    
    let accentColor = 'var(--color-primary)';
    if (isOmitted) accentColor = 'var(--color-error)';
    else if (isNotYetInForce) accentColor = '#f59e0b';
    else if (section.role === 'Data Protection') accentColor = 'var(--color-success, #536F61)';

    const cardId = section.sectionNumber.replace(/\s+/g, '-');

    return (
      <div
        key={section._id}
        id={`section-card-${cardId}`}
        data-section-num={section.sectionNumber}
        data-family-id={familyId}
        style={{
          backgroundColor: 'transparent',
          padding: '24px 0 32px 0',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '32px'
        }}
      >
        {/* Title metadata bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {section.actName} • {section.role}
            </span>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', fontWeight: '700', marginTop: '6px', lineHeight: '1.2' }}>
              {section.sectionNumber}: {section.officialTitle}
            </h3>
            <div style={{ width: '40px', height: '3px', backgroundColor: accentColor, borderRadius: '1.5px', marginBottom: '16px' }} />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => toggleBookmark(section.sectionNumber)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.4rem',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: '1',
                outline: 'none',
                transition: 'transform 0.15s ease'
              }}
              title={hasBookmark ? 'Remove Bookmark' : 'Bookmark Section'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={hasBookmark ? "var(--color-primary)" : "none"} stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '3px',
              backgroundColor: isOmitted ? 'rgba(239, 68, 68, 0.08)' : (isNotYetInForce ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)'),
              color: isOmitted ? 'var(--color-error)' : (isNotYetInForce ? '#d35400' : 'var(--text-primary)'),
              border: isOmitted ? '1px solid var(--color-error)' : (isNotYetInForce ? '1px solid #f59e0b' : '1px solid var(--color-border)')
            }}>
              {section.legalStatus}
            </span>
          </div>
        </div>

        {/* Status Notice bars */}
        {isOmitted && (
          <div style={{
            backgroundColor: 'var(--color-error-light)',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: '#7b1c12',
            lineHeight: '1.5'
          }}>
            <strong>OMITTED & INOPERATIVE:</strong> Struck down by the Supreme Court of India in the <em>Shreya Singhal (2015)</em> ruling. Arrests under this provision are illegal.
          </div>
        )}

        {isNotYetInForce && (
          <div style={{
            backgroundColor: 'var(--color-warning-light)',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: '#8c3b00',
            lineHeight: '1.5'
          }}>
            <strong>NOT YET IN FORCE:</strong>
            <div style={{ marginTop: '4px' }}>{section.commencementStatus || 'Pending official commencement notifications.'}</div>
          </div>
        )}

        {/* View Toggle (Plain English vs Legal text) */}
        {section.officialText && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            <button
              onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'plain' })}
              style={{
                backgroundColor: textToggleView === 'plain' ? 'var(--color-primary)' : 'transparent',
                color: textToggleView === 'plain' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Plain English
            </button>
            <button
              onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'official' })}
              style={{
                backgroundColor: textToggleView === 'official' ? 'var(--color-primary)' : 'transparent',
                color: textToggleView === 'official' ? 'white' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Legal Text
            </button>
          </div>
        )}

        {/* Main Body */}
        <div style={{ marginBottom: '28px' }}>
          {textToggleView === 'plain' ? (
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: '400', margin: 0 }}>
              {section.plainLanguageExplanation}
            </p>
          ) : (
            <pre style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              backgroundColor: 'var(--bg-secondary)',
              padding: '16px',
              borderRadius: '4px',
              border: 'none',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {section.officialText}
            </pre>
          )}
        </div>

        {/* Dynamic Details block - Typography & Whitespace over boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '32px',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '20px',
          fontSize: '0.9rem',
          marginBottom: '24px'
        }}>
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
              Why It Matters to You
            </h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              {section.whyItMatters}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
              Everyday Real-Life Situation
            </h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', fontStyle: 'italic' }}>
              "{section.exampleScenario}"
            </p>
          </div>
        </div>

        {/* Provision Map line (Simplified - No double border/nesting) */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>HOW THIS CONNECTS:</span>
          <span style={{ color: 'var(--text-primary)' }}>{section.sectionNumber}</span>
          <span>&rarr;</span>
          {section.relatedCyberCrimes && section.relatedCyberCrimes.length > 0 ? (
            <Link to={getContextPath('/crimes')} style={{ color: 'var(--color-accent)', fontWeight: 'bold', textDecoration: 'underline' }}>
              Crime: {section.relatedCyberCrimes[0]}
            </Link>
          ) : (
            <span>General Security</span>
          )}
          <span>&rarr;</span>
          {section.relatedCaseStudies && section.relatedCaseStudies.length > 0 ? (
            <Link to={getContextPath('/cases')} style={{ color: 'var(--color-accent)', fontWeight: 'bold', textDecoration: 'underline' }}>
              Case File: {section.relatedCaseStudies[0].replace(/-/g, ' ')}
            </Link>
          ) : (
            <span>Case Study</span>
          )}
        </div>

        {/* Inline Quiz widget - (Simplified soft-bg container, no dashed border) */}
        {inlineQuiz && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid var(--color-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Quick Law Check
                </span>
                {inlineQuiz.statusBadge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '3px',
                    backgroundColor: inlineQuiz.statusType === 'omitted' ? 'var(--color-error-light)' : inlineQuiz.statusType === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-white)',
                    color: inlineQuiz.statusType === 'omitted' ? 'var(--color-error)' : inlineQuiz.statusType === 'pending' ? '#b45309' : 'var(--color-primary)',
                    border: '1px solid var(--color-border)'
                  }}>
                    {inlineQuiz.statusBadge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Educational Practice • Not Legal Advice
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              {inlineQuiz.question}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {inlineQuiz.options.map((opt, oIdx) => {
                const isSelected = quizAnswers[section.sectionNumber] === oIdx;
                const isSubmitted = submittedQuizzes[section.sectionNumber];
                const isCorrect = oIdx === inlineQuiz.correctIdx;
                
                let optBg = 'var(--bg-white)';
                let optBorder = '1px solid var(--color-border)';
                if (isSubmitted) {
                  if (isCorrect) {
                    optBg = 'rgba(39, 174, 96, 0.1)';
                    optBorder = '1px solid var(--color-success)';
                  } else if (isSelected) {
                    optBg = 'rgba(192, 57, 43, 0.1)';
                    optBorder = '1px solid var(--color-error)';
                  }
                } else if (isSelected) {
                  optBg = 'var(--color-primary-light)';
                  optBorder = '1px solid var(--color-primary)';
                }

                return (
                  <button
                    key={oIdx}
                    disabled={isSubmitted}
                    onClick={() => handleQuizAnswerSelect(section.sectionNumber, oIdx)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: optBorder,
                      backgroundColor: optBg,
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {quizAnswers[section.sectionNumber] !== undefined && !submittedQuizzes[section.sectionNumber] && (
              <button
                onClick={() => handleQuizSubmit(section.sectionNumber)}
                style={{
                  marginTop: '16px',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Validate Answer
              </button>
            )}

            {submittedQuizzes[section.sectionNumber] && (
              <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--color-primary)', paddingLeft: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ color: quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? '✓ Correct Understanding' : '✗ Review Statutory Provision'}
                  </strong>
                  <button
                    onClick={() => handleQuizReset(section.sectionNumber)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: '3px',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    ↺ Reset Check
                  </button>
                </div>
                <p style={{ margin: '4px 0 0 0', lineHeight: '1.5' }}>{inlineQuiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Private Study Notes Drawer */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '16px' }}>
          {editingNoteSection === section.sectionNumber ? (
            <div>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type your personal private study notes here..."
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  marginBottom: '12px',
                  fontFamily: 'var(--font-sans)'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSaveNote(section.sectionNumber)}
                  style={{
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}
                >
                  Save Note
                </button>
                <button
                  onClick={() => setEditingNoteSection(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {noteText ? (
                  <span>
                    <strong>Study Note:</strong> "{noteText}"
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No study notes attached.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => handleStartEditingNote(section.sectionNumber)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-accent)',
                    textDecoration: 'underline',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 'bold'
                  }}
                >
                  {noteText ? 'Edit' : '+ Add Note'}
                </button>
                {noteText && (
                  <button
                    onClick={() => handleDeleteNote(section.sectionNumber)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-error)',
                      textDecoration: 'underline',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer review section (Simplified - No border) */}
        <div style={{
          marginTop: '20px',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <span>
            Last Reviewed: {new Date(section.lastReviewed || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {section.officialSourceId && (
            <span>
              Official Source: <a href={section.officialSourceId.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--color-accent)', fontWeight: 'bold' }}>
                {section.officialSourceId.title} ({section.officialSourceId.authority})
              </a>
            </span>
          )}
        </div>

      </div>
    );
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="Statutory Index"
        title="Indian Digital Law Index"
        subtitle='"Understanding the provision is the first step. Understanding where it matters is the next."'
        description="Explore India's IT governance, data privacy statutes, and judicial interpretations. Connect statutory clauses to real-world incidents, toggle legal drafts, and bookmark provisions."
      >
        <WorkspaceBreadcrumb />

        {/* Disclaimer Panel */}
        <div style={{
          borderLeft: '3px solid var(--color-primary)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '14px 18px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          marginTop: '20px',
          color: 'var(--text-secondary)'
        }}>
          <strong>Educational Notice:</strong> This index is compiled for public legal literacy and security awareness. It maps potentially relevant statutes to scenarios, but is <strong>not legal advice</strong>. Refer to official India Code publications for statutory filings.
        </div>

        {/* Statutory Transition & Operational Status Guide */}
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FCFAF5)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '16px 20px',
          marginTop: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--color-text-primary, #302B27)' }}>
              How Active Laws Apply Today
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Clear rules based on official Government notifications and Supreme Court rulings
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            fontSize: '0.82rem',
            lineHeight: '1.5'
          }}>
            {/* IT Act 43A vs DPDP 44(2) */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              borderLeft: '3px solid var(--color-success, #536F61)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>IT Act § 43A</span>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#047857', padding: '2px 6px', borderRadius: '3px' }}>
                  ACTIVE LAW
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Governs compensation for corporate failure to protect sensitive data under <strong>SPDI Rules (2011)</strong>. While DPDP Act § 44(2) slates § 43A for omission, DPDP § 1(2) mandates separate Gazette commencement notifications. Until notified, <strong>Section 43A remains currently enforceable</strong>.
              </p>
            </div>

            {/* BNS 2023 */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              borderLeft: '3px solid var(--color-accent-gold, #B18A55)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>BNS 2023</span>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8', padding: '2px 6px', borderRadius: '3px' }}>
                  ACTIVE LAW (FROM 1 JULY 2024)
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Operationalized nationwide via Ministry of Home Affairs Notification <strong>S.O. 850(E)</strong> on 1 July 2024. Applies to offenses committed on or after this date (e.g. § 318 cheating, § 319 impersonation) concurrently with IT Act penal sections.
              </p>
            </div>

            {/* IT Act 66A */}
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              borderLeft: '3px solid var(--color-danger, #A34D43)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>IT Act § 66A</span>
                <span style={{ fontSize: '0.68rem', fontWeight: '800', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c', padding: '2px 6px', borderRadius: '3px' }}>
                  STRUCK DOWN (INOPERATIVE)
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Struck down completely by the Supreme Court in <em>Shreya Singhal (2015)</em> and reaffirmed in <em>PUCL (2022)</em>. This section has no legal power, and no police FIR, investigation, or prosecution under § 66A is lawful.
              </p>
            </div>
          </div>
        </div>
      </EditorialPageHeader>

      <PortalSearch
        placeholder="Search laws, sections, or legal topics"
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onClear={() => setSearchQuery('')}
        results={filteredLaws}
        resultTypeLabel="provisions matched"
        emptyHeader="NO MATCHING PROVISIONS"
        emptyText="Try searching for a different law section, legal term, or keyword (e.g. 66C, privacy, contract)."
        suggestions={['66C', '66D', 'privacy', 'consent', 'identity']}
        showFiltersToggle={true}
        showFilters={true} // keep open by default to match original UX
        onFiltersToggle={() => {}}
        filtersDrawerContent={
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
            <div style={{ minWidth: '220px' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Filter by Status
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'].map((stat) => (
                  <button
                    key={stat}
                    onClick={() => setActiveStatus(stat)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: activeStatus === stat ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: activeStatus === stat ? 'var(--color-primary)' : 'var(--bg-white)',
                      color: activeStatus === stat ? 'white' : 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {stat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        activeFiltersContent={
          (activeStatus !== 'All' || selectedChapter || searchQuery) && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-md)' }}>
              <button
                onClick={() => {
                  setActiveStatus('All');
                  setSelectedChapter(null);
                  setSearchQuery('');
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--color-accent)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  padding: 0
                }}
              >
                Clear Active Filters & Reset Search
              </button>
            </div>
          )
        }
      />

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {/* DYNAMIC LAYOUT GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        
        {/* SIDEBAR T.O.C. NAVIGATION (Desktop sticky / Mobile dropdown) */}
        {isMobile ? (
          /* Mobile selector dropdown drawer block */
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '16px 20px',
            borderRadius: '4px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Jump to Law Family
              </label>
              <select
                value={activeFamilyId}
                onChange={(e) => {
                  const targetFamily = e.target.value;
                  setActiveFamilyId(targetFamily);
                  scrollToElement(`family-heading-${targetFamily}`, null, targetFamily);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-dark)',
                  backgroundColor: 'var(--bg-white)',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}
              >
                {lawFamilies.map(fam => (
                  <option key={fam.id} value={fam.id}>{fam.displayName}</option>
                ))}
              </select>
            </div>

            {/* Quick Section jump dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Quick Jump to Section
              </label>
              <select
                onChange={(e) => {
                  const targetSec = e.target.value;
                  if (targetSec) {
                    scrollToElement(`section-card-${targetSec.replace(/\s+/g, '-')}`, targetSec, activeFamilyId);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-dark)',
                  backgroundColor: 'var(--bg-white)',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">-- Select Section --</option>
                {getSectionsByFamily(lawFamilies.find(f => f.id === activeFamilyId) || lawFamilies[0]).map(sec => (
                  <option key={sec._id} value={sec.sectionNumber}>
                    {sec.sectionNumber} - {sec.officialTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Desktop sticky sidebar context navigation */
          <div style={{
            position: 'sticky',
            top: '90px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            paddingRight: '12px',
            borderRight: '1px solid var(--color-border)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>
                Law Families Index
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {lawFamilies.map((fam) => {
                  const isFamActive = activeFamilyId === fam.id;
                  const sectionsList = getSectionsByFamily(fam);

                  return (
                    <div key={fam.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        onClick={() => scrollToElement(`family-heading-${fam.id}`, null, fam.id)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: isFamActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                          backgroundColor: isFamActive ? 'var(--color-primary-light)' : 'transparent',
                          color: isFamActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                          fontWeight: isFamActive ? 'bold' : '500',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingLeft: isFamActive ? '10px' : '13px'
                        }}
                      >
                        <span>{fam.displayName.split(',')[0]}</span>
                        {isFamActive && <span style={{ fontSize: '0.65rem' }}>●</span>}
                      </button>

                      {/* Nested section anchors */}
                      {isFamActive && sectionsList.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          paddingLeft: '16px',
                          marginTop: '4px',
                          marginBottom: '8px',
                          borderLeft: '1.5px solid var(--color-primary)'
                        }}>
                          {sectionsList.map((sec) => {
                            const isSecActive = activeSectionId === sec.sectionNumber;
                            const secId = sec.sectionNumber.replace(/\s+/g, '-');
                            return (
                              <button
                                key={sec._id}
                                id={`nav-item-${secId}`}
                                onClick={() => scrollToElement(`section-card-${secId}`, sec.sectionNumber, fam.id)}
                                style={{
                                  textAlign: 'left',
                                  padding: '5px 8px',
                                  borderRadius: '2px',
                                  border: 'none',
                                  backgroundColor: isSecActive ? 'var(--color-primary-light)' : 'transparent',
                                  color: isSecActive ? 'var(--color-primary)' : 'var(--text-muted)',
                                  fontWeight: isSecActive ? 'bold' : 'normal',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.1s ease',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={`${sec.sectionNumber}: ${sec.officialTitle}`}
                              >
                                {sec.sectionNumber}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chapter quick shortcuts */}
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
                Chapters explorer
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => setSelectedChapter(null)}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: !selectedChapter ? 'var(--color-primary-light)' : 'var(--bg-white)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: !selectedChapter ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  All chapters
                </button>
                {itActChapters.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChapter(ch.id);
                      setActiveFamilyId('it-act');
                      scrollToElement('family-heading-it-act', null, 'it-act');
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: selectedChapter === ch.id ? 'var(--color-primary-light)' : 'var(--bg-white)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ display: 'block', color: 'var(--color-primary)', fontSize: '0.7rem' }}>{ch.id}</strong>
                    <span style={{ fontSize: '0.65rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ch.title.split(': ')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bookmarks Counter box */}
            {bookmarks.length > 0 && (
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '4px', marginTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold', display: 'block' }}>
                  {bookmarks.length} Bookmarks Saved
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                  Provisions flagged for offline study. Click star to toggle.
                </p>
              </div>
            )}
          </div>
        )}

        {/* RIGHT LAW REFERENCE DOCUMENT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '850px', width: '100%' }}>
          
          {/* SECTION A: LAW COMPASS GUIDED WIZARD */}
          <div style={{
            backgroundColor: 'var(--bg-white)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--color-primary)',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.5px' }}>
                LAW COMPASS: SITUATION SEARCH WIZARD
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 20px 0' }}>
              "Select what happened to find the applicable statutory clauses and rules."
            </p>

            {compassStep === 1 ? (
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Step 1: Choose a situation that matches your enquiry:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {compassSituations.map((sit) => (
                    <button
                      key={sit.id}
                      onClick={() => {
                        setSelectedSituation(sit);
                        setCompassStep(2);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-white)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{sit.title}</span>
                      <strong style={{ color: 'var(--color-primary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {sit.type} &rarr;
                      </strong>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              selectedSituation && (
                <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '14px', fontSize: '1.05rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                    Compass Audit: {selectedSituation.type}
                  </h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 576 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>
                        Applicable Statutory Sections
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {selectedSituation.provisions.map((prov) => (
                          <span
                            key={prov}
                            onClick={() => {
                              setSearchQuery(prov); // set search box to provision to jump there
                              scrollToElement(`section-card-${prov.replace(/\s+/g, '-')}`, prov, activeFamilyId);
                            }}
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-primary)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid var(--color-border)',
                              transition: 'all 0.1s ease'
                            }}
                          >
                            {prov}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '6px' }}>
                        Related Cybercrime Category
                      </span>
                      <Link
                        to={getContextPath('/crimes')}
                        style={{
                          color: 'var(--color-accent)',
                          fontWeight: 'bold',
                          textDecoration: 'underline'
                        }}
                      >
                        {selectedSituation.crime} &rarr;
                      </Link>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '4px', marginBottom: '20px', lineHeight: '1.5' }}>
                    <strong>Legal Context Summary:</strong> {selectedSituation.advice}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setCompassStep(1);
                        setSelectedSituation(null);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border-dark)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Reset Compass
                    </button>
                    {selectedSituation.caseStudy && (
                      <Link
                        to={getContextPath('/cases')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}
                      >
                        Examine Case Study &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          {/* SECTION B: PROVISIONS CONTINUOUS DOCUMENT */}
          {!loading && filteredLaws.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 40px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>No matching provisions found. Try resetting search filters.</p>
            </div>
          )}

          {!loading && lawFamilies.map(family => {
            const sections = getSectionsByFamily(family);
            if (sections.length === 0) return null;

            return (
              <div key={family.id} id={`family-heading-${family.id}`} style={{ marginBottom: '32px' }}>
                {/* Family Header */}
                <h2 style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  borderBottom: '2px solid var(--color-primary)',
                  paddingBottom: '12px',
                  marginBottom: '28px',
                  letterSpacing: '0.5px'
                }}>
                  {family.displayName}
                </h2>

                {/* Provision cards list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {sections.map(section => renderSectionCard(section, family.id))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

export default Laws;
