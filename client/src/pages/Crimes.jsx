import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Crimes() {
  const [crimes, setCrimes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recReason, setRecReason] = useState('');
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Interactive Game States ("Spot the Red Flags")
  const [foundFlags, setFoundFlags] = useState([]); // Array of flag indexes clicked
  const [flagAttempts, setFlagAttempts] = useState(0);
  const [flagAccuracy, setFlagAccuracy] = useState(100);
  const [activeFlagExplanation, setActiveFlagExplanation] = useState('');

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
      setError('Failed to fetch cybercrime intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectCrime = (crime) => {
    setSelectedCrime(crime);
    // Reset mini-game/scenario states
    setFoundFlags([]);
    setFlagAttempts(0);
    setFlagAccuracy(100);
    setActiveFlagExplanation('');
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

  // Spot the Flag Game Handlers
  const handleFlagClick = (flagIndex, explanation) => {
    if (foundFlags.includes(flagIndex)) return;
    const nextFound = [...foundFlags, flagIndex];
    setFoundFlags(nextFound);
    const nextAttempts = flagAttempts + 1;
    setFlagAttempts(nextAttempts);
    
    const totalFlags = selectedCrime.spotTheFlags?.clickableFlags?.length || 0;
    const accuracy = Math.round((nextFound.length / nextAttempts) * 100);
    setFlagAccuracy(accuracy);
    setActiveFlagExplanation(explanation);
  };

  const handleMisclick = () => {
    const nextAttempts = flagAttempts + 1;
    setFlagAttempts(nextAttempts);
    const totalFlags = selectedCrime.spotTheFlags?.clickableFlags?.length || 0;
    const accuracy = Math.round((foundFlags.length / nextAttempts) * 100);
    setFlagAccuracy(accuracy);
    setActiveFlagExplanation('That text segment is clean. Try scanning for urgency, suspicious links, or irregular sender domains.');
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
  const filteredCrimes = crimes.filter(c => {
    const matchesCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchesSearch = !searchQuery.trim() || [
      c.title,
      c.category,
      c.shortDescription,
      c.whatIsIt,
      c.howItWorks,
      ...(c.warningSigns || []),
      ...(c.attackVectors || []),
      ...(c.attackerObjective || [])
    ].some(field => field && field.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

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
          <h3 style={{ color: 'var(--accent-navy)' }}>Consulting Threat Intelligence Archives...</h3>
        </div>
      )}

      {/* 1. LANDING PORTAL VIEW (selectedCrime is null) */}
      {!loading && !selectedCrime && (
        <div>
          {/* Header block */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <span className="tag" style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>
              Cybercrime Intelligence Registry
            </span>
            <h1 style={{ fontSize: '2.8rem', fontWeight: 'bold', marginTop: 'var(--space-xs)', color: 'var(--accent-navy)' }}>
              CYBERCRIME LIBRARY
            </h1>
            <p style={{ fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '4px' }}>
              "Know how the attack works before it reaches you."
            </p>
            <p className="text-muted" style={{ maxWidth: '750px', marginTop: 'var(--space-sm)', lineHeight: '1.6' }}>
              Explore common cybercrimes, understand the warning signs, see how attacks unfold, and learn what to do when something feels wrong.
            </p>
          </div>

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
                      <span style={{ fontWeight: '500', color: 'var(--accent-navy)' }}>Intelligence Profile &rarr;</span>
                      {completedCrimes.includes(rec.slug) && <span style={{ color: 'var(--color-success)' }}>Completed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Section */}
          <div style={{ marginBottom: 'var(--space-xl)', display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search threats by keyword, vector, tactic, warning signs..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Category filter tabs */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)', fontWeight: '600' }}>
              Filter by Threat Domain
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid var(--color-border)',
                    backgroundColor: activeCategory === cat ? 'var(--accent-navy)' : 'var(--bg-secondary)',
                    color: activeCategory === cat ? '#ffffff' : 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

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
            <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', fontWeight: '600' }}>
              Threat Index ({filteredCrimes.length} profiles)
            </h3>
            {filteredCrimes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: 'var(--space-lg) 0' }}>No cyber threats matched your search term or category filter.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
                {filteredCrimes.map((crime) => (
                  <div
                    key={crime._id}
                    onClick={() => handleSelectCrime(crime)}
                    className="editorial-card"
                    style={{
                      cursor: 'pointer',
                      borderLeft: '4px solid var(--accent-navy)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="tag" style={{ fontSize: '0.75rem' }}>{crime.category}</span>
                        {completedCrimes.includes(crime.slug) && (
                          <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 'bold' }}>Done</span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.4rem', margin: '4px 0 8px 0', color: 'var(--accent-navy)' }}>
                        {crime.title}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {crime.shortDescription}
                      </p>
                    </div>

                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Vectors: <strong>{crime.attackVectors?.join(', ') || 'Online'}</strong></span>
                      <span style={{ color: 'var(--accent-navy)', fontWeight: '600' }}>Examine Profile &rarr;</span>
                    </div>
                  </div>
                ))}
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
                Primary Vectors
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
            {selectedCrime.spotTheFlags?.messageText && (
              <a href="#simulator" style={{ color: 'var(--accent-navy)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>3. Spot the Flags Game</a>
            )}
            <a href="#prevention" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>4. Prevention Check</a>
            <a href="#legal" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>5. Legal Context</a>
            <a href="#quickcheck" style={{ color: 'var(--text-primary)', fontWeight: '600', textDecoration: 'none', fontSize: '0.9rem' }}>6. Knowledge Check</a>
          </div>

          {/* SECTION 1: OVERVIEW */}
          <section id="overview" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              1. Threat Intelligence Profile
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
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
          <section id="lifecycle" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              2. How the Attack Unfolds
            </h2>
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

          {/* SECTION 3: SPOT THE RED FLAGS MINI-GAME */}
          {selectedCrime.spotTheFlags?.messageText && (
            <section id="simulator" style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
                Interactive Activity: Spot the Red Flags
              </h2>
              <p className="text-muted" style={{ marginBottom: 'var(--space-md)', fontSize: '0.95rem' }}>
                Examine the message below. **Click on the phrases or components** that seem suspicious or reveal scam tactics.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
                {/* Phone mockup */}
                <div style={{
                  backgroundColor: '#0a0d14',
                  borderRadius: '12px',
                  padding: '16px',
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  border: '8px solid #2d3748',
                  maxWidth: '480px',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <div style={{ borderBottom: '1px solid #2d3748', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>INCIDENT SIMULATION</span>
                    <span>100% SECURE</span>
                  </div>

                  <div style={{
                    backgroundColor: '#1a202c',
                    borderRadius: '8px',
                    padding: '14px',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    color: '#e2e8f0'
                  }}>
                    {/* Render text segments with click triggers */}
                    {(() => {
                      const text = selectedCrime.spotTheFlags.messageText;
                      const flags = selectedCrime.spotTheFlags.clickableFlags;
                      
                      let lastIndex = 0;
                      const elements = [];

                      flags.forEach((flag, idx) => {
                        const target = flag.textSegment;
                        const startIndex = text.indexOf(target, lastIndex);
                        
                        if (startIndex !== -1) {
                          // Before segment
                          if (startIndex > lastIndex) {
                            const normalText = text.substring(lastIndex, startIndex);
                            elements.push(
                              <span key={`n-${idx}`} onClick={handleMisclick} style={{ cursor: 'pointer' }}>
                                {normalText}
                              </span>
                            );
                          }
                          // Clickable segment
                          elements.push(
                            <span 
                              key={`f-${idx}`}
                              onClick={() => handleFlagClick(idx, flag.explanation)}
                              style={{
                                borderBottom: foundFlags.includes(idx) ? '2px solid var(--color-success)' : '2px dashed var(--color-error)',
                                backgroundColor: foundFlags.includes(idx) ? 'rgba(26, 98, 52, 0.2)' : 'transparent',
                                color: foundFlags.includes(idx) ? '#48bb78' : 'inherit',
                                padding: '1px 2px',
                                fontWeight: foundFlags.includes(idx) ? 'bold' : 'normal',
                                cursor: 'pointer'
                              }}
                              title="Inspect Segment"
                            >
                              {target}
                            </span>
                          );
                          lastIndex = startIndex + target.length;
                        }
                      });

                      // Remainder text
                      if (lastIndex < text.length) {
                        elements.push(
                          <span key="n-last" onClick={handleMisclick} style={{ cursor: 'pointer' }}>
                            {text.substring(lastIndex)}
                          </span>
                        );
                      }

                      return elements.length > 0 ? elements : text;
                    })()}
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#a0aec0', textAlign: 'center' }}>
                    *Click directly on suspicious segments to analyze.*
                  </div>
                </div>

                {/* Scoreboard & explanations */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', padding: 'var(--space-lg)', borderRadius: '6px' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                    Simulation Analysis
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Flags Identified</span>
                      <h4 style={{ fontSize: '1.5rem', margin: '4px 0 0 0', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
                        {foundFlags.length} / {selectedCrime.spotTheFlags.clickableFlags.length}
                      </h4>
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click Accuracy</span>
                      <h4 style={{ fontSize: '1.5rem', margin: '4px 0 0 0', color: foundFlags.length > 0 ? 'var(--color-success)' : 'inherit', fontWeight: 'bold' }}>
                        {flagAccuracy}%
                      </h4>
                    </div>
                  </div>

                  {activeFlagExplanation ? (
                    <div style={{
                      backgroundColor: 'var(--bg-primary)',
                      padding: 'var(--space-md)',
                      borderRadius: '4px',
                      borderLeft: '4px solid var(--accent-navy)'
                    }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '6px' }}>
                        Segment Analysis:
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                        {activeFlagExplanation}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                      No elements selected. Scan the message card and click on indicators you suspect represent deception tactics.
                    </p>
                  )}

                  {foundFlags.length === selectedCrime.spotTheFlags.clickableFlags.length && (
                    <div style={{ marginTop: 'var(--space-md)', backgroundColor: 'var(--color-success-light)', color: '#1a6234', padding: '10px 14px', borderRadius: '4px', fontWeight: '500', fontSize: '0.88rem' }}>
                      Outstanding! You identified all critical threat markers in this mock transmission.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SECTION 4: ACTIONS CHECKLIST */}
          <section id="prevention" style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              3. Prevention & Response Guidelines
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

          {/* SECTION: WHAT WOULD YOU DO SCENARIO */}
          {selectedCrime.whatWouldYouDo?.questionText && (
            <section style={{ marginBottom: 'var(--space-xl)', border: '1px solid var(--color-border)', padding: 'var(--space-lg)', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-sm)', fontWeight: 'bold' }}>
                What Would You Do?
              </h3>
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
                      fontWeight: selectedScenarioOption === idx ? '600' : '400'
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
                    {selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? 'CORRECT' : 'UNSAFE'}
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

          {/* SECTION 5: LEGAL CONTEXT */}
          <section id="legal" style={{ marginBottom: 'var(--space-xl)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: 'var(--space-md)' }}>
              4. Relevant Legal Context
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
                    to="/laws" 
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
                Test Assessment Registry
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Crimes;
