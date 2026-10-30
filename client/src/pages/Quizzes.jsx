import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';

function Quizzes({ user, updateProgressTrigger }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // questionIndex -> optionIndex
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('focus'); // 'focus' (step-by-step) or 'all' (list view)

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  
  // Quiz evaluation state
  const [scorePercent, setScorePercent] = useState(0);
  const [submitMessage, setSubmitMessage] = useState('');
  const [explanations, setExplanations] = useState([]); // populated by backend after submit
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'correct', 'review'

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getQuizzes();
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load practice quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuiz = async (quiz) => {
    if (!quiz || !quiz.id) return;
    setLoading(true);
    try {
      const questions = await api.getQuizQuestions(quiz.id);
      setActiveQuiz({
        id: quiz.id,
        title: quiz.title,
        category: quiz.category,
        difficulty: quiz.difficulty,
        description: quiz.description,
        totalQuestionsInBank: quiz.totalQuestionsInBank || questions.length,
        questions: Array.isArray(questions) ? questions : []
      });
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setSubmitMessage('');
      setExplanations([]);
      setReviewFilter('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.message || 'Failed to retrieve quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeQuiz = () => {
    if (activeQuiz) {
      const current = { ...activeQuiz };
      handleSelectQuiz(current);
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
    if (loading || quizSubmitted || !activeQuiz || !activeQuiz.questions?.length) return;
    
    // Validate all answered
    const totalQ = activeQuiz.questions.length;
    const answered = activeQuiz.questions.filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null).length;
    if (answered < totalQ) {
      const remaining = totalQ - answered;
      const firstUnansweredIdx = activeQuiz.questions.findIndex((_, idx) => selectedAnswers[idx] === undefined || selectedAnswers[idx] === null);
      alert(`Please answer all questions before submitting. ${remaining} question${remaining > 1 ? 's remain' : ' remains'} to be answered.`);
      if (firstUnansweredIdx !== -1) {
        setCurrentQuestionIndex(firstUnansweredIdx);
        if (viewMode === 'all') {
          const el = document.getElementById(`quiz-q-${firstUnansweredIdx}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
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
      setSubmitMessage('Your quiz result has been saved.');
      if (updateProgressTrigger) updateProgressTrigger();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      alert(err.message || 'Evaluation completed, but could not sync progress with the database.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation for Focus Mode
  useEffect(() => {
    if (!activeQuiz || quizSubmitted || viewMode !== 'focus') return;

    const handleKeyDown = (e) => {
      // Don't intercept if modifier keys are pressed (browser shortcuts like Alt+Left, Ctrl+R, etc.)
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      // Don't intercept if focus is inside an input, textarea, select, or contenteditable element
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;

      const totalQ = activeQuiz.questions.length;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (currentQuestionIndex < totalQ - 1) {
          e.preventDefault();
          setCurrentQuestionIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (currentQuestionIndex > 0) {
          e.preventDefault();
          setCurrentQuestionIndex(prev => prev - 1);
        }
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIdx = parseInt(e.key, 10) - 1;
        const currentQ = activeQuiz.questions[currentQuestionIndex];
        if (currentQ && currentQ.options[optionIdx]) {
          e.preventDefault();
          handleOptionChange(currentQuestionIndex, optionIdx);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuiz, quizSubmitted, viewMode, currentQuestionIndex]);

  // Derive categories and difficulties from authoritative quiz bank
  const categories = ['All', ...new Set(quizzes.map(q => q.category).filter(Boolean))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredQuizzes = quizzes.filter(q => {
    if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'All' && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const answeredCount = activeQuiz?.questions
    ? activeQuiz.questions.filter((_, idx) => selectedAnswers[idx] !== undefined && selectedAnswers[idx] !== null).length
    : 0;
  const totalQuestions = activeQuiz?.questions?.length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Filter explanations for review view
  const filteredExplanations = activeQuiz?.questions?.filter((q, qIndex) => {
    if (reviewFilter === 'all') return true;
    const exp = explanations.find(e => e.questionId?.toString() === q.id?.toString());
    if (reviewFilter === 'correct') return exp?.isCorrect === true;
    if (reviewFilter === 'review') return exp?.isCorrect === false;
    return true;
  }) || [];

  const correctCount = explanations.filter(e => e.isCorrect).length;

  if (loading && quizzes.length === 0) {
    return (
      <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Loading topic quizzes...</p>
      </div>
    );
  }

  if (error && quizzes.length === 0) {
    return (
      <div className="container" style={{ padding: 'var(--space-xl) 0' }}>
        <div className="alert alert-error" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
      {/* Top Breadcrumbs & Editorial Header */}
      <EditorialPageHeader
        topContent={<WorkspaceBreadcrumb />}
        eyebrow="Knowledge Practice"
        title="Cyber Law Quizzes"
        subtitle='"Knowing an answer is useful. Knowing why it matters is better."'
        description="Test your understanding of online safety, digital privacy, and key provisions under the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023."
      />

      {/* ========================================================================= */}
      {/* VIEW 1: QUIZ SYLLABUS DIRECTORY                                          */}
      {/* ========================================================================= */}
      {!activeQuiz ? (
        <div className="quiz-directory-wrapper">
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                Available Topic Quizzes
              </span>
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Practice Quizzes by Topic
              </h2>
            </div>
            <span className="quiz-count-badge">
              {filteredQuizzes.length} of {quizzes.length} Quizzes Available
            </span>
          </div>

          {/* Filter Toolbar */}
          <div className="quiz-filter-container">
            {/* Category Filter Pills */}
            <div className="quiz-filter-group">
              <span className="quiz-filter-label">Category:</span>
              <div className="quiz-filter-pills" role="radiogroup" aria-label="Filter by Category">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`quiz-filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    role="radio"
                    aria-checked={selectedCategory === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter Pills */}
            <div className="quiz-filter-group">
              <span className="quiz-filter-label">Difficulty:</span>
              <div className="quiz-filter-pills" role="radiogroup" aria-label="Filter by Difficulty">
                {difficulties.map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`quiz-filter-pill ${selectedDifficulty === diff ? 'active' : ''}`}
                    role="radio"
                    aria-checked={selectedDifficulty === diff}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quiz Cards Grid */}
          {filteredQuizzes.length === 0 ? (
            <div className="quiz-empty-box">
              <h3 className="quiz-empty-title">No matching quiz topics found</h3>
              <p className="quiz-empty-desc">
                Try resetting your category or difficulty filters to see all available quizzes.
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedDifficulty('All'); }}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontSize: '0.88rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="quiz-grid" role="list" aria-label="Available topic quizzes">
              {filteredQuizzes.map((quizObj, idx) => {
                const diffKey = (quizObj.difficulty || 'beginner').toLowerCase();
                return (
                  <article key={quizObj.id || idx} className="quiz-card" role="listitem">
                    <div>
                      <div className="quiz-card-tags">
                        <span className="quiz-badge-category">{quizObj.category}</span>
                        {quizObj.difficulty && (
                          <span className={`quiz-badge-difficulty ${diffKey}`}>
                            {quizObj.difficulty}
                          </span>
                        )}
                      </div>

                      <h3 className="quiz-card-title">{quizObj.title}</h3>
                      <p className="quiz-card-desc">
                        {quizObj.description || `Test your understanding of ${quizObj.category.toLowerCase()} security, warning signs, and official cyber laws.`}
                      </p>
                    </div>

                    <div className="quiz-card-footer">
                      <div className="quiz-card-meta">
                        {quizObj.totalQuestionsInBank > 0 ? (
                          <span>
                            <strong>{quizObj.totalQuestionsInBank}</strong>{' '}
                            {quizObj.totalQuestionsInBank === 1 ? 'question' : 'questions'}
                          </span>
                        ) : null}
                      </div>
                      <button
                        onClick={() => handleSelectQuiz(quizObj)}
                        className="quiz-card-cta"
                        aria-label={`Start ${quizObj.title} quiz`}
                      >
                        Start Quiz &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: ACTIVE QUIZ STUDIO OR RESULTS REPORT                             */
        /* ========================================================================= */
        <div className="quiz-studio-shell">
          {/* Studio Topbar */}
          <div className="quiz-studio-topbar">
            <div className="quiz-studio-title-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="quiz-badge-category">{activeQuiz.category}</span>
                {activeQuiz.difficulty && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    • {activeQuiz.difficulty}
                  </span>
                )}
              </div>
              <h2>{activeQuiz.title}</h2>
            </div>

            <div className="quiz-studio-controls">
              {!quizSubmitted && (
                <div className="quiz-view-toggle" role="group" aria-label="Question display mode">
                  <button
                    type="button"
                    onClick={() => setViewMode('focus')}
                    className={`quiz-view-toggle-btn ${viewMode === 'focus' ? 'active' : ''}`}
                    title="View one question at a time"
                  >
                    One at a time
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`quiz-view-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                    title="View all questions in a list"
                  >
                    All questions
                  </button>
                </div>
              )}
              <button
                onClick={() => setActiveQuiz(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '6px 14px' }}
              >
                &larr; Exit Quiz
              </button>
            </div>
          </div>

          {/* Accessible Live Region for Screen Readers */}
          <div aria-live="polite" className="sr-only">
            {!quizSubmitted
              ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}: ${activeQuiz.questions[currentQuestionIndex]?.questionText}`
              : `Quiz completed with score of ${scorePercent} percent.`}
          </div>

          {/* Interactive Question Palette & Progress (Pre-Submit) */}
          {!quizSubmitted && (
            <div className="quiz-palette-hub">
              <div className="quiz-palette-header">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQuestions} •{' '}
                  <strong>{answeredCount} of {totalQuestions} Answered</strong>
                </span>
                <span>{progressPercent}% Complete</span>
              </div>

              {/* Question Number Palette Navigator */}
              <div className="quiz-palette-grid" role="tablist" aria-label="Question Navigator">
                {activeQuiz.questions.map((_, qIdx) => {
                  const isAnswered = selectedAnswers[qIdx] !== undefined;
                  const isCurrent = currentQuestionIndex === qIdx;
                  return (
                    <button
                      key={qIdx}
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIndex(qIdx);
                        if (viewMode === 'all') {
                          const el = document.getElementById(`quiz-q-${qIdx}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                      className={`quiz-palette-btn ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}
                      title={`Question ${qIdx + 1}: ${isAnswered ? 'Answered' : 'Unanswered'}`}
                      aria-label={`Jump to Question ${qIdx + 1}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Thin Progress Track */}
              <div className="quiz-progress-track" aria-hidden="true">
                <div
                  className={`quiz-progress-fill ${progressPercent === 100 ? 'complete' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary Hero (Post Submission) */}
          {quizSubmitted && (
            <section className="quiz-results-hero" aria-label="Quiz Results Summary">
              <div className="quiz-results-top">
                <div className="quiz-score-display">
                  <div className={`quiz-score-circle ${scorePercent >= 70 ? 'pass' : 'review'}`}>
                    <span className="quiz-score-number">{scorePercent}%</span>
                    <span className="quiz-score-unit">Score</span>
                  </div>
                  <div>
                    <h3 className="quiz-verdict-title">
                      {scorePercent >= 80 ? 'Strong Law Understanding' : scorePercent >= 70 ? 'Quiz Passed' : 'Needs Practice — Review Below'}
                    </h3>
                    <p className="quiz-verdict-subtext">
                      You answered <strong>{correctCount} of {totalQuestions}</strong> questions correctly.
                    </p>
                  </div>
                </div>

                <div className="quiz-results-actions">
                  <button
                    onClick={handleRetakeQuiz}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600' }}
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600' }}
                  >
                    Choose Another Quiz
                  </button>
                  <Link
                    to="/dashboard"
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600' }}
                  >
                    Go to Dashboard &rarr;
                  </Link>
                </div>
              </div>

              <div className="quiz-disclaimer-callout">
                <strong>About your score:</strong> Quizzes test your recall of Indian cyber laws and security guidelines. How you react under pressure is measured separately in your First and Final Checks.
              </div>
            </section>
          )}

          {/* Post-Submit Review Filters */}
          {quizSubmitted && (
            <div className="quiz-review-filter-strip">
              <h3 className="quiz-review-title">Question Breakdown</h3>
              <div className="quiz-review-pills">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`quiz-review-pill ${reviewFilter === 'all' ? 'active' : ''}`}
                >
                  All ({totalQuestions})
                </button>
                <button
                  onClick={() => setReviewFilter('correct')}
                  className={`quiz-review-pill ${reviewFilter === 'correct' ? 'active' : ''}`}
                >
                  Correct ({correctCount})
                </button>
                <button
                  onClick={() => setReviewFilter('review')}
                  className={`quiz-review-pill ${reviewFilter === 'review' ? 'active' : ''}`}
                >
                  Needs Review ({totalQuestions - correctCount})
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUESTIONS CONTAINER: FOCUS MODE (PRE-SUBMIT) VS ALL QUESTIONS LIST       */}
          {/* ========================================================================= */}
          {!quizSubmitted && viewMode === 'focus' ? (
            /* Focus Mode: Display 1 Active Question at a Time */
            (() => {
              const q = activeQuiz.questions[currentQuestionIndex];
              const chosenOption = selectedAnswers[currentQuestionIndex];
              const optionLetters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <div key={q.id || currentQuestionIndex} className="quiz-question-card">
                  {/* Question Meta */}
                  <div className="quiz-question-meta">
                    <span className="quiz-question-number">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <div className="quiz-question-chips">
                      {q.relatedLawSection && (
                        <span className="quiz-chip-law">Ref: {q.relatedLawSection}</span>
                      )}
                    </div>
                  </div>

                  {/* Prompt */}
                  <h4 className="quiz-question-prompt">{q.questionText}</h4>

                  {/* Options */}
                  <div className="quiz-options-group" role="radiogroup" aria-label={`Options for Question ${currentQuestionIndex + 1}`}>
                    {q.options.map((opt, optIndex) => {
                      const isSelected = chosenOption === optIndex;
                      const letter = optionLetters[optIndex] || String.fromCharCode(65 + optIndex);
                      return (
                        <div
                          key={optIndex}
                          onClick={() => handleOptionChange(currentQuestionIndex, optIndex)}
                          className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              handleOptionChange(currentQuestionIndex, optIndex);
                            }
                          }}
                        >
                          <span className="quiz-option-letter">{letter}</span>
                          <span className="quiz-option-text">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Focus Mode Navigation Toolbar */}
                  <div className="quiz-nav-toolbar">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="btn btn-secondary"
                      style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                    >
                      &larr; Previous
                    </button>

                    <div className="quiz-nav-status">
                      {answeredCount === totalQuestions ? (
                        <span style={{ color: '#16a34a', fontWeight: '700' }}>✓ All Answered</span>
                      ) : (
                        <span>{totalQuestions - answeredCount} remaining</span>
                      )}
                    </div>

                    {currentQuestionIndex < totalQuestions - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                        className="btn btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                      >
                        Next &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitQuiz}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '8px 22px', fontSize: '0.88rem', fontWeight: '700', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                      >
                        {loading ? 'Submitting...' : 'Submit Quiz'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* All Questions Mode (or Post-Submit Review Mode) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(quizSubmitted ? filteredExplanations : activeQuiz.questions).map((q, qIndex) => {
                // When in review filter mode, resolve actual question index in activeQuiz
                const originalIdx = activeQuiz.questions.findIndex(item => item.id?.toString() === q.id?.toString());
                const questionIndex = originalIdx !== -1 ? originalIdx : qIndex;
                const chosenOption = selectedAnswers[questionIndex];
                const optionLetters = ['A', 'B', 'C', 'D', 'E'];

                const expData = explanations.find(e => e.questionId?.toString() === q.id?.toString()) || {};
                const isCorrect = expData.isCorrect;

                return (
                  <div
                    key={q.id || questionIndex}
                    id={`quiz-q-${questionIndex}`}
                    className="quiz-question-card"
                    style={{
                      borderLeft: quizSubmitted
                        ? (isCorrect ? '5px solid #22c55e' : '5px solid #ef4444')
                        : '1px solid var(--color-border)'
                    }}
                  >
                    {/* Question Header */}
                    <div className="quiz-question-meta">
                      <span className="quiz-question-number">
                        Question {questionIndex + 1} of {totalQuestions}
                      </span>
                      <div className="quiz-question-chips">
                        {q.relatedLawSection && (
                          <span className="quiz-chip-law">Ref: {q.relatedLawSection}</span>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <h4 className="quiz-question-prompt">{q.questionText}</h4>

                    {/* Options List */}
                    <div className="quiz-options-group" role="radiogroup" aria-label={`Options for Question ${questionIndex + 1}`}>
                      {q.options.map((opt, optIndex) => {
                        const isSelected = chosenOption === optIndex;
                        const isVerifiedAnswer = quizSubmitted && optIndex === expData.correctOptionIndex;
                        const isUserMistake = quizSubmitted && isSelected && !isCorrect;
                        const isMuted = quizSubmitted && !isVerifiedAnswer && !isUserMistake;
                        const letter = optionLetters[optIndex] || String.fromCharCode(65 + optIndex);

                        let stateClass = '';
                        if (!quizSubmitted) {
                          if (isSelected) stateClass = 'selected';
                        } else {
                          if (isVerifiedAnswer) stateClass = 'verified-correct';
                          else if (isUserMistake) stateClass = 'user-mistake';
                          else if (isMuted) stateClass = 'muted-review';
                        }

                        return (
                          <div
                            key={optIndex}
                            onClick={() => handleOptionChange(questionIndex, optIndex)}
                            className={`quiz-option-card ${stateClass} ${quizSubmitted ? 'locked' : ''}`}
                            role="radio"
                            aria-checked={isSelected}
                            tabIndex={quizSubmitted ? -1 : 0}
                            onKeyDown={(e) => {
                              if (!quizSubmitted && (e.key === ' ' || e.key === 'Enter')) {
                                e.preventDefault();
                                handleOptionChange(questionIndex, optIndex);
                              }
                            }}
                          >
                            <span className="quiz-option-letter">{letter}</span>
                            <span className="quiz-option-text">{opt}</span>
                            {isVerifiedAnswer && (
                              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: '700', color: '#16a34a' }}>
                                ✓ Correct Answer
                              </span>
                            )}
                            {isUserMistake && (
                              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: '700', color: '#dc2626' }}>
                                ✗ Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Statutory Explanation Box (Post-Submission) */}
                    {quizSubmitted && expData.explanation && (
                      <div className={`quiz-explanation-callout ${isCorrect ? 'correct' : 'review'}`}>
                        <span className="quiz-explanation-title">
                          {isCorrect ? 'Correct — What the Law Says' : 'Review — What the Law Says'}
                        </span>
                        <p className="quiz-explanation-text">
                          {expData.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Actions Bar for All-Questions Mode */}
              {!quizSubmitted && (
                <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {answeredCount === totalQuestions ? (
                      <strong style={{ color: '#16a34a' }}>✓ All {totalQuestions} questions answered</strong>
                    ) : (
                      <span>{totalQuestions - answeredCount} questions remaining</span>
                    )}
                  </span>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '700' }}
                  >
                    {loading ? 'Checking answers...' : `Submit Quiz (${answeredCount}/${totalQuestions})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Quizzes;
