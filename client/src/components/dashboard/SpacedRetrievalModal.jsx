import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

/**
 * SpacedRetrievalModal Component
 * Spaced Retrieval & Follow-Up Learning
 * 
 * Strict Guarantees:
 * - Server-authoritative grading; initial question payload is sanitized (no leaked answers).
 * - Pedagogical flow: prompts defensive rule recall before revealing explanations.
 * - Explicit evidence standard: labeled as retrieval checkpoint performance, not live behavioral immunity.
 * - Full keyboard accessibility: ESC to close, visible focus, ARIA role="dialog" & aria-modal="true".
 * - Idempotent submission persistence.
 */
export default function SpacedRetrievalModal({
  isOpen,
  onClose,
  pathwayId,
  sourceSessionId,
  onReviewCompleted
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrievalData, setRetrievalData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [hasRecalledRule, setHasRecalledRule] = useState(false);

  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const recallButtonRef = useRef(null);

  // Load sanitized retrieval questions
  useEffect(() => {
    if (!isOpen || !pathwayId) return;

    let isMounted = true;
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedAnswers({});
    setHasRecalledRule(false);

    api.getSpacedRetrievalQuestions(pathwayId, sourceSessionId)
      .then(data => {
        if (isMounted) {
          setRetrievalData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || 'Failed to load spaced retrieval activity.');
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [isOpen, pathwayId, sourceSessionId]);

  // Handle ESC key press & initial focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const timer = setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId, optionIndex) => {
    if (result) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!retrievalData) return;

    const questions = retrievalData.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      setError('Please answer all retrieval questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersPayload = questions.map(q => ({
        questionId: q.questionId,
        selectedOptionIndex: selectedAnswers[q.questionId]
      }));

      const res = await api.submitSpacedRetrieval(pathwayId, sourceSessionId, answersPayload);
      setResult(res);
      if (onReviewCompleted) {
        onReviewCompleted(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit retrieval check.');
    } finally {
      setSubmitting(false);
    }
  };

  const questions = retrievalData?.questions || [];
  const allAnswered = questions.length > 0 && Object.keys(selectedAnswers).length === questions.length;

  return (
    <div
      className="spaced-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="spaced-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spaced-modal-title"
        ref={modalRef}
      >
        {/* Modal Header */}
        <div className="spaced-modal-header">
          <div className="spaced-modal-header-info">
            <span className="spaced-modal-tag">Follow-Up Practice</span>
            <h2 id="spaced-modal-title" className="spaced-modal-title">
              {retrievalData?.habitTitle || 'Follow-Up Practice Check'}
            </h2>
          </div>
          <button
            type="button"
            className="spaced-modal-close"
            onClick={onClose}
            ref={closeButtonRef}
            aria-label="Close practice check modal"
          >
            &times;
          </button>
        </div>

        {/* Modal Content */}
        <div className="spaced-modal-body">
          {loading && (
            <div className="spaced-state-center">
              <p>Loading practice check...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {!loading && retrievalData && !result && !hasRecalledRule && (
            /* STEP 1: Recall Prompt Before Questions */
            <div className="spaced-recall-intro">
              <div className="spaced-prompt-card">
                <div className="spaced-prompt-icon" aria-hidden="true">&#9670;</div>
                <div>
                  <h3 className="spaced-prompt-title">Remember Your Safety Rule</h3>
                  <p className="spaced-prompt-text">
                    Reviewing what you’ve learned after a short break helps safe habits stick.
                    Before answering the questions below, take a moment to recall the safety rule for:
                  </p>
                  <p className="spaced-prompt-target">
                    <strong>{retrievalData.habitTitle}</strong>
                  </p>
                  {retrievalData.pedagogicalFocus && (
                    <p className="spaced-prompt-focus">
                      <em>Focus: {retrievalData.pedagogicalFocus}</em>
                    </p>
                  )}
                </div>
              </div>

              <div className="spaced-intro-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setHasRecalledRule(true)}
                  ref={recallButtonRef}
                >
                  I Remember the Rule &bull; Start Questions &rarr;
                </button>
              </div>
            </div>
          )}

          {!loading && retrievalData && !result && hasRecalledRule && (
            /* STEP 2: Application Questions */
            <form onSubmit={handleSubmit} className="spaced-quiz-form">
              <div className="spaced-quiz-instruction">
                <p>
                  Use what you know to answer these real-life questions. You’ll see the correct answers and law explanations right after submitting.
                </p>
              </div>

              <div className="spaced-questions-list">
                {questions.map((q, qIdx) => {
                  const currentSelected = selectedAnswers[q.questionId];
                  return (
                    <fieldset key={q.questionId} className="spaced-question-card">
                      <legend className="spaced-question-text">
                        <span className="spaced-question-num">Q{qIdx + 1}.</span> {q.questionText}
                      </legend>

                      <div className="spaced-options-group" role="radiogroup" aria-label={`Question ${qIdx + 1}`}>
                        {q.options.map((optText, optIdx) => {
                          const isSelected = currentSelected === optIdx;
                          return (
                            <label
                              key={optIdx}
                              className={`spaced-option-label ${isSelected ? 'spaced-option-selected' : ''}`}
                            >
                              <input
                                type="radio"
                                name={`question_${q.questionId}`}
                                value={optIdx}
                                checked={isSelected}
                                onChange={() => handleSelectOption(q.questionId, optIdx)}
                                className="spaced-option-radio"
                              />
                              <span className="spaced-option-text">{optText}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  );
                })}
              </div>

              <div className="spaced-submit-bar">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!allAnswered || submitting}
                >
                  {submitting ? 'Checking answers...' : 'Submit Answers'}
                </button>
                {!allAnswered && (
                  <span className="spaced-pending-hint">
                    Answer all {questions.length} questions to submit
                  </span>
                )}
              </div>
            </form>
          )}

          {!loading && result && (
            /* STEP 3: Results & Evidence-Calibrated Explanations */
            <div className="spaced-result-container">
              <div className={`spaced-result-banner ${result.passed ? 'banner-passed' : 'banner-review'}`}>
                <div className="spaced-result-score">
                  <span className="spaced-score-number">{result.score}%</span>
                  <span className="spaced-score-label">Practice Score</span>
                </div>
                <div className="spaced-result-verdict">
                  <h3 className="spaced-verdict-title">
                    {result.passed ? 'Practice Check Passed' : 'Review Recommended'}
                  </h3>
                  <p className="spaced-verdict-desc">
                    {result.passed
                      ? `Great job! You passed this follow-up practice check (passing score: ${result.passingScore}%).`
                      : `Your score was below ${result.passingScore}%. Take a moment to review the law explanations below.`}
                  </p>
                </div>
              </div>

              {/* Core Defensive Rule Reveal */}
              <div className="spaced-revealed-rule">
                <div className="spaced-rule-label">Key Safety Rule</div>
                <div className="spaced-rule-text">"{result.explanations?.[0] ? retrievalData?.coreRule : ''}"</div>
              </div>

              {/* Explicit Evidence Quality Disclaimer */}
              <div className="spaced-evidence-callout" role="note">
                <strong>Note on Your Progress:</strong> This check measures how well you remember key safety principles over time. Remembering a rule here is an important step, but staying alert in real life is always essential.
              </div>

              {/* Question-by-Question Review */}
              <div className="spaced-review-list">
                <h4 className="spaced-review-heading">Answers & Law Explanations</h4>
                {(result.explanations || []).map((exp, idx) => (
                  <div
                    key={exp.questionId}
                    className={`spaced-review-item ${exp.isCorrect ? 'review-item-correct' : 'review-item-incorrect'}`}
                  >
                    <div className="spaced-review-item-header">
                      <span className="spaced-review-item-num">Question {idx + 1}</span>
                      <span className={`spaced-review-badge ${exp.isCorrect ? 'badge-correct' : 'badge-incorrect'}`}>
                        {exp.isCorrect ? 'Correct' : 'Needs Review'}
                      </span>
                    </div>

                    <p className="spaced-review-question">{exp.questionText}</p>

                    <div className="spaced-review-explanation">
                      <strong>What the law says:</strong> {exp.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <div className="spaced-result-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onClose}
                >
                  Close & Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
