import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialScrollStory from '../components/common/EditorialScrollStory';
import EditorialRule from '../components/common/EditorialRule';
import { performStateTransition } from '../utils/transitionUtils';

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
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  useEffect(() => {
    fetchCases();
    const stored = JSON.parse(localStorage.getItem('completed_cases') || '[]');
    setCompletedCases(stored);
  }, []);

  // Sync with URL query or hash for deep linking (e.g. /cases?slug=classified-marketplace-qr-fraud)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const slugParam = params.get('slug') || (location.hash ? location.hash.replace('#', '') : null);
    if (slugParam && slugParam !== selectedCaseSlug) {
      setSelectedCaseSlug(slugParam);
      window.scrollTo(0, 0);
    }
  }, [location.search, location.hash]);

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
    performStateTransition(() => {
      setSelectedCaseSlug(slug);
      window.scrollTo(0, 0);
    });
  };

  const handleReturnToArchive = () => {
    performStateTransition(() => {
      setSelectedCaseSlug(null);
      setSelectedCase(null);
    });
  };

  const handlePatternClick = (pattern) => {
    if (activePattern === pattern) {
      setActivePattern(null); // toggle off
    } else {
      setActivePattern(pattern);
      setActiveCategory('All'); // clear category filter to allow pattern search
    }
  };

  // Submit decision point with intentional state transition
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
      // Mark case as completed in progress
      if (selectedCase && !completedCases.includes(selectedCase.slug)) {
        const nextCompleted = [...completedCases, selectedCase.slug];
        setCompletedCases(nextCompleted);
        localStorage.setItem('completed_cases', JSON.stringify(nextCompleted));
      }
    });
  };

  // Categories helper derived from seed data
  const categories = ['All', 'Phishing', 'UPI/Payment Scams', 'Vishing', 'Job Scams', 'Social Engineering', 'Identity Theft', 'Payment Scams', 'Account Takeover'];

  // Patterns lookup list
  const patternsList = [
    { name: 'Urgency', desc: 'Attacker creates extreme pressure so victims skip safety verification.' },
    { name: 'Authority', desc: 'Impersonating police, military, or banking officials to bypass trust barriers.' },
    { name: 'Familiarity', desc: 'Imitating recognizable logos, layouts, or language styles.' },
    { name: 'Fear', desc: 'Threatening account suspension or judicial arrests to induce compliance.' }
  ];

  // Combined client-side filtering for cases archive list
  const casesSearchConfig = {
    title: 50,
    incidentType: 10,
    attackVector: 5,
    summary: 2,
    warningSigns: 2,
    keywords: 5
  };

  const filteredCases = searchItems(
    cases,
    searchQuery,
    casesSearchConfig,
    (item) => {
      const matchesCategory = activeCategory === 'All' || item.incidentType === activeCategory;
      const matchesPattern = !activePattern ||
        item.warningSigns?.some(ws => ws.title.toLowerCase().includes(activePattern.toLowerCase())) ||
        item.title.toLowerCase().includes(activePattern.toLowerCase());
      return matchesCategory && matchesPattern;
    }
  );

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

  const buildCaseStorySections = () => {
    if (!selectedCase) return [];

    const caseTypeInfo = getCaseTypeLabel(selectedCase.caseType);

    // Section 1: Overview & Incident Context
    const overviewContent = (
      <div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              <strong style={{ color: 'var(--accent-navy)', fontSize: '1rem' }}>{selectedCase.caseNumber}</strong>
              <span className="marginalia-statute-stamp">
                {selectedCase.legalContext?.[0] ? `§ ${selectedCase.legalContext[0]}` : 'STATUTORY ARCHIVE'}
              </span>
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
              Archive Status
            </span>
            <strong style={{ color: caseTypeInfo.color, fontSize: '0.9rem' }}>
              {caseTypeInfo.text}
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

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: '1.68', fontStyle: 'italic', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px', marginBottom: '24px' }}>
          {selectedCase.shortDescription}
        </p>

        {/* INCIDENT PROGRESSION PATH (SVG Graphic) */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '20px',
          marginBottom: 'var(--space-lg)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '16px', letterSpacing: '0.5px' }}>
            Incident Audit Progression Path
          </span>

          <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
            <svg width="600" height="70" viewBox="0 0 600 70" style={{ minWidth: '500px' }}>
              <line x1="80" y1="30" x2="200" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
              <line x1="200" y1="30" x2="320" y2="30" stroke={decisionSubmitted ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={decisionSubmitted ? 'none' : '4 3'} />
              <line x1="320" y1="30" x2="440" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />
              <line x1="440" y1="30" x2="560" y2="30" stroke={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} strokeWidth="2" strokeDasharray={narrativeUnlocked ? 'none' : '4 3'} />

              <circle cx="80" cy="30" r="8" fill="var(--accent-navy)" />
              <circle cx="80" cy="30" r="4" fill="white" />
              <text x="80" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--accent-navy)">1. BAIT</text>

              <circle cx="200" cy="30" r="8" fill="var(--accent-navy)" />
              <circle cx="200" cy="30" r="4" fill="white" />
              <text x="200" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="var(--accent-navy)">2. LEVERAGE</text>

              <circle cx="320" cy="30" r="10" fill={decisionSubmitted ? (selectedCase.decisionPoints?.[0]?.options[selectedChoiceIdx]?.isCorrect ? 'var(--color-success)' : 'var(--color-error)') : '#f59e0b'} />
              <text x="320" y="34" textAnchor="middle" fontSize="0.7rem" fontWeight="extrabold" fill="white">?</text>
              <text x="320" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill="#f59e0b">3. CHOICE</text>

              <circle cx="440" cy="30" r="8" fill={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--color-border)'} />
              {narrativeUnlocked && <circle cx="440" cy="30" r="4" fill="white" />}
              <text x="440" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--accent-navy)' : 'var(--text-muted)'}>4. IMPACT</text>

              <circle cx="560" cy="30" r="8" fill={narrativeUnlocked ? 'var(--color-success)' : 'var(--color-border)'} />
              {narrativeUnlocked && <circle cx="560" cy="30" r="4" fill="white" />}
              <text x="560" y="52" textAnchor="middle" fontSize="0.75rem" fontWeight="bold" fill={narrativeUnlocked ? 'var(--color-success)' : 'var(--text-muted)'}>5. LAW</text>
            </svg>
          </div>
        </div>
      </div>
    );

    // Section 2: Narrative
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px' }}>
              {sec.heading}
            </h3>
            <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-primary)', textAlign: 'justify' }}>
              {sec.body}
            </p>
          </div>
        ))}
      </div>
    );

    // Section 3: Critical Decision Point
    const decisionPoint = selectedCase.decisionPoints && selectedCase.decisionPoints[0];
    const decisionContent = decisionPoint ? (
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--accent-navy)',
        borderRadius: '6px',
        padding: 'var(--space-xl)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Editorial State Transition Sequence: SITUATION → DECISION → OUTCOME */}
        <div className="portal-state-sequence-bar" aria-label="Investigation lifecycle progression">
          <span className="portal-state-sequence-node completed">
            <span>✓</span>
            <span>Situation</span>
          </span>
          <span className="portal-state-sequence-arrow active" aria-hidden="true">&rarr;</span>
          <span className={`portal-state-sequence-node ${!decisionSubmitted ? 'active' : 'completed'}`}>
            <span>{!decisionSubmitted ? '●' : '✓'}</span>
            <span>Decision</span>
          </span>
          <span className={`portal-state-sequence-arrow ${decisionSubmitted ? 'active' : ''}`} aria-hidden="true">&rarr;</span>
          <span className={`portal-state-sequence-node ${decisionSubmitted ? 'active' : ''}`}>
            <span>{decisionSubmitted ? '●' : '○'}</span>
            <span>Legal Outcome</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '1.25rem' }}>🛑</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            PAUSE — CRITICAL DECISION POINT
          </span>
        </div>
        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '16px', lineHeight: '1.5' }}>
          {decisionPoint.questionText}
        </h3>

        <div className="portal-decision-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {decisionPoint.options.map((opt, oIdx) => {
            const isSelected = selectedChoiceIdx === oIdx;
            let btnBg = 'var(--bg-primary)';
            let btnBorder = '1px solid var(--color-border)';
            if (isSelected) {
              btnBg = opt.isCorrect ? 'rgba(47, 111, 94, 0.08)' : 'rgba(163, 74, 74, 0.08)';
              btnBorder = opt.isCorrect ? '1px solid var(--color-safe)' : '1px solid var(--color-risk)';
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
                  backgroundColor: isSelected ? (opt.isCorrect ? 'var(--color-safe)' : 'var(--color-risk)') : 'var(--bg-secondary)',
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
          <div 
            className="decision-outcome-settle"
            style={{
              backgroundColor: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? 'rgba(47, 111, 94, 0.06)' : 'rgba(163, 74, 74, 0.06)',
              border: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '1px solid rgba(47, 111, 94, 0.3)' : '1px solid rgba(163, 74, 74, 0.3)',
              borderRadius: '6px',
              padding: '18px 20px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <strong style={{
                color: decisionPoint.options[selectedChoiceIdx]?.isCorrect ? 'var(--color-safe)' : 'var(--color-risk)',
                fontSize: '1rem'
              }}>
                {decisionPoint.options[selectedChoiceIdx]?.isCorrect ? '✓ Verified Safe Action' : '✗ Security Boundary Compromised'}
              </strong>
            </div>
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
    ) : (
      <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>This documented incident is filed for direct review without branching choices.</p>
      </div>
    );

    // Section 4: Deception & Impact
    const deceptionImpactContent = narrativeUnlocked ? (
      <div className="portal-state-reveal-down unlocked-content-animation">
        {/* Thin-line progression indicator connecting decision to full forensic breakdown */}
        <div className="portal-progression-track" style={{ marginBottom: '20px' }} aria-hidden="true">
          <div className="portal-progression-indicator" style={{ width: '100%' }} />
        </div>
        {(selectedCase.narrativeSections || []).map((sec, idx) => {
          const isPostDecisionSection = idx >= Math.max(1, totalSections - 2);
          if (!isPostDecisionSection) return null;
          return (
            <div key={idx} style={{ marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px' }}>
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
            <h3 style={{ fontSize: '1.25rem', borderBottom: '2px solid var(--accent-navy)', paddingBottom: '8px', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '20px' }}>
              INCIDENT TIMELINE
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingLeft: '12px' }}>
              {selectedCase.timeline.map((step, idx) => {
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
              Why the Situation Was Convincing
            </h4>
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
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

            {selectedCase.attackerObjectives && (
              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
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
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
              Warning Signs Present
            </h4>
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

        {selectedCase.impact && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '16px' }}>
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
      <div style={{ padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px', border: '1px dashed var(--color-border)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
          Evaluate the critical decision point above to unlock the forensic timeline, deception breakdown, and impact analysis.
        </p>
      </div>
    );

    // Section 5: Prevention & Law
    const preventionLawContent = (
      <div>
        {selectedCase.preventionLessons && selectedCase.preventionLessons.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '12px' }}>
              Prevention Lessons
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedCase.preventionLessons.map((lesson, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✓</span>
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
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            padding: 'var(--space-lg)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Applicable Legal Provisions (IT Act, 2000)
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
              The actions documented in this incident profile violate specific provisions of the Information Technology Act. Click a provision to read details:
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {selectedCase.legalContext.map((code, idx) => (
                <Link
                  key={idx}
                  to={getContextPath('/laws')}
                  style={{
                    backgroundColor: 'var(--accent-navy)',
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

    // Section 6: Sources & Records
    const sourcesActionsContent = (
      <div>
        {selectedCase.sources && selectedCase.sources.length > 0 && (
          <div style={{ marginBottom: 'var(--space-xl)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--accent-navy)' }}>
              Official Incident Sources & Advisories
            </span>
            {selectedCase.sources.map((src, idx) => (
              <div key={idx} style={{ marginBottom: '6px', lineHeight: '1.5' }}>
                • {src.title} — <strong>{src.authority}</strong> ({src.publicationDate || 'Undated'}) | {' '}
                {src.url ? (
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-navy)', textDecoration: 'underline' }}>
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
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Read threat characteristics in:</span>
              <div style={{ marginTop: '4px' }}>
                <Link
                  to={getContextPath('/crimes')}
                  style={{
                    color: 'var(--accent-navy)',
                    fontWeight: 'bold',
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
            Close Case Details
          </button>
        </div>
      </div>
    );

    return [
      {
        id: 'overview',
        number: '01',
        navLabel: 'Overview',
        eyebrow: 'CASE METADATA',
        title: selectedCase.title,
        content: overviewContent
      },
      {
        id: 'narrative',
        number: '02',
        navLabel: 'Incident Account',
        eyebrow: 'CHRONOLOGICAL NARRATIVE',
        title: 'The Incident Progression',
        content: narrativeContent
      },
      {
        id: 'decision',
        number: '03',
        navLabel: 'Decision Point',
        eyebrow: 'CRITICAL PAUSE',
        title: 'Pivotal Decision Point',
        content: decisionContent
      },
      {
        id: 'deception-impact',
        number: '04',
        navLabel: 'Deception & Impact',
        eyebrow: 'INCIDENT ANALYSIS',
        title: 'Deception Dynamics & Impact Analysis',
        content: deceptionImpactContent
      },
      {
        id: 'prevention-law',
        number: '05',
        navLabel: 'Prevention & Law',
        eyebrow: 'DEFENSE & STATUTES',
        title: 'Prevention Lessons & Statutory Context',
        content: preventionLawContent
      },
      {
        id: 'sources',
        number: '06',
        navLabel: 'Sources & Records',
        eyebrow: 'OFFICIAL RECORD',
        title: 'Official Advisory Records & Actions',
        content: sourcesActionsContent
      }
    ];
  };

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      {/* 1. LOADING STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <h3 style={{ color: 'var(--accent-navy)' }}>Opening Case Studies...</h3>
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
            eyebrow="Case Archive"
            title="Incident Case Studies"
            subtitle='"Knowing what happened is useful. Recognizing the pattern before it happens is better."'
            description="Explore documented attack methods, analyze visual timelines, make critical decisions in situational mockups, and extract security lessons from previous fraud files."
          />

          <PortalSearch
            placeholder="Search incidents, tactics, or case topics"
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            onClear={() => setSearchQuery('')}
            results={filteredCases}
            resultTypeLabel="incidents found"
            emptyHeader="NO MATCHING CASE FILES"
            emptyText="Try searching for a different attack method, warning sign, or category keyword (e.g. UPI, phishing, vishing)."
            suggestions={['UPI', 'phishing', 'vishing', 'OTP', 'support']}
          />

          {/* FEATURED INCIDENT FILE (If present and search/filters are empty) */}
          {!searchQuery && activeCategory === 'All' && !activePattern && featuredCase && (
            <div style={{
              backgroundColor: 'var(--accent-navy-light)',
              borderLeft: '4px solid var(--accent-navy)',
              padding: 'var(--space-xl)',
              borderRadius: '6px',
              marginBottom: 'var(--space-xxl)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
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
                    DOCUMENTED CASE FILES
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500', backgroundColor: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '4px' }}>
                    {filteredCases.length} files
                  </span>
                  {completedCases.length > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
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
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent-navy)', fontWeight: 'bold' }}>
                            {cs.caseNumber?.startsWith('CASE FILE') ? cs.caseNumber : `CASE FILE ${cs.caseNumber?.replace('CASE-', '') || ''}`}
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
                          {cs.legalContext && cs.legalContext.length > 0 && (
                            <span className="marginalia-statute-stamp">
                              § {cs.legalContext[0]}
                            </span>
                          )}
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
                          Examine Case File <span className="arrow link-arrow">&rarr;</span>
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
            <EditorialScrollStory
              contextBadge={selectedCase.caseNumber || 'CASE FILE'}
              contextTitle={selectedCase.title}
              contextSubtitle={selectedCase.incidentType}
              sections={buildCaseStorySections()}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Cases;
