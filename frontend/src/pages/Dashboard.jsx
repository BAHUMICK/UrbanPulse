import React, { useEffect, useMemo, useState } from 'react';
import {
  getIssues,
  getImpactIssues,
  getActiveAlerts,
  updateAlertStatus,
  getPriorityIssues,
} from '../services/api';
import { SeverityBadge, StatusBadge, ImpactBadge } from '../components/Badges';
import {
  IconAlertTriangle,
  IconShield,
  IconActivity,
  IconCheckCircle,
  IconClock,
  IconMapPin,
  IconAlerts,
  IconRefresh,
} from '../components/Icons';

function Dashboard({ onNavigate, onTelemetryUpdate }) {
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
        getIssues().catch(() => []),
        getPriorityIssues().catch(() => []),
        getImpactIssues().catch(() => []),
        getActiveAlerts().catch(() => []),
      ]);

      setIssues(issuesData);
      setPriorityIssues(priorityData);
      setImpactIssues(impactData);
      setActiveAlerts(alertsData);
    } catch (err) {
      console.error('Error loading dashboard intelligence:', err);
      setError(err.message || 'Failed to load telemetry data');
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
  const total = issues.length;
  const critical = issues.filter((i) => i.severity === 'Critical').length;
  const high = issues.filter((i) => i.severity === 'High').length;
  const reported = issues.filter((i) => i.status === 'Reported').length;
  const inProgress = issues.filter((i) => i.status === 'In Progress').length;
  const resolved = issues.filter((i) => i.status === 'Resolved').length;
  const activeCount = reported + inProgress;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const highPriorityTotal = critical + high;

  const topPriorityList = useMemo(() => {
    return priorityIssues.slice(0, 5);
  }, [priorityIssues]);

  const recentIssues = useMemo(() => {
    return issues.slice(0, 5);
  }, [issues]);

  const topImpact = useMemo(() => {
    return impactIssues.length > 0 ? impactIssues[0] : null;
  }, [impactIssues]);

  if (loading) {
    return (
      <div className="intel-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
        <IconRefresh size={28} className="spin-anim" style={{ color: 'var(--accent-cyan)', marginBottom: 12 }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Ingesting Urban Infrastructure Telemetry...
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: 4 }}>
          Querying PostgreSQL & scoring civic anomalies
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-banner feedback-error">
        <IconAlertTriangle size={18} />
        <div>
          <strong>Telemetry Synchronization Error:</strong> {error}
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
    <div className="dashboard-page">
      {/* 1. TOP 5-METRIC KPI STRIP */}
      <section className="kpi-grid">
        {/* TOTAL ISSUES */}
        <div className="kpi-card kpi-total">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Ingested</span>
            <div className="kpi-icon-wrap">
              <IconActivity size={15} />
            </div>
          </div>
          <div className="kpi-val">{total}</div>
          <div className="kpi-sub">
            <span>{activeCount} Active</span> • <span>{resolved} Resolved</span>
          </div>
        </div>

        {/* CRITICAL SEVERITY */}
        <div className="kpi-card kpi-critical">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Critical Anomalies</span>
            <div className="kpi-icon-wrap">
              <IconAlertTriangle size={15} />
            </div>
          </div>
          <div className="kpi-val">{critical}</div>
          <div className="kpi-sub">
            <span style={{ color: '#fca5a5' }}>Immediate Threat</span>
          </div>
        </div>

        {/* HIGH PRIORITY */}
        <div className="kpi-card kpi-high">
          <div className="kpi-card-top">
            <span className="kpi-card-label">High Priority</span>
            <div className="kpi-icon-wrap">
              <IconShield size={15} />
            </div>
          </div>
          <div className="kpi-val">{highPriorityTotal}</div>
          <div className="kpi-sub">
            <span>{critical} Crit</span> • <span>{high} High</span>
          </div>
        </div>

        {/* ACTIVE MUNICIPAL ALERTS */}
        <div className="kpi-card kpi-alerts">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Active Alerts</span>
            <div className="kpi-icon-wrap">
              <IconAlerts size={15} />
            </div>
          </div>
          <div className="kpi-val">{activeAlerts.length}</div>
          <div className="kpi-sub">
            <span style={{ color: '#fda4af' }}>Awaiting Municipal Action</span>
          </div>
        </div>

        {/* RESOLUTION PROGRESS */}
        <div className="kpi-card kpi-resolved">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Resolution Rate</span>
            <div className="kpi-icon-wrap">
              <IconCheckCircle size={15} />
            </div>
          </div>
          <div className="kpi-val">{resolutionRate}%</div>
          <div className="kpi-sub">
            <span>{resolved} of {total} Closed</span>
          </div>
        </div>
      </section>

      {/* 2. MAIN TWO-COLUMN SPLIT INTELLIGENCE GRID */}
      <div className="dashboard-split-grid">
        {/* LEFT COLUMN: PRIORITY INTELLIGENCE & RECENT ACTIVITY */}
        <div className="dashboard-col-left">
          {/* PRIORITY INTELLIGENCE LEADERBOARD */}
          <div className="intel-card">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span className="intel-header-badge">AI / HEURISTIC</span>
                <div>
                  <div className="intel-header-title">Priority Intelligence Leaderboard</div>
                  <div className="intel-header-sub">
                    Multi-factor ranking (Severity + Category + Status + Cluster Density)
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('issues')}
              >
                All Incidents →
              </button>
            </div>

            <div className="intel-card-body">
              {topPriorityList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                  No priority anomaly data available.
                </div>
              ) : (
                <div className="priority-leader-list">
                  {topPriorityList.map((issue, idx) => (
                    <div key={issue.id} className="priority-leader-item">
                      <div className="priority-rank-badge">#{idx + 1}</div>

                      <div className="priority-item-info">
                        <div className="priority-item-title">{issue.title}</div>
                        <div className="priority-item-meta">
                          <SeverityBadge severity={issue.severity} size="small" />
                          <StatusBadge status={issue.status} size="small" />
                          <span style={{ color: 'var(--text-muted)' }}>• {issue.category}</span>
                        </div>
                        {issue.scoreBreakdown && (
                          <div className="priority-breakdown-tags" style={{ marginTop: 5 }}>
                            <span className="factor-tag">Sev: {issue.scoreBreakdown.severity}</span>
                            <span className="factor-tag">Stat: {issue.scoreBreakdown.status}</span>
                            <span className="factor-tag">Cat: {issue.scoreBreakdown.category}</span>
                            <span className="factor-tag">Dens: {issue.scoreBreakdown.locationDensity}</span>
                          </div>
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
          <div className="intel-card">
            <div className="intel-card-header">
              <div className="intel-header-left">
                <span className="intel-header-badge">LIVE INGESTION</span>
                <div>
                  <div className="intel-header-title">Recent Infrastructure Activity</div>
                  <div className="intel-header-sub">Latest telemetry and reports filed into UrbanPulse</div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('report')}
              >
                + Report New
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
                        <div className="activity-sub">
                          <span>{issue.category}</span> •{' '}
                          <span>
                            {issue.latitude && issue.longitude
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
          <div className="intel-card">
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
                  DISPATCH
                </span>
                <div>
                  <div className="intel-header-title">Active Municipal Alerts</div>
                  <div className="intel-header-sub">Automated triggers requiring authority intervention</div>
                </div>
              </div>
              <button
                type="button"
                className="header-refresh-btn"
                style={{ fontSize: 11, padding: '4px 9px' }}
                onClick={() => onNavigate && onNavigate('alerts')}
              >
                All Alerts →
              </button>
            </div>

            <div className="intel-card-body">
              {activeAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)' }}>
                  <IconCheckCircle size={24} style={{ color: '#34d399', marginBottom: 6 }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Zero Active Alerts
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    All triggered municipal alerts have been acknowledged or resolved.
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

                        <div style={{ display: 'flex', gap: 6 }}>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HIGHEST IMPACT ANOMALY CARD */}
          {topImpact && (
            <div className="intel-card">
              <div className="intel-card-header">
                <div className="intel-header-left">
                  <span className="intel-header-badge">MAX IMPACT</span>
                  <div>
                    <div className="intel-header-title">Primary Urban Bottleneck</div>
                    <div className="intel-header-sub">Calculated highest civic disruption signal</div>
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
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Key Risk Factors: </span>
                    {topImpact.impactFactors.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUICK GIS MAP SHORTCUT CARD */}
          <div
            className="intel-card"
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
                  Interactive Geospatial Map
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  View all {total} reported infrastructure coordinates plotted on OpenStreetMap
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