import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ user, isOpen, setIsOpen }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 'var(--space-xl)', color: 'var(--accent-navy)' }}>
        🛡️ Cyber Law Portal
      </div>
      <nav className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <Link to="/" className={isActive('/')} onClick={() => setIsOpen(false)}>
          Home
        </Link>
        <Link to="/laws" className={isActive('/laws')} onClick={() => setIsOpen(false)}>
          Cyber Laws
        </Link>
        <Link to="/crimes" className={isActive('/crimes')} onClick={() => setIsOpen(false)}>
          Crimes Library
        </Link>
        <Link to="/cases" className={isActive('/cases')} onClick={() => setIsOpen(false)}>
          Case Studies
        </Link>
        <Link to="/prevention" className={isActive('/prevention')} onClick={() => setIsOpen(false)}>
          Prevention Center
        </Link>
        <Link to="/resources" className={isActive('/resources')} onClick={() => setIsOpen(false)}>
          Resources
        </Link>
        <Link to="/about" className={isActive('/about')} onClick={() => setIsOpen(false)}>
          About
        </Link>
        {user && (
          <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setIsOpen(false)}>
            Dashboard
          </Link>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
