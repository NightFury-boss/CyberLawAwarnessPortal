import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';

function AdminPanel({ user }) {
  // Navigation tabs: analytics, laws, crimes, cases, quizzes, resources, users, audit, scenarios, stages, decisions
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [analytics, setAnalytics] = useState(null);
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
      fetchAdminData();
    }
  }, [user, activeTab]);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'analytics') {
        const stats = await api.adminGetAnalytics();
        setAnalytics(stats);
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
        const data = await api.getQuizzes();
        setQuizzes(data);
      } else if (activeTab === 'resources') {
        const data = await api.getResources();
        setResources(data);
      } else if (activeTab === 'audit') {
        const data = await api.adminGetAuditLogs();
        setAuditLogs(data);
      }
    } catch (err) {
      setError(err.message || 'Error loading administrator data.');
    } finally {
      setLoading(false);
    }
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
        const formatted = {
          ...formData,
          options: typeof formData.options === 'string' ? formData.options.split('\n').filter(Boolean) : formData.options
        };
        if (editItem) await api.adminUpdateQuiz(editItem.id, formatted);
        else await api.adminCreateQuiz(formatted);
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
    if (!changes) return 'N/A';
    if (typeof changes === 'string') return changes;
    try {
      const keys = Object.keys(changes);
      if (keys.length === 0) return 'No updates tracked';
      return (
        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {keys.map(key => {
            const val = changes[key];
            let shiftText = '';
            if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
              shiftText = String(val.old).substring(0, 40) + ' → ' + String(val.new).substring(0, 40);
            } else {
              shiftText = String(JSON.stringify(val)).substring(0, 60);
            }
            return (
              <div key={key}>
                <strong style={{ color: 'var(--accent-navy)' }}>{key}:</strong> {shiftText}
              </div>
            );
          })}
        </div>
      );
    } catch (e) {
      return JSON.stringify(changes);
    }
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
        return (item.questionText?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query));
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
        padding: '12px 24px',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo/cyber-law-logo-horizontal.svg" alt="Logo" style={{ height: '32px', width: 'auto' }} />
          <div style={{ borderLeft: '1px solid var(--color-border-dark)', paddingLeft: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>
              Administration
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{user?.fullName}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {user?.role}</span>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600' }}
          >
            Exit Admin
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="admin-layout">
        
        {/* Sidebar */}
        <aside className="admin-sidebar" style={{ backgroundColor: 'var(--bg-white)', borderRight: '1px solid var(--color-border)' }}>
          <div className="admin-nav-group" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '6px 12px', letterSpacing: '1px' }}>
              Overview
            </span>
            <ul className="admin-nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <button onClick={() => handleTabChange('analytics')} className={activeTab === 'analytics' ? 'active' : ''}>
                  Portal Overview
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '6px 12px', letterSpacing: '1px' }}>
              Content Management
            </span>
            <ul className="admin-nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <button onClick={() => handleTabChange('laws')} className={activeTab === 'laws' ? 'active' : ''}>
                  Cyber Laws
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('crimes')} className={activeTab === 'crimes' ? 'active' : ''}>
                  Crimes Library
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('cases')} className={activeTab === 'cases' ? 'active' : ''}>
                  Case Studies
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('resources')} className={activeTab === 'resources' ? 'active' : ''}>
                  Portal Resources
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('quizzes')} className={activeTab === 'quizzes' ? 'active' : ''}>
                  Quizzes
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '6px 12px', letterSpacing: '1px' }}>
              Assessment (Phase 2)
            </span>
            <ul className="admin-nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <button onClick={() => handleTabChange('scenarios')} className={activeTab === 'scenarios' ? 'active' : ''} style={{ opacity: 0.65 }}>
                  Scenarios <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>Phase 2</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('stages')} className={activeTab === 'stages' ? 'active' : ''} style={{ opacity: 0.65 }}>
                  Scenario Stages <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>Phase 2</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('decisions')} className={activeTab === 'decisions' ? 'active' : ''} style={{ opacity: 0.65 }}>
                  Decisions <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '10px', float: 'right' }}>Phase 2</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="admin-nav-group" style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', padding: '6px 12px', letterSpacing: '1px' }}>
              System Operations
            </span>
            <ul className="admin-nav" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <button onClick={() => handleTabChange('users')} className={activeTab === 'users' ? 'active' : ''}>
                  Users & Progress
                </button>
              </li>
              <li>
                <button onClick={() => handleTabChange('audit')} className={activeTab === 'audit' ? 'active' : ''}>
                  Audit History Logs
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

          {/* Tab 1: Portal Overview */}
          {activeTab === 'analytics' && analytics && (
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Portal Overview</h1>
              <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
                <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                  <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Registered Students</span>
                  <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>{analytics.totalUsers}</div>
                </div>
                <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                  <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Avg Baseline Score</span>
                  <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>{analytics.avgBaselineScore}%</div>
                </div>
                <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                  <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Avg Final Score</span>
                  <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '8px' }}>{analytics.avgFinalScore}%</div>
                </div>
                <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '20px', textAlign: 'center' }}>
                  <span className="label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Avg Improvement</span>
                  <div className="value" style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)', marginTop: '8px' }}>+{analytics.avgImprovement} pts</div>
                </div>
              </div>

              <div className="editorial-card" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '8px' }}>Primary Student Vulnerability</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  Most common weak assessment area detected across participants: <strong style={{ color: 'var(--color-error)' }}>{analytics.weakestArea}</strong> (failed threshold in {analytics.weakestAreaCount} attempts).
                </p>
              </div>
            </div>
          )}

          {/* Phase 2 Placeholders */}
          {['scenarios', 'stages', 'decisions'].includes(activeTab) && (
            <div className="editorial-card" style={{ padding: 'var(--space-xxl)', textAlign: 'center', backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🔒</div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '8px' }}>
                Scenario Engine Management (Phase 2)
              </h2>
              <p className="text-secondary" style={{ maxWidth: '500px', margin: '0 auto 20px auto', fontSize: '0.95rem' }}>
                This module is scheduled for Phase 2 development. It will provide a complete visual builder to edit branching scenarios, stage logic nodes, and decision outcomes for "Your Digital Day".
              </p>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', border: '1px solid var(--color-border)', padding: '4px 10px', borderRadius: '20px' }}>
                Status: Planned / Backlog
              </span>
            </div>
          )}

          {/* Tab 2: Users & Progress */}
          {activeTab === 'users' && (
            <div>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Users & Progress Tracking</h1>
              
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

          {/* CRUD Lists View */}
          {['laws', 'crimes', 'cases', 'quizzes', 'resources'].includes(activeTab) && !isAdding && !editItem && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', fontFamily: 'var(--font-sans)', textTransform: 'capitalize', margin: 0 }}>
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
                          <th>Category</th>
                          <th>Question</th>
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
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600' }}>{item.category}</td>
                          <td>{item.questionText.substring(0, 75)}...</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={() => handleEditInit(item)} className="table-action-btn" style={{ marginRight: '8px' }}>Edit</button>
                            <button onClick={() => handleDelete(item.id)} className="table-action-btn danger">Delete</button>
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
              <h2 style={{ color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '20px' }}>
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
                            backgroundColor: lawFormTab === tab ? 'var(--accent-navy)' : 'var(--bg-secondary)',
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
                            backgroundColor: crimeFormTab === tab ? 'var(--accent-navy)' : 'var(--bg-secondary)',
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
                            backgroundColor: caseFormTab === tab ? 'var(--accent-navy)' : 'var(--bg-secondary)',
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
                    <div className="form-group">
                      <label>Category</label>
                      <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select name="difficulty" className="form-control" value={formData.difficulty || 'Easy'} onChange={handleFormChange}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Question Text</label>
                      <textarea name="questionText" className="form-control" style={{ minHeight: '80px' }} value={formData.questionText || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Options (one per line)</label>
                      <textarea name="options" className="form-control" style={{ minHeight: '100px' }} value={Array.isArray(formData.options) ? formData.options.join('\n') : formData.options || ''} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                      <label>Correct Option Index (0-based)</label>
                      <input type="number" name="correctOptionIndex" min="0" max="4" className="form-control" value={formData.correctOptionIndex === undefined ? '' : formData.correctOptionIndex} onChange={handleFormChange} required />
                    </div>
                    <div className="form-group">
                      <label>Related Law Section</label>
                      <input type="text" name="relatedLawSection" className="form-control" value={formData.relatedLawSection || ''} onChange={handleFormChange} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                      <label>Answer Explanation</label>
                      <textarea name="explanation" className="form-control" style={{ minHeight: '80px' }} value={formData.explanation || ''} onChange={handleFormChange} required />
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
              <h1 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Admin Audit Trail</h1>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                Tracks database modifications and content updates logged in compliance with security guidelines.
              </p>

              <PortalSearch 
                placeholder="Search audit trail by administrator or action..."
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                results={filteredItems}
              />

              {filteredItems.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '4px', backgroundColor: 'var(--bg-white)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>No Audit Logs Found</h3>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                    No matching audit records were found in the database.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ backgroundColor: 'var(--bg-white)', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Administrator</th>
                        <th>Action</th>
                        <th>Entity Type</th>
                        <th>Change Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedItems.map(log => (
                        <tr key={log._id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={{ fontWeight: '600' }}>
                            {log.adminId ? log.adminId.fullName : 'System'}
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                              {log.adminId ? log.adminId.email : ''}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--accent-navy-light)',
                              color: 'var(--accent-navy)'
                            }}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.entityType}</td>
                          <td>
                            {log.changes ? formatChanges(log.changes) : <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
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
        </main>
      </div>
    </div>
  );
}

export default AdminPanel;
