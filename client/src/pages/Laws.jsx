import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Laws() {
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
      sections: ['Section 66C', 'Section 66D', 'Section 66E', 'Section 67'] // Removed struck down 66A
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
      // Omit Section 66A from legal display as it has been struck down
      const activeData = data.filter(l => l.sectionNumber !== 'Section 66A');
      setLaws(activeData);
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

  // Mock quiz questions mapped to provisions for inline check
  const getKnowledgeCheck = (secNumber) => {
    switch (secNumber) {
      case 'Section 66C':
        return {
          question: 'Under Section 66C of the IT Act, which of the following is considered an identity theft offence?',
          options: [
            'Sharing political opinions on messaging boards.',
            'Fraudulently using another person\'s UPI PIN or password.',
            'Exposing location details in a public restaurant check-in.'
          ],
          correctIdx: 1,
          explanation: 'Section 66C strictly criminalizes the dishonest or fraudulent use of passwords, PINs, biometrics, or electronic signatures.'
        };
      case 'Section 66D':
        return {
          question: 'If a scammer sets up a mock website pretending to be your official bank portal to steal funds, which section applies?',
          options: [
            'Section 66A',
            'Section 66D (Cheating by Personation)',
            'Section 43A (Compensation)'
          ],
          correctIdx: 1,
          explanation: 'Using communication devices or networks to cheat by pretending to be an institution or another person falls under Section 66D.'
        };
      case 'DPDP Section 6':
        return {
          question: 'What does the DPDP Act require for a user\'s consent to be valid?',
          options: [
            'A pre-ticked checkbox hidden in terms of service pages.',
            'A free, specific, informed, and unambiguous affirmative action.',
            'Just a generic notice stating that cookies are processed.'
          ],
          correctIdx: 1,
          explanation: 'DPDP Section 6 mandates that consent must be active, unambiguous, specific, and easily withdrawable.'
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

  // Client Filter Logic (Filters the provisions pool dynamically)
  const filteredLaws = laws.filter(l => {
    const matchesStatus = activeStatus === 'All' || l.legalStatus === activeStatus;
    const matchesChapter = !selectedChapter || 
      (selectedChapter === 'Chapter IX' && itActChapters[0].sections.includes(l.sectionNumber)) ||
      (selectedChapter === 'Chapter XI' && itActChapters[1].sections.includes(l.sectionNumber));
    const matchesSearch = !searchQuery.trim() || [
      l.sectionNumber,
      l.officialTitle,
      l.plainLanguageExplanation,
      l.whyItMatters,
      l.role,
      l.actName,
      ...(l.keywords || [])
    ].some(field => field && field.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesChapter && matchesSearch;
  });

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
    
    let accentColor = 'var(--accent-navy)';
    if (isOmitted) accentColor = 'var(--color-error)';
    else if (isNotYetInForce) accentColor = '#f59e0b';
    else if (section.role === 'Data Protection') accentColor = '#10b981';

    const cardId = section.sectionNumber.replace(/\s+/g, '-');

    return (
      <div
        key={section._id}
        id={`section-card-${cardId}`}
        data-section-num={section.sectionNumber}
        data-family-id={familyId}
        style={{
          backgroundColor: 'var(--bg-white)',
          borderLeft: `4px solid ${accentColor}`,
          padding: '32px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderTop: '1px solid var(--color-border)',
          borderRight: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '24px'
        }}
      >
        {/* Title metadata bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {section.actName} • {section.role}
            </span>
            <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-navy)', fontWeight: '700', marginTop: '6px', lineHeight: '1.2' }}>
              {section.sectionNumber}: {section.officialTitle}
            </h3>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill={hasBookmark ? "var(--accent-navy)" : "none"} stroke="var(--accent-navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: '3px',
              backgroundColor: isOmitted ? 'rgba(239, 68, 68, 0.08)' : (isNotYetInForce ? 'rgba(245, 158, 11, 0.08)' : 'var(--accent-navy-light)'),
              color: isOmitted ? 'var(--color-error)' : (isNotYetInForce ? '#d35400' : 'var(--accent-navy)'),
              border: `1px solid ${accentColor}`
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
                backgroundColor: textToggleView === 'plain' ? 'var(--accent-navy)' : 'transparent',
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
                backgroundColor: textToggleView === 'official' ? 'var(--accent-navy)' : 'transparent',
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
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
              Why It Matters to You
            </h4>
            <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              {section.whyItMatters}
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 'bold' }}>
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
          <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)' }}>PROVISION ROADMAP:</span>
          <span style={{ color: 'var(--text-primary)' }}>{section.sectionNumber}</span>
          <span>&rarr;</span>
          {section.relatedCyberCrimes && section.relatedCyberCrimes.length > 0 ? (
            <Link to="/crimes" style={{ color: 'var(--accent-navy)', fontWeight: 'bold', textDecoration: 'underline' }}>
              Crime: {section.relatedCyberCrimes[0]}
            </Link>
          ) : (
            <span>General Security</span>
          )}
          <span>&rarr;</span>
          {section.relatedCaseStudies && section.relatedCaseStudies.length > 0 ? (
            <Link to="/cases" style={{ color: 'var(--accent-navy)', fontWeight: 'bold', textDecoration: 'underline' }}>
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
            marginBottom: '24px'
          }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Concept Check
            </span>
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
                  optBg = 'var(--accent-navy-light)';
                  optBorder = '1px solid var(--accent-navy)';
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
                  backgroundColor: 'var(--accent-navy)',
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
              <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '12px' }}>
                <strong>
                  {quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? 'Correct' : 'Incorrect'}
                </strong>
                <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>{inlineQuiz.explanation}</p>
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
                    color: 'var(--accent-navy)',
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
              Official Source: <a href={section.officialSourceId.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
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
      <div style={{ marginBottom: 'var(--space-xxl)' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-navy)', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
          National Digital Legislation Library
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 12px 0' }}>
          INDIAN DIGITAL LAW INDEX
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', margin: '0 0 16px 0', fontFamily: 'var(--font-sans)', fontStyle: 'normal', fontWeight: '400' }}>
          "Access and interpret India's cyber legal code in plain English."
        </p>
        <p style={{ maxWidth: '850px', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1rem', margin: 0 }}>
          Explore India's IT governance, data privacy statutes, and judicial interpretations. Connect statutory clauses to real-world incidents, toggle legal drafts, and bookmark provisions.
        </p>

        {/* Disclaimer Panel */}
        <div style={{
          borderLeft: '4px solid var(--accent-navy)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '16px 20px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          marginTop: '24px',
          color: 'var(--text-secondary)'
        }}>
          <strong>Educational Notice:</strong> This registry is compiled for public legal literacy and security awareness. It maps potentially relevant statutes to scenarios, but is <strong>not legal advice</strong>. Refer to official India Code registries for statutory filings.
        </div>
      </div>

      {/* SEARCH BAR & STATUS FILTERS AREA (Breathing Room Separated) */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '6px',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Search Legal Provisions
            </span>
            <input
              type="text"
              placeholder="Search sections (e.g. 66C, data, identity, Shreya Singhal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '4px',
                border: '1px solid var(--color-border-dark)',
                backgroundColor: 'var(--bg-white)',
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Filter by Status
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'].map((stat) => (
                <button
                  key={stat}
                  onClick={() => setActiveStatus(stat)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-dark)',
                    backgroundColor: activeStatus === stat ? 'var(--accent-navy)' : 'var(--bg-white)',
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

        {/* Active Filters Clear Button */}
        {(activeStatus !== 'All' || selectedChapter || searchQuery) && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              onClick={() => {
                setActiveStatus('All');
                setSelectedChapter(null);
                setSearchQuery('');
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--accent-navy)',
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
        )}
      </div>

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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', marginBottom: '6px' }}>
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', marginBottom: '6px' }}>
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
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: isFamActive ? 'var(--accent-navy-light)' : 'transparent',
                          color: isFamActive ? 'var(--accent-navy)' : 'var(--text-secondary)',
                          fontWeight: isFamActive ? 'bold' : '500',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
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
                          borderLeft: '1.5px solid var(--accent-navy)'
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
                                  backgroundColor: isSecActive ? 'rgba(15, 37, 55, 0.05)' : 'transparent',
                                  color: isSecActive ? 'var(--accent-navy)' : 'var(--text-muted)',
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
                    backgroundColor: !selectedChapter ? 'var(--accent-navy-light)' : 'var(--bg-white)',
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
                      backgroundColor: selectedChapter === ch.id ? 'var(--accent-navy-light)' : 'var(--bg-white)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ display: 'block', color: 'var(--accent-navy)', fontSize: '0.7rem' }}>{ch.id}</strong>
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
            backgroundColor: 'var(--accent-navy-light)',
            borderLeft: '4px solid var(--accent-navy)',
            borderRadius: '4px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: 0, letterSpacing: '0.5px' }}>
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
                      <strong style={{ color: 'var(--accent-navy)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {sit.type} &rarr;
                      </strong>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              selectedSituation && (
                <div style={{ backgroundColor: 'var(--bg-white)', padding: '20px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                  <h4 style={{ color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '14px', fontSize: '1.05rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
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
                              backgroundColor: 'var(--accent-navy-light)',
                              color: 'var(--accent-navy)',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: '1px solid var(--accent-navy)',
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
                        to={`/crimes`}
                        style={{
                          color: 'var(--accent-navy)',
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
                        to="/cases"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--accent-navy)',
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
                  color: 'var(--accent-navy)',
                  borderBottom: '2px solid var(--accent-navy)',
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
