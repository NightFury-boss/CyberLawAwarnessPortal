import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Cases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI states
  const [selectedCaseSlug, setSelectedCaseSlug] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePattern, setActivePattern] = useState(null); // 'Urgency', 'Authority', 'Fear', 'Trust', 'Familiarity'
  
  // Interactive Decision states
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [narrativeUnlocked, setNarrativeUnlocked] = useState(false);
  
  // User Reading Progress (Local Storage)
  const [completedCases, setCompletedCases] = useState([]);

  useEffect(() => {
    fetchCases();
    const stored = JSON.parse(localStorage.getItem('completed_cases') || '[]');
    setCompletedCases(stored);
  }, []);

  useEffect(() => {
    if (selectedCaseSlug) {
      fetchCaseDetails(selectedCaseSlug);
    } else {
      setSelectedCase(null);
    }
  }, [selectedCaseSlug]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const data = await api.getCases();
      setCases(data);
    } catch (err) {
      setError('Failed to fetch cyber incident archive records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (slug) => {
    setCaseLoading(true);
    try {
      const data = await api.getCaseBySlug(slug);
      setSelectedCase(data);
      // Reset interactive state
      setSelectedChoiceIdx(null);
      setDecisionSubmitted(false);
      setDecisionFeedback('');
      
      // If there are no decision points, unlock narrative automatically
      if (!data.decisionPoints || data.decisionPoints.length === 0) {
        setNarrativeUnlocked(true);
      } else {
        setNarrativeUnlocked(false);
      }
    } catch (err) {
      setError('Failed to retrieve case file details.');
    } finally {
      setCaseLoading(false);
    }
  };

  const handleSelectCase = (slug) => {
    setSelectedCaseSlug(slug);
    window.scrollTo(0, 0);
  };

  const handleReturnToArchive = () => {
    setSelectedCaseSlug(null);
    setSelectedCase(null);
  };

  const handlePatternClick = (pattern) => {
    if (activePattern === pattern) {
      setActivePattern(null); // toggle off
    } else {
      setActivePattern(pattern);
      setActiveCategory('All'); // clear category filter to allow pattern search
    }
  };

  // Submit decision point
  const handleDecisionSubmit = (optionIdx, option) => {
    if (decisionSubmitted) return;
    setSelectedChoiceIdx(optionIdx);
    setDecisionSubmitted(true);
    setDecisionFeedback(option.explanation);
  };

  const handleUnlockRemainingStory = () => {
    setNarrativeUnlocked(true);
    // Mark case as completed in progress
    if (selectedCase && !completedCases.includes(selectedCase.slug)) {
      const nextCompleted = [...completedCases, selectedCase.slug];
      setCompletedCases(nextCompleted);
      localStorage.setItem('completed_cases', JSON.stringify(nextCompleted));
    }
  };

  // Categories helper derived from seed data
  const categories = ['All', 'Phishing', 'UPI/Payment Scams', 'Vishing', 'Job Scams', 'Social Engineering', 'Identity Theft', 'Payment Scams', 'Account Takeover'];
  
  // Patterns lookup list
  const patternsList = [
    { name: 'Urgency', icon: '⏳', desc: 'Attacker creates extreme pressure so victims skip safety verification.' },
    { name: 'Authority', icon: '👮', desc: 'Impersonating police, military, or banking officials to bypass trust barriers.' },
    { name: 'Familiarity', icon: '💬', desc: 'Imitating recognizable logos, layouts, or language styles.' },
    { name: 'Fear', icon: '🚨', desc: 'Threatening account suspension or judicial arrests to induce compliance.' }
  ];

  // Combined client-side filtering for cases archive list
  const filteredCases = cases.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.incidentType === activeCategory;
    
    // Pattern matches warning signs or attacker objectives
    const matchesPattern = !activePattern || 
      c.warningSigns?.some(ws => ws.title.toLowerCase().includes(activePattern.toLowerCase())) ||
      c.title.toLowerCase().includes(activePattern.toLowerCase());

    const matchesSearch = !searchQuery.trim() || [
      c.title,
      c.incidentType,
      c.attackVector,
      c.shortDescription,
      c.caseNumber,
      ...(c.warningSigns?.map(ws => ws.title) || []),
      ...(c.attackerObjectives || [])
    ].some(field => field && field.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesPattern && matchesSearch;
  });

  const featuredCase = cases.find(c => c.featured && c.published);

  // Difficulty badge colors helper
  const getDifficultyBadge = (diff) => {
    let color = 'var(--text-muted)';
    let border = '1px solid var(--color-border)';
    if (diff === 'Beginner') {
      color = '#10b981';
      border = '1px solid rgba(16, 185, 129, 0.2)';
    } else if (diff === 'Intermediate') {
      color = '#f59e0b';
      border = '1px solid rgba(245, 158, 11, 0.2)';
    } else if (diff === 'Advanced') {
      color = '#ef4444';
      border = '1px solid rgba(239, 68, 68, 0.2)';
    }
    return (
      <span style={{
        fontSize: '0.75rem',
        color,
        border,
        padding: '2px 8px',
        borderRadius: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {diff}
      </span>
    );
  };

  // Case Type formatting helper
  const getCaseTypeLabel = (type) => {
    switch (type) {
      case 'documented-case':
        return { text: 'DOCUMENTED INCIDENT', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
      case 'educational-reconstruction':
        return { text: 'EDUCATIONAL RECONSTRUCTION', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'anonymized-incident':
        return { text: 'ANONYMIZED INCIDENT', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'fictional-training-scenario':
        return { text: 'TRAINING SCENARIO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      default:
        return { text: 'CASE FILE', color: 'var(--text-muted)', bg: 'var(--bg-secondary)' };
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* 1. LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <h3 style={{ color: 'var(--accent-navy)' }}>Opening Incident Archives...</h3>
        </div>
      )}

      {/* 2. ERROR STATE */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {/* 3. ARCHIVE LANDING VIEW */}
      {!loading && !selectedCase && (
        <div>
          {/* Header block */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <span style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--accent-navy)',
              fontWeight: 'bold'
            }}>
              Investigative Registry
            </span>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 'bold', marginTop: '4px', color: 'var(--accent-navy)' }}>
              CYBER INCIDENT ARCHIVE
            </h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
              "Real incidents. Digital deception. Lessons worth remembering."
            </p>
            <p style={{ maxWidth: '750px', marginTop: 'var(--space-sm)', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Explore documented attack methods, analyze visual timelines, make critical decisions in situational mockups, and extract security lessons from previous fraud files.
            </p>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <input
              type="text"
              placeholder="Search case archive by title, incident type, method, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--bg-secondary)',
                fontSize: '1.05rem',
                outline: 'none',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* FEATURED INCIDENT FILE (If present and search/filters are empty) */}
          {!searchQuery && activeCategory === 'All' && !activePattern && featuredCase && (
            <div style={{
              backgroundColor: 'var(--accent-navy-light)',
              borderLeft: '4px solid var(--accent-navy)',
              padding: 'var(--space-xl)',
              borderRadius: '6px',
              marginBottom: 'var(--space-xxl)',
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: 'var(--space-xl)',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-navy)' }}>
                    {featuredCase.caseNumber}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    backgroundColor: getCaseTypeLabel(featuredCase.caseType).bg,
                    color: getCaseTypeLabel(featuredCase.caseType).color
                  }}>
                    {getCaseTypeLabel(featuredCase.caseType).text}
                  </span>
                </div>
                <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '12px' }}>
                  {featuredCase.title}
                </h2>
                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                  {featuredCase.shortDescription}
                </p>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  <span>Method: <strong>{featuredCase.attackVector}</strong></span>
                  <span>•</span>
                  <span>Type: <strong>{featuredCase.incidentType}</strong></span>
                  <span>•</span>
                  {getDifficultyBadge(featuredCase.difficulty)}
                </div>
                <button
                  onClick={() => handleSelectCase(featuredCase.slug)}
                  style={{
                    backgroundColor: 'var(--accent-navy)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}
                >
                  Examine Case File &rarr;
                </button>
              </div>
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px dashed var(--color-border)',
                borderRadius: '6px',
                padding: 'var(--space-lg)',
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: 'var(--text-muted)'
              }}>
                <strong style={{ display: 'block', color: 'var(--accent-navy)', fontStyle: 'normal', marginBottom: '6px' }}>
                  Investigator Review Note:
                </strong>
                "{featuredCase.sourceSummary || 'Reviewing key methods of credential harvesting traps.'}"
              </div>
            </div>
          )}

          {/* ATTACK PATTERNS DIRECTORY */}
          <div style={{ 
            marginBottom: 'var(--space-xxl)', 
            borderTop: '1px solid var(--color-border)', 
            paddingTop: 'var(--space-xl)' 
          }}>
            <span style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--accent-navy)',
              fontWeight: '800',
              display: 'block',
              marginBottom: '8px'
            }}>
              Tactics Directory
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: 'var(--space-xl)' }}>
              Common Attack Patterns In Archive
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px 48px' }}>
              {patternsList.map((p, idx) => (
                <div
                  key={p.name}
                  onClick={() => handlePatternClick(p.name)}
                  style={{
                    padding: 'var(--space-md) 0',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    opacity: activePattern && activePattern !== p.name ? 0.6 : 1,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  className="editorial-pattern-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      0{idx + 1}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-navy)' }}>{p.icon}</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {p.name}
                    </strong>
                    {activePattern === p.name && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-navy)', backgroundColor: 'var(--accent-navy-light)', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 'bold' }}>
                        Active Filter
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', paddingLeft: '22px' }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* EDITORIAL CASES LIST INDEX */}
          <div>
            <div style={{ 
              borderBottom: '1px solid var(--color-border)', 
              paddingBottom: 'var(--space-md)', 
              marginBottom: 'var(--space-xl)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'baseline', 
                flexWrap: 'wrap', 
                gap: '12px',
                marginBottom: 'var(--space-md)'
              }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    color: 'var(--text-muted)',
                    fontWeight: 'bold',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Case Catalog
                  </span>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: 0 }}>
                    INCIDENT REGISTRY
                  </h2>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', backgroundColor: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '4px' }}>
                    {filteredCases.length} files
                  </span>
                  {completedCases.length > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      Audited
                    </span>
                  )}
                </div>
              </div>

              {/* Integrated Filter Row */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                flexWrap: 'wrap',
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-sm)',
                borderTop: '1px dashed var(--color-border)'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Filter:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        setActiveCategory(cat);
                        setActivePattern(null);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: activeCategory === cat ? '1px solid var(--accent-navy)' : '1px solid var(--color-border)',
                        backgroundColor: activeCategory === cat ? 'var(--accent-navy)' : 'var(--bg-white)',
                        color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: activeCategory === cat ? '600' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                  {activePattern && (
                    <button
                      onClick={() => setActivePattern(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--accent-navy)',
                        backgroundColor: 'var(--accent-navy-light)',
                        color: 'var(--accent-navy)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Pattern: {activePattern} &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--bg-secondary)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No archived incident files matching filters found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {filteredCases.map((cs) => {
                  const tagInfo = getCaseTypeLabel(cs.caseType);
                  const isCompleted = completedCases.includes(cs.slug);
                  
                  return (
                    <div
                      key={cs._id}
                      onClick={() => handleSelectCase(cs.slug)}
                      style={{
                        padding: 'var(--space-lg) 0',
                        backgroundColor: 'transparent',
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      className="incident-index-row"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
                            CASE FILE {cs.caseNumber.replace('CASE-', '')}
                          </span>
                          <span style={{
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontWeight: 'bold',
                            backgroundColor: tagInfo.bg,
                            color: tagInfo.color
                          }}>
                            {tagInfo.text}
                          </span>
                          {isCompleted && (
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--color-success)', 
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              backgroundColor: 'var(--color-success-light)',
                              padding: '2px 8px',
                              borderRadius: '3px'
                            }}>
                              Audited
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span>
                            Method: <strong>{cs.attackVector}</strong>
                          </span>
                          <span>•</span>
                          {getDifficultyBadge(cs.difficulty)}
                        </div>
                      </div>

                      <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: '4px 0 2px 0' }}>
                        {cs.title}
                      </h3>

                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: '1.6', maxWidth: '850px' }}>
                        {cs.shortDescription}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--accent-navy)', fontWeight: '600', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          Domain: <strong style={{ color: 'var(--text-secondary)' }}>{cs.incidentType}</strong>
                        </span>
                        <span className="interactive-link">
                          Examine Case File <span className="arrow">&rarr;</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {/* 4. CASE DETAILS NARRATIVE VIEW */}
      {!loading && selectedCase && (
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          {/* Top navigation */}
          <button
            onClick={handleReturnToArchive}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--accent-navy)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0
            }}
          >
            &larr; Return to Incident Archive
          </button>

          {caseLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <h3 style={{ color: 'var(--accent-navy)' }}>Loading Case File...</h3>
            </div>
          ) : (
            <div>
              {/* File header bar */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: 'var(--space-md) var(--space-lg)',
                marginBottom: 'var(--space-xl)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                fontSize: '0.85rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Reference Code
                  </span>
                  <strong style={{ color: 'var(--accent-navy)', fontSize: '1rem' }}>{selectedCase.caseNumber}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Archive Status
                  </span>
                  <strong style={{ color: getCaseTypeLabel(selectedCase.caseType).color, fontSize: '0.9rem' }}>
                    {getCaseTypeLabel(selectedCase.caseType).text}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Attack Method
                  </span>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{selectedCase.attackVector}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    Risk Difficulty
                  </span>
                  <div style={{ marginTop: '2px' }}>{getDifficultyBadge(selectedCase.difficulty)}</div>
                </div>
              </div>

              {/* Title Section */}
              <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Investigative Report
                </span>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginTop: '4px', marginBottom: '12px' }}>
                  {selectedCase.title}
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', marginBottom: '24px' }}>
                  {selectedCase.shortDescription}
                </p>
              </div>

              {/* INCIDENT PROGRESSION PATH (SVG Graphic) */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '20px',
                marginBottom: 'var(--space-xl)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '16px', letterSpacing: '0.5px' }}>
                  Incident Audit Progression Path
                </span>
                
                <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
                  <svg width="600" height="70" viewBox="0 0 600 70" style={{ minWidth: '500px' }}>
                    {/* Background Connection Lines */}
                    <line x1="80" y1="30" x2="200" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
                    <line x1="200" y1="30" x2="320" y2="30" stroke={decisionSubmitted ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={decisionSubmitted ? 'none' : '4 3'} />
                    <line x1="320" y1="30" x2="440" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
                    <line x1="440" y1="30" x2="560" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />

                    {/* Step 1: BAIT */}
                    <circle cx="80" cy="30" r="8" fill="var(--accent-navy)" />
                    <circle cx="80" cy="30" r="4" fill="white" />
                    <text x="80" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--accent-navy)">1. BAIT</text>

                    {/* Step 2: LEVERAGE */}
                    <circle cx="200" cy="30" r="8" fill="var(--accent-navy)" />
                    <circle cx="200" cy="30" r="4" fill="white" />
                    <text x="200" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--accent-navy)">2. LEVERAGE</text>

                    {/* Step 3: PIVOTAL CHOICE */}
                    <circle cx="320" cy="30" r="10" fill={decisionSubmitted ? (selectedCase.decisionPoints?.[0]?.options[selectedChoiceIdx]?.isCorrect ? 'var(--color-success)' : 'var(--color-error)') : '#f59e0b'} />
                    <text x="320" y="34" textAnchor="middle" fontSize="0.7rem" fontWeight="extrabold" fill="white">?</text>
                    <text x="320" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="#f59e0b">3. CHOICE</text>

                    {/* Step 4: CONSEQUENCE */}
                    <circle cx="440" cy="30" r="8" fill={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} />
                    {narrativeUnlocked && <circle cx="440" cy="30" r="4" fill="white" />}
                    <text x="440" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--text-muted)'}>4. IMPACT</text>

                    {/* Step 5: LAW */}
                    <circle cx="560" cy="30" r="8" fill={narrativeUnlocked ? 'var(--color-success)' : 'var(--color-border)'} />
                    {narrativeUnlocked && <circle cx="560" cy="30" r="4" fill="white" />}
                    <text x="560" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--color-success)' : 'var(--text-muted)'}>5. LAW</text>
                  </svg>
                </div>
              </div>

              {/* NARRATIVE SECTIONS */}
              <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--accent-navy)', paddingBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '20px' }}>
                  THE INCIDENT
                </h2>
                
                {/* Loop through sections up to the decision point if locked */}
                {selectedCase.narrativeSections?.map((section, idx) => {
                  // If narrative is locked, and we have decision points, pause before the last 2 sections
                  const totalSections = selectedCase.narrativeSections.length;
                  const isPostDecisionSection = idx >= Math.max(1, totalSections - 2);
                  
                  if (!narrativeUnlocked && isPostDecisionSection) {
                    return null;
                  }

                  return (
                    <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px' }}>
                        ### {section.heading}
                      </h3>
                      <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
                        {section.body}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* INTERACTIVE NARRATIVE PAUSE WIDGET */}
              {selectedCase.decisionPoints && selectedCase.decisionPoints.length > 0 && !narrativeUnlocked && (
                <div style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '2px solid var(--accent-navy)',
                  borderRadius: '6px',
                  padding: 'var(--space-xl)',
                  marginBottom: 'var(--space-2xl)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.25rem' }}>🛑</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      PAUSE — CRITICAL DECISION POINT
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.5' }}>
                    {selectedCase.decisionPoints[0].questionText}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {selectedCase.decisionPoints[0].options.map((opt, oIdx) => {
                      const isSelected = selectedChoiceIdx === oIdx;
                      
                      let btnBg = 'var(--bg-primary)';
                      let btnBorder = '1px solid var(--color-border)';
                      if (isSelected) {
                        btnBg = opt.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                        btnBorder = opt.isCorrect ? '1px solid #10b981' : '1px solid #ef4444';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={decisionSubmitted}
                          onClick={() => handleDecisionSubmit(oIdx, opt)}
                          style={{
                            textAlign: 'left',
                            padding: '14px 18px',
                            borderRadius: '6px',
                            backgroundColor: btnBg,
                            border: btnBorder,
                            color: 'var(--text-primary)',
                            fontSize: '1rem',
                            cursor: decisionSubmitted ? 'default' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}
                        >
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isSelected ? (opt.isCorrect ? '#10b981' : '#ef4444') : 'var(--bg-secondary)',
                            color: isSelected ? 'white' : 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span style={{ lineHeight: '1.4' }}>{opt.optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {decisionSubmitted && (
                    <div style={{
                      backgroundColor: selectedCase.decisionPoints[0].options[selectedChoiceIdx].isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                      border: selectedCase.decisionPoints[0].options[selectedChoiceIdx].isCorrect ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '4px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <strong style={{
                        display: 'block',
                        color: selectedCase.decisionPoints[0].options[selectedChoiceIdx].isCorrect ? '#10b981' : '#ef4444',
                        marginBottom: '4px',
                        fontSize: '1rem'
                      }}>
                        {selectedCase.decisionPoints[0].options[selectedChoiceIdx].isCorrect ? '✓ Safe Decision' : '✗ Unsafe Decision'}
                      </strong>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {decisionFeedback}
                      </p>
                    </div>
                  )}

                  {decisionSubmitted && (
                    <button
                      onClick={handleUnlockRemainingStory}
                      style={{
                        backgroundColor: 'var(--accent-navy)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        width: '100%'
                      }}
                    >
                      Audit Remaining Narrative & Timeline &rarr;
                    </button>
                  )}
                </div>
              )}

              {/* POST-DECISION DATA BLOCKS (UNLOCKED ONLY) */}
              {narrativeUnlocked && (
                <div className="unlocked-content-animation">
                  
                  {/* Narrative part 2 */}
                  {selectedCase.narrativeSections?.map((section, idx) => {
                    const totalSections = selectedCase.narrativeSections.length;
                    const isPostDecisionSection = idx >= Math.max(1, totalSections - 2);
                    
                    if (!isPostDecisionSection) return null;

                    return (
                      <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px' }}>
                          ### {section.heading}
                        </h3>
                        <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
                          {section.body}
                        </p>
                      </div>
                    );
                  })}

                  {/* VISUAL TIMELINE */}
                  {selectedCase.timeline && selectedCase.timeline.length > 0 && (
                    <div style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-2xl)' }}>
                      <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--accent-navy)', paddingBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '24px' }}>
                        INCIDENT TIMELINE
                      </h2>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '12px' }}>
                        {selectedCase.timeline.map((step, idx) => {
                          // Icon colors based on step type
                          let circleColor = 'var(--text-muted)';
                          let circleIcon = '●';
                          let nodeShadow = 'none';
                          if (step.type === 'contact') {
                            circleColor = '#3b82f6';
                            circleIcon = '✉';
                            nodeShadow = '0 0 0 3px rgba(59, 130, 246, 0.15)';
                          } else if (step.type === 'deception') {
                            circleColor = '#8b5cf6';
                            circleIcon = '⚡';
                            nodeShadow = '0 0 0 3px rgba(139, 92, 246, 0.15)';
                          } else if (step.type === 'decision') {
                            circleColor = '#f59e0b';
                            circleIcon = '⌥';
                            nodeShadow = '0 0 0 3px rgba(245, 158, 11, 0.15)';
                          } else if (step.type === 'escalation') {
                            circleColor = '#ef4444';
                            circleIcon = '🚨';
                            nodeShadow = '0 0 0 3px rgba(239, 68, 68, 0.15)';
                          } else if (step.type === 'discovery') {
                            circleColor = '#10b981';
                            circleIcon = '✓';
                            nodeShadow = '0 0 0 3px rgba(16, 185, 129, 0.15)';
                          }

                          return (
                            <div key={idx} className="timeline-step" style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                              {/* Line connector */}
                              {idx < selectedCase.timeline.length - 1 && (
                                <div style={{
                                  position: 'absolute',
                                  left: '11px',
                                  top: '24px',
                                  bottom: '-12px',
                                  width: '0',
                                  borderLeft: '2px dashed var(--color-border)',
                                  zIndex: 1
                                }} />
                              )}
                              
                              {/* Circle icon */}
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: circleColor,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                zIndex: 2,
                                fontWeight: 'bold',
                                flexShrink: 0,
                                boxShadow: nodeShadow
                              }}>
                                {circleIcon}
                              </div>

                              {/* Details */}
                              <div style={{ paddingBottom: '24px', flex: 1 }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--accent-navy)', backgroundColor: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                                    {step.time}
                                  </span>
                                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{step.label}</strong>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* WHY DID THIS WORK & WARNING SIGNS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
                    {/* Deception Analysis */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                        Why the Situation was Convincing
                      </h3>
                      
                      {/* Attacker Manipulation Vectors Rating Progress Bars */}
                      <div style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--color-border)',
                        padding: '16px',
                        borderRadius: '6px',
                        marginBottom: '16px'
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px', letterSpacing: '0.5px' }}>
                          Attacker Manipulation Vectors
                        </span>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px' }}>
                              <span>⏳ Urgency Pressure</span>
                              <span style={{ color: '#f59e0b' }}>Severe</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px' }}>
                              <div style={{ width: '85%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '2px' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px' }}>
                              <span>👮 Authority Leverage</span>
                              <span style={{ color: 'var(--color-error)' }}>Critical</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px' }}>
                              <div style={{ width: '95%', height: '100%', backgroundColor: 'var(--color-error)', borderRadius: '2px' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', marginBottom: '3px' }}>
                              <span>🚨 Fear Induction</span>
                              <span style={{ color: 'var(--color-error)' }}>Severe</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-border)', borderRadius: '2px' }}>
                              <div style={{ width: '75%', height: '100%', backgroundColor: 'var(--color-error)', borderRadius: '2px' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedCase.attackerObjectives && (
                          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              Attacker Objectives
                            </span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {selectedCase.attackerObjectives.map((obj, oIdx) => (
                                <span key={oIdx} style={{ fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px' }}>
                                  {obj}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                          The attacker leveraged specific behavioral manipulation triggers:
                        </p>
                        <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Authority & Credibility:</strong> Use of forged agency marks, service replicas, or official-sounding scripts.
                          </li>
                          <li style={{ marginBottom: '6px' }}>
                            <strong>Emotional Hijacking:</strong> Creating time blocks or threats of arrest/locking to rush the victim's critical reasoning.
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Warning Signs block */}
                    <div>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                        Warning Signs Present
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedCase.warningSigns?.map((sign, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--color-error)', fontWeight: 'bold', fontSize: '1.1rem' }}>!</span>
                            <div>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block' }}>{sign.title}</strong>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sign.explanation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* IMPACT AUDIT */}
                  {selectedCase.impact && (
                    <div style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      padding: 'var(--space-lg)',
                      marginBottom: 'var(--space-2xl)'
                    }}>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '16px' }}>
                        Incident Impact Summary
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                            Financial Loss
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.financial}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                            Account Status
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.account}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                            Privacy/Data
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.privacy}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>
                            Operational
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.operational}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WHAT COULD HAVE CHANGED THE OUTCOME */}
                  <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--accent-navy)', paddingBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '16px' }}>
                      PREVENTION LESSONS
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedCase.preventionLessons?.map((lesson, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                          <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                            {lesson}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LEGAL CONTEXT badge linkages */}
                  {selectedCase.legalContext && selectedCase.legalContext.length > 0 && (
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '6px',
                      padding: 'var(--space-lg)',
                      marginBottom: 'var(--space-2xl)'
                    }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Applicable Legal Provisions (IT Act, 2000)
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        The actions documented in this incident profile violate specific provisions of the Information Technology Act. Click a provision to read details:
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {selectedCase.legalContext.map((code, idx) => (
                          <Link
                            key={idx}
                            to="/laws"
                            style={{
                              backgroundColor: 'var(--accent-navy)',
                              color: 'white',
                              textDecoration: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            {code} Details &rarr;
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OFFICIAL SOURCES block */}
                  {selectedCase.sources && selectedCase.sources.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px', marginBottom: 'var(--space-xl)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                        Official Incident Sources:
                      </span>
                      {selectedCase.sources.map((src, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          • {src.title} — <strong>{src.authority}</strong> ({src.publicationDate || 'Undated'}) | {' '}
                          {src.url ? (
                            <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-navy)', textDecoration: 'underline' }}>
                              View Advisory Source
                            </a>
                          ) : (
                            <span>Official Registry Record</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* RELATED CRIME & ACTIONS */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '2px solid var(--accent-navy)',
                    paddingTop: '20px',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    {selectedCase.relatedCrimes && selectedCase.relatedCrimes.length > 0 ? (
                      <div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Read threat characteristics in:</span>
                        <div style={{ marginTop: '4px' }}>
                          <Link
                            to="/crimes"
                            style={{
                              color: 'var(--accent-navy)',
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              textDecoration: 'underline'
                            }}
                          >
                            Explore Threat Profile: {selectedCase.incidentType} &rarr;
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div />
                    )}

                    <button
                      onClick={handleReturnToArchive}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--text-primary)',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Close File Audit
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Cases;
