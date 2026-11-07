import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

/**
 * QuizRecallModal Component
 * Interactive concept review & consolidation runner for missed standalone quiz questions.
 * 
 * Stage 5 Learning Consolidation & Learner Independence Guarantees:
 * - Completely isolated from pathway spaced reviews (does not touch UserProgress.spacedReviews).
 * - Full multi-format support: single_choice, multiple_choice, true_false, matching,
 *   ordering, indicator_identification, scenario_decision, and legal_application.
 * - Zero answer leakage: questions are served sanitized; correct answers and explanations appear ONLY after submission.
 * - Non-coercive, self-paced revision: no mandatory lockouts, no overdue threats.
 * - Neutral, accurate feedback: '✓ Correct answer' (avoids implying permanent mastery).
 * - Clear statutory feedback: explains why an option failed, provides actionable practical takeaways,
 *   and presents the exact correct solution structure.
 */
function QuizRecallModal({
  isOpen,
  onClose,
  dueRecalls = [],
  onRecallCompleted
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptionIndices, setSelectedOptionIndices] = useState([]);
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [selectedSequence, setSelectedSequence] = useState([]);
  const [selectedIndicatorIds, setSelectedIndicatorIds] = useState([]);

  const [evalResult, setEvalResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentItem = dueRecalls && dueRecalls.length > 0 ? dueRecalls[currentIndex] : null;
  const q = currentItem?.question;
  const format = q?.format || 'single_choice';
  const isLast = currentIndex === (dueRecalls?.length || 1) - 1;

  // Initialize per-question state when index or question changes
  useEffect(() => {
    setEvalResult(null);
    setError('');
    setSelectedOption(null);
    setSelectedOptionIndices([]);

    if (q?.format === 'matching') {
      const lefts = q.leftItems || [];
      setSelectedPairs(lefts.map(left => ({ left, right: '' })));
    } else {
      setSelectedPairs([]);
    }

    if (q?.format === 'ordering') {
      setSelectedSequence([...(q.sequenceItems || [])]);
    } else {
      setSelectedSequence([]);
    }

    setSelectedIndicatorIds([]);
  }, [currentIndex, currentItem?.questionId, q?.format]);

  // Determine whether current format input is complete enough to submit
  const canSubmit = useMemo(() => {
    if (!q || submitting || evalResult) return false;
    if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
      return selectedOption !== null && selectedOption >= 0;
    }
    if (format === 'multiple_choice') {
      return Array.isArray(selectedOptionIndices) && selectedOptionIndices.length > 0;
    }
    if (format === 'matching') {
      return (
        Array.isArray(selectedPairs) &&
        selectedPairs.length > 0 &&
        selectedPairs.every(p => Boolean(p.right && p.right.trim() !== ''))
      );
    }
    if (format === 'ordering') {
      return Array.isArray(selectedSequence) && selectedSequence.length > 0;
    }
    if (format === 'indicator_identification') {
      return Array.isArray(selectedIndicatorIds) && selectedIndicatorIds.length > 0;
    }
    return false;
  }, [q, submitting, evalResult, format, selectedOption, selectedOptionIndices, selectedPairs, selectedSequence, selectedIndicatorIds]);

  if (!isOpen || !dueRecalls || dueRecalls.length === 0 || !currentItem) {
    return null;
  }

  // Answer interaction handlers
  const handleSingleChoiceSelect = (optIdx) => {
    if (evalResult) return;
    setSelectedOption(optIdx);
  };

  const handleMultipleChoiceToggle = (optIdx) => {
    if (evalResult) return;
    setSelectedOptionIndices(prev => {
      if (prev.includes(optIdx)) {
        return prev.filter(i => i !== optIdx);
      }
      return [...prev, optIdx].sort((a, b) => a - b);
    });
  };

  const handleMatchingPairChange = (left, right) => {
    if (evalResult) return;
    setSelectedPairs(prev => {
      const existing = prev.filter(p => p.left !== left);
      return [...existing, { left, right }];
    });
  };

  const handleOrderingShift = (idx, direction) => {
    if (evalResult) return;
    setSelectedSequence(prev => {
      const copy = [...prev];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= copy.length) return copy;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleIndicatorToggle = (id) => {
    if (evalResult) return;
    setSelectedIndicatorIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  // Submit Answer
  const handleSubmit = async () => {
    if (!canSubmit || !currentItem?.questionId) return;
    setSubmitting(true);
    setError('');

    let answerPayload = {};
    if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
      answerPayload = { selectedOptionIndex: selectedOption };
    } else if (format === 'multiple_choice') {
      answerPayload = { selectedOptionIndices };
    } else if (format === 'matching') {
      answerPayload = { selectedPairs };
    } else if (format === 'ordering') {
      answerPayload = { selectedSequence };
    } else if (format === 'indicator_identification') {
      answerPayload = { selectedIndicatorIds };
    }

    try {
      const res = await api.submitQuizRecall(currentItem.questionId, answerPayload);
      setEvalResult(res);
      if (onRecallCompleted) {
        onRecallCompleted(currentItem.questionId, res.isCorrect);
      }
    } catch (err) {
      setError(err.message || 'Error evaluating recall question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="quiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recall-modal-title">
      <div className="quiz-modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-accent-terracotta, #A65F45)', display: 'block' }}>
              Optional Concept Practice • Item {currentIndex + 1} of {dueRecalls.length}
            </span>
            <h3 id="recall-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--color-text-primary, #302B27)' }}>
              {currentItem.category || 'Statutory Concept Recall'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            aria-label="Close practice modal"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Question Prompt */}
        <p id="recall-modal-prompt" style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '16px' }}>
          {q?.questionText}
        </p>

        {/* ----------------------------------------------------------------- */}
        {/* Format 1: Single Choice / True-False / Scenario Decision / Legal Application */}
        {/* ----------------------------------------------------------------- */}
        {['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format) && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}
            role="radiogroup"
            aria-labelledby="recall-modal-prompt"
          >
            {q?.options?.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const letter = optionLetters[idx] || String.fromCharCode(65 + idx);
              return (
                <label
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1.5px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-gold-light, #FAF4EA)' : 'var(--color-surface-card, #FCFAF5)',
                    borderColor: isSelected ? 'var(--color-text-primary, #302B27)' : 'var(--color-border)',
                    cursor: evalResult ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  className={`quiz-recall-option-label ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name={`quiz-recall-${currentItem?.questionId || 'opt'}`}
                    value={idx}
                    checked={isSelected}
                    disabled={Boolean(evalResult)}
                    onChange={() => handleSingleChoiceSelect(idx)}
                    role="radio"
                    aria-checked={isSelected}
                    style={{
                      accentColor: 'var(--color-accent-terracotta, #9A503A)',
                      width: '18px',
                      height: '18px',
                      cursor: evalResult ? 'default' : 'pointer'
                    }}
                  />
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? 'var(--color-text-primary, #302B27)' : 'var(--color-surface-secondary, #EFE8DC)',
                    color: isSelected ? '#FCFAF5' : 'var(--color-text-primary, #302B27)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {letter}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Format 2: Multiple Choice (Multi-select) */}
        {/* ----------------------------------------------------------------- */}
        {format === 'multiple_choice' && (
          <div style={{ marginBottom: '20px' }}>
            <div id="multi-choice-heading" style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent-terracotta, #A65F45)', marginBottom: '8px' }}>
              ☑ Select all options that apply
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="group" aria-labelledby="multi-choice-heading">
              {q?.options?.map((opt, idx) => {
                const isSelected = selectedOptionIndices.includes(idx);
                return (
                  <label
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-gold-light, #FAF4EA)' : 'var(--color-surface-card, #FCFAF5)',
                      borderColor: isSelected ? 'var(--color-text-primary, #302B27)' : 'var(--color-border)',
                      cursor: evalResult ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                    className={`quiz-recall-option-label ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      value={idx}
                      checked={isSelected}
                      disabled={Boolean(evalResult)}
                      onChange={() => handleMultipleChoiceToggle(idx)}
                      role="checkbox"
                      aria-checked={isSelected}
                      style={{
                        accentColor: 'var(--color-accent-terracotta, #9A503A)',
                        width: '18px',
                        height: '18px',
                        cursor: evalResult ? 'default' : 'pointer'
                      }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: '1.5px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-text-primary, #302B27)' : 'var(--color-surface-secondary, #EFE8DC)',
                      color: '#FCFAF5',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Format 3: Matching Pairs */}
        {/* ----------------------------------------------------------------- */}
        {format === 'matching' && (
          <div className="quiz-matching-container" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #797066)', marginBottom: '8px' }}>
              Pair each provision or vector with its corresponding definition:
            </div>
            {q?.leftItems?.map((left, idx) => {
              const currentPair = selectedPairs.find(p => p.left === left);
              const chosenRight = currentPair?.right || '';
              return (
                <div key={idx} className="quiz-matching-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="quiz-matching-left" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    <strong>{idx + 1}.</strong> {left}
                  </div>
                  <div>
                    <select
                      id={`matching-select-${idx}`}
                      aria-label={`Matching definition for ${left}`}
                      value={chosenRight}
                      disabled={Boolean(evalResult)}
                      onChange={(e) => handleMatchingPairChange(left, e.target.value)}
                      className="quiz-matching-select"
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Choose matching definition --</option>
                      {q?.rightItems?.map((rOpt, rIdx) => (
                        <option key={rIdx} value={rOpt}>{rOpt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Format 4: Ordering (Sequence) */}
        {/* ----------------------------------------------------------------- */}
        {format === 'ordering' && (
          <div className="quiz-ordering-container" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted, #797066)', marginBottom: '8px' }}>
              Arrange the steps in the correct chronological order:
            </div>
            {selectedSequence.map((itemText, idx) => (
              <div
                key={idx}
                className="quiz-ordering-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-card, #FCFAF5)',
                  marginBottom: '8px'
                }}
              >
                <span className="quiz-ordering-rank" style={{ fontWeight: 800, color: 'var(--color-accent-terracotta, #A65F45)' }}>
                  {idx + 1}
                </span>
                <span className="quiz-ordering-text" style={{ flexGrow: 1, fontSize: '0.88rem' }}>
                  {itemText}
                </span>
                {!evalResult && (
                  <div className="quiz-ordering-controls" style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleOrderingShift(idx, 'up')}
                      disabled={idx === 0}
                      aria-label={`Move "${itemText}" up`}
                      className="quiz-ordering-btn"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      ▲ Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrderingShift(idx, 'down')}
                      disabled={idx === selectedSequence.length - 1}
                      aria-label={`Move "${itemText}" down`}
                      className="quiz-ordering-btn"
                      style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: idx === selectedSequence.length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ▼ Down
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Format 5: Indicator Identification */}
        {/* ----------------------------------------------------------------- */}
        {format === 'indicator_identification' && (
          <div className="quiz-indicator-box" style={{ marginBottom: '20px' }}>
            <span className="quiz-indicator-instruction" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Inspect the passage below and click on the elements that indicate a potential threat or red flag:
            </span>
            {q?.textToInspect && (
              <div
                className="quiz-indicator-passage"
                style={{
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  marginBottom: '12px'
                }}
              >
                {q.textToInspect}
              </div>
            )}
            <div className="quiz-indicator-tokens" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {q?.indicators?.map(ind => {
                const isFlagged = selectedIndicatorIds.includes(ind.id);
                return (
                  <button
                    key={ind.id}
                    type="button"
                    disabled={Boolean(evalResult)}
                    aria-pressed={isFlagged}
                    onClick={() => handleIndicatorToggle(ind.id)}
                    className={`quiz-indicator-token ${isFlagged ? 'flagged' : ''}`}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: isFlagged ? '1.5px solid var(--color-danger, #A34D43)' : '1px solid var(--color-border)',
                      backgroundColor: isFlagged ? 'var(--color-danger-light, #F9ECEB)' : 'var(--color-surface-card, #FCFAF5)',
                      color: isFlagged ? 'var(--color-danger, #A34D43)' : 'var(--text-primary)',
                      cursor: evalResult ? 'default' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: isFlagged ? 700 : 500
                    }}
                  >
                    {isFlagged ? '⚑ ' : '○ '}{ind.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Graded Feedback Box (After Submission) */}
        {/* ----------------------------------------------------------------- */}
        {evalResult && (
          <div style={{ marginBottom: '20px' }}>
            {/* Status Banner */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '6px',
              backgroundColor: evalResult.isCorrect ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-danger-light, #F9ECEB)',
              borderLeft: `4px solid ${evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)'}`,
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)' }}>
                {evalResult.isCorrect ? '✓ Correct answer' : '✕ Incorrect'}
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)', lineHeight: 1.45 }}>
                {evalResult.isCorrect
                  ? 'Your answer matches the statutory principle.'
                  : (evalResult.whyIncorrect || 'This selection does not align with established statutory provisions.')}
              </p>
            </div>

            {/* If Incorrect: Show Clear Solution Breakdown */}
            {!evalResult.isCorrect && evalResult.solution && (
              <div style={{ padding: '12px 14px', borderRadius: '6px', backgroundColor: 'var(--color-surface-card, #FCFAF5)', border: '1px solid var(--color-border, #DED6C9)', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-accent-terracotta, #A65F45)', display: 'block', marginBottom: '6px' }}>
                  Authoritative Correct Answer:
                </span>

                {/* Single Choice Solution */}
                {['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format) && (
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {q?.options?.[evalResult.solution.correctOptionIndex] || `Option ${(evalResult.solution.correctOptionIndex || 0) + 1}`}
                  </p>
                )}

                {/* Multiple Choice Solution */}
                {format === 'multiple_choice' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {(evalResult.solution.correctOptionIndices || []).map(idx => (
                      <li key={idx} style={{ marginBottom: '2px' }}>
                        {q?.options?.[idx] || `Option ${idx + 1}`}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Matching Solution */}
                {format === 'matching' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {(evalResult.solution.matchingPairs || []).map((p, pIdx) => (
                      <li key={pIdx} style={{ marginBottom: '4px' }}>
                        <strong>{p.left}</strong> → {p.right}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Ordering Solution */}
                {format === 'ordering' && (
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {(evalResult.solution.sequenceItems || []).map((step, sIdx) => (
                      <li key={sIdx} style={{ marginBottom: '3px' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}

                {/* Indicator Solution */}
                {format === 'indicator_identification' && (
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {(evalResult.solution.indicators || [])
                      .filter(ind => ind.isSuspicious)
                      .map((ind, iIdx) => (
                        <li key={iIdx} style={{ marginBottom: '3px' }}>
                          ⚑ <strong>{ind.text}</strong>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}

            {/* Statutory Reasoning */}
            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', border: '1px solid var(--color-border, #DED6C9)', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-primary, #302B27)', display: 'block', marginBottom: '2px' }}>
                Statutory Reasoning:
              </span>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary, #635B53)', lineHeight: 1.45 }}>
                {evalResult.explanation}
              </p>
            </div>

            {/* Practical Takeaway */}
            {evalResult.practicalTakeaway && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', border: '1px dashed var(--color-border, #DED6C9)', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary, #635B53)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <strong>Practical Takeaway:</strong> {evalResult.practicalTakeaway}
                </span>
              </div>
            )}

            {/* Cited Statutory References */}
            {Array.isArray(evalResult.legalReferences) && evalResult.legalReferences.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #797066)', marginTop: '6px' }}>
                <strong>Statutory references:</strong>{' '}
                {evalResult.legalReferences.map(r => {
                  if (typeof r !== 'object' || !r) return String(r || '');
                  const act = r.actName || r.act || '';
                  const section = r.sectionNumber || r.section || '';
                  const citation = `${act} ${section}`.trim();
                  return citation || r.title || '';
                }).filter(Boolean).join('; ')}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' }}>
          {!evalResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="btn btn-primary"
                style={{
                  padding: '8px 20px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--color-accent-terracotta, #A65F45)',
                  borderColor: 'var(--color-accent-terracotta, #A65F45)',
                  opacity: (!canSubmit || submitting) ? 0.6 : 1,
                  cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Checking...' : 'Check Answer'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary"
              style={{ padding: '8px 22px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {isLast ? 'Complete Review & Close' : 'Next Concept →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuizRecallModal;
