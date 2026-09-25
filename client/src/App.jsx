import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './services/api';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Code-split page route components
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Laws = lazy(() => import('./pages/Laws'));
const Crimes = lazy(() => import('./pages/Crimes'));
const Cases = lazy(() => import('./pages/Cases'));
const Prevention = lazy(() => import('./pages/Prevention'));
const Resources = lazy(() => import('./pages/Resources'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BaselineAssessment = lazy(() => import('./pages/BaselineAssessment'));
const FinalAssessment = lazy(() => import('./pages/FinalAssessment'));
const Quizzes = lazy(() => import('./pages/Quizzes'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function PageLoadingFallback() {
  return (
    <div className="desk-space page-entry" style={{ padding: 'var(--space-xxl) 0', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
        Opening page...
      </p>
    </div>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressTrigger, setProgressTrigger] = useState(0); // increment to trigger reload
  const location = useLocation();

  // Navigation Context Determination
  const isWorkspace = location.pathname === '/dashboard' || 
                      location.pathname === '/quizzes' || 
                      location.pathname.startsWith('/assessment/') ||
                      location.pathname.startsWith('/workspace');
  const isAdminPath = location.pathname.startsWith('/admin');

  // Desktop workspace sidebar collapsed state (persisted during active workspace session)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('workspace_sidebar_collapsed') === 'true';
  });

  // Mobile workspace drawer open state
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // Sync collapsed state to localStorage while in workspace
  useEffect(() => {
    if (isWorkspace) {
      localStorage.setItem('workspace_sidebar_collapsed', sidebarCollapsed ? 'true' : 'false');
    }
  }, [sidebarCollapsed, isWorkspace]);

  // Reset desktop workspace sidebar to expanded whenever leaving Workspace shell (public portal, login, etc.)
  useEffect(() => {
    if (!isWorkspace) {
      setSidebarCollapsed(false);
      localStorage.setItem('workspace_sidebar_collapsed', 'false');
    }
  }, [isWorkspace]);

  // Close mobile drawer on route changes
  useEffect(() => {
    setSidebarMobileOpen(false);
  }, [location.pathname]);

  // Scroll restoration and anchor navigation handler
  useEffect(() => {
    const handleScrollRestoration = () => {
      const hash = location.hash;
      if (hash) {
        const targetId = hash.substring(1);
        let attempts = 0;
        
        const scrollToAnchor = () => {
          const element = document.getElementById(targetId);
          if (element) {
            const header = document.querySelector('.top-header, .workspace-topbar');
            const headerHeight = header ? header.offsetHeight : 64;
            
            element.style.scrollMarginTop = `${headerHeight + 16}px`;
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          } else if (attempts < 10) {
            attempts++;
            requestAnimationFrame(scrollToAnchor);
          }
        };
        requestAnimationFrame(scrollToAnchor);
      } else {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto'
        });
      }
    };

    handleScrollRestoration();
  }, [location.pathname, location.hash]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (api.isAuthenticated()) {
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        // Token stale or invalid
        api.logout();
        setUser(null);
      }
    }
    setLoading(false);
  };

  const triggerProgressUpdate = () => {
    setProgressTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-sans)', color: 'var(--accent-navy)' }}>
        <h3>Loading Portal Environment...</h3>
      </div>
    );
  }

  // Compute main content layout class based on context
  const getContentLayoutClass = () => {
    if (isAdminPath) return '';
    if (!isWorkspace) return 'main-content public-layout';
    return `main-content ${sidebarCollapsed ? 'workspace-collapsed' : 'workspace-expanded'}`;
  };

  return (
    <div className={isAdminPath ? "" : "app-container"}>
      {/* Learner/Admin Workspace Sidebar is mounted only in workspace routes */}
      {!isAdminPath && isWorkspace && (
        <Sidebar 
          user={user} 
          isCollapsed={sidebarCollapsed} 
          setIsCollapsed={setSidebarCollapsed}
          isOpen={sidebarMobileOpen} 
          setIsOpen={setSidebarMobileOpen} 
        />
      )}

      <div className={getContentLayoutClass()} style={{ marginLeft: isAdminPath ? 0 : undefined }}>
        {/* Navbar handles both Public Portal horizontal nav and Workspace Topbar */}
        {!isAdminPath && (
          <Navbar 
            user={user} 
            setUser={setUser} 
            isWorkspace={isWorkspace}
            sidebarOpen={sidebarMobileOpen} 
            setSidebarOpen={setSidebarMobileOpen} 
          />
        )}
        
        <main style={{ flex: 1 }}>
          <div key={location.pathname} className="portal-page-settle">
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes location={location}>
                {/* Public Routes */}
                <Route path="/" element={<Home user={user} />} />
                <Route path="/about" element={<About />} />
                <Route path="/laws" element={<Laws />} />
                <Route path="/crimes" element={<Crimes />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/prevention" element={<Prevention />} />
                <Route path="/resources" element={<Resources />} />
                
                <Route 
                  path="/login" 
                  element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} 
                />
                <Route 
                  path="/register" 
                  element={!user ? <Register setUser={setUser} /> : <Navigate to="/dashboard" />} 
                />

                {/* User Protected Workspace Routes */}
                <Route 
                  path="/dashboard" 
                  element={user ? <Dashboard user={user} progressTrigger={progressTrigger} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/assessment/baseline" 
                  element={user ? <BaselineAssessment user={user} updateProgressTrigger={triggerProgressUpdate} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/assessment/final" 
                  element={user ? <FinalAssessment user={user} updateProgressTrigger={triggerProgressUpdate} /> : <Navigate to="/login" />} 
                />
                <Route 
                  path="/quizzes" 
                  element={user ? <Quizzes user={user} updateProgressTrigger={triggerProgressUpdate} /> : <Navigate to="/login" />} 
                />

                {/* Workspace Contextual Content Routes (Protected within Workspace Shell) */}
                <Route 
                  path="/workspace" 
                  element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
                />
                <Route 
                  path="/workspace/laws" 
                  element={user ? <Laws /> : <Navigate to="/login" replace />} 
                />
                <Route 
                  path="/workspace/crimes" 
                  element={user ? <Crimes /> : <Navigate to="/login" replace />} 
                />
                <Route 
                  path="/workspace/cases" 
                  element={user ? <Cases /> : <Navigate to="/login" replace />} 
                />
                <Route 
                  path="/workspace/prevention" 
                  element={user ? <Prevention /> : <Navigate to="/login" replace />} 
                />
                <Route 
                  path="/workspace/resources" 
                  element={user ? <Resources /> : <Navigate to="/login" replace />} 
                />

                {/* Admin Protected Routes */}
                <Route 
                  path="/admin" 
                  element={user && user.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/login" />} 
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        {!isAdminPath && !isWorkspace && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
