import React, { useEffect, useState } from 'react';
import { getPriorityIssues } from '../services/api';

function PriorityIntelligence() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPriorityIssues() {
      try {
        const data = await getPriorityIssues();
        setIssues(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPriorityIssues();
  }, []);

  if (loading) {
    return (
      <section className="panel priority-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">INTELLIGENCE</p>
            <h3>Priority Intelligence</h3>
          </div>
        </div>

        <p className="loading">
          Calculating infrastructure priorities...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel priority-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">INTELLIGENCE</p>
            <h3>Priority Intelligence</h3>
          </div>
        </div>

        <div className="error-box">
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel priority-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">INTELLIGENCE</p>

          <h3>Priority Intelligence</h3>

          <p>
            Infrastructure issues ranked using severity,
            status, category impact, and location density.
          </p>
        </div>

        <span className="priority-count">
          {issues.length} analyzed
        </span>
      </div>

      <div className="priority-list">
        {issues.map((issue, index) => (
          <div className="priority-item" key={issue.id}>
            <div className="priority-rank">
              #{index + 1}
            </div>

            <div className="priority-main">
              <h4>{issue.title}</h4>

              <p>
                {issue.category} • {issue.status}
              </p>

              <div className="priority-breakdown">
                <span>
                  Severity: {issue.scoreBreakdown.severity}
                </span>

                <span>
                  Status: {issue.scoreBreakdown.status}
                </span>

                <span>
                  Category: {issue.scoreBreakdown.category}
                </span>

                <span>
                  Density: {issue.scoreBreakdown.locationDensity}
                </span>
              </div>
            </div>

            <div className="priority-score">
              <strong>{issue.priorityScore}</strong>
              <span>Priority</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PriorityIntelligence;