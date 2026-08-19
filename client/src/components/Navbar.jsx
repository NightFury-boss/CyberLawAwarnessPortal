import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

function Navbar({ user, setUser, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Home Portal';
    if (path === '/laws') return 'Cyber Laws Registry';
    if (path === '/crimes') return 'Crimes Library & Warnings';
    if (path === '/cases') return 'Incident Case Studies';
    if (path === '/prevention') return 'Prevention Center';
    if (path === '/resources') return 'Official Legal Resources';
    if (path === '/about') return 'About the Project';
    if (path === '/dashboard') return 'User Progress Dashboard';
    if (path === '/quizzes') return 'Interactive Quiz Center';
    if (path.startsWith('/assessment/')) return 'Cyber Awareness Assessment';
    return 'Cyber Awareness System';
  };

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <button 
          onClick={() => setSidebarOpen(prev => !prev)} 
          className="sidebar-toggle"
          title="Toggle Navigation Menu"
          style={{ marginRight: '8px' }}
        >
          ☰
        </button>
        <span className="header-title" style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-navy)' }}>
          {getPageTitle()}
        </span>
      </div>

      <div className="auth-links" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {user ? (
          <>
            <span className="text-muted" style={{ fontSize: '0.85rem', marginRight: '4px' }}>
              Welcome, <strong>{user.fullName}</strong>
            </span>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                Admin Panel
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              Login
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>
              Start Learning
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
