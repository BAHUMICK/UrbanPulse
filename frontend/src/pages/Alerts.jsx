
import React, { useEffect, useState } from 'react';
import {
  getAlerts,
  updateAlertStatus,
} from '../services/api';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  async function loadAlerts() {
    try {
      setLoading(true);

      const data = await getAlerts();

      setAlerts(data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(
        err.message || 'Failed to load alerts.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function handleStatusChange(
    alertId,
    status
  ) {
    try {
      setUpdatingId(alertId);

      const result = await updateAlertStatus(
        alertId,
        status
      );

      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId
            ? result.data
            : alert
        )
      );

      setError('');
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          'Failed to update alert status.'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getPriorityClass(score) {
    if (score >= 100) {
      return 'critical';
    }

    if (score >= 80) {
      return 'high';
    }

    if (score >= 50) {
      return 'medium';
    }

    return 'low';
  }

  if (loading) {
    return (
      <div className="loading">
        Loading alert intelligence...
      </div>
    );
  }

  return (
    <div>
      <section className="page-heading">
        <p className="eyebrow">
          ALERT INTELLIGENCE
        </p>

        <h2>Infrastructure Alerts</h2>

        <p>
          Automatic alerts generated from detected
          infrastructure issues.
        </p>
      </section>

      {error && (
        <div className="error-box">
          <h3>Alert Error</h3>
          <p>{error}</p>
        </div>
      )}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Active Intelligence Feed</h3>

            <p>
              {alerts.length} alert
              {alerts.length !== 1 ? 's' : ''} detected.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadAlerts}
          >
            Refresh Alerts
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="loading">
            No infrastructure alerts found.
          </div>
        ) : (
          <div className="issue-list">
            {alerts.map((alert) => (
              <div
                className="issue-row"
                key={alert.id}
              >
                <div>
                  <h4>{alert.title}</h4>

                  <p>
                    {alert.message}
                  </p>

                  <p>
                    <strong>Category:</strong>{' '}
                    {alert.category}
                    {' • '}
                    <strong>Severity:</strong>{' '}
                    {alert.severity}
                  </p>

                  <p>
                    <strong>Authority:</strong>{' '}
                    {alert.authority}
                  </p>

                  <p>
                    <strong>Priority Score:</strong>{' '}
                    {alert.priority_score}
                  </p>
                </div>

                <div>
                  <span
                    className={`badge ${getPriorityClass(
                      alert.priority_score
                    )}`}
                  >
                    {alert.priority_score >= 100
                      ? 'Critical'
                      : alert.priority_score >= 80
                      ? 'High'
                      : alert.priority_score >= 50
                      ? 'Medium'
                      : 'Low'}
                  </span>
                </div>

                <div>
                  <strong>Status</strong>

                  <select
                    value={alert.status}
                    disabled={
                      updatingId === alert.id
                    }
                    onChange={(event) =>
                      handleStatusChange(
                        alert.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Acknowledged">
                      Acknowledged
                    </option>

                    <option value="Resolved">
                      Resolved
                    </option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Alerts;

