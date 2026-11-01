import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';

function Modules({ user, isWorkspace = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current slug from params or path
  const slug = params.slug || (location.pathname.includes('/modules/') ? location.pathname.split('/modules/')[1]?.split('/')[0] : null);

  const isWorkspaceContext = isWorkspace || location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  // Catalog state
  const [modules, setModules] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [userProgressData, setUserProgressData] = useState(null);

  // Lesson Detail state
  const [currentModule, setCurrentModule] = useState(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState('');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Knowledge check state
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [knowledgeCheckSubmitting, setKnowledgeCheckSubmitting] = useState(false);
  const [knowledgeCheckResult, setKnowledgeCheckResult] = useState(null);

  // Completion toggle state
  const [isCompleted, setIsCompleted] = useState(false);
  const [moduleStatus, setModuleStatus] = useState('not_started');
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Fetch catalog
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        setCatalogLoading(true);
        const data = await api.getModules({
          category: activeCategory,
          difficulty: activeDifficulty,
          search: searchQuery
        });
        if (isMounted && data.success) {
          setModules(data.modules || []);
          if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
          if (data.userProgress) {
            setUserProgressData(data.userProgress);
          }
        }
      } catch (err) {
        console.error('Error loading module catalog:', err);
      } finally {
        if (isMounted) setCatalogLoading(false);
      }
    }

    if (!slug) {
      loadCatalog();
    }
    return () => { isMounted = false; };
  }, [slug, activeCategory, activeDifficulty, searchQuery]);

  // Fetch lesson detail when slug changes
  useEffect(() => {
    let isMounted = true;
    async function loadLesson() {
      if (!slug) return;
      try {
        setLessonLoading(true);
        setLessonError('');
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setKnowledgeCheckSubmitting(false);
        setKnowledgeCheckResult(null);
        setActiveSectionIndex(0);
        setMobileMenuOpen(false);

        const data = await api.getModuleBySlug(slug);
        if (isMounted && data.success) {
          const mod = data.module;
          setCurrentModule(mod);
          setIsCompleted(!!mod.isCompleted);
          setModuleStatus(mod.status || (mod.isCompleted ? 'read_completed' : 'in_progress'));

          if (mod.knowledgeCheckStatus && mod.knowledgeCheckStatus !== 'not_attempted') {
            setIsAnswerSubmitted(true);
            if (typeof mod.lastAnswerIndex === 'number') {
              setSelectedOption(mod.lastAnswerIndex);
            }
            setKnowledgeCheckResult({
              isCorrect: mod.knowledgeCheckStatus === 'passed',
              explanation: mod.quickCheck?.explanation
            });
          }
        } else if (isMounted) {
          setLessonError(data.message || 'Module not found');
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching lesson:', err);
          setLessonError(err.message || 'Failed to load lesson');
        }
      } finally {
        if (isMounted) setLessonLoading(false);
      }
    }

    if (slug) {
      loadLesson();
      window.scrollTo(0, 0);
    }
    return () => { isMounted = false; };
  }, [slug]);

  // ScrollSpy to keep activeSectionIndex accurate on scroll
  useEffect(() => {
    if (!currentModule || !currentModule.sections || currentModule.sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-section-index'));
            if (!isNaN(index)) {
              setActiveSectionIndex(index);
            }
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    currentModule.sections.forEach((_, idx) => {
      const el = document.getElementById(`lesson-sec-${idx}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [currentModule]);

  // Scroll to section handler
  const scrollToSection = (secIdx) => {
    setActiveSectionIndex(secIdx);
    setMobileMenuOpen(false);
    const el = document.getElementById(`lesson-sec-${secIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle Mark Complete toggle (5-state lifecycle: idempotent server update)
  const handleToggleComplete = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!slug || isUpdatingProgress) return;

    const targetState = !isCompleted;
    setIsUpdatingProgress(true);
    setIsCompleted(targetState); // optimistic update

    try {
      const res = await api.recordModuleProgress(slug, {
        action: targetState ? 'mark_read' : 'mark_unread',
        completed: targetState
      });
      if (res.success) {
        setIsCompleted(!!res.isCompleted);
        if (res.status) {
          setModuleStatus(res.status);
        }
        if (userProgressData) {
          setUserProgressData(prev => ({
            ...prev,
            completedCount: targetState ? (prev.completedCount + 1) : Math.max(0, prev.completedCount - 1)
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
      setIsCompleted(!targetState); // revert on error
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // Handle interactive Knowledge Check submission
  const handleKnowledgeCheckSubmit = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (selectedOption === null || knowledgeCheckSubmitting || !slug) return;

    setKnowledgeCheckSubmitting(true);
    try {
      const res = await api.recordModuleProgress(slug, {
        action: 'knowledge_check',
        selectedIndex: selectedOption
      });
      if (res.success) {
        setIsAnswerSubmitted(true);
        setKnowledgeCheckResult({
          isCorrect: res.isCorrect,
          explanation: res.explanation || currentModule?.quickCheck?.explanation
        });
        if (res.status) {
          setModuleStatus(res.status);
        }
      }
    } catch (err) {
      console.error('Error submitting knowledge check:', err);
    } finally {
      setKnowledgeCheckSubmitting(false);
    }
  };

  const handleKnowledgeCheckRetry = () => {
    setIsAnswerSubmitted(false);
    setKnowledgeCheckResult(null);
    setSelectedOption(null);
  };

  // -------------------------------------------------------------------------
  // RENDER: LESSON DETAIL VIEW
  // -------------------------------------------------------------------------
  if (slug) {
    if (lessonLoading) {
      return (
        <div className="desk-space" style={{ padding: 'var(--space-xxl) 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading lesson material...</p>
        </div>
      );
    }

    if (lessonError || !currentModule) {
      return (
        <div className="desk-space" style={{ padding: 'var(--space-xxl) 0', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-navy)', marginBottom: 'var(--space-md)' }}>
            Lesson Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
            {lessonError || 'The requested learning module is unavailable or draft under review.'}
          </p>
          <Link to={getContextPath('/modules')} className="btn-portal-primary" style={{ textDecoration: 'none' }}>
            Back to All Lessons
          </Link>
        </div>
      );
    }

    return (
      <div className="desk-space page-entry" style={{ paddingBottom: 'var(--space-xxl)' }}>
        {/* Workspace Breadcrumb Navigation */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <Link
            to={getContextPath('/modules')}
            style={{
              color: 'var(--color-tertiary)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            All Lessons
          </Link>
          <span style={{ color: 'var(--color-border)', margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{currentModule.category}</span>
          <span style={{ color: 'var(--color-border)', margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--color-navy)', fontSize: '0.88rem', fontWeight: 600 }}>{currentModule.title}</span>
        </div>

        {/* Lesson Header */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-xs)' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.06)',
                    color: 'var(--color-navy)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {currentModule.category}
                </span>
                <span
                  style={{
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    color: 'var(--color-warning, #B17A38)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  {currentModule.difficulty}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  • {currentModule.estimatedMinutes} min read
                </span>
                {user && (
                  moduleStatus === 'read_completed' || isCompleted ? (
                    <span style={{ backgroundColor: 'rgba(5, 150, 105, 0.1)', color: 'var(--color-success, #536F61)', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                      ✓ Read Completed
                    </span>
                  ) : moduleStatus === 'knowledge_check_passed' ? (
                    <span style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-accent-terracotta, #A65F45)', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                      ★ Check Passed
                    </span>
                  ) : moduleStatus === 'in_progress' ? (
                    <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.1)', color: 'var(--color-warning, #B17A38)', fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)' }}>
                      In Progress
                    </span>
                  ) : null
                )}
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '2rem',
                  color: 'var(--color-navy)',
                  margin: 'var(--space-xs) 0 var(--space-sm) 0',
                  lineHeight: 1.25
                }}
              >
                {currentModule.title}
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '820px', margin: 0 }}>
                {currentModule.summary}
              </p>
            </div>

            {/* Completion Toggle Button */}
            <div>
              <button
                onClick={handleToggleComplete}
                disabled={isUpdatingProgress}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isCompleted ? 'var(--color-success, #536F61)' : 'var(--color-surface)',
                  color: isCompleted ? 'var(--color-surface-card, #FCFAF5)' : 'var(--color-navy)',
                  border: isCompleted ? '1px solid var(--color-success, #536F61)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: isUpdatingProgress ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                {isCompleted ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Lesson Completed
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lesson Layout: Responsive Grid (Desktop: Main + Sticky TOC, Mobile: Single column + Sticky Stepper) */}
        <div className="lesson-layout-grid">
          {/* Main Reading Flow */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {/* Mobile Section Navigator & Stepper (<992px) */}
            {currentModule.sections && currentModule.sections.length > 0 && (
              <div className="lesson-mobile-navigator" aria-label="Lesson Section Stepper">
                <div className={`lesson-mobile-navigator-bar ${mobileMenuOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(prev => !prev)}
                    className="lesson-mobile-step-trigger"
                    aria-expanded={mobileMenuOpen}
                    aria-label={`Current Section ${activeSectionIndex + 1} of ${currentModule.sections.length}. Tap to select section.`}
                  >
                    <span className="lesson-mobile-step-pill">
                      {activeSectionIndex + 1} / {currentModule.sections.length}
                    </span>
                    <span className="lesson-mobile-step-title">
                      {currentModule.sections[activeSectionIndex]?.title || 'Section'}
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        transform: mobileMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  <div className="lesson-mobile-stepper-nav">
                    <button
                      type="button"
                      className="lesson-mobile-stepper-btn"
                      disabled={activeSectionIndex === 0}
                      onClick={() => scrollToSection(Math.max(0, activeSectionIndex - 1))}
                      aria-label="Previous section"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="lesson-mobile-stepper-btn"
                      disabled={activeSectionIndex >= currentModule.sections.length - 1}
                      onClick={() => scrollToSection(Math.min(currentModule.sections.length - 1, activeSectionIndex + 1))}
                      aria-label="Next section"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {mobileMenuOpen && (
                  <div className="lesson-mobile-dropdown-menu" role="menu">
                    {currentModule.sections.map((sec, secIdx) => {
                      const isActive = activeSectionIndex === secIdx;
                      return (
                        <button
                          key={secIdx}
                          type="button"
                          className={`lesson-mobile-dropdown-item ${isActive ? 'active' : ''}`}
                          onClick={() => scrollToSection(secIdx)}
                          role="menuitem"
                        >
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: isActive ? 'var(--color-success, #536F61)' : 'rgba(15, 23, 42, 0.08)',
                              color: isActive ? 'var(--color-surface-card, #FCFAF5)' : 'var(--color-navy)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            {secIdx + 1}
                          </span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sec.title}
                          </span>
                          {isActive && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success, #536F61)', fontWeight: 700 }}>Active</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Key Takeaways Callout Card */}
            {currentModule.keyTakeaways && currentModule.keyTakeaways.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                  border: '1px solid var(--color-border, #DED6C9)',
                  borderLeft: '4px solid var(--color-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-lg)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-tertiary)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                    Key Takeaways
                  </h3>
                </div>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-md)', color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.65 }}>
                  {currentModule.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx} style={{ marginBottom: '6px' }}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Narrative Subsections */}
            {currentModule.sections && currentModule.sections.map((sec, idx) => (
              <article
                key={idx}
                id={`lesson-sec-${idx}`}
                data-section-index={idx}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-xl)',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.45rem',
                    color: 'var(--color-navy)',
                    marginTop: 0,
                    marginBottom: 'var(--space-md)',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: 'var(--space-sm)'
                  }}
                >
                  {sec.title}
                </h2>
                <div
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line'
                  }}
                >
                  {sec.content}
                </div>
              </article>
            ))}

            {/* Action Steps Checklist */}
            {currentModule.actionSteps && currentModule.actionSteps.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                  border: '1px solid var(--color-border, #DED6C9)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-xl)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success, #536F61)" strokeWidth="2.2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-navy)' }}>
                    Action Steps: What You Should Do
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {currentModule.actionSteps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                        border: '1px solid var(--color-border, #DED6C9)',
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 16px'
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: 'rgba(5, 150, 105, 0.1)',
                          color: 'var(--color-success, #536F61)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          borderRadius: '50%',
                          minWidth: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '2px'
                        }}
                      >
                        {sIdx + 1}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.5 }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Knowledge Check Widget */}
            {currentModule.quickCheck && currentModule.quickCheck.question && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-xl)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-tertiary)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                  </svg>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-tertiary)' }}>
                    Quick Knowledge Check
                  </span>
                </div>

                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', color: 'var(--color-navy)', margin: '0 0 var(--space-md) 0' }}>
                  {currentModule.quickCheck.question}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  {currentModule.quickCheck.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === oIdx;
                    const isCorrect = oIdx === currentModule.quickCheck.correctIndex;

                    let bg = 'var(--color-surface-card, #FCFAF5)';
                    let borderColor = 'var(--color-border)';
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        bg = 'rgba(16, 185, 129, 0.08)';
                        borderColor = 'var(--color-success, #536F61)';
                      } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.08)';
                        borderColor = '#ef4444';
                      }
                    } else if (isSelected) {
                      bg = 'rgba(30, 41, 59, 0.04)';
                      borderColor = 'var(--color-navy)';
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswerSubmitted}
                        onClick={() => setSelectedOption(oIdx)}
                        style={{
                          textAlign: 'left',
                          backgroundColor: bg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                          fontSize: '0.93rem',
                          color: 'var(--text-primary)',
                          cursor: isAnswerSubmitted ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `1.5px solid ${borderColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isSelected ? 'var(--color-navy)' : 'var(--color-surface-card, #FCFAF5)',
                            color: isSelected ? 'var(--color-surface-card, #FCFAF5)' : 'var(--text-secondary)'
                          }}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span style={{ flex: 1 }}>{opt}</span>
                        {isAnswerSubmitted && isCorrect && (
                          <span style={{ color: 'var(--color-success, #536F61)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Correct</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {!isAnswerSubmitted ? (
                  <button
                    onClick={handleKnowledgeCheckSubmit}
                    disabled={selectedOption === null || knowledgeCheckSubmitting}
                    className="btn-portal-primary"
                    style={{
                      padding: '9px 20px',
                      fontSize: '0.88rem',
                      opacity: selectedOption === null || knowledgeCheckSubmitting ? 0.5 : 1,
                      cursor: selectedOption === null || knowledgeCheckSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {knowledgeCheckSubmitting ? 'Checking Answer...' : 'Check My Answer'}
                  </button>
                ) : (
                  <div>
                    <div
                      style={{
                        backgroundColor: (knowledgeCheckResult?.isCorrect ?? (selectedOption === currentModule.quickCheck.correctIndex)) ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-danger-light, #F9ECEB)',
                        border: `1px solid ${(knowledgeCheckResult?.isCorrect ?? (selectedOption === currentModule.quickCheck.correctIndex)) ? '#a7f3d0' : '#fecaca'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-md)',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                        color: (knowledgeCheckResult?.isCorrect ?? (selectedOption === currentModule.quickCheck.correctIndex)) ? '#065f46' : '#991b1b',
                        marginBottom: 'var(--space-md)'
                      }}
                    >
                      <strong>
                        {(knowledgeCheckResult?.isCorrect ?? (selectedOption === currentModule.quickCheck.correctIndex))
                          ? '✓ Excellent insight!'
                          : '✕ Not quite.'}
                      </strong>{' '}
                      {knowledgeCheckResult?.explanation || currentModule.quickCheck.explanation}
                    </div>

                    {!(knowledgeCheckResult?.isCorrect ?? (selectedOption === currentModule.quickCheck.correctIndex)) && (
                      <button
                        onClick={handleKnowledgeCheckRetry}
                        style={{
                          backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                          color: 'var(--color-navy)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          padding: '7px 14px',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ↻ Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Cross-References (<992px) */}
            <div className="lesson-mobile-crossrefs">
              {currentModule.relatedLaws && currentModule.relatedLaws.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                    border: '1px solid var(--color-border, #DED6C9)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-navy)', marginBottom: '8px' }}>
                    Statutory Cross-References
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentModule.relatedLaws.map((law, lIdx) => (
                      <Link
                        key={lIdx}
                        to={getContextPath(`/laws#sec-${law.sectionNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                        style={{
                          textDecoration: 'none',
                          backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'block'
                        }}
                      >
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {law.sectionNumber}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {law.officialTitle}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {currentModule.relatedCrimes && currentModule.relatedCrimes.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                    border: '1px solid var(--color-border, #DED6C9)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-md)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-warning, #B17A38)', marginBottom: '8px' }}>
                    Related Cyber Crimes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {currentModule.relatedCrimes.map((crime, cIdx) => (
                      <Link
                        key={cIdx}
                        to={getContextPath(`/crimes#crime-${crime.slug}`)}
                        style={{
                          textDecoration: 'none',
                          color: 'var(--color-navy)',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                          border: '1px solid var(--color-border, #DED6C9)',
                          display: 'block'
                        }}
                      >
                        {crime.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation: Prev / Next Lesson */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-md)',
                paddingTop: 'var(--space-lg)',
                borderTop: '1px solid var(--color-border)'
              }}
            >
              {currentModule.navigation?.prev ? (
                <Link
                  to={getContextPath(`/modules/${currentModule.navigation.prev.slug}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    color: 'var(--color-navy)',
                    fontWeight: 600,
                    fontSize: '0.92rem'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Previous</span>
                    {currentModule.navigation.prev.title}
                  </div>
                </Link>
              ) : <div />}

              {currentModule.navigation?.next ? (
                <Link
                  to={getContextPath(`/modules/${currentModule.navigation.next.slug}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    color: 'var(--color-navy)',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    textAlign: 'right'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Next Lesson</span>
                    {currentModule.navigation.next.title}
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              ) : (
                <Link
                  to={getContextPath('/modules')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    color: 'var(--color-success, #536F61)',
                    fontWeight: 600,
                    fontSize: '0.92rem'
                  }}
                >
                  Return to Curriculum Overview
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
              )}
            </div>
          </div>

          {/* Right Rail: Table of Contents & Cross-References */}
          <aside className="lesson-desktop-rail">
            {/* Section Quick Navigator */}
            {currentModule.sections && currentModule.sections.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Lesson Sections
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {currentModule.sections.map((sec, secIdx) => (
                    <a
                      key={secIdx}
                      href={`#lesson-sec-${secIdx}`}
                      onClick={() => setActiveSectionIndex(secIdx)}
                      style={{
                        fontSize: '0.85rem',
                        color: activeSectionIndex === secIdx ? 'var(--color-navy)' : 'var(--text-secondary)',
                        fontWeight: activeSectionIndex === secIdx ? 600 : 400,
                        textDecoration: 'none',
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: activeSectionIndex === secIdx ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {sec.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Related Laws Cross-Reference Box */}
            {currentModule.relatedLaws && currentModule.relatedLaws.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                  border: '1px solid var(--color-border, #DED6C9)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-navy)', marginBottom: '8px' }}>
                  Statutory Cross-References
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentModule.relatedLaws.map((law, lIdx) => (
                    <Link
                      key={lIdx}
                      to={getContextPath(`/laws#sec-${law.sectionNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                      style={{
                        textDecoration: 'none',
                        backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        display: 'block'
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                        {law.sectionNumber}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {law.officialTitle}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Cyber Crimes Box */}
            {currentModule.relatedCrimes && currentModule.relatedCrimes.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                  border: '1px solid var(--color-border, #DED6C9)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-md)'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-warning, #B17A38)', marginBottom: '8px' }}>
                  Related Cyber Crimes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {currentModule.relatedCrimes.map((crime, cIdx) => (
                    <Link
                      key={cIdx}
                      to={getContextPath(`/crimes#crime-${crime.slug}`)}
                      style={{
                        textDecoration: 'none',
                        color: 'var(--color-navy)',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        padding: '6px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                        border: '1px solid var(--color-border, #DED6C9)',
                        display: 'block'
                      }}
                    >
                      {crime.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER: MODULES CATALOG / CURRICULUM VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="desk-space page-entry" style={{ paddingBottom: 'var(--space-xxl)' }}>
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="Interactive Educational Curriculum"
        title="Learning Modules & Cyber Law Lessons"
        subtitle="Authoritative, plain-language lessons on digital identity, modern threat defense, Indian cyber statutes, and evidentiary practice."
        description="Structured in four sequential tracks to build practical competence: from core cryptographic foundations to real-world scam recognition, statutory rights, and defensive hardening."
      />

      <EditorialRule spacing="md" />

      {/* Learner Progress Bar for Logged-In Users */}
      {user && userProgressData && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-md) var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-md)',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              Your Learning Track
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-navy)' }}>
              {userProgressData.completedCount} of {userProgressData.totalCount} Lessons Completed
            </div>
          </div>

          <div style={{ minWidth: '220px', flex: 1, maxWidth: '380px' }}>
            <div style={{ height: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'var(--color-success, #536F61)',
                  width: `${userProgressData.totalCount ? Math.round((userProgressData.completedCount / userProgressData.totalCount) * 100) : 0}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {userProgressData.totalCount ? Math.round((userProgressData.completedCount / userProgressData.totalCount) * 100) : 0}% Progress
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        {/* Track Category Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {categories.map((cat, idx) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? 'var(--color-navy)' : 'var(--color-surface)',
                  color: isActive ? 'var(--color-surface-card, #FCFAF5)' : 'var(--text-primary)',
                  border: isActive ? '1px solid var(--color-navy)' : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat === 'All' ? 'All Tracks' : cat}
              </button>
            );
          })}
        </div>

        {/* Search Input & Difficulty Selector */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '420px' }}>
          <select
            value={activeDifficulty}
            onChange={(e) => setActiveDifficulty(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              flexShrink: 0
            }}
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              minWidth: '140px',
              flex: 1
            }}
          />
        </div>
      </div>

      {/* Modules Grid */}
      {catalogLoading ? (
        <div style={{ padding: 'var(--space-xxl) 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading curriculum lessons...
        </div>
      ) : modules.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-xxl) 0',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            No lessons match your current filters. Try selecting "All Tracks" or clearing your search term.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 'var(--space-lg)'
          }}
        >
          {modules.map((mod) => (
            <div
              key={mod._id || mod.slug}
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: 'var(--shadow-xs)'
              }}
            >
              <div>
                {/* Card Meta Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(15, 23, 42, 0.05)',
                        color: 'var(--color-navy)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {mod.category}
                    </span>
                    <span
                      style={{
                        backgroundColor: 'rgba(217, 119, 6, 0.08)',
                        color: 'var(--color-warning, #B17A38)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      {mod.difficulty}
                    </span>
                  </div>

                  {mod.isCompleted && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--color-success, #536F61)',
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ✓ Completed
                    </span>
                  )}
                </div>

                {/* Card Title */}
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.22rem',
                    color: 'var(--color-navy)',
                    margin: '0 0 var(--space-xs) 0',
                    lineHeight: 1.35
                  }}
                >
                  <Link
                    to={getContextPath(`/modules/${mod.slug}`)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    {mod.title}
                  </Link>
                </h3>

                {/* Card Summary */}
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.6,
                    margin: '0 0 var(--space-md) 0'
                  }}
                >
                  {mod.summary}
                </p>

                {/* Key Takeaways Snippet */}
                {mod.keyTakeaways && mod.keyTakeaways.length > 0 && (
                  <div
                    style={{
                      borderLeft: '2px solid var(--color-border)',
                      paddingLeft: '10px',
                      marginBottom: 'var(--space-md)'
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600, marginBottom: '2px' }}>
                      Key Insight:
                    </span>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {mod.keyTakeaways[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Estimated time & CTA */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ⏱ {mod.estimatedMinutes} min read
                </span>

                <Link
                  to={getContextPath(`/modules/${mod.slug}`)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: mod.isCompleted ? 'var(--color-success, #536F61)' : 'var(--color-navy)'
                  }}
                >
                  {mod.isCompleted ? 'Review Lesson' : 'Start Lesson'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Modules;

