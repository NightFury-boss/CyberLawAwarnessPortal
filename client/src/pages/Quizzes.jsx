import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';

function Quizzes({ user, updateProgressTrigger }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionIndex -> optionIndex
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quiz evaluation state
  const [scorePercent, setScorePercent] = useState(0);
  const [submitMessage, setSubmitMessage] = useState('');
  const [explanations, setExplanations] = useState([]); // populated by backend after submit

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const data = await api.getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Failed to fetch quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuiz = async (category) => {
    const quizObj = quizzes.find(q => q.category === category);
    if (!quizObj) {
      alert('Quiz not found for this category.');
      return;
    }

    setLoading(true);
    try {
      const questions = await api.getQuizQuestions(quizObj.id);
      setActiveQuiz({
        id: quizObj.id,
        category,
        questions
      });
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setSubmitMessage('');
      setExplanations([]);
    } catch (err) {
      alert(err.message || 'Failed to retrieve quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (qIndex, optionIndex) => {
    if (quizSubmitted) return; // lock inputs
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    
    // Validate all answered
    if (Object.keys(selectedAnswers).length < activeQuiz.questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    // Format answers payload
    const formattedAnswers = activeQuiz.questions.map((q, idx) => ({
      questionId: q.id,
      selectedOptionIndex: selectedAnswers[idx]
    }));

    const quizId = activeQuiz.id;
    if (!quizId) return;

    setLoading(true);
    try {
      // Backend-Authoritative submission
      const data = await api.submitQuiz(quizId, formattedAnswers);
      setScorePercent(data.score);
      setExplanations(data.explanations || []);
      setQuizSubmitted(true);
      setSubmitMessage('Score evaluated and recorded successfully!');
      if (updateProgressTrigger) updateProgressTrigger();
    } catch (err) {
      alert(err.message || 'Evaluation completed, but could not sync progress with the database.');
    } finally {
      setLoading(false);
    }
  };

  // Group quizzes by category for selection list
  const categories = [...new Set(quizzes.map(q => q.category))];

  if (loading && quizzes.length === 0) return <div className="container" style={{ padding: 'var(--space-xl) 0' }}><p>Loading quiz files...</p></div>;
  if (error) return <div className="container" style={{ padding: 'var(--space-xl) 0' }}><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="container" style={{ padding: 'var(--space-xl) 0' }}>
      {/* Editorial Header */}
      <EditorialPageHeader
        eyebrow="Knowledge Practice"
        title="Interactive Quiz Centre"
        subtitle='"Knowing an answer is useful. Knowing why it matters is better."'
        description="Test your understanding of digital threats, cyber hygiene, and legal provisions under the Information Technology Act, 2000."
      >
        <WorkspaceBreadcrumb />
      </EditorialPageHeader>

      {/* Main Container */}
      {!activeQuiz ? (
        // List Categories to Select
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {categories.map((cat) => {
            const quizObj = quizzes.find(q => q.category === cat);
            const count = quizObj ? (quizObj.questionCount || 10) : 10;
            return (
              <div key={cat} className="editorial-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="tag">Quiz Category</span>
                  <h3 style={{ fontSize: '1.4rem', margin: 'var(--space-xs) 0' }}>{cat}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                    Test your understanding of {cat.toLowerCase()} risks and protective legal mechanisms.
                  </p>
                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>Questions: {count}</span>
                </div>
                <button
                  onClick={() => handleSelectQuiz(cat)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'var(--space-md)' }}
                >
                  Start Quiz
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        // Active Quiz Renderer
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-sm)' }}>
            <h2 style={{ fontSize: '1.8rem' }}>
              Category: {activeQuiz.category}
            </h2>
            <button onClick={() => setActiveQuiz(null)} className="btn btn-secondary">
              &larr; Back to Categories
            </button>
          </div>

          {quizSubmitted && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ marginBottom: 'var(--space-md)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: 0 }}>
                "Use what you learned. Notice what you missed."
              </p>
            </div>
            <strong>Quiz Evaluation Complete!</strong> You scored <strong>{scorePercent}%</strong>.<br />
              {submitMessage}
            </div>
          )}

          {activeQuiz.questions.map((q, qIndex) => {
            const chosenOption = selectedAnswers[qIndex];
            
            // Post-submission evaluations fetched from the backend (Answer Security)
            const expData = explanations.find(e => e.questionId.toString() === q.id.toString()) || {};
            const isCorrect = expData.isCorrect;

            return (
              <div 
                key={q.id || qIndex} 
                className="card" 
                style={{ 
                  marginBottom: 'var(--space-lg)', 
                  border: quizSubmitted 
                    ? (isCorrect ? '1px solid var(--color-success)' : '1px solid var(--color-error)') 
                    : '1px solid var(--color-border)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Question {qIndex + 1} of {activeQuiz.questions.length}</span>
                  {q.relatedLawSection && (
                    <span className="tag tag-accent">{q.relatedLawSection}</span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-md)' }}>
                  {q.questionText}
                </h4>

                {/* Option Radios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {q.options.map((opt, optIndex) => {
                    const isSelected = chosenOption === optIndex;
                    let optionStyle = {
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      backgroundColor: isSelected ? 'var(--color-surface)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)'
                    };

                    if (quizSubmitted) {
                      if (optIndex === expData.correctOptionIndex) {
                        optionStyle.backgroundColor = '#e6ffed';
                        optionStyle.borderColor = 'var(--color-success)';
                      } else if (isSelected && !isCorrect) {
                        optionStyle.backgroundColor = '#ffeef0';
                        optionStyle.borderColor = 'var(--color-error)';
                      }
                    }

                    return (
                      <label key={optIndex} style={optionStyle}>
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={isSelected}
                          onChange={() => handleOptionChange(qIndex, optIndex)}
                          disabled={quizSubmitted}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Post-submit Explanation Box */}
                {quizSubmitted && expData.explanation && (
                  <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-error)'}` }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>
                      <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong> {expData.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {!quizSubmitted ? (
            <button 
              onClick={handleSubmitQuiz} 
              className="btn btn-primary"
              style={{ width: '100%', padding: 'var(--space-md)', fontSize: '1.1rem' }}
            >
              Submit Quiz
            </button>
          ) : (
            <button 
              onClick={() => setActiveQuiz(null)} 
              className="btn btn-secondary"
              style={{ width: '100%', padding: 'var(--space-md)', fontSize: '1.1rem' }}
            >
              Choose Another Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
