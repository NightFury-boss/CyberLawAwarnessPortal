import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Laws() {
  const [laws, setLaws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Navigation & Filtering States
  const [activeFamily, setActiveFamily] = useState('All'); // 'All', 'IT Act, 2000', 'DPDP Act, 2023', 'BNS, 2023', 'Rules & Judgments'
  const [activeStatus, setActiveStatus] = useState('All'); // 'All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapter, setSelectedChapter] = useState(null); // 'Chapter IX', 'Chapter XI', etc.

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

  useEffect(() => {
    fetchLaws();
    // Load Bookmarks and Notes
    const savedBookmarks = JSON.parse(localStorage.getItem('law_bookmarks') || '[]');
    const savedNotes = JSON.parse(localStorage.getItem('law_notes') || '{}');
    setBookmarks(savedBookmarks);
    setNotes(savedNotes);
  }, []);

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
      desc: 'Governs civil liabilities, failures to secure data, and details non-criminal fine structures.',
      sections: ['Section 43A']
    },
    {
      id: 'Chapter XI',
      title: 'Chapter XI: Cyber Offences',
      desc: 'Defines criminal offences, arrest powers, jail sentences, and cybercrime charges.',
      sections: ['Section 66A', 'Section 66C', 'Section 66D', 'Section 66E', 'Section 67']
    }
  ];

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
      case 'Section 66A':
        return {
          question: 'What is the current legal status of Section 66A of the IT Act?',
          options: [
            'It is fully active with a 3-year prison penalty.',
            'It was struck down as unconstitutional; arrests under it are illegal.',
            'It was merged into data protection guidelines.'
          ],
          correctIdx: 1,
          explanation: 'The Supreme Court struck down Section 66A in the Shreya Singhal (2015) judgment. It is omitted and completely inoperative.'
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

  // Client Filter Logic
  const filteredLaws = laws.filter(l => {
    // Law Family matching
    const matchesFamily = activeFamily === 'All' || 
      (activeFamily === 'IT Act, 2000' && l.actName === 'Information Technology Act, 2000') ||
      (activeFamily === 'DPDP Act, 2023' && l.actName === 'Digital Personal Data Protection Act, 2023') ||
      (activeFamily === 'BNS, 2023' && l.actName === 'Bharatiya Nyaya Sanhita, 2023') ||
      (activeFamily === 'Rules & Judgments' && (l.role === 'Judicial Interpretation' || l.role === 'Government Rule / Notification'));

    // Status matching
    const matchesStatus = activeStatus === 'All' || l.legalStatus === activeStatus;

    // Chapter filter matching
    const matchesChapter = !selectedChapter || 
      (selectedChapter === 'Chapter IX' && itActChapters[0].sections.includes(l.sectionNumber)) ||
      (selectedChapter === 'Chapter XI' && itActChapters[1].sections.includes(l.sectionNumber));

    // Search query matching
    const matchesSearch = !searchQuery.trim() || [
      l.sectionNumber,
      l.officialTitle,
      l.plainLanguageExplanation,
      l.whyItMatters,
      l.role,
      l.actName,
      ...(l.keywords || [])
    ].some(field => field && field.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFamily && matchesStatus && matchesChapter && matchesSearch;
  });

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      
      {/* Hero Branding Header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
          National Digital Legislation Library
        </span>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginTop: '4px' }}>
          INDIAN DIGITAL LAW LEARNING CENTRE
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
          "Understand the rules behind the digital world."
        </p>
        <p style={{ maxWidth: '800px', color: 'var(--text-muted)', lineHeight: '1.6', marginTop: 'var(--space-sm)' }}>
          Explore India's cyber governance, data protection, and general criminal code in plain English. Connect statutory clauses to real-world incidents, toggle legal drafts, and bookmark provisions.
        </p>

        {/* Legal Disclaimer */}
        <div style={{
          borderLeft: '4px solid var(--accent-navy)',
          backgroundColor: 'var(--bg-secondary)',
          padding: '16px',
          borderRadius: '4px',
          fontSize: '0.85rem',
          lineHeight: '1.5',
          marginTop: '20px',
          color: 'var(--text-secondary)'
        }}>
          🛡️ <strong>Educational Awareness Warning Notice:</strong> This platform is designed for public legal literacy and security awareness. It maps potentially relevant statutes to scenarios, but is **not legal advice** and does not determine definitive prosecution terms. Refer to official India Code registries for statutory filings.
        </div>
      </div>

      {/* DYNAMIC SECTIONS GRID: Left Explorer & Right Main */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--space-2xl)', alignItems: 'flex-start' }}>
        
        {/* LEFT DRAWER: Chapter Explorer & Navigation Widgets */}
        <div style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Law Families Buttons */}
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px' }}>
              Law Families
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['All', 'IT Act, 2000', 'DPDP Act, 2023', 'BNS, 2023', 'Rules & Judgments'].map((fam) => (
                <button
                  key={fam}
                  onClick={() => {
                    setActiveFamily(fam);
                    setSelectedChapter(null);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: activeFamily === fam ? 'var(--accent-navy)' : 'var(--bg-secondary)',
                    color: activeFamily === fam ? 'white' : 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {fam}
                </button>
              ))}
            </div>
          </div>

          {/* 2. IT Act Chapter Explorer */}
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px' }}>
              IT Act Chapter Explorer
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setSelectedChapter(null)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: !selectedChapter ? 'var(--accent-navy-light)' : 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.8rem',
                  fontWeight: !selectedChapter ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                Show All Chapters
              </button>
              {itActChapters.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChapter(ch.id);
                    setActiveFamily('IT Act, 2000'); // jump to IT Act family
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: selectedChapter === ch.id ? 'var(--accent-navy-light)' : 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>{ch.id}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.title.split(': ')[1]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Status Filters */}
          <div>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '10px' }}>
              Statutory Status
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['All', 'CURRENT', 'OMITTED', 'NOT_YET_IN_FORCE'].map((stat) => (
                <button
                  key={stat}
                  onClick={() => setActiveStatus(stat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: activeStatus === stat ? 'var(--text-primary)' : 'var(--bg-secondary)',
                    color: activeStatus === stat ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {stat}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Bookmarks Count */}
          {bookmarks.length > 0 && (
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 'bold', display: 'block' }}>
                ✓ {bookmarks.length} Bookmarked Provisions
              </span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Saved offline for study. Scroll to flagged sections.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT CONTENT WORKSPACE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* SECTION A: LAW COMPASS GUIDED WIZARD */}
          <div style={{
            backgroundColor: 'var(--accent-navy-light)',
            borderLeft: '4px solid var(--accent-navy)',
            borderRadius: '6px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🧭</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: 0 }}>
                LAW COMPASS
              </h2>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '16px' }}>
              "Start with what happened, then explore the legal areas connected to it."
            </p>

            {compassStep === 1 && (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px' }}>
                  Step 1: Choose a situation that occurred or you want to understand:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      className="compass-btn"
                    >
                      <span>{sit.title}</span>
                      <strong style={{ color: 'var(--accent-navy)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {sit.type} &rarr;
                      </strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {compassStep === 2 && selectedSituation && (
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '4px' }}>
                <h4 style={{ color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '12px', fontSize: '1.1rem' }}>
                  Situation Audit Results ({selectedSituation.type})
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Potentially Applicable Sections
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {selectedSituation.provisions.map((prov) => (
                        <span
                          key={prov}
                          onClick={() => {
                            setSearchQuery(prov); // set search box to provision to jump there
                            window.scrollTo(0, 500);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: 'var(--accent-navy-light)',
                            color: 'var(--accent-navy)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: '1px solid var(--accent-navy)'
                          }}
                        >
                          {prov}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      Related Cybercrime Profile
                    </span>
                    <Link
                      to={`/crimes`}
                      style={{
                        display: 'inline-block',
                        color: 'var(--accent-navy)',
                        fontWeight: 'bold',
                        textDecoration: 'underline',
                        marginTop: '4px'
                      }}
                    >
                      {selectedSituation.crime} &rarr;
                    </Link>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '16px', lineHeight: '1.5' }}>
                  <strong>Legal Advice Summary:</strong> {selectedSituation.advice}
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
                      border: '1px solid var(--color-border)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
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
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        textAlign: 'center'
                      }}
                    >
                      Examine Case Study File &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SEARCH BOX & FILTERS STATUS */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search sections (e.g. 66C, data, identity, Shreya Singhal)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            {(activeFamily !== 'All' || activeStatus !== 'All' || selectedChapter || searchQuery) && (
              <button
                onClick={() => {
                  setActiveFamily('All');
                  setActiveStatus('All');
                  setSelectedChapter(null);
                  setSearchQuery('');
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* MAIN PROVISIONS DIRECTORY INDEX */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {loading && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <h3 style={{ color: 'var(--accent-navy)' }}>Loading Legal Registry...</h3>
              </div>
            )}

            {!loading && filteredLaws.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No matches found in the legal library registry.</p>
              </div>
            )}

            {!loading && filteredLaws.map((section) => {
              const isOmitted = section.legalStatus === 'OMITTED' || section.legalStatus === 'omitted';
              const isNotYetInForce = section.legalStatus === 'NOT_YET_IN_FORCE';
              const textToggleView = textViews[section.sectionNumber] || 'plain';
              const hasBookmark = bookmarks.includes(section.sectionNumber);
              const noteText = notes[section.sectionNumber] || '';
              const inlineQuiz = getKnowledgeCheck(section.sectionNumber);
              
              // Determine left bar color
              let accentColor = 'var(--accent-navy)';
              if (isOmitted) accentColor = 'var(--color-error)';
              else if (isNotYetInForce) accentColor = '#f59e0b';
              else if (section.role === 'Data Protection') accentColor = '#10b981';

              return (
                <div
                  key={section._id}
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--color-border)',
                    borderLeft: `5px solid ${accentColor}`,
                    borderRadius: '4px',
                    padding: '24px',
                    position: 'relative'
                  }}
                >
                  
                  {/* Top line metadata bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {section.actName} • {section.role}
                      </span>
                      <h2 style={{ fontSize: '1.7rem', color: isOmitted ? 'var(--color-error)' : 'var(--accent-navy)', fontWeight: 'bold', marginTop: '2px' }}>
                        {section.sectionNumber}: {section.officialTitle}
                      </h2>
                    </div>

                    {/* Action buttons (Bookmark & Status Badge) */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => toggleBookmark(section.sectionNumber)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          fontSize: '1.25rem',
                          cursor: 'pointer',
                          padding: '4px',
                          outline: 'none'
                        }}
                        title={hasBookmark ? 'Remove Study Bookmark' : 'Save Bookmark'}
                      >
                        {hasBookmark ? '⭐' : '☆'}
                      </button>

                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        backgroundColor: isOmitted ? 'rgba(239, 68, 68, 0.1)' : (isNotYetInForce ? 'rgba(245, 158, 11, 0.1)' : 'var(--accent-navy-light)'),
                        color: isOmitted ? 'var(--color-error)' : (isNotYetInForce ? '#f59e0b' : 'var(--accent-navy)'),
                        border: `1px solid ${accentColor}`
                      }}>
                        {section.legalStatus}
                      </span>
                    </div>
                  </div>

                  {/* Staged commencement / omission detail warnings */}
                  {isOmitted && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                      lineHeight: '1.5'
                    }}>
                      🛑 <strong>UNCONSTITUTIONAL & INOPERATIVE:</strong> This provision was struck down by the Supreme Court of India in the <em>Shreya Singhal v. Union of India (2015)</em> judgment. Firing charges or filing arrests under it is illegal.
                      {section.amendmentStatus && <div style={{ marginTop: '4px' }}><strong>Details:</strong> {section.amendmentStatus}</div>}
                    </div>
                  )}

                  {isNotYetInForce && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                      lineHeight: '1.5'
                    }}>
                      ⏳ <strong>NOT YET IN FORCE (Staggered Enactment):</strong>
                      <div style={{ marginTop: '4px' }}>{section.commencementStatus || 'Pending official notification by the government.'}</div>
                    </div>
                  )}

                  {/* PLAIN ENGLISH VS OFFICIAL TEXT TOGGLE SWITCH */}
                  {section.officialText && (
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                      <button
                        onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'plain' })}
                        style={{
                          backgroundColor: textToggleView === 'plain' ? 'var(--accent-navy)' : 'transparent',
                          color: textToggleView === 'plain' ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        📖 Plain English Explanation
                      </button>
                      <button
                        onClick={() => setTextViews({ ...textViews, [section.sectionNumber]: 'official' })}
                        style={{
                          backgroundColor: textToggleView === 'official' ? 'var(--accent-navy)' : 'transparent',
                          color: textToggleView === 'official' ? 'white' : 'var(--text-secondary)',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        ⚖️ Authoritative Legal Draft Text
                      </button>
                    </div>
                  )}

                  {/* Body text display */}
                  <div style={{ marginBottom: '16px', minHeight: '60px' }}>
                    {textToggleView === 'plain' ? (
                      <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: '500' }}>
                        {section.plainLanguageExplanation}
                      </p>
                    ) : (
                      <p style={{
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        color: 'var(--text-secondary)',
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '14px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {section.officialText}
                      </p>
                    )}
                  </div>

                  {/* Why it matters & Everyday Scenario Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '16px',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--accent-navy)', marginBottom: '4px' }}>
                        🔒 Why It Matters To You:
                      </strong>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                        {section.whyItMatters}
                      </p>
                    </div>

                    <div>
                      <strong style={{ display: 'block', color: 'var(--accent-navy)', marginBottom: '4px' }}>
                        💡 Everyday Real-Life Situation:
                      </strong>
                      <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', fontStyle: 'italic' }}>
                        "{section.exampleScenario}"
                      </p>
                    </div>
                  </div>

                  {/* VISUAL LAW RELATIONSHIP ROADMAP MAP */}
                  <div style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    padding: '12px 16px',
                    marginBottom: '20px'
                  }}>
                    <strong style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                      Interactive Provision Map
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent-navy)', backgroundColor: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {section.sectionNumber}
                      </span>
                      <span>&rarr;</span>
                      
                      {section.relatedCyberCrimes && section.relatedCyberCrimes.length > 0 ? (
                        <Link to="/crimes" style={{ color: 'var(--accent-navy)', fontWeight: 'bold', textDecoration: 'underline' }}>
                          Crime: {section.relatedCyberCrimes[0]}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>General Crime</span>
                      )}
                      
                      <span>&rarr;</span>

                      {section.relatedCaseStudies && section.relatedCaseStudies.length > 0 ? (
                        <span
                          onClick={() => {
                            // Link to case studies
                            window.location.href = `/cases`;
                          }}
                          style={{ color: 'var(--accent-navy)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Case File: {section.relatedCaseStudies[0].replace(/-/g, ' ')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Case Profile</span>
                      )}

                      <span>&rarr;</span>
                      <span style={{ color: 'var(--text-muted)' }}>Practice Quiz</span>
                    </div>
                  </div>

                  {/* INLINE QUIZ WIDGET (KNOWLEDGE CHECK) */}
                  {inlineQuiz && (
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.03)',
                      border: '1px dashed rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                        🧠 Interactive Knowledge Check
                      </strong>
                      <p style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                        {inlineQuiz.question}
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {inlineQuiz.options.map((opt, oIdx) => {
                          const isSelected = quizAnswers[section.sectionNumber] === oIdx;
                          const isSubmitted = submittedQuizzes[section.sectionNumber];
                          const isCorrect = oIdx === inlineQuiz.correctIdx;
                          
                          let optBg = 'var(--bg-primary)';
                          let optBorder = '1px solid var(--color-border)';
                          if (isSubmitted) {
                            if (isCorrect) {
                              optBg = 'rgba(16, 185, 129, 0.08)';
                              optBorder = '1px solid #10b981';
                            } else if (isSelected) {
                              optBg = 'rgba(239, 68, 68, 0.08)';
                              optBorder = '1px solid #ef4444';
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
                                padding: '8px 12px',
                                borderRadius: '4px',
                                border: optBorder,
                                backgroundColor: optBg,
                                color: 'var(--text-primary)',
                                fontSize: '0.85rem',
                                cursor: isSubmitted ? 'default' : 'pointer'
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
                            marginTop: '10px',
                            backgroundColor: 'var(--accent-navy)',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}
                        >
                          Check Answer
                        </button>
                      )}

                      {submittedQuizzes[section.sectionNumber] && (
                        <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          <strong>
                            {quizAnswers[section.sectionNumber] === inlineQuiz.correctIdx ? '✓ Correct Answer!' : '✗ Incorrect Answer.'}
                          </strong>
                          <p style={{ margin: '4px 0 0 0' }}>{inlineQuiz.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LOCAL PRIVATE NOTES DRAWERS */}
                  <div style={{ borderTop: '1px dotted var(--color-border)', paddingTop: '12px', marginTop: '16px' }}>
                    {editingNoteSection === section.sectionNumber ? (
                      <div>
                        <textarea
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Type your personal private study notes here..."
                          style={{
                            width: '100%',
                            height: '70px',
                            padding: '8px',
                            fontSize: '0.85rem',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            marginBottom: '8px'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleSaveNote(section.sectionNumber)}
                            style={{
                              backgroundColor: 'var(--color-success)',
                              color: 'white',
                              border: 'none',
                              padding: '5px 12px',
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
                              padding: '5px 12px',
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {noteText ? (
                            <span>
                              <strong>📝 Private Study Note:</strong> "{noteText}"
                            </span>
                          ) : (
                            <span>No study notes added.</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleStartEditingNote(section.sectionNumber)}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: 'var(--accent-navy)',
                              textDecoration: 'underline',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            {noteText ? 'Edit Note' : '+ Add Study Note'}
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

                  {/* Official advisory sources references line */}
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <span>
                      📅 Last Reviewed: {new Date(section.lastReviewed || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
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
            })}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Laws;
