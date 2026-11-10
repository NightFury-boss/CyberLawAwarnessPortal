import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import {
  THREAT_LEVEL_TOKENS,
  mapThreatLevel,
  getThreatTierKey,
  getCrimeThreatMetadata,
  getThreatFilterDefinitions
} from '../utils/threatLevelConfig';
import {
  getRelatedCasesForCrime,
  CASE_METADATA_REGISTRY
} from '../data/crimeCaseRelationships';

function Crimes() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (p === '/dashboard' ? '/dashboard' : (isWorkspaceContext ? `/workspace${p}` : p));

  // Constitutional Atelier category color mapping (WCAG 2.1 AA compliant contrast >= 4.5:1)
  const getCategoryTheme = (category) => {
    switch (category) {
      case 'Phishing & Messaging Scams':
        return {
          color: '#1F4D3A', // Deep forest green
          bg: '#EEF4F0',
          border: '#C1D6C7'
        };
      case 'Financial Fraud':
      case 'E-commerce & Marketplace Fraud':
        return {
          color: '#6E4832', // Deep terracotta brown
          bg: '#FAF4EA',
          border: '#E3D2C1'
        };
      case 'Identity & Credential Theft':
      case 'Account Takeover':
        return {
          color: '#26352B', // Deep charcoal
          bg: '#F2EFE9',
          border: '#D9CBB1'
        };
      case 'Online Deception':
      case 'Scams & Impersonation':
        return {
          color: '#6F4B18', // Deep bronze gold (high contrast >= 5:1 on #FCF8EE)
          bg: '#FCF8EE',
          border: '#E8D9B8'
        };
      case 'Malware & Device Threats':
        return {
          color: '#7A342B', // Deep terracotta red
          bg: '#FAF0EE',
          border: '#E8C9C4'
        };
      case 'Online Harassment & Abuse':
        return {
          color: '#652F3F', // Deep plum
          bg: '#F9F1F3',
          border: '#E4CCD2'
        };
      case 'Job & Recruitment Scams':
        return {
          color: '#284E3C', // Deep sage
          bg: '#F1F6F3',
          border: '#CDE0D5'
        };
      case 'Emerging & AI Threats':
        return {
          color: '#433C57', // Deep slate purple
          bg: '#F4F2F7',
          border: '#D5D0E0'
        };
      default:
        return {
          color: '#26352B',
          bg: '#FAF4EA',
          border: '#D9CBB1'
        };
    }
  };

  const [crimes, setCrimes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recReason, setRecReason] = useState('');
  const [selectedCrime, setSelectedCrime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeThreatLevel, setActiveThreatLevel] = useState('All');
  const searchInputRef = useRef(null);

  const crimesSearchConfig = {
    title: 50,
    category: 8,
    attackVectors: 4,
    warningSigns: 3,
    attackerTactics: 2,
    shortDescription: 2,
    whatIsIt: 1,
    howItWorks: 1,
    actionSteps: 1,
    avoidSteps: 1,
    ifTargetedSteps: 1,
    keywords: 5
  };

  // Interactive Scenario States ("What Would You Do?")
  const [selectedScenarioOption, setSelectedScenarioOption] = useState(null);
  const [scenarioSubmitted, setScenarioSubmitted] = useState(false);

  // Quick Check micro-quiz states
  const [quickCheckAnswers, setQuickCheckAnswers] = useState({});
  const [quickCheckChecked, setQuickCheckChecked] = useState(false);

  // User learning progress (persisted in localStorage)
  const [completedCrimes, setCompletedCrimes] = useState([]);
  const [recentlyExplored, setRecentlyExplored] = useState([]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();

    try {
      const savedCompletions = localStorage.getItem('completed_crimes');
      if (savedCompletions) {
        setCompletedCrimes(JSON.parse(savedCompletions));
      }
      const savedRecent = localStorage.getItem('recently_explored_crimes');
      if (savedRecent) {
        setRecentlyExplored(JSON.parse(savedRecent));
      }
    } catch (_e) {
      // LocalStorage access fallback
    }
  }, []);

  // Handle URL hash navigation for deep linking e.g. #phishing or #crime-phishing
  // Supports browser Back/Forward navigation between catalog and crime field guides
  useEffect(() => {
    const handleHashSync = () => {
      if (crimes.length === 0) return;
      const rawHash = window.location.hash ? window.location.hash.substring(1) : '';
      if (!rawHash) {
        setSelectedCrime(null);
        return;
      }
      // Only handle if not an in-page section anchor (e.g. overview, lifecycle)
      const inPageAnchors = ['overview', 'lifecycle', 'indicators', 'casestudies', 'scenario', 'legal', 'prevention', 'quickcheck'];
      if (!inPageAnchors.includes(rawHash)) {
        const cleanSlug = rawHash.replace(/^crime-/, '');
        const matched = crimes.find((c) => c.slug === rawHash || c.slug === cleanSlug);
        if (matched) {
          setSelectedCrime(matched);
        }
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
  return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, [crimes]);

  // Global keyboard shortcut for search input (Ctrl+K or /)
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
  return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const allCrimes = await api.getCrimes();
      setCrimes(allCrimes);

      try {
        const recsData = await api.getCrimeRecommendations();
        setRecommendations(recsData.recommendations || []);
        setRecReason(recsData.reason || '');
      } catch (_recErr) {
        // Fallback default recommendations
        const defaults = allCrimes.filter((c) =>
          ['phishing', 'upi-payment-fraud', 'qr-code-scams', 'digital-arrest-impersonation'].includes(c.slug)
        );
        setRecommendations(defaults.length > 0 ? defaults : allCrimes.slice(0, 3));
        setRecReason('Priority advisories for high-frequency citizen fraud patterns.');
      }
    } catch (_err) {
      setError('Unable to load cybercrime threat library. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrime = (crime) => {
    setSelectedCrime(crime);
    setSelectedScenarioOption(null);
    setScenarioSubmitted(false);
    setQuickCheckAnswers({});
    setQuickCheckChecked(false);

    // Synchronize URL hash for browser history, bookmarks, and deep links
    if (typeof window !== 'undefined' && window.location.hash !== `#${crime.slug}` && window.location.hash !== `#crime-${crime.slug}`) {
      window.history.pushState(null, '', `#${crime.slug}`);
    }

    // Save to recently explored
    let updatedRecent = [crime, ...recentlyExplored.filter((x) => x.slug !== crime.slug)];
    updatedRecent = updatedRecent.slice(0, 4);
    setRecentlyExplored(updatedRecent);
    try {
      localStorage.setItem('recently_explored_crimes', JSON.stringify(updatedRecent));
    } catch (_e) {
      // Ignored
    }

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = () => {
    setSelectedCrime(null);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle crime reviewed status
  const handleToggleComplete = (slug) => {
    let updated;
    if (completedCrimes.includes(slug)) {
      updated = completedCrimes.filter((x) => x !== slug);
    } else {
      updated = [...completedCrimes, slug];
    }
    setCompletedCrimes(updated);
    try {
      localStorage.setItem('completed_crimes', JSON.stringify(updated));
    } catch (_e) {
      // Ignored
    }
  };

  // Micro-quiz response handlers
  const handleQuickCheckSelect = (qIdx, oIdx) => {
    setQuickCheckAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateQuickCheckScore = () => {
    if (!selectedCrime?.quickCheckQuestions) return 0;
    let correct = 0;
    selectedCrime.quickCheckQuestions.forEach((q, idx) => {
      if (quickCheckAnswers[idx] === q.correctOptionIndex) {
        correct++;
      }
    });
    return correct;
  };

  // Derive unique categories from catalogue
  const availableCategories = useMemo(() => {
    const defaultCategories = [
      'All',
      'Phishing & Messaging Scams',
      'Financial Fraud',
      'Identity & Credential Theft',
      'Account Takeover',
      'Online Deception',
      'Scams & Impersonation',
      'Job & Recruitment Scams',
      'E-commerce & Marketplace Fraud',
      'Malware & Device Threats',
      'Online Harassment & Abuse'
    ];

    if (!crimes || crimes.length === 0) return defaultCategories;

    const catalogCats = Array.from(new Set(crimes.map((c) => c.category).filter(Boolean)));
    const merged = ['All', ...catalogCats];
    return Array.from(new Set(merged));
  }, [crimes]);

  // Derive threat level filter options with live counts
  const threatFilterOptions = useMemo(() => {
    return getThreatFilterDefinitions(crimes);
  }, [crimes]);

  // Filter local crimes list by search, category, and threat level
  const filteredCrimes = useMemo(() => {
    return searchItems(
      crimes,
      searchQuery,
      crimesSearchConfig,
      (item) => {
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        const tier = getThreatTierKey(item?.redFlagLevel);
        const matchesThreat = activeThreatLevel === 'All' || tier === activeThreatLevel;
        return matchesCategory && matchesThreat;
      }
    );
  }, [crimes, searchQuery, activeCategory, activeThreatLevel]);

  // Semantic Red Flag / Threat-Level meter helper (WCAG 2.1 AA compliant)
  const getRedFlagMeter = (rawLevel) => {
    const threat = mapThreatLevel(rawLevel);
    if (!threat) return null;

    const filled = threat.pipCount;
    const color = threat.foreground;
    const displayLabel = threat.label;

  return (
      <div
        className="crimes-risk-pip-meter"
        aria-label={`Assessed Threat Level: ${threat.fullLabel} (${filled} of 10 risk pips)`}
        title={threat.description}
      >
        <div className="crimes-pips-row" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="crimes-pip"
              style={{
                backgroundColor: i < filled ? color : 'var(--color-border, #D9CBB1)'
              }}
            />
          ))}
        </div>
        <div className="crimes-risk-meta-row">
          <span className="crimes-risk-label" style={{ color }}>
            {displayLabel}
          </span>
          {rawLevel === 'Very High' && (
            <span className="crimes-risk-subnote" style={{ color }} aria-hidden="true">
              (Very High)
            </span>
          )}
        </div>
      </div>
    );
  };

  // Helper to format case study slugs into human-readable titles
  const formatCaseTitle = (slug) => {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Context-aware statutory provision description helper
  const getLawContextDescription = (law, crime) => {
    if (law === 'Section 67A') {
      return 'Applies specifically where material depicting a sexually explicit act or conduct is actually published or electronically transmitted. Unexecuted threats to publish are prosecuted under extortion and criminal intimidation rather than completed Section 67A, and intimate imagery lacking explicit acts falls under Section 66E or Section 67 depending on factual content.';
    }
    if (law === 'BNS Section 351' || law === 'IPC Section 506') {
      return 'BNS Section 351 defines criminal intimidation (subsection 1) and sets the general two-year penalty (subsection 2). Threatening injury to reputation or property to compel action is covered here. Aggravated penalties apply if threatening death, grievous hurt, or imputing unchastity to a woman (subsection 3), or if concealing identity (subsection 4). Ordinary debt reminders without unlawful harm threats do not satisfy these statutory ingredients.';
    }
    if (law === 'Section 66E') {
      return 'Penalizes capturing, transmitting, or publishing images of private bodily areas without consent, safeguarding bodily privacy and addressing voyeurism.';
    }
    if (law === 'Section 67') {
      return 'Penalizes publishing or transmitting lascivious or prurient obscene electronic material generally, carrying up to 3 years imprisonment on first conviction.';
    }
    if (law === 'Section 66D') {
      return `The primary penal section for cheating by personation using computer resources or communication devices in ${crime?.title || 'this offence'}.`;
    }
    if (law === 'Section 66C') {
      return 'Penalizes fraudulent or dishonest use of another person\'s electronic signature, password, or unique identification feature.';
    }
    if (law === 'Section 43A') {
      return 'Imposes civil compensation liability on corporate entities that negligently fail to implement reasonable security practices for sensitive personal data.';
    }
    if (law === 'BNS Section 318') {
      return 'Penalizes cheating and dishonestly inducing the delivery of property or consent under the Bharatiya Nyaya Sanhita, 2023.';
    }
    if (law === 'BNS Section 319') {
      return 'Penalizes cheating by personation under BNS 2023, punishing offenders who pretend to be someone else or substitute one person for another.';
    }
    if (law === 'BNS Section 78') {
      return 'Penalizes stalking, persistent electronic surveillance, and monitoring women\'s internet or digital communications without consent.';
    }
    if (law === 'IT Intermediary Rules') {
      return 'Mandates platform due diligence, user grievance redressal, and rapid removal of non-consensual intimate imagery and impersonation content.';
    }
    return `Governs unauthorized access, personation, or computer-related statutory offences associated with ${crime?.title || 'this threat profile'}.`;
  };

  return (
    <div className="container crimes-page-container">
      {error && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-md)' }}>
          {error}
        </div>
      )}

      {/* ------------------------------------------------------------------
          LOADING STATE
          ------------------------------------------------------------------ */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xxl) 0' }}>
          <h2 style={{ color: 'var(--color-text-primary, #26352B)', fontWeight: 700 }}>
            Loading Cybercrime Field Guides...
          </h2>
          <p style={{ color: 'var(--color-text-secondary, #626B61)' }}>
            Retrieving authoritative threat models and defensive playbooks.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------
          VIEW 1: CATALOGUE & DISCOVERY DIRECTORY (selectedCrime === null)
          ------------------------------------------------------------------ */}
      {!loading && !selectedCrime && (
        <div>
          {/* Editorial Header */}
          <EditorialPageHeader
            eyebrow="CITIZEN DEFENSE FIELD GUIDE"
            title="Understand the Crimes Behind the Screen"
            subtitle="Explore how cybercrime works, recognize its warning signs, and understand the laws designed to protect you."
            topContent={<WorkspaceBreadcrumb />}
            className="crimes-editorial-header"
          />

          {/* Curated Recommendations Strip */}
          {recommendations.length > 0 && (
            <section className="crimes-curation-strip" aria-label="Priority Citizen Advisories">
              <div className="crimes-curation-header">
                <div className="crimes-curation-title-wrap">
                  <span className="crimes-curation-pip" aria-hidden="true" />
                  <h3 className="crimes-curation-title">Priority Citizen Advisories</h3>
                </div>
                {recReason && <span className="crimes-curation-reason">{recReason}</span>}
              </div>

              <div className="crimes-curation-grid">
                {recommendations.map((rec) => {
                  const catTheme = getCategoryTheme(rec.category);
                  const recThreat = getCrimeThreatMetadata(rec);
                  const isDone = completedCrimes.includes(rec.slug);
                  const titleId = `curation-title-${rec._id || rec.slug}`;

  return (
                    <article
                      key={rec._id || rec.slug}
                      onClick={() => handleSelectCrime(rec)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCrime(rec);
                        }
                      }}
                      className={`crimes-curation-card ${recThreat ? `threat-tier-${recThreat.tier.toLowerCase()}` : ''}`}
                      tabIndex={0}
                    >
                      <div className="crimes-curation-card-top">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span
                              className="crime-field-card-tag"
                              style={{
                                color: catTheme.color,
                                backgroundColor: catTheme.bg,
                                borderColor: catTheme.border
                              }}
                            >
                              {rec.category}
                            </span>
                            {recThreat && (
                              <span
                                className="crime-threat-badge compact"
                                style={{
                                  color: recThreat.foreground,
                                  backgroundColor: recThreat.background,
                                  borderColor: recThreat.borderSolid
                                }}
                                aria-label={`Assessed Threat Level: ${recThreat.label}`}
                              >
                                <span className="crime-threat-dot" style={{ backgroundColor: recThreat.foreground }} aria-hidden="true" />
                                <span>{recThreat.label}</span>
                              </span>
                            )}
                          </div>
                          {isDone && <span className="crime-field-card-reviewed">✓ Reviewed</span>}
                        </div>
                        <h4 id={titleId} className="crimes-curation-card-title">{rec.title}</h4>
                        <p className="crimes-curation-card-desc">{rec.shortDescription}</p>
                      </div>

                      <div className="crimes-curation-card-action" aria-hidden="true">
                        <span>Read Field Guide</span>
                        <span aria-hidden="true">&rarr;</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Discovery & Navigation Panel */}
          <section className="crimes-discovery-panel" aria-label="Search and Filter Threats">
            {/* Search Input Row */}
            <div className="crimes-search-row">
              <div className="crimes-search-input-wrap">
                <span className="crimes-search-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>

                <input
                  ref={searchInputRef}
                  type="text"
                  className="crimes-search-input"
                  placeholder="Search crimes, warning signs, attack vectors, or legal provisions... (Press '/' or Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search cybercrime guides"
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="crimes-search-clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search input"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="crimes-category-nav-section">
              <span className="crimes-category-label">Filter by Threat Domain</span>
              <div className="crimes-category-pills" role="toolbar" aria-label="Filter by crime category">
                {availableCategories.map((cat) => {
                  const isActive = activeCategory === cat;
  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`crimes-cat-pill ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Threat Level Navigation Pills */}
            <div className="crimes-threat-nav-section">
              <span className="crimes-threat-label">Filter by Assessed Threat Level</span>
              <div className="crimes-threat-pills" role="toolbar" aria-label="Filter by assessed threat level">
                {threatFilterOptions.map((opt) => {
                  const isActive = activeThreatLevel === opt.key;
  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setActiveThreatLevel(opt.key)}
                      className={`crimes-threat-pill threat-pill-${opt.key.toLowerCase()} ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                    >
                      {opt.key !== 'All' && (
                        <span
                          className="threat-pill-dot"
                          style={{ backgroundColor: opt.color }}
                          aria-hidden="true"
                        />
                      )}
                      <span>{opt.label}</span>
                      <span className="threat-pill-count">({opt.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result Count and Active Filters Bar */}
            <div className="crimes-filter-summary-bar">
              <div className="crimes-results-count">
                Showing <strong>{filteredCrimes.length}</strong> of {crimes.length} cybercrime field guides
                {activeCategory !== 'All' && <span> in <strong>{activeCategory}</strong></span>}
                {activeThreatLevel !== 'All' && <span> with <strong>{activeThreatLevel} Threat</strong> level</span>}
                {searchQuery && <span> matching <strong>"{searchQuery}"</strong></span>}
              </div>

              {(activeCategory !== 'All' || activeThreatLevel !== 'All' || searchQuery) && (
                <div className="crimes-active-filters-chips">
                  {activeCategory !== 'All' && (
                    <span className="crimes-active-chip">
                      Category: {activeCategory}
                      <button
                        type="button"
                        onClick={() => setActiveCategory('All')}
                        className="crimes-chip-remove"
                        aria-label="Remove category filter"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {activeThreatLevel !== 'All' && (
                    <span
                      className="crimes-active-chip crimes-active-threat-chip"
                      style={{
                        color: THREAT_LEVEL_TOKENS[activeThreatLevel]?.foreground,
                        backgroundColor: THREAT_LEVEL_TOKENS[activeThreatLevel]?.background,
                        borderColor: THREAT_LEVEL_TOKENS[activeThreatLevel]?.borderSolid
                      }}
                    >
                      Threat: {activeThreatLevel}
                      <button
                        type="button"
                        onClick={() => setActiveThreatLevel('All')}
                        className="crimes-chip-remove"
                        aria-label="Remove threat level filter"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="crimes-active-chip">
                      Search: "{searchQuery}"
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="crimes-chip-remove"
                        aria-label="Clear search query"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    className="crimes-reset-filters-btn"
                    onClick={() => {
                      setActiveCategory('All');
                      setActiveThreatLevel('All');
                      setSearchQuery('');
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Empty Search Feedback */}
          {filteredCrimes.length === 0 && (
            <div className="crimes-empty-state-card" role="status">
              <svg className="crimes-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="12" />
                <line x1="11" y1="14" x2="11.01" y2="14" />
              </svg>
              <h3 className="crimes-empty-title">No Field Guides Found</h3>
              <p className="crimes-empty-desc">
                {activeThreatLevel === 'Low' && crimes.length > 0 && !searchQuery && activeCategory === 'All'
                  ? 'There are currently no cybercrime threats classified under the Low tier in this catalog. Most digital crimes encountered by citizens carry Moderate, High, or Critical threat levels.'
                  : `No cybercrime topics matched ${searchQuery ? `"${searchQuery}"` : 'your criteria'}${activeCategory !== 'All' ? ` in category "${activeCategory}"` : ''}${activeThreatLevel !== 'All' ? ` with ${activeThreatLevel} threat level` : ''}. Try a broader term or explore one of these common threat patterns:`}
              </p>

              <div className="crimes-empty-suggestions">
                {['OTP Fraud', 'Phishing', 'QR Code', 'Digital Arrest', 'SIM Swap', 'Impersonation'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="crimes-empty-suggest-pill"
                    onClick={() => {
                      setActiveCategory('All');
                      setActiveThreatLevel('All');
                      setSearchQuery(term);
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setActiveCategory('All');
                  setActiveThreatLevel('All');
                  setSearchQuery('');
                }}
              >
                Clear All Filters ({crimes.length} Guides Available)
              </button>
            </div>
          )}

          {/* Recently Viewed Threats Row */}
          {recentlyExplored.length > 0 && !searchQuery && activeCategory === 'All' && (
            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <span className="crimes-category-label">Recently Examined Guides</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {recentlyExplored.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => handleSelectCrime(item)}
                    style={{
                      padding: '8px 14px',
                      backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
                      border: '1px solid var(--color-border, #D9CBB1)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      color: 'var(--color-text-primary, #26352B)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{item.title}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Directory of Crime Preview Cards */}
          {filteredCrimes.length > 0 && (
            <div className="crimes-catalog-directory" role="list" aria-label="Cybercrime threat directory">
              {filteredCrimes.map((crime, index) => {
                const isCompleted = completedCrimes.includes(crime.slug);
                const catTheme = getCategoryTheme(crime.category);
                const threatMeta = getCrimeThreatMetadata(crime);
                const attackMethods = crime.attackVectors?.join(', ') || 'Digital Systems';
                const primarySignal = crime.warningSigns?.[0] || crime.attackerTactics?.[0]?.tactic || 'Deceptive urgency & impersonation';
                const legalProvisions = crime.legalContext?.slice(0, 2) || [];

  return (
                  <article
                    key={crime._id || crime.slug}
                    role="listitem"
                    tabIndex={0}
                    onClick={() => handleSelectCrime(crime)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectCrime(crime);
                      }
                    }}
                    className={`crime-field-card ${threatMeta ? `threat-tier-${threatMeta.tier.toLowerCase()}` : ''}`}
                    aria-labelledby={`crime-title-${crime.slug}`}
                  >
                    {/* Left Column: Index REF, Category Tag, Threat Badge, Reviewed, Title, Summary */}
                    <div className="crime-field-card-main">
                      <div className="crime-field-card-meta">
                        <span className="crime-field-card-ref">
                          REF #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          className="crime-field-card-tag"
                          style={{
                            color: catTheme.color,
                            backgroundColor: catTheme.bg,
                            borderColor: catTheme.border
                          }}
                        >
                          {crime.category}
                        </span>
                        {threatMeta && (
                          <span
                            className={`crime-threat-badge badge-${threatMeta.tier.toLowerCase()}`}
                            style={{
                              color: threatMeta.foreground,
                              backgroundColor: threatMeta.background,
                              borderColor: threatMeta.borderSolid
                            }}
                            aria-label={`Assessed Threat Level: ${threatMeta.badgeLabel || threatMeta.label}`}
                          >
                            <span
                              className="crime-threat-dot"
                              style={{ backgroundColor: threatMeta.foreground }}
                              aria-hidden="true"
                            />
                            <span>{threatMeta.badgeLabel || `${threatMeta.label} Threat`}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="crime-field-card-reviewed">✓ Reviewed</span>
                        )}
                      </div>

                      <h3 id={`crime-title-${crime.slug}`} className="crime-field-card-title">
                        {crime.title}
                      </h3>

                      <p className="crime-field-card-desc">
                        {crime.shortDescription}
                      </p>
                    </div>

                    {/* Middle Column: Operational Indicators */}
                    <div className="crime-field-card-indicators">
                      <div className="crime-indicator-item">
                        <span className="crime-indicator-label">Attack Vectors</span>
                        <span className="crime-indicator-value">{attackMethods}</span>
                      </div>

                      <div className="crime-indicator-item">
                        <span className="crime-indicator-label">Primary Warning Sign</span>
                        <span className="crime-indicator-value">{primarySignal}</span>
                      </div>

                      {legalProvisions.length > 0 && (
                        <div className="crime-indicator-item">
                          <span className="crime-indicator-label">Governing Statutes</span>
                          <div style={{ marginTop: '2px' }}>
                            {legalProvisions.map((law, lIdx) => (
                              <span key={lIdx} className="crime-indicator-law-pill">
                                {law}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Risk Level & Action Button */}
                    <div className="crime-field-card-action">
                      {getRedFlagMeter(crime.redFlagLevel)}

                      <span className="crime-field-card-btn" aria-hidden="true">
                        <span>Read Field Guide</span>
                        <span className="arrow-icon">&rarr;</span>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Practice & Apply: Balanced Destination Panels */}
          <section className="crimes-practice-section" aria-labelledby="practice-apply-heading">
            <div className="crimes-practice-header">
              <span className="crimes-practice-eyebrow">EXPERIENTIAL LEARNING</span>
              <h2 id="practice-apply-heading" className="crimes-practice-title">
                Practice &amp; Apply
              </h2>
              <p className="crimes-practice-subtitle">
                Turn what you've learned into safer decisions through practical questions and realistic digital scenarios.
              </p>
            </div>

            <div className="crimes-practice-grid">
              {/* Panel 1: Knowledge Quizzes */}
              <div className="crimes-practice-card">
                <div className="crimes-practice-card-content">
                  <div className="crimes-practice-card-header">
                    <div className="crimes-practice-icon-wrap" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                      </svg>
                    </div>
                    <span className="crimes-practice-card-eyebrow">KNOWLEDGE CHECK</span>
                  </div>

                  <h3 className="crimes-practice-card-heading">
                    Test Your Understanding
                  </h3>

                  <p className="crimes-practice-card-desc">
                    Answer situational questions on payment traps, digital arrest schemes, and online verification habits to solidify key concepts.
                  </p>
                </div>

                <div className="crimes-practice-card-footer">
                  <Link to={getContextPath('/quizzes')} className="crimes-practice-btn primary">
                    <span>Take Practice Quizzes</span>
                    <span className="arrow-icon" aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>

              {/* Panel 2: Interactive Simulator */}
              <div className="crimes-practice-card">
                <div className="crimes-practice-card-content">
                  <div className="crimes-practice-card-header">
                    <div className="crimes-practice-icon-wrap" aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <span className="crimes-practice-card-eyebrow">REAL-WORLD PRACTICE</span>
                  </div>

                  <h3 className="crimes-practice-card-heading">
                    Build Safer Digital Habits
                  </h3>

                  <p className="crimes-practice-card-desc">
                    Experience realistic email, instant message, and banking call simulations to build intuitive defense reflexes in safety.
                  </p>
                </div>

                <div className="crimes-practice-card-footer">
                  <Link to={getContextPath('/dashboard')} className="crimes-practice-btn secondary">
                    <span>Open Scenario Simulator</span>
                    <span className="arrow-icon" aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ------------------------------------------------------------------
          VIEW 2: DETAILED FIELD GUIDE (selectedCrime !== null)
          ------------------------------------------------------------------ */}
      {!loading && selectedCrime && (
        <div className="crimes-detail-container">
          {/* Top Return & Status Action Bar */}
          <div className="crimes-detail-topbar">
            <button
              type="button"
              onClick={handleBackToLanding}
              className="crimes-detail-back-btn"
            >
              <span>&larr;</span>
              <span>Back to Cyber Crimes Directory</span>
            </button>

            <WorkspaceBreadcrumb
              currentItem={selectedCrime.title}
              onParentClick={handleBackToLanding}
            />

            <button
              type="button"
              onClick={() => handleToggleComplete(selectedCrime.slug)}
              className={`crimes-detail-complete-btn ${completedCrimes.includes(selectedCrime.slug) ? 'completed' : 'incomplete'}`}
            >
              {completedCrimes.includes(selectedCrime.slug) ? (
                <>
                  <span>✓</span>
                  <span>Reviewed & Completed</span>
                </>
              ) : (
                <>
                  <span>Mark Topic Reviewed</span>
                </>
              )}
            </button>
          </div>

          {/* Guide Hero Banner */}
          {(() => {
            const selectedThreat = getCrimeThreatMetadata(selectedCrime);
  return (
              <header className={`crimes-detail-hero ${selectedThreat ? `threat-tier-${selectedThreat.tier.toLowerCase()}` : ''}`}>
                <div className="crimes-hero-main">
                  <div className="crimes-detail-tag-row">
                    {(() => {
                      const catTheme = getCategoryTheme(selectedCrime.category);
  return (
                        <span
                          className="crimes-hero-tag"
                          style={{
                            color: catTheme.color,
                            backgroundColor: catTheme.bg,
                            borderColor: catTheme.border,
                            marginBottom: 0
                          }}
                        >
                          {selectedCrime.category}
                        </span>
                      );
                    })()}

                    {/* Prominent but Restrained Threat-Level Indicator Near Title */}
                    {selectedThreat && (
                      <span
                        className={`crimes-hero-threat-badge badge-${selectedThreat.tier.toLowerCase()}`}
                        style={{
                          color: selectedThreat.foreground,
                          backgroundColor: selectedThreat.background,
                          borderColor: selectedThreat.borderSolid
                        }}
                        aria-label={`Assessed Threat Level: ${selectedThreat.fullLabel}`}
                      >
                        <span
                          className="crimes-threat-dot"
                          style={{ backgroundColor: selectedThreat.foreground }}
                          aria-hidden="true"
                        />
                        <span className="crimes-hero-threat-badge-title">
                          {selectedThreat.badgeLabel || selectedThreat.fullLabel}
                        </span>
                        {selectedThreat.isMappedFromVeryHigh && (
                          <span className="crimes-hero-threat-badge-raw" aria-hidden="true">
                            · Critical Tier
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <h1 className="crimes-hero-title">{selectedCrime.title}</h1>
                  <p className="crimes-hero-desc">{selectedCrime.shortDescription}</p>
                </div>

                <div className="crimes-hero-meta-panel">
                  <div>
                    <span className="crimes-meta-block-label">Assessed Risk Level</span>
                    {getRedFlagMeter(selectedCrime.redFlagLevel)}
                  </div>

                  <div>
                    <span className="crimes-meta-block-label">Primary Attack Vectors</span>
                    <div className="crimes-meta-tags-row">
                      {selectedCrime.attackVectors?.map((vec) => (
                        <span key={vec} className="crimes-meta-pill">
                          {vec}
                        </span>
                      )) || <span className="crimes-meta-pill">Digital Systems</span>}
                    </div>
                  </div>

                  <div>
                    <span className="crimes-meta-block-label">Perpetrator Objectives</span>
                    <div className="crimes-meta-tags-row">
                      {selectedCrime.attackerObjective?.map((obj) => (
                        <span key={obj} className="crimes-meta-pill">
                          {obj}
                        </span>
                      )) || <span className="crimes-meta-pill">Unauthorized Gain</span>}
                    </div>
                  </div>
                </div>
              </header>
            );
          })()}

          {/* Fast Navigation Jump Bar */}
          <nav className="crimes-jump-bar" aria-label="Field guide sections jump bar">
            <a href="#overview" className="crimes-jump-link">1. Understanding</a>
            <a href="#lifecycle" className="crimes-jump-link">2. How it Unfolds</a>
            <a href="#indicators" className="crimes-jump-link">3. Warning Signs</a>
            <a href="#casestudies" className="crimes-jump-link">4. Real-World Cases</a>
            <a href="#scenario" className="crimes-jump-link">5. Decision Checkpoint</a>
            <a href="#legal" className="crimes-jump-link">6. What the Law Says</a>
            <a href="#prevention" className="crimes-jump-link">7. Protection & Emergency</a>
            {selectedCrime.quickCheckQuestions?.length > 0 && (
              <a href="#quickcheck" className="crimes-jump-link">8. Micro-Quiz</a>
            )}
          </nav>

          {/* ----------------------------------------------------------------
              STAGE 1: WHAT IS THIS CRIME? & OBJECTIVES
              ---------------------------------------------------------------- */}
          <section id="overview" className="crimes-stage-section" aria-labelledby="stage-1-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 01 — THREAT ANATOMY</span>
              <h2 id="stage-1-title" className="crimes-stage-title">1. Understanding the Crime</h2>
              <p className="crimes-stage-lead">
                A plain-English operational definition of how this threat functions and what attackers seek to exploit.
              </p>
            </div>

            <div className="crimes-overview-grid">
              <div className="crimes-prose-block">
                <h4>What Is It?</h4>
                <p>{selectedCrime.whatIsIt}</p>

                <h4>How Does It Work?</h4>
                <p>{selectedCrime.howItWorks}</p>
              </div>

              <div className="crimes-objectives-box">
                <h4>What Perpetrators Seek to Exploit</h4>
                <p className="crimes-objectives-desc">
                  Attackers systematically structure communications to extract or compromise the following targets:
                </p>
                <div className="crimes-objectives-list">
                  {(selectedCrime.attackerObjective || ['Credentials', 'Financial Transfers', 'Personal Data']).map((obj) => (
                    <div key={obj} className="crimes-objective-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-forest, #1F4D3A)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------
              STAGE 2: HOW THE ATTACK UNFOLDS (LIFECYCLE & TACTICS)
              ---------------------------------------------------------------- */}
          <section id="lifecycle" className="crimes-stage-section" aria-labelledby="stage-2-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 02 — ATTACK PROGRESSION</span>
              <h2 id="stage-2-title" className="crimes-stage-title">2. How the Attack Unfolds</h2>
              <p className="crimes-stage-lead">
                Step-by-step reconstruction showing how threat actors initiate contact, cultivate compliance, and execute compromise.
              </p>
            </div>

            {/* Timeline progression */}
            <div className="crimes-timeline">
              {(selectedCrime.attackLifecycle && selectedCrime.attackLifecycle.length > 0 ? selectedCrime.attackLifecycle : [
                { stepNumber: 1, label: 'Initial Contact & Channel Seeding', description: 'Attacker establishes connection via SMS, Email, spoofed call, or malicious advertisement.' },
                { stepNumber: 2, label: 'Fabricated Urgency & Authority Leverage', description: 'Attacker claims immediate negative consequence (e.g. account freeze, legal summons) or lucrative reward.' },
                { stepNumber: 3, label: 'The Verification Trap', description: 'Victim is coerced into clicking a link, entering OTP/PIN, installing remote desktop apps, or transferring funds.' },
                { stepNumber: 4, label: 'Account Compromise & Fund Diversion', description: 'Attacker leverages harvested credentials or authorized transfers to siphon funds and sever communication.' }
              ]).map((step, idx) => (
                <div key={idx} className="crimes-timeline-step">
                  <div className="crimes-step-number" aria-hidden="true">
                    {step.stepNumber || idx + 1}
                  </div>
                  <div className="crimes-step-body">
                    <h3 className="crimes-step-title">{step.label}</h3>
                    <p className="crimes-step-desc">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Deception Tactics Breakdown */}
            {selectedCrime.attackerTactics && selectedCrime.attackerTactics.length > 0 && (
              <div style={{ marginTop: 'var(--space-xl)', borderTop: '1px solid var(--color-border, #D9CBB1)', paddingTop: '20px' }}>
                <span className="crimes-category-label">Psychological Deception Tactics</span>
                <div className="crimes-tactics-grid">
                  {selectedCrime.attackerTactics.map((tac, idx) => (
                    <div key={idx} className="crimes-tactic-card">
                      <h4 className="crimes-tactic-name">{tac.tactic}</h4>
                      <p className="crimes-tactic-quote">&ldquo;{tac.example}&rdquo;</p>
                      <p className="crimes-tactic-reason">
                        <strong>Why it works:</strong> {tac.whyItWorks}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ----------------------------------------------------------------
              STAGE 3: RECOGNIZING WARNING SIGNS & DECEPTION ANALYSIS
              ---------------------------------------------------------------- */}
          <section id="indicators" className="crimes-stage-section" aria-labelledby="stage-3-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 03 — SIGNAL RECOGNITION</span>
              <h2 id="stage-3-title" className="crimes-stage-title">3. Recognizing Warning Signs</h2>
              <p className="crimes-stage-lead">
                Examine real warning signs and inspect simulated deceptive messages to train your detection instincts.
              </p>
            </div>

            {/* Warning signs list */}
            {selectedCrime.warningSigns && selectedCrime.warningSigns.length > 0 && (
              <div>
                <span className="crimes-category-label">Critical Red Flags</span>
                <ul className="crimes-warning-list">
                  {selectedCrime.warningSigns.map((sign, idx) => (
                    <li key={idx} className="crimes-warning-item">
                      {typeof sign === 'string' ? sign : sign.title || sign.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Simulated Message Quotation / Spot the Flags */}
            {selectedCrime.spotTheFlags?.messageText && (
              <div>
                <span className="crimes-category-label">Simulated Deceptive Communication Sample</span>
                <div className="crimes-simulated-msg-box">
                  <div className="crimes-msg-header">
                    <span>{selectedCrime.spotTheFlags.messageType || 'Communication Sample'} Inspection</span>
                    <span>Unverified Source</span>
                  </div>
                  <div className="crimes-msg-body">
                    {selectedCrime.spotTheFlags.messageText}
                  </div>
                </div>

                {/* Deception Markers */}
                {selectedCrime.spotTheFlags.clickableFlags?.length > 0 && (
                  <div>
                    <span className="crimes-category-label">Anatomy of the Deception: Why Each Segment is a Trap</span>
                    <div className="crimes-deception-markers-grid">
                      {selectedCrime.spotTheFlags.clickableFlags.map((flag, fIdx) => (
                        <div key={fIdx} className="crimes-marker-card">
                          <div className="crimes-marker-tag">Flag #{fIdx + 1} — {flag.flagName}</div>
                          <div className="crimes-marker-title">"{flag.textSegment}"</div>
                          <p className="crimes-marker-desc">{flag.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ----------------------------------------------------------------
              STAGE 4: REAL-WORLD EXAMPLE & PRECEDENTS
              ---------------------------------------------------------------- */}
          <section id="casestudies" className="crimes-stage-section" aria-labelledby="stage-4-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 04 — JUDICIAL & PROCEDURAL PRECEDENTS</span>
              <h2 id="stage-4-title" className="crimes-stage-title">4. Real-World Case Context</h2>
              <p className="crimes-stage-lead">
                Explore how Indian courts, consumer disputes forums, and investigative agencies have addressed similar threats in practice.
              </p>
            </div>

            {(() => {
              const effectiveCases = (selectedCrime.relatedCaseStudies && selectedCrime.relatedCaseStudies.length > 0)
                ? selectedCrime.relatedCaseStudies.map(slug => CASE_METADATA_REGISTRY[slug] || { slug, title: formatCaseTitle(slug), typeLabel: 'Case Precedent', description: 'Review documented judicial findings, investigative obstacles, and legal outcomes.' })
                : getRelatedCasesForCrime(selectedCrime.slug);

              if (effectiveCases && effectiveCases.length > 0) {
  return (
                  <div>
                    <span className="crimes-category-label">Related Landmark & Documented Case Studies</span>
                    <div className="crimes-case-cards-grid">
                      {effectiveCases.map((caseItem) => {
                        const isJudicial = caseItem.category === 'Judicial Precedent';
  return (
                          <Link
                            key={caseItem.slug}
                            to={getContextPath(`/cases?slug=${encodeURIComponent(caseItem.slug)}`)}
                            className="crimes-case-link-card"
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    padding: '2px 8px',
                                    borderRadius: '3px',
                                    backgroundColor: isJudicial ? 'var(--color-accent-terracotta, #805B43)' : 'var(--color-accent-forest, #1F4D3A)',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  {caseItem.typeLabel || (isJudicial ? 'Judicial Precedent' : 'Documented Investigation')}
                                </span>
                                {caseItem.courtOrAuthority && (
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #626B61)', fontStyle: 'italic' }}>
                                    {caseItem.courtOrAuthority}
                                  </span>
                                )}
                              </div>
                              <h4 className="crimes-case-card-title">{caseItem.title}</h4>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary, #626B61)', margin: 0, lineHeight: '1.55' }}>
                                {caseItem.description}
                              </p>
                            </div>

                            <div className="crimes-case-card-cta">
                              <span>Read Case Analysis</span>
                              <span aria-hidden="true">&rarr;</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

  return (
                <div style={{ backgroundColor: 'var(--color-surface-secondary, #FAF4EA)', border: '1px solid var(--color-border, #D9CBB1)', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                  <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary, #626B61)', marginBottom: '8px' }}>
                    Archive Coverage Status
                  </span>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--color-text-primary, #26352B)' }}>
                    No Dedicated Case File in Current Archive
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #626B61)', margin: '0 0 14px 0', lineHeight: '1.55' }}>
                    This cybercrime threat profile does not have a directly matching judicial ruling or documented incident in the 21-case archive. You can explore broader precedents across both Landmark Precedents and Cases Where Justice Fell Short.
                  </p>
                  <Link to={getContextPath('/cases')} className="btn btn-secondary btn-sm">
                    Browse Case Studies Archive &rarr;
                  </Link>
                </div>
              );
            })()}
          </section>

          {/* ----------------------------------------------------------------
              STAGE 5: PRACTICAL DECISION CHECKPOINT "WHAT WOULD YOU DO?"
              ---------------------------------------------------------------- */}
          {selectedCrime.whatWouldYouDo?.questionText && (
            <section id="scenario" className="crimes-stage-section" aria-labelledby="stage-5-title">
              <div className="crimes-stage-header">
                <span className="crimes-stage-eyebrow">STAGE 05 — DECISION CHECKPOINT</span>
                <h2 id="stage-5-title" className="crimes-stage-title">5. Practical Decision: What Would You Do?</h2>
                <p className="crimes-stage-lead">
                  Put your instincts to the test: choose the safest course of action in this real-world scenario.
                </p>
              </div>

              <div className="crimes-scenario-container">
                <p className="crimes-scenario-question">
                  {selectedCrime.whatWouldYouDo.questionText}
                </p>

                <div className="crimes-scenario-options" role="radiogroup" aria-label="Scenario options">
                  {selectedCrime.whatWouldYouDo.options.map((opt, idx) => {
                    const isSelected = selectedScenarioOption === idx;
  return (
                      <button
                        key={idx}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={scenarioSubmitted}
                        onClick={() => setSelectedScenarioOption(idx)}
                        className={`crimes-scenario-btn ${isSelected ? 'selected' : ''}`}
                      >
                        {opt.optionText}
                      </button>
                    );
                  })}
                </div>

                {!scenarioSubmitted && selectedScenarioOption !== null && (
                  <button
                    type="button"
                    onClick={() => setScenarioSubmitted(true)}
                    className="btn btn-primary"
                    style={{ marginTop: '16px' }}
                  >
                    Submit Decision
                  </button>
                )}

                {scenarioSubmitted && (
                  <div
                    className={`crimes-scenario-feedback ${
                      selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect ? 'correct' : 'incorrect'
                    }`}
                    role="alert"
                  >
                    <div className="crimes-scenario-feedback-title">
                      {selectedCrime.whatWouldYouDo.options[selectedScenarioOption].isCorrect
                        ? '✓ Verified Safe Reflex'
                        : '⚠ Risky Reflex — Potential Vulnerability'}
                    </div>
                    <p className="crimes-scenario-feedback-text">
                      {selectedCrime.whatWouldYouDo.options[selectedScenarioOption].explanation}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setScenarioSubmitted(false);
                        setSelectedScenarioOption(null);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '12px' }}
                    >
                      Try Alternative Option
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------------------
              STAGE 6: WHAT THE LAW SAYS (LEGAL CONTEXT)
              ---------------------------------------------------------------- */}
          <section id="legal" className="crimes-stage-section" aria-labelledby="stage-6-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 06 — STATUTORY FRAMEWORK</span>
              <h2 id="stage-6-title" className="crimes-stage-title">6. What the Law Says: Relevant Statutory Provisions</h2>
              <p className="crimes-stage-lead">
                Under Indian cyber law, the following legislative provisions penalize conduct associated with this threat profile.
              </p>
            </div>

            <div className="crimes-laws-grid">
              {(selectedCrime.legalContext && selectedCrime.legalContext.length > 0 ? selectedCrime.legalContext : ['Section 66D', 'Section 66C']).map((law, idx) => {
                const targetAnchor = law.replace(/\s+/g, '-');
  return (
                  <div key={idx} className="crimes-law-card">
                    <div>
                      <h4 className="crimes-law-title">{law}</h4>
                      <p className="crimes-law-desc">
                        {getLawContextDescription(law, selectedCrime)}
                      </p>
                    </div>

                    <Link
                      to={`${getContextPath('/laws')}#${encodeURIComponent(targetAnchor)}`}
                      className="crimes-law-link-btn"
                    >
                      <span>View Statute in Laws Index</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="crimes-legal-disclaimer">
              <strong>Notice:</strong> Statutory provisions and penalties are provided strictly for educational awareness and citizen legal literacy. They do not constitute formal legal counsel or an attorney-client relationship.
            </p>
          </section>

          {/* ----------------------------------------------------------------
              STAGE 7: PROTECTION, DEFENSES & EMERGENCY PROTOCOL
              ---------------------------------------------------------------- */}
          <section id="prevention" className="crimes-stage-section" aria-labelledby="stage-7-title">
            <div className="crimes-stage-header">
              <span className="crimes-stage-eyebrow">STAGE 07 — CITIZEN DEFENSIVE PLAYBOOK</span>
              <h2 id="stage-7-title" className="crimes-stage-title">7. Protection Guidelines & Emergency Response</h2>
              <p className="crimes-stage-lead">
                Verified defenses to safeguard your accounts, actions to strictly avoid, and official emergency reporting protocols.
              </p>
            </div>

            {/* Defensive Action Matrix: Do vs Avoid */}
            <div className="crimes-defense-matrix">
              <div className="crimes-defense-column do-column">
                <h4 className="crimes-defense-heading do">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Actions to Take (Protective Measures)</span>
                </h4>
                <ul className="crimes-defense-list">
                  {(selectedCrime.actionSteps || [
                    'Verify sender domains and phone numbers through independent official websites.',
                    'Enable multi-factor authentication (MFA) via authenticator apps on all key accounts.',
                    'Check bank transaction history regularly through the bank official mobile application.'
                  ]).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="crimes-defense-column avoid-column">
                <h4 className="crimes-defense-heading avoid">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Actions to Avoid (Critical Vulnerabilities)</span>
                </h4>
                <ul className="crimes-defense-list">
                  {(selectedCrime.avoidSteps || [
                    'Never share one-time passwords (OTPs), PINs, or netbanking passwords over phone or message.',
                    'Never scan a QR code to receive money — scanning a QR code strictly authorizes a debit.',
                    'Never install screen-sharing or remote-access applications requested by unverified callers.'
                  ]).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Myth vs Fact */}
            {selectedCrime.mythFacts && selectedCrime.mythFacts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <span className="crimes-category-label">Common Misconceptions (Myth vs. Fact)</span>
                <div className="crimes-myths-grid">
                  {selectedCrime.mythFacts.map((mf, idx) => (
                    <div key={idx} className="crimes-myth-card">
                      <div className="crimes-myth-top">
                        <span className="crimes-myth-tag">Common Myth</span>
                        <p className="crimes-myth-text">&ldquo;{mf.myth}&rdquo;</p>
                      </div>
                      <div className="crimes-fact-bottom">
                        <span className="crimes-fact-tag">Legal & Technical Reality</span>
                        <p className="crimes-fact-text">{mf.fact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authoritative Emergency Guidance Box */}
            <div className="crimes-emergency-box">
              <div className="crimes-emergency-header">
                <h4 className="crimes-emergency-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>If You Have Been Targeted: Immediate Emergency Protocol</span>
                </h4>
                <span className="crimes-emergency-helpline-badge">National Helpline: 1930</span>
              </div>

              <ol className="crimes-emergency-steps-list">
                {(selectedCrime.ifTargetedSteps && selectedCrime.ifTargetedSteps.length > 0 ? selectedCrime.ifTargetedSteps : [
                  'Sever all communications with the suspect immediately. Do not attempt to negotiate.',
                  'Capture and preserve uncropped screenshots showing sender headers, mobile numbers, UPI IDs, UTR transaction references, and chat logs.',
                  'Immediately contact your bank branch or hotline to freeze compromised cards, accounts, or UPI handles.',
                  'Dial 1930 and register a formal cybercrime complaint at cybercrime.gov.in.'
                ]).map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>

              <p className="crimes-golden-hour-note">
                <strong>Golden Hour Guidance:</strong> For financial fraud, reporting to <strong>1930</strong> or <strong>cybercrime.gov.in</strong> within the first <strong>2 to 3 hours</strong> affords the highest likelihood for the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) to coordinate inter-bank holds on beneficiary accounts before funds are withdrawn across layered mule wallets. While this is practical guidance and fund recovery cannot be guaranteed, reporting after 3 hours remains vital for police investigation, FIR documentation, and customer liability limitation under RBI directions.
              </p>

              <div className="crimes-emergency-handoff" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed var(--color-border, #D9CBB1)' }}>
                <Link
                  to={`${getContextPath('/prevention')}#immediately`}
                  className="crimes-emergency-handoff-link"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    fontWeight: '600',
                    color: 'var(--color-primary, #1F4D3A)',
                    textDecoration: 'none'
                  }}
                >
                  <span>Open Full Incident Containment Checklist &amp; Evidence Docket Generator</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ----------------------------------------------------------------
              OPTIONAL CONSOLIDATION MICRO-QUIZ (STAGE 8)
              ---------------------------------------------------------------- */}
          {selectedCrime.quickCheckQuestions && selectedCrime.quickCheckQuestions.length > 0 && (
            <section id="quickcheck" className="crimes-stage-section" aria-labelledby="stage-8-title">
              <div className="crimes-stage-header">
                <span className="crimes-stage-eyebrow">STAGE 08 — MICRO-QUIZ CONSOLIDATION</span>
                <h2 id="stage-8-title" className="crimes-stage-title">Micro-Quiz: Test Your Recall</h2>
                <p className="crimes-stage-lead">
                  Check whether you can recognize the key indicators and safer responses for this crime.
                </p>
              </div>

              <div>
                {selectedCrime.quickCheckQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="crimes-microquiz-card">
                    <h4 className="crimes-quiz-q-title">
                      Question {qIdx + 1}: {q.questionText}
                    </h4>

                    <div className="crimes-quiz-options" role="radiogroup" aria-label={`Question ${qIdx + 1}`}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quickCheckAnswers[qIdx] === oIdx;
                        const isCorrect = oIdx === q.correctOptionIndex;

                        let optionClass = 'crimes-quiz-option-btn';
                        if (isSelected) optionClass += ' selected';
                        if (quickCheckChecked) {
                          if (isCorrect) optionClass += ' correct';
                          else if (isSelected) optionClass += ' wrong';
                        }

  return (
                          <button
                            key={oIdx}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={quickCheckChecked}
                            onClick={() => handleQuickCheckSelect(qIdx, oIdx)}
                            className={optionClass}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quickCheckChecked && (
                      <p className="crimes-quiz-explanation">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}

                {!quickCheckChecked ? (
                  <button
                    type="button"
                    onClick={() => setQuickCheckChecked(true)}
                    disabled={Object.keys(quickCheckAnswers).length < selectedCrime.quickCheckQuestions.length}
                    className="btn btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    Verify Answers
                  </button>
                ) : (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text-primary, #26352B)' }}>
                      Score: {calculateQuickCheckScore()} / {selectedCrime.quickCheckQuestions.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickCheckAnswers({});
                        setQuickCheckChecked(false);
                      }}
                      className="btn btn-secondary"
                    >
                      Retry Micro-Quiz
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Bottom Action Footer */}
          <footer className="crimes-detail-footer">
            <div>
              <button
                type="button"
                onClick={() => handleToggleComplete(selectedCrime.slug)}
                className={`btn ${completedCrimes.includes(selectedCrime.slug) ? 'btn-secondary' : 'btn-primary'}`}
              >
                {completedCrimes.includes(selectedCrime.slug) ? 'Mark Incomplete' : '✓ Mark Topic Completed'}
              </button>
            </div>

            <div className="crimes-detail-footer-links">
              <button
                type="button"
                onClick={handleBackToLanding}
                className="btn btn-secondary"
              >
                &larr; Back to Directory
              </button>
              <Link to={getContextPath('/quizzes')} className="btn btn-primary">
                Practice Knowledge Quizzes &rarr;
              </Link>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}

export default Crimes;
