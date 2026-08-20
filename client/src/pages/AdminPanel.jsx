import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, laws, crimes, cases, quizzes, resources, users
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

  // Authentication guard
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEditItem(null);
    setIsAdding(false);
    setFormData({});
    setSuccess('');
    setError('');
  };

  // CRUD actions
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
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
  };

  const handleAddInit = () => {
    setIsAdding(true);
    setEditItem(null);
    setFormData({});
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'laws') {
        // Validate required metadata based on status
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
        // Handle array fields
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
            
            // JSON parsing
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
            // Format array inputs
            legalContext: typeof formData.legalContext === 'string' ? formData.legalContext.split(',').map(s => s.trim()).filter(Boolean) : formData.legalContext,
            relatedCrimes: typeof formData.relatedCrimes === 'string' ? formData.relatedCrimes.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedCrimes,
            relatedModules: typeof formData.relatedModules === 'string' ? formData.relatedModules.split(',').map(s => s.trim()).filter(Boolean) : formData.relatedModules,
            response: typeof formData.response === 'string' ? formData.response.split('\n').filter(Boolean) : formData.response,
            preventionLessons: typeof formData.preventionLessons === 'string' ? formData.preventionLessons.split('\n').filter(Boolean) : formData.preventionLessons,
            attackerObjectives: typeof formData.attackerObjectives === 'string' ? formData.attackerObjectives.split(',').map(s => s.trim()).filter(Boolean) : formData.attackerObjectives,
            
            // JSON fields parsing
            narrativeSections: typeof formData.narrativeSections === 'string' && formData.narrativeSections.trim() ? JSON.parse(formData.narrativeSections) : formData.narrativeSections,
            timeline: typeof formData.timeline === 'string' && formData.timeline.trim() ? JSON.parse(formData.timeline) : formData.timeline,
            decisionPoints: typeof formData.decisionPoints === 'string' && formData.decisionPoints.trim() ? JSON.parse(formData.decisionPoints) : formData.decisionPoints,
            warningSigns: typeof formData.warningSigns === 'string' && formData.warningSigns.trim() ? JSON.parse(formData.warningSigns) : formData.warningSigns,
            sources: typeof formData.sources === 'string' && formData.sources.trim() ? JSON.parse(formData.sources) : formData.sources,
            impact: typeof formData.impact === 'string' && formData.impact.trim() ? JSON.parse(formData.impact) : formData.impact
          };
        } catch (e) {
          throw new Error('Case Study JSON structure contains syntax errors: ' + e.message);
        }
        if (editItem) await api.adminUpdateCase(editItem.id, formatted);
        else await api.adminCreateCase(formatted);
      } else if (activeTab === 'quizzes') {
        const formatted = {
          ...formData,
          options: typeof formData.options === 'string' ? formData.options.split('\n').filter(Boolean) : formData.options,
          correctOptionIndex: parseInt(formData.correctOptionIndex)
        };
        if (editItem) await api.adminUpdateQuiz(editItem.id, formatted);
        else await api.adminCreateQuiz(formatted);
      } else if (activeTab === 'resources') {
        if (editItem) await api.adminUpdateResource(editItem.id, formData);
        else await api.adminCreateResource(formData);
      }

      setSuccess('Item saved successfully!');
      setEditItem(null);
      setIsAdding(false);
      setFormData({});
      fetchAdminData();
    } catch (err) {
      setError(err.message || 'Failed to save form data.');
    }
  };

  return (
    <div className="admin-theme admin-layout">
      {/* Sidebar navigation */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 8px', marginBottom: 'var(--space-lg)' }}>
          <img src="/logo/cyber-law-logo-horizontal.svg" alt="Cyber Law Awareness Portal" style={{ height: '30px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginTop: '8px' }}>
            ADMINISTRATION
          </span>
        </div>
        <ul className="admin-nav">
          <li>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`btn btn-secondary ${activeTab === 'analytics' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'analytics' ? '#1e293b' : 'transparent' }}
            >
              System Analytics
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('users')}
              className={`btn btn-secondary ${activeTab === 'users' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'users' ? '#1e293b' : 'transparent' }}
            >
              Users Progression
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('laws')}
              className={`btn btn-secondary ${activeTab === 'laws' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'laws' ? '#1e293b' : 'transparent' }}
            >
              IT Act Sections
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('crimes')}
              className={`btn btn-secondary ${activeTab === 'crimes' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'crimes' ? '#1e293b' : 'transparent' }}
            >
              Cybercrime Topics
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('cases')}
              className={`btn btn-secondary ${activeTab === 'cases' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'cases' ? '#1e293b' : 'transparent' }}
            >
              Case Studies
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('quizzes')}
              className={`btn btn-secondary ${activeTab === 'quizzes' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'quizzes' ? '#1e293b' : 'transparent' }}
            >
              Quizzes
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('resources')}
              className={`btn btn-secondary ${activeTab === 'resources' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'resources' ? '#1e293b' : 'transparent' }}
            >
              Portal Resources
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('audit')}
              className={`btn btn-secondary ${activeTab === 'audit' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'audit' ? '#1e293b' : 'transparent' }}
            >
              Audit History Logs
            </button>
          </li>
          <li style={{ marginTop: '40px' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ width: '100%' }}>
              &larr; Exit Admin
            </button>
          </li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>{success}</div>}

        {/* Tab 1: Analytics */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <h1 style={{ color: 'white', marginBottom: 'var(--space-lg)', fontFamily: 'var(--font-sans)' }}>System Analytics</h1>
            <div className="dashboard-grid">
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
                <span className="label">Registered Students</span>
                <div className="value" style={{ color: 'white' }}>{analytics.totalUsers}</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
                <span className="label">Avg Baseline Score</span>
                <div className="value" style={{ color: 'white' }}>{analytics.avgBaselineScore}%</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
                <span className="label">Avg Final Score</span>
                <div className="value" style={{ color: 'white' }}>{analytics.avgFinalScore}%</div>
              </div>
              <div className="stat-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
                <span className="label">Avg Improvement</span>
                <div className="value" style={{ color: 'var(--color-success)' }}>+{analytics.avgImprovement} pts</div>
              </div>
            </div>

            <div className="editorial-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Primary Student Vulnerability</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Most common weak assessment area detected across participants: <strong style={{ color: 'var(--color-error)' }}>{analytics.weakestArea}</strong> (failed threshold in {analytics.weakestAreaCount} attempts).
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Users Progression */}
        {activeTab === 'users' && (
          <div>
            <h1 style={{ color: 'white', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Students Tracking</h1>
            <div className="table-wrapper">
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
                  {usersList.map(u => {
                    const delta = (u.finalScore !== null && u.baselineScore !== null) ? (u.finalScore - u.baselineScore) : null;
                    return (
                      <tr key={u.id}>
                        <td>{u.fullName}</td>
                        <td>{u.email}</td>
                        <td>{u.baselineScore !== null ? `${u.baselineScore}%` : '—'}</td>
                        <td>{u.finalScore !== null ? `${u.finalScore}%` : '—'}</td>
                        <td style={{ color: delta !== null ? (delta >= 0 ? 'var(--color-success)' : 'var(--color-error)') : 'inherit' }}>
                          {delta !== null ? `${delta >= 0 ? '+' : ''}${delta}` : '—'}
                        </td>
                        <td>{u.badges.join(', ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRUD Views */}
        {['laws', 'crimes', 'cases', 'quizzes', 'resources'].includes(activeTab) && !isAdding && !editItem && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h1 style={{ color: 'white', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>Manage {activeTab}</h1>
              <button onClick={handleAddInit} className="btn btn-primary">+ Add New Item</button>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  {activeTab === 'laws' && (
                    <tr>
                      <th>Section</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'crimes' && (
                    <tr>
                      <th>Category</th>
                      <th>Title</th>
                      <th>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'cases' && (
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'quizzes' && (
                    <tr>
                      <th>Category</th>
                      <th>Question</th>
                      <th>Actions</th>
                    </tr>
                  )}
                  {activeTab === 'resources' && (
                    <tr>
                      <th>Category</th>
                      <th>Title</th>
                      <th>Actions</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeTab === 'laws' && laws.map(item => (
                    <tr key={item._id || item.id}>
                      <td>{item.sectionNumber}</td>
                      <td>{item.officialTitle}</td>
                      <td>{item.legalStatus}</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item._id || item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'crimes' && crimes.map(item => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{item.title}</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'cases' && cases.map(item => (
                    <tr key={item.id}>
                      <td>{item.incidentType}</td>
                      <td>{item.title}</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'quizzes' && quizzes.map(item => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{item.questionText.substring(0, 50)}...</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'resources' && resources.map(item => (
                    <tr key={item.id}>
                      <td>{item.category}</td>
                      <td>{item.title}</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CRUD Add/Edit Forms */}
        {(isAdding || editItem) && (
          <div className="editorial-card" style={{ backgroundColor: 'var(--bg-white)', border: 'none' }}>
            <h2 style={{ color: 'white', marginBottom: 'var(--space-md)' }}>
              {editItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              {activeTab === 'laws' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    {['overview', 'content', 'metadata', 'connections'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLawFormTab(tab)}
                        style={{
                          backgroundColor: lawFormTab === tab ? '#3b82f6' : '#1e293b',
                          color: 'white',
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
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Section / Provision Identifier</label>
                        <input type="text" name="sectionNumber" className="form-control" placeholder="e.g. Section 66C, DPDP Section 6" value={formData.sectionNumber || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Act Name / Statute</label>
                        <input type="text" name="actName" className="form-control" placeholder="e.g. Information Technology Act, 2000" value={formData.actName || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Official Title</label>
                        <input type="text" name="officialTitle" className="form-control" placeholder="e.g. Punishment for identity theft" value={formData.officialTitle || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Legal Role / Classification</label>
                        <select name="role" className="form-control" value={formData.role || 'Core Cyber Law'} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }}>
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
                        <label style={{ color: 'white' }}>Legal Status</label>
                        <select name="legalStatus" className="form-control" value={formData.legalStatus || 'CURRENT'} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }}>
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
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Official Source reference</label>
                        <select name="officialSourceId" className="form-control" value={formData.officialSourceId || ''} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }} required>
                          <option value="">-- Select Source --</option>
                          {getAvailableSources().map(src => (
                            <option key={src._id || src.id} value={src._id || src.id}>
                              {src.title} ({src.authority})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {lawFormTab === 'content' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Plain Language Explanation</label>
                        <textarea name="plainLanguageExplanation" className="form-control" style={{ minHeight: '80px' }} value={formData.plainLanguageExplanation || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Official statutory draft text</label>
                        <textarea name="officialText" className="form-control" style={{ minHeight: '120px', fontFamily: 'monospace' }} value={formData.officialText || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Why It Matters to users</label>
                        <textarea name="whyItMatters" className="form-control" value={formData.whyItMatters || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Everyday Example scenario</label>
                        <textarea name="exampleScenario" className="form-control" value={formData.exampleScenario || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Statutory Penalty / legal effect</label>
                        <input type="text" name="penaltyOrLegalEffect" className="form-control" value={formData.penaltyOrLegalEffect || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {lawFormTab === 'metadata' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Commencement Status notes</label>
                        <input type="text" name="commencementStatus" className="form-control" placeholder="e.g. Staggered commencement pending notification." value={formData.commencementStatus || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Amendment Status notes</label>
                        <input type="text" name="amendmentStatus" className="form-control" placeholder="e.g. Struck down in Shreya Singhal (2015)." value={formData.amendmentStatus || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Search Keywords (comma separated list)</label>
                        <input type="text" name="keywords" className="form-control" placeholder="e.g. privacy, leak, bank PIN" value={Array.isArray(formData.keywords) ? formData.keywords.join(', ') : formData.keywords || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {lawFormTab === 'connections' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Related Cybercrimes (comma separated list)</label>
                        <input type="text" name="relatedCyberCrimes" className="form-control" placeholder="e.g. identity-theft, phishing" value={Array.isArray(formData.relatedCyberCrimes) ? formData.relatedCyberCrimes.join(', ') : formData.relatedCyberCrimes || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Related Case Study Slugs (comma separated)</label>
                        <input type="text" name="relatedCaseStudies" className="form-control" placeholder="e.g. digital-arrest-impersonation" value={Array.isArray(formData.relatedCaseStudies) ? formData.relatedCaseStudies.join(', ') : formData.relatedCaseStudies || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Related Module Slugs (comma separated)</label>
                        <input type="text" name="relatedModules" className="form-control" value={Array.isArray(formData.relatedModules) ? formData.relatedModules.join(', ') : formData.relatedModules || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'crimes' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    {['overview', 'timeline', 'tactics', 'games'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCrimeFormTab(tab)}
                        style={{
                          backgroundColor: crimeFormTab === tab ? '#3b82f6' : '#1e293b',
                          color: 'white',
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
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Title</label>
                        <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Slug (lowercase, hyphens instead of spaces)</label>
                        <input type="text" name="slug" className="form-control" value={formData.slug || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Category Name</label>
                        <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Short Description</label>
                        <input type="text" name="shortDescription" className="form-control" value={formData.shortDescription || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Risk Level</label>
                        <select name="redFlagLevel" className="form-control" value={formData.redFlagLevel || 'High'} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }}>
                          <option value="Low">Low</option>
                          <option value="Moderate">Moderate</option>
                          <option value="High">High</option>
                          <option value="Very High">Very High</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>What is it?</label>
                        <textarea name="whatIsIt" className="form-control" value={formData.whatIsIt || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>How does it work?</label>
                        <textarea name="howItWorks" className="form-control" value={formData.howItWorks || ''} onChange={handleFormChange} required />
                      </div>
                    </>
                  )}

                  {crimeFormTab === 'timeline' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Warning Signs (one per line)</label>
                        <textarea name="warningSigns" className="form-control" value={Array.isArray(formData.warningSigns) ? formData.warningSigns.join('\n') : formData.warningSigns || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>What You Should Do (one per line)</label>
                        <textarea name="actionSteps" className="form-control" value={Array.isArray(formData.actionSteps) ? formData.actionSteps.join('\n') : formData.actionSteps || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>What You Should Avoid (one per line)</label>
                        <textarea name="avoidSteps" className="form-control" value={Array.isArray(formData.avoidSteps) ? formData.avoidSteps.join('\n') : formData.avoidSteps || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>If Targeted Steps (one per line)</label>
                        <textarea name="ifTargetedSteps" className="form-control" value={Array.isArray(formData.ifTargetedSteps) ? formData.ifTargetedSteps.join('\n') : formData.ifTargetedSteps || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {crimeFormTab === 'tactics' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attacker Objectives (comma-separated list)</label>
                        <input type="text" name="attackerObjective" className="form-control" placeholder="Money, Credentials, Identity" value={Array.isArray(formData.attackerObjective) ? formData.attackerObjective.join(', ') : formData.attackerObjective || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attack Vectors (comma-separated list)</label>
                        <input type="text" name="attackVectors" className="form-control" placeholder="Email, SMS, Phone" value={Array.isArray(formData.attackVectors) ? formData.attackVectors.join(', ') : formData.attackVectors || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Legal Context (comma separated sections)</label>
                        <input type="text" name="legalContext" className="form-control" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attack Lifecycle (JSON Format)</label>
                        <textarea name="attackLifecycle" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"stepNumber":1,"label":"Contact","description":"..."}]' value={typeof formData.attackLifecycle === 'string' ? formData.attackLifecycle : JSON.stringify(formData.attackLifecycle, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attacker Tactics (JSON Format)</label>
                        <textarea name="attackerTactics" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"tactic":"Urgency","example":"...","whyItWorks":"..."}]' value={typeof formData.attackerTactics === 'string' ? formData.attackerTactics : JSON.stringify(formData.attackerTactics, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {crimeFormTab === 'games' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Spot the Flags Game Config (JSON Format)</label>
                        <textarea name="spotTheFlags" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='{"messageType":"Email","messageText":"...","clickableFlags":[{"textSegment":"...","flagName":"...","explanation":"..."}]}' value={typeof formData.spotTheFlags === 'string' ? formData.spotTheFlags : JSON.stringify(formData.spotTheFlags, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>What Would You Do Decision Game (JSON Format)</label>
                        <textarea name="whatWouldYouDo" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='{"questionText":"...","options":[{"optionText":"...","isCorrect":true,"explanation":"..."}]}' value={typeof formData.whatWouldYouDo === 'string' ? formData.whatWouldYouDo : JSON.stringify(formData.whatWouldYouDo, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Quick Check Questions (JSON Format)</label>
                        <textarea name="quickCheckQuestions" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"questionText":"...","options":["..."],"correctOptionIndex":0,"explanation":"..."}]' value={typeof formData.quickCheckQuestions === 'string' ? formData.quickCheckQuestions : JSON.stringify(formData.quickCheckQuestions, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Myths & Facts (JSON Format)</label>
                        <textarea name="mythFacts" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"myth":"...","fact":"..."}]' value={typeof formData.mythFacts === 'string' ? formData.mythFacts : JSON.stringify(formData.mythFacts, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'cases' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    {['overview', 'story', 'timeline', 'legal'].map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCaseFormTab(tab)}
                        style={{
                          backgroundColor: caseFormTab === tab ? '#3b82f6' : '#1e293b',
                          color: 'white',
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
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Title</label>
                        <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Slug (lowercase, hyphens instead of spaces)</label>
                        <input type="text" name="slug" className="form-control" value={formData.slug || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Case Reference ID</label>
                        <input type="text" name="caseNumber" className="form-control" placeholder="e.g. CASE FILE 001" value={formData.caseNumber || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Case Type</label>
                        <select name="caseType" className="form-control" value={formData.caseType || 'documented-case'} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }}>
                          <option value="documented-case">Documented Case</option>
                          <option value="educational-reconstruction">Educational Reconstruction</option>
                          <option value="anonymized-incident">Anonymized Incident</option>
                          <option value="fictional-training-scenario">Fictional Training Scenario</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Incident Type (Category)</label>
                        <input type="text" name="incidentType" className="form-control" placeholder="e.g. Phishing, Job Scams, Vishing" value={formData.incidentType || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attack Method</label>
                        <input type="text" name="attackVector" className="form-control" placeholder="e.g. Email, WhatsApp, SMS, Phone" value={formData.attackVector || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Difficulty (Ability to Spot)</label>
                        <select name="difficulty" className="form-control" value={formData.difficulty || 'Beginner'} onChange={handleFormChange} style={{ backgroundColor: '#1e293b', color: 'white' }}>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Featured Editorial Case</label>
                        <select name="featured" className="form-control" value={formData.featured ? 'true' : 'false'} onChange={(e) => handleFormChange({ target: { name: 'featured', value: e.target.value === 'true' } })} style={{ backgroundColor: '#1e293b', color: 'white' }}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Short Teaser Description</label>
                        <textarea name="shortDescription" className="form-control" value={formData.shortDescription || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Source Summary</label>
                        <input type="text" name="sourceSummary" className="form-control" placeholder="Brief review/ethics statement" value={formData.sourceSummary || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {caseFormTab === 'story' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Narrative Sections (JSON Format)</label>
                        <textarea name="narrativeSections" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"heading":"The Unexpected Contact","body":"..."}]' value={typeof formData.narrativeSections === 'string' ? formData.narrativeSections : JSON.stringify(formData.narrativeSections, null, 2) || ''} onChange={handleFormChange} required />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Impact Categories (JSON Format)</label>
                        <textarea name="impact" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='{"financial":"...","account":"...","privacy":"...","operational":"..."}' value={typeof formData.impact === 'string' ? formData.impact : JSON.stringify(formData.impact, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Response Actions (one per line)</label>
                        <textarea name="response" className="form-control" value={Array.isArray(formData.response) ? formData.response.join('\n') : formData.response || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {caseFormTab === 'timeline' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Incident Timeline (JSON Format)</label>
                        <textarea name="timeline" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"time":"10:00 AM","label":"Email Received","description":"...","type":"contact"}]' value={typeof formData.timeline === 'string' ? formData.timeline : JSON.stringify(formData.timeline, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Decision Point Widgets (JSON Format)</label>
                        <textarea name="decisionPoints" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"questionText":"...","options":[{"optionText":"...","isCorrect":true,"explanation":"..."}]}]' value={typeof formData.decisionPoints === 'string' ? formData.decisionPoints : JSON.stringify(formData.decisionPoints, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Warning Signs Audit (JSON Format)</label>
                        <textarea name="warningSigns" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"title":"...","explanation":"..."}]' value={typeof formData.warningSigns === 'string' ? formData.warningSigns : JSON.stringify(formData.warningSigns, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}

                  {caseFormTab === 'legal' && (
                    <>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Legal Context (comma separated sections)</label>
                        <input type="text" name="legalContext" className="form-control" placeholder="e.g. Section 66D, Section 66C" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Attacker Objectives (comma-separated list)</label>
                        <input type="text" name="attackerObjectives" className="form-control" placeholder="e.g. Credentials, Money, Identity" value={Array.isArray(formData.attackerObjectives) ? formData.attackerObjectives.join(', ') : formData.attackerObjectives || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Related Crimes (comma separated slugs)</label>
                        <input type="text" name="relatedCrimes" className="form-control" placeholder="e.g. phishing, vishing" value={Array.isArray(formData.relatedCrimes) ? formData.relatedCrimes.join(', ') : formData.relatedCrimes || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Related Modules (comma separated slugs)</label>
                        <input type="text" name="relatedModules" className="form-control" value={Array.isArray(formData.relatedModules) ? formData.relatedModules.join(', ') : formData.relatedModules || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Prevention Lessons (one per line)</label>
                        <textarea name="preventionLessons" className="form-control" value={Array.isArray(formData.preventionLessons) ? formData.preventionLessons.join('\n') : formData.preventionLessons || ''} onChange={handleFormChange} />
                      </div>
                      <div className="form-group">
                        <label style={{ color: 'white' }}>Official Sources (JSON Format)</label>
                        <textarea name="sources" className="form-control" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder='[{"title":"...","authority":"...","url":"...","sourceType":"official"}]' value={typeof formData.sources === 'string' ? formData.sources : JSON.stringify(formData.sources, null, 2) || ''} onChange={handleFormChange} />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'quizzes' && (
                <>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Question Text</label>
                    <textarea name="questionText" className="form-control" value={formData.questionText || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Options (one per line)</label>
                    <textarea name="options" className="form-control" value={Array.isArray(formData.options) ? formData.options.join('\n') : formData.options || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Correct Option Index (0-based)</label>
                    <input type="number" name="correctOptionIndex" min="0" max="4" className="form-control" value={formData.correctOptionIndex === undefined ? '' : formData.correctOptionIndex} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Answer Explanation</label>
                    <textarea name="explanation" className="form-control" value={formData.explanation || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select name="difficulty" className="form-control" value={formData.difficulty || 'Easy'} onChange={handleFormChange}>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Related Law Section</label>
                    <input type="text" name="relatedLawSection" className="form-control" value={formData.relatedLawSection || ''} onChange={handleFormChange} />
                  </div>
                </>
              )}

              {activeTab === 'resources' && (
                <>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" className="form-control" value={formData.description || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Link / URL</label>
                    <input type="text" name="link" className="form-control" value={formData.link || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" name="downloadable" id="downloadable" checked={formData.downloadable || false} onChange={handleFormChange} />
                    <label htmlFor="downloadable" style={{ margin: 0 }}>Is Downloadable Document</label>
                  </div>
                </>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditItem(null);
                    setFormData({});
                  }}
                  className="btn btn-secondary"
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
            <h1 style={{ color: 'white', marginBottom: 'var(--space-md)', fontFamily: 'var(--font-sans)' }}>Admin Audit Trail</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
              Tracks database modifications and content updates logged in compliance with security guidelines.
            </p>
            <div className="table-wrapper">
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
                  {auditLogs.map(log => (
                    <tr key={log._id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.adminId ? log.adminId.fullName : 'System'} ({log.adminId ? log.adminId.email : ''})</td>
                      <td style={{ color: 'var(--color-success)', fontWeight: '600' }}>{log.action}</td>
                      <td>{log.entityType}</td>
                      <td>
                        {log.changes ? (
                          <pre style={{ margin: 0, padding: '4px', fontSize: '0.75rem', backgroundColor: '#0f172a', color: '#94a3b8', borderRadius: '4px', overflowX: 'auto', maxWidth: '300px' }}>
                            {JSON.stringify(log.changes, null, 2)}
                          </pre>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPanel;
