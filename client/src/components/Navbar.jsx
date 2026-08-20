import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

function Navbar({ user, setUser, sidebarOpen, setSidebarOpen }) {
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
          style={{ marginRight: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--accent-navy)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Cyber Law Awareness Portal — Home">
          <img 
            src="/logo/cyber-law-logo-icon.svg" 
            alt="Cyber Law" 
            style={{ height: '28px', width: 'auto' }} 
            className="navbar-brand-icon"
          />
        </Link>
        <span className="header-title" style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-navy)', marginLeft: '4px' }}>
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
