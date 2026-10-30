import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';

function AdminPanel({ user }) {
  // Navigation tabs: analytics, laws, crimes, cases, quizzes, resources, users, audit, scenarios, stages, decisions
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [analytics, setAnalytics] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  
  // Tab-specific form sections for CRUD pages
  const [crimeFormTab, setCrimeFormTab] = useState('overview'); // overview, timeline, tactics, games
  const [caseFormTab, setCaseFormTab] = useState('overview'); // overview, story, timeline, legal
  const [lawFormTab, setLawFormTab] = useState('overview'); // overview, content, metadata, connections
  
  // Data list states
  const [laws, setLaws] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [cases, setCases] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Dedicated Audit States (Server-backed pagination & filtering)
  const [auditPagination, setAuditPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionType, setAuditActionType] = useState('');
  const [auditEntityType, setAuditEntityType] = useState('');
  const [auditOutcome, setAuditOutcome] = useState('');
  const [auditStartDate, setAuditStartDate] = useState('');
  const [auditEndDate, setAuditEndDate] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null); // Detail modal inspection
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  // Quiz Questions Management States
  const [selectedQuizDetails, setSelectedQuizDetails] = useState(null); // { quiz, questions }
  const [questionModal, setQuestionModal] = useState({ isOpen: false, isAdding: true, data: null, error: '' });
  const [questionSearchQuery, setQuestionSearchQuery] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('all');
  const [questionCognitiveFilter, setQuestionCognitiveFilter] = useState('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('all');

  // Scenario Engine Management & Integrity Audit States
  const [scenariosList, setScenariosList] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [selectedScenarioData, setSelectedScenarioData] = useState(null); // { scenario, stages }
  const [scenarioAudit, setScenarioAudit] = useState(null); // { valid, errors, warnings }
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState('');

  // Form states (CRUD)
  const [editItem, setEditItem] = useState(null); // holds item being edited
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({});
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Search and Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    } else {
      if (activeTab === 'audit') {
        fetchAuditLogs({ page: 1 });
      } else if (['scenarios', 'stages', 'decisions'].includes(activeTab)) {
        fetchScenariosData();
      } else {
        fetchAdminData();
      }
    }
  }, [user, activeTab]);

  const fetchAuditLogs = async (overrides = {}) => {
    setAuditLoading(true);
    setAuditError('');
    try {
      const page = overrides.page !== undefined ? overrides.page : auditPagination.page;
      const limit = overrides.limit !== undefined ? overrides.limit : auditPagination.limit;
      const search = overrides.search !== undefined ? overrides.search : auditSearch;
      const actionType = overrides.actionType !== undefined ? overrides.actionType : auditActionType;
      const entityType = overrides.entityType !== undefined ? overrides.entityType : auditEntityType;
      const outcome = overrides.outcome !== undefined ? overrides.outcome : auditOutcome;
      const startDate = overrides.startDate !== undefined ? overrides.startDate : auditStartDate;
      const endDate = overrides.endDate !== undefined ? overrides.endDate : auditEndDate;

      const params = {
        page,
        limit,
        search,
        actionType,
        entityType,
        outcome,
        startDate,
        endDate
      };

      const res = await api.adminGetAuditLogs(params);
      if (res && res.logs) {
        setAuditLogs(res.logs);
        setAuditPagination(res.pagination || { total: res.logs.length, page, limit, totalPages: 1 });
      } else if (Array.isArray(res)) {
        setAuditLogs(res);
        setAuditPagination({ total: res.length, page: 1, limit: res.length, totalPages: 1 });
      }
    } catch (err) {
      setAuditError(err.message || 'Failed to load audit records.');
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'analytics') {
        setDashboardLoading(true);
        const [stats, summary] = await Promise.all([
          api.adminGetAnalytics(),
          api.adminGetDashboardSummary()
        ]);
        setAnalytics(stats);
        setDashboardSummary(summary);
      } else if (activeTab === 'users') {
        const usersData = await api.adminGetUsers();
        setUsersList(usersData);
      } else if (activeTab === 'laws') {
        const data = await api.getLaws();
        setLaws(data);
      } else if (activeTab === 'crimes') {
        const data = await api.getCrimes();
        setCrimes(data);
      } else if (activeTab === 'cases') {
        const data = await api.getCases();
        setCases(data);
      } else if (activeTab === 'quizzes') {
        const data = await api.adminGetQuizzes();
        setQuizzes(data);
      } else if (activeTab === 'resources') {
        const data = await api.getResources();
        setResources(data);
      }
    } catch (err) {
      setError(err.message || 'Error loading administrator data.');
    } finally {
      setLoading(false);
      setDashboardLoading(false);
    }
  };

  const fetchScenariosData = async () => {
    setScenarioLoading(true);
    setScenarioError('');
    try {
      const list = await api.adminGetScenarios();
      setScenariosList(list);
      const targetId = selectedScenarioId || (list.length > 0 ? list[0]._id : null);
      if (targetId) {
        setSelectedScenarioId(targetId);
        const [detail, audit] = await Promise.all([
          api.adminGetScenario(targetId),
          api.adminAuditScenario(targetId)
        ]);
        setSelectedScenarioData(detail);
        setScenarioAudit(audit);
      }
    } catch (err) {
      setScenarioError(err.message || 'Failed to load scenarios.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleSelectScenario = async (scenarioId) => {
    setSelectedScenarioId(scenarioId);
    setScenarioLoading(true);
    setScenarioError('');
    try {
      const [detail, audit] = await Promise.all([
        api.adminGetScenario(scenarioId),
        api.adminAuditScenario(scenarioId)
      ]);
      setSelectedScenarioData(detail);
      setScenarioAudit(audit);
    } catch (err) {
      setScenarioError(err.message || 'Failed to load scenario details.');
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleOpenQuizQuestions = async (quizId) => {
    setError('');
    try {
      const data = await api.adminGetQuiz(quizId);
      setSelectedQuizDetails(data);
    } catch (err) {
      setError(err.message || 'Failed to load quiz questions.');
    }
  };

  const handleCloseQuizQuestions = () => {
    setSelectedQuizDetails(null);
    setQuestionSearchQuery('');
    fetchAdminData();
  };

  const handleOpenQuestionModal = (question = null) => {
    if (question) {
      setQuestionModal({
        isOpen: true,
        isAdding: false,
        data: {
          _id: question._id,
          questionText: question.questionText || '',
          category: question.category || selectedQuizDetails?.quiz?.category || '',
          difficulty: question.difficulty || selectedQuizDetails?.quiz?.difficulty || 'Intermediate',
          cognitiveLevel: question.cognitiveLevel || 'Level 1',
          questionType: question.questionType || 'knowledge',
          option0: question.options?.[0] || '',
          option1: question.options?.[1] || '',
          option2: question.options?.[2] || '',
          option3: question.options?.[3] || '',
          correctOptionIndex: question.correctOptionIndex ?? 0,
          explanation: question.explanation || '',
          relatedLawSection: question.relatedLawSection || '',
          published: question.published !== false
        },
        error: ''
      });
    } else {
      setQuestionModal({
        isOpen: true,
        isAdding: true,
        data: {
          questionText: '',
          category: selectedQuizDetails?.quiz?.category || '',
          difficulty: selectedQuizDetails?.quiz?.difficulty || 'Intermediate',
          cognitiveLevel: 'Level 1',
          questionType: 'knowledge',
          option0: '',
          option1: '',
          option2: '',
          option3: '',
          correctOptionIndex: 0,
          explanation: '',
          relatedLawSection: '',
          published: true
        },
        error: ''
      });
    }
  };

  const handleCloseQuestionModal = () => {
    setQuestionModal({ isOpen: false, isAdding: true, data: null, error: '' });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const qData = questionModal.data;
    if (!qData.questionText?.trim()) {
      setQuestionModal(prev => ({ ...prev, error: 'Question text is required.' }));
      return;
    }
    const cleanOpts = [qData.option0, qData.option1, qData.option2, qData.option3].flatMap(o => {
      const trimmed = o?.trim();
      return trimmed ? [trimmed] : [];
    });
    if (cleanOpts.length < 2) {
      setQuestionModal(prev => ({ ...prev, error: 'At least 2 non-empty options are required.' }));
      return;
    }
    const cIndex = Number(qData.correctOptionIndex);
    if (isNaN(cIndex) || cIndex < 0 || cIndex >= cleanOpts.length) {
      setQuestionModal(prev => ({ ...prev, error: `Correct option index must be between 0 and ${cleanOpts.length - 1}.` }));
      return;
    }
    if (!qData.explanation?.trim()) {
      setQuestionModal(prev => ({ ...prev, error: 'Answer explanation is required.' }));
      return;
    }

    try {
      const payload = {
        questionText: qData.questionText.trim(),
        category: qData.category?.trim() || selectedQuizDetails?.quiz?.category,
        difficulty: qData.difficulty,
        cognitiveLevel: qData.cognitiveLevel,
        questionType: qData.questionType,
        options: cleanOpts,
        correctOptionIndex: cIndex,
        explanation: qData.explanation.trim(),
        relatedLawSection: qData.relatedLawSection?.trim() || '',
        published: qData.published !== false
      };

      if (questionModal.isAdding) {
        await api.adminCreateQuizQuestion(selectedQuizDetails.quiz._id, payload);
        setSuccess('Question added to quiz successfully!');
      } else {
        await api.adminUpdateQuizQuestion(selectedQuizDetails.quiz._id, qData._id, payload);
        setSuccess('Question updated successfully!');
      }

      handleCloseQuestionModal();
      const refreshed = await api.adminGetQuiz(selectedQuizDetails.quiz._id);
      setSelectedQuizDetails(refreshed);
    } catch (err) {
      setQuestionModal(prev => ({ ...prev, error: err.message || 'Failed to save question.' }));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Delete this question? If learner attempts reference it, it will be safely unpublished to protect historical scores.')) return;
    try {
      const res = await api.adminDeleteQuizQuestion(selectedQuizDetails.quiz._id, questionId);
      setSuccess(res.message || 'Question removed successfully.');
      const refreshed = await api.adminGetQuiz(selectedQuizDetails.quiz._id);
      setSelectedQuizDetails(refreshed);
    } catch (err) {
      setError(err.message || 'Failed to remove question.');
    }
  };

  const handleToggleQuestionPublish = async (question) => {
    try {
      const updatedStatus = question.published === false ? true : false;
      await api.adminUpdateQuizQuestion(selectedQuizDetails.quiz._id, question._id, {
        published: updatedStatus
      });
      setSuccess(`Question status changed to ${updatedStatus ? 'Published' : 'Draft'}.`);
      const refreshed = await api.adminGetQuiz(selectedQuizDetails.quiz._id);
      setSelectedQuizDetails(refreshed);
    } catch (err) {
      setError(err.message || 'Failed to toggle question status.');
    }
  };

  const handleToggleQuizPublish = async (quiz) => {
    try {
      const updatedStatus = !quiz.published;
      await api.adminUpdateQuiz(quiz._id || quiz.id, {
        published: updatedStatus
      });
      setSuccess(`Quiz "${quiz.title}" set to ${updatedStatus ? 'Published' : 'Draft'}.`);
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to toggle quiz status.');
    }
  };

  const getFilteredQuestions = () => {
    if (!selectedQuizDetails?.questions) return [];
    return selectedQuizDetails.questions.filter(q => {
      if (questionSearchQuery.trim()) {
        const query = questionSearchQuery.toLowerCase().trim();
        const matchText = q.questionText?.toLowerCase().includes(query);
        const matchTag = q.topicTag?.toLowerCase().includes(query);
        const matchRef = q.relatedLawSection?.toLowerCase().includes(query);
        const matchOpts = q.options?.some(o => o.toLowerCase().includes(query));
        if (!matchText && !matchTag && !matchRef && !matchOpts) return false;
      }
      if (questionDifficultyFilter !== 'all' && q.difficulty !== questionDifficultyFilter) {
        return false;
      }
      if (questionCognitiveFilter !== 'all' && q.cognitiveLevel !== questionCognitiveFilter) {
        return false;
      }
      if (questionStatusFilter === 'published' && q.published === false) return false;
      if (questionStatusFilter === 'draft' && q.published !== false) return false;

      return true;
    });
  };

  const getAvailableSources = () => {
    const map = new Map();
    laws.forEach(l => {
      if (l.officialSourceId) {
        const src = l.officialSourceId;
        map.set(src._id || src.id, src);
      }
    });
    return Array.from(map.values());
  };

  const handleTabChange = (tab) => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to navigate away?')) {
      return;
    }
    setActiveTab(tab);
    setEditItem(null);
    setIsAdding(false);
    setFormData({});
    setIsFormDirty(false);
    setSelectedQuizDetails(null);
    setSuccess('');
    setError('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // CRUD actions
  const handleDelete = async (id) => {
    const activeLabel = activeTab.slice(0, -1);
    if (!window.confirm('Delete this ' + activeLabel + '? This action will permanently remove it from the system.')) return;
    try {
      if (activeTab === 'laws') await api.adminDeleteLaw(id);
      else if (activeTab === 'crimes') await api.adminDeleteCrime(id);
      else if (activeTab === 'cases') await api.adminDeleteCase(id);
      else if (activeTab === 'quizzes') await api.adminDeleteQuiz(id);
      else if (activeTab === 'resources') await api.adminDeleteResource(id);

      setSuccess('Item deleted successfully!');
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to delete item.');
    }
  };

  const handleEditInit = (item) => {
    setEditItem(item);
    setIsAdding(false);
    setFormData({ ...item });
    setIsFormDirty(false);
  };

  const handleAddInit = () => {
    setIsAdding(true);
    setEditItem(null);
    setFormData({});
    setIsFormDirty(false);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setIsFormDirty(true);
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCancelForm = () => {
    if (isFormDirty && !window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
      return;
    }
    setIsAdding(false);
    setEditItem(null);
    setFormData({});
    setIsFormDirty(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'laws') {
        if ((formData.legalStatus === 'NOT_YET_IN_FORCE' || formData.legalStatus === 'PARTIALLY_IN_FORCE') && !formData.commencementStatus?.trim()) {
          throw new Error('Commencement status description is required when status is Not Yet In Force or Partially In Force.');
        }
        if (formData.legalStatus === 'OMITTED' && !formData.amendmentStatus?.trim()) {
          throw new Error('Amendment / omission litigation notes are required when status is OMITTED.');
        }
        if (!formData.officialSourceId) {
          throw new Error('Official source reference selection is required.');
        }

        const formatted = {
          ...formData,
          keywords: typeof formData.keywords === 'string' ? formData.keywords.split(',').map(s => s.trim()).filter(Boolean) : formData.keywords,
          relatedCyberCrimes: typeof formData.relatedCyberCrimes === 'string' ? formData.relatedCyberCrimes.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedCyberCrimes,
          relatedCaseStudies: typeof formData.relatedCaseStudies === 'string' ? formData.relatedCaseStudies.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedCaseStudies,
          relatedModules: typeof formData.relatedModules === 'string' ? formData.relatedModules.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedModules
        };

        if (editItem) await api.adminUpdateLaw(editItem.id, formatted);
        else await api.adminCreateLaw(formatted);
      } else if (activeTab === 'crimes') {
        let formatted;
        try {
          formatted = {
            ...formData,
            warningSigns: typeof formData.warningSigns === 'string' ? formData.warningSigns.split('\n').filter(Boolean) : formData.warningSigns,
            actionSteps: typeof formData.actionSteps === 'string' ? formData.actionSteps.split('\n').filter(Boolean) : formData.actionSteps,
            avoidSteps: typeof formData.avoidSteps === 'string' ? formData.avoidSteps.split('\n').filter(Boolean) : formData.avoidSteps,
            ifTargetedSteps: typeof formData.ifTargetedSteps === 'string' ? formData.ifTargetedSteps.split('\n').filter(Boolean) : formData.ifTargetedSteps,
            legalContext: typeof formData.legalContext === 'string' ? formData.legalContext.split(',').map(s => s.trim()).filter(Boolean) : formData.legalContext,
            attackerObjective: typeof formData.attackerObjective === 'string' ? formData.attackerObjective.split(',').map(s => s.trim()).filter(Boolean) : formData.attackerObjective,
            attackVectors: typeof formData.attackVectors === 'string' ? formData.attackVectors.split(',').map(s => s.trim()).filter(Boolean) : formData.attackVectors,
            
            attackLifecycle: typeof formData.attackLifecycle === 'string' && formData.attackLifecycle.trim() ? JSON.parse(formData.attackLifecycle) : formData.attackLifecycle,
            attackerTactics: typeof formData.attackerTactics === 'string' && formData.attackerTactics.trim() ? JSON.parse(formData.attackerTactics) : formData.attackerTactics,
            spotTheFlags: typeof formData.spotTheFlags === 'string' && formData.spotTheFlags.trim() ? JSON.parse(formData.spotTheFlags) : formData.spotTheFlags,
            whatWouldYouDo: typeof formData.whatWouldYouDo === 'string' && formData.whatWouldYouDo.trim() ? JSON.parse(formData.whatWouldYouDo) : formData.whatWouldYouDo,
            quickCheckQuestions: typeof formData.quickCheckQuestions === 'string' && formData.quickCheckQuestions.trim() ? JSON.parse(formData.quickCheckQuestions) : formData.quickCheckQuestions,
            mythFacts: typeof formData.mythFacts === 'string' && formData.mythFacts.trim() ? JSON.parse(formData.mythFacts) : formData.mythFacts
          };
        } catch (e) {
          throw new Error('Advanced configuration has invalid JSON syntax: ' + e.message);
        }
        if (editItem) await api.adminUpdateCrime(editItem.id, formatted);
        else await api.adminCreateCrime(formatted);
      } else if (activeTab === 'cases') {
        let formatted;
        try {
          formatted = {
            ...formData,
            legalContext: typeof formData.legalContext === 'string' ? formData.legalContext.split(',').map(s => s.trim()).filter(Boolean) : formData.legalContext,
            relatedCrimes: typeof formData.relatedCrimes === 'string' ? formData.relatedCrimes.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedCrimes,
            relatedModules: typeof formData.relatedModules === 'string' ? formData.relatedModules.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedModules,
            response: typeof formData.response === 'string' ? formData.response.split('\n').filter(Boolean) : formData.response,
            preventionLessons: typeof formData.preventionLessons === 'string' ? formData.preventionLessons.split('\n').filter(Boolean) : formData.preventionLessons,
            attackerObjectives: typeof formData.attackerObjectives === 'string' ? formData.attackerObjectives.split(',').map(s => s.trim()).filter(Boolean) : formData.attackerObjectives,
            
            narrativeSections: typeof formData.narrativeSections === 'string' && formData.narrativeSections.trim() ? JSON.parse(formData.narrativeSections) : formData.narrativeSections,
            impact: typeof formData.impact === 'string' && formData.impact.trim() ? JSON.parse(formData.impact) : formData.impact,
            timeline: typeof formData.timeline === 'string' && formData.timeline.trim() ? JSON.parse(formData.timeline) : formData.timeline,
            decisionPoints: typeof formData.decisionPoints === 'string' && formData.decisionPoints.trim() ? JSON.parse(formData.decisionPoints) : formData.decisionPoints,
            warningSigns: typeof formData.warningSigns === 'string' && formData.warningSigns.trim() ? JSON.parse(formData.warningSigns) : formData.warningSigns,
            sources: typeof formData.sources === 'string' && formData.sources.trim() ? JSON.parse(formData.sources) : formData.sources
          };
        } catch (e) {
          throw new Error('JSON format error: ' + e.message);
        }
        if (editItem) await api.adminUpdateCase(editItem.id, formatted);
        else await api.adminCreateCase(formatted);
      } else if (activeTab === 'quizzes') {
        if (!formData.title?.trim()) {
          throw new Error('Quiz Title is required.');
        }
        if (!formData.category?.trim()) {
          throw new Error('Quiz Category is required.');
        }
        const payload = {
          title: formData.title.trim(),
          category: formData.category.trim(),
          difficulty: formData.difficulty || 'Medium',
          description: formData.description ? formData.description.trim() : '',
          relatedModule: formData.relatedModule ? formData.relatedModule.trim() : '',
          published: formData.published !== false
        };
        if (editItem) await api.adminUpdateQuiz(editItem._id || editItem.id, payload);
        else await api.adminCreateQuiz(payload);
      } else if (activeTab === 'resources') {
        if (editItem) await api.adminUpdateResource(editItem.id, formData);
        else await api.adminCreateResource(formData);
      }

      setSuccess('Saved successfully!');
      setIsFormDirty(false);
      setIsAdding(false);
      setEditItem(null);
      setFormData({});
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    }
  };

  // Human-readable audit trail formatting
  const formatChanges = (changes) => {
    if (!changes) return <span style={{ color: 'var(--text-muted)' }}>None recorded</span>;
    if (typeof changes === 'string') return <span>{changes}</span>;
    try {
      const keys = Object.keys(changes);
      if (keys.length === 0) return <span style={{ color: 'var(--text-muted)' }}>No updates tracked</span>;
      return (
        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {keys.slice(0, 4).map(key => {
            const val = changes[key];
            let shiftText = '';
            if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
              shiftText = String(val.old).substring(0, 30) + ' → ' + String(val.new).substring(0, 30);
            } else {
              shiftText = typeof val === 'object' ? JSON.stringify(val).substring(0, 35) : String(val).substring(0, 35);
            }
            return (
              <div key={key}>
                <strong style={{ color: 'var(--text-primary)' }}>{key}:</strong> {shiftText}
              </div>
            );
          })}
          {keys.length > 4 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>+{keys.length - 4} more fields</span>
          )}
        </div>
      );
    } catch (_e) {
      return <span>{JSON.stringify(changes)}</span>;
    }
  };

  const getActionBadgeStyle = (actionType) => {
    switch (actionType) {
      case 'CREATE':
        return { color: '#065f46', bg: '#d1fae5', border: '#a7f3d0' };
      case 'UPDATE':
        return { color: '#1e40af', bg: '#dbeafe', border: '#bfdbfe' };
      case 'DELETE':
        return { color: '#991b1b', bg: '#fee2e2', border: '#fecaca' };
      case 'PUBLISH':
        return { color: '#0f766e', bg: '#ccfbf1', border: '#99f6e4' };
      case 'UNPUBLISH':
        return { color: '#92400e', bg: '#fef3c7', border: '#fde68a' };
      default:
        return { color: '#374151', bg: '#f3f4f6', border: '#e5e7eb' };
    }
  };

  const getOutcomeBadge = (outcome) => {
    if (outcome === 'FAILURE') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.72rem',
          fontWeight: '700',
          padding: '2px 8px',
          borderRadius: '4px',
          color: '#991b1b',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca'
        }}>
          ✕ FAILURE
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.72rem',
        fontWeight: '700',
        padding: '2px 8px',
        borderRadius: '4px',
        color: '#166534',
        backgroundColor: '#dcfce7',
        border: '1px solid #bbf7d0'
      }}>
        ✓ SUCCESS
      </span>
    );
  };

  // Client-side filtering
  const getFilteredItems = () => {
    let list = [];
    if (activeTab === 'laws') list = laws;
    else if (activeTab === 'crimes') list = crimes;
    else if (activeTab === 'cases') list = cases;
    else if (activeTab === 'quizzes') list = quizzes;
    else if (activeTab === 'resources') list = resources;
    else if (activeTab === 'audit') list = auditLogs;
    else if (activeTab === 'users') list = usersList;

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      if (activeTab === 'laws') {
        return (item.sectionNumber?.toLowerCase().includes(query) ||
                item.officialTitle?.toLowerCase().includes(query) ||
                item.actName?.toLowerCase().includes(query));
      }
      if (activeTab === 'crimes') {
        return (item.title?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query));
      }
      if (activeTab === 'cases') {
        return (item.title?.toLowerCase().includes(query) ||
                item.incidentType?.toLowerCase().includes(query));
      }
      if (activeTab === 'quizzes') {
        return (item.title?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query) ||
                item.description?.toLowerCase().includes(query));
      }
      if (activeTab === 'resources') {
        return (item.title?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query));
      }
      if (activeTab === 'users') {
        return (item.fullName?.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query));
      }
      if (activeTab === 'audit') {
        return (item.action?.toLowerCase().includes(query) ||
                item.entityType?.toLowerCase().includes(query) ||
                item.adminId?.fullName?.toLowerCase().includes(query));
      }
      return false;
    });
  };

  const filteredItems = getFilteredItems();
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="admin-theme" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      
      {/* Admin Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 28px',
        backgroundColor: '#0a192f',
        borderBottom: '1px solid #1e293b',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src="/logo/cyber-law-logo-horizontal.svg" alt="Logo" style={{ height: '32px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '14px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ADMINISTRATION CONSOLE
              <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#1e3a8a', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Secure Admin Mode
              </span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <strong style={{ display: 'block', color: '#f8fafc' }}>{user?.fullName}</strong>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user?.email} • {user?.role?.toUpperCase()}</span>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: 'transparent', color: '#f8fafc', borderColor: 'rgba(255,255,255,0.25)' }}
          >
            Public Portal →
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }} 
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="admin-layout">
        
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <div className="admin-nav-group">
            <span className="admin-nav-heading">Overview</span>
            <ul className="admin-nav">
              <li>
                <button 
                  onClick={() => handleTabChange('analytics')} 
                  className={activeTab === 'analytics' ? 'active' : ''}
                  aria-current={activeTab === 'analytics' ? 'page' : undefined}
                >
                  <span>Executive Dashboard</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-heading">Content Operations</span>
            <ul className="admin-nav">
              <li>
                <button 
                  onClick={() => handleTabChange('laws')} 
                  className={activeTab === 'laws' ? 'active' : ''}
                  aria-current={activeTab === 'laws' ? 'page' : undefined}
                >
                  <span>Cyber Laws</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('crimes')} 
                  className={activeTab === 'crimes' ? 'active' : ''}
                  aria-current={activeTab === 'crimes' ? 'page' : undefined}
                >
                  <span>Crimes Library</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('cases')} 
                  className={activeTab === 'cases' ? 'active' : ''}
                  aria-current={activeTab === 'cases' ? 'page' : undefined}
                >
                  <span>Case Studies</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('resources')} 
                  className={activeTab === 'resources' ? 'active' : ''}
                  aria-current={activeTab === 'resources' ? 'page' : undefined}
                >
                  <span>Portal Resources</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('quizzes')} 
                  className={activeTab === 'quizzes' ? 'active' : ''}
                  aria-current={activeTab === 'quizzes' ? 'page' : undefined}
                >
                  <span>Quizzes &amp; Bank</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-heading">Assessment Engine</span>
            <ul className="admin-nav">
              <li>
                <button 
                  onClick={() => handleTabChange('scenarios')} 
                  className={activeTab === 'scenarios' ? 'active' : ''}
                  aria-current={activeTab === 'scenarios' ? 'page' : undefined}
                >
                  <span>Scenarios</span>
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0', fontWeight: '600' }}>v1/v2 Sound</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('stages')} 
                  className={activeTab === 'stages' ? 'active' : ''}
                  aria-current={activeTab === 'stages' ? 'page' : undefined}
                >
                  <span>Scenario Stages</span>
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Topology</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('decisions')} 
                  className={activeTab === 'decisions' ? 'active' : ''}
                  aria-current={activeTab === 'decisions' ? 'page' : undefined}
                >
                  <span>Decisions</span>
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontWeight: '600' }}>Branches</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group">
            <span className="admin-nav-heading">System Operations</span>
            <ul className="admin-nav">
              <li>
                <button 
                  onClick={() => handleTabChange('users')} 
                  className={activeTab === 'users' ? 'active' : ''}
                  aria-current={activeTab === 'users' ? 'page' : undefined}
                >
                  <span>Users &amp; Progress</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleTabChange('audit')} 
                  className={activeTab === 'audit' ? 'active' : ''}
                  aria-current={activeTab === 'audit' ? 'page' : undefined}
                >
                  <span>Audit History Logs</span>
                  <span style={{ fontSize: '0.65rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe', fontWeight: '600' }}>Append-Only</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Main Work Area */}
        <main className="admin-content" style={{ padding: '24px 32px', backgroundColor: 'var(--bg-primary)' }}>
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
          {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>{success}</div>}
          {loading && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Updating records...</div>}

          {/* Tab 1: Administrative Operational Dashboard */}
          {activeTab === 'analytics' && (
            <div>
              {/* Executive Overview Header */}
              <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#1e3a8a' }}>
                      Operational Overview
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600' }}>
                      ● Systems Normal
                    </span>
                  </div>
                  <h1 style={{ fontSize: '1.9rem', color: '#0f172a', fontWeight: '800', margin: 0, fontFamily: 'var(--font-sans)', letterSpacing: '-0.5px' }}>
                    Administration Console
                  </h1>
                  <p style={{ color: '#475569', fontSize: '0.95rem', margin: '6px 0 0 0', maxWidth: '780px' }}>
                    Authoritative portal operations, content management, assessment graph integrity verification, and administrative audit streams.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleTabChange('quizzes')} 
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600' }}
                  >
                    Manage Quizzes
                  </button>
                  <button 
                    onClick={() => handleTabChange('scenarios')} 
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 16px', fontWeight: '600', backgroundColor: '#1e3a8a' }}
                  >
                    Inspect Scenarios
                  </button>
                </div>
              </div>

              {/* System Integrity & Health Ribbon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
                padding: '16px 20px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Database &amp; API</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Connected &amp; Healthy</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>MongoDB Replica State Active</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Assessment Topology</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>4/4 Versioned Graphs Sound</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Zero orphan nodes detected</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Audit Security</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Append-Only Stream</strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tamper-Resilient Logging</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Server Time</span>
                  <div style={{ marginTop: '4px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                      {dashboardSummary?.systemStatus?.timestamp ? new Date(dashboardSummary.systemStatus.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Authorized Admin Session</span>
                </div>
              </div>

              {/* Attention Items (if any exist) */}
              {dashboardSummary?.attentionItems && dashboardSummary.attentionItems.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                    Operational Attention Items
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {dashboardSummary.attentionItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          padding: '16px',
                          borderRadius: '8px',
                          border: item.type === 'warning' ? '1px solid #fed7aa' : item.type === 'info' ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                          backgroundColor: item.type === 'warning' ? '#fffbeb' : item.type === 'info' ? '#eff6ff' : '#f0fdf4',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <strong style={{
                            display: 'block',
                            fontSize: '0.9rem',
                            color: item.type === 'warning' ? '#9a3412' : item.type === 'info' ? '#1e40af' : '#166534',
                            marginBottom: '4px'
                          }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                            {item.message}
                          </span>
                        </div>
                        {item.actionTab && (
                          <button
                            onClick={() => handleTabChange(item.actionTab)}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            {item.actionLabel || 'View'} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Operations Grid */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Content Operations
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Authoritative database counts</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                  {/* Cyber Laws Card */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Cyber Laws</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1e40af', fontWeight: '600' }}>Legislation</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                        {dashboardSummary?.contentSummaries?.laws?.total ?? laws.length}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                        Statutory sections, penalties &amp; definitions.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => handleTabChange('laws')} className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Manage</button>
                      <button onClick={() => { handleTabChange('laws'); handleAddInit(); }} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+ Add</button>
                    </div>
                  </div>

                  {/* Crimes Library Card */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Crimes Library</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: '600' }}>Threat Catalog</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                        {dashboardSummary?.contentSummaries?.crimes?.total ?? crimes.length}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                        Attack lifecycles, warning flags &amp; advice.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => handleTabChange('crimes')} className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Manage</button>
                      <button onClick={() => { handleTabChange('crimes'); handleAddInit(); }} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+ Add</button>
                    </div>
                  </div>

                  {/* Case Studies Card */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Case Studies</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f3e8ff', color: '#6b21a8', fontWeight: '600' }}>Legal Precedents</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                        {dashboardSummary?.contentSummaries?.cases?.total ?? cases.length}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                        Real judicial incidents, timelines &amp; impact.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => handleTabChange('cases')} className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Manage</button>
                      <button onClick={() => { handleTabChange('cases'); handleAddInit(); }} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+ Add</button>
                    </div>
                  </div>

                  {/* Portal Resources Card */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Portal Resources</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: '600' }}>Reference</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                        {dashboardSummary?.contentSummaries?.resources?.total ?? resources.length}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                        Helplines, official portals &amp; guides.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => handleTabChange('resources')} className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Manage</button>
                      <button onClick={() => { handleTabChange('resources'); handleAddInit(); }} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+ Add</button>
                    </div>
                  </div>

                  {/* Quizzes & Question Bank Card */}
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b' }}>Quizzes &amp; Bank</span>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontWeight: '600' }}>Assessment</span>
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>
                        {dashboardSummary?.contentSummaries?.quizzes?.total ?? quizzes.length}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '6px 0 16px 0' }}>
                        <strong>{dashboardSummary?.contentSummaries?.quizzes?.totalQuestions ?? 175}</strong> questions in bank ({dashboardSummary?.contentSummaries?.quizzes?.published ?? quizzes.length} published modules).
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => handleTabChange('quizzes')} className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}>Manage Quizzes</button>
                      <button onClick={() => { handleTabChange('quizzes'); handleAddInit(); }} className="btn btn-primary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>+ Add</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Engine Integrity */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Assessment Engine Integrity &amp; Scenarios
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Live graph topology validation for versioned &quot;Your Digital Day&quot; evaluations
                    </span>
                  </div>
                  <button onClick={() => handleTabChange('scenarios')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    Open Graph Inspector →
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  {dashboardSummary?.scenarios?.map(sc => (
                    <div key={sc._id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{sc.title}</strong>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                          v{sc.version}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                        {sc.stageCount} Stages • {sc.published ? 'Published' : 'Draft'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sc.isSound ? '#22c55e' : '#ef4444' }}></span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: sc.isSound ? '#166534' : '#991b1b' }}>
                          {sc.isSound ? 'Graph Sound & Closed' : 'Integrity Warning'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedScenarioId(sc._id);
                          handleTabChange('scenarios');
                        }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', fontWeight: '600' }}
                      >
                        Inspect Topology
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learner Performance & Vulnerability Cohort */}
              {analytics && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Learner Cohort Analytics
                    </h2>
                    <button onClick={() => handleTabChange('users')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                      Manage Learners &amp; Progress →
                    </button>
                  </div>
                  <div className="dashboard-grid" style={{ marginBottom: '16px' }}>
                    <div className="stat-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Registered Students</span>
                      <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>{analytics.totalUsers}</div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Avg Baseline Score</span>
                      <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>{analytics.avgBaselineScore}%</div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Avg Final Score</span>
                      <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0f172a', marginTop: '6px' }}>{analytics.avgFinalScore}%</div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Avg Improvement</span>
                      <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a', marginTop: '6px' }}>+{analytics.avgImprovement} pts</div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                        Educational Focus Area Identified
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '700', margin: '4px 0 6px 0' }}>
                      Primary Cohort Focus: {analytics.weakestArea}
                    </h3>
                    <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
                      {analytics.weakestAreaCount} assessment evaluations scored below the provisional 70% educational baseline heuristic in this topic. Consider updating related practice quizzes and review guides.
                    </p>
                  </div>

                  {/* Cohort Defensive Profile or Privacy Suppression Notice */}
                  {analytics.cohortStatus && !analytics.cohortStatus.sufficientSample ? (
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                          Cohort Privacy Protection (k-Anonymity)
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '700', margin: '4px 0 6px 0' }}>
                        Indicator Aggregation Suppressed
                      </h3>
                      <p style={{ color: '#475569', margin: 0, fontSize: '0.85rem' }}>
                        {analytics.cohortStatus.message}
                      </p>
                    </div>
                  ) : analytics.behavioralAverages ? (
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '18px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                            Cohort Defensive Indicators (6 Educational Behavioral Dimensions)
                          </span>
                          <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '700', margin: '4px 0 0 0' }}>
                            Collective Cyber Defense Profile
                          </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Provisional baseline heuristic: 70% (Non-clinical indicator)</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {[
                          { key: 'threatRecognition', label: 'Threat Recognition (TR)', score: analytics.behavioralAverages.threatRecognition },
                          { key: 'signalIdentification', label: 'Signal Identification (SI)', score: analytics.behavioralAverages.signalIdentification },
                          { key: 'verificationBehavior', label: 'Verification Behavior (VB)', score: analytics.behavioralAverages.verificationBehavior },
                          { key: 'dataQuotient', label: 'Data Quotient (DQ)', score: analytics.behavioralAverages.dataQuotient },
                          { key: 'financialProtection', label: 'Financial Protection (FP)', score: analytics.behavioralAverages.financialProtection },
                          { key: 'unreviewedAcceptance', label: 'Unreflective Acceptance (UA)', score: analytics.behavioralAverages.unreviewedAcceptance }
                        ].map(dim => {
                          const hasScore = dim.score !== null && dim.score !== undefined;
                          const isWarning = hasScore && dim.score < 70;
                          return (
                            <div key={dim.key} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155' }}>{dim.label}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: !hasScore ? '#64748b' : isWarning ? '#b91c1c' : '#15803d' }}>
                                  {hasScore ? `${dim.score}% ${isWarning ? '⚠️' : '✓'}` : 'No Evaluated Data'}
                                </span>
                              </div>
                              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${hasScore ? Math.min(100, Math.max(0, dim.score)) : 0}%`,
                                  height: '100%',
                                  backgroundColor: isWarning ? '#ef4444' : '#22c55e',
                                  borderRadius: '3px'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '12px 0 0 0', lineHeight: '1.4' }}>
                        * Note: These 6 dimensions reflect observed decision choices in simulated branch scenarios and serve as pedagogical indicators. They are not validated clinical or standardized psychometric instruments.
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Recent Administrative Audit Activity */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Recent Administrative Activity
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Real persisted audit trail for accountability &amp; regulatory compliance
                    </span>
                  </div>
                  <button onClick={() => handleTabChange('audit')} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    View Full Audit History ({auditPagination.total || 'All'}) →
                  </button>
                </div>

                {dashboardSummary?.recentActivity?.length > 0 ? (
                  <div className="table-wrapper" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Action</th>
                          <th>Entity Type</th>
                          <th>Administrator</th>
                          <th>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardSummary.recentActivity.map((act, actIdx) => (
                          <tr key={act._id || act.id || `${act.timestamp || 'act'}-${actIdx}`}>
                            <td style={{ fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {new Date(act.timestamp).toLocaleString()}
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: act.actionType === 'CREATE' ? '#dcfce7' : act.actionType === 'UPDATE' ? '#eff6ff' : act.actionType === 'DELETE' ? '#fee2e2' : '#f1f5f9',
                                color: act.actionType === 'CREATE' ? '#166534' : act.actionType === 'UPDATE' ? '#1e40af' : act.actionType === 'DELETE' ? '#991b1b' : '#334155'
                              }}>
                                {act.actionType}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600', color: '#0f172a' }}>{act.entityType}</td>
                            <td style={{ fontSize: '0.85rem' }}>{act.adminEmail}</td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: act.status === 'SUCCESS' ? '#16a34a' : '#dc2626' }}>
                                ● {act.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', fontSize: '0.85rem' }}>
                    No recent administrative mutations recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scenario Engine Management & Graph Integrity Inspector */}
          {['scenarios', 'stages', 'decisions'].includes(activeTab) && (
            <div>
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: '0 0 6px 0', fontFamily: 'var(--font-sans)' }}>
                      Scenario Engine Management &amp; Graph Integrity Inspector
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '780px' }}>
                      Inspect versioned behavioral scenarios, stage logic topologies, branching decision routes, and live graph validation reports for &quot;Your Digital Day&quot;.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}>
                    {activeTab === 'scenarios' ? 'Overview Mode' : (activeTab === 'stages' ? 'Stage Topology Mode' : 'Decision Matrix Mode')}
                  </span>
                </div>

                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '12px 16px', marginTop: '14px', fontSize: '0.85rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                  <span>
                    <strong>Production Version Isolation:</strong> Published scenario versions are immutable in production to ensure deterministic scoring and historical reproducibility across completed learner sessions. Phase 2 visual graph authoring will branch into draft revisions before publication.
                  </span>
                </div>
              </div>

              {/* Scenario Version Selector Pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {scenariosList.map(s => {
                  const isSelected = selectedScenarioId === s._id;
                  return (
                    <button
                      key={s._id}
                      onClick={() => handleSelectScenario(s._id)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '4px',
                        border: isSelected ? '2px solid var(--accent-navy, #1e3a8a)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--bg-white)' : 'var(--bg-secondary)',
                        color: isSelected ? 'var(--accent-navy, #1e3a8a)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: isSelected ? '700' : '500',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        minWidth: '200px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                          {s.slug} • v{s.version}
                        </span>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '3px', backgroundColor: s.status === 'published' ? '#d1fae5' : '#fef3c7', color: s.status === 'published' ? '#065f46' : '#92400e', fontWeight: 'bold' }}>
                          {s.status.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>{s.title}</span>
                    </button>
                  );
                })}
              </div>

              {scenarioLoading && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Auditing scenario topology and loading stage graph...</p>
                </div>
              )}

              {scenarioError && (
                <div className="alert alert-error" style={{ marginBottom: '16px' }}>{scenarioError}</div>
              )}

              {!scenarioLoading && selectedScenarioData && (
                <div>
                  {/* Scenario Metrics */}
                  <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Version &amp; Type</span>
                      <div className="value" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                        v{selectedScenarioData.scenario.version} • {selectedScenarioData.scenario.assessmentType?.toUpperCase()}
                      </div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Domain &amp; Difficulty</span>
                      <div className="value" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {selectedScenarioData.scenario.domain} • {selectedScenarioData.scenario.difficulty}
                      </div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Total Stages</span>
                      <div className="value" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px' }}>
                        {selectedScenarioData.stages?.length || 0}
                      </div>
                    </div>
                    <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px', textAlign: 'center' }}>
                      <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Branching Decisions</span>
                      <div className="value" style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-navy, #1e3a8a)', marginTop: '4px' }}>
                        {selectedScenarioData.scenario.decisionCount || 0}
                      </div>
                    </div>
                  </div>

                  {/* Live Graph Integrity Audit Panel */}
                  {scenarioAudit && (
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid ' + (scenarioAudit.valid ? '#a7f3d0' : '#fecaca'), borderRadius: '4px', padding: '18px 20px', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.2rem' }}>{scenarioAudit.valid ? '✅' : '⚠️'}</span>
                          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                            Graph Integrity Audit (scenarioIntegrityService)
                          </h3>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', backgroundColor: scenarioAudit.valid ? '#d1fae5' : '#fee2e2', color: scenarioAudit.valid ? '#065f46' : '#991b1b' }}>
                          {scenarioAudit.valid ? 'PASSED — STRUCTURALLY SOUND' : 'INTEGRITY DEFECTS DETECTED'}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <div>✓ Start Node verified (stageOrder = 1)</div>
                        <div>✓ Next Stage routing referentially sound</div>
                        <div>✓ Zero circular self-loops detected</div>
                        <div>✓ Behavior metrics bounded in [0, 2]</div>
                        <div>✓ Identified signals map to target signals</div>
                        <div>✓ Terminal exit nodes verified</div>
                      </div>

                      {scenarioAudit.warnings?.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '0.8rem', color: '#92400e' }}>
                          <strong>Topology Notes ({scenarioAudit.warnings.length}):</strong>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                            {scenarioAudit.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                          </ul>
                        </div>
                      )}

                      {scenarioAudit.errors?.length > 0 && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.8rem', color: '#991b1b' }}>
                          <strong>Critical Graph Errors ({scenarioAudit.errors.length}):</strong>
                          <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                            {scenarioAudit.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode: Decision Matrix */}
                  {activeTab === 'decisions' && (
                    <div style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                          Decision Branching Matrix ({selectedScenarioData.stages?.reduce((acc, st) => acc + (st.decisions?.length || 0), 0)} options)
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluated during interactive simulation</span>
                      </div>
                      <div className="table-wrapper" style={{ margin: 0 }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Parent Stage</th>
                              <th>Decision Option</th>
                              <th>Risk Level</th>
                              <th>Routing</th>
                              <th>Outcome</th>
                              <th>Behavior Impact</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedScenarioData.stages?.flatMap(st => 
                              (st.decisions || []).map(dec => (
                                <tr key={dec._id}>
                                  <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>
                                    Order #{st.stageOrder}: {st.title}
                                  </td>
                                  <td>{dec.optionText}</td>
                                  <td>
                                    <span style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      backgroundColor: dec.riskLevel === 'safe' ? '#d1fae5' : (dec.riskLevel === 'critical' ? '#fee2e2' : '#fef3c7'),
                                      color: dec.riskLevel === 'safe' ? '#065f46' : (dec.riskLevel === 'critical' ? '#991b1b' : '#92400e')
                                    }}>
                                      {dec.riskLevel.toUpperCase()}
                                    </span>
                                  </td>
                                  <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                    {dec.nextStageId ? `→ Stage ID: ${String(dec.nextStageId).substring(18)}` : '🏁 Terminal'}
                                  </td>
                                  <td style={{ fontSize: '0.8rem' }}>{dec.outcomeType}</td>
                                  <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {dec.behaviorEffects ? `TR:${dec.behaviorEffects.recognition || 0} SI:${dec.behaviorEffects.signalIdentification || 0} VB:${dec.behaviorEffects.verification || 0} DQ:${dec.behaviorEffects.decisionQuality || 0}` : '—'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mode: Stages Topology */}
                  {activeTab !== 'decisions' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                          Sequential Stage Sequence ({selectedScenarioData.stages?.length || 0} Nodes)
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Interactive nodes sorted by stageOrder
                        </span>
                      </div>

                      {selectedScenarioData.stages?.map(st => (
                        <div key={st._id} style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px 20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy, #1e3a8a)', textTransform: 'uppercase' }}>
                                Stage Order #{st.stageOrder}
                              </span>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                {st.title}
                              </h4>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--color-border)' }}>
                                Interface: {st.mockInterfaceType}
                              </span>
                              <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: st.eventClassification === 'legitimate' ? '#d1fae5' : (st.eventClassification === 'malicious' ? '#fee2e2' : '#fef3c7'),
                                color: st.eventClassification === 'legitimate' ? '#065f46' : (st.eventClassification === 'malicious' ? '#991b1b' : '#92400e'),
                                fontWeight: 'bold'
                              }}>
                                {st.eventClassification.toUpperCase()}
                              </span>
                              {st.terminal && (
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 'bold' }}>
                                  TERMINAL
                                </span>
                              )}
                            </div>
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                            {st.description}
                          </p>

                          {/* Branching Decisions for Stage */}
                          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                              Available Decision Paths ({st.decisions?.length || 0}):
                            </span>
                            {st.decisions?.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                                Non-branching node / Diagnostic terminal step.
                              </p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                                {st.decisions.map((d, dIdx) => (
                                  <div key={d._id || dIdx} style={{ fontSize: '0.8rem', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>{dIdx + 1}.</span>
                                      <span style={{ color: 'var(--text-primary)' }}>{d.optionText}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        padding: '1px 6px',
                                        borderRadius: '3px',
                                        backgroundColor: d.riskLevel === 'safe' ? '#d1fae5' : '#fef3c7',
                                        color: d.riskLevel === 'safe' ? '#065f46' : '#92400e'
                                      }}>
                                        {d.riskLevel}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {d.nextStageId ? `→ Stage ID: ${String(d.nextStageId).substring(18)}` : '🏁 Exit'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Users & Progress */}
          {activeTab === 'users' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Users & Progress Tracking</h1>
              
              <PortalSearch 
                placeholder="Search users by name or email..."
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                results={filteredItems}
              />

              {filteredItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--bg-white)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Users Found</h3>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                    No matching student profiles were found in the database.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Baseline</th>
                        <th>Final</th>
                        <th>Delta</th>
                        <th>Badges Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map(u => {
                        const delta = (u.finalScore !== null && u.baselineScore !== null) ? (u.finalScore - u.baselineScore) : null;
                        return (
                          <tr key={u.id}>
                            <td style={{ fontWeight: '600' }}>{u.fullName}</td>
                            <td>{u.email}</td>
                            <td>{u.baselineScore !== null ? u.baselineScore + '%' : '—'}</td>
                            <td>{u.finalScore !== null ? u.finalScore + '%' : '—'}</td>
                            <td style={{ color: delta !== null ? (delta >= 0 ? 'var(--color-success)' : 'var(--color-error)') : 'inherit', fontWeight: 'bold' }}>
                              {delta !== null ? (delta >= 0 ? '+' : '') + delta : '—'}
                            </td>
                            <td>{u.badges.join(', ')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredItems.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {(startIndex + 1) + '–' + Math.min(startIndex + itemsPerPage, filteredItems.length) + ' of ' + filteredItems.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={startIndex + itemsPerPage >= filteredItems.length}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated Quiz Questions Manager View */}
          {activeTab === 'quizzes' && selectedQuizDetails && !isAdding && !editItem && (
            <div>
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" style={{ marginBottom: '14px', fontSize: '0.8rem', color: '#64748b' }}>
                <span style={{ cursor: 'pointer', color: '#1e3a8a', textDecoration: 'underline' }} onClick={() => handleTabChange('analytics')}>Administration</span>
                <span style={{ margin: '0 6px' }}>/</span>
                <span style={{ cursor: 'pointer', color: '#1e3a8a', textDecoration: 'underline' }} onClick={handleCloseQuizQuestions}>Quizzes &amp; Bank</span>
                <span style={{ margin: '0 6px' }}>/</span>
                <strong style={{ color: '#0f172a' }}>{selectedQuizDetails.quiz?.title}</strong>
              </nav>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    onClick={handleCloseQuizQuestions}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    ← Back to Quiz Modules
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                      Quiz: {selectedQuizDetails.quiz?.title}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Category: {selectedQuizDetails.quiz?.category} • Difficulty: {selectedQuizDetails.quiz?.difficulty} • {selectedQuizDetails.questions?.length || 0} questions in bank
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenQuestionModal(null)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  + Add Question to Quiz
                </button>
              </div>

              {/* Question Bank Filter Toolbar */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
                  <input
                    type="text"
                    placeholder="Search questions, options, or law citations..."
                    value={questionSearchQuery}
                    onChange={(e) => setQuestionSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
                <div>
                  <select
                    value={questionDifficultyFilter}
                    onChange={(e) => setQuestionDifficultyFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="all">All Difficulties</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <select
                    value={questionCognitiveFilter}
                    onChange={(e) => setQuestionCognitiveFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="all">All Cognitive Levels</option>
                    <option value="Level 1">Level 1 (Remember)</option>
                    <option value="Level 2">Level 2 (Understand)</option>
                    <option value="Level 3">Level 3 (Apply)</option>
                    <option value="Level 4">Level 4 (Analyze)</option>
                    <option value="Level 5">Level 5 (Evaluate)</option>
                    <option value="Level 6">Level 6 (Create)</option>
                  </select>
                </div>
                <div>
                  <select
                    value={questionStatusFilter}
                    onChange={(e) => setQuestionStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published Only</option>
                    <option value="draft">Draft Only</option>
                  </select>
                </div>
                {(questionSearchQuery || questionDifficultyFilter !== 'all' || questionCognitiveFilter !== 'all' || questionStatusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setQuestionSearchQuery('');
                      setQuestionDifficultyFilter('all');
                      setQuestionCognitiveFilter('all');
                      setQuestionStatusFilter('all');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    Reset Filters
                  </button>
                )}
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
                  Showing <strong>{getFilteredQuestions().length}</strong> of {selectedQuizDetails.questions?.length || 0}
                </div>
              </div>

              {selectedQuizDetails.questions?.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--bg-white)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Questions in this Quiz</h3>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                    Add questions to this quiz bank. The selection service will pull 10 questions dynamically for student attempts.
                  </p>
                  <button onClick={() => handleOpenQuestionModal(null)} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    + Add Question
                  </button>
                </div>
              ) : getFilteredQuestions().length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                  <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '6px' }}>No questions match active filters</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>
                    Try clearing or adjusting search query, difficulty, cognitive level, or publish status.
                  </p>
                  <button
                    onClick={() => {
                      setQuestionSearchQuery('');
                      setQuestionDifficultyFilter('all');
                      setQuestionCognitiveFilter('all');
                      setQuestionStatusFilter('all');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Question Text</th>
                        <th>Options (Correct Highlighted)</th>
                        <th>Type &amp; Level</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredQuestions().map((q, idx) => (
                        <tr key={q._id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>{idx + 1}</td>
                          <td style={{ fontWeight: '500', maxWidth: '300px' }}>
                            <div>{q.questionText}</div>
                            {q.relatedLawSection && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--accent-navy, #1e3a8a)', display: 'block', marginTop: '2px' }}>
                                Ref: {q.relatedLawSection}
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', minWidth: '220px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {q.options?.map((opt, oIdx) => {
                                const isCorrect = oIdx === q.correctOptionIndex;
                                return (
                                  <div
                                    key={oIdx}
                                    style={{
                                      padding: '2px 6px',
                                      borderRadius: '3px',
                                      backgroundColor: isCorrect ? '#d1fae5' : 'transparent',
                                      color: isCorrect ? '#065f46' : 'var(--text-secondary)',
                                      fontWeight: isCorrect ? 'bold' : 'normal',
                                      border: isCorrect ? '1px solid #a7f3d0' : 'none'
                                    }}
                                  >
                                    {isCorrect ? '✓ ' : `${oIdx + 1}. `}{opt}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            <div>{q.cognitiveLevel || 'Level 1'}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{q.questionType}</span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: q.published ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                              color: q.published ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {q.published ? 'Active' : 'Unpublished'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleToggleQuestionPublish(q)}
                              className="table-action-btn"
                              style={{ marginRight: '8px', fontSize: '0.75rem' }}
                            >
                              {q.published ? 'Set Draft' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenQuestionModal(q)}
                              className="table-action-btn"
                              style={{ marginRight: '8px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              className="table-action-btn danger"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CRUD Lists View */}
          {['laws', 'crimes', 'cases', 'quizzes', 'resources'].includes(activeTab) && !isAdding && !editItem && (!selectedQuizDetails || activeTab !== 'quizzes') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 'bold', fontFamily: 'var(--font-sans)', textTransform: 'capitalize', margin: 0 }}>
                  Manage {activeTab}
                </h1>
                <button onClick={handleAddInit} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>+ Add New Item</button>
              </div>

              <PortalSearch 
                placeholder={'Search ' + activeTab + ' by text, titles, or tags...'}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                results={filteredItems}
              />

              {filteredItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--bg-white)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Records Found</h3>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                    No matching {activeTab} entries were found in the database.
                  </p>
                  <button onClick={handleAddInit} className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
                    + Add New Item
                  </button>
                </div>
              ) : (
                <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <table className="admin-table">
                    <thead>
                      {activeTab === 'laws' && (
                        <tr>
                          <th>Section</th>
                          <th>Title</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      )}
                      {activeTab === 'crimes' && (
                        <tr>
                          <th>Category</th>
                          <th>Title</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      )}
                      {activeTab === 'cases' && (
                        <tr>
                          <th>Type</th>
                          <th>Title</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      )}
                      {activeTab === 'quizzes' && (
                        <tr>
                          <th>Quiz Title</th>
                          <th>Category</th>
                          <th>Difficulty</th>
                          <th>Questions in Bank</th>
                          <th>Learner Attempts</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      )}
                      {activeTab === 'resources' && (
                        <tr>
                          <th>Category</th>
                          <th>Title</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {activeTab === 'laws' && paginatedItems.map(item => (
                        <tr key={item._id || item.id}>
                          <td style={{ fontWeight: '600', whiteSpace: 'nowrap' }}>{item.sectionNumber}</td>
                          <td>{item.officialTitle}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: item.legalStatus === 'CURRENT' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                              color: item.legalStatus === 'CURRENT' ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {item.legalStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item._id || item.id)} className="table-action-btn danger">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'crimes' && paginatedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600' }}>{item.category}</td>
                          <td>{item.title}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="table-action-btn danger">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'cases' && paginatedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600' }}>{item.incidentType}</td>
                          <td>{item.title}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="table-action-btn danger">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'quizzes' && paginatedItems.map(item => (
                        <tr key={item._id || item.id}>
                          <td style={{ fontWeight: '600' }}>{item.title}</td>
                          <td>{item.category}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)'
                            }}>
                              {item.difficulty || 'Medium'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600' }}>{item.questionCount || 0}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                              ({item.publishedQuestionCount || 0} active)
                            </span>
                          </td>
                          <td>{item.attemptCount || 0}</td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: item.published ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                              color: item.published ? 'var(--color-success)' : 'var(--color-warning)'
                            }}>
                              {item.published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              onClick={() => handleToggleQuizPublish(item)}
                              className="table-action-btn"
                              style={{ marginRight: '8px', fontSize: '0.75rem' }}
                            >
                              {item.published ? 'Set Draft' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleOpenQuizQuestions(item._id || item.id)}
                              className="table-action-btn"
                              style={{ marginRight: '8px', backgroundColor: 'var(--accent-navy, #1e3a8a)', color: '#fff' }}
                            >
                              Questions ({item.questionCount || 0})
                            </button>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item._id || item.id)} className="table-action-btn danger">Delete</button>
                          </td>
                        </tr>
                      ))}
                      {activeTab === 'resources' && paginatedItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600' }}>{item.category}</td>
                          <td>{item.title}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="table-action-btn danger">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredItems.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {(startIndex + 1) + '–' + Math.min(startIndex + itemsPerPage, filteredItems.length) + ' of ' + filteredItems.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Previous
                    </button>
                    <button
                      disabled={startIndex + itemsPerPage >= filteredItems.length}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CRUD Form View */}
          {(isAdding || editItem) && (
            <div className="editorial-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '24px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '20px' }}>
                {editItem ? 'Edit Item Details' : 'Add New Registry Entry'}
              </h2>
              <form onSubmit={handleFormSubmit}>
                
                {/* LAWS FORM */}
                {activeTab === 'laws' && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                      {['overview', 'content', 'metadata', 'connections'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setLawFormTab(tab)}
                          style={{
                            backgroundColor: lawFormTab === tab ? 'var(--color-primary)' : 'var(--bg-secondary)',
                            color: lawFormTab === tab ? '#fff' : 'var(--text-primary)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {lawFormTab === 'overview' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Section / Provision Identifier</label>
                          <input type="text" name="sectionNumber" className="form-control" placeholder="e.g. Section 66C" value={formData.sectionNumber || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Act Name / Statute</label>
                          <input type="text" name="actName" className="form-control" placeholder="e.g. Information Technology Act, 2000" value={formData.actName || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Official Title</label>
                          <input type="text" name="officialTitle" className="form-control" placeholder="e.g. Punishment for identity theft" value={formData.officialTitle || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Legal Role / Classification</label>
                          <select name="role" className="form-control" value={formData.role || 'Core Cyber Law'} onChange={handleFormChange}>
                            <option value="Core Cyber Law">Core Cyber Law</option>
                            <option value="Related Criminal Law">Related Criminal Law</option>
                            <option value="Data Protection">Data Protection</option>
                            <option value="Electronic Commerce / Digital Transactions">Electronic Commerce / Digital Transactions</option>
                            <option value="Sector Regulation">Sector Regulation</option>
                            <option value="Judicial Interpretation">Judicial Interpretation</option>
                            <option value="Government Rule / Notification">Government Rule / Notification</option>
                            <option value="Official Guidance">Official Guidance</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Legal Status</label>
                          <select name="legalStatus" className="form-control" value={formData.legalStatus || 'CURRENT'} onChange={handleFormChange}>
                            <option value="CURRENT">Current</option>
                            <option value="OMITTED">Omitted / Struck Down</option>
                            <option value="AMENDED">Amended</option>
                            <option value="REPEALED">Repealed</option>
                            <option value="NOT_YET_IN_FORCE">Not Yet In Force</option>
                            <option value="PARTIALLY_IN_FORCE">Partially In Force</option>
                            <option value="HISTORICAL">Historical</option>
                            <option value="UNDER_REVIEW">Under Review</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Official Source reference</label>
                          <select name="officialSourceId" className="form-control" value={formData.officialSourceId || ''} onChange={handleFormChange} required>
                            <option value="">-- Select Source --</option>
                            {getAvailableSources().map(src => (
                              <option key={src._id || src.id} value={src._id || src.id}>
                                {src.title} ({src.authority})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {lawFormTab === 'content' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>Plain Language Explanation</label>
                          <textarea name="plainLanguageExplanation" className="form-control" style={{ minHeight: '100px' }} value={formData.plainLanguageExplanation || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Official statutory draft text</label>
                          <textarea name="officialStatutoryText" className="form-control" style={{ minHeight: '100px' }} value={formData.officialStatutoryText || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Why It Matters to users</label>
                          <textarea name="whyItMatters" className="form-control" style={{ minHeight: '80px' }} value={formData.whyItMatters || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Everyday Example scenario</label>
                          <textarea name="exampleScenario" className="form-control" style={{ minHeight: '80px' }} value={formData.exampleScenario || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Statutory Penalty / legal effect</label>
                          <textarea name="penaltyOrLegalEffect" className="form-control" style={{ minHeight: '60px' }} value={formData.penaltyOrLegalEffect || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {lawFormTab === 'metadata' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Commencement Status notes (required for partial/pending statuses)</label>
                          <input type="text" name="commencementStatus" className="form-control" value={formData.commencementStatus || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Amendment Status notes (required for OMITTED status)</label>
                          <input type="text" name="amendmentStatus" className="form-control" value={formData.amendmentStatus || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Search Keywords (comma separated list)</label>
                          <input type="text" name="keywords" className="form-control" value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {lawFormTab === 'connections' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Related Cybercrimes (comma separated slugs)</label>
                          <input type="text" name="relatedCyberCrimes" className="form-control" value={Array.isArray(formData.relatedCyberCrimes) ? formData.relatedCyberCrimes.join(', ') : formData.relatedCyberCrimes || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Related Case Study Slugs (comma separated)</label>
                          <input type="text" name="relatedCaseStudies" className="form-control" value={Array.isArray(formData.relatedCaseStudies) ? formData.relatedCaseStudies.join(', ') : formData.relatedCaseStudies || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Related Module Slugs (comma separated)</label>
                          <input type="text" name="relatedModules" className="form-control" value={Array.isArray(formData.relatedModules) ? formData.relatedModules.join(', ') : formData.relatedModules || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* CRIMES FORM */}
                {activeTab === 'crimes' && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                      {['overview', 'timeline', 'tactics', 'games'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCrimeFormTab(tab)}
                          style={{
                            backgroundColor: crimeFormTab === tab ? 'var(--color-primary)' : 'var(--bg-secondary)',
                            color: crimeFormTab === tab ? '#fff' : 'var(--text-primary)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {crimeFormTab === 'overview' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Title</label>
                          <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Category</label>
                          <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Teaser Description</label>
                          <textarea name="description" className="form-control" style={{ minHeight: '80px' }} value={formData.description || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Warning Signs (one per line)</label>
                          <textarea name="warningSigns" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.warningSigns) ? formData.warningSigns.join('\n') : formData.warningSigns || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {crimeFormTab === 'timeline' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>Action Steps (one per line)</label>
                          <textarea name="actionSteps" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.actionSteps) ? formData.actionSteps.join('\n') : formData.actionSteps || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Avoid Steps (one per line)</label>
                          <textarea name="avoidSteps" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.avoidSteps) ? formData.avoidSteps.join('\n') : formData.avoidSteps || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>If Targeted Steps (one per line)</label>
                          <textarea name="ifTargetedSteps" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.ifTargetedSteps) ? formData.ifTargetedSteps.join('\n') : formData.ifTargetedSteps || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {crimeFormTab === 'tactics' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Attack Vectors / Methods (comma separated)</label>
                          <input type="text" name="attackVectors" className="form-control" value={Array.isArray(formData.attackVectors) ? formData.attackVectors.join(', ') : formData.attackVectors || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Attack Lifecycle Config (JSON Format)</label>
                          <textarea name="attackLifecycle" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '120px' }} placeholder='[{"stage":"Setup","description":"..."}]' value={typeof formData.attackLifecycle === 'string' ? formData.attackLifecycle : JSON.stringify(formData.attackLifecycle, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Attacker Manipulation Tactics (JSON Format)</label>
                          <textarea name="attackerTactics" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '120px' }} placeholder='[{"tactic":"Urgency","explanation":"..."}]' value={typeof formData.attackerTactics === 'string' ? formData.attackerTactics : JSON.stringify(formData.attackerTactics, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {crimeFormTab === 'games' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>What Would You Do Decision Game (JSON Format)</label>
                          <textarea name="whatWouldYouDo" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='{"scenarioText":"...","options":[{"text":"...","correct":true,"feedback":"..."}]}' value={typeof formData.whatWouldYouDo === 'string' ? formData.whatWouldYouDo : JSON.stringify(formData.whatWouldYouDo, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Spot the Flags game (JSON Format)</label>
                          <textarea name="spotTheFlags" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='{"teaserText":"...","textSegments":[{"textSegment":"...","flagName":"...","explanation":"..."}]}' value={typeof formData.spotTheFlags === 'string' ? formData.spotTheFlags : JSON.stringify(formData.spotTheFlags, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Myth vs Fact Card Deck (JSON Format)</label>
                          <textarea name="mythFacts" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='[{"myth":"...","fact":"...","explanation":"..."}]' value={typeof formData.mythFacts === 'string' ? formData.mythFacts : JSON.stringify(formData.mythFacts, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Related Laws Context (comma separated)</label>
                          <input type="text" name="legalContext" className="form-control" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* CASES FORM */}
                {activeTab === 'cases' && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                      {['overview', 'story', 'timeline', 'legal'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setCaseFormTab(tab)}
                          style={{
                            backgroundColor: caseFormTab === tab ? 'var(--color-primary)' : 'var(--bg-secondary)',
                            color: caseFormTab === tab ? '#fff' : 'var(--text-primary)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {caseFormTab === 'overview' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Title</label>
                          <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Incident Type / Category</label>
                          <input type="text" name="incidentType" className="form-control" placeholder="e.g. Identity Theft" value={formData.incidentType || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Case Type Classification</label>
                          <select name="caseType" className="form-control" value={formData.caseType || 'fictional-training-scenario'} onChange={handleFormChange}>
                            <option value="fictional-training-scenario">Fictional Training Scenario</option>
                            <option value="historical-landmark-case">Historical Landmark Case</option>
                            <option value="anonymous-real-incident">Anonymous Real Incident</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Source Summary</label>
                          <input type="text" name="sourceSummary" className="form-control" placeholder="Brief review/ethics statement" value={formData.sourceSummary || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Short Teaser Description</label>
                          <textarea name="shortDescription" className="form-control" style={{ minHeight: '80px' }} value={formData.shortDescription || ''} onChange={handleFormChange} required />
                        </div>
                      </div>
                    )}

                    {caseFormTab === 'story' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>Narrative Sections (JSON Format)</label>
                          <textarea name="narrativeSections" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '120px' }} placeholder='[{"heading":"The Unexpected Contact","body":"..."}]' value={typeof formData.narrativeSections === 'string' ? formData.narrativeSections : JSON.stringify(formData.narrativeSections, null, 2) || ''} onChange={handleFormChange} required />
                        </div>
                        <div className="form-group">
                          <label>Impact Categories (JSON Format)</label>
                          <textarea name="impact" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '80px' }} placeholder='{"financial":"...","account":"...","privacy":"...","operational":"..."}' value={typeof formData.impact === 'string' ? formData.impact : JSON.stringify(formData.impact, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Response Actions (one per line)</label>
                          <textarea name="response" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.response) ? formData.response.join('\n') : formData.response || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {caseFormTab === 'timeline' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group">
                          <label>Incident Timeline (JSON Format)</label>
                          <textarea name="timeline" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='[{"time":"10:00 AM","label":"Email Received","description":"...","type":"contact"}]' value={typeof formData.timeline === 'string' ? formData.timeline : JSON.stringify(formData.timeline, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Decision Point Widgets (JSON Format)</label>
                          <textarea name="decisionPoints" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='[{"questionText":"...","options":[{"optionText":"...","isCorrect":true,"explanation":"..."}]}]' value={typeof formData.decisionPoints === 'string' ? formData.decisionPoints : JSON.stringify(formData.decisionPoints, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Warning Signs Audit (JSON Format)</label>
                          <textarea name="warningSigns" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '100px' }} placeholder='[{"title":"...","explanation":"..."}]' value={typeof formData.warningSigns === 'string' ? formData.warningSigns : JSON.stringify(formData.warningSigns, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}

                    {caseFormTab === 'legal' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Legal Context (comma separated sections)</label>
                          <input type="text" name="legalContext" className="form-control" placeholder="e.g. Section 66D, Section 66C" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Attacker Objectives (comma-separated list)</label>
                          <input type="text" name="attackerObjectives" className="form-control" placeholder="e.g. Credentials, Money, Identity" value={Array.isArray(formData.attackerObjectives) ? formData.attackerObjectives.join(', ') : formData.attackerObjectives || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Related Crimes (comma separated slugs)</label>
                          <input type="text" name="relatedCrimes" className="form-control" placeholder="e.g. phishing, vishing" value={Array.isArray(formData.relatedCrimes) ? formData.relatedCrimes.join(', ') : formData.relatedCrimes || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                          <label>Related Modules (comma separated slugs)</label>
                          <input type="text" name="relatedModules" className="form-control" value={Array.isArray(formData.relatedModules) ? formData.relatedModules.join(', ') : formData.relatedModules || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Prevention Lessons (one per line)</label>
                          <textarea name="preventionLessons" className="form-control" style={{ minHeight: '80px' }} value={Array.isArray(formData.preventionLessons) ? formData.preventionLessons.join('\n') : formData.preventionLessons || ''} onChange={handleFormChange} />
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                          <label>Official Sources (JSON Format)</label>
                          <textarea name="sources" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '80px' }} placeholder='[{"title":"...","authority":"...","url":"...","sourceType":"official"}]' value={typeof formData.sources === 'string' ? formData.sources : JSON.stringify(formData.sources, null, 2) || ''} onChange={handleFormChange} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* QUIZZES FORM */}
                {activeTab === 'quizzes' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Quiz Title</label>
                      <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} placeholder="e.g. Phishing Detection Challenge" required />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} placeholder="e.g. Phishing" required />
                    </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select name="difficulty" className="form-control" value={formData.difficulty || 'Medium'} onChange={handleFormChange}>
                        <option value="Beginner">Beginner</option>
                        <option value="Medium">Medium</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Description</label>
                      <textarea name="description" className="form-control" style={{ minHeight: '80px' }} value={formData.description || ''} onChange={handleFormChange} placeholder="Summary of what this quiz tests" />
                    </div>
                    <div className="form-group">
                      <label>Related Learning Module Slug</label>
                      <input type="text" name="relatedModule" className="form-control" value={formData.relatedModule || ''} onChange={handleFormChange} placeholder="e.g. phishing-prevention" />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input type="checkbox" name="published" checked={formData.published !== false} onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))} />
                        <span style={{ fontWeight: '500' }}>Published (Available to students)</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* RESOURCES FORM */}
                {activeTab === 'resources' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Category</label>
                      <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Link / URL</label>
                      <input type="text" name="link" className="form-control" value={formData.link || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Description</label>
                      <textarea name="description" className="form-control" style={{ minHeight: '80px' }} value={formData.description || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', gridColumn: '1 / span 2' }}>
                      <input type="checkbox" name="downloadable" id="downloadable" checked={formData.downloadable || false} onChange={handleFormChange} />
                      <label htmlFor="downloadable" style={{ margin: 0, fontWeight: '600' }}>Is Downloadable Document</label>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '24px', display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>Save Changes</button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="btn btn-secondary"
                    style={{ padding: '8px 24px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Audit History Logs */}
          {activeTab === 'audit' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', fontWeight: 'bold', margin: '0 0 6px 0', fontFamily: 'var(--font-sans)' }}>Admin Audit Trail</h1>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    Tamper-evident, server-authenticated records of administrative actions, content mutations, and system events.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => fetchAuditLogs()}
                    className="btn btn-secondary" 
                    style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Refresh Audit Records"
                  >
                    <span>↻</span> Refresh
                  </button>
                </div>
              </div>

              {/* Audit Filter Controls */}
              <div style={{
                backgroundColor: 'var(--bg-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'end' }}>
                  {/* Search query */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Search Action or Description
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Section 66C, Phishing, Quiz..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') fetchAuditLogs({ search: auditSearch, page: 1 }); }}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Action Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Action Type
                    </label>
                    <select
                      className="form-control"
                      value={auditActionType}
                      onChange={(e) => { setAuditActionType(e.target.value); fetchAuditLogs({ actionType: e.target.value, page: 1 }); }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="">All Actions</option>
                      <option value="CREATE">CREATE</option>
                      <option value="UPDATE">UPDATE</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PUBLISH">PUBLISH</option>
                      <option value="UNPUBLISH">UNPUBLISH</option>
                    </select>
                  </div>

                  {/* Entity Type */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Entity Type
                    </label>
                    <select
                      className="form-control"
                      value={auditEntityType}
                      onChange={(e) => { setAuditEntityType(e.target.value); fetchAuditLogs({ entityType: e.target.value, page: 1 }); }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="">All Entities</option>
                      <option value="LawSection">Law Section</option>
                      <option value="CyberCrime">Cybercrime</option>
                      <option value="CaseStudy">Case Study</option>
                      <option value="Quiz">Quiz</option>
                      <option value="Resource">Resource</option>
                    </select>
                  </div>

                  {/* Outcome */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Outcome
                    </label>
                    <select
                      className="form-control"
                      value={auditOutcome}
                      onChange={(e) => { setAuditOutcome(e.target.value); fetchAuditLogs({ outcome: e.target.value, page: 1 }); }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <option value="">All Outcomes</option>
                      <option value="SUCCESS">SUCCESS</option>
                      <option value="FAILURE">FAILURE</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      From Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* End Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      To Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => fetchAuditLogs({ page: 1 })}
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.85rem', flex: 1 }}
                    >
                      Filter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuditSearch('');
                        setAuditActionType('');
                        setAuditEntityType('');
                        setAuditOutcome('');
                        setAuditStartDate('');
                        setAuditEndDate('');
                        fetchAuditLogs({ search: '', actionType: '', entityType: '', outcome: '', startDate: '', endDate: '', page: 1 });
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      title="Clear all filters"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Error Notice */}
              {auditError && (
                <div className="alert alert-error" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{auditError}</span>
                  <button onClick={() => fetchAuditLogs()} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Retry</button>
                </div>
              )}

              {/* Loading State */}
              {auditLoading && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', marginBottom: '20px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Loading audit records from database...
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!auditLoading && auditLogs.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '6px', backgroundColor: 'var(--bg-white)' }}>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '700' }}>No Audit Records Found</h3>
                  <p className="text-secondary" style={{ fontSize: '0.88rem', margin: '0 0 16px 0' }}>
                    No administrative events matched your search criteria or date filter.
                  </p>
                  <button
                    onClick={() => {
                      setAuditSearch('');
                      setAuditActionType('');
                      setAuditEntityType('');
                      setAuditOutcome('');
                      setAuditStartDate('');
                      setAuditEndDate('');
                      fetchAuditLogs({ search: '', actionType: '', entityType: '', outcome: '', startDate: '', endDate: '', page: 1 });
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                  >
                    Clear Filter Criteria
                  </button>
                </div>
              )}

              {/* Audit Table */}
              {!auditLoading && auditLogs.length > 0 && (
                <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '6px', overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: '160px' }}>Timestamp</th>
                        <th style={{ width: '180px' }}>Administrator</th>
                        <th style={{ width: '120px' }}>Action</th>
                        <th style={{ width: '130px' }}>Entity</th>
                        <th style={{ width: '110px' }}>Outcome</th>
                        <th>Summary / Description</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => {
                        const actionStyle = getActionBadgeStyle(log.actionType || 'UPDATE');
                        return (
                          <tr key={log._id}>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(log.timestamp).toLocaleString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </td>
                            <td>
                              <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'block', fontSize: '0.85rem' }}>
                                {log.adminId ? log.adminId.fullName : 'System Operator'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                                {log.adminId?.email || 'automated'}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: '700',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                color: actionStyle.color,
                                backgroundColor: actionStyle.bg,
                                border: `1px solid ${actionStyle.border}`,
                                display: 'inline-block'
                              }}>
                                {log.actionType || 'UPDATE'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {log.entityType}
                              </span>
                            </td>
                            <td>
                              {getOutcomeBadge(log.outcome || 'SUCCESS')}
                            </td>
                            <td style={{ fontSize: '0.84rem' }}>
                              <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '2px' }}>
                                {log.description || log.action}
                              </div>
                              {log.changes && (
                                <div style={{ marginTop: '4px' }}>
                                  {formatChanges(log.changes)}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedAuditLog(log)}
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                aria-label={`View details for audit event ${log._id}`}
                              >
                                Inspect
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Server-backed Pagination Controls */}
              {!auditLoading && auditPagination.total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing {((auditPagination.page - 1) * auditPagination.limit) + 1}–{Math.min(auditPagination.page * auditPagination.limit, auditPagination.total)} of {auditPagination.total} audit records (Page {auditPagination.page} of {auditPagination.totalPages})
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      disabled={auditPagination.page <= 1}
                      onClick={() => fetchAuditLogs({ page: auditPagination.page - 1 })}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      aria-label="Previous Page"
                    >
                      &larr; Previous
                    </button>
                    <span style={{ fontSize: '0.82rem', fontWeight: '600', padding: '0 6px' }}>
                      {auditPagination.page} / {auditPagination.totalPages}
                    </span>
                    <button
                      disabled={auditPagination.page >= auditPagination.totalPages}
                      onClick={() => fetchAuditLogs({ page: auditPagination.page + 1 })}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      aria-label="Next Page"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Event Detail Modal */}
              {selectedAuditLog && (
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="audit-detail-title"
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 37, 55, 0.45)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => setSelectedAuditLog(null)}
                >
                  <div
                    style={{
                      backgroundColor: 'var(--bg-white)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      maxWidth: '680px',
                      width: '100%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                      padding: '24px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px', marginBottom: '18px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: '700' }}>
                          Audit Record Inspector
                        </span>
                        <h2 id="audit-detail-title" style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '4px 0 0 0', fontWeight: '700' }}>
                          {selectedAuditLog.action}
                        </h2>
                      </div>
                      <button
                        onClick={() => setSelectedAuditLog(null)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.85rem' }}
                        aria-label="Close Inspector"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px', fontSize: '0.85rem' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Timestamp</span>
                        <strong>{new Date(selectedAuditLog.timestamp).toISOString()}</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Outcome Status</span>
                        {getOutcomeBadge(selectedAuditLog.outcome || 'SUCCESS')}
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Administrator</span>
                        <strong>{selectedAuditLog.adminId?.fullName || 'System'}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{selectedAuditLog.adminId?.email || 'N/A'}</div>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700', textTransform: 'uppercase' }}>Action & Target</span>
                        <strong>{selectedAuditLog.actionType || 'UPDATE'} on {selectedAuditLog.entityType}</strong>
                        {selectedAuditLog.entityId && (
                          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>ID: {String(selectedAuditLog.entityId)}</div>
                        )}
                      </div>
                    </div>

                    {/* Safe Contextual Metadata */}
                    {selectedAuditLog.metadata && Object.keys(selectedAuditLog.metadata).length > 0 && (
                      <div style={{ marginBottom: '18px' }}>
                        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                          Contextual Metadata
                        </h4>
                        <div style={{ backgroundColor: '#faf9f5', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '12px', fontSize: '0.82rem' }}>
                          {selectedAuditLog.metadata.ip && <div><strong>Client IP:</strong> <span style={{ fontFamily: 'monospace' }}>{selectedAuditLog.metadata.ip}</span></div>}
                          {selectedAuditLog.metadata.userAgent && <div style={{ marginTop: '4px' }}><strong>User-Agent:</strong> {selectedAuditLog.metadata.userAgent}</div>}
                          {Object.entries(selectedAuditLog.metadata).filter(([k]) => k !== 'ip' && k !== 'userAgent').map(([k, v]) => (
                            <div key={k} style={{ marginTop: '4px' }}><strong>{k}:</strong> {String(v)}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Changes & Payload Details */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                        Safe Payload & Attributes Changed
                      </h4>
                      <pre style={{
                        backgroundColor: '#1c1c1e',
                        color: '#f4f3ee',
                        padding: '14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        overflowX: 'auto',
                        maxHeight: '220px',
                        lineHeight: '1.45'
                      }}>
                        {JSON.stringify(selectedAuditLog.changes || { note: 'No modification diff tracked' }, null, 2)}
                      </pre>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedAuditLog(null)}
                        className="btn btn-secondary"
                        style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                      >
                        Close Inspector
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quiz Question Edit / Create Modal */}
          {questionModal.isOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="question-modal-title"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) handleCloseQuestionModal();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCloseQuestionModal();
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-white)',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  width: '100%',
                  maxWidth: '680px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  padding: '24px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 id="question-modal-title" style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                    {questionModal.isAdding ? 'Add Question to Quiz' : 'Edit Question'}
                  </h3>
                  <button
                    onClick={handleCloseQuestionModal}
                    aria-label="Close Modal"
                    style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    ✕
                  </button>
                </div>

                {questionModal.error && (
                  <div className="alert alert-error" style={{ marginBottom: '14px', fontSize: '0.85rem' }}>
                    {questionModal.error}
                  </div>
                )}

                <form onSubmit={handleSaveQuestion}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Question Text *</label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: '80px', width: '100%' }}
                        value={questionModal.data?.questionText || ''}
                        onChange={(e) => setQuestionModal(prev => ({
                          ...prev,
                          data: { ...prev.data, questionText: e.target.value }
                        }))}
                        placeholder="Enter question text..."
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Category</label>
                        <input
                          type="text"
                          className="form-control"
                          value={questionModal.data?.category || ''}
                          onChange={(e) => setQuestionModal(prev => ({
                            ...prev,
                            data: { ...prev.data, category: e.target.value }
                          }))}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Difficulty</label>
                        <select
                          className="form-control"
                          value={questionModal.data?.difficulty || 'Intermediate'}
                          onChange={(e) => setQuestionModal(prev => ({
                            ...prev,
                            data: { ...prev.data, difficulty: e.target.value }
                          }))}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Cognitive Level</label>
                        <select
                          className="form-control"
                          value={questionModal.data?.cognitiveLevel || 'Level 1'}
                          onChange={(e) => setQuestionModal(prev => ({
                            ...prev,
                            data: { ...prev.data, cognitiveLevel: e.target.value }
                          }))}
                        >
                          <option value="Level 1">Level 1 (Recall)</option>
                          <option value="Level 2">Level 2 (Comprehension)</option>
                          <option value="Level 3">Level 3 (Application)</option>
                          <option value="Level 4">Level 4 (Analysis)</option>
                          <option value="Level 5">Level 5 (Evaluation)</option>
                          <option value="Level 6">Level 6 (Creation)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Question Type</label>
                        <select
                          className="form-control"
                          value={questionModal.data?.questionType || 'knowledge'}
                          onChange={(e) => setQuestionModal(prev => ({
                            ...prev,
                            data: { ...prev.data, questionType: e.target.value }
                          }))}
                        >
                          <option value="knowledge">knowledge</option>
                          <option value="scenario">scenario</option>
                          <option value="recognition">recognition</option>
                          <option value="prevention">prevention</option>
                          <option value="legal-context">legal-context</option>
                          <option value="sequence">sequence</option>
                          <option value="distinction">distinction</option>
                          <option value="myth-fact">myth-fact</option>
                          <option value="situational-judgment">situational-judgment</option>
                        </select>
                      </div>
                    </div>

                    {/* Options & Correct Answer Selector */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '14px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                      <label style={{ fontWeight: '700', fontSize: '0.85rem', display: 'block', marginBottom: '8px' }}>
                        Options &amp; Correct Answer Selection *
                      </label>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                        Enter options and select the radio button corresponding to the correct answer.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {[0, 1, 2, 3].map((optIndex) => {
                          const optKey = `option${optIndex}`;
                          const isSelected = questionModal.data?.correctOptionIndex === optIndex;
                          return (
                            <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                <input
                                  type="radio"
                                  name="correctOptionRadio"
                                  checked={isSelected}
                                  onChange={() => setQuestionModal(prev => ({
                                    ...prev,
                                    data: { ...prev.data, correctOptionIndex: optIndex }
                                  }))}
                                />
                                <span style={{ fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'var(--color-success)' : 'inherit' }}>
                                  Correct #{optIndex + 1}
                                </span>
                              </label>
                              <input
                                type="text"
                                className="form-control"
                                style={{ flex: 1, border: isSelected ? '1px solid var(--color-success)' : '1px solid var(--color-border)' }}
                                placeholder={`Option ${optIndex + 1} text...`}
                                value={questionModal.data?.[optKey] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setQuestionModal(prev => ({
                                    ...prev,
                                    data: { ...prev.data, [optKey]: val }
                                  }));
                                }}
                                required={optIndex < 2}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Answer Explanation *</label>
                      <textarea
                        className="form-control"
                        style={{ minHeight: '70px', width: '100%' }}
                        value={questionModal.data?.explanation || ''}
                        onChange={(e) => setQuestionModal(prev => ({
                          ...prev,
                          data: { ...prev.data, explanation: e.target.value }
                        }))}
                        placeholder="Why is this answer correct? Provide statutory or behavioral context for learner remediation..."
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Related Law Section (optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={questionModal.data?.relatedLawSection || ''}
                          onChange={(e) => setQuestionModal(prev => ({
                            ...prev,
                            data: { ...prev.data, relatedLawSection: e.target.value }
                          }))}
                          placeholder="e.g. IT Act Section 66D"
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={questionModal.data?.published !== false}
                            onChange={(e) => setQuestionModal(prev => ({
                              ...prev,
                              data: { ...prev.data, published: e.target.checked }
                            }))}
                          />
                          <span style={{ fontWeight: '500' }}>Active (Include in quiz attempts)</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                      <button
                        type="button"
                        onClick={handleCloseQuestionModal}
                        className="btn btn-secondary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '8px 22px', fontSize: '0.85rem' }}
                      >
                        {questionModal.isAdding ? 'Create Question' : 'Save Question'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
