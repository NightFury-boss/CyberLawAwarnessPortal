import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ user, isCollapsed, setIsCollapsed, isOpen, setIsOpen }) {
  const location = useLocation();
  const firstLinkRef = useRef(null);

  // Focus management when opening mobile drawer
  useEffect(() => {
    if (isOpen && window.innerWidth <= 768) {
      firstLinkRef.current?.focus();
    }
  }, [isOpen]);

  // Escape key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile drawer backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="workspace-sidebar"
        className={`workspace-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isOpen ? 'mobile-open' : ''}`}
        aria-label="Workspace Navigation"
      >
        {/* Workspace Brand / Header */}
        <div className="workspace-sidebar-brand">
          <Link
            to="/dashboard"
            ref={firstLinkRef}
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', overflow: 'hidden' }}
            aria-label="Workspace Dashboard"
            onClick={handleLinkClick}
          >
            {isCollapsed ? (
              <img
                src="/logo/cyber-law-logo-icon.svg"
                alt="CL"
                style={{ height: '30px', width: 'auto' }}
              />
            ) : (
              <img
                src="/logo/cyber-law-logo-horizontal.svg"
                alt="Cyber Law Awareness Portal"
                style={{ height: '32px', width: 'auto' }}
              />
            )}
          </Link>

          {/* Close button visible only on mobile screens */}
          <button
            className="workspace-mobile-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close workspace navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <nav className="workspace-sidebar-nav">
          <div className="workspace-nav-section-title">Learner Workspace</div>

          <Link
            to="/dashboard"
            className={`workspace-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            data-tooltip="Dashboard"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </span>
            <span className="workspace-nav-label">Dashboard</span>
          </Link>

          <Link
            to="/quizzes"
            className={`workspace-nav-link ${isActive('/quizzes') ? 'active' : ''}`}
            data-tooltip="Knowledge Quizzes"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
            </span>
            <span className="workspace-nav-label">Quizzes</span>
          </Link>

          <Link
            to="/assessment/baseline"
            className={`workspace-nav-link ${isActive('/assessment/baseline') ? 'active' : ''}`}
            data-tooltip="Baseline Assessment"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
              </svg>
            </span>
            <span className="workspace-nav-label">Baseline Assessment</span>
          </Link>

          <Link
            to="/assessment/final"
            className={`workspace-nav-link ${isActive('/assessment/final') ? 'active' : ''}`}
            data-tooltip="Final Assessment"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
              </svg>
            </span>
            <span className="workspace-nav-label">Final Assessment</span>
          </Link>

          <div className="workspace-nav-divider" />
          <div className="workspace-nav-section-title">Legal Library</div>

          <Link
            to="/workspace/laws"
            className={`workspace-nav-link ${isActive('/workspace/laws') ? 'active' : ''}`}
            data-tooltip="Cyber Laws"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </span>
            <span className="workspace-nav-label">Cyber Laws</span>
          </Link>

          <Link
            to="/workspace/crimes"
            className={`workspace-nav-link ${isActive('/workspace/crimes') ? 'active' : ''}`}
            data-tooltip="Cyber Crimes"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </span>
            <span className="workspace-nav-label">Cyber Crimes</span>
          </Link>

          <Link
            to="/workspace/cases"
            className={`workspace-nav-link ${isActive('/workspace/cases') ? 'active' : ''}`}
            data-tooltip="Case Studies"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </span>
            <span className="workspace-nav-label">Case Studies</span>
          </Link>

          <Link
            to="/workspace/prevention"
            className={`workspace-nav-link ${isActive('/workspace/prevention') ? 'active' : ''}`}
            data-tooltip="Prevention Center"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
            <span className="workspace-nav-label">Prevention</span>
          </Link>

          <Link
            to="/workspace/resources"
            className={`workspace-nav-link ${isActive('/workspace/resources') ? 'active' : ''}`}
            data-tooltip="Resources"
            onClick={handleLinkClick}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span className="workspace-nav-label">Resources</span>
          </Link>

          <div className="workspace-nav-divider" />

          <Link
            to="/"
            className="workspace-nav-link"
            data-tooltip="Return to Public Portal"
            onClick={() => {
              setIsCollapsed(false);
              handleLinkClick();
            }}
          >
            <span className="workspace-nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </span>
            <span className="workspace-nav-label">Public Portal</span>
          </Link>
        </nav>

        {/* Explicit Collapse / Expand Button (Desktop) */}
        <div className="workspace-sidebar-footer">
          <button
            className="workspace-collapse-btn"
            onClick={() => setIsCollapsed(prev => !prev)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isCollapsed}
            data-tooltip={isCollapsed ? 'Expand Sidebar' : undefined}
          >
            {isCollapsed ? (
              <span className="workspace-nav-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </span>
            ) : (
              <>
                <span className="workspace-nav-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </span>
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
