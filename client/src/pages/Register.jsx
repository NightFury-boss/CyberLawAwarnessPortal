import React from 'react';
import AuthPage from './AuthPage';

/**
 * Register Page
 * 
 * Renders the unified authentication experience in 'signup' mode.
 * Preserves the /register route contract and authentication state dispatcher.
 */
function Register({ setUser }) {
  return <AuthPage initialMode="signup" setUser={setUser} />;
}

export default Register;
