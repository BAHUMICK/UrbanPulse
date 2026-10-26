import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginAccount, registerAccount } from '../services/api';

export default function AuthPage({ onAuthenticated }) {
  const location = useLocation();
  const isRegister = location.pathname === '/register';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isRegister ? await registerAccount(email, password) : await loginAccount(email, password);
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
        <h1 id="auth-title">{isRegister ? 'Create your citizen account' : 'Welcome back'}</h1>
        <p className="auth-intro">{isRegister ? 'Report civic issues and follow their progress.' : 'Sign in to view reports, alerts, and city issue intelligence.'}</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
          {isRegister && <p className="auth-hint">Use at least 12 characters. Accounts are created with citizen access.</p>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already registered?' : 'New to UrbanPulse?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create a citizen account'}</Link>
        </p>
      </section>
    </main>
  );
}
