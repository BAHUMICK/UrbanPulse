import React, { useEffect, useMemo, useState } from 'react';

import { getIssues } from '../services/api';
import ImpactIntelligence from '../components/ImpactIntelligence';

function Analytics() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadIssues() {
    try {
      setLoading(true);

      const data = await getIssues();

      setIssues(data);
      setError('');
    } catch (err) {
      setError(
        err.message || 'Failed to load analytics'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssues();
  }, []);

  const categoryStats = useMemo(() => {
    const counts = {};

    issues.forEach((issue) => {
      counts[issue.category] =
        (counts[issue.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [issues]);

  const severityStats = useMemo(() => {
    const severityOrder = [
      'Low',
      'Medium',
      'High',
      'Critical',
    ];

    const counts = {};

    severityOrder.forEach((severity) => {
      counts[severity] = 0;
    });

    issues.forEach((issue) => {
      if (counts[issue.severity] !== undefined) {
        counts[issue.severity]++;
      }
    });

    return severityOrder.map((severity) => ({
      name: severity,
      count: counts[severity],
    }));
  }, [issues]);

  const statusStats = useMemo(() => {
    const statusOrder = [
      'Reported',
      'In Progress',
      'Resolved',
    ];

    const counts = {};

    statusOrder.forEach((status) => {
      counts[status] = 0;
    });

    issues.forEach((issue) => {
      if (counts[issue.status] !== undefined) {
        counts[issue.status]++;
      }
    });

    return statusOrder.map((status) => ({
      name: status,
      count: counts[status],
    }));
  }, [issues]);

  const highPriorityCount = useMemo(() => {
    return issues.filter(
      (issue) =>
        issue.severity === 'High' ||
        issue.severity === 'Critical'
    ).length;
  }, [issues]);

  const mappedIssuesCount = useMemo(() => {
    return issues.filter((issue) => {
      const latitude = Number(issue.latitude);
      const longitude = Number(issue.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      );
    }).length;
  }, [issues]);

  const resolutionRate = useMemo(() => {
    if (issues.length === 0) {
      return 0;
    }

    const resolvedCount = issues.filter(
      (issue) => issue.status === 'Resolved'
    ).length;

    return Math.round(
      (resolvedCount / issues.length) * 100
    );
  }, [issues]);

  const topCategory = useMemo(() => {
    if (categoryStats.length === 0) {
      return 'None';
    }

    return categoryStats[0].name;
  }, [categoryStats]);

  const maxCategoryCount = useMemo(() => {
    if (categoryStats.length === 0) {
      return 1;
    }

    return Math.max(
      ...categoryStats.map(
        (item) => item.count
      )
    );
  }, [categoryStats]);

  const maxSeverityCount = useMemo(() => {
    if (severityStats.length === 0) {
      return 1;
    }

    return Math.max(
      ...severityStats.map(
        (item) => item.count
      ),
      1
    );
  }, [severityStats]);

  const maxStatusCount = useMemo(() => {
    if (statusStats.length === 0) {
      return 1;
    }

    return Math.max(
      ...statusStats.map(
        (item) => item.count
      ),
      1
    );
  }, [statusStats]);

  return (
    <div>
      <section className="page-heading">
        <p className="eyebrow">
          DATA INTELLIGENCE
        </p>

        <h2>
          Infrastructure Analytics
        </h2>

        <p>
          Analyze infrastructure issues by
          category, severity, status, and
          geographic coverage.
        </p>
      </section>

      {loading && (
        <div className="loading">
          Loading infrastructure analytics...
        </div>
      )}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="analytics-summary-grid">
            <div>
              <span>Total Issues</span>
              <strong>{issues.length}</strong>
              <small>
                All infrastructure reports
              </small>
            </div>

            <div>
              <span>High Priority</span>
              <strong>
                {highPriorityCount}
              </strong>
              <small>
                High and critical severity issues
              </small>
            </div>

            <div>
              <span>Mapped Issues</span>
              <strong>
                {mappedIssuesCount}
              </strong>
              <small>
                Issues with geographic coordinates
              </small>
            </div>

            <div>
              <span>Resolution Rate</span>
              <strong>
                {resolutionRate}%
              </strong>
              <small>
                Issues currently marked resolved
              </small>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Issues by Category
                </h3>

                <p>
                  Distribution of infrastructure
                  problems
                </p>
              </div>
            </div>

            <div className="analytics-bars">
              {categoryStats.map((item) => {
                const width =
                  (item.count /
                    maxCategoryCount) *
                  100;

                return (
                  <div
                    className="analytics-bar-row"
                    key={item.name}
                  >
                    <div className="analytics-bar-label">
                      <span>{item.name}</span>

                      <strong>
                        {item.count}
                      </strong>
                    </div>

                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar-fill"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Issues by Severity
                </h3>

                <p>
                  Current severity distribution
                </p>
              </div>
            </div>

            <div className="analytics-bars">
              {severityStats.map((item) => {
                const width =
                  (item.count /
                    maxSeverityCount) *
                  100;

                return (
                  <div
                    className="analytics-bar-row"
                    key={item.name}
                  >
                    <div className="analytics-bar-label">
                      <span>{item.name}</span>

                      <strong>
                        {item.count}
                      </strong>
                    </div>

                    <div className="analytics-bar-track">
                      <div
                        className={`analytics-bar-fill severity-${item.name.toLowerCase()}`}
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>
                  Issue Status
                </h3>

                <p>
                  Current lifecycle state of
                  reported issues
                </p>
              </div>
            </div>

            <div className="analytics-bars">
              {statusStats.map((item) => {
                const width =
                  (item.count /
                    maxStatusCount) *
                  100;

                return (
                  <div
                    className="analytics-bar-row"
                    key={item.name}
                  >
                    <div className="analytics-bar-label">
                      <span>{item.name}</span>

                      <strong>
                        {item.count}
                      </strong>
                    </div>

                    <div className="analytics-bar-track">
                      <div
                        className="analytics-bar-fill"
                        style={{
                          width: `${width}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel analytics-summary">
            <div className="panel-header">
              <div>
                <p className="eyebrow">
                  INTELLIGENCE SUMMARY
                </p>

                <h3>
                  Current Infrastructure Picture
                </h3>
              </div>
            </div>

            <div className="analytics-summary-grid">
              <div>
                <span>
                  Most reported category
                </span>

                <strong>
                  {topCategory}
                </strong>
              </div>

              <div>
                <span>
                  High/Critical issues
                </span>

                <strong>
                  {highPriorityCount}
                </strong>
              </div>

              <div>
                <span>
                  Geographic coverage
                </span>

                <strong>
                  {mappedIssuesCount} /{' '}
                  {issues.length}
                </strong>
              </div>

              <div>
                <span>
                  Resolved
                </span>

                <strong>
                  {
                    statusStats.find(
                      (item) =>
                        item.name ===
                        'Resolved'
                    )?.count || 0
                  }
                </strong>
              </div>
            </div>
          </section>

          <ImpactIntelligence />
        </>
      )}
    </div>
  );
}

export default Analytics;