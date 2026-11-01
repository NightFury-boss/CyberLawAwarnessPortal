import React, { useState } from 'react';
import api from '../../services/api';

/**
 * QuizRecallModal Component
 * Interactive spaced retrieval runner for missed standalone quiz concepts.
 * 
 * Strict Guarantees:
 * - Completely isolated from pathway spaced reviews (does not touch UserProgress.spacedReviews).
 * - Zero answer leakage: questions are served sanitized; correct answers and explanations appear ONLY after submission.
 * - Explains why chosen option failed and provides actionable statutory takeaway.
 * - When answered correctly, marks concept as mastered.
 */
function QuizRecallModal({
  isOpen,
  onClose,
  dueRecalls = [],
  onRecallCompleted
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !dueRecalls || dueRecalls.length === 0) return null;

  const currentItem = dueRecalls[currentIndex];
  const q = currentItem?.question;
  const isLast = currentIndex === dueRecalls.length - 1;

  const handleSubmit = async () => {
    if (selectedOption === null || submitting || !q) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.submitQuizRecall(currentItem.questionId, {
        selectedOptionIndex: selectedOption
      });
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
    setEvalResult(null);
    setSelectedOption(null);
    setError('');
    if (!isLast) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="quiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recall-modal-title">
      <div className="quiz-modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-accent-terracotta, #A65F45)', display: 'block' }}>
              Spaced Concept Recall • Review {currentIndex + 1} of {dueRecalls.length}
            </span>
            <h3 id="recall-modal-title" style={{ fontSize: '1.15rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--color-text-primary, #302B27)' }}>
              {currentItem.category || 'Statutory Concept Recall'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            aria-label="Close modal"
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
        <p style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '16px' }}>
          {q?.questionText}
        </p>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {q?.options?.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const letter = optionLetters[idx] || String.fromCharCode(65 + idx);
            let stateStyle = {
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1.5px solid var(--color-border)',
              backgroundColor: isSelected ? 'var(--color-gold-light, #FAF4EA)' : 'var(--color-surface-card, #FCFAF5)',
              borderColor: isSelected ? 'var(--color-accent-gold, #B18A55)' : 'var(--color-border)',
              cursor: evalResult ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.15s ease'
            };

            return (
              <div
                key={idx}
                onClick={() => {
                  if (!evalResult) setSelectedOption(idx);
                }}
                style={stateStyle}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  backgroundColor: isSelected ? 'var(--color-accent-gold, #B18A55)' : 'var(--color-surface-secondary, #EFE8DC)',
                  color: isSelected ? '#FCFAF5' : 'var(--color-text-secondary, #635B53)',
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
              </div>
            );
          })}
        </div>

        {/* Graded Feedback Box (After Submission) */}
        {evalResult && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              backgroundColor: evalResult.isCorrect ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-danger-light, #F9ECEB)',
              borderLeft: `4px solid ${evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)'}`,
              marginBottom: '10px'
            }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)' }}>
                {evalResult.isCorrect ? '✓ Correct — Concept Mastered' : '⚠️ Still Needs Practice'}
              </span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: evalResult.isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)', lineHeight: 1.45 }}>
                {evalResult.isCorrect
                  ? 'Great job. You have demonstrated accurate recall of this statutory principle.'
                  : (evalResult.whyIncorrect || 'This choice does not match statutory requirements.')}
              </p>
            </div>

            <div style={{ padding: '10px 14px', borderRadius: '6px', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', border: '1px solid var(--color-border, #DED6C9)', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-primary, #302B27)', display: 'block', marginBottom: '2px' }}>
                Statutory Reasoning:
              </span>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary, #635B53)', lineHeight: 1.45 }}>
                {evalResult.explanation}
              </p>
            </div>

            {evalResult.practicalTakeaway && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--color-surface-secondary, #EFE8DC)', border: '1px dashed var(--color-border, #DED6C9)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary, #635B53)' }}>
                  💡 {evalResult.practicalTakeaway}
                </span>
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
                disabled={selectedOption === null || submitting}
                className="btn btn-primary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, backgroundColor: 'var(--color-accent-terracotta, #A65F45)', borderColor: 'var(--color-accent-terracotta, #A65F45)' }}
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

