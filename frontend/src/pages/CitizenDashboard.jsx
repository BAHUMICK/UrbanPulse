import React, { useEffect, useState } from 'react';
import { getIssues } from '../services/api';

export default function CitizenDashboard({ user, onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getIssues().then((reports) => { if (active) setIssues(reports); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const open = (page) => onNavigate?.(page);
  const inProgress = issues.filter((issue) => issue.status !== 'Resolved').length;
  return (
    <section className="dashboard-page citizen-dashboard" aria-labelledby="citizen-dashboard-title">
      <div className="intel-card citizen-welcome">
        <span className="intel-header-badge">CITIZEN PORTAL</span>
        <h2 id="citizen-dashboard-title">Your neighborhood, heard.</h2>
        <p>Report a civic issue and follow its progress from your account.</p>
        <div className="citizen-actions">
          <button className="auth-submit" type="button" onClick={() => open('report')}>Report an issue</button>
          <button className="header-refresh-btn" type="button" onClick={() => open('issues')}>View my reports</button>
        </div>
      </div>
      <div className="kpi-grid citizen-kpis">
        <div className="kpi-card kpi-total"><span className="kpi-card-label">Reports submitted</span><div className="kpi-val">{loading ? '—' : issues.length}</div></div>
        <div className="kpi-card kpi-high"><span className="kpi-card-label">Still in progress</span><div className="kpi-val">{loading ? '—' : inProgress}</div></div>
        <div className="kpi-card kpi-resolved"><span className="kpi-card-label">Account</span><div className="citizen-account">{user?.email || 'Signed in'}</div><small>Citizen access</small></div>
      </div>
      {error && <div className="feedback-banner feedback-error" role="alert">{error}</div>}
      {!loading && !error && issues.length === 0 && <div className="intel-card citizen-empty"><h3>No reports yet</h3><p>When you submit an issue, its status and evidence will appear here.</p><button className="btn-ack" type="button" onClick={() => open('report')}>Start a report</button></div>}
      <div className="intel-card citizen-guidance"><h3>Before you report</h3><p>Choose the closest category, place the marker at the issue location, and add a clear description. Photos or video can help staff assess the report.</p></div>
    </section>
  );
}
