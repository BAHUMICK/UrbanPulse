import React, { useEffect, useState, useMemo } from 'react';
import { getAlerts, updateAlertStatus } from '../services/api';
import { SeverityBadge, StatusBadge } from '../components/Badges';
import {
  IconAlerts,
  IconShield,
  IconRefresh,
  IconCheckCircle,
  IconAlertTriangle,
} from '../components/Icons';

function Alerts({ onAlertUpdated, onNavigate }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionMsg, setActionMsg] = useState('');

  async function loadAlerts() {
    try {
      setLoading(true);
      setError('');
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load alerts feed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function handleStatusChange(alertId, newStatus) {
    try {
      setUpdatingId(alertId);
      setActionMsg('');
      const result = await updateAlertStatus(alertId, newStatus);

      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? result.data || { ...a, status: newStatus } : a))
      );

      setActionMsg(`Alert #${alertId} updated to ${newStatus}`);
      setTimeout(() => setActionMsg(''), 4000);

      if (onAlertUpdated) onAlertUpdated();
    } catch (err) {
      console.error(err);
      alert(`Failed to update alert: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredAlerts = useMemo(() => {
    if (filterStatus === 'All') return alerts;
    return alerts.filter((a) => a.status === filterStatus);
  }, [alerts, filterStatus]);

  const activeCount = alerts.filter((a) => a.status === 'Active').length;
  const ackCount = alerts.filter((a) => a.status === 'Acknowledged').length;
  const resCount = alerts.filter((a) => a.status === 'Resolved').length;

  return (
    <div className="alerts-page">
      {/* 1. AUTOMATED ALERT ENGINE PIPELINE DIAGRAM */}
      <div className="pipeline-stepper">
        <div className="pipeline-step-card">
          <span className="pipeline-step-num">STAGE 01</span>
          <span className="pipeline-step-title">Anomaly Ingestion</span>
          <span className="pipeline-step-desc">Citizens / IoT telemetry reports filed</span>
        </div>
        <div className="pipeline-step-card">
          <span className="pipeline-step-num">STAGE 02</span>
          <span className="pipeline-step-title">Heuristic Scoring</span>
          <span className="pipeline-step-desc">Severity, location density & impact weighed</span>
        </div>
        <div className="pipeline-step-card">
          <span className="pipeline-step-num">STAGE 03</span>
          <span className="pipeline-step-title">Automated Dispatch</span>
          <span className="pipeline-step-desc">Alert generated when score &gt; threshold</span>
        </div>
        <div className="pipeline-step-card">
          <span className="pipeline-step-num">STAGE 04</span>
          <span className="pipeline-step-title">Authority Routing</span>
          <span className="pipeline-step-desc">Dispatched to PWD, Traffic, or Municipal Corp</span>
        </div>
      </div>

      {actionMsg && (
        <div className="feedback-banner feedback-success" style={{ marginBottom: 12 }}>
          {actionMsg}
        </div>
      )}

      {error && (
        <div className="feedback-banner feedback-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* FILTER TABS */}
      <div className="table-filter-bar">
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`btn-ack ${filterStatus === 'All' ? 'btn-active' : ''}`}
            style={{
              background: filterStatus === 'All' ? '#1f3755' : undefined,
              color: filterStatus === 'All' ? '#38bdf8' : undefined,
            }}
            onClick={() => setFilterStatus('All')}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            type="button"
            className={`btn-ack ${filterStatus === 'Active' ? 'btn-active' : ''}`}
            style={{
              background: filterStatus === 'Active' ? 'rgba(239, 68, 68, 0.2)' : undefined,
              color: filterStatus === 'Active' ? '#fca5a5' : undefined,
            }}
            onClick={() => setFilterStatus('Active')}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            className={`btn-ack ${filterStatus === 'Acknowledged' ? 'btn-active' : ''}`}
            style={{
              background: filterStatus === 'Acknowledged' ? '#1f3755' : undefined,
              color: filterStatus === 'Acknowledged' ? '#fde68a' : undefined,
            }}
            onClick={() => setFilterStatus('Acknowledged')}
          >
            Acknowledged ({ackCount})
          </button>
          <button
            type="button"
            className={`btn-ack ${filterStatus === 'Resolved' ? 'btn-active' : ''}`}
            style={{
              background: filterStatus === 'Resolved' ? '#1f3755' : undefined,
              color: filterStatus === 'Resolved' ? '#86efac' : undefined,
            }}
            onClick={() => setFilterStatus('Resolved')}
          >
            Resolved ({resCount})
          </button>
        </div>

        <button
          type="button"
          className="btn-ack"
          style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          onClick={loadAlerts}
          disabled={loading}
        >
          <IconRefresh size={13} className={loading ? 'spin-anim' : ''} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* ALERT FEED CARDS */}
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
              DISPATCH REPOSITORY
            </span>
            <div>
              <div className="intel-header-title">Municipal Alert Feed</div>
              <div className="intel-header-sub">
                {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} listed
              </div>
            </div>
          </div>
        </div>

        <div className="intel-card-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              Loading alert telemetry...
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
              <IconCheckCircle size={28} style={{ color: '#34d399', marginBottom: 8 }} />
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No alerts in this view
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${
                      alert.status === 'Active'
                        ? 'var(--color-critical)'
                        : alert.status === 'Acknowledged'
                        ? 'var(--color-medium)'
                        : 'var(--color-low)'
                    }`,
                    borderRadius: 6,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
                        {alert.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                        {alert.message}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <SeverityBadge severity={alert.severity} size="small" />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: '#132338',
                          color: '#38bdf8',
                        }}
                      >
                        Score: {alert.priority_score}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 8,
                      paddingTop: 8,
                      borderTop: '1px solid #142030',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span className="alert-authority-tag">
                        <IconShield size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
                        {alert.authority}
                      </span>
                      <span>Category: <strong style={{ color: 'var(--text-secondary)' }}>{alert.category}</strong></span>
                      {alert.issue_id && (
                        <span>Linked Incident: <strong style={{ color: '#38bdf8' }}>#{alert.issue_id}</strong></span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        className="status-dropdown"
                        value={alert.status}
                        disabled={updatingId === alert.id}
                        onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Acknowledged">Acknowledged</option>
                        <option value="Resolved">Resolved</option>
                      </select>

                      {alert.status === 'Active' && (
                        <button
                          type="button"
                          className="btn-ack"
                          disabled={updatingId === alert.id}
                          onClick={() => handleStatusChange(alert.id, 'Acknowledged')}
                        >
                          Acknowledge
                        </button>
                      )}

                      {alert.status !== 'Resolved' && (
                        <button
                          type="button"
                          className="btn-resolve"
                          disabled={updatingId === alert.id}
                          onClick={() => handleStatusChange(alert.id, 'Resolved')}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Alerts;
