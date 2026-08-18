import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.logout();
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <Link to="/" className="brand">
          ⚖️ Cyber Law Awareness
        </Link>
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/')}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about')}>
              About
            </Link>
          </li>
          <li>
            <Link to="/laws" className={isActive('/laws')}>
              Cyber Laws
            </Link>
          </li>
          <li>
            <Link to="/crimes" className={isActive('/crimes')}>
              Crimes Library
            </Link>
          </li>
          <li>
            <Link to="/cases" className={isActive('/cases')}>
              Case Studies
            </Link>
          </li>
          <li>
            <Link to="/prevention" className={isActive('/prevention')}>
              Prevention Center
            </Link>
          </li>
          <li>
            <Link to="/resources" className={isActive('/resources')}>
              Resources
            </Link>
          </li>
          {user ? (
            <>
              <li>
                <Link to="/dashboard" className={isActive('/dashboard')}>
                  Dashboard
                </Link>
              </li>
              {user.role === 'admin' && (
                <li>
                  <Link to="/admin" className="btn btn-secondary">
                    Admin panel
                  </Link>
                </li>
              )}
              <li>
                <button onClick={handleLogout} className="btn btn-danger">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="btn btn-primary">
                  Start Learning
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
