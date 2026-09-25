import React from 'react';
import AuthPage from './AuthPage';

/**
 * Login Page
 * 
 * Renders the unified authentication experience in 'signin' mode.
 * Preserves the /login route contract and authentication state dispatcher.
 */
function Login({ setUser }) {
  return <AuthPage initialMode="signin" setUser={setUser} />;
}

export default Login;
