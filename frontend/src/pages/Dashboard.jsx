import React, { useEffect, useMemo, useState } from 'react';
import {
  getIssues,
  getImpactIssues,
  getActiveAlerts,
  updateAlertStatus,
  getPriorityIssues,
} from '../services/api';
import { SeverityBadge, StatusBadge, ImpactBadge, SectorBadge } from '../components/Badges';
import { getDashboardMetrics } from './dashboardMetrics';
import './adminDashboard.css';
import {
  IconAlertTriangle,
  IconActivity,
  IconCheckCircle,
  IconMapPin,
  IconRefresh,
} from '../components/Icons';

function Dashboard({ onNavigate, onTelemetryUpdate, isAdmin = false }) {
  const [issues, setIssues] = useState([]);
  const [priorityIssues, setPriorityIssues] = useState([]);
  const [impactIssues, setImpactIssues] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updatingAlertId, setUpdatingAlertId] = useState(null);
  const [error, setError] = useState('');

  // Load all dashboard intelligence concurrently
  async function loadDashboardData() {
    try {
      setLoading(true);
      setError('');
      const [issuesData, priorityData, impactData, alertsData] = await Promise.all([
        getIssues(),
        getPriorityIssues(),
        getImpactIssues(),
        getActiveAlerts(),
      ]);

      setIssues(issuesData);
      setPriorityIssues(priorityData);
      setImpactIssues(impactData);
      setActiveAlerts(alertsData);
    } catch (err) {
      console.error('Error loading dashboard intelligence:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update alert status and refresh
  async function handleAlertStatusChange(alertId, newStatus) {
    try {
      setUpdatingAlertId(alertId);
      await updateAlertStatus(alertId, newStatus);
      const updatedAlerts = await getActiveAlerts();
      setActiveAlerts(updatedAlerts);
      if (onTelemetryUpdate) onTelemetryUpdate();
    } catch (err) {
      console.error('Failed to update alert:', err);
      alert(`Could not update alert: ${err.message}`);
    } finally {
      setUpdatingAlertId(null);
    }
  }

  // Calculated metrics
  const { total, critical, reported, inProgress, resolved, activeCount, resolutionRate, highPriorityTotal } = getDashboardMetrics(issues);

  const topPriorityList = useMemo(() => {
    return priorityIssues.filter((issue) => issue.status !== 'Resolved').slice(0, 5);
  }, [priorityIssues]);

  const recentIssues = useMemo(() => {
    return [...issues].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5);
  }, [issues]);

  const topImpact = useMemo(() => {
    return impactIssues.length > 0 ? impactIssues[0] : null;
  }, [impactIssues]);

  const sectorBreakdown = useMemo(() => {
    const counts = {};
    issues.forEach((i) => {
      const sec = i.sector || 'Other Civic Services';
      counts[sec] = (counts[sec] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [issues]);

  if (loading) {
    return (
      <div className="intel-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <IconRefresh size={28} className="spin-anim" style={{ color: 'var(--accent-cyan)', marginBottom: 12 }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Loading dashboard…
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4 }}>
          Loading reports, priorities, and alerts
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-banner feedback-error">
        <IconAlertTriangle size={18} />
        <div>
          <strong>Could not load dashboard:</strong> {error}
          <button
            type="button"
            className="btn-ack"
            style={{ marginLeft: 12 }}
            onClick={loadDashboardData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-dashboard">
      <section className="kpi-grid" aria-label="Issue overview">
        {[
          { label: 'Total Issues', value: total, style: 'kpi-total', icon: <IconActivity size={17} />, note: 'All submitted reports' },
          { label: 'Pending Issues', value: activeCount, style: 'kpi-high', icon: <IconRefresh size={17} />, note: `${reported} reported · ${inProgress} in progress` },
          { label: 'Critical Issues', value: critical, style: 'kpi-critical', icon: <IconAlertTriangle size={17} />, note: 'Unresolved critical reports' },
          { label: 'Resolved Issues', value: resolved, style: 'kpi-resolved', icon: <IconCheckCircle size={17} />, note: `${resolutionRate}% of all reports resolved` },
        ].map((metric) => (
          <div className={`kpi-card ${metric.style}`} key={metric.label}>
            <div className="kpi-card-top">
              <span className="kpi-card-label">{metric.label}</span>
              <div className="kpi-icon-wrap">{metric.icon}</div>
            </div>
            <div className="kpi-val">{metric.value}</div>
            <div className="kpi-sub">{metric.note}</div>
          </div>
        ))}
      </section>

      {/* 2. MAIN TWO-COLUMN SPLIT INTELLIGENCE GRID */}
      <div className="dashboard-split-grid">
        {/* LEFT COLUMN: PRIORITY INTELLIGENCE & RECENT ACTIVITY */}
        <div className="dashboard-col-left">
          {/* PRIORITY INTELLIGENCE LEADERBOARD */}
          <div className="intel-card admin-attention">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span className="intel-header-badge">{highPriorityTotal} high / critical</span>
                <div>
                  <div className="intel-header-title">Issues Requiring Attention</div>
                  <div className="intel-header-sub">
                    Unresolved reports, ranked by the existing priority score
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('issues')}
              >
                View All Issues →
              </button>
            </div>

            <div className="intel-card-body">
              {topPriorityList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No unresolved priority reports to show.
                </div>
              ) : (
                <div className="priority-leader-list">
                  {topPriorityList.map((issue, idx) => (
                    <div key={issue.id} className="priority-leader-item">
                      <div className="priority-rank-badge">#{idx + 1}</div>

                      <div className="priority-item-info">
                        <div className="priority-item-title">{issue.title}</div>
                        <div className="priority-item-meta" style={{ flexWrap: 'wrap' }}>
                          <SectorBadge sector={issue.sector} size="small" />
                          <SeverityBadge severity={issue.severity} size="small" />
                          <StatusBadge status={issue.status} size="small" />
                          <span style={{ color: 'var(--text-muted)' }}>• {issue.category}</span>
                        </div>
                        {issue.scoreBreakdown && (
                          <details className="admin-score-details"><summary>Score details</summary><div className="priority-breakdown-tags" style={{ marginTop: 5 }}>
                            <span className="factor-tag">Severity: {issue.scoreBreakdown.severity}</span>
                            <span className="factor-tag">Status: {issue.scoreBreakdown.status}</span>
                            <span className="factor-tag">Category: {issue.scoreBreakdown.category}</span>
                            <span className="factor-tag">Density: {issue.scoreBreakdown.locationDensity}</span>
                          </div></details>
                        )}
                      </div>

                      <div className="priority-score-pill">
                        <span className="score-num">{issue.priorityScore}</span>
                        <span className="score-label">Priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RECENT INFRASTRUCTURE ACTIVITY */}
          <div className="intel-card admin-recent">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span className="intel-header-badge">Latest 5</span>
                <div>
                  <div className="intel-header-title">Recent Reports</div>
                  <div className="intel-header-sub">The most recently submitted reports</div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('report')}
              >
                + Report Issue
              </button>
            </div>

            <div className="intel-card-body">
              {recentIssues.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No recent issues found.
                </div>
              ) : (
                <div className="activity-feed-list">
                  {recentIssues.map((issue) => (
                    <div key={issue.id} className="activity-feed-item">
                      <div style={{ minWidth: 0 }}>
                        <div className="activity-title">{issue.title}</div>
                        <div className="activity-sub" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                          <SectorBadge sector={issue.sector} size="small" />
                          <span>{issue.category}</span> •{' '}
                          <span>
                            {issue.latitude != null && issue.longitude != null
                              ? `${Number(issue.latitude).toFixed(3)}, ${Number(issue.longitude).toFixed(3)}`
                              : 'Location set'}
                          </span>
                        </div>
                      </div>

                      <SeverityBadge severity={issue.severity} size="small" />
                      <StatusBadge status={issue.status} size="small" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE MUNICIPAL ALERTS & IMPACT SPECTRUM */}
        <div className="dashboard-col-right">
          {/* ACTIVE ALERTS FEED */}
          <div className="intel-card admin-alerts">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span
                  className="intel-header-badge"
                  style={{
                    color: '#f43f5e',
                    background: 'rgba(244, 63, 94, 0.1)',
                    borderColor: 'rgba(244, 63, 94, 0.25)',
                  }}
                >
                  {activeAlerts.length} active
                </span>
                <div>
                  <div className="intel-header-title">Active Alerts</div>
                  <div className="intel-header-sub">Alerts awaiting acknowledgement or resolution</div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('alerts')}
              >
                View All Alerts →
              </button>
            </div>

            <div className="intel-card-body">
              {activeAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
                  <IconCheckCircle size={24} style={{ color: '#34d399', marginBottom: 6 }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    No active alerts
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    No alerts currently require action.
                  </div>
                </div>
              ) : (
                <div className="alert-feed-list">
                  {activeAlerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="alert-feed-item">
                      <div className="alert-item-top">
                        <div className="alert-item-title">{alert.title}</div>
                        <SeverityBadge severity={alert.severity} size="small" />
                      </div>

                      <div className="alert-item-meta">
                        <span className="alert-authority-tag">{alert.authority}</span>
                        <span>• {alert.category}</span>
                        <span style={{ marginLeft: 'auto' }} className="alert-score-badge">
                          Score: {alert.priority_score}
                        </span>
                      </div>

                      <div className="alert-actions-row">
                        <StatusBadge status={alert.status} size="small" />

                        {isAdmin && <div style={{ display: 'flex', gap: 6 }}>
                          {alert.status === 'Active' && (
                            <button
                              type="button"
                              className="btn-ack"
                              disabled={updatingAlertId === alert.id}
                              onClick={() => handleAlertStatusChange(alert.id, 'Acknowledged')}
                            >
                              {updatingAlertId === alert.id ? '...' : 'Acknowledge'}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-resolve"
                            disabled={updatingAlertId === alert.id}
                            onClick={() => handleAlertStatusChange(alert.id, 'Resolved')}
                          >
                            {updatingAlertId === alert.id ? '...' : 'Resolve'}
                          </button>
                        </div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CIVIC SECTOR OVERVIEW CARD */}
          <div className="intel-card admin-sectors">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span className="intel-header-badge">CIVIC SECTORS</span>
                <div>
                  <div className="intel-header-title">Issues by Civic Sector</div>
                  <div className="intel-header-sub">All reports across the five most-reported sectors</div>
                </div>
              </div>
            </div>
            <div className="intel-card-body">
              {sectorBreakdown.length === 0 ? (
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No civic sector data.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sectorBreakdown.map((item) => (
                    <div
                      key={item.sector}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: 'var(--bg-card-inner)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <SectorBadge sector={item.sector} size="small" />
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.count} {item.count === 1 ? 'Issue' : 'Issues'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HIGHEST IMPACT ANOMALY CARD */}
          {topImpact ? (
            <div className="intel-card admin-impact">
              <div className="intel-card-header">
                <div className="intel-header-left">
                  <span className="intel-header-badge">MAX IMPACT</span>
                  <div>
                    <div className="intel-header-title">Highest-Impact Issue</div>
                    <div className="intel-header-sub">Based on the existing impact ranking</div>
                  </div>
                </div>
              </div>

              <div className="intel-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {topImpact.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {topImpact.category} • Severity: {topImpact.severity}
                    </div>
                  </div>
                  <ImpactBadge level={topImpact.impactLevel} score={topImpact.impactScore} />
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Calculated Impact Score</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{topImpact.impactScore} / 100</strong>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar-fill ${
                        topImpact.impactScore >= 75
                          ? 'fill-critical'
                          : topImpact.impactScore >= 55
                          ? 'fill-high'
                          : 'fill-medium'
                      }`}
                      style={{ width: `${Math.min(topImpact.impactScore, 100)}%` }}
                    />
                  </div>
                </div>

                {topImpact.impactFactors && (
                  <div style={{ marginTop: 10, fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Impact factors: </span>
                    {topImpact.impactFactors.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="intel-card admin-impact">
              <div className="intel-card-header"><div className="intel-header-title">Highest-Impact Issue</div></div>
              <div className="intel-card-body admin-empty">No impact results available yet.</div>
            </div>
          )}

          {/* QUICK GIS MAP SHORTCUT CARD */}
          <div
            className="intel-card admin-map-shortcut"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onNavigate?.('map'); } }}
            style={{
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #0d1829 0%, #09111c 100%)',
              borderColor: '#1e3857',
            }}
            onClick={() => onNavigate && onNavigate('map')}
          >
            <div className="intel-card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8',
                  flexShrink: 0,
                }}
              >
                <IconMapPin size={20} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  Explore the Map
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  View report locations on OpenStreetMap
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
