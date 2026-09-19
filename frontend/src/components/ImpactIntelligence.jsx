import React, {
  useEffect,
  useState
} from 'react';

import {
  getImpactIssues
} from '../services/api';

function ImpactIntelligence() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadImpactIssues() {
    try {
      setLoading(true);

      const data =
        await getImpactIssues();

      setIssues(data);
      setError('');
    } catch (err) {
      setError(
        err.message ||
          'Failed to load impact intelligence'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImpactIssues();
  }, []);

  function getImpactClass(level) {
    return (
      `impact-level impact-${level.toLowerCase()}`
    );
  }

  function getScoreClass(score) {
    if (score >= 75) {
      return 'impact-score critical-score';
    }

    if (score >= 55) {
      return 'impact-score high-score';
    }

    if (score >= 30) {
      return 'impact-score moderate-score';
    }

    return 'impact-score low-score';
  }

  return (
    <section className="panel impact-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            IMPACT INTELLIGENCE
          </p>

          <h3>
            Infrastructure Impact Assessment
          </h3>

          <p>
            Issues are assessed using severity,
            infrastructure category, current
            status, and nearby issue density.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadImpactIssues}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          Calculating infrastructure impact...
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        issues.length === 0 && (
          <div className="loading">
            No impact intelligence data available.
          </div>
        )}

      {!loading &&
        !error &&
        issues.length > 0 && (
          <div className="impact-list">
            {issues.map((issue) => (
              <article
                className="impact-card"
                key={issue.id}
              >
                <div className="impact-card-header">
                  <div>
                    <span className="impact-category">
                      {issue.category}
                    </span>

                    <h4>
                      {issue.title}
                    </h4>
                  </div>

                  <div
                    className={getScoreClass(
                      issue.impactScore
                    )}
                  >
                    {issue.impactScore}
                  </div>
                </div>

                <div className="impact-meta">
                  <span
                    className={getImpactClass(
                      issue.impactLevel
                    )}
                  >
                    {issue.impactLevel} Impact
                  </span>

                  <span>
                    Severity: {issue.severity}
                  </span>

                  <span>
                    Status: {issue.status}
                  </span>
                </div>

                <div className="impact-progress">
                  <div
                    className="impact-progress-fill"
                    style={{
                      width: `${issue.impactScore}%`,
                    }}
                  />
                </div>

                <div className="impact-breakdown">
                  <div>
                    <span>Severity</span>
                    <strong>
                      {
                        issue.impactBreakdown
                          .severity
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Category</span>
                    <strong>
                      {
                        issue.impactBreakdown
                          .category
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>
                    <strong>
                      {
                        issue.impactBreakdown
                          .status
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Density</span>
                    <strong>
                      {
                        issue.impactBreakdown
                          .locationDensity
                      }
                    </strong>
                  </div>
                </div>

                <div className="impact-factors">
                  <span>
                    Impact factors
                  </span>

                  <ul>
                    {issue.impactFactors.map(
                      (factor, index) => (
                        <li
                          key={`${issue.id}-${index}`}
                        >
                          {factor}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        )}
    </section>
  );
}

export default ImpactIntelligence;