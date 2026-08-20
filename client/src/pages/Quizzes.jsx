import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

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
      <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)' }}>
        Interactive Quiz Centre
      </h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-xl)' }}>
        Test your knowledge of digital threats, cyber hygiene, and legal provisions under the IT Act, 2000.
      </p>

      {/* Main Container */}
      {!activeQuiz ? (
        // List Categories to Select
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
          {categories.map((cat) => {
            const quizObj = quizzes.find(q => q.category === cat);
            const count = quizObj ? quizObj.questionCount : 0;
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
              <strong>Quiz Evaluation Complete!</strong> You scored <strong>{scorePercent}%</strong>.<br />
              {submitMessage}
            </div>
          )}

          {activeQuiz.questions.map((q, qIndex) => {
            const chosenOption = selectedAnswers[qIndex];
            
            // Post-submission evaluations fetched from the backend (Answer Security)
            const expData = explanations.find(e => e.questionId.toString() === q.id.toString()) || {};
            const isCorrect = expData.isCorrect;
            const correctOptionIndex = expData.correctOptionIndex;
            const explanationText = expData.explanation;

            return (
              <div key={q.id} className="editorial-card" style={{
                borderLeft: quizSubmitted 
                  ? (isCorrect ? '4px solid var(--color-success)' : '4px solid var(--color-error)')
                  : '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Question {qIndex + 1} of {activeQuiz.questions.length}</span>
                  <span>Difficulty: {q.difficulty}</span>
                </div>
                
                <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-md)' }}>{q.questionText}</h3>

                {/* Option list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                  {q.options.map((opt, optIndex) => {
                    const isSelected = chosenOption === optIndex;
                    let optionStyle = {
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border-dark)',
                      textAlign: 'left',
                      background: isSelected ? 'var(--accent-navy-light)' : 'var(--bg-white)',
                      cursor: quizSubmitted ? 'default' : 'pointer',
                      width: '100%',
                      fontWeight: isSelected ? '500' : '400',
                      transition: 'var(--transition-fast)'
                    };

                    // Highlights after submission using backend-returned values
                    if (quizSubmitted) {
                      if (optIndex === correctOptionIndex) {
                        optionStyle.borderColor = 'var(--color-success)';
                        optionStyle.backgroundColor = 'var(--color-success-light)';
                        optionStyle.color = '#1a6234';
                        optionStyle.fontWeight = '600';
                      } else if (isSelected && !isCorrect) {
                        optionStyle.borderColor = 'var(--color-error)';
                        optionStyle.backgroundColor = 'var(--color-error-light)';
                        optionStyle.color = '#7b1c12';
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => handleOptionChange(qIndex, optIndex)}
                        style={optionStyle}
                        disabled={quizSubmitted}
                      >
                        {isSelected ? '●' : '○'} {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation block */}
                {quizSubmitted && explanationText && (
                  <div style={{
                    marginTop: 'var(--space-md)',
                    padding: 'var(--space-sm) var(--space-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    fontSize: '0.85rem'
                  }}>
                    <strong style={{ color: 'var(--accent-navy)' }}>Explanation:</strong> {explanationText}
                    {q.relatedLawSection && (
                      <div style={{ marginTop: 'var(--space-xs)', fontSize: '0.8rem' }}>
                        <em>Related Law:</em> <Link to="/laws" style={{ fontWeight: '600', textDecoration: 'underline' }}>{q.relatedLawSection}</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!quizSubmitted && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
              <button onClick={handleSubmitQuiz} className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontWeight: '600' }}>
                Submit Quiz for Scoring
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
