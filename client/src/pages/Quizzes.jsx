import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';

const CANONICAL_TOPICS = [
  'Indian Cyber Law and IT Act',
  'BNS and cybercrime provisions',
  'BSA and digital evidence',
  'DPDP and privacy',
  'Phishing and social engineering',
  'UPI, banking and financial fraud',
  'Identity theft and account security',
  'AI, deepfakes and emerging threats',
  'Incident response and reporting',
  'General cybersecurity awareness'
];

const DEFAULT_MODES = [
  {
    id: 'quick_practice',
    title: 'Quick Practice',
    badge: 'Rapid 5-Question Session',
    description: 'Short, untimed quizzes with clear explanations and practical takeaways. Perfect for daily practice.',
    questionCount: 5,
    timed: false,
    recommendedFor: 'Rapid review & daily habit building'
  },
  {
    id: 'topic_wise',
    title: 'Topic-wise Practice',
    badge: 'Subject & Level Mastery',
    description: 'Choose any of the 10 Indian cyber law and cybersecurity subjects, and select your difficulty level.',
    questionCount: 10,
    timed: false,
    recommendedFor: 'Targeted study of specific statutes or fraud vectors'
  },
  {
    id: 'scenario',
    title: 'Real-world Scenarios',
    badge: 'Everyday Dilemma Defense',
    description: 'Navigate authentic everyday digital situations, identify suspicious indicators, and make safe defensive decisions.',
    questionCount: 8,
    timed: false,
    recommendedFor: 'Developing practical online safety reflexes'
  },
  {
    id: 'challenge',
    title: 'Challenge Quiz',
    badge: 'Timed Multi-Subject Test',
    description: 'Mixed subjects with higher difficulty (Intermediate & Advanced) and a 10-minute countdown timer.',
    questionCount: 15,
    timed: true,
    defaultDurationSeconds: 600,
    recommendedFor: 'Comprehensive readiness and speed testing'
  },
  {
    id: 'case_based',
    title: 'Case-based & Legal Application',
    badge: 'Statutory & Evidence Application',
    description: 'Questions rooted in Indian court cases, BSA Section 63 digital evidence rules, BNS, and IT Act provisions.',
    questionCount: 8,
    timed: false,
    recommendedFor: 'Legal accuracy, statutory analysis & evidentiary standards'
  }
];

function Quizzes({ user, updateProgressTrigger }) {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState('modes'); // 'modes' or 'catalog'
  const [quizzes, setQuizzes] = useState([]);
  const [modesList, setModesList] = useState(DEFAULT_MODES);
  const [topicsBreakdown, setTopicsBreakdown] = useState([]);
  const [historyData, setHistoryData] = useState(null);

  // Active Quiz Studio State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({}); // qIndex -> answer payload
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [viewMode, setViewMode] = useState('focus'); // 'focus' or 'all'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mode Selection Form State
  const [selectedTopic, setSelectedTopic] = useState(CANONICAL_TOPICS[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [catalogDifficulty, setCatalogDifficulty] = useState('All');

  // Timer State for Timed Mode
  const [timerSeconds, setTimerSeconds] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const [submissionError, setSubmissionError] = useState('');
  const [savedSessionToResume, setSavedSessionToResume] = useState(null);

  // Unanswered Modal
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);

  // Evaluation & Results
  const [scorePercent, setScorePercent] = useState(0);
  const [resultCounts, setResultCounts] = useState({ correct: 0, incorrect: 0, unanswered: 0, total: 0 });
  const [topicBreakdown, setTopicBreakdown] = useState([]);
  const [recommendedLearning, setRecommendedLearning] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'incorrect', 'correct'

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [quizzesRes, modesRes, topicsRes, historyRes] = await Promise.allSettled([
        api.getQuizzes(),
        api.getQuizModes(),
        api.getQuizTopics(),
        api.getQuizHistory()
      ]);

      if (quizzesRes.status === 'fulfilled' && Array.isArray(quizzesRes.value)) {
        setQuizzes(quizzesRes.value);
      }
      if (modesRes.status === 'fulfilled' && modesRes.value?.modes) {
        setModesList(modesRes.value.modes);
      }
      if (topicsRes.status === 'fulfilled' && topicsRes.value?.topics) {
        setTopicsBreakdown(topicsRes.value.topics);
      }
      if (historyRes.status === 'fulfilled' && historyRes.value?.success) {
        setHistoryData(historyRes.value);
      }

      // Check for cached in-progress session in localStorage
      try {
        const cached = localStorage.getItem('cyberlaw_active_quiz_session');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.activeQuiz && Array.isArray(parsed.activeQuiz.questions)) {
            if (parsed.activeQuiz.timed && parsed.startTime) {
              const elapsedSec = Math.floor((Date.now() - parsed.startTime) / 1000);
              const remaining = (parsed.activeQuiz.durationSeconds || 600) - elapsedSec;
              if (remaining > 5) {
                setSavedSessionToResume({ ...parsed, remainingSeconds: remaining });
              } else {
                localStorage.removeItem('cyberlaw_active_quiz_session');
              }
            } else {
              setSavedSessionToResume(parsed);
            }
          }
        }
      } catch (_e) {}
    } catch (err) {
      setError(err.message || 'Failed to initialize quiz portal.');
    } finally {
      setLoading(false);
    }
  };

  // Sync active session to localStorage for resilience
  useEffect(() => {
    if (activeQuiz && !quizSubmitted && activeQuiz.questions?.length > 0) {
      try {
        localStorage.setItem('cyberlaw_active_quiz_session', JSON.stringify({
          activeQuiz,
          answersMap,
          startTime: startTimeRef.current,
          timerSeconds
        }));
      } catch (_e) {}
    }
  }, [activeQuiz, answersMap, quizSubmitted, timerSeconds]);

  // Timer countdown effect
  useEffect(() => {
    if (timerSeconds === null || timerSeconds <= 0 || quizSubmitted || !activeQuiz) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerSeconds, quizSubmitted, activeQuiz]);

  const formatTimer = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '';
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 1. Start Mode-Aware Session
  const handleStartModeSession = async (modeObj) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        mode: modeObj.id,
        difficulty: selectedDifficulty
      };
      if (modeObj.id === 'topic_wise') {
        payload.topic = selectedTopic;
      }

      const res = await api.startQuizSession(payload);
      if (!res.success || !res.questions || res.questions.length === 0) {
        throw new Error('No questions could be loaded for this configuration.');
      }

      initializeStudio({
        id: null,
        mode: modeObj.id,
        title: modeObj.title,
        badge: modeObj.badge,
        category: modeObj.id === 'topic_wise' ? selectedTopic : 'Multi-Subject Practice',
        difficulty: selectedDifficulty,
        questions: res.questions,
        timed: modeObj.timed,
        durationSeconds: modeObj.defaultDurationSeconds || 600
      });
    } catch (err) {
      alert(err.message || 'Unable to launch quiz session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Catalog Quiz
  const handleSelectCatalogQuiz = async (quiz) => {
    if (!quiz || !quiz.id) return;
    setLoading(true);
    try {
      const questions = await api.getQuizQuestions(quiz.id);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions found for this topic quiz.');
      }
      initializeStudio({
        id: quiz.id,
        mode: 'standard',
        title: quiz.title,
        badge: 'Topic Syllabus',
        category: quiz.category,
        difficulty: quiz.difficulty,
        description: quiz.description,
        questions,
        timed: false
      });
    } catch (err) {
      alert(err.message || 'Failed to retrieve quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize active studio state
  const initializeStudio = (sessionData) => {
    // Pre-populate default answer structures for multi-format questions
    const initialMap = {};
    sessionData.questions.forEach((q, idx) => {
      const format = q.format || 'single_choice';
      if (format === 'matching') {
        const lefts = q.leftItems || [];
        initialMap[idx] = {
          selectedPairs: lefts.map(left => ({ left, right: '' }))
        };
      } else if (format === 'ordering') {
        initialMap[idx] = {
          selectedSequence: [...(q.sequenceItems || [])]
        };
      } else if (format === 'multiple_choice') {
        initialMap[idx] = {
          selectedOptionIndices: []
        };
      } else if (format === 'indicator_identification') {
        initialMap[idx] = {
          selectedIndicatorIds: []
        };
      } else {
        initialMap[idx] = {
          selectedOptionIndex: null
        };
      }
    });

    setActiveQuiz(sessionData);
    setCurrentQuestionIndex(0);
    setAnswersMap(initialMap);
    setQuizSubmitted(false);
    setScorePercent(0);
    setExplanations([]);
    setTopicBreakdown([]);
    setRecommendedLearning([]);
    setReviewFilter('all');
    setShowUnansweredModal(false);
    startTimeRef.current = Date.now();

    if (sessionData.timed) {
      setTimerSeconds(sessionData.durationSeconds || 600);
    } else {
      setTimerSeconds(null);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetakeQuiz = () => {
    if (activeQuiz) {
      if (activeQuiz.id) {
        handleSelectCatalogQuiz({ id: activeQuiz.id, title: activeQuiz.title, category: activeQuiz.category, difficulty: activeQuiz.difficulty });
      } else {
        handleStartModeSession({
          id: activeQuiz.mode,
          title: activeQuiz.title,
          badge: activeQuiz.badge,
          timed: activeQuiz.timed,
          defaultDurationSeconds: activeQuiz.durationSeconds
        });
      }
    }
  };

  // Helper: check if a specific question is answered
  const isQuestionAnswered = (qIndex) => {
    if (!activeQuiz || !activeQuiz.questions[qIndex]) return false;
    const q = activeQuiz.questions[qIndex];
    const ans = answersMap[qIndex];
    if (!ans) return false;

    const format = q.format || 'single_choice';
    if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
      return ans.selectedOptionIndex !== null && ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== -1;
    }
    if (format === 'multiple_choice') {
      return Array.isArray(ans.selectedOptionIndices) && ans.selectedOptionIndices.length > 0;
    }
    if (format === 'matching') {
      return Array.isArray(ans.selectedPairs) &&
        ans.selectedPairs.length > 0 &&
        ans.selectedPairs.every(p => Boolean(p.right));
    }
    if (format === 'ordering') {
      return Array.isArray(ans.selectedSequence) && ans.selectedSequence.length > 0;
    }
    if (format === 'indicator_identification') {
      return Array.isArray(ans.selectedIndicatorIds) && ans.selectedIndicatorIds.length > 0;
    }
    return false;
  };

  // Answer change handlers for all 8 formats
  const handleSingleChoiceSelect = (qIndex, optionIndex) => {
    if (quizSubmitted) return;
    setAnswersMap(prev => ({
      ...prev,
      [qIndex]: {
        ...(prev[qIndex] || {}),
        selectedOptionIndex: optionIndex
      }
    }));
  };

  const handleMultipleChoiceToggle = (qIndex, optionIndex) => {
    if (quizSubmitted) return;
    setAnswersMap(prev => {
      const current = prev[qIndex]?.selectedOptionIndices || [];
      const updated = current.includes(optionIndex)
        ? current.filter(i => i !== optionIndex)
        : [...current, optionIndex].sort((a, b) => a - b);
      return {
        ...prev,
        [qIndex]: {
          ...(prev[qIndex] || {}),
          selectedOptionIndices: updated
        }
      };
    });
  };

  const handleMatchingPairChange = (qIndex, leftItem, chosenRight) => {
    if (quizSubmitted) return;
    setAnswersMap(prev => {
      const currentPairs = prev[qIndex]?.selectedPairs || [];
      const updated = currentPairs.map(p => p.left === leftItem ? { ...p, right: chosenRight } : p);
      if (!updated.some(p => p.left === leftItem)) {
        updated.push({ left: leftItem, right: chosenRight });
      }
      return {
        ...prev,
        [qIndex]: {
          ...(prev[qIndex] || {}),
          selectedPairs: updated
        }
      };
    });
  };

  const handleOrderingShift = (qIndex, itemIndex, direction) => {
    if (quizSubmitted) return;
    setAnswersMap(prev => {
      const seq = [...(prev[qIndex]?.selectedSequence || activeQuiz.questions[qIndex].sequenceItems || [])];
      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex < 0 || targetIndex >= seq.length) return prev;
      const temp = seq[itemIndex];
      seq[itemIndex] = seq[targetIndex];
      seq[targetIndex] = temp;
      return {
        ...prev,
        [qIndex]: {
          ...(prev[qIndex] || {}),
          selectedSequence: seq
        }
      };
    });
  };

  const handleIndicatorToggle = (qIndex, indicatorId) => {
    if (quizSubmitted) return;
    setAnswersMap(prev => {
      const current = prev[qIndex]?.selectedIndicatorIds || [];
      const updated = current.includes(indicatorId)
        ? current.filter(id => id !== indicatorId)
        : [...current, indicatorId];
      return {
        ...prev,
        [qIndex]: {
          ...(prev[qIndex] || {}),
          selectedIndicatorIds: updated
        }
      };
    });
  };

  // Keyboard navigation for Focus mode
  useEffect(() => {
    if (!activeQuiz || quizSubmitted || viewMode !== 'focus') return;

    const handleKeyDown = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
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
        const currentQ = activeQuiz.questions[currentQuestionIndex];
        const format = currentQ?.format || 'single_choice';
        const optIdx = parseInt(e.key, 10) - 1;
        if (currentQ && currentQ.options && currentQ.options[optIdx]) {
          e.preventDefault();
          if (format === 'multiple_choice') {
            handleMultipleChoiceToggle(currentQuestionIndex, optIdx);
          } else if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
            handleSingleChoiceSelect(currentQuestionIndex, optIdx);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeQuiz, quizSubmitted, viewMode, currentQuestionIndex]);

  // Submission Flow
  const handleSubmitClick = () => {
    if (loading || quizSubmitted || !activeQuiz || !activeQuiz.questions?.length) return;

    const totalQ = activeQuiz.questions.length;
    const unansweredIndices = [];
    for (let i = 0; i < totalQ; i++) {
      if (!isQuestionAnswered(i)) {
        unansweredIndices.push(i);
      }
    }

    if (unansweredIndices.length > 0) {
      setShowUnansweredModal(true);
    } else {
      executeSubmission();
    }
  };

  const handleForceSubmit = () => {
    setShowUnansweredModal(false);
    executeSubmission();
  };

  const executeSubmission = async () => {
    if (!activeQuiz || !activeQuiz.questions?.length) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmissionError('');

    const formattedAnswers = activeQuiz.questions.map((q, idx) => {
      const ans = answersMap[idx] || {};
      const format = q.format || 'single_choice';
      const item = { questionId: q.id };

      if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
        item.selectedOptionIndex = (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex !== null)
          ? ans.selectedOptionIndex
          : -1;
      } else if (format === 'multiple_choice') {
        item.selectedOptionIndices = ans.selectedOptionIndices || [];
      } else if (format === 'matching') {
        item.selectedPairs = ans.selectedPairs || [];
      } else if (format === 'ordering') {
        item.selectedSequence = ans.selectedSequence || q.sequenceItems || [];
      } else if (format === 'indicator_identification') {
        item.selectedIndicatorIds = ans.selectedIndicatorIds || [];
      }
      return item;
    });

    const elapsedSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 0;

    const payload = {
      quizId: activeQuiz.id || undefined,
      mode: activeQuiz.mode || 'standard',
      topic: activeQuiz.category || 'General',
      difficulty: activeQuiz.difficulty || 'All',
      timeTaken: elapsedSeconds,
      answers: formattedAnswers
    };

    setLoading(true);
    try {
      const data = await api.submitQuiz(payload);
      setScorePercent(data.score ?? data.percentage ?? 0);
      setResultCounts({
        correct: data.correctCount || 0,
        incorrect: data.incorrectCount || 0,
        unanswered: data.unansweredCount || 0,
        total: data.totalQuestions || activeQuiz.questions.length
      });
      setExplanations(data.explanations || []);
      setTopicBreakdown(data.topicBreakdown || []);
      setRecommendedLearning(data.recommendedLearning || []);
      setQuizSubmitted(true);
      setShowUnansweredModal(false);
      setSubmissionError('');

      // Clear local session storage upon verified success
      try {
        localStorage.removeItem('cyberlaw_active_quiz_session');
      } catch (_e) {}

      if (updateProgressTrigger) updateProgressTrigger();
      // Refresh history in background
      api.getQuizHistory().then(h => {
        if (h && h.success) setHistoryData(h);
      }).catch(() => {});

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmissionError(err.message || 'Error submitting session. Your answers have been preserved locally. Please click Retry.');
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  // Directory Filtering Calculations
  const categories = ['All', ...new Set(quizzes.map(q => q.category).filter(Boolean))];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredQuizzes = quizzes.filter(q => {
    if (catalogCategory !== 'All' && q.category !== catalogCategory) return false;
    if (catalogDifficulty !== 'All' && q.difficulty !== catalogDifficulty) return false;
    return true;
  });

  const totalQuestions = activeQuiz?.questions?.length || 0;
  const answeredCount = activeQuiz?.questions
    ? activeQuiz.questions.filter((_, idx) => isQuestionAnswered(idx)).length
    : 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Filter explanations for post-submission Review mode
  const filteredReviewExplanations = explanations.filter(exp => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'incorrect') return exp.isCorrect === false;
    if (reviewFilter === 'correct') return exp.isCorrect === true;
    return true;
  });

  // Early Loading / Error States
  if (loading && !activeQuiz && quizzes.length === 0) {
    return (
      <div className="container" style={{ padding: 'var(--space-2xl) 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Loading Cyber Law Practice Studio...</p>
      </div>
    );
  }

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0' }}>
      {/* Top Breadcrumbs & Editorial Header */}
      <EditorialPageHeader
        topContent={<WorkspaceBreadcrumb />}
        eyebrow="Indian Cyber Law Practice Studio"
        title="Interactive Cyber Law & Defense Quizzes"
        subtitle='"Knowing an answer is useful. Understanding why an option is dangerous is defense."'
        description="Master digital safety, cybercrime provisions under the Bharatiya Nyaya Sanhita 2023, electronic evidence standards under the Bharatiya Sakshya Adhiniyam 2023, and key compliance rules under the IT Act and DPDP Act."
      />

      {/* ========================================================================= */}
      {/* VIEW 1: QUIZ SYLLABUS DIRECTORY & MODES HUB                                */}
      {/* ========================================================================= */}
      {!activeQuiz ? (
        <div className="quiz-directory-wrapper">
          {/* Resume In-Progress Session Banner */}
          {savedSessionToResume && (
            <div style={{
              backgroundColor: 'var(--color-warning-light, #FAF3E8)',
              border: '1.5px solid #fef3c7',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '6px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--color-warning, #B17A38)' }}>
                  Unfinished Practice Session Available
                </strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.84rem', color: 'var(--color-warning, #B17A38)' }}>
                  You have an in-progress session for <strong>{savedSessionToResume.activeQuiz?.title}</strong>
                  {savedSessionToResume.remainingSeconds ? ` (~${Math.round(savedSessionToResume.remainingSeconds / 60)}m remaining)` : ''}.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveQuiz(savedSessionToResume.activeQuiz);
                    setAnswersMap(savedSessionToResume.answersMap || {});
                    startTimeRef.current = savedSessionToResume.startTime || Date.now();
                    setTimerSeconds(savedSessionToResume.remainingSeconds ?? savedSessionToResume.timerSeconds ?? null);
                    setSavedSessionToResume(null);
                  }}
                  className="btn btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  Resume Session &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try { localStorage.removeItem('cyberlaw_active_quiz_session'); } catch (_e) {}
                    setSavedSessionToResume(null);
                  }}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Practice Hub Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '2px solid var(--color-border)',
            marginBottom: '24px',
            paddingBottom: '2px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxWidth: '100%',
            scrollbarWidth: 'none'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('modes')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'modes' ? '3px solid var(--color-accent-terracotta, #9A503A)' : '3px solid transparent',
                padding: '10px 14px',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'modes' ? '700' : '500',
                color: activeTab === 'modes' ? 'var(--color-accent-terracotta, #9A503A)' : 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '-3px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              5 Dedicated Quiz Modes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'catalog' ? '3px solid var(--color-accent-terracotta, #9A503A)' : '3px solid transparent',
                padding: '10px 14px',
                fontSize: '0.95rem',
                fontWeight: activeTab === 'catalog' ? '700' : '500',
                color: activeTab === 'catalog' ? 'var(--color-accent-terracotta, #9A503A)' : 'var(--text-secondary)',
                cursor: 'pointer',
                marginBottom: '-3px',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              Topic Syllabus Catalog ({quizzes.length})
            </button>
          </div>

          {/* Learner Performance Summary Bar */}
          {historyData && historyData.totalAttempts > 0 && (
            <div style={{
              backgroundColor: 'var(--color-surface-secondary, #EFE8DC)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '14px 20px',
              marginBottom: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted, #797066)', letterSpacing: '0.06em' }}>
                  Your Practice Track Record
                </span>
                <div style={{ fontSize: '0.92rem', color: 'var(--color-text-primary, #302B27)', marginTop: '2px' }}>
                  <strong>{historyData.totalAttempts}</strong> sessions completed •{' '}
                  <strong style={{ color: 'var(--color-success, #536F61)' }}>{historyData.highScores}</strong> mastery scores (≥80%)
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted, #797066)' }}>
                Latest: <strong>{historyData.recentAttempts?.[0]?.quizTitle || 'Practice Session'}</strong> (
                {historyData.recentAttempts?.[0]?.percentage}%)
              </div>
            </div>
          )}

          {/* TAB 1: 5 DEDICATED MODES */}
          {activeTab === 'modes' && (
            <div>
              {/* Section Header */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                  Targeted Learning Modes
                </span>
                <h2 style={{ fontSize: '1.42rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  Choose Your Practice Experience
                </h2>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                  Engage with diverse question formats: multi-select choices, statutory matching, incident ordering sequences, and text indicator defense.
                </p>
              </div>

              {/* Mode Cards Grid */}
              <div className="quiz-modes-grid" role="list" aria-label="Available Quiz Modes">
                {modesList.map((mode) => (
                  <div
                    key={mode.id}
                    className="quiz-mode-card"
                    role="listitem"
                    onClick={() => {
                      if (mode.id !== 'topic_wise') {
                        handleStartModeSession(mode);
                      }
                    }}
                  >
                    <div>
                      <span className="quiz-mode-badge">{mode.badge}</span>
                      <h3 className="quiz-mode-title">{mode.title}</h3>
                      <p className="quiz-mode-desc">{mode.description}</p>
                    </div>

                    {mode.id === 'topic_wise' && (
                      <div style={{ margin: '8px 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            SELECT TOPIC:
                          </label>
                          <select
                            value={selectedTopic}
                            onChange={(e) => setSelectedTopic(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              backgroundColor: '#fff'
                            }}
                          >
                            {CANONICAL_TOPICS.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                            DIFFICULTY:
                          </label>
                          <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              backgroundColor: '#fff'
                            }}
                          >
                            <option value="All">All Levels (Balanced)</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStartModeSession(mode)}
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: '700', marginTop: '4px' }}
                        >
                          Start Topic Session &rarr;
                        </button>
                      </div>
                    )}

                    <div className="quiz-mode-footer">
                      <span>{mode.questionCount} Questions {mode.timed ? '• Timed 10m' : '• Untimed'}</span>
                      {mode.id !== 'topic_wise' && (
                        <span className="quiz-mode-cta">
                          Start &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 10 Topics Syllabus Overview Strip */}
              {topicsBreakdown.length > 0 && (
                <div style={{ marginTop: '36px' }}>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px' }}>
                    Authoritative Subject Bank Coverage
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                    {topicsBreakdown.map(tb => (
                      <div
                        key={tb.topic}
                        style={{
                          backgroundColor: 'var(--color-surface-card, #FFFDFA)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-primary, #302B27)' }}>
                          {tb.topic}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-primary, #302B27)', backgroundColor: 'var(--color-gold-light, #FAF4EA)', padding: '2px 8px', borderRadius: '4px' }}>
                          {tb.totalQuestions} questions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOPIC SYLLABUS CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              {/* Filter Toolbar */}
              <div className="quiz-filter-container">
                <div className="quiz-filter-group">
                  <span className="quiz-filter-label">Category:</span>
                  <div className="quiz-filter-pills" role="radiogroup" aria-label="Filter by Category">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCatalogCategory(cat)}
                        className={`quiz-filter-pill ${catalogCategory === cat ? 'active' : ''}`}
                        role="radio"
                        aria-checked={catalogCategory === cat}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="quiz-filter-group">
                  <span className="quiz-filter-label">Difficulty:</span>
                  <div className="quiz-filter-pills" role="radiogroup" aria-label="Filter by Difficulty">
                    {difficulties.map(diff => (
                      <button
                        key={diff}
                        onClick={() => setCatalogDifficulty(diff)}
                        className={`quiz-filter-pill ${catalogDifficulty === diff ? 'active' : ''}`}
                        role="radio"
                        aria-checked={catalogDifficulty === diff}
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
                  <h3 className="quiz-empty-title">No matching topic quizzes found</h3>
                  <p className="quiz-empty-desc">Try resetting your filters to see all available syllabus topics.</p>
                  <button
                    onClick={() => { setCatalogCategory('All'); setCatalogDifficulty('All'); }}
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
                            {quizObj.totalQuestionsInBank > 0 && (
                              <span>
                                <strong>{quizObj.totalQuestionsInBank}</strong> questions
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleSelectCatalogQuiz(quizObj)}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="quiz-badge-category">{activeQuiz.category}</span>
                {activeQuiz.badge && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-primary, #302B27)', backgroundColor: 'var(--color-gold-light, #FAF4EA)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                    {activeQuiz.badge}
                  </span>
                )}
                {activeQuiz.difficulty && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                    • {activeQuiz.difficulty}
                  </span>
                )}
                {timerSeconds !== null && !quizSubmitted && (
                  <span className={`quiz-timer-pill ${timerSeconds < 120 ? 'urgent' : ''}`} aria-live="polite">
                    ⏱ Time Left: {formatTimer(timerSeconds)}
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
                &larr; Exit Session
              </button>
            </div>
          </div>

          {/* Submission Failure Alert & Retry Banner */}
          {submissionError && (
            <div style={{
              backgroundColor: 'var(--color-danger-light, #F9ECEB)',
              border: '1px solid #fee2e2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '6px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-danger, #A34D43)', fontWeight: 500 }}>
                ⚠️ {submissionError}
              </span>
              <button
                type="button"
                onClick={executeSubmission}
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '6px 16px', fontSize: '0.82rem', backgroundColor: 'var(--color-danger, #A34D43)', borderColor: 'var(--color-danger, #A34D43)', fontWeight: 600 }}
              >
                {loading ? 'Retrying...' : 'Retry Submission'}
              </button>
            </div>
          )}

          {/* Accessible Live Region */}
          <div aria-live="polite" className="sr-only">
            {!quizSubmitted
              ? `Question ${currentQuestionIndex + 1} of ${totalQuestions}: ${activeQuiz.questions[currentQuestionIndex]?.questionText}`
              : `Quiz completed with score of ${scorePercent} percent.`}
          </div>

          {/* Question Palette & Progress (Pre-Submission) */}
          {!quizSubmitted && (
            <div className="quiz-palette-hub">
              <div className="quiz-palette-header">
                <span>
                  Question {currentQuestionIndex + 1} of {totalQuestions} •{' '}
                  <strong>{answeredCount} of {totalQuestions} Answered</strong>
                </span>
                <span>{progressPercent}% Complete</span>
              </div>

              {/* Navigator Palette */}
              <div className="quiz-palette-grid" role="tablist" aria-label="Question Navigator">
                {activeQuiz.questions.map((_, qIdx) => {
                  const answered = isQuestionAnswered(qIdx);
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
                      className={`quiz-palette-btn ${answered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}
                      title={`Question ${qIdx + 1}: ${answered ? 'Answered' : 'Unanswered'}`}
                      aria-label={`Jump to Question ${qIdx + 1}`}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {qIdx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="quiz-progress-track" aria-hidden="true">
                <div
                  className={`quiz-progress-fill ${progressPercent === 100 ? 'complete' : ''}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* POST-SUBMISSION RESULTS HERO & PERFORMANCE BREAKDOWN                      */}
          {/* ========================================================================= */}
          {quizSubmitted && (
            <div>
              <section className="quiz-results-hero" aria-label="Quiz Results Summary">
                <div className="quiz-results-top">
                  <div className="quiz-score-display">
                    <div className={`quiz-score-circle ${scorePercent >= 70 ? 'pass' : 'review'}`}>
                      <span className="quiz-score-number">{scorePercent}%</span>
                      <span className="quiz-score-unit">Score</span>
                    </div>
                    <div>
                      <h3 className="quiz-verdict-title">
                        {scorePercent >= 80 ? 'Exceptional Statutory & Safety Recall' : scorePercent >= 70 ? 'Session Passed — Good Understanding' : 'Needs Practice — Review Explanations Below'}
                      </h3>
                      <p className="quiz-verdict-subtext">
                        You answered <strong>{resultCounts.correct} of {resultCounts.total}</strong> questions correctly.
                        {resultCounts.unanswered > 0 && ` (${resultCounts.unanswered} left unanswered)`}
                      </p>
                    </div>
                  </div>

                  <div className="quiz-results-actions">
                    <button
                      onClick={handleRetakeQuiz}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600' }}
                    >
                      Retake Session
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
                  <strong>Statutory Notice:</strong> Awareness quizzes evaluate statutory knowledge, evidence fundamentals, and defensive decision-making under the IT Act 2000, BNS 2023, BSA 2023, and DPDP Act 2023. These educational materials do not constitute formal legal advice.
                </div>
              </section>

              {/* Topic Performance Breakdown Card */}
              {topicBreakdown.length > 0 && (
                <div className="quiz-topic-breakdown-card">
                  <h4 className="quiz-topic-breakdown-title">Topic Performance Breakdown</h4>
                  <div className="quiz-topic-bars-grid">
                    {topicBreakdown.map(tb => {
                      const pct = tb.percentage;
                      const meterClass = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low';
                      return (
                        <div key={tb.topic} className="quiz-topic-bar-item">
                          <div className="quiz-topic-bar-header">
                            <span className="quiz-topic-name">{tb.topic}</span>
                            <span className="quiz-topic-score">{tb.correct} / {tb.total} ({pct}%)</span>
                          </div>
                          <div className="quiz-topic-meter">
                            <div
                              className={`quiz-topic-meter-fill ${meterClass}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Next Learning Modules & Case Studies */}
              {recommendedLearning.length > 0 && (
                <div className="quiz-topic-breakdown-card">
                  <h4 className="quiz-topic-breakdown-title">Recommended Next Learning</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    Reinforce the specific topics where mistakes occurred:
                  </p>
                  <div className="quiz-recommended-grid">
                    {recommendedLearning.map((item, idx) => {
                      const linkUrl = item.type === 'learning_module'
                        ? `/modules/${item.slug}`
                        : `/crimes/cases/${item.slug}`;
                      return (
                        <Link key={idx} to={linkUrl} className="quiz-recommended-card">
                          <span className="quiz-recommended-type">
                            {item.type === 'learning_module' ? 'Structured Lesson' : 'Court Case Study'}
                          </span>
                          <h5 className="quiz-recommended-title">{item.title}</h5>
                          <p className="quiz-recommended-summary">{item.summary}</p>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-primary, #302B27)', display: 'inline-block', marginTop: '8px' }}>
                            {item.reason} &rarr;
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Post-Submit Review Filters */}
              <div className="quiz-review-filter-strip" style={{ marginTop: '28px' }}>
                <h3 className="quiz-review-title">Review Your Answers &amp; Explanations</h3>
                <div className="quiz-review-pills">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`quiz-review-pill ${reviewFilter === 'all' ? 'active' : ''}`}
                  >
                    All Questions ({totalQuestions})
                  </button>
                  <button
                    onClick={() => setReviewFilter('incorrect')}
                    className={`quiz-review-pill ${reviewFilter === 'incorrect' ? 'active' : ''}`}
                  >
                    Needs Review ({resultCounts.incorrect + resultCounts.unanswered})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`quiz-review-pill ${reviewFilter === 'correct' ? 'active' : ''}`}
                  >
                    Correct ({resultCounts.correct})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* QUESTIONS RUNNER: PRE-SUBMIT FOCUS MODE VS ALL QUESTIONS LIST / REVIEW    */}
          {/* ========================================================================= */}
          {!quizSubmitted && viewMode === 'focus' ? (
            /* Focus Mode (Pre-Submit) */
            (() => {
              const q = activeQuiz.questions[currentQuestionIndex];
              const format = q.format || 'single_choice';
              const ansState = answersMap[currentQuestionIndex] || {};

              return (
                <div key={q.id || currentQuestionIndex} className="quiz-question-card">
                  {/* Question Meta Header */}
                  <div className="quiz-question-meta">
                    <span className="quiz-question-number">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <div className="quiz-question-chips">
                      <span className="quiz-chip-cognitive">{format.replace('_', ' ').toUpperCase()}</span>
                      {q.difficulty && (
                        <span className="quiz-chip-cognitive">{q.difficulty}</span>
                      )}
                      {q.relatedLawSection && (
                        <span className="quiz-chip-law">Ref: {q.relatedLawSection}</span>
                      )}
                    </div>
                  </div>

                  {/* Prompt Text */}
                  <h4 className="quiz-question-prompt">{q.questionText}</h4>

                  {/* Multi-Format Question Renderers */}
                  {renderInteractiveQuestionBody({
                    q,
                    format,
                    qIndex: currentQuestionIndex,
                    ansState,
                    handleSingleChoiceSelect,
                    handleMultipleChoiceToggle,
                    handleMatchingPairChange,
                    handleOrderingShift,
                    handleIndicatorToggle
                  })}

                  {/* Navigation Toolbar */}
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
                        <span style={{ color: 'var(--color-success, #536F61)', fontWeight: '700' }}>✓ All {totalQuestions} Answered</span>
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
                        onClick={handleSubmitClick}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '8px 22px', fontSize: '0.88rem', fontWeight: '700', backgroundColor: 'var(--color-success, #536F61)', borderColor: 'var(--color-success, #536F61)' }}
                      >
                        {loading ? 'Submitting...' : 'Submit Session'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            /* All Questions List Mode (or Post-Submit Review Mode) */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(quizSubmitted ? filteredReviewExplanations : activeQuiz.questions).map((item, idx) => {
                // If quizSubmitted, item is an explanation object; otherwise question
                let q;
                let expData = null;
                let qIndex;

                if (quizSubmitted) {
                  expData = item;
                  qIndex = activeQuiz.questions.findIndex(x => x.id?.toString() === expData.questionId?.toString());
                  q = qIndex !== -1 ? activeQuiz.questions[qIndex] : null;
                  if (!q) return null;
                } else {
                  q = item;
                  qIndex = idx;
                }

                const format = q.format || 'single_choice';
                const ansState = answersMap[qIndex] || {};
                const isCorrect = expData ? expData.isCorrect : false;

                return (
                  <div
                    key={q.id || qIndex}
                    id={`quiz-q-${qIndex}`}
                    className="quiz-question-card"
                    style={{
                      borderLeft: quizSubmitted
                        ? (isCorrect ? '5px solid var(--color-success, #536F61)' : '5px solid var(--color-accent-terracotta, #A65F45)')
                        : '1px solid var(--color-border)'
                    }}
                  >
                    {/* Header */}
                    <div className="quiz-question-meta">
                      <span className="quiz-question-number">
                        Question {qIndex + 1} of {totalQuestions}
                      </span>
                      <div className="quiz-question-chips">
                        <span className="quiz-chip-cognitive">{format.replace('_', ' ').toUpperCase()}</span>
                        {q.difficulty && (
                          <span className="quiz-chip-cognitive">{q.difficulty}</span>
                        )}
                        {(q.relatedLawSection || expData?.relatedLawSection) && (
                          <span className="quiz-chip-law">Ref: {q.relatedLawSection || expData.relatedLawSection}</span>
                        )}
                      </div>
                    </div>

                    {/* Prompt */}
                    <h4 className="quiz-question-prompt">{q.questionText}</h4>

                    {/* Pre-Submission Interactive Question Body */}
                    {!quizSubmitted && renderInteractiveQuestionBody({
                      q,
                      format,
                      qIndex,
                      ansState,
                      handleSingleChoiceSelect,
                      handleMultipleChoiceToggle,
                      handleMatchingPairChange,
                      handleOrderingShift,
                      handleIndicatorToggle
                    })}

                    {/* POST-SUBMISSION DETAILED REVIEW CARD */}
                    {quizSubmitted && expData && (
                      <div>
                        {/* Selected vs Correct Answer Highlight */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            backgroundColor: isCorrect ? 'var(--color-success-light, #EEF4F0)' : 'var(--color-danger-light, #F9ECEB)',
                            border: `1.5px solid ${isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)'}`,
                            fontSize: '0.9rem',
                            color: isCorrect ? 'var(--color-success, #536F61)' : 'var(--color-danger, #A34D43)'
                          }}>
                            <strong>Your Answer:</strong> {expData.userAnswer || 'Unanswered'}
                            {isCorrect && <span style={{ marginLeft: '8px', fontWeight: '700' }}>✓ (Correct)</span>}
                          </div>

                          {!isCorrect && (
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--color-success-light, #EEF4F0)',
                              border: '1.5px solid #86efac',
                              fontSize: '0.9rem',
                              color: 'var(--color-success, #536F61)'
                            }}>
                              <strong>Correct Answer:</strong> {expData.correctAnswer}
                            </div>
                          )}
                        </div>

                        {/* CALLOUT 1: Why Your Answer Was Incorrect (when wrong or partial) */}
                        {!isCorrect && (
                          <div className="quiz-review-incorrect-box">
                            <span className="quiz-review-incorrect-title">
                              ⚠️ Why Your Answer Was Incorrect
                            </span>
                            <p className="quiz-review-incorrect-text">
                              {expData.whyIncorrect || 'This option does not align with the statutory definitions or established security precautions.'}
                            </p>
                          </div>
                        )}

                        {/* CALLOUT 2: Why The Correct Answer Is Right */}
                        <div className="quiz-review-correct-box">
                          <span className="quiz-review-correct-title">
                            ⚖️ Why The Correct Answer Is Right
                          </span>
                          <p className="quiz-review-correct-text">
                            {expData.explanation}
                          </p>
                        </div>

                        {/* CALLOUT 3: Remember: Practical Takeaway */}
                        {expData.practicalTakeaway && (
                          <div className="quiz-review-takeaway-box">
                            <span className="quiz-review-takeaway-title">
                              💡 Remember: Practical Takeaway
                            </span>
                            <p className="quiz-review-takeaway-text">
                              {expData.practicalTakeaway}
                            </p>
                          </div>
                        )}

                        {/* Statutory Citations Strip */}
                        {Array.isArray(expData.legalReferences) && expData.legalReferences.length > 0 && (
                          <div className="quiz-citations-strip">
                            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                              Statutory Authorities:
                            </span>
                            {expData.legalReferences.map((ref, rIdx) => (
                              <span key={rIdx} className="quiz-citation-badge">
                                {ref.statute ? `${ref.statute} §${ref.section}` : ref.section || JSON.stringify(ref)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Actions for All-Questions Mode (Pre-Submit) */}
              {!quizSubmitted && (
                <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {answeredCount === totalQuestions ? (
                      <strong style={{ color: 'var(--color-success, #536F61)' }}>✓ All {totalQuestions} questions answered</strong>
                    ) : (
                      <span>{totalQuestions - answeredCount} questions remaining</span>
                    )}
                  </span>
                  <button
                    onClick={handleSubmitClick}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: '700' }}
                  >
                    {loading ? 'Submitting...' : `Submit Session (${answeredCount}/${totalQuestions})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODAL: UNANSWERED QUESTIONS CONFIRMATION DIALOG                          */}
          {/* ========================================================================= */}
          {showUnansweredModal && (
            <div className="quiz-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="unanswered-modal-title">
              <div className="quiz-modal-content">
                <h3 id="unanswered-modal-title" className="quiz-modal-title">Unanswered Questions Remaining</h3>
                <p className="quiz-modal-desc">
                  You have not answered all questions in this session. Unanswered questions will receive zero points.
                </p>

                <div className="quiz-modal-pills">
                  {activeQuiz.questions.map((_, qIdx) => {
                    if (!isQuestionAnswered(qIdx)) {
                      return (
                        <button
                          key={qIdx}
                          type="button"
                          className="quiz-modal-pill"
                          onClick={() => {
                            setShowUnansweredModal(false);
                            setCurrentQuestionIndex(qIdx);
                            if (viewMode === 'all') {
                              const el = document.getElementById(`quiz-q-${qIdx}`);
                              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                          }}
                        >
                          Jump to Question {qIdx + 1}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>

                <div className="quiz-modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowUnansweredModal(false)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    Continue Answering
                  </button>
                  <button
                    type="button"
                    onClick={handleForceSubmit}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: '0.85rem', backgroundColor: 'var(--color-accent-terracotta, #A65F45)', borderColor: 'var(--color-accent-terracotta, #A65F45)' }}
                  >
                    Submit Anyway
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// SUB-COMPONENT: RENDER INTERACTIVE QUESTION BODY (ALL 8 FORMATS)
// ===========================================================================
function renderInteractiveQuestionBody({
  q,
  format,
  qIndex,
  ansState,
  handleSingleChoiceSelect,
  handleMultipleChoiceToggle,
  handleMatchingPairChange,
  handleOrderingShift,
  handleIndicatorToggle
}) {
  const optionLetters = ['A', 'B', 'C', 'D', 'E'];

  // Format 1: single_choice, true_false, scenario_decision, legal_application
  if (['single_choice', 'true_false', 'scenario_decision', 'legal_application'].includes(format)) {
    const chosenIndex = ansState.selectedOptionIndex;
    return (
      <div className="quiz-options-group" role="radiogroup" aria-label={`Options for Question ${qIndex + 1}`}>
        {q.options?.map((opt, optIndex) => {
          const isSelected = chosenIndex === optIndex;
          const letter = optionLetters[optIndex] || String.fromCharCode(65 + optIndex);
          return (
            <div
              key={optIndex}
              onClick={() => handleSingleChoiceSelect(qIndex, optIndex)}
              className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleSingleChoiceSelect(qIndex, optIndex);
                }
              }}
            >
              <span className="quiz-option-letter">{letter}</span>
              <span className="quiz-option-text">{opt}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // Format 2: multiple_choice (Multi-select Checkboxes)
  if (format === 'multiple_choice') {
    const selectedIndices = ansState.selectedOptionIndices || [];
    return (
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-accent-terracotta, #A65F45)', marginBottom: '8px' }}>
          ☑ Select all that apply
        </div>
        <div className="quiz-options-group">
          {q.options?.map((opt, optIndex) => {
            const isSelected = selectedIndices.includes(optIndex);
            return (
              <div
                key={optIndex}
                onClick={() => handleMultipleChoiceToggle(qIndex, optIndex)}
                className={`quiz-option-card multi-select ${isSelected ? 'selected' : ''}`}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleMultipleChoiceToggle(qIndex, optIndex);
                  }
                }}
              >
                <div className="quiz-checkbox-icon">
                  {isSelected ? '✓' : ''}
                </div>
                <span className="quiz-option-text">{opt}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Format 3: matching (Left item to right item dropdown pairing)
  if (format === 'matching') {
    const pairs = ansState.selectedPairs || [];
    const rightOptions = q.rightItems || [];

    return (
      <div className="quiz-matching-container">
        <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted, #797066)', marginBottom: '4px' }}>
          Pair each statutory provision or vector with its corresponding definition:
        </div>
        {q.leftItems?.map((left, idx) => {
          const currentPair = pairs.find(p => p.left === left);
          const chosenRight = currentPair?.right || '';

          return (
            <div key={idx} className="quiz-matching-row">
              <div className="quiz-matching-left">
                <strong>{idx + 1}.</strong> {left}
              </div>
              <div>
                <select
                  value={chosenRight}
                  onChange={(e) => handleMatchingPairChange(qIndex, left, e.target.value)}
                  className="quiz-matching-select"
                >
                  <option value="">-- Choose matching definition --</option>
                  {rightOptions.map((opt, rIdx) => (
                    <option key={rIdx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Format 4: ordering (Step chronological sequence)
  if (format === 'ordering') {
    const sequence = ansState.selectedSequence || q.sequenceItems || [];
    return (
      <div className="quiz-ordering-container">
        <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted, #797066)', marginBottom: '6px' }}>
          Arrange the steps in the correct chronological order:
        </div>
        {sequence.map((itemText, idx) => (
          <div key={idx} className="quiz-ordering-item">
            <span className="quiz-ordering-rank">{idx + 1}</span>
            <span className="quiz-ordering-text">{itemText}</span>
            <div className="quiz-ordering-controls">
              <button
                type="button"
                onClick={() => handleOrderingShift(qIndex, idx, 'up')}
                disabled={idx === 0}
                className="quiz-ordering-btn"
                title="Move step up"
              >
                ▲ Up
              </button>
              <button
                type="button"
                onClick={() => handleOrderingShift(qIndex, idx, 'down')}
                disabled={idx === sequence.length - 1}
                className="quiz-ordering-btn"
                title="Move step down"
              >
                ▼ Down
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Format 5: indicator_identification (Text passage with clickable tokens)
  if (format === 'indicator_identification') {
    const selectedIds = ansState.selectedIndicatorIds || [];
    return (
      <div className="quiz-indicator-box">
        <span className="quiz-indicator-instruction">
          Inspect the passage below and click on the elements that indicate a potential threat or red flag:
        </span>
        {q.textToInspect && (
          <div className="quiz-indicator-passage">
            {q.textToInspect}
          </div>
        )}
        <div className="quiz-indicator-tokens">
          {q.indicators?.map((ind) => {
            const isFlagged = selectedIds.includes(ind.id);
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => handleIndicatorToggle(qIndex, ind.id)}
                className={`quiz-indicator-token ${isFlagged ? 'flagged' : ''}`}
              >
                {isFlagged ? '🚩 ' : '🔍 '}{ind.text}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

export default Quizzes;
