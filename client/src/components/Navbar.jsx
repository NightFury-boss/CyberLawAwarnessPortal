import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const PUBLIC_NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Laws', path: '/laws' },
  { label: 'Cyber Crimes', path: '/crimes' },
  { label: 'Case Studies', path: '/cases' },
  { label: 'Prevention', path: '/prevention' },
  { label: 'Resources', path: '/resources' },
  { label: 'About', path: '/about' }
];

function Navbar({ user, setUser, isWorkspace, sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll state for sticky header border/separation
  const [isScrolled, setIsScrolled] = useState(false);

  // Mobile drawer state for public navbar
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Underline indicator position/style
  const [indicatorStyle, setIndicatorStyle] = useState({ opacity: 0 });

  const navRef = useRef(null);
  const mobileTriggerRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Track scroll position to subtly reinforce header border
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Measure and align the animated underline indicator with active nav item
  const updateIndicator = () => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('.public-nav-link.active');
    if (activeEl) {
      setIndicatorStyle({
        transform: `translateX(${activeEl.offsetLeft}px)`,
        width: `${activeEl.offsetWidth}px`,
        opacity: 1
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [location.pathname, isWorkspace]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, []);

  // Accessibility: focus management and escape key listener for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
        mobileTriggerRef.current?.focus();
      }
    };

    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  const isAuthPath = location.pathname === '/login' || location.pathname === '/register';

  // Workspace Page Title mapping
  const getWorkspaceTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/workspace') return 'Progress & Skill Dashboard';
    if (path === '/quizzes') return 'Interactive Knowledge Quizzes';
    if (path === '/assessment/baseline') return 'Baseline Diagnostic Assessment';
    if (path === '/assessment/final') return 'Final Evaluation Assessment';
    if (path === '/workspace/laws') return 'Cyber Laws Index';
    if (path === '/workspace/crimes') return 'Crimes Library & Warnings';
    if (path === '/workspace/cases') return 'Incident Case Studies';
    if (path === '/workspace/prevention') return 'Prevention Center';
    if (path === '/workspace/resources') return 'Official Legal Resources';
    return 'Learner Workspace';
  };

  // ----------------------------------------------------
  // CONTEXT B: WORKSPACE TOPBAR
  // ----------------------------------------------------
  if (isWorkspace) {
    return (
      <header className="workspace-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Mobile hamburger to toggle workspace sidebar drawer */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="workspace-mobile-trigger"
            aria-label={sidebarOpen ? 'Close workspace navigation' : 'Open workspace navigation'}
            aria-expanded={sidebarOpen}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="workspace-breadcrumb">
            <span className="workspace-breadcrumb-prefix">Workspace /</span>
            <span>{getWorkspaceTitle()}</span>
          </div>
        </div>

        <div className="workspace-topbar-actions">
          <Link
            to="/"
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '4px'
            }}
            className="btn-hover-subtle"
            title="Return to Public Educational Portal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Public Portal
          </Link>

          {user && (
            <span className="text-muted workspace-user-welcome" style={{ fontSize: '0.85rem' }}>
              Welcome, <strong>{user.fullName}</strong>
            </span>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin" className="btn btn-secondary">
              Admin Panel
            </Link>
          )}

          <button onClick={handleLogout} className="btn-logout-quiet" aria-label="Log out">
            Logout
          </button>
        </div>
      </header>
    );
  }

  // ----------------------------------------------------
  // CONTEXT A: PUBLIC PORTAL NAVBAR (LEFT-ALIGNED COHESIVE GROUP)
  // ----------------------------------------------------
  return (
    <header className={`top-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="public-navbar-container">
        {/* Left-Aligned Cohesive Group: [LOGO] + [PRIMARY NAVIGATION] */}
        <div className="public-navbar-left">
          <Link to="/" className="public-navbar-brand" aria-label="Cyber Law Awareness Portal Home">
            <img
              src="/logo/cyber-law-logo-horizontal.svg"
              alt="Cyber Law Awareness Portal"
              style={{ height: '34px', width: 'auto' }}
            />
          </Link>

          {/* Desktop Horizontal Navigation */}
          {!isAuthPath && (
            <nav className="public-nav" ref={navRef} aria-label="Public Educational Navigation">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`public-nav-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Understated animated 2px active indicator (derived from location.pathname) */}
              <span className="public-nav-indicator" style={indicatorStyle} aria-hidden="true" />
            </nav>
          )}
        </div>

        {/* Right-Side Actions (Separated by flexible space) */}
        {isAuthPath ? (
          <div className="public-navbar-actions">
            <Link
              to="/"
              className="auth-back-link"
              style={{
                fontSize: '0.88rem',
                color: 'var(--accent-navy)',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              aria-label="Return to Public Educational Portal"
            >
              &larr; Back to Portal
            </Link>
          </div>
        ) : (
          <div className="public-navbar-actions">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="btn btn-secondary"
                >
                  Workspace
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="btn btn-secondary"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-logout-quiet"
                  aria-label="Log out"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-secondary nav-action-login"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary nav-action-register"
                >
                  Start Learning
                </Link>
              </>
            )}

            {/* Mobile Drawer Trigger */}
            <button
              ref={mobileTriggerRef}
              onClick={() => setMobileDrawerOpen(true)}
              className="mobile-menu-trigger"
              aria-label="Open mobile navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Navigation Sheet / Drawer */}
      {mobileDrawerOpen && (
        <>
          <div
            className="mobile-drawer-backdrop"
            onClick={() => {
              setMobileDrawerOpen(false);
              mobileTriggerRef.current?.focus();
            }}
            aria-hidden="true"
          />
          <div
            className="mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Portal Navigation Drawer"
          >
            <div className="mobile-drawer-header">
              <img
                src="/logo/cyber-law-logo-horizontal.svg"
                alt="Cyber Law Awareness Portal"
                style={{ height: '30px', width: 'auto' }}
              />
              <button
                ref={closeBtnRef}
                className="mobile-drawer-close"
                onClick={() => {
                  setMobileDrawerOpen(false);
                  mobileTriggerRef.current?.focus();
                }}
                aria-label="Close navigation menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="mobile-drawer-content">
              {PUBLIC_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`mobile-drawer-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    mobileTriggerRef.current?.focus();
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mobile-drawer-footer">
              {user ? (
                <>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Signed in as <strong>{user.fullName}</strong>
                  </div>
                  <Link
                    to="/dashboard"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Learner Workspace
                  </Link>
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Start Learning
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
