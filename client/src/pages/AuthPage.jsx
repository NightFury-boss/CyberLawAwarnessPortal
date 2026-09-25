import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthIdentityPanel from '../components/auth/AuthIdentityPanel';
import LearningPathVisual from '../components/auth/LearningPathVisual';
import SignInForm from '../components/auth/SignInForm';
import SignUpForm from '../components/auth/SignUpForm';

/**
 * AuthPage Component
 * 
 * Production-ready unified authentication experience.
 * Orchestrates Sign In and Sign Up in a restrained, editorial split layout.
 * 
 * Key mandates:
 * - Editorial, calm, trustworthy, educational aesthetic.
 * - Restrained split layout: Identity/Learning Path on left, Form on right.
 * - Top navigation escape "← Back to Portal".
 * - Seamless mode switching without jarring page refreshes or broken URL history.
 * - Dedicated responsive arrangement for mobile (390x844, 375x667).
 */
function AuthPage({ initialMode = 'signin', setUser }) {
  const [mode, setMode] = useState(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  // Keep internal mode synchronized with route if user uses browser Back/Forward
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('signup');
    } else if (location.pathname === '/login') {
      setMode('signin');
    }
  }, [location.pathname]);

  const handleSwitchToSignUp = () => {
    setMode('signup');
    navigate('/register', { replace: true });
  };

  const handleSwitchToSignIn = () => {
    setMode('signin');
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-page-root">
      {/* Main Split Layout Container */}
      <div className="auth-layout-container">
        {/* Mobile Header: Compact methodology flow on small viewports */}
        <div className="auth-mobile-header">
          <p className="auth-mobile-tagline">
            Knowing the law is only the beginning.
          </p>
          <LearningPathVisual isCompact={true} />
        </div>

        <div className="auth-split-grid">
          {/* LEFT: Identity & Learning Path Panel (Desktop) */}
          <AuthIdentityPanel />

          {/* RIGHT: Primary Authentication Task Card */}
          <main className="auth-task-card-wrapper" role="main">
            <div className="auth-task-card">
              {mode === 'signin' ? (
                <div 
                  key="signin-view" 
                  className="auth-mode-transition-panel"
                >
                  <SignInForm 
                    setUser={setUser} 
                    onSwitchToSignUp={handleSwitchToSignUp} 
                  />
                </div>
              ) : (
                <div 
                  key="signup-view" 
                  className="auth-mode-transition-panel"
                >
                  <SignUpForm 
                    setUser={setUser} 
                    onSwitchToSignIn={handleSwitchToSignIn} 
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
