import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import { supplementaryLawSectionsData } from '../data/lawSectionsData';

function Laws() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigation, Category, Filter & Scrollspy States
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeFamilyId, setActiveFamilyId] = useState('it-act');
  const [selectedFamilyCategory, setSelectedFamilyCategory] = useState('all'); // 'all' or family id
  const [activeStatus, setActiveStatus] = useState('All'); // 'All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null); // 'Chapter IX', 'Chapter XI'
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

  // Law Compass Guided Flow & Visual States
  const [isCompassExpanded, setIsCompassExpanded] = useState(true);
  const [compassStep, setCompassStep] = useState(1);
  const [selectedSituation, setSelectedSituation] = useState(null);
  const [compassCategory, setCompassCategory] = useState('all');

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

  // Law Families Static Mapping (Covering all 32 statutory sections with mutual exclusivity)
  const lawFamilies = [
    {
      id: 'it-act',
      name: 'Information Technology Act, 2000',
      displayName: 'Information Technology Act, 2000',
      shortName: 'IT Act, 2000',
      description: 'The foundation of Indian cyber law, governing digital commerce, corporate liabilities, computer offenses, and intermediary duties.',
      filter: (l) => l.actName === 'Information Technology Act, 2000' && l.role !== 'Government Rule / Notification' && l.role !== 'Sector Regulation'
    },
    {
      id: 'dpdp-act',
      name: 'Digital Personal Data Protection Act, 2023',
      displayName: 'Digital Personal Data Protection Act, 2023',
      shortName: 'DPDP Act, 2023',
      description: 'Comprehensive personal data protection framework establishing Data Principal rights, fiduciary obligations, and phased enforcement under G.S.R. 843(E).',
      filter: (l) => l.actName === 'Digital Personal Data Protection Act, 2023'
    },
    {
      id: 'bns',
      name: 'Bharatiya Nyaya Sanhita & BNSS, 2023',
      displayName: 'Bharatiya Nyaya Sanhita & BNSS, 2023',
      shortName: 'BNS & BNSS, 2023',
      description: 'India\'s modernized penal code operationalized from 1 July 2024 (S.O. 850(E)), defining penal fraud (§ 318), impersonation (§ 319), and procedural Zero FIR (§ 173).',
      filter: (l) => l.actName === 'Bharatiya Nyaya Sanhita, 2023' || l.actName === 'Bharatiya Nagarik Suraksha Sanhita, 2023'
    },
    {
      id: 'bsa',
      name: 'Bharatiya Sakshya Adhiniyam, 2023',
      displayName: 'Digital Evidence (BSA, 2023)',
      shortName: 'Digital Evidence (BSA)',
      description: 'Statutory evidentiary standards governing the admissibility and certification of digital evidence in courts under Section 63.',
      filter: (l) => l.actName === 'Bharatiya Sakshya Adhiniyam, 2023'
    },
    {
      id: 'copyright',
      name: 'Digital Copyright & Fair Use (Copyright Act, 1957)',
      displayName: 'Digital Copyright & Fair Use (Copyright Act, 1957)',
      shortName: 'Copyright & Fair Dealing',
      description: 'Statutory protections for digital content, fair dealing educational exceptions (§ 52), and technological protection measures (§§ 65A, 65B).',
      filter: (l) => l.actName === 'Copyright Act, 1957'
    },
    {
      id: 'rules',
      name: 'Rules, Regulations & Sector Directives',
      displayName: 'Rules, Regulations & Sector Directives',
      shortName: 'Rules & Directives',
      description: 'Subordinate legislation including IT Intermediary Rules (2021/2026), CERT-In security directions, and RBI Customer Liability frameworks.',
      filter: (l) => l.role === 'Government Rule / Notification' || l.role === 'Sector Regulation' || l.role === 'Judicial Interpretation'
    }
  ];

  // Law Compass Scenarios Mapping (All 11 scenarios preserved verbatim with subtle category tags)
  const compassSituations = [
    {
      id: 'impersonation',
      title: 'Scammer impersonated someone online / created a fake profile',
      type: 'Identity Theft & Fraud',
      category: 'Identity & AI',
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
      category: 'Financial Fraud',
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
      category: 'Privacy & Safety',
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
      category: 'Privacy & Safety',
      provisions: ['Section 66E', 'Section 67'],
      crime: 'Cyber Stalking',
      crimeSlug: 'cyberstalking-doxxing',
      caseStudy: '',
      advice: 'Section 66E directly punishes violating physical privacy. Obscene media dissemination is prosecuted under Section 67.'
    },
    {
      id: 'erasure_request',
      title: 'Want a portal to completely delete my registered personal data',
      type: 'Data Protection Rights',
      category: 'Data Rights & Evidence',
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
      category: 'Identity & AI',
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
      category: 'Financial Fraud',
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
      category: 'Financial Fraud',
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
      category: 'Identity & AI',
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
      category: 'Data Rights & Evidence',
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
      category: 'Privacy & Safety',
      provisions: ['BNS Section 78', 'Section 66E'],
      crime: 'Cyberstalking & Doxxing',
      crimeSlug: 'cyberstalking-doxxing',
      caseStudy: '',
      advice: 'BNS Section 78 explicitly criminalizes electronic monitoring of women. Document all timestamps and handles without replying; file on cybercrime.gov.in.'
    }
  ];

  const compassCategories = [
    { id: 'all', label: 'All Scenarios', count: 11 },
    { id: 'Financial Fraud', label: 'Financial Fraud (3)', count: 3 },
    { id: 'Identity & AI', label: 'Identity & AI (3)', count: 3 },
    { id: 'Privacy & Safety', label: 'Privacy & Safety (3)', count: 3 },
    { id: 'Data Rights & Evidence', label: 'Data Rights & Evidence (2)', count: 2 }
  ];

  // IT Act Chapters Map
  const itActChapters = [
    {
      id: 'Chapter IX',
      title: 'Chapter IX: Penalties, Compensation and Adjudication',
      desc: 'Governs civil liabilities, failures to secure sensitive data, and adjudication procedures.',
      sections: ['Section 43A']
    },
    {
      id: 'Chapter XI',
      title: 'Chapter XI: Cyber Offences',
      desc: 'Defines criminal computer offences, identity theft, obscenity, and arrest powers.',
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

  // Hash Navigation Handler with Deep Link Normalization & Unmounted Tab Activation
  useEffect(() => {
    if (laws.length === 0 || !location.hash) return;

    const rawHash = decodeURIComponent(location.hash.substring(1)).trim();
    if (!rawHash) return;

    // Clean input: remove legacy 'sec-' prefix, whitespace, and punctuation for resilient matching
    const cleanRaw = rawHash.replace(/^sec-/, '');
    const cleanAlnum = cleanRaw.replace(/[^a-z0-9]/gi, '').toLowerCase();

    // Match against laws collection by sectionNumber or slug
    const matchedLaw = laws.find((l) => {
      const secAlnum = (l.sectionNumber || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      const slugAlnum = (l.slug || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      return secAlnum === cleanAlnum || slugAlnum === cleanAlnum;
    });

    // If direct match found, ensure its family is mounted and reset blocking filters
    let targetCardId = `section-card-${cleanRaw.replace(/\s+/g, '-')}`;
    let targetFamilyId = null;

    if (matchedLaw) {
      targetCardId = `section-card-${matchedLaw.sectionNumber.replace(/\s+/g, '-')}`;
      const parentFamily = lawFamilies.find((f) => f.filter(matchedLaw));
      if (parentFamily) {
        targetFamilyId = parentFamily.id;
        // If current category filter would unmount this family, activate the family
        setSelectedFamilyCategory((prev) => {
          if (prev !== 'all' && prev !== parentFamily.id) {
            return parentFamily.id;
          }
          return prev;
        });
      }

      // Reset filters that would hide the matching card from view
      if (searchQuery) setSearchQuery('');
      if (selectedChapter) setSelectedChapter(null);
      if (showBookmarkedOnly && !bookmarks.includes(matchedLaw.sectionNumber)) {
        setShowBookmarkedOnly(false);
      }
    }

    // Schedule smooth scroll with retry harness to guarantee DOM mounting before scroll
    let attempts = 0;
    const maxAttempts = 12;
    let timerId = null;
    let rafId = null;

    const tryScroll = () => {
      const element = document.getElementById(targetCardId);
      if (element) {
        isScrollingToTarget.current = true;
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);

        if (matchedLaw) {
          setActiveSectionId(matchedLaw.sectionNumber);
          if (targetFamilyId) setActiveFamilyId(targetFamilyId);
        }

        const header = document.querySelector('.top-header, .workspace-topbar');
        const headerHeight = header ? header.offsetHeight : 72;
        const topOffset = element.getBoundingClientRect().top + window.pageYOffset - (headerHeight + 20);

        window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });

        scrollTimeout.current = setTimeout(() => {
          isScrollingToTarget.current = false;
        }, 900);
      } else if (attempts < maxAttempts) {
        attempts += 1;
        timerId = setTimeout(() => {
          rafId = requestAnimationFrame(tryScroll);
        }, 50);
      }
    };

    rafId = requestAnimationFrame(tryScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, [laws, location.hash]);

  const fetchLaws = async () => {
    setLoading(true);
    try {
      const data = await api.getLaws();
      const serverSectionNumbers = new Set((data || []).map((l) => l.sectionNumber));
      const additional = supplementaryLawSectionsData.filter((l) => !serverSectionNumbers.has(l.sectionNumber));
      setLaws([...(data || []), ...additional]);
    } catch (_err) {
      setLaws(supplementaryLawSectionsData);
      setError('Live statutory database synchronization unavailable. Viewing archived catalog records.');
    } finally {
      setLoading(false);
    }
  };

  // Scrollspy Observer Setup
  useEffect(() => {
    if (loading || laws.length === 0 || isMobile) return;

    const observerOptions = {
      root: null,
      rootMargin: '-120px 0px -60% 0px',
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

  // Sidebar Auto-Scroll Adjustment (Strictly scoped to sidebar container, never window scroll)
  useEffect(() => {
    if (activeSectionId && !isMobile) {
      const activeNavEl = document.getElementById(`nav-item-${activeSectionId.replace(/\s+/g, '-')}`);
      const sidebarContainer = document.querySelector('.laws-sidebar-sticky');
      if (activeNavEl && sidebarContainer) {
        const navRect = activeNavEl.getBoundingClientRect();
        const containerRect = sidebarContainer.getBoundingClientRect();
        if (navRect.top < containerRect.top || navRect.bottom > containerRect.bottom) {
          sidebarContainer.scrollTop += (navRect.top - containerRect.top) - 40;
        }
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
          statusBadge: 'ENACTED (SCHEDULED 13 MAY 2027; §6(9) 13 NOV 2026)',
          statusType: 'pending',
          question: 'Under Section 6 of the Digital Personal Data Protection Act 2023, what standard is required for consent to be valid?',
          options: [
            'A pre-ticked checkbox hidden inside standard terms of service documents.',
            'A free, specific, informed, unconditional, and unambiguous affirmative action.',
            'A general website footer notice stating that user analytics cookies are collected.'
          ],
          correctIdx: 1,
          explanation: 'DPDP Act Section 6 mandates that consent given by a Data Principal must be free, specific, informed, unconditional, and unambiguous with a clear affirmative action, limited to necessary processing. Pre-ticked checkboxes and bundled consents do not meet this standard. (Statutory Status: Under Notification G.S.R. 843(E) dated 13 November 2025, commencement is staggered: Section 6(9) [Consent Manager registration] commences 13 November 2026, while Section 6(1)–(8) and Section 6(10) [Consent standards] commence 13 May 2027. Section 43A of the IT Act remains operative in the interim).'
        };
      case 'DPDP Section 11':
        return {
          statusBadge: 'ENACTED (SCHEDULED 13 MAY 2027)',
          statusType: 'pending',
          question: 'Which statutory right does Section 11 of the DPDP Act 2023 guarantee to individuals (Data Principals)?',
          options: [
            'The right to receive free broadband internet from public utilities.',
            'The right to obtain a summary of processed personal data and request correction, completion, or erasure.',
            'The right to trade anonymized medical data on public exchanges.'
          ],
          correctIdx: 1,
          explanation: 'DPDP Act Section 11 guarantees Data Principals the right to obtain a summary of their personal data processed by a Data Fiduciary, the identities of all processors, and the right to correction, completion, updating, and erasure of personal data that is no longer necessary for the specified purpose. (Statutory Status: Under Notification G.S.R. 843(E) dated 13 November 2025, substantive Data Principal rights under Section 11 take effect on 13 May 2027).'
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

  // Client Filter Logic
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
      const matchesFamily = selectedFamilyCategory === 'all' ||
        (lawFamilies.find(f => f.id === selectedFamilyCategory)?.filter(l) ?? true);
      const matchesBookmark = !showBookmarkedOnly || bookmarks.includes(l.sectionNumber);

      return matchesStatus && matchesChapter && matchesFamily && matchesBookmark;
    }
  );

  const getSectionsByFamily = (family) => {
    return filteredLaws.filter(family.filter);
  };

  // Statutory Commencement & Constitutional Status Alignment
  const getStatutoryStatusInfo = (section) => {
    const isOmitted = section.legalStatus === 'OMITTED' || section.legalStatus === 'omitted';
    const isDPDP = section.actName === 'Digital Personal Data Protection Act, 2023';
    const secNum = (section.sectionNumber || '').trim();

    if (isOmitted) {
      return {
        type: 'STRUCK_DOWN_HISTORICAL',
        accentClass: 'accent-struck-down',
        badgeText: '✕ STRUCK DOWN (UNCONSTITUTIONAL)',
        bg: 'var(--color-danger-light, #F9ECEB)',
        color: 'var(--color-danger, #9B3E35)',
        border: '1px solid var(--color-danger, #9B3E35)',
        noticeTitle: 'STRUCK DOWN & INOPERATIVE',
        noticeText: 'Struck down by the Supreme Court of India in Shreya Singhal (2015) as unconstitutional under Article 19(1)(a). It has no legal force and cannot be used for arrest or prosecution.'
      };
    }

    if (isDPDP) {
      const isNov2025 = /Section\s*(1\(2\)|2\b|18|19|20|21|22|23|24|25|26|35|38|39|40|41|42|43|44\(1\)|44\(3\))/i.test(secNum);
      const isNov2026 = /Section\s*(6\(9\)|27\(1\)\(d\))/i.test(secNum);

      if (isNov2025) {
        return {
          type: 'DPDP_COMMENCED',
          accentClass: 'accent-in-force',
          badgeText: '✓ COMMENCED 13 NOV 2025',
          bg: 'var(--color-success-light, #EEF4F0)',
          color: 'var(--color-accent-forest, #1F4D3A)',
          border: '1px solid var(--color-accent-sage, #6C8F71)',
          noticeTitle: 'COMMENCED ENABLING PROVISION',
          noticeText: 'Commenced enabling and institutional provision under Central Government Notification G.S.R. 843(E) dated 13 November 2025.'
        };
      } else if (isNov2026) {
        return {
          type: 'DPDP_PHASE_NOV_2026',
          accentClass: 'accent-pending',
          badgeText: '⏱ COMMENCING 13 NOV 2026',
          bg: 'var(--color-warning-light, #FAF4EA)',
          color: 'var(--color-accent-terracotta, #805B43)',
          border: '1px solid var(--color-border-strong, #8F7B5E)',
          noticeTitle: 'CONSENT MANAGER COMMENCEMENT PHASE (13 NOV 2026)',
          noticeText: 'Enacted statutory provision. Operational commencement for Consent Managers scheduled for 13 November 2026 under G.S.R. 843(E). General Data Fiduciary obligations do not commence on this date.'
        };
      } else {
        return {
          type: 'DPDP_PHASE_MAY_2027',
          accentClass: 'accent-pending',
          badgeText: '⏱ SCHEDULED 13 MAY 2027',
          bg: 'var(--color-warning-light, #FAF4EA)',
          color: 'var(--color-accent-terracotta, #805B43)',
          border: '1px solid var(--color-border-strong, #8F7B5E)',
          noticeTitle: 'SUBSTANTIVE COMPLIANCE PHASE (13 MAY 2027)',
          noticeText: 'Enacted statutory provision. Substantive compliance obligations, consent architecture, Data Principal rights, and Board enforcement take effect on 13 May 2027 under G.S.R. 843(E).'
        };
      }
    }

    if (section.legalStatus === 'NOT_YET_IN_FORCE') {
      return {
        type: 'NOT_YET_IN_FORCE',
        accentClass: 'accent-pending',
        badgeText: '⏱ COMMENCEMENT PENDING',
        bg: 'var(--color-warning-light, #FAF4EA)',
        color: 'var(--color-accent-terracotta, #805B43)',
        border: '1px solid var(--color-border-strong, #8F7B5E)',
        noticeTitle: 'ENACTED (COMMENCEMENT PENDING)',
        noticeText: section.commencementStatus || 'Enacted legislation; operational commencement pending notification.'
      };
    }

    if (section.role === 'Government Rule / Notification' || section.role === 'Judicial Interpretation') {
      return {
        type: 'RULES_OR_PRECEDENTS',
        accentClass: 'accent-rules',
        badgeText: section.role === 'Judicial Interpretation' ? '⚖️ BINDING PRECEDENT' : '📜 RULE IN FORCE',
        bg: 'var(--color-surface-inset, #EEF4F0)',
        color: 'var(--color-accent-forest, #1F4D3A)',
        border: '1px solid var(--color-accent-sage, #6C8F71)',
        noticeTitle: null,
        noticeText: null
      };
    }

    return {
      type: 'IN_FORCE',
      accentClass: 'accent-in-force',
      badgeText: '✓ IN FORCE',
      bg: 'var(--color-success-light, #EEF4F0)',
      color: 'var(--color-accent-forest, #1F4D3A)',
      border: '1px solid var(--color-accent-sage, #6C8F71)',
      noticeTitle: null,
      noticeText: null
    };
  };

  // Helper to render provision details using clean hierarchy and soft dividers
  const renderSectionCard = (section, familyId) => {
    const statusInfo = getStatutoryStatusInfo(section);
    const textToggleView = textViews[section.sectionNumber] || 'plain';
    const hasBookmark = bookmarks.includes(section.sectionNumber);
    const noteText = notes[section.sectionNumber] || '';
    const inlineQuiz = getKnowledgeCheck(section.sectionNumber);
    const accentColor = statusInfo.color;
    const cardId = section.sectionNumber.replace(/\s+/g, '-');

    return (
      <article
        key={section._id}
        id={`section-card-${cardId}`}
        data-section-num={section.sectionNumber}
        data-family-id={familyId}
        className={`law-section-card ${statusInfo.accentClass}`}
      >
        {/* Title metadata bar */}
        <div className="section-card-topbar">
          <div>
            <span className="section-meta-eyebrow">
              {section.actName} • {section.role}
            </span>
            <h3 className="section-official-title">
              {section.sectionNumber}: {section.officialTitle}
            </h3>
            <div className="section-accent-rule" style={{ backgroundColor: accentColor }} />
          </div>

          <div className="section-action-pills">
            <button
              onClick={() => toggleBookmark(section.sectionNumber)}
              className={`section-bookmark-btn ${hasBookmark ? 'bookmarked' : ''}`}
              title={hasBookmark ? 'Remove from saved provisions' : 'Save provision to bookmarks'}
              aria-label={hasBookmark ? `Remove ${section.sectionNumber} from bookmarks` : `Bookmark ${section.sectionNumber}`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={hasBookmark ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{hasBookmark ? 'Saved' : 'Bookmark'}</span>
            </button>
            <span
              className="section-status-badge"
              style={{
                backgroundColor: statusInfo.bg,
                color: statusInfo.color,
                border: statusInfo.border
              }}
            >
              {statusInfo.badgeText}
            </span>
          </div>
        </div>

        {/* Penalty / Legal Effect Callout */}
        {section.penaltyOrLegalEffect && (
          <div className="section-penalty-banner">
            <span className="section-penalty-icon" aria-hidden="true">⚖️</span>
            <div>
              <strong style={{ color: 'var(--color-text-primary)' }}>Penalty & Legal Effect: </strong>
              <span>{section.penaltyOrLegalEffect}</span>
            </div>
          </div>
        )}

        {/* Status Notice bars */}
        {statusInfo.noticeText && (
          <div
            className="section-notice-box"
            style={{
              backgroundColor: statusInfo.bg,
              border: statusInfo.border,
              color: statusInfo.color
            }}
          >
            <strong>{statusInfo.noticeTitle}:</strong> {statusInfo.noticeText}
          </div>
        )}

        {/* View Toggle (Plain English vs Legal text) */}
        {section.officialText && (
          <div className="section-view-segmented" role="tablist" aria-label="Reading mode">
            <button
              type="button"
              role="tab"
              aria-selected={textToggleView === 'plain'}
              onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'plain' })}
              className={`section-view-tab ${textToggleView === 'plain' ? 'active' : ''}`}
            >
              <span aria-hidden="true">📖</span>
              <span>Plain English (Guide)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={textToggleView === 'official'}
              onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'official' })}
              className={`section-view-tab ${textToggleView === 'official' ? 'active' : ''}`}
            >
              <span aria-hidden="true">⚖️</span>
              <span>Official Legal Text</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        {textToggleView === 'plain' ? (
          <p className="section-body-plain">
            {section.plainLanguageExplanation}
          </p>
        ) : (
          <pre className="section-body-legal">
            {section.officialText}
          </pre>
        )}

        {/* 2-Column Editorial Panels (Why It Matters vs Everyday Situation) */}
        <div className="section-context-grid">
          <div className="section-context-panel panel-matters">
            <h4 className="section-panel-heading">
              <span aria-hidden="true">🛡️</span>
              <span>Why It Matters to You</span>
            </h4>
            <p className="section-panel-text">
              {section.whyItMatters}
            </p>
          </div>

          <div className="section-context-panel panel-situation">
            <h4 className="section-panel-heading">
              <span aria-hidden="true">💡</span>
              <span>Everyday Real-Life Situation</span>
            </h4>
            <p className="section-panel-text">
              "{section.exampleScenario}"
            </p>
          </div>
        </div>

        {/* Provision Connection Pathway Rail */}
        <div className="section-connection-rail">
          <span className="section-rail-label">How This Connects:</span>
          <span style={{ fontWeight: '700', color: 'var(--color-text-primary)' }}>{section.sectionNumber}</span>
          <span aria-hidden="true">&rarr;</span>
          {section.relatedCyberCrimes && section.relatedCyberCrimes.length > 0 ? (
            <Link to={`${getContextPath('/crimes')}#${section.relatedCyberCrimes[0]}`} className="section-rail-link">
              Crime: {section.relatedCyberCrimes[0].replace(/-/g, ' ')}
            </Link>
          ) : (
            <span>General Digital Rights</span>
          )}
          <span aria-hidden="true">&rarr;</span>
          {section.relatedCaseStudies && section.relatedCaseStudies.length > 0 ? (
            <Link to={`${getContextPath('/cases')}?slug=${encodeURIComponent(section.relatedCaseStudies[0])}`} className="section-rail-link">
              Case File: {section.relatedCaseStudies[0].replace(/-/g, ' ')}
            </Link>
          ) : (
            <span>Case Study Archive</span>
          )}
        </div>

        {/* Inline Quiz widget */}
        {inlineQuiz && (
          <div className="section-quiz-container">
            <div className="section-quiz-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="section-quiz-title">
                  Quick Law Check
                </span>
                {inlineQuiz.statusBadge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '3px',
                      backgroundColor: inlineQuiz.statusType === 'omitted' ? 'var(--color-danger-light)' : inlineQuiz.statusType === 'pending' ? 'var(--color-warning-light)' : 'var(--color-surface-card)',
                      color: inlineQuiz.statusType === 'omitted' ? 'var(--color-danger)' : inlineQuiz.statusType === 'pending' ? 'var(--color-accent-terracotta)' : 'var(--color-accent-forest)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {inlineQuiz.statusBadge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                Educational Practice • Not Legal Advice
              </span>
            </div>

            <p className="section-quiz-question">
              {inlineQuiz.question}
            </p>

            <div className="section-quiz-options">
              {inlineQuiz.options.map((opt, oIdx) => {
                const isSelected = quizAnswers[section.sectionNumber] === oIdx;
                const isSubmitted = submittedQuizzes[section.sectionNumber];
                const isCorrect = oIdx === inlineQuiz.correctIdx;

                let optClass = 'section-quiz-opt-btn';
                if (isSubmitted) {
                  if (isCorrect) optClass += ' opt-correct';
                  else if (isSelected) optClass += ' opt-wrong';
                } else if (isSelected) {
                  optClass += ' opt-selected';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleQuizAnswerSelect(section.sectionNumber, oIdx)}
                    className={optClass}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {quizAnswers[section.sectionNumber] !== undefined && !submittedQuizzes[section.sectionNumber] && (
              <button
                type="button"
                onClick={() => handleQuizSubmit(section.sectionNumber)}
                className="section-quiz-submit-btn"
              >
                Validate Answer
              </button>
            )}

            {submittedQuizzes[section.sectionNumber] && (
              <div className="section-quiz-feedback" role="region" aria-live="polite" aria-label="Knowledge check result">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ color: quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? 'var(--color-accent-forest, #1F4D3A)' : 'var(--color-danger, #9B3E35)' }}>
                    {quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? '✓ Correct Understanding' : '✗ Review Statutory Provision'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleQuizReset(section.sectionNumber)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      color: 'var(--color-text-secondary)'
                    }}
                  >
                    ↺ Try Again
                  </button>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-primary)' }}>{inlineQuiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Private Study Notes Drawer */}
        <div className="section-notes-drawer">
          {editingNoteSection === section.sectionNumber ? (
            <div>
              <textarea
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Type your personal private study notes here..."
                className="section-notes-textarea"
                aria-label={`Study notes for ${section.sectionNumber}`}
              />
              <div className="section-notes-actions">
                <button
                  type="button"
                  onClick={() => handleSaveNote(section.sectionNumber)}
                  style={{
                    backgroundColor: 'var(--color-accent-forest, #1F4D3A)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontWeight: '700'
                  }}
                >
                  Save Note
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNoteSection(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-secondary)',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.78rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                {noteText ? (
                  <span>
                    <strong>Personal Study Note:</strong> "{noteText}"
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)' }}>No private study notes attached to this section.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleStartEditingNote(section.sectionNumber)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--color-accent-forest, #1F4D3A)',
                    textDecoration: 'underline',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: '700'
                  }}
                >
                  {noteText ? 'Edit Note' : '+ Add Study Note'}
                </button>
                {noteText && (
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(section.sectionNumber)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger, #9B3E35)',
                      textDecoration: 'underline',
                      fontSize: '0.78rem',
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

        {/* Card Footer Review & Reference */}
        <div className="section-card-footer">
          <span>
            Last Reviewed: {new Date(section.lastReviewed || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {section.officialSourceId && (
            <span>
              Official Source: <a href={section.officialSourceId.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--color-accent-forest, #1F4D3A)', fontWeight: '700' }}>
                {section.officialSourceId.title} ({section.officialSourceId.authority})
              </a>
            </span>
          )}
        </div>
      </article>
    );
  };

  const filteredSituations = compassSituations.filter(
    (sit) => compassCategory === 'all' || sit.category === compassCategory
  );

  return (
    <div className="container laws-page-container">
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="Statutory Protections & Citizen Rights"
        title="Understand Your Digital Rights"
        subtitle='"Knowing the law is the first line of defense against online fraud, privacy loss, and cyber exploitation."'
        description="Explore India's IT legislation, data protection rules, penal provisions, and landmark court precedents. Read provisions in plain English or official statutory text, find the right law for your situation, and test your understanding with quick checks."
        className="laws-editorial-header"
      >
        <WorkspaceBreadcrumb />

        {/* Educational Disclaimer Notice */}
        <div className="laws-disclaimer-box">
          <strong style={{ color: 'var(--color-text-primary)' }}>Educational Notice: </strong>
          This index is compiled for public legal literacy and cybersecurity awareness. It maps relevant statutory provisions to real-life situations, but does <strong>not constitute formal legal advice</strong>. Refer to official India Code publications and gazettes for statutory filings.
        </div>

        {/* Statutory Transition & Operational Status Guide */}
        <div className="laws-framework-board">
          <div className="laws-framework-header">
            <span className="laws-framework-title">
              <span aria-hidden="true">🏛️</span>
              <span>How Active Laws Apply Today</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Verified against Central Government Gazette Notifications and Supreme Court rulings
            </span>
          </div>

          <div className="laws-framework-grid">
            {/* IT Act 43A vs DPDP 44(2) */}
            <div className="laws-framework-card status-active">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>IT Act § 43A</strong>
                <span className="laws-framework-pill pill-active">ACTIVE LAW</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}>
                Governs compensation for corporate failure to protect sensitive data under <strong>SPDI Rules (2011)</strong>. While DPDP Act § 44(2) slates § 43A for omission, Section 44(2) commencement has not been gazetted. Section 43A remains currently enforceable.
              </p>
            </div>

            {/* BNS 2023 */}
            <div className="laws-framework-card status-penal">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>BNS, 2023</strong>
                <span className="laws-framework-pill pill-penal">FROM 1 JULY 2024</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}>
                Operationalized nationwide via MHA Notification <strong>S.O. 850(E)</strong>. Applies to penal cyber offences committed on or after 1 July 2024 (§ 318 cheating, § 319 impersonation) concurrently with IT Act penal sections.
              </p>
            </div>

            {/* IT Act 66A */}
            <div className="laws-framework-card status-struck">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <strong style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>IT Act § 66A</strong>
                <span className="laws-framework-pill pill-struck">STRUCK DOWN (VOID)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}>
                Struck down completely by the Supreme Court in <em>Shreya Singhal (2015)</em> as unconstitutional under Article 19(1)(a). It has no legal power, and no police FIR, investigation, or prosecution under § 66A is lawful.
              </p>
            </div>
          </div>
        </div>
      </EditorialPageHeader>

      {/* SEARCH INTEGRATION */}
      <PortalSearch
        placeholder="Search laws, sections, penal codes, or topics (e.g. 66C, consent, privacy)..."
        searchQuery={searchQuery}
        onSearchChange={(val) => setSearchQuery(val)}
        onClear={() => setSearchQuery('')}
        results={filteredLaws}
        resultTypeLabel="statutory provisions matched"
        emptyHeader="NO MATCHING PROVISIONS"
        emptyText="Try searching for a different law section, statutory term, or keyword (e.g. 66C, privacy, DPDP, consent)."
        suggestions={['66C', '66D', 'privacy', 'consent', 'identity', 'DPDP']}
        showFiltersToggle={false}
      />

      {/* STATUTE FAMILY CATEGORY SWITCHER TABS */}
      <div className="laws-category-tabs-bar" role="tablist" aria-label="Statute Families">
        <button
          type="button"
          role="tab"
          aria-selected={selectedFamilyCategory === 'all'}
          onClick={() => {
            setSelectedFamilyCategory('all');
            setSelectedChapter(null);
          }}
          className={`laws-category-tab ${selectedFamilyCategory === 'all' ? 'tab-active' : ''}`}
        >
          <span>All Legislation & Rulings</span>
          <span className="laws-tab-count">{laws.length}</span>
        </button>

        {lawFamilies.map((fam) => {
          const count = laws.filter(fam.filter).length;
          const isActive = selectedFamilyCategory === fam.id;

          return (
            <button
              key={fam.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setSelectedFamilyCategory(fam.id);
                setActiveFamilyId(fam.id);
                setSelectedChapter(null);
              }}
              className={`laws-category-tab ${isActive ? 'tab-active' : ''}`}
            >
              <span>{fam.shortName}</span>
              <span className="laws-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* QUICK STATUS & CHAPTER FILTERS ROW */}
      <div className="laws-quick-filters-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="laws-filter-label">Legal Status:</span>
          <div className="laws-filter-chips">
            {[
              { id: 'All', label: 'All Statuses' },
              { id: 'CURRENT', label: 'In Force' },
              { id: 'OMITTED', label: 'Struck Down / Omitted' },
              { id: 'NOT_YET_IN_FORCE', label: 'Pending Commencement' }
            ].map((stat) => (
              <button
                key={stat.id}
                type="button"
                onClick={() => setActiveStatus(stat.id)}
                className={`laws-filter-chip ${activeStatus === stat.id ? 'chip-active' : ''}`}
              >
                {stat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chapter shortcut chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="laws-filter-label">IT Act Chapters:</span>
          <div className="laws-filter-chips">
            <button
              type="button"
              onClick={() => setSelectedChapter(null)}
              className={`laws-filter-chip ${!selectedChapter ? 'chip-active' : ''}`}
            >
              All Chapters
            </button>
            {itActChapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setSelectedChapter(ch.id);
                  setSelectedFamilyCategory('it-act');
                  setActiveFamilyId('it-act');
                }}
                className={`laws-filter-chip ${selectedChapter === ch.id ? 'chip-active' : ''}`}
              >
                {ch.id}
              </button>
            ))}
          </div>

          {/* Bookmarks Toggle Pill */}
          {bookmarks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`laws-filter-chip ${showBookmarkedOnly ? 'chip-active' : ''}`}
              style={{
                marginLeft: '6px',
                borderColor: showBookmarkedOnly ? 'var(--color-accent-forest)' : 'var(--color-accent-gold)'
              }}
            >
              ⭐ {showBookmarkedOnly ? 'Showing Saved' : `Saved (${bookmarks.length})`}
            </button>
          )}

          {/* Clear Filters Reset */}
          {(activeStatus !== 'All' || selectedChapter || selectedFamilyCategory !== 'all' || showBookmarkedOnly || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setActiveStatus('All');
                setSelectedChapter(null);
                setSelectedFamilyCategory('all');
                setShowBookmarkedOnly(false);
                setSearchQuery('');
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--color-accent-terracotta, #805B43)',
                textDecoration: 'underline',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {/* DYNAMIC TWO-COLUMN LAYOUT (SIDEBAR + CONTENT) */}
      <div className="laws-layout-grid">
        {/* MOBILE SELECTOR / JUMP DRAWER (< 992px) */}
        {isMobile ? (
          <div className="laws-mobile-jump-drawer">
            <div className="laws-mobile-drawer-header">
              <span aria-hidden="true">📋</span>
              <span>Quick Statutory Navigator</span>
            </div>

            <div className="laws-mobile-select-group">
              <label htmlFor="mobile-family-select">Statutory Family Navigator</label>
              <select
                id="mobile-family-select"
                value={activeFamilyId}
                onChange={(e) => {
                  const targetFamily = e.target.value;
                  setActiveFamilyId(targetFamily);
                  setSelectedFamilyCategory(targetFamily);
                  scrollToElement(`family-heading-${targetFamily}`, null, targetFamily);
                }}
                className="laws-mobile-select"
              >
                {lawFamilies.map((fam) => (
                  <option key={fam.id} value={fam.id}>{fam.displayName}</option>
                ))}
              </select>
            </div>

            <div className="laws-mobile-select-group">
              <label htmlFor="mobile-section-select">Jump Directly to Section</label>
              <select
                id="mobile-section-select"
                onChange={(e) => {
                  const targetSec = e.target.value;
                  if (targetSec) {
                    scrollToElement(`section-card-${targetSec.replace(/\s+/g, '-')}`, targetSec, activeFamilyId);
                  }
                }}
                className="laws-mobile-select"
              >
                <option value="">-- Select a Section to Jump --</option>
                {getSectionsByFamily(lawFamilies.find((f) => f.id === activeFamilyId) || lawFamilies[0]).map((sec) => (
                  <option key={sec._id} value={sec.sectionNumber}>
                    {sec.sectionNumber} - {sec.officialTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* DESKTOP STICKY SIDEBAR INDEX (>= 992px) — MINIMALIST STATUTORY TOC */
          <aside className="laws-sidebar-sticky" aria-label="Statutes Table of Contents">
            <div className="legislation-index-header">
              <h2 className="legislation-index-title">Legislation Index</h2>
              <div className="legislation-index-search-wrap">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter sections..."
                  className="legislation-index-search-input"
                  aria-label="Filter sections in Legislation Index"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="legislation-index-search-clear"
                    aria-label="Clear section filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <nav className="legislation-index-families" aria-label="Statute Families Index">
              {lawFamilies.map((fam) => {
                const isFamActive = (selectedFamilyCategory === fam.id) || (selectedFamilyCategory === 'all' && activeFamilyId === fam.id);
                const sectionsList = getSectionsByFamily(fam);

                return (
                  <div key={fam.id} className="legislation-index-family-item">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFamilyCategory(fam.id);
                        setActiveFamilyId(fam.id);
                        scrollToElement(`family-heading-${fam.id}`, null, fam.id);
                      }}
                      className={`laws-sidebar-family-btn legislation-index-family-btn ${isFamActive ? 'family-active' : ''}`}
                    >
                      <span className="family-name">{fam.shortName}</span>
                      <span className="laws-sidebar-count family-count">({sectionsList.length})</span>
                    </button>

                    {/* Compact Section Links */}
                    {isFamActive && sectionsList.length > 0 && (
                      <div className="laws-sidebar-sections-nested legislation-index-sections-list">
                        {sectionsList.map((sec) => {
                          const isSecActive = activeSectionId === sec.sectionNumber;
                          const secId = sec.sectionNumber.replace(/\s+/g, '-');
                          return (
                            <button
                              key={sec._id}
                              id={`nav-item-${secId}`}
                              type="button"
                              onClick={() => scrollToElement(`section-card-${secId}`, sec.sectionNumber, fam.id)}
                              className={`laws-sidebar-sec-link legislation-index-sec-btn ${isSecActive ? 'sec-active' : ''}`}
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
            </nav>

            {/* Restrained Saved Provisions Filter Toggle (No heavy nested boxes) */}
            {bookmarks.length > 0 && (
              <div className="legislation-index-saved-bar">
                <button
                  type="button"
                  onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                  className={`legislation-index-saved-btn ${showBookmarkedOnly ? 'active' : ''}`}
                >
                  <span>⭐ {showBookmarkedOnly ? 'Showing Saved' : 'Saved Provisions'}</span>
                  <span className="family-count">({bookmarks.length})</span>
                </button>
              </div>
            )}
          </aside>
        )}

        {/* RIGHT CONTENT PANEL (DUAL-PATHWAY DISCOVERY + LAW COMPASS + PROVISIONS) */}
        <main className="laws-content-panel">
          {/* TWO PRIMARY WAYS OF FINDING LEGISLATION */}
          <div className="laws-discovery-pathways" role="region" aria-label="Two ways to explore Indian Cyber Law">
            <div className="discovery-pathways-info">
              <span className="discovery-pathways-eyebrow">Two Complementary Ways to Explore</span>
              <p className="discovery-pathways-desc">
                Browse legislation directly through the <strong>Statute Catalog</strong> below, or use the <strong>Law Compass</strong> to diagnose applicable laws from a real-world situation.
              </p>
            </div>
            <div className="discovery-pathways-controls">
              <button
                type="button"
                onClick={() => setIsCompassExpanded(!isCompassExpanded)}
                className={`discovery-compass-toggle-btn compass-single-toggle-btn ${isCompassExpanded ? 'expanded' : 'collapsed'}`}
                aria-expanded={isCompassExpanded}
                aria-controls="law-compass-section"
              >
                <span aria-hidden="true">🧭</span>
                <span>{isCompassExpanded ? 'Hide Law Compass' : 'Show Law Compass'}</span>
                <span className="toggle-indicator-arrow" aria-hidden="true">{isCompassExpanded ? '▲' : '▼'}</span>
              </button>
              <a
                href="#statutory-catalog-start"
                className="discovery-catalog-jump-link"
              >
                <span aria-hidden="true">📜</span>
                <span>Jump to Catalog ({filteredLaws.length}) &darr;</span>
              </a>
            </div>
          </div>

          {/* LAW COMPASS GUIDED WIZARD */}
          {isCompassExpanded && (
            <section id="law-compass-section" className="law-compass-card" aria-label="Law Compass Guided Situation Finder">
              <div className="compass-header">
                <div className="compass-title-area">
                  <span style={{ fontSize: '1.25rem' }} aria-hidden="true">🧭</span>
                  <h2 className="compass-title">
                    Law Compass: Find the Law for Your Situation
                  </h2>
                </div>
                <span className="compass-step-pill">
                  Step {compassStep} of 2
                </span>
              </div>

              <p className="compass-subtitle">
                Select what happened or what you experienced to identify the applicable statutory clauses, liabilities, and next steps under Indian law.
              </p>

              {compassStep === 1 ? (
                <div>
                  {/* Subtle Category Grouping Filter Pills */}
                  <div className="compass-category-filters" role="tablist" aria-label="Filter situations by threat type">
                    {compassCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={compassCategory === cat.id}
                        onClick={() => setCompassCategory(cat.id)}
                        className={`compass-category-pill ${compassCategory === cat.id ? 'active' : ''}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="compass-situations-list">
                    {filteredSituations.map((sit) => (
                      <button
                        key={sit.id}
                        type="button"
                        onClick={() => {
                          setSelectedSituation(sit);
                          setCompassStep(2);
                        }}
                        className={`compass-situation-btn ${selectedSituation?.id === sit.id ? 'selected' : ''}`}
                        aria-pressed={selectedSituation?.id === sit.id}
                      >
                        <div className="compass-situation-header">
                          <span className="compass-situation-title">{sit.title}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span className="compass-situation-tag">{sit.type}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-accent-terracotta)' }} aria-hidden="true">
                            Analyze &rarr;
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                selectedSituation && (
                  <div className="compass-result-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 className="compass-result-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                        Compass Analysis: {selectedSituation.type}
                      </h4>
                      <span className="compass-situation-tag">{selectedSituation.title}</span>
                    </div>

                    <div className="compass-result-meta-grid">
                      <div>
                        <span className="compass-meta-heading">
                          Applicable Statutory Sections (Click to Jump)
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {selectedSituation.provisions.map((prov) => (
                            <button
                              key={prov}
                              type="button"
                              onClick={() => {
                                setSelectedFamilyCategory('all');
                                const targetLaw = laws.find(l => l.sectionNumber === prov);
                                const targetFamilyId = targetLaw
                                  ? (lawFamilies.find(f => f.filter(targetLaw))?.id || activeFamilyId)
                                  : activeFamilyId;
                                setTimeout(() => {
                                  scrollToElement(`section-card-${prov.replace(/\s+/g, '-')}`, prov, targetFamilyId);
                                }, 50);
                              }}
                              className="compass-provision-badge"
                              title={`Jump to ${prov}`}
                            >
                              {prov} &darr;
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="compass-meta-heading">
                          Related Cybercrime Category
                        </span>
                        <Link
                          to={selectedSituation.crimeSlug ? `${getContextPath('/crimes')}#${selectedSituation.crimeSlug}` : getContextPath('/crimes')}
                          style={{
                            color: 'var(--color-accent-forest, #1F4D3A)',
                            fontWeight: '700',
                            textDecoration: 'underline',
                            fontSize: '0.88rem'
                          }}
                        >
                          {selectedSituation.crime} &rarr;
                        </Link>
                      </div>
                    </div>

                    <div className="compass-context-box">
                      <strong style={{ color: 'var(--color-text-primary)' }}>Legal Context & Guidance: </strong>
                      {selectedSituation.advice}
                    </div>

                    <div className="compass-actions-row">
                      <button
                        type="button"
                        onClick={() => {
                          setCompassStep(1);
                          setSelectedSituation(null);
                        }}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border-strong, #8F7B5E)',
                          color: 'var(--color-text-primary, #26352B)',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        ← Choose Another Situation
                      </button>
                      {selectedSituation.caseStudy && (
                        <Link
                          to={getContextPath('/cases')}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--color-accent-forest, #1F4D3A)',
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            textAlign: 'center',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          Examine Real Case Study &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                )
              )}
            </section>
          )}

          {/* Accessible Screen Reader Announcer for Dynamic Filter State */}
          <div className="sr-only" role="status" aria-live="polite">
            {loading
              ? 'Loading statutory provisions...'
              : `${filteredLaws.length} statutory provision${filteredLaws.length === 1 ? '' : 's'} displayed for ${selectedFamilyCategory === 'all' ? 'All Legislation' : selectedFamilyCategory}.`}
          </div>

          {/* STATUTORY CATALOG SECTION HEADER */}
          <div id="statutory-catalog-start" className="laws-catalog-header-bar">
            <div>
              <span className="catalog-header-eyebrow">Primary Statutory Index</span>
              <h2 className="catalog-header-title">
                {selectedFamilyCategory === 'all'
                  ? 'All Legislation & Subordinate Rules'
                  : lawFamilies.find((f) => f.id === selectedFamilyCategory)?.displayName}
              </h2>
            </div>
            <span className="catalog-header-count-badge">
              {filteredLaws.length} {filteredLaws.length === 1 ? 'provision' : 'provisions'} active
            </span>
          </div>

          {/* EMPTY SEARCH / FILTER STATE */}
          {!loading && filteredLaws.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 40px', backgroundColor: 'var(--color-surface-secondary, #FAF4EA)', border: '1px dashed var(--color-border, #D9CBB1)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', margin: '0 0 16px 0' }}>
                No matching provisions found with the active search or filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveStatus('All');
                  setSelectedChapter(null);
                  setSelectedFamilyCategory('all');
                  setShowBookmarkedOnly(false);
                  setSearchQuery('');
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-accent-forest, #1F4D3A)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* CONTINUOUS PROVISIONS CATALOG GROUPED BY LEGISLATION FAMILY */}
          {!loading && lawFamilies.map((family) => {
            // If user selected a specific family category tab, only render that family
            if (selectedFamilyCategory !== 'all' && selectedFamilyCategory !== family.id) {
              return null;
            }

            const sections = getSectionsByFamily(family);
            if (sections.length === 0) return null;

            return (
              <section key={family.id} id={`family-heading-${family.id}`} style={{ marginBottom: '36px' }}>
                {/* Family Sub-Header */}
                <div style={{
                  borderBottom: '1.5px solid var(--color-border, #D9CBB1)',
                  paddingBottom: '10px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                    <h3 style={{
                      fontSize: '1.45rem',
                      fontWeight: '700',
                      color: 'var(--color-text-primary, #26352B)',
                      margin: 0,
                      letterSpacing: '-0.015em'
                    }}>
                      {family.displayName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                      {sections.length} {sections.length === 1 ? 'provision' : 'provisions'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--color-text-secondary)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                    {family.description}
                  </p>
                </div>

                {/* Provision cards list */}
                <div>
                  {sections.map((section) => renderSectionCard(section, family.id))}
                </div>
              </section>
            );
          })}
        </main>
      </div>
    </div>
  );
}

export default Laws;
