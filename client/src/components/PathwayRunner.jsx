import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

/**
 * PathwayRunner Component
 * Phase 4: Guided 3-Step Micro-Learning Runner
 * 
 * Strict Architecture:
 * - Server-authoritative step persistence and checkpoint score calculation.
 * - Zero composite scores, grades, or gamification clutter.
 * - Preserves sourceSessionId traceability.
 */
function PathwayRunner({ pathway, sourceSessionId, initialProgress = null, isReinforcementMode = false, onClose, onPathwayCompleted }) {
  // Current step: 1 (Incident Learning), 2 (Practical Defense), 3 (Learning Checkpoint), 4 (Completed Summary)
  const determineInitialStep = () => {
    if (isReinforcementMode) {
      if (initialProgress?.isReinforced) return 4;
      return 1;
    }
    if (initialProgress?.completedAt) return 4;
    if (initialProgress?.stepsCompleted?.prevention) return 3;
    if (initialProgress?.stepsCompleted?.caseStudy) return 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(determineInitialStep());
  const [stepsCompleted, setStepsCompleted] = useState(initialProgress?.stepsCompleted || {
    caseStudy: false,
    prevention: false,
    checkpointQuiz: false
  });
  const [completedAt, setCompletedAt] = useState(initialProgress?.completedAt || null);

  // Step 1 states (Case Study)
  const [caseStudyData, setCaseStudyData] = useState(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [selectedDecisionIdx, setSelectedDecisionIdx] = useState(null);
  const [decisionFeedback, setDecisionFeedback] = useState('');
  const [submittingStep1, setSubmittingStep1] = useState(false);

  // Step 2 states (Practical Defense)
  const [acknowledgedRule, setAcknowledgedRule] = useState(false);
  const [submittingStep2, setSubmittingStep2] = useState(false);

  // Step 3 states (Learning Checkpoint)
  const [checkpointQuestions, setCheckpointQuestions] = useState([]);
  const [passingScore, setPassingScore] = useState(67);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionId -> selectedOptionIndex
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [submittingCheckpoint, setSubmittingCheckpoint] = useState(false);
  const [checkpointResult, setCheckpointResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Case Study details on mount
  useEffect(() => {
    let isMounted = true;
    if (pathway?.caseStudySlug) {
      setLoadingCase(true);
      api.getCaseBySlug(pathway.caseStudySlug)
        .then(data => {
          if (isMounted) {
            setCaseStudyData(data);
            setLoadingCase(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setLoadingCase(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [pathway?.caseStudySlug]);

  // Fetch Sanitized Checkpoint when entering Step 3
  useEffect(() => {
    let isMounted = true;
    if (currentStep === 3 && checkpointQuestions.length === 0) {
      setLoadingCheckpoint(true);
      setErrorMsg('');
      api.getPathwayCheckpoint(pathway.pathwayId, sourceSessionId)
        .then(res => {
          if (isMounted) {
            setCheckpointQuestions(res.questions || []);
            setPassingScore(res.passingScore || 67);
            setLoadingCheckpoint(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setErrorMsg(err.message || 'Failed to load checkpoint questions.');
            setLoadingCheckpoint(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [currentStep, pathway?.pathwayId, sourceSessionId, checkpointQuestions.length]);

  // Handle Step 1 Decision Submission
  const handleSubmitStep1 = async () => {
    if (selectedDecisionIdx === null) return;
    setSubmittingStep1(true);
    setErrorMsg('');
    try {
      const res = await api.recordPathwayStep(pathway.pathwayId, sourceSessionId, 'caseStudy', {
        decisionChoiceIndex: selectedDecisionIdx
      });
      setStepsCompleted(res.stepsCompleted);
      setDecisionFeedback(res.educationalFeedback || 'Decision recorded.');
    } catch (err) {
      setErrorMsg(err.message || 'Unable to record decision.');
    } finally {
      setSubmittingStep1(false);
    }
  };

  // Handle Step 2 Acknowledgment
  const handleSubmitStep2 = async () => {
    if (isReinforcementMode) {
      setAcknowledgedRule(true);
      setCurrentStep(3);
      return;
    }
    setSubmittingStep2(true);
    setErrorMsg('');
    try {
      const res = await api.recordPathwayStep(pathway.pathwayId, sourceSessionId, 'prevention', {
        acknowledged: true
      });
      setStepsCompleted(res.stepsCompleted);
      setAcknowledgedRule(true);
      setCurrentStep(3);
    } catch (err) {
      setErrorMsg(err.message || 'Unable to record acknowledgment.');
    } finally {
      setSubmittingStep2(false);
    }
  };

  // Handle Checkpoint Answer Selection
  const handleSelectOption = (questionId, optionIdx) => {
    if (checkpointResult?.passed) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  // Handle Checkpoint Submission (Server-authoritative evaluation)
  const handleSubmitCheckpoint = async () => {
    const totalQ = checkpointQuestions.length;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < totalQ) {
      setErrorMsg('Please answer all checkpoint questions before submitting.');
      return;
    }

    setSubmittingCheckpoint(true);
    setErrorMsg('');
    try {
      const answersPayload = checkpointQuestions.map(q => ({
        questionId: q.questionId,
        selectedOptionIndex: selectedAnswers[q.questionId]
      }));

      const res = isReinforcementMode
        ? await api.reinforcePathway(pathway.pathwayId, sourceSessionId, answersPayload)
        : await api.submitPathwayCheckpoint(pathway.pathwayId, sourceSessionId, answersPayload);
      setCheckpointResult(res);

      if (res.passed && (res.isFullyCompleted || res.isReinforcementCompleted)) {
        setCompletedAt(res.completedAt);
        setStepsCompleted(prev => ({ ...prev, checkpointQuiz: true }));
        if (onPathwayCompleted) {
          onPathwayCompleted(pathway.pathwayId);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error submitting checkpoint answers.');
    } finally {
      setSubmittingCheckpoint(false);
    }
  };

  const handleRetryCheckpoint = () => {
    setCheckpointResult(null);
    setSelectedAnswers({});
    setErrorMsg('');
  };

  // Focus management references
  const modalRef = useRef(null);
  const triggerElementRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Focus management: Record trigger element, set initial focus, and restore on close
  useEffect(() => {
    triggerElementRef.current = document.activeElement;

    // Move initial focus into dialog
    const focusTimer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      } else if (modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      // Focus restoration: return focus to triggering element
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, []);

  // Keyboard controls: Escape key dismissal and Tab/Shift+Tab Focus Trap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusables = Array.from(modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ));

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if focused on first element, wrap around to last
          if (document.activeElement === firstEl || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          // Tab: if focused on last element, wrap around to first
          if (document.activeElement === lastEl || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="pathway-runner-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-md)'
      }}
    >
      <div
        ref={modalRef}
        className="pathway-runner-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pathway-runner-title"
        tabIndex="-1"
        style={{
          backgroundColor: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary)',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Runner Header */}
        <div style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary, #f8fafc)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isReinforcementMode ? '#b45309' : 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {isReinforcementMode ? 'Targeted Habit Reinforcement' : 'Micro-Learning Pathway'} &bull; {pathway.difficulty || 'Essential'}
            </span>
            <h3 id="pathway-runner-title" style={{ margin: '4px 0 0 0', fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: '700' }}>
              {isReinforcementMode ? `Reinforce: ${pathway.habitTitle}` : pathway.habitTitle}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            aria-label="Close learning runner"
          >
            ✕ Close
          </button>
        </div>

        {/* Step Indicator Bar */}
        <nav
          aria-label="Learning pathway stages"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: '#fff',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={() => setCurrentStep(1)}
            aria-current={currentStep === 1 ? 'step' : undefined}
            aria-label="Step 1: Incident Learning"
            style={{
              flex: '1 1 120px',
              padding: '12px 8px',
              border: 'none',
              background: currentStep === 1 ? 'var(--accent-navy-light, #f0f4f8)' : 'transparent',
              borderBottom: currentStep === 1 ? '3px solid var(--accent-navy)' : '3px solid transparent',
              fontWeight: currentStep === 1 ? '700' : '500',
              color: currentStep === 1 ? 'var(--accent-navy)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            1. Incident {stepsCompleted.caseStudy ? '✓' : ''}
          </button>

          <button
            onClick={() => stepsCompleted.caseStudy && setCurrentStep(2)}
            disabled={!stepsCompleted.caseStudy}
            aria-current={currentStep === 2 ? 'step' : undefined}
            aria-label="Step 2: Practical Defense"
            style={{
              flex: '1 1 120px',
              padding: '12px 8px',
              border: 'none',
              background: currentStep === 2 ? 'var(--accent-navy-light, #f0f4f8)' : 'transparent',
              borderBottom: currentStep === 2 ? '3px solid var(--accent-navy)' : '3px solid transparent',
              fontWeight: currentStep === 2 ? '700' : '500',
              color: currentStep === 2 ? 'var(--accent-navy)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: stepsCompleted.caseStudy ? 'pointer' : 'not-allowed',
              opacity: stepsCompleted.caseStudy ? 1 : 0.5
            }}
          >
            2. Defense {stepsCompleted.prevention ? '✓' : ''}
          </button>

          <button
            onClick={() => stepsCompleted.prevention && setCurrentStep(3)}
            disabled={!stepsCompleted.prevention}
            aria-current={currentStep === 3 ? 'step' : undefined}
            aria-label="Step 3: Learning Checkpoint"
            style={{
              flex: '1 1 120px',
              padding: '12px 8px',
              border: 'none',
              background: currentStep === 3 ? 'var(--accent-navy-light, #f0f4f8)' : 'transparent',
              borderBottom: currentStep === 3 ? '3px solid var(--accent-navy)' : '3px solid transparent',
              fontWeight: currentStep === 3 ? '700' : '500',
              color: currentStep === 3 ? 'var(--accent-navy)' : 'var(--text-secondary)',
              fontSize: '0.85rem',
              cursor: stepsCompleted.prevention ? 'pointer' : 'not-allowed',
              opacity: stepsCompleted.prevention ? 1 : 0.5
            }}
          >
            3. Checkpoint {stepsCompleted.checkpointQuiz ? '✓' : ''}
          </button>
        </nav>

        {/* Runner Body */}
        <div style={{ padding: 'var(--space-lg)', flex: 1, overflowY: 'auto' }}>
          {errorMsg && (
            <div
              role="alert"
              style={{
                backgroundColor: '#fef2f2',
                borderLeft: '4px solid #ef4444',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '4px',
                marginBottom: 'var(--space-md)',
                fontSize: '0.85rem'
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: INCIDENT LEARNING (CASE STUDY)                                    */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-navy)', fontWeight: '700' }}>
                Step 1 of 3: Incident Context & Narrative
              </span>
              <h4 style={{ fontSize: '1.2rem', margin: '4px 0 12px 0', color: 'var(--text-primary)' }}>
                {caseStudyData ? caseStudyData.title : (pathway.caseStudyTitle || 'Incident Case Study')}
              </h4>

              {loadingCase ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading incident breakdown...</p>
              ) : (
                <div>
                  <div style={{
                    backgroundColor: 'var(--bg-secondary, #f8fafc)',
                    padding: 'var(--space-md)',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    marginBottom: 'var(--space-md)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6'
                  }}>
                    <strong style={{ display: 'block', color: 'var(--accent-navy)', marginBottom: '4px' }}>
                      Incident Summary:
                    </strong>
                    {caseStudyData?.shortDescription || pathway.pedagogicalFocus}
                  </div>

                  {caseStudyData?.attackVector && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                      <strong>Attack Vector:</strong> {caseStudyData.attackVector} &bull; <strong>Difficulty:</strong> {caseStudyData.difficulty}
                    </div>
                  )}

                  {/* Educational Decision Point */}
                  {caseStudyData?.decisionPoints && caseStudyData.decisionPoints.length > 0 && (
                    <div style={{
                      marginTop: 'var(--space-md)',
                      padding: 'var(--space-md)',
                      border: '1px solid var(--accent-navy-light)',
                      borderRadius: '6px',
                      backgroundColor: '#fcfdfe'
                    }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--accent-navy)' }}>
                        Learning Decision Point:
                      </h5>
                      <p style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                        {caseStudyData.decisionPoints[0].questionText}
                      </p>

                      <div
                        role="radiogroup"
                        aria-label="Incident learning choices"
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        {caseStudyData.decisionPoints[0].options?.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            role="radio"
                            aria-checked={selectedDecisionIdx === oIdx}
                            onClick={() => setSelectedDecisionIdx(oIdx)}
                            disabled={stepsCompleted.caseStudy}
                            style={{
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: '6px',
                              border: selectedDecisionIdx === oIdx ? '2px solid var(--accent-navy)' : '1px solid var(--color-border)',
                              backgroundColor: selectedDecisionIdx === oIdx ? 'var(--accent-navy-light)' : '#fff',
                              color: 'var(--text-primary)',
                              fontSize: '0.88rem',
                              cursor: stepsCompleted.caseStudy ? 'default' : 'pointer'
                            }}
                          >
                            {opt.optionText}
                          </button>
                        ))}
                      </div>

                      {decisionFeedback && (
                        <div style={{
                          marginTop: '12px',
                          padding: '10px 14px',
                          backgroundColor: '#ecfdf5',
                          borderLeft: '3px solid #10b981',
                          color: '#065f46',
                          fontSize: '0.85rem',
                          borderRadius: '4px'
                        }}>
                          <strong>Analysis:</strong> {decisionFeedback}
                        </div>
                      )}

                      {!stepsCompleted.caseStudy ? (
                        <div style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleSubmitStep1}
                            disabled={selectedDecisionIdx === null || submittingStep1}
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                          >
                            {submittingStep1 ? 'Recording...' : 'Submit Learning Decision'}
                          </button>
                          {isReinforcementMode && (
                            <button
                              onClick={() => setCurrentStep(2)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                              Review Defensive Rule &rarr;
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setCurrentStep(2)}
                            className="btn btn-primary"
                            style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                          >
                            Continue to Step 2: Practical Defense &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback if no decision points */}
                  {(!caseStudyData?.decisionPoints || caseStudyData.decisionPoints.length === 0) && (
                    <div style={{ marginTop: 'var(--space-md)', textAlign: 'right' }}>
                      <button
                        onClick={async () => {
                          await api.recordPathwayStep(pathway.pathwayId, sourceSessionId, 'caseStudy', { decisionChoiceIndex: 0 });
                          setStepsCompleted(prev => ({ ...prev, caseStudy: true }));
                          setCurrentStep(2);
                        }}
                        className="btn btn-primary"
                      >
                        Continue to Step 2: Practical Defense &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PRACTICAL DEFENSE (RULE & ACTION CHECKLIST)                        */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-navy)', fontWeight: '700' }}>
                Step 2 of 3: Practical Defense & Habit Rule
              </span>
              <h4 style={{ fontSize: '1.2rem', margin: '4px 0 16px 0', color: 'var(--text-primary)' }}>
                Core Defensive Principle
              </h4>

              {/* Authoritative Practical Rule Callout */}
              <div style={{
                backgroundColor: 'var(--accent-navy-light, #f0f4f8)',
                borderLeft: '4px solid var(--accent-navy)',
                padding: 'var(--space-md)',
                borderRadius: '4px',
                marginBottom: 'var(--space-lg)'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--accent-navy)', letterSpacing: '0.5px' }}>
                  Authoritative Habit Rule
                </span>
                <p style={{ margin: '6px 0 0 0', fontSize: '1.05rem', fontWeight: '700', color: 'var(--accent-navy)', lineHeight: '1.4' }}>
                  "{pathway.coreRule}"
                </p>
              </div>

              {/* Practical Checklist */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Everyday Digital Defense Checklist:
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                  <li>Never approve incoming payment notifications or scan unfamiliar QR codes to claim funds.</li>
                  <li>Verify caller or sender claims through a secondary, independent channel before acting.</li>
                  <li>Inspect root domain spelling in browser bars rather than relying on logos or headers.</li>
                  <li>Do not treat automated bank balance confirmations as urgent crises without checking passbooks.</li>
                </ul>
              </div>

              {/* Legal Reference Note (Optional & Non-Accusatory) */}
              {pathway.legalReferences && pathway.legalReferences.length > 0 && (
                <div style={{
                  padding: 'var(--space-md)',
                  backgroundColor: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  marginBottom: 'var(--space-lg)'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-navy)', marginBottom: '4px' }}>
                    Relevant Statutory Framework (India)
                  </div>
                  {pathway.legalReferences.map((ref, idx) => (
                    <div key={idx} style={{ marginTop: '6px', fontSize: '0.82rem', lineHeight: '1.5' }}>
                      <strong>{ref.act} &bull; {ref.section}</strong> ({ref.status === 'ENACTED_FUTURE_COMMENCEMENT' ? 'Enacted — Future Commencement' : 'In Force'})
                      <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
                        {ref.educationalContext || ref.attribution}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Explicit Acknowledgment */}
              <div style={{
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  &larr; Back to Step 1
                </button>

                <button
                  onClick={handleSubmitStep2}
                  disabled={submittingStep2}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  {submittingStep2 ? 'Saving...' : 'Acknowledge Rule & Proceed to Checkpoint \u2192'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: LEARNING CHECKPOINT (SERVER-AUTHORITATIVE MICRO-QUIZ)              */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--accent-navy)', fontWeight: '700' }}>
                Step 3 of 3: Learning Checkpoint
              </span>
              <h4 style={{ fontSize: '1.2rem', margin: '4px 0 6px 0', color: 'var(--text-primary)' }}>
                Targeted Knowledge Checkpoint
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                Answer the following practice questions to demonstrate successful performance on the targeted learning checkpoint. Passing threshold: {passingScore}% (Server-Enforced).
              </p>

              {loadingCheckpoint ? (
                <p style={{ color: 'var(--text-muted)' }} aria-live="polite">Loading sanitized checkpoint questions...</p>
              ) : checkpointQuestions.length === 0 && errorMsg ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
                  <button
                    onClick={() => {
                      setLoadingCheckpoint(true);
                      setErrorMsg('');
                      api.getPathwayCheckpoint(pathway.pathwayId, sourceSessionId)
                        .then(res => {
                          setCheckpointQuestions(res.questions || []);
                          setPassingScore(res.passingScore || 67);
                          setLoadingCheckpoint(false);
                        })
                        .catch(err => {
                          setErrorMsg(err.message || 'Failed to load checkpoint questions.');
                          setLoadingCheckpoint(false);
                        });
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                  >
                    Retry Loading Checkpoint
                  </button>
                </div>
              ) : checkpointResult?.passed ? (
                /* Completion View */
                <div style={{
                  padding: 'var(--space-lg)',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✓</div>
                  <h4 style={{ color: '#065f46', fontSize: '1.3rem', margin: '0 0 6px 0' }}>
                    {isReinforcementMode ? 'Targeted Habit Reinforcement Completed!' : 'Learning Checkpoint Passed!'}
                  </h4>
                  <p style={{ color: '#047857', fontSize: '0.9rem', margin: '0 0 16px 0' }}>
                    Score: {checkpointResult.score}% &bull; Passing Threshold: {checkpointResult.passingScore}%
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#065f46', maxWidth: '500px', margin: '0 auto 12px auto', lineHeight: '1.5' }}>
                    You have demonstrated successful performance on the targeted learning checkpoint for <strong>{pathway.habitTitle}</strong>. {isReinforcementMode ? 'Targeted habit reinforcement is now recorded for this assessment session.' : 'This remediation pathway is now marked completed for your assessment session.'}
                  </p>
                  {isReinforcementMode && (
                    <p style={{ fontSize: '0.8rem', color: '#047857', maxWidth: '480px', margin: '0 auto 18px auto', fontStyle: 'italic', lineHeight: '1.4' }}>
                      Targeted reinforcement strengthens deliberate defensive habits against deception tactics. Continued vigilance across everyday routines remains essential.
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button
                      onClick={onClose}
                      className="btn btn-primary"
                      style={{ padding: '8px 24px' }}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                /* Questions Form */
                <div>
                  {checkpointResult && !checkpointResult.passed && (
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: '#fffbeb',
                      borderLeft: '4px solid #f59e0b',
                      borderRadius: '4px',
                      marginBottom: 'var(--space-md)'
                    }}>
                      <strong style={{ color: '#92400e', fontSize: '0.9rem', display: 'block' }}>
                        Checkpoint Incomplete ({checkpointResult.score}% &mdash; Required: {checkpointResult.passingScore}%)
                      </strong>
                      <span style={{ fontSize: '0.82rem', color: '#b45309' }}>
                        Review the feedback below and try again to reinforce this defensive habit.
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {checkpointQuestions.map((q, idx) => {
                      const explanationItem = checkpointResult?.explanations?.find(e => e.questionId === q.questionId);

                      return (
                        <div key={q.questionId} style={{
                          padding: 'var(--space-md)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          backgroundColor: '#fafbfc'
                        }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--accent-navy)', marginBottom: '4px' }}>
                            Question {idx + 1} of {checkpointQuestions.length}
                          </div>
                          <p style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
                            {q.questionText}
                          </p>

                          <div
                            role="radiogroup"
                            aria-label={`Question ${idx + 1} options`}
                            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
                          >
                            {q.options?.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[q.questionId] === optIdx;

                              return (
                                <button
                                  key={optIdx}
                                  role="radio"
                                  aria-checked={isSelected}
                                  onClick={() => handleSelectOption(q.questionId, optIdx)}
                                  disabled={submittingCheckpoint}
                                  style={{
                                    textAlign: 'left',
                                    padding: '8px 12px',
                                    borderRadius: '5px',
                                    border: isSelected ? '2px solid var(--accent-navy)' : '1px solid var(--color-border)',
                                    backgroundColor: isSelected ? 'var(--accent-navy-light)' : '#fff',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          {explanationItem && (
                            <div style={{
                              marginTop: '8px',
                              padding: '8px 10px',
                              backgroundColor: explanationItem.isCorrect ? '#ecfdf5' : '#fef2f2',
                              borderLeft: explanationItem.isCorrect ? '3px solid #10b981' : '3px solid #ef4444',
                              color: explanationItem.isCorrect ? '#065f46' : '#991b1b',
                              fontSize: '0.8rem',
                              borderRadius: '3px'
                            }}>
                              {explanationItem.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                    >
                      &larr; Back to Step 2
                    </button>

                    {checkpointResult && !checkpointResult.passed ? (
                      <button
                        onClick={handleRetryCheckpoint}
                        className="btn btn-secondary"
                        style={{ padding: '8px 18px', fontSize: '0.9rem' }}
                      >
                        Try Again
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitCheckpoint}
                        disabled={submittingCheckpoint}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                      >
                        {submittingCheckpoint ? 'Evaluating...' : 'Submit Answers for Verification'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: COMPLETED SUMMARY                                                 */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✓</div>
              <h4 style={{ color: 'var(--accent-navy)', fontSize: '1.3rem', margin: '0 0 6px 0' }}>
                {isReinforcementMode ? 'Habit Reinforcement Already Completed' : 'Pathway Already Completed'}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-md)' }}>
                {isReinforcementMode
                  ? `You completed targeted habit reinforcement for this pathway on ${completedAt ? new Date(completedAt).toLocaleDateString() : 'this session'}.`
                  : `You completed this habit pathway on ${completedAt ? new Date(completedAt).toLocaleDateString() : 'earlier session'}.`}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Review Materials Again
                </button>
                <button
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PathwayRunner;
