import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, laws, crimes, cases, quizzes, resources, users
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  
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
        if (editItem) await api.adminUpdateLaw(editItem.id, formData);
        else await api.adminCreateLaw(formData);
      } else if (activeTab === 'crimes') {
        // Handle array fields
        const formatted = {
          ...formData,
          warningSigns: typeof formData.warningSigns === 'string' ? formData.warningSigns.split('\n').filter(Boolean) : formData.warningSigns,
          actionSteps: typeof formData.actionSteps === 'string' ? formData.actionSteps.split('\n').filter(Boolean) : formData.actionSteps,
          avoidSteps: typeof formData.avoidSteps === 'string' ? formData.avoidSteps.split('\n').filter(Boolean) : formData.avoidSteps,
          legalContext: typeof formData.legalContext === 'string' ? formData.legalContext.split(',').map(s => s.trim()).filter(Boolean) : formData.legalContext
        };
        if (editItem) await api.adminUpdateCrime(editItem.id, formatted);
        else await api.adminCreateCrime(formatted);
      } else if (activeTab === 'cases') {
        const formatted = {
          ...formData,
          warningSigns: typeof formData.warningSigns === 'string' ? formData.warningSigns.split('\n').filter(Boolean) : formData.warningSigns,
          preventionTips: typeof formData.preventionTips === 'string' ? formData.preventionTips.split('\n').filter(Boolean) : formData.preventionTips,
          legalContext: typeof formData.legalContext === 'string' ? formData.legalContext.split(',').map(s => s.trim()).filter(Boolean) : formData.legalContext
        };
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
        <h2>🔧 Admin Controls</h2>
        <ul className="admin-nav">
          <li>
            <button
              onClick={() => handleTabChange('analytics')}
              className={`btn btn-secondary ${activeTab === 'analytics' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'analytics' ? '#1e293b' : 'transparent' }}
            >
              📊 System Analytics
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('users')}
              className={`btn btn-secondary ${activeTab === 'users' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'users' ? '#1e293b' : 'transparent' }}
            >
              👤 Users Progression
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('laws')}
              className={`btn btn-secondary ${activeTab === 'laws' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'laws' ? '#1e293b' : 'transparent' }}
            >
              ⚖️ IT Act Sections
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('crimes')}
              className={`btn btn-secondary ${activeTab === 'crimes' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'crimes' ? '#1e293b' : 'transparent' }}
            >
              🔒 Cybercrime Topics
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('cases')}
              className={`btn btn-secondary ${activeTab === 'cases' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'cases' ? '#1e293b' : 'transparent' }}
            >
              🔍 Case Studies
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('quizzes')}
              className={`btn btn-secondary ${activeTab === 'quizzes' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'quizzes' ? '#1e293b' : 'transparent' }}
            >
              ⚡ Quizzes
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('resources')}
              className={`btn btn-secondary ${activeTab === 'resources' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'resources' ? '#1e293b' : 'transparent' }}
            >
              🔗 Portal Resources
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange('audit')}
              className={`btn btn-secondary ${activeTab === 'audit' ? 'active' : ''}`}
              style={{ width: '100%', textAlign: 'left', border: 'none', color: 'white', backgroundColor: activeTab === 'audit' ? '#1e293b' : 'transparent' }}
            >
              📋 Audit History Logs
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
              <h3 style={{ color: 'white', marginBottom: '10px' }}>💡 Primary Student Vulnerability</h3>
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
                    <tr key={item.id}>
                      <td>{item.section}</td>
                      <td>{item.title}</td>
                      <td>{item.status}</td>
                      <td>
                        <button onClick={() => handleEditInit(item)} className="btn btn-secondary" style={{ marginRight: '8px', padding: '4px 8px', fontSize: '0.75rem' }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Delete</button>
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
                  <div className="form-group">
                    <label>Section Number</label>
                    <input type="text" name="section" className="form-control" value={formData.section || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Official Title</label>
                    <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Explanation</label>
                    <textarea name="explanation" className="form-control" style={{ minHeight: '100px' }} value={formData.explanation || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Why It Matters</label>
                    <textarea name="whyItMatters" className="form-control" value={formData.whyItMatters || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Example Scenario</label>
                    <textarea name="scenario" className="form-control" value={formData.scenario || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Penalty/Impact</label>
                    <input type="text" name="penalty" className="form-control" value={formData.penalty || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select name="status" className="form-control" value={formData.status || 'current'} onChange={handleFormChange}>
                      <option value="current">Active</option>
                      <option value="omitted">Omitted</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Official Source link</label>
                    <input type="text" name="officialSourceLink" className="form-control" value={formData.officialSourceLink || ''} onChange={handleFormChange} />
                  </div>
                </>
              )}

              {activeTab === 'crimes' && (
                <>
                  <div className="form-group">
                    <label>Category Name</label>
                    <input type="text" name="category" className="form-control" value={formData.category || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>What is it?</label>
                    <textarea name="whatIsIt" className="form-control" value={formData.whatIsIt || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>How does it work?</label>
                    <textarea name="howItWorks" className="form-control" value={formData.howItWorks || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Warning Signs (one per line)</label>
                    <textarea name="warningSigns" className="form-control" value={Array.isArray(formData.warningSigns) ? formData.warningSigns.join('\n') : formData.warningSigns || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>What You Should Do (one per line)</label>
                    <textarea name="actionSteps" className="form-control" value={Array.isArray(formData.actionSteps) ? formData.actionSteps.join('\n') : formData.actionSteps || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>What You Should Avoid (one per line)</label>
                    <textarea name="avoidSteps" className="form-control" value={Array.isArray(formData.avoidSteps) ? formData.avoidSteps.join('\n') : formData.avoidSteps || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Legal Context (comma separated sections)</label>
                    <input type="text" name="legalContext" className="form-control" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                  </div>
                </>
              )}

              {activeTab === 'cases' && (
                <>
                  <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" className="form-control" value={formData.title || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Attack/Incident Type</label>
                    <input type="text" name="incidentType" className="form-control" value={formData.incidentType || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Incident Details</label>
                    <textarea name="incidentDescription" className="form-control" value={formData.incidentDescription || ''} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label>Victim Impact</label>
                    <textarea name="victimImpact" className="form-control" value={formData.victimImpact || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Warning Signs (one per line)</label>
                    <textarea name="warningSigns" className="form-control" value={Array.isArray(formData.warningSigns) ? formData.warningSigns.join('\n') : formData.warningSigns || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Prevention Tips (one per line)</label>
                    <textarea name="preventionTips" className="form-control" value={Array.isArray(formData.preventionTips) ? formData.preventionTips.join('\n') : formData.preventionTips || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Lessons Learned</label>
                    <input type="text" name="lessonsLearned" className="form-control" value={formData.lessonsLearned || ''} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label>Legal Context (comma separated sections)</label>
                    <input type="text" name="legalContext" className="form-control" value={Array.isArray(formData.legalContext) ? formData.legalContext.join(', ') : formData.legalContext || ''} onChange={handleFormChange} />
                  </div>
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
