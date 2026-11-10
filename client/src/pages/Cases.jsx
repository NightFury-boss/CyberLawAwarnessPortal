import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialScrollStory from '../components/common/EditorialScrollStory';
import EditorialRule from '../components/common/EditorialRule';
import { performStateTransition } from '../utils/transitionUtils';
import { justiceShortcomingsCasesData } from '../data/justiceShortcomingsCases';

// Collection identifiers
const COLLECTION_LANDMARK = 'Landmark Precedents';
const COLLECTION_SHORTCOMINGS = 'Cases Where Justice Fell Short';

const COLLECTIONS = [
  {
    id: COLLECTION_LANDMARK,
    title: 'Landmark Court Precedents',
    shortTitle: 'Landmark Precedents',
    countBadge: '11 Cases',
    tag: 'Court Rulings & Scam Defense',
    description: 'Court decisions, deceptive scam tactics, and verified steps to protect your rights and accounts under Indian law.'
  },
  {
    id: COLLECTION_SHORTCOMINGS,
    title: 'Cases Where Justice Fell Short',
    shortTitle: 'Justice Fell Short',
    countBadge: '10 Inquiries',
    tag: 'Investigative Gaps & Systemic Hurdles',
    description: 'Documented incidents where victims faced investigation delays, cross-border evidence gaps, banking disputes, or unresolved outcomes.'
  }
];

// Topic categories per collection
const LANDMARK_CATEGORIES = [
  'All',
  'Phishing',
  'UPI/Payment Scams',
  'Vishing',
  'Job Scams',
  'Social Engineering',
  'Identity Theft',
  'Payment Scams',
  'Account Takeover'
];

const SHORTCOMINGS_CATEGORIES = [
  'All',
  'Investigative & Evidentiary Gaps',
  'Banking & Regulatory Inquiries',
  'Platform & Marketplace Lags',
  'Critical Infrastructure & Complex Attribution'
];

// Reader-friendly evidentiary badges with plain-language labels
const getEvidentiaryBadge = (classification) => {
  switch (classification) {
    case 'Established Institutional Failure':
      return {
        label: 'Institutional Failure',
        fullLabel: 'Institutional Failure Documented',
        color: '#9B3E35',
        bg: '#F9ECEB',
        border: '1px solid rgba(155, 62, 53, 0.3)',
        desc: 'A court, ombudsman, or official audit inquiry documented an operational or security omission by a bank, telecom, or platform.'
      };
    case 'Documented Procedural Shortcoming':
      return {
        label: 'Investigation Delay',
        fullLabel: 'Procedural or Investigation Delay Documented',
        color: '#805B43',
        bg: '#FAF4EA',
        border: '1px solid rgba(128, 91, 67, 0.3)',
        desc: 'Documented procedural delays, international evidence hurdles, or jurisdictional limits slowed down investigation or relief.'
      };
    case 'Unresolved Incident':
      return {
        label: 'Unresolved Case',
        fullLabel: 'Unresolved Incident or Attribution',
        color: '#3B6B56',
        bg: '#EEF4F0',
        border: '1px solid rgba(59, 107, 86, 0.3)',
        desc: 'Perpetrator identities, technical attribution, or full incident scope remains unresolved or non-public in official records.'
      };
    case 'Documented Judicial Precedent':
    default:
      return {
        label: 'Court Ruling',
        fullLabel: 'Documented Judicial Precedent',
        color: '#1F4D3A',
        bg: '#EEF4F0',
        border: '1px solid rgba(31, 77, 58, 0.3)',
        desc: 'An adjudicated court judgment that established a legal precedent or clarified statutory rights.'
      };
  }
};

function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Collection State
  const [activeCollection, setActiveCollection] = useState(COLLECTION_LANDMARK);

  // UI states
  const [selectedCaseSlug, setSelectedCaseSlug] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePattern, setActivePattern] = useState(null);

  // Interactive Decision states
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState(null);
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [narrativeUnlocked, setNarrativeUnlocked] = useState(false);

  // User Reading Progress (Local Storage)
  const [completedCases, setCompletedCases] = useState([]);
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  useEffect(() => {
    fetchCases();
    const stored = JSON.parse(localStorage.getItem('completed_cases') || '[]');
    setCompletedCases(stored);
  }, []);

  // Deep linking: sync with URL query (?slug=...) or hash (#...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slugParam = params.get('slug') || (location.hash ? location.hash.replace('#', '') : null);
    if (slugParam !== selectedCaseSlug) {
      setSelectedCaseSlug(slugParam || null);
      if (slugParam) {
        window.scrollTo(0, 0);
      }
    }
  }, [location.search, location.hash, selectedCaseSlug]);

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
      const serverCases = Array.isArray(data) ? data : [];

      // Check if server already returns the "Cases Where Justice Fell Short" collection
      const hasShortcomings = serverCases.some(c => c.collection === COLLECTION_SHORTCOMINGS);
      
      let mergedCases = [...serverCases];
      if (!hasShortcomings) {
        // Fallback to client data fixture if DB hasn't been seeded yet; guard against slug collisions
        const serverSlugs = new Set(serverCases.map(c => c.slug));
        const additional = justiceShortcomingsCasesData.filter(c => !serverSlugs.has(c.slug));
        mergedCases = [...serverCases, ...additional];
      }

      setCases(mergedCases);
    } catch (_err) {
      // In offline preview mode, fall back to client data fixture
      setActiveCollection(COLLECTION_SHORTCOMINGS);
      setCases(justiceShortcomingsCasesData);
      setError('Live catalog synchronization unavailable. Viewing archived records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (slug) => {
    setCaseLoading(true);
    try {
      let data = null;
      try {
        data = await api.getCaseBySlug(slug);
      } catch (_apiErr) {
        const local = cases.find(c => c.slug === slug) || 
                      justiceShortcomingsCasesData.find(c => c.slug === slug);
        if (local) {
          data = local;
        } else {
          throw new Error('Case study not found');
        }
      }

      setSelectedCase(data);

      // Auto-switch collection view if deep-linked to a specific case
      if (data.collection && data.collection !== activeCollection) {
        setActiveCollection(data.collection);
      }

      // Reset interactive state
      setSelectedChoiceIdx(null);
      setDecisionSubmitted(false);
      setDecisionFeedback('');

      // Auto-unlock narrative if no decision points exist
      if (!data.decisionPoints || data.decisionPoints.length === 0) {
        setNarrativeUnlocked(true);
      } else {
        setNarrativeUnlocked(false);
      }
    } catch (_err) {
      setError('Could not load this case study. Please try refreshing the page.');
    } finally {
      setCaseLoading(false);
    }
  };

  const handleSelectCase = (slug) => {
    performStateTransition(() => {
      setSelectedCaseSlug(slug);
      navigate(`?slug=${encodeURIComponent(slug)}`, { replace: false });
      window.scrollTo(0, 0);
    });
  };

  const handleReturnToArchive = () => {
    performStateTransition(() => {
      setSelectedCaseSlug(null);
      setSelectedCase(null);
      navigate(location.pathname, { replace: false });
    });
  };

  const handleCollectionSwitch = (collectionId) => {
    if (activeCollection === collectionId) return;
    performStateTransition(() => {
      setActiveCollection(collectionId);
      setActiveCategory('All');
      setActivePattern(null);
      setSearchQuery('');
    });
  };

  const handlePatternClick = (pattern) => {
    if (activePattern === pattern) {
      setActivePattern(null);
    } else {
      setActivePattern(pattern);
      setActiveCategory('All');
    }
  };

  const handleDecisionSubmit = (optionIdx, option) => {
    if (decisionSubmitted) return;

    performStateTransition(() => {
      setSelectedChoiceIdx(optionIdx);
      setDecisionSubmitted(true);
      setDecisionFeedback(option.explanation);
    });
  };

  const handleUnlockRemainingStory = () => {
    performStateTransition(() => {
      setNarrativeUnlocked(true);
      if (selectedCase && !completedCases.includes(selectedCase.slug)) {
        const nextCompleted = [...completedCases, selectedCase.slug];
        setCompletedCases(nextCompleted);
        localStorage.setItem('completed_cases', JSON.stringify(nextCompleted));
      }
    });
  };

  // Categories derived from active collection
  const categories = activeCollection === COLLECTION_SHORTCOMINGS 
    ? SHORTCOMINGS_CATEGORIES 
    : LANDMARK_CATEGORIES;

  // Patterns lookup list
  const patternsList = [
    { name: 'Urgency', desc: 'Creates extreme time pressure so victims rush and skip verification.' },
    { name: 'Authority', desc: 'Impersonates police, tax officers, or bank officials to demand compliance.' },
    { name: 'Familiarity', desc: 'Copies recognizable brand logos, payment interfaces, or trusted words.' },
    { name: 'Fear', desc: 'Threatens legal action, arrest warrants, or account closure to cause panic.' }
  ];

  // Search configuration
  const casesSearchConfig = {
    title: 50,
    officialCaseName: 30,
    incidentType: 10,
    collectionCategory: 15,
    evidentiaryClassification: 10,
    attackVector: 5,
    summary: 2,
    warningSigns: 2,
    keywords: 5
  };

  const collectionCases = cases.filter(c => {
    const coll = c.collection || COLLECTION_LANDMARK;
    return coll === activeCollection;
  });

  const filteredCases = searchItems(
    collectionCases,
    searchQuery,
    casesSearchConfig,
    (item) => {
      let matchesCategory = true;
      if (activeCategory !== 'All') {
        if (activeCollection === COLLECTION_SHORTCOMINGS) {
          matchesCategory = item.collectionCategory === activeCategory;
        } else {
          matchesCategory = item.incidentType === activeCategory;
        }
      }

      const matchesPattern = !activePattern ||
        item.warningSigns?.some(ws => ws.title?.toLowerCase().includes(activePattern.toLowerCase())) ||
        item.title?.toLowerCase().includes(activePattern.toLowerCase());

      return matchesCategory && matchesPattern;
    }
  );

  const featuredCase = collectionCases.find(c => c.featured && c.published) || collectionCases[0];

  // Difficulty badge helper
  const getDifficultyBadge = (diff) => {
    let color = 'var(--text-muted)';
    let border = '1px solid var(--color-border)';
    let bg = 'var(--color-surface-secondary, #FAF4EA)';
    if (diff === 'Beginner') {
      color = 'var(--color-success, #1F4D3A)';
      bg = '#EEF4F0';
      border = '1px solid rgba(31, 77, 58, 0.25)';
    } else if (diff === 'Intermediate') {
      color = '#805B43';
      bg = '#FAF4EA';
      border = '1px solid rgba(128, 91, 67, 0.25)';
    } else if (diff === 'Advanced') {
      color = 'var(--color-danger, #9B3E35)';
      bg = '#F9ECEB';
      border = '1px solid rgba(155, 62, 53, 0.25)';
    }
    return (
      <span style={{
        fontSize: '0.72rem',
        color,
        backgroundColor: bg,
        border,
        padding: '2px 8px',
        borderRadius: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {diff || 'Standard'}
      </span>
    );
  };

  // Case Type formatting helper
  const getCaseTypeLabel = (type) => {
    switch (type) {
      case 'documented-case':
        return { text: 'REAL INCIDENT', color: '#805B43', bg: '#FAF4EA' };
      case 'educational-reconstruction':
        return { text: 'EDUCATIONAL CASE', color: '#1F4D3A', bg: '#EEF4F0' };
      case 'anonymized-incident':
        return { text: 'ANONYMIZED STORY', color: '#5B4A82', bg: 'rgba(91, 74, 130, 0.08)' };
      case 'fictional-training-scenario':
        return { text: 'PRACTICE SCENARIO', color: '#A65F45', bg: 'rgba(166, 95, 69, 0.08)' };
      default:
        return { text: 'CASE STUDY', color: 'var(--text-muted)', bg: 'var(--color-surface-secondary)' };
    }
  };

  // =========================================================================
  // STORY BUILDER 1: CASES WHERE JUSTICE FELL SHORT (Simplified Headings)
  // =========================================================================
  const buildJusticeShortcomingStorySections = () => {
    if (!selectedCase) return [];

    const evidenceBadge = getEvidentiaryBadge(selectedCase.evidentiaryClassification);
    const caseTypeInfo = getCaseTypeLabel(selectedCase.caseType);

    // Section 1: Case Overview (Part 1)
    const glanceSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 1')) || 
                          selectedCase.narrativeSections?.[0];

    const overviewContent = (
      <div>
        {/* Quick Facts Card */}
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              Case File
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--color-primary, #1F4D3A)', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                {selectedCase.caseNumber}
              </strong>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 'bold',
                backgroundColor: caseTypeInfo.bg,
                color: caseTypeInfo.color
              }}>
                {caseTypeInfo.text}
              </span>
            </div>
            {selectedCase.officialCaseName && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Official Proceeding: </span>
                {selectedCase.officialCaseName}
              </div>
            )}
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              Evidence Status
            </span>
            <div style={{ marginTop: '4px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: evidenceBadge.color,
                backgroundColor: evidenceBadge.bg,
                border: evidenceBadge.border,
                padding: '3px 8px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                {evidenceBadge.fullLabel}
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              Topic
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', display: 'block', marginTop: '4px' }}>
              {selectedCase.collectionCategory || selectedCase.incidentType}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
              Method &amp; Complexity
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedCase.attackVector}</span>
              {getDifficultyBadge(selectedCase.difficulty)}
            </div>
          </div>
        </div>

        {/* Executive Summary Callout */}
        <div style={{
          fontSize: '1.08rem',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
          borderLeft: '4px solid var(--color-accent-terracotta, #805B43)',
          padding: '16px 20px',
          marginBottom: '24px',
          backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
          borderRadius: '0 8px 8px 0'
        }}>
          {selectedCase.shortDescription}
        </div>

        {/* Narrative Part 1 Content */}
        {glanceSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Summary of What Happened
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {glanceSection.body}
            </p>
          </div>
        )}

        {/* Visual 6-Step Story Tracker */}
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: 'var(--space-lg)'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '14px', letterSpacing: '1px' }}>
            Case Reading Progress
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ padding: '6px 10px', backgroundColor: '#EEF4F0', color: '#1F4D3A', borderRadius: '4px', fontWeight: 'bold' }}>1. Overview</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span style={{ padding: '6px 10px', backgroundColor: '#FAF4EA', color: '#805B43', borderRadius: '4px', fontWeight: 'bold' }}>2. Timeline &amp; Choices</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span style={{ padding: '6px 10px', backgroundColor: decisionSubmitted ? '#EEF4F0' : '#F6E39A', color: '#26352B', borderRadius: '4px', fontWeight: 'bold' }}>3. Evidence Check</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span style={{ padding: '6px 10px', backgroundColor: narrativeUnlocked ? '#FAF4EA' : '#F4F2EB', color: narrativeUnlocked ? '#805B43' : 'var(--text-muted)', borderRadius: '4px', fontWeight: 'bold' }}>4. Official Response</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span style={{ padding: '6px 10px', backgroundColor: narrativeUnlocked ? '#EEF4F0' : '#F4F2EB', color: narrativeUnlocked ? '#1F4D3A' : 'var(--text-muted)', borderRadius: '4px', fontWeight: 'bold' }}>5. Legal Lessons</span>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <span style={{ padding: '6px 10px', backgroundColor: narrativeUnlocked ? '#FAF4EA' : '#F4F2EB', color: narrativeUnlocked ? '#805B43' : 'var(--text-muted)', borderRadius: '4px', fontWeight: 'bold' }}>6. What to Do</span>
          </div>
        </div>

        {/* Main Friction Points */}
        {selectedCase.attackerObjectives && selectedCase.attackerObjectives.length > 0 && (
          <div style={{
            backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '18px 20px',
            marginBottom: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Key Hurdles and Exploited Weak Points
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              {selectedCase.attackerObjectives.map((obj, oIdx) => (
                <li key={oIdx} style={{ marginBottom: '6px' }}>{obj}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

    // Section 2: What Happened and When (Part 2)
    const progressionSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 2'));
    const decisionPoint = selectedCase.decisionPoints && selectedCase.decisionPoints[0];

    const progressionContent = (
      <div>
        {progressionSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              The Incident Story
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {progressionSection.body}
            </p>
          </div>
        )}

        {/* Chronological Timeline */}
        {selectedCase.timeline && selectedCase.timeline.length > 0 && (
          <div style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1.05rem', borderBottom: '2px solid var(--color-border-strong, #8F7B5E)', paddingBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '20px' }}>
              INCIDENT TIMELINE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '8px' }}>
              {selectedCase.timeline.map((step, idx) => (
                <div key={idx} className="timeline-step" style={{ display: 'flex', gap: '16px', position: 'relative' }}>
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
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary, #1F4D3A)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    zIndex: 2,
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ paddingBottom: '22px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary)', backgroundColor: 'var(--color-surface-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {step.time}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{step.label}</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Decision Point */}
        {decisionPoint && (
          <div style={{
            backgroundColor: 'var(--color-surface-card, #FFFDF8)',
            border: '1px solid var(--color-border)',
            borderTop: '3px solid var(--color-accent-terracotta, #805B43)',
            borderRadius: '8px',
            padding: 'var(--space-xl)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
            marginTop: 'var(--space-xl)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.1rem' }}>⚖️</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-accent-terracotta, #805B43)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                PAUSE AND THINK — WHAT WOULD YOU DO?
              </span>
            </div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.5' }}>
              {decisionPoint.questionText}
            </h3>

            <div className="portal-decision-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {decisionPoint.options.map((opt, oIdx) => {
                const isSelected = selectedChoiceIdx === oIdx;
                let btnBg = 'var(--color-surface-secondary, #FAF4EA)';
                let btnBorder = '1px solid var(--color-border)';
                if (isSelected) {
                  btnBg = opt.isCorrect ? '#EEF4F0' : '#F9ECEB';
                  btnBorder = opt.isCorrect ? '1px solid #1F4D3A' : '1px solid #9B3E35';
                }

                return (
                  <button
                    key={oIdx}
                    type="button"
                    className="portal-decision-choice-btn"
                    disabled={decisionSubmitted}
                    onClick={() => handleDecisionSubmit(oIdx, opt)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      backgroundColor: btnBg,
                      border: btnBorder,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
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
                      backgroundColor: isSelected ? (opt.isCorrect ? '#1F4D3A' : '#9B3E35') : 'var(--color-surface-card)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      border: isSelected ? 'none' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
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
                backgroundColor: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '#EEF4F0' : '#F9ECEB',
                border: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '1px solid #1F4D3A' : '1px solid #9B3E35',
                borderRadius: '6px',
                padding: '16px 18px',
                marginBottom: '16px'
              }}>
                <strong style={{
                  color: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '#1F4D3A' : '#9B3E35',
                  fontSize: '0.95rem',
                  display: 'block',
                  marginBottom: '6px'
                }}>
                  {decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '✓ Correct Understanding' : '✗ Common Misconception'}
                </strong>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>
                  {decisionFeedback}
                </p>
              </div>
            )}

            {decisionSubmitted && !narrativeUnlocked && (
              <button
                type="button"
                onClick={handleUnlockRemainingStory}
                style={{
                  backgroundColor: 'var(--color-primary, #1F4D3A)',
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
                Continue to Evidence and Official Action &rarr;
              </button>
            )}
          </div>
        )}
      </div>
    );

    // Section 3: What the Evidence Shows (Part 3)
    const evidenceSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 3'));

    const evidenceContent = narrativeUnlocked ? (
      <div>
        {evidenceSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Evidence Breakdown
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {evidenceSection.body}
            </p>
          </div>
        )}

        {/* Three-Pillar Clear Separation Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: 'var(--space-xl)'
        }}>
          {/* Card 1: Confirmed Facts */}
          <div style={{
            backgroundColor: '#EEF4F0',
            border: '1px solid rgba(31, 77, 58, 0.25)',
            borderRadius: '6px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#1F4D3A', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
              <h4 style={{ fontSize: '0.95rem', color: '#1F4D3A', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Confirmed Facts
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#26352B', margin: 0, lineHeight: '1.6' }}>
              Confirmed in court rulings, official government gazettes, RBI directions, or certified audit reports.
            </p>
          </div>

          {/* Card 2: Claims & Allegations */}
          <div style={{
            backgroundColor: '#FAF4EA',
            border: '1px solid rgba(128, 91, 67, 0.25)',
            borderRadius: '6px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#805B43', fontWeight: 'bold', fontSize: '1.1rem' }}>⚠</span>
              <h4 style={{ fontSize: '0.95rem', color: '#805B43', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Claims &amp; Allegations
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#26352B', margin: 0, lineHeight: '1.6' }}>
              Statements made by police, banks, or victims that were not formally proven or adjudicated in court.
            </p>
          </div>

          {/* Card 3: Unresolved Questions */}
          <div style={{
            backgroundColor: 'var(--color-surface-card, #FFFDF8)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '18px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '1.1rem' }}>?</span>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Unresolved Questions
              </h4>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
              Missing technical logs, international data that was never shared, or questions left open after inquiries.
            </p>
          </div>
        </div>

        {/* Fact Separation Note */}
        <div style={{
          backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
          borderLeft: '4px solid var(--color-border-strong, #8F7B5E)',
          padding: '14px 18px',
          borderRadius: '0 4px 4px 0',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6'
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
            Why We Separate Facts from Allegations:
          </strong>
          To uphold fairness and legal accuracy, unproven assumptions (such as blaming an outcome directly on an agency without court findings) are treated as unproven claims, never as confirmed facts.
        </div>
      </div>
    ) : (
      <div style={{ padding: '24px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Answer the decision question in Section 02 to unlock the evidence analysis.
        </p>
      </div>
    );

    // Section 4: How Authorities Responded (Part 4)
    const responseSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 4'));

    const adjudicationContent = narrativeUnlocked ? (
      <div>
        {responseSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Official Actions Taken
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {responseSection.body}
            </p>
          </div>
        )}

        {/* Action Highlights */}
        {selectedCase.response && selectedCase.response.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Key Steps Taken by Authorities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCase.response.map((resp, rIdx) => (
                <div key={rIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-primary, #1F4D3A)', fontWeight: 'bold' }}>•</span>
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>{resp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact Breakdown */}
        {selectedCase.impact && (
          <div style={{
            backgroundColor: 'var(--color-surface-card, #FFFDF8)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Harm and Impact Suffered
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {selectedCase.impact.financial && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Financial Loss</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedCase.impact.financial}</span>
                </div>
              )}
              {selectedCase.impact.account && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Account &amp; Systems</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedCase.impact.account}</span>
                </div>
              )}
              {selectedCase.impact.privacy && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Privacy Compromise</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedCase.impact.privacy}</span>
                </div>
              )}
              {selectedCase.impact.operational && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Investigation Delay</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedCase.impact.operational}</span>
                </div>
              )}
              {selectedCase.impact.emotional && (
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Personal Distress</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedCase.impact.emotional}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div style={{ padding: '24px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Answer the decision question in Section 02 to reveal how authorities responded.
        </p>
      </div>
    );

    // Section 5: Legal Lessons and Key Takeaways (Part 5)
    const lawSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 5'));

    const lawContent = narrativeUnlocked ? (
      <div>
        {lawSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              What This Teaches Us
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {lawSection.body}
            </p>
          </div>
        )}

        {/* Safeguards and Lessons */}
        {selectedCase.preventionLessons && selectedCase.preventionLessons.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Practical Legal Lessons
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCase.preventionLessons.map((lesson, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-success, #1F4D3A)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>
                    {lesson}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Laws Involved */}
        {selectedCase.legalContext && selectedCase.legalContext.length > 0 && (
          <div style={{
            backgroundColor: 'var(--color-surface-card, #FFFDF8)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Relevant Laws and Sections
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
              Provisions governing this case under the Information Technology Act 2000, Bharatiya Nyaya Sanhita 2023, BNSS 2023, or RBI Rules:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {selectedCase.legalContext.map((code, idx) => (
                <Link
                  key={idx}
                  to={getContextPath('/laws')}
                  style={{
                    backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
                    color: 'var(--color-primary, #1F4D3A)',
                    border: '1px solid var(--color-border)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    fontWeight: '600'
                  }}
                >
                  § {code} &rarr;
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div style={{ padding: '24px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Answer the decision question in Section 02 to view the legal lessons.
        </p>
      </div>
    );

    // Section 6: What You Can Do and Where to Learn More (Part 6)
    const guidanceSection = selectedCase.narrativeSections?.find(s => s.heading.includes('Part 6'));

    const guidanceSourcesContent = (
      <div>
        {guidanceSection && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Practical Guidance for Everyday Users
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {guidanceSection.body}
            </p>
          </div>
        )}

        {/* Emergency Reporting Card */}
        <div style={{
          backgroundColor: '#FAF4EA',
          border: '1px solid var(--color-border-strong, #8F7B5E)',
          borderRadius: '8px',
          padding: '22px 24px',
          marginBottom: 'var(--space-xl)'
        }}>
          <h4 style={{ fontSize: '1rem', color: '#805B43', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Immediate Steps if You Face Cyber Fraud
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>National Helpline</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1F4D3A', fontFamily: 'monospace' }}>1930 (Toll-Free, 24x7)</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Central Reporting Portal</span>
              <div><a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#1F4D3A', fontWeight: 'bold', fontSize: '1rem', textDecoration: 'underline' }}>cybercrime.gov.in</a></div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response Window ("Golden Hour")</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>First 2–3 Hours for Inter-Bank Holds</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', borderTop: '1px dashed var(--color-border)', paddingTop: '12px' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Practical Response Guidance:</strong> Prompt reporting to <strong>1930</strong> or <strong>cybercrime.gov.in</strong> within the first 2–3 hours enables authorities to trigger inter-bank coordination via the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS). This window improves the likelihood of temporarily halting fraudulent fund movement across successive accounts before ATM withdrawals or third-party purchases occur.
            </p>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>Reporting After the Window:</strong> Reporting remains essential even if more than 2–3 hours have elapsed. Police complaints, formal FIR registration, beneficiary account flagging, and legal recovery procedures through jurisdictional courts continue to apply regardless of when the incident is reported.
            </p>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-muted)' }}>
              * Realistic Recovery Notice: Inter-bank holds depend on swift coordination between participating banks, payment intermediaries, and nodal police cells. Halting fund movement is an operational safeguard, not an automatic guarantee of account freezing or financial reimbursement.
            </p>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '14px 18px',
          marginBottom: 'var(--space-xl)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          <strong>Legal Awareness Notice:</strong> This case study is published solely for educational awareness and public learning. It does not constitute formal legal advice or representation. Anyone facing active cyber disputes should consult an advocate or report to police authorities.
        </div>

        {/* Official Sources & Citations */}
        {selectedCase.sources && selectedCase.sources.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Primary Sources and Official Records
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCase.sources.map((src, idx) => (
                <div key={idx} style={{
                  backgroundColor: 'var(--color-surface-card, #FFFDF8)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{src.title}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {src.citation || 'Official Record'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                    <span>Authority: <strong>{src.authority}</strong></span>
                    <span>•</span>
                    <span>Date: {src.publicationDate || 'Undated'}</span>
                    <span>•</span>
                    <span>Document: {src.documentType || 'Official'}</span>
                    {src.url && (
                      <>
                        <span>•</span>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #1F4D3A)', textDecoration: 'underline', fontWeight: '600' }}>
                          View Official Document &rarr;
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Explore related legal sections:</span>
            <div style={{ marginTop: '4px' }}>
              <Link
                to={getContextPath('/laws')}
                style={{
                  color: 'var(--color-primary, #1F4D3A)',
                  fontWeight: '600',
                  fontSize: '0.92rem',
                  textDecoration: 'underline'
                }}
              >
                Browse Indian Cyber Law Catalog &rarr;
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReturnToArchive}
            style={{
              backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
              border: '1px solid var(--color-border)',
              color: 'var(--text-primary)',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            Back to Case Catalog
          </button>
        </div>
      </div>
    );

    return [
      {
        id: 'overview',
        number: '01',
        navLabel: 'Overview',
        eyebrow: 'CASE OVERVIEW',
        title: 'Case Overview',
        content: overviewContent
      },
      {
        id: 'chronology',
        number: '02',
        navLabel: 'Timeline',
        eyebrow: 'WHAT HAPPENED',
        title: 'What Happened and When',
        content: progressionContent
      },
      {
        id: 'evidence',
        number: '03',
        navLabel: 'The Evidence',
        eyebrow: 'EVIDENCE ANALYSIS',
        title: 'What the Evidence Shows',
        content: evidenceContent
      },
      {
        id: 'adjudication',
        number: '04',
        navLabel: 'Official Action',
        eyebrow: 'AUTHORITIES',
        title: 'How Authorities Responded',
        content: adjudicationContent
      },
      {
        id: 'statutes',
        number: '05',
        navLabel: 'Legal Lessons',
        eyebrow: 'LEGAL LESSONS',
        title: 'Legal Lessons and Key Takeaways',
        content: lawContent
      },
      {
        id: 'guidance',
        number: '06',
        navLabel: 'Help & Sources',
        eyebrow: 'ACTION & SOURCES',
        title: 'What You Can Do and Where to Learn More',
        content: guidanceSourcesContent
      }
    ];
  };

  // =========================================================================
  // STORY BUILDER 2: LANDMARK PRECEDENTS (Simplified Headings & Polished UI)
  // =========================================================================
  const buildLegacyStorySections = () => {
    if (!selectedCase) return [];

    const caseTypeInfo = getCaseTypeLabel(selectedCase.caseType);

    // Section 1: Case Overview
    const overviewContent = (
      <div>
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: 'var(--space-md) var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>
              Case File
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--color-primary, #1F4D3A)', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                {selectedCase.caseNumber}
              </strong>
              <span className="marginalia-statute-stamp">
                {selectedCase.legalContext?.[0] ? `§ ${selectedCase.legalContext[0]}` : 'STATUTORY ARCHIVE'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>
              Archive Status
            </span>
            <div style={{ marginTop: '4px' }}>
              <strong style={{ color: caseTypeInfo.color, fontSize: '0.9rem' }}>
                {caseTypeInfo.text}
              </strong>
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>
              Attack Method
            </span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem', display: 'block', marginTop: '4px' }}>
              {selectedCase.attackVector}
            </strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 'bold' }}>
              Risk Level
            </span>
            <div style={{ marginTop: '4px' }}>{getDifficultyBadge(selectedCase.difficulty)}</div>
          </div>
        </div>

        <div style={{
          fontSize: '1.08rem',
          color: 'var(--text-primary)',
          lineHeight: '1.7',
          borderLeft: '4px solid var(--color-primary, #1F4D3A)',
          padding: '16px 20px',
          marginBottom: '24px',
          backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
          borderRadius: '0 8px 8px 0'
        }}>
          {selectedCase.shortDescription}
        </div>

        {/* Progression Path */}
        <div style={{
          backgroundColor: 'var(--color-surface-card, #FFFDF8)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: 'var(--space-lg)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '16px', letterSpacing: '0.5px' }}>
            Story Progression
          </span>

          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <svg width="600" height="70" viewBox="0 0 600 70" style={{ minWidth: '500px' }}>
              <line x1="80" y1="30" x2="200" y2="30" stroke={narrativeUnlocked ? 'var(--color-primary, #1F4D3A)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
              <line x1="200" y1="30" x2="320" y2="30" stroke={decisionSubmitted ? 'var(--color-primary, #1F4D3A)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={decisionSubmitted ? 'none' : '4 3'} />
              <line x1="320" y1="30" x2="440" y2="30" stroke={narrativeUnlocked ? 'var(--color-primary, #1F4D3A)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
              <line x1="440" y1="30" x2="560" y2="30" stroke={narrativeUnlocked ? 'var(--color-primary, #1F4D3A)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />

              <circle cx="80" cy="30" r="8" fill="var(--color-primary, #1F4D3A)" />
              <circle cx="80" cy="30" r="4" fill="white" />
              <text x="80" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--text-primary)">1. THE HOOK</text>

              <circle cx="200" cy="30" r="8" fill="var(--color-primary, #1F4D3A)" />
              <circle cx="200" cy="30" r="4" fill="white" />
              <text x="200" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--text-primary)">2. PRESSURE</text>

              <circle cx="320" cy="30" r="10" fill={decisionSubmitted ? (selectedCase.decisionPoints?.[0]?.options[selectedChoiceIdx]?.isCorrect ? '#1F4D3A' : '#9B3E35') : '#805B43'} />
              <text x="320" y="34" textAnchor="middle" fontSize="0.7rem" fontWeight="extrabold" fill="white">?</text>
              <text x="320" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="#805B43">3. YOUR CHOICE</text>

              <circle cx="440" cy="30" r="8" fill={narrativeUnlocked ? 'var(--color-primary, #1F4D3A)' : 'var(--color-border)'} />
              {narrativeUnlocked && <circle cx="440" cy="30" r="4" fill="white" />}
              <text x="440" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'}>4. THE TRAP</text>

              <circle cx="560" cy="30" r="8" fill={narrativeUnlocked ? 'var(--color-success, #1F4D3A)' : 'var(--color-border)'} />
              {narrativeUnlocked && <circle cx="560" cy="30" r="4" fill="white" />}
              <text x="560" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--color-success, #1F4D3A)' : 'var(--text-muted)'}>5. THE LAW</text>
            </svg>
          </div>
        </div>
      </div>
    );

    // Section 2: What Happened
    const totalSections = selectedCase.narrativeSections ? selectedCase.narrativeSections.length : 0;
    const preDecisionSections = (selectedCase.narrativeSections || []).filter((_, idx) => {
      if (narrativeUnlocked) return true;
      const isPostDecisionSection = idx >= Math.max(1, totalSections - 2);
      return !isPostDecisionSection;
    });

    const narrativeContent = (
      <div>
        {preDecisionSections.map((sec, idx) => (
          <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {sec.heading}
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {sec.body}
            </p>
          </div>
        ))}
      </div>
    );

    // Section 3: What Would You Do?
    const decisionPoint = selectedCase.decisionPoints && selectedCase.decisionPoints[0];
    const decisionContent = decisionPoint ? (
      <div style={{
        backgroundColor: 'var(--color-surface-card, #FFFDF8)',
        border: '1px solid var(--color-border)',
        borderTop: '3px solid var(--color-primary, #1F4D3A)',
        borderRadius: '8px',
        padding: 'var(--space-xl)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.25rem' }}>🛑</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary, #1F4D3A)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            PAUSE AND THINK — WHAT WOULD YOU DO?
          </span>
        </div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.5' }}>
          {decisionPoint.questionText}
        </h3>

        <div className="portal-decision-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {decisionPoint.options.map((opt, oIdx) => {
            const isSelected = selectedChoiceIdx === oIdx;
            let btnBg = 'var(--color-surface-secondary, #FAF4EA)';
            let btnBorder = '1px solid var(--color-border)';
            if (isSelected) {
              btnBg = opt.isCorrect ? '#EEF4F0' : '#F9ECEB';
              btnBorder = opt.isCorrect ? '1px solid #1F4D3A' : '1px solid #9B3E35';
            }

            return (
              <button
                key={oIdx}
                type="button"
                className="portal-decision-choice-btn"
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
                  backgroundColor: isSelected ? (opt.isCorrect ? '#1F4D3A' : '#9B3E35') : 'var(--color-surface-card)',
                  color: isSelected ? 'white' : 'var(--text-secondary)',
                  border: isSelected ? 'none' : '1px solid var(--color-border)',
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
            backgroundColor: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '#EEF4F0' : '#F9ECEB',
            border: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '1px solid #1F4D3A' : '1px solid #9B3E35',
            borderRadius: '6px',
            padding: '18px 20px',
            marginBottom: '20px'
          }}>
            <strong style={{
              color: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '#1F4D3A' : '#9B3E35',
              fontSize: '1rem',
              display: 'block',
              marginBottom: '4px'
            }}>
              {decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '✓ Safe and Correct Choice' : '✗ Security Risk'}
            </strong>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
              {decisionFeedback}
            </p>
          </div>
        )}

        {decisionSubmitted && !narrativeUnlocked && (
          <button
            type="button"
            onClick={handleUnlockRemainingStory}
            style={{
              backgroundColor: 'var(--color-primary, #1F4D3A)',
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
            Continue Reading the Full Case &rarr;
          </button>
        )}
      </div>
    ) : (
      <div style={{ padding: '20px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>This case is filed for direct review without branching choices.</p>
      </div>
    );

    // Section 4: How the Trap Worked and the Impact
    const deceptionImpactContent = narrativeUnlocked ? (
      <div>
        {(selectedCase.narrativeSections || []).map((sec, idx) => {
          const isPostDecisionSection = idx >= Math.max(1, totalSections - 2);
          if (!isPostDecisionSection) return null;
          return (
            <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {sec.heading}
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-primary)', textAlign: 'justify' }}>
                {sec.body}
              </p>
            </div>
          );
        })}

        {selectedCase.timeline && selectedCase.timeline.length > 0 && (
          <div style={{ marginBottom: 'var(--space-2xl)', marginTop: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '2px solid var(--color-primary, #1F4D3A)', paddingBottom: '8px', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '20px' }}>
              INCIDENT TIMELINE
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '12px' }}>
              {selectedCase.timeline.map((step, idx) => (
                <div key={idx} className="timeline-step" style={{ display: 'flex', gap: '20px', position: 'relative' }}>
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
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary, #1F4D3A)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    zIndex: 2,
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ paddingBottom: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--color-primary, #1F4D3A)', backgroundColor: 'var(--color-surface-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        {step.time}
                      </span>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{step.label}</strong>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCase.impact && (
          <div style={{
            backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px' }}>
              Incident Impact Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Financial Loss</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.financial}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Account Status</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.account}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Privacy / Data</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.privacy}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Operational</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedCase.impact.operational}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div style={{ padding: '24px', backgroundColor: 'var(--color-surface-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Answer the decision question in Section 03 to unlock the scam breakdown and impact details.
        </p>
      </div>
    );

    // Section 5: Legal Lessons and Safety Steps
    const preventionLawContent = (
      <div>
        {selectedCase.preventionLessons && selectedCase.preventionLessons.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '12px' }}>
              Safety Steps and Takeaways
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCase.preventionLessons.map((lesson, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-success, #1F4D3A)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>
                    {lesson}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedCase.legalContext && selectedCase.legalContext.length > 0 && (
          <div style={{
            backgroundColor: 'var(--color-surface-card, #FFFDF8)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Relevant Legal Provisions (IT Act, 2000)
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
              The actions documented in this incident violate specific sections of Indian cyber law:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedCase.legalContext.map((code, idx) => (
                <Link
                  key={idx}
                  to={getContextPath('/laws')}
                  style={{
                    backgroundColor: 'var(--color-primary, #1F4D3A)',
                    color: 'white',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  {code} Details &rarr;
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );

    // Section 6: Official Sources and Next Steps
    const sourcesActionsContent = (
      <div>
        {selectedCase.sources && selectedCase.sources.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Official Incident Sources &amp; Advisories
            </span>
            {selectedCase.sources.map((src, idx) => (
              <div key={idx} style={{ marginBottom: '6px', lineHeight: '1.5' }}>
                • {src.title} — <strong>{src.authority}</strong> ({src.publicationDate || 'Undated'}) | {' '}
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #1F4D3A)', textDecoration: 'underline' }}>
                    View Advisory Source
                  </a>
                ) : (
                  <span>Official Reference Record</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {selectedCase.relatedCrimes && selectedCase.relatedCrimes.length > 0 ? (
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Learn more about this threat type:</span>
              <div style={{ marginTop: '4px' }}>
                <Link
                  to={getContextPath('/crimes')}
                  style={{
                    color: 'var(--color-primary, #1F4D3A)',
                    fontWeight: '600',
                    fontSize: '0.95rem',
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
            type="button"
            onClick={handleReturnToArchive}
            style={{
              backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
              border: '1px solid var(--color-border)',
              color: 'var(--text-primary)',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            Back to Case Catalog
          </button>
        </div>
      </div>
    );

    return [
      {
        id: 'overview',
        number: '01',
        navLabel: 'Overview',
        eyebrow: 'CASE OVERVIEW',
        title: 'Case Overview',
        content: overviewContent
      },
      {
        id: 'narrative',
        number: '02',
        navLabel: 'The Story',
        eyebrow: 'INCIDENT STORY',
        title: 'What Happened and How It Began',
        content: narrativeContent
      },
      {
        id: 'decision',
        number: '03',
        navLabel: 'Your Decision',
        eyebrow: 'WHAT WOULD YOU DO?',
        title: 'What Would You Do?',
        content: decisionContent
      },
      {
        id: 'deception-impact',
        number: '04',
        navLabel: 'How It Worked',
        eyebrow: 'SCAM BREAKDOWN',
        title: 'How the Trap Worked and the Impact',
        content: deceptionImpactContent
      },
      {
        id: 'prevention-law',
        number: '05',
        navLabel: 'Legal Lessons',
        eyebrow: 'SAFETY & LAW',
        title: 'Legal Lessons and Safety Steps',
        content: preventionLawContent
      },
      {
        id: 'sources',
        number: '06',
        navLabel: 'Help & Sources',
        eyebrow: 'ACTION & SOURCES',
        title: 'Official Sources and Next Steps',
        content: sourcesActionsContent
      }
    ];
  };

  const buildStorySections = () => {
    if (!selectedCase) return [];
    if (selectedCase.collection === COLLECTION_SHORTCOMINGS || selectedCase.evidentiaryClassification) {
      return buildJusticeShortcomingStorySections();
    }
    return buildLegacyStorySections();
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* 1. LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <h3 style={{ color: 'var(--text-primary)' }}>Opening Case Studies...</h3>
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
          <WorkspaceBreadcrumb />
          
          <EditorialPageHeader
            eyebrow="Real Cases &amp; Court Lessons"
            title="Cyber Cases: Lessons from the Real World"
            subtitle='"Knowing what happened is useful. Recognizing the pattern before it happens is protection."'
            description="Explore important court decisions, real cybercrime incidents, and the lessons they teach us about digital safety and justice."
          />

          {/* ================================================================= */}
          {/* COLLECTION SWITCHER TABS */}
          {/* ================================================================= */}
          <div 
            className="case-collection-tabs"
            role="tablist" 
            aria-label="Case Collections"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
              marginBottom: 'var(--space-xl)',
              marginTop: 'var(--space-md)'
            }}
          >
            {COLLECTIONS.map((coll) => {
              const isActive = activeCollection === coll.id;
              const count = cases.filter(c => (c.collection || COLLECTION_LANDMARK) === coll.id).length;
              const tabSlug = String(coll.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
              const activePanelSlug = String(activeCollection || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');

              return (
                <div
                  key={coll.id}
                  id={`collection-tab-${tabSlug}`}
                  role="tab"
                  tabIndex={0}
                  aria-selected={isActive}
                  aria-controls={`collection-panel-${activePanelSlug}`}
                  onClick={() => handleCollectionSwitch(coll.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCollectionSwitch(coll.id);
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '22px 24px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'var(--color-surface-card, #FFFDF8)' : 'var(--color-surface-secondary, #FAF4EA)',
                    border: isActive ? '2px solid var(--color-primary, #1F4D3A)' : '1px solid var(--color-border)',
                    boxShadow: isActive ? '0 4px 12px rgba(31, 77, 58, 0.08)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        color: isActive ? 'var(--color-primary, #1F4D3A)' : 'var(--text-muted)'
                      }}>
                        {coll.tag}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: isActive ? 'var(--color-primary, #1F4D3A)' : '#E8DFCE',
                        color: isActive ? '#ffffff' : 'var(--text-primary)',
                        padding: '3px 10px',
                        borderRadius: '12px'
                      }}>
                        {count} Cases
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.25rem',
                      color: 'var(--text-primary)',
                      fontWeight: 'bold',
                      margin: '0 0 8px 0'
                    }}>
                      {coll.title}
                    </h3>

                    <p style={{
                      fontSize: '0.88rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {coll.description}
                    </p>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 'bold', color: isActive ? 'var(--color-primary, #1F4D3A)' : 'var(--text-muted)' }}>
                    <span>{isActive ? '● Currently viewing collection' : '○ Click to view collection'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SEARCH COMPONENT */}
          <PortalSearch
            placeholder={activeCollection === COLLECTION_SHORTCOMINGS 
              ? "Search institutional inquiries, police delays, or cases..." 
              : "Search court cases, scams, or warning signs..."}
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            onClear={() => setSearchQuery('')}
            results={filteredCases}
            resultTypeLabel="case studies found"
            emptyHeader="NO MATCHING CASE STUDIES"
            emptyText="Try searching for a different keyword or topic (e.g. loan apps, banking, fake police call, SIM swap, UPI)."
            suggestions={activeCollection === COLLECTION_SHORTCOMINGS 
              ? ['Loan apps', 'Banking ombudsman', 'AePS fingerprint', 'Pegasus', 'Ransomware', 'Cross-border delay'] 
              : ['UPI scams', 'Phishing', 'Fake police call', 'OTP fraud', 'Job scams']}
          />

          {/* FEATURED CASE SPOTLIGHT */}
          {!searchQuery && activeCategory === 'All' && !activePattern && featuredCase && (
            <div style={{
              backgroundColor: 'var(--color-surface-card, #FFFDF8)',
              border: '1px solid var(--color-border)',
              borderTop: '3px solid var(--color-primary, #1F4D3A)',
              padding: 'var(--space-xl)',
              borderRadius: '8px',
              marginBottom: 'var(--space-xxl)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-xl)',
              alignItems: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
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
                  {featuredCase.evidentiaryClassification && (
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      backgroundColor: getEvidentiaryBadge(featuredCase.evidentiaryClassification).bg,
                      color: getEvidentiaryBadge(featuredCase.evidentiaryClassification).color,
                      border: getEvidentiaryBadge(featuredCase.evidentiaryClassification).border
                    }}>
                      {getEvidentiaryBadge(featuredCase.evidentiaryClassification).label}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.3' }}>
                  {featuredCase.title}
                </h2>
                {featuredCase.officialCaseName && (
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>
                    Official Record: {featuredCase.officialCaseName}
                  </div>
                )}
                <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                  {featuredCase.shortDescription}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  <span>Method: <strong style={{ color: 'var(--text-primary)' }}>{featuredCase.attackVector}</strong></span>
                  <span>•</span>
                  <span>Topic: <strong style={{ color: 'var(--text-primary)' }}>{featuredCase.collectionCategory || featuredCase.incidentType}</strong></span>
                  <span>•</span>
                  {getDifficultyBadge(featuredCase.difficulty)}
                </div>
                <button
                  onClick={() => handleSelectCase(featuredCase.slug)}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem'
                  }}
                >
                  Read Case Story &rarr;
                </button>
              </div>
              <div style={{
                fontStyle: 'italic',
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--color-surface-secondary, #FAF4EA)',
                padding: '20px',
                borderRadius: '6px',
                borderLeft: '3px solid var(--color-border-strong, #8F7B5E)'
              }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)', fontStyle: 'normal', marginBottom: '6px', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Key Takeaway:
                </strong>
                "{featuredCase.sourceSummary || 'Reviewing critical evidentiary and procedural records.'}"
              </div>
            </div>
          )}

          {/* COMMON SCAM TACTICS (Shown for Landmark Precedents) */}
          {activeCollection === COLLECTION_LANDMARK && (
            <div style={{
              marginBottom: 'var(--space-xxl)',
              borderTop: '1px solid var(--color-border)',
              paddingTop: 'var(--space-xl)'
            }}>
              <span style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: 'var(--color-accent-terracotta, #805B43)',
                fontWeight: '800',
                display: 'block',
                marginBottom: '8px'
              }}>
                Deceptive Scam Tactics
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: 'var(--space-lg)' }}>
                How Scammers Trick Victims
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px 36px' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        0{idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {p.name}
                      </strong>
                      {activePattern === p.name && (
                        <span style={{ fontSize: '0.7rem', color: '#ffffff', backgroundColor: 'var(--color-primary, #1F4D3A)', padding: '2px 8px', borderRadius: '4px', marginLeft: 'auto', fontWeight: 'bold' }}>
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
          )}

          {/* CASE CATALOG LIST INDEX */}
          <div 
            id={`collection-panel-${String(activeCollection || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`}
            role="tabpanel"
            aria-labelledby={`collection-tab-${String(activeCollection || '').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`}
          >
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
                    {activeCollection === COLLECTION_SHORTCOMINGS ? 'Documented Inquiries' : 'Court Precedents Archive'}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                    {activeCollection === COLLECTION_SHORTCOMINGS ? 'Documented Case Inquiries' : 'Court Precedents & Scam Cases'}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', backgroundColor: 'var(--color-surface-secondary, #FAF4EA)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                    {filteredCases.length} cases listed
                  </span>
                  {completedCases.length > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success, #1F4D3A)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      Read
                    </span>
                  )}
                </div>
              </div>

              {/* Integrated Topic Filter Row */}
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
                  Filter by topic:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setActivePattern(null);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: activeCategory === cat ? '1px solid var(--color-primary, #1F4D3A)' : '1px solid var(--color-border)',
                        backgroundColor: activeCategory === cat ? 'var(--color-primary, #1F4D3A)' : 'var(--color-surface-card, #FFFDF8)',
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
                      type="button"
                      onClick={() => setActivePattern(null)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-primary, #1F4D3A)',
                        backgroundColor: 'var(--color-primary, #1F4D3A)',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Tactic: {activePattern} &times;
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filteredCases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--color-surface-secondary, #FAF4EA)', border: '1px dashed var(--color-border)', borderRadius: '4px' }}>
                <p style={{ color: 'var(--text-muted)' }}>No case studies match your active search or topic filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {filteredCases.map((cs) => {
                  const tagInfo = getCaseTypeLabel(cs.caseType);
                  const isCompleted = completedCases.includes(cs.slug);
                  const evidenceInfo = cs.evidentiaryClassification ? getEvidentiaryBadge(cs.evidentiaryClassification) : null;

                  return (
                    <div
                      key={cs._id || cs.slug}
                      id={cs.slug}
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                            {cs.caseNumber}
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
                          {evidenceInfo && (
                            <span style={{
                              fontSize: '0.65rem',
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontWeight: 'bold',
                              backgroundColor: evidenceInfo.bg,
                              color: evidenceInfo.color,
                              border: evidenceInfo.border
                            }}>
                              {evidenceInfo.label}
                            </span>
                          )}
                          {cs.legalContext && cs.legalContext.length > 0 && (
                            <span className="marginalia-statute-stamp">
                              § {cs.legalContext[0]}
                            </span>
                          )}
                          {isCompleted && (
                            <span style={{
                              fontSize: '0.7rem',
                              color: 'var(--color-success, #1F4D3A)',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              backgroundColor: '#EEF4F0',
                              padding: '2px 8px',
                              borderRadius: '3px'
                            }}>
                              Read
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

                      <h3 style={{ fontSize: '1.28rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: '4px 0 2px 0' }}>
                        {cs.title}
                      </h3>

                      {cs.officialCaseName && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '0 0 4px 0' }}>
                          Official Record: {cs.officialCaseName}
                        </div>
                      )}

                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: '1.6', maxWidth: '850px' }}>
                        {cs.shortDescription}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                          Topic: <strong style={{ color: 'var(--text-secondary)' }}>{cs.collectionCategory || cs.incidentType}</strong>
                        </span>
                        <span className="interactive-link" style={{ color: 'var(--color-primary, #1F4D3A)' }}>
                          Read Case Story <span className="arrow link-arrow">&rarr;</span>
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
        <div id={selectedCase.slug} style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <WorkspaceBreadcrumb
            currentItem={selectedCase.title}
            onParentClick={handleReturnToArchive}
          />

          {/* Top navigation */}
          <button
            onClick={handleReturnToArchive}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--color-primary, #1F4D3A)',
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
            &larr; Back to Case Catalog
          </button>

          {caseLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>Loading Case Story...</h3>
            </div>
          ) : (
            <EditorialScrollStory
              contextBadge={selectedCase.caseNumber || 'CASE FILE'}
              contextTitle={selectedCase.title}
              contextSubtitle={selectedCase.collectionCategory || selectedCase.incidentType}
              sections={buildStorySections()}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Cases;
