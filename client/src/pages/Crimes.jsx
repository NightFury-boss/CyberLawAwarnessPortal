import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';

function Crimes() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Phishing & Messaging Scams':
      case 'Online Deception':
        return 'var(--color-info)';
      case 'Financial Fraud':
      case 'E-commerce & Marketplace Fraud':
        return 'var(--accent-navy)';
      case 'Identity & Credential Theft':
        return 'var(--color-border-dark)';
      case 'Online Harassment & Abuse':
      case 'Malware & Device Threats':
        return 'var(--color-danger)';
      default:
        return 'var(--accent-navy)';
    }
  };

  const [crimes, setCrimes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recReason, setRecReason] = useState('');
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const crimesSearchConfig = {
    title: 50,
    category: 5,
    attackVectors: 3,
    warningSigns: 2,
    attackerTactics: 1,
    shortDescription: 1,
    whatIsIt: 1,
    howItWorks: 1,
    actionSteps: 1,
    avoidSteps: 1,
    ifTargetedSteps: 1,
    keywords: 5
  };

  const [showFilters, setShowFilters] = useState(false);

  const getRelevanceScore = (c, query) => {
    if (!query.trim()) return 0;
    const q = query.toLowerCase().trim();
    let score = 0;

    // Title / exact name matches
    if (c.title.toLowerCase() === q) score += 50;
    else if (c.title.toLowerCase().includes(q)) score += 10;

    // Category / keyword matches
    if (c.category?.toLowerCase().includes(q)) score += 5;
    if (c.keywords?.some(k => k.toLowerCase().includes(q))) score += 5;

    // Attack vector
    if (c.attackVectors?.some(v => v.toLowerCase().includes(q))) score += 3;

    // Warning signs
    if (c.warningSigns?.some(ws => ws.title.toLowerCase().includes(q) || ws.description.toLowerCase().includes(q))) score += 2;

    // Attacker tactics
    if (c.attackerTactics?.some(tac => tac.tactic.toLowerCase().includes(q) || tac.example.toLowerCase().includes(q))) score += 1;

    // Action / avoidance
    if (c.actionSteps?.some(s => s.toLowerCase().includes(q))) score += 1;
    if (c.avoidSteps?.some(s => s.toLowerCase().includes(q))) score += 1;
    if (c.ifTargetedSteps?.some(s => s.toLowerCase().includes(q))) score += 1;

    return score;
  };


  // Interactive Scenario States ("What Would You Do?")
  const [selectedScenarioOption, setSelectedScenarioOption] = useState(null);
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false);

  // Quick Check States
  const [quickCheckAnswers, setQuickCheckAnswers] = useState({});
  const [quickCheckChecked, setQuickCheckChecked] = useState(false);

  // User Learning Progress (Stored in localStorage for persistency)
  const [completedCrimes, setCompletedCrimes] = useState([]);
  const [recentlyExplored, setRecentlyExplored] = useState([]);

  const categories = [
    'All',
    'Phishing & Messaging Scams',
    'Financial Fraud',
    'Identity & Credential Theft',
    'Online Deception',
    'Malware & Device Threats',
    'Online Harassment & Abuse',
    'Scams & Impersonation',
    'Job & Recruitment Scams',
    'E-commerce & Marketplace Fraud',
    'Account Takeover'
  ];

  useEffect(() => {
    fetchInitialData();
    // Load local progress
    const savedCompletions = localStorage.getItem('completed_crimes');
    if (savedCompletions) {
      setCompletedCrimes(JSON.parse(savedCompletions));
    }
    const savedRecent = localStorage.getItem('recently_explored_crimes');
    if (savedRecent) {
      setRecentlyExplored(JSON.parse(savedRecent));
    }
  }, []);

  useEffect(() => {
    if (crimes.length > 0 && window.location.hash) {
      const slug = window.location.hash.substring(1);
      const matched = crimes.find(c => c.slug === slug);
      if (matched) {
        handleSelectCrime(matched);
      }
    }
  }, [crimes]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const allCrimes = await api.getCrimes();
      setCrimes(allCrimes);

      // Recommendations
      try {
        const recsData = await api.getCrimeRecommendations();
        setRecommendations(recsData.recommendations || []);
        setRecReason(recsData.reason || '');
      } catch (err) {
        console.warn('Failed to load personalized recommendations, using defaults.');
        // Fallback defaults
        const defaults = allCrimes.filter(c => 
          ['phishing', 'upi-payment-fraud', 'qr-code-scams'].includes(c.slug)
        );
        setRecommendations(defaults);
        setRecReason('Start with the most common threats.');
      }
    } catch (err) {
      setError('Failed to load threat library data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectCrime = (crime) => {
    setSelectedCrime(crime);
    setSelectedScenarioOption(null);
    setScenarioSubmitted(false);
    setQuickCheckAnswers({});
    setQuickCheckChecked(false);

    // Save recently explored
    let updatedRecent = [crime, ...recentlyExplored.filter(x => x.slug !== crime.slug)];
    updatedRecent = updatedRecent.slice(0, 4); // Limit to 4 recent
    setRecentlyExplored(updatedRecent);
    localStorage.setItem('recently_explored_crimes', JSON.stringify(updatedRecent));

    // Scroll to top
    window.scrollTo(0, 0);
  };

  const handleBackToLanding = () => {
    setSelectedCrime(null);
    // Fetch fresh crimes list in case search was dirty
    fetchInitialData();
  };

  // Toggle crime completion status
  const handleToggleComplete = (slug) => {
    let updated;
    if (completedCrimes.includes(slug)) {
      updated = completedCrimes.filter(x => x !== slug);
    } else {
      updated = [...completedCrimes, slug];
    }
    setCompletedCrimes(updated);
    localStorage.setItem('completed_crimes', JSON.stringify(updated));
  };


  // Quick Check handlers
  const handleQuickCheckSelect = (qIdx, oIdx) => {
    setQuickCheckAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateQuickCheckScore = () => {
    let correct = 0;
    selectedCrime.quickCheckQuestions.forEach((q, idx) => {
      if (quickCheckAnswers[idx] === q.correctOptionIndex) {
        correct++;
      }
    });
    return correct;
  };

  // Filter local crimes list by category and search query
  const filteredCrimes = searchItems(
    crimes,
    searchQuery,
    crimesSearchConfig,
    (item) => activeCategory === 'All' || item.category === activeCategory
  );

  // Red Flag level helper
  const getRedFlagMeter = (level) => {
    let filled = 0;
    let color = 'var(--text-muted)';
    if (level === 'Low') { filled = 3; color = 'var(--color-success)'; }
    else if (level === 'Moderate') { filled = 5; color = '#cca000'; }
    else if (level === 'High') { filled = 7; color = '#e67300'; }
    else if (level === 'Very High' || level === 'Critical') { filled = 10; color = 'var(--color-error)'; }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{
              width: '6px', height: '14px', borderRadius: '1px',
              backgroundColor: i < filled ? color : 'var(--color-border)'
            }} />
          ))}
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: '700', color, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{level}</span>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)' }}>
      {error && <div className="alert alert-error">{error}</div>}

      {/* LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
          <h3 style={{ color: 'var(--accent-navy)' }}>Opening Threat Library...</h3>
        </div>
      )}

      {/* 1. LANDING PORTAL VIEW (selectedCrime is null) */}
      {!loading && !selectedCrime && (
        <div>
          {/* Header block */}
          <EditorialPageHeader
            eyebrow="Threat Directory"
            title="Cybercrime Library"
            subtitle='"Know how the attack works before it reaches you."'
            description="Explore common cybercrimes, understand the warning signs, see how attacks unfold, and learn what to do when something feels wrong."
          >
            <WorkspaceBreadcrumb />
          </EditorialPageHeader>

          {/* Recommendations Block (Personalized) */}
          {recommendations.length > 0 && (
            <div style={{
              backgroundColor: 'var(--accent-navy-light)',
              borderLeft: '4px solid var(--accent-navy)',
              padding: 'var(--space-lg)',
              borderRadius: '4px',
              marginBottom: 'var(--space-xl)'
            }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold' }}>
                RECOMMENDED FOR YOU
              </h3>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                {recReason}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                {recommendations.map((rec) => (
                  <div 
                    key={rec._id} 
                    onClick={() => handleSelectCrime(rec)}
                    className="editorial-card" 
                    style={{ cursor: 'pointer', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)' }}
                  >
                    <span className="tag" style={{ fontSize: '0.75rem', marginBottom: '8px' }}>{rec.category}</span>
                    <h4 style={{ fontSize: '1.25rem', margin: '4px 0 8px 0', color: 'var(--accent-navy)' }}>{rec.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {rec.shortDescription}
                    </p>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: '500', color: 'var(--accent-navy)' }}>Threat Profile &rarr;</span>
                      {completedCrimes.includes(rec.slug) && <span style={{ color: 'var(--color-success)' }}>Completed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <PortalSearch
            placeholder="Search crimes, warning signs, or attack methods"
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            onClear={() => setSearchQuery('')}
            results={filteredCrimes}
            resultTypeLabel="threats found"
            emptyHeader="NO MATCHING THREATS"
            emptyText="Try searching for a different crime name, warning sign, or attack method."
            suggestions={['OTP', 'QR', 'phishing', 'fake support', 'account takeover', 'identity']}
            showFiltersToggle={true}
            showFilters={showFilters}
            onFiltersToggle={() => setShowFilters(prev => !prev)}
            filtersDrawerContent={
              <div>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Filter by Threat Domain
                </h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border-dark)',
                        backgroundColor: activeCategory === cat ? 'var(--accent-navy)' : 'var(--bg-white)',
                        color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            }
            activeFiltersContent={
              (activeCategory !== 'All' || searchQuery) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Filters:</span>
                    {activeCategory !== 'All' && <span style={{ backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{activeCategory}</span>}
                    {searchQuery && <span style={{ backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Search: "{searchQuery}"</span>}
                  </div>
                  <button
                    onClick={() => {
                      setActiveCategory('All');
                      setSearchQuery('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-navy)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Reset
                  </button>
                </div>
              )
            }
          />

          {/* Recently Explored Row */}
          {recentlyExplored.length > 0 && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontWeight: '600' }}>
                Recently Viewed Threats
              </h3>
              <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                {recentlyExplored.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => handleSelectCrime(item)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid of Threat Profiles */}
          <div>
                        {filteredCrimes.length > 0 && (
              <div className="crimes-reference-directory" role="list" aria-label="Cybercrime threat directory">
                {filteredCrimes.map((crime, index) => {
                  const isCompleted = completedCrimes.includes(crime.slug);
                  const attackMethods = crime.attackVectors?.join(', ') || 'Digital Communications';
                  const primarySignal = crime.warningSigns?.[0]?.title || crime.attackerTactics?.[0]?.tactic || 'Deceptive impersonation & urgency';

                  return (
                    <article
                      key={crime._id}
                      role="listitem"
                      tabIndex={0}
                      onClick={() => handleSelectCrime(crime)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelectCrime(crime);
                        }
                      }}
                      className="crime-index-entry"
                      aria-labelledby={`crime-title-${crime.slug}`}
                    >
                      {/* Main Column: Identifier, Tag, Title, and Concise Description */}
                      <div className="crime-index-main">
                        <div className="crime-index-meta">
                          <span className="crime-index-ref font-mono">
                            REF #{String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="crime-index-tag">{crime.category}</span>
                          {isCompleted && (
                            <span className="crime-index-done font-mono">✓ Reviewed</span>
                          )}
                        </div>
                        <h3 id={`crime-title-${crime.slug}`} className="crime-index-title">
                          {crime.title}
                        </h3>
                        <p className="crime-index-desc">
                          {crime.shortDescription}
                        </p>
                      </div>

                      {/* Middle Column: Structured Signals & Attack Methods */}
                      <div className="crime-index-signals">
                        <div className="crime-signal-row">
                          <span className="crime-signal-label">Methods:</span>
                          <span className="crime-signal-val font-mono">{attackMethods}</span>
                        </div>
                        <div className="crime-signal-row">
                          <span className="crime-signal-label">Key Signal:</span>
                          <span className="crime-signal-val">{primarySignal}</span>
                        </div>
                      </div>

                      {/* Action Column */}
                      <div className="crime-index-action" aria-hidden="true">
                        <span>Threat Profile</span>
                        <span className="link-arrow">&rarr;</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Quiz & Legal linkages footer box */}
          <div style={{
            marginTop: 'var(--space-xl)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            padding: 'var(--space-xl)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-xl)',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)', fontWeight: 'bold' }}>
                Test Your Shield
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-md)', lineHeight: '1.5' }}>
                Review scenarios, identify social engineering hooks, and gauge your readiness against online payment traps.
              </p>
              <Link to="/quizzes" className="btn btn-primary" style={{ display: 'inline-block' }}>
                Quiz Center
              </Link>
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-xs)', fontWeight: 'bold' }}>
                Interactive Scenarios
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-md)', lineHeight: '1.5' }}>
                Simulate standard system notifications and alerts. Understand where your authentication inputs can expose profiles.
              </p>
              <Link to="/dashboard" className="btn btn-secondary" style={{ display: 'inline-block' }}>
                Practice Simulator
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. DETAILED THREAT PROFILE VIEW (selectedCrime is active) */}
      {!loading && selectedCrime && (
        <div>
          <WorkspaceBreadcrumb
            currentItem={selectedCrime.title}
            onParentClick={handleBackToLanding}
          />

          {/* Top Return Banner */}
          <button
            onClick={handleBackToLanding}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-navy)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            &larr; Back to Threat Directory
          </button>

          {/* 1. Header Profile block */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-lg)',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            flexWrap: 'wrap'
          }}>
            <div>
              <span className="tag" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{selectedCrime.category}</span>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: 'var(--space-xs)', color: 'var(--accent-navy)' }}>
                {selectedCrime.title}
              </h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '800px', marginTop: '4px', lineHeight: '1.6' }}>
                {selectedCrime.shortDescription}
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-md)',
              borderRadius: '4px',
              minWidth: '240px'
            }}>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                Threat Risk Level
              </h4>
              {getRedFlagMeter(selectedCrime.redFlagLevel || 'High')}

              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '16px 0 8px 0', fontWeight: '600' }}>
                Primary Methods
              </h4>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {selectedCrime.attackVectors?.map((vec) => (
                  <span key={vec} style={{ fontSize: '0.75rem', backgroundColor: 'var(--accent-navy-light)', color: 'var(--accent-navy)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    {vec}
                  </span>
                )) || <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>Digital Systems</span>}
              </div>
            </div>
          </div>

          {/* Navigation shortcut anchors */}
          <div style={{
            display: 'flex',
            gap: 'var(--space-md)',
            marginBottom: 'var(--space-xl)',
            borderBottom: '1px solid var(--color-border-light)',
            paddingBottom: 'var(--space-sm)',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            <a href="#overview" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>1. Overview</a>
            <a href="#lifecycle" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>2. How it Unfolds</a>
            <a href="#indicators" style={{ color: 'var(--accent-navy)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>3. Critical Indicators</a>
            <a href="#prevention" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>4. Prevention Guidelines</a>
            <a href="#scenario" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>5. Practice Decision</a>
            <a href="#legal" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>6. Legal Context</a>
          </div>

          {/* SECTION 1: OVERVIEW */}
          <section id="overview" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              1. Threat Profile & Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-navy)', marginBottom: '8px' }}>What is it?</h3>
                <p style={{ color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: 'var(--space-md)' }}>
                  {selectedCrime.whatIsIt}
                </p>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-navy)', marginBottom: '8px' }}>Operational Concept</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: '1.6' }}>
                  {selectedCrime.howItWorks}
                </p>
              </div>

              {/* Attacker Objectives */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
                  ATTACKER OBJECTIVES
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  What the attacker attempts to compromise:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedCrime.attackerObjective || ['Money', 'Credentials']).map((obj) => (
                    <div 
                      key={obj} 
                      style={{ 
                        padding: '10px 14px', 
                        backgroundColor: 'var(--bg-primary)', 
                        border: '1px solid var(--color-border-light)', 
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: 'var(--accent-navy)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      {obj}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: ATTACK LIFECYCLE */}
          <section id="lifecycle" style={{ marginBottom: 'var(--space-xxl)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-xl) 0', backgroundColor: 'transparent' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              2. How the Attack Unfolds
            </h2>
            <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.95rem' }}>
              "Knowing what a crime is matters. Recognizing how it begins matters too."
            </p>
            <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.95rem' }}>
              Conceptual timeline showing step-by-step triggers of a standard attack profile:
            </p>

            {/* Timelines block */}
            <div className="lifecycle-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {(selectedCrime.attackLifecycle && selectedCrime.attackLifecycle.length > 0 ? selectedCrime.attackLifecycle : [
                { stepNumber: 1, label: 'Entry point / Contact', description: 'Attacker makes connection via SMS, Email, or Web Spoof.' },
                { stepNumber: 2, label: 'Urgency / Leverage', description: 'Attacker asserts that your accounts will lock, or offers cash payouts.' },
                { stepNumber: 3, label: 'Authentication trap', description: 'Attacker demands entry of credentials, PINs, or downloading files.' },
                { stepNumber: 4, label: 'Account Compromise / Theft', description: 'Attacker hijack logs or debits balances instantly.' }
              ]).map((step, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    gap: 'var(--space-md)',
                    alignItems: 'flex-start',
                    paddingLeft: '12px',
                    borderLeft: '3px solid var(--accent-navy-light)',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-navy)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {step.stepNumber || idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', margin: '2px 0 4px 0', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
                      {step.label}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attacker tactics */}
            {selectedCrime.attackerTactics && selectedCrime.attackerTactics.length > 0 && (
              <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-lg)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
                  DECEPTION TACTICS
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                  {selectedCrime.attackerTactics.map((tac, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border-light)' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--accent-navy)', fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {tac.tactic}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0' }}>
                        <strong>Concept:</strong> "{tac.example}"
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                        <em>Why it works:</em> {tac.whyItWorks}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <EditorialRule spacing="lg" />

          {/* SECTION 3: CRITICAL INDICATORS TO NOTICE */}
          <section id="indicators" style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <span className="editorial-eyebrow" style={{ color: 'var(--color-portal-blue, #2563eb)' }}>
                DECEPTION ANALYSIS & SIGNALS
              </span>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', margin: '4px 0 8px 0' }}>
                3. Critical Indicators to Notice
              </h2>
              <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem', maxWidth: '720px' }}>
                Operational anatomy of this threat: recognize typical deceptive signals, inspect warning indicators, and apply verified safer responses.
              </p>
            </div>

            {/* 4-STAGE FLOW: Threat -> Typical Signal -> What to Verify -> Safer Response */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              
              {/* STAGE 1: THREAT DEFINITION & ATTACK VECTOR */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: 'var(--space-md) var(--space-lg)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Threat Profile
                  </span>
                  <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--accent-navy)' }}>
                    {selectedCrime.title}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '3px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', fontWeight: '600' }}>
                    Domain: {selectedCrime.category}
                  </span>
                  {selectedCrime.attackVectors?.slice(0, 2).map((vec, vIdx) => (
                    <span key={vIdx} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '3px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', color: 'var(--text-secondary)' }}>
                      Vector: {vec}
                    </span>
                  ))}
                </div>
              </div>

              {/* STAGE 2: TYPICAL SIGNAL (Authentic Quotation styled like DigitalMomentsSection) */}
              {selectedCrime.spotTheFlags?.messageText && (
                <div 
                  className="digital-moment-item"
                  style={{
                    backgroundColor: 'var(--bg-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: 'var(--space-lg)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-warning)', letterSpacing: '0.05em' }}>
                      Typical Deceptive Signal
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Simulated Communication Sample
                    </span>
                  </div>

                  <blockquote style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: '4px solid var(--accent-navy)',
                    padding: '14px 18px',
                    margin: '8px 0 14px 0',
                    fontSize: '0.95rem',
                    lineHeight: '1.65',
                    fontStyle: 'italic',
                    color: 'var(--text-primary)',
                    borderRadius: '0 4px 4px 0'
                  }}>
                    &ldquo;{selectedCrime.spotTheFlags.messageText}&rdquo;
                  </blockquote>

                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Notice how deceptive messages blend official-sounding terminology with abrupt consequences to bypass verification habits.
                  </p>
                </div>
              )}

              {/* STAGE 3: WHAT TO VERIFY (Deception markers breakdown) */}
              <div style={{
                backgroundColor: 'var(--bg-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: 'var(--space-lg)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-portal-blue, #2563eb)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-navy)', margin: 0, fontWeight: '700' }}>
                    What to Verify: Critical Deception Markers
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                  {(selectedCrime.spotTheFlags?.clickableFlags || selectedCrime.warningSigns || []).map((flag, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '4px',
                        padding: '12px 14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'rgba(211, 84, 0, 0.1)',
                          color: 'var(--color-warning)'
                        }}>
                          Marker {fIdx + 1}
                        </span>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--accent-navy)' }}>
                          {flag.textSegment ? `"${flag.textSegment}"` : flag.title}
                        </strong>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                        {flag.explanation || flag.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STAGE 4: SAFER RESPONSE (Independent verification protocol) */}
              <div style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--color-border)',
                borderLeft: '4px solid var(--color-success)',
                borderRadius: '6px',
                padding: 'var(--space-lg)'
              }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1a6234', fontWeight: '700', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Safer Response & Verification Protocol
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: '1.55' }}>
                  Pause immediately before taking action. Apply these authoritative verification rules:
                </p>
                <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.88rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                  {(selectedCrime.actionSteps || [
                    'Never use phone numbers or web addresses provided within the unverified message.',
                    'Navigate independently to the registered entity portal or call the official customer care number.',
                    'Check whether the entity communicates through official registered sender headers.'
                  ]).slice(0, 3).map((step, sIdx) => (
                    <li key={sIdx} style={{ marginBottom: '4px' }}>{step}</li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

          <EditorialRule spacing="lg" />

          {/* SECTION 4: ACTIONS CHECKLIST */}
          <section id="prevention" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              4. Prevention & Response Guidelines
            </h2>

            {/* Grid of Do/Avoid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-lg)',
              marginBottom: 'var(--space-lg)'
            }}>
              <div style={{
                backgroundColor: 'var(--color-success-light)',
                borderLeft: '4px solid var(--color-success)',
                padding: 'var(--space-lg)',
                borderRadius: '4px'
              }}>
                <h3 style={{ color: '#1a6234', fontSize: '1.15rem', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                  Actions to Take (Defenses)
                </h3>
                <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {selectedCrime.actionSteps?.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                backgroundColor: 'var(--color-error-light)',
                borderLeft: '4px solid var(--color-error)',
                padding: 'var(--space-lg)',
                borderRadius: '4px'
              }}>
                <h3 style={{ color: '#7b1c12', fontSize: '1.15rem', display: 'flex', gap: '6px', alignItems: 'center', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                  Actions to Avoid (Risks)
                </h3>
                <ul style={{ paddingLeft: 'var(--space-md)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {selectedCrime.avoidSteps?.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* What to do if targeted */}
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--color-border)',
              padding: 'var(--space-lg)',
              borderRadius: '4px'
            }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                IF YOU THINK YOU HAVE BEEN TARGETED:
              </h3>
              <ol style={{ paddingLeft: 'var(--space-md)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                {selectedCrime.ifTargetedSteps && selectedCrime.ifTargetedSteps.length > 0 ? (
                  selectedCrime.ifTargetedSteps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>
                  ))
                ) : (
                  <>
                    <li style={{ marginBottom: '6px' }}>Stop all communications with the suspected fraud source immediately.</li>
                    <li style={{ marginBottom: '6px' }}>Do not wire funds or input security confirmation keys.</li>
                    <li style={{ marginBottom: '6px' }}>Secure credentials: change linked passwords and log out active sessions.</li>
                    <li style={{ marginBottom: '6px' }}>Call <strong>1930</strong> (National helpline) within 1 hour if payment fraud is active.</li>
                  </>
                )}
              </ol>
            </div>
          </section>

          {/* SECTION 5: WHAT WOULD YOU DO SCENARIO */}
          {selectedCrime.whatWouldYouDo?.questionText && (
            <section id="scenario" style={{ marginBottom: 'var(--space-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-lg)', borderRadius: '6px', backgroundColor: 'var(--bg-white)' }}>
              <div style={{ marginBottom: 'var(--space-sm)' }}>
                <span className="editorial-eyebrow" style={{ color: 'var(--color-portal-blue, #2563eb)' }}>
                  DECISION CHECKPOINT
                </span>
                <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-navy)', margin: '4px 0 6px 0', fontWeight: 'bold' }}>
                  5. Practical Decision: What Would You Do?
                </h3>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                {selectedCrime.whatWouldYouDo.questionText}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCrime.whatWouldYouDo.options.map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={scenarioSubmitted}
                    onClick={() => setSelectedScenarioOption(idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      border: selectedScenarioOption === idx ? '2px solid var(--accent-navy)' : '1px solid var(--color-border)',
                      backgroundColor: selectedScenarioOption === idx ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: selectedScenarioOption === idx ? '600' : '400',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {opt.optionText}
                  </button>
                ))}
              </div>

              {!scenarioSubmitted && selectedScenarioOption !== null && (
                <button
                  onClick={() => setScenarioSubmitted(true)}
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  Submit Decision
                </button>
              )}

              {scenarioSubmitted && (
                <div style={{
                  marginTop: 'var(--space-md)',
                  padding: 'var(--space-md)',
                  backgroundColor: selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? 'var(--color-success-light)' : 'var(--color-error-light)',
                  borderLeft: `4px solid ${selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? 'var(--color-success)' : 'var(--color-error)'}`,
                  borderRadius: '4px'
                }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? '#1a6234' : '#7b1c12' }}>
                    {selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? 'CORRECT VERIFICATION' : 'UNSAFE REFLEX'}
                  </h4>
                  <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                    {selectedCrime.whatWouldYouDo.options[selectedScenarioOption].explanation}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* SECTION: MYTH VS FACT */}
          {selectedCrime.mythFacts && selectedCrime.mythFacts.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)', fontWeight: 'bold' }}>
                Myth vs. Fact
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                {selectedCrime.mythFacts.map((mf, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: 'var(--color-error-light)', padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-error)', textTransform: 'uppercase' }}>Myth</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', fontWeight: '600' }}>"{mf.myth}"</p>
                    </div>
                    <div style={{ backgroundColor: 'var(--color-success-light)', padding: '12px 16px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-success)', textTransform: 'uppercase' }}>Fact</span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.95rem', lineHeight: '1.5' }}>{mf.fact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <EditorialRule spacing="lg" />

          {/* SECTION 6: LEGAL CONTEXT */}
          <section id="legal" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              6. Relevant Legal Context
            </h2>
            <p className="text-muted" style={{ marginBottom: 'var(--space-md)', fontSize: '0.95rem' }}>
              Under Indian cyber law, the following provisions govern behaviors associated with this threat profile:
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              {selectedCrime.legalContext?.map((law, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--color-border)', 
                    padding: 'var(--space-md)', 
                    borderRadius: '4px',
                    minWidth: '260px',
                    flex: 1
                  }}
                >
                  <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '8px' }}>
                    {law}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Governs identity hijacking, cloned sites, or device intrusions related to this threat.
                  </p>
                  <Link 
                    to={getContextPath('/laws')} 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    View IT Act &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: QUICK CHECK QUIZ */}
          {selectedCrime.quickCheckQuestions && selectedCrime.quickCheckQuestions.length > 0 && (
            <section id="quickcheck" style={{ marginBottom: 'var(--space-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
                5. Quick Check: Think You Can Spot It?
              </h2>
              <p className="text-muted" style={{ marginBottom: 'var(--space-lg)', fontSize: '0.95rem' }}>
                Complete this micro-quiz to consolidate what you have reviewed:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                {selectedCrime.quickCheckQuestions.map((q, qIdx) => (
                  <div key={qIdx} style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <h4 style={{ fontSize: '1.05rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: 'var(--space-sm)' }}>
                      Question {qIdx + 1}: {q.questionText}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quickCheckAnswers[qIdx] === oIdx;
                        const isCorrect = oIdx === q.correctOptionIndex;
                        let borderStyle = '1px solid var(--color-border)';
                        let bg = 'var(--bg-primary)';

                        if (quickCheckChecked) {
                          if (isCorrect) {
                            borderStyle = '2px solid var(--color-success)';
                            bg = 'var(--color-success-light)';
                          } else if (isSelected) {
                            borderStyle = '2px solid var(--color-error)';
                            bg = 'var(--color-error-light)';
                          }
                        } else if (isSelected) {
                          borderStyle = '2px solid var(--accent-navy)';
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={quickCheckChecked}
                            onClick={() => handleQuickCheckSelect(qIdx, oIdx)}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: '4px',
                              border: borderStyle,
                              backgroundColor: bg,
                              cursor: 'pointer',
                              fontSize: '0.88rem'
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quickCheckChecked && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {!quickCheckChecked ? (
                <button
                  onClick={() => setQuickCheckChecked(true)}
                  disabled={Object.keys(quickCheckAnswers).length < selectedCrime.quickCheckQuestions.length}
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-lg)' }}
                >
                  Verify Answers
                </button>
              ) : (
                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    Score: {calculateQuickCheckScore()} / {selectedCrime.quickCheckQuestions.length}
                  </span>
                  <button
                    onClick={() => {
                      setQuickCheckAnswers({});
                      setQuickCheckChecked(false);
                    }}
                    className="btn btn-secondary"
                  >
                    Retry Quiz
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Bottom Action Section */}
          <div style={{
            marginTop: 'var(--space-xl)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-lg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-md)'
          }}>
            <div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Completion Status:</span>
              <button
                onClick={() => handleToggleComplete(selectedCrime.slug)}
                className={`btn ${completedCrimes.includes(selectedCrime.slug) ? 'btn-secondary' : 'btn-primary'}`}
                style={{ marginLeft: '12px', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {completedCrimes.includes(selectedCrime.slug) ? 'Mark Incomplete' : 'Mark Topic Completed'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleBackToLanding}
                className="btn btn-secondary"
              >
                Back to Library
              </button>
              <Link to="/quizzes" className="btn btn-primary">
                Practice Knowledge Quizzes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Crimes;
