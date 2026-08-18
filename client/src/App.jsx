import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './services/api';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AssistantWidget from './components/AssistantWidget';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Laws from './pages/Laws';
import Crimes from './pages/Crimes';
import Cases from './pages/Cases';
import Prevention from './pages/Prevention';
import Resources from './pages/Resources';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BaselineAssessment from './pages/BaselineAssessment';
import FinalAssessment from './pages/FinalAssessment';
import Quizzes from './pages/Quizzes';
import AdminPanel from './pages/AdminPanel';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressTrigger, setProgressTrigger] = useState(0); // increment to trigger reload
  const location = useLocation();

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

  // Admin layouts are full screen and have no standard header/footer
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isAdminPath && <Navbar user={user} setUser={setUser} />}
      
      <main style={{ flex: 1 }}>
        <Routes>
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

          {/* User Protected Routes */}
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

          {/* Admin Protected Routes */}
          <Route 
            path="/admin" 
            element={user && user.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/login" />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      {!isAdminPath && <Footer />}
      {!isAdminPath && <AssistantWidget />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
