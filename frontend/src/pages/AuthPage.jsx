import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginAccount, registerAccount } from '../services/api';

export default function AuthPage({ onAuthenticated, initialError = '' }) {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const isAdminLogin = location.pathname === '/admin/login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (initialError) setError(initialError); }, [initialError]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isRegister) {
        const passwordBytes = new TextEncoder().encode(password).length;
        if (passwordBytes < 12 || passwordBytes > 128) {
          setError('Password must be 12 to 128 bytes long.');
          setBusy(false);
          return;
        }
      }
      const normalizedEmail = email.trim().toLowerCase();
      const user = isRegister
        ? await registerAccount(normalizedEmail, password)
        : await loginAccount(normalizedEmail, password, { admin: isAdminLogin });
      onAuthenticated(user);
    } catch (requestError) {
      setError(requestError.message || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-brand"><span className="auth-brand-mark">UP</span><span>UrbanPulse</span></div>
        <p className="auth-eyebrow">CITY INFRASTRUCTURE INTELLIGENCE</p>
        <h1 id="auth-title">{isRegister ? 'Create your citizen account' : isAdminLogin ? 'Administrator sign in' : 'Welcome back'}</h1>
        <p className="auth-intro">{isRegister
          ? 'Report civic issues and follow their progress.'
          : isAdminLogin
            ? 'Use an administrator account provisioned by an authorized operator. Access is verified by the server.'
            : 'Sign in to report civic issues and follow the reports associated with your account.'}</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          {isRegister && <p className="auth-hint">Use at least 12 characters. Accounts are created with citizen access.</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already registered?' : isAdminLogin ? 'Citizen account?' : 'New to UrbanPulse?'}{' '}
          <Link to={isRegister || isAdminLogin ? '/login' : '/register'}>{isRegister || isAdminLogin ? 'Sign in' : 'Create a citizen account'}</Link>
        </p>
        {!isRegister && <p className="auth-switch">
          {isAdminLogin ? 'Looking for citizen sign in?' : 'Administrator account?'}{' '}
          <Link to={isAdminLogin ? '/login' : '/admin/login'}>{isAdminLogin ? 'Citizen sign in' : 'Administrator sign in'}</Link>
        </p>}
      </section>
    </main>
  );
}
