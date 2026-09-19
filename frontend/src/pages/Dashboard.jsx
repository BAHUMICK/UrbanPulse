import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  getIssues,
  getImpactIssues
} from '../services/api';

import PriorityIntelligence from '../components/PriorityIntelligence';

function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [impactIssues, setImpactIssues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [impactLoading, setImpactLoading] =
    useState(true);

  const [error, setError] = useState('');
  const [impactError, setImpactError] =
    useState('');

  async function loadIssues() {
    try {
      setLoading(true);

      const data = await getIssues();

      setIssues(data);
      setError('');
    } catch (err) {
      setError(
        err.message ||
          'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadImpactIssues() {
    try {
      setImpactLoading(true);

      const data = await getImpactIssues();

      setImpactIssues(data);
      setImpactError('');
    } catch (err) {
      setImpactError(
        err.message ||
          'Failed to load impact intelligence'
      );
    } finally {
      setImpactLoading(false);
    }
  }

  async function loadDashboard() {
    await Promise.all([
      loadIssues(),
      loadImpactIssues()
    ]);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const total = issues.length;

  const critical = issues.filter(
    (issue) =>
      issue.severity === 'Critical'
  ).length;

  const high = issues.filter(
    (issue) =>
      issue.severity === 'High'
  ).length;

  const reported = issues.filter(
    (issue) =>
      issue.status === 'Reported'
  ).length;

  const inProgress = issues.filter(
    (issue) =>
      issue.status === 'In Progress'
  ).length;

  const resolved = issues.filter(
    (issue) =>
      issue.status === 'Resolved'
  ).length;

  const resolutionRate =
    total > 0
      ? Math.round(
          (resolved / total) * 100
        )
      : 0;

  const highPriority =
    critical + high;

  const recentIssues =
    issues.slice(0, 5);

  const highestImpactIssue =
    impactIssues.length > 0
      ? impactIssues[0]
      : null;

  const criticalImpactCount =
    impactIssues.filter(
      (issue) =>
        issue.impactLevel === 'Critical'
    ).length;

  const highImpactCount =
    impactIssues.filter(
      (issue) =>
        issue.impactLevel === 'High'
    ).length;

  const topImpactIssues =
    useMemo(() => {
      return impactIssues.slice(0, 3);
    }, [impactIssues]);

  function getImpactClass(level) {
    return (
      `dashboard-impact-level impact-${level.toLowerCase()}`
    );
  }

  if (loading || impactLoading) {
    return (
      <div className="loading">
        Loading UrbanPulse intelligence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <h2>
          Unable to load dashboard
        </h2>

        <p>{error}</p>

        <button
          className="primary-button"
          onClick={loadDashboard}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* HERO */}

      <section className="hero">
        <div>
          <p className="eyebrow">
            CITY INFRASTRUCTURE INTELLIGENCE
          </p>

          <h2>
            Urban Infrastructure
            Command Center
          </h2>

          <p>
            Monitor reported infrastructure
            anomalies, understand their
            impact, and identify areas
            requiring attention.
          </p>
        </div>
      </section>

      {/* CORE STATISTICS */}

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Issues</span>

          <strong>{total}</strong>

          <small>
            All reported infrastructure
            issues
          </small>
        </div>

        <div className="stat-card">
          <span>Critical Issues</span>

          <strong>{critical}</strong>

          <small>
            Issues requiring urgent
            attention
          </small>
        </div>

        <div className="stat-card">
          <span>Reported</span>

          <strong>{reported}</strong>

          <small>
            Awaiting resolution
          </small>
        </div>

        <div className="stat-card">
          <span>In Progress</span>

          <strong>{inProgress}</strong>

          <small>
            Currently being addressed
          </small>
        </div>
      </section>

      {/* INTELLIGENCE OVERVIEW */}

      <section className="dashboard-intelligence-grid">
        <div className="dashboard-intelligence-card">
          <span>
            High Priority
          </span>

          <strong>
            {highPriority}
          </strong>

          <small>
            High and critical severity
          </small>
        </div>

        <div className="dashboard-intelligence-card">
          <span>
            Critical Impact
          </span>

          <strong>
            {criticalImpactCount}
          </strong>

          <small>
            Issues with critical impact
          </small>
        </div>

        <div className="dashboard-intelligence-card">
          <span>
            High Impact
          </span>

          <strong>
            {highImpactCount}
          </strong>

          <small>
            Issues with high impact
          </small>
        </div>

        <div className="dashboard-intelligence-card">
          <span>
            Resolution Rate
          </span>

          <strong>
            {resolutionRate}%
          </strong>

          <small>
            {resolved} resolved issue
            {resolved !== 1 ? 's' : ''}
          </small>
        </div>
      </section>

      {/* PRIORITY INTELLIGENCE */}

      <PriorityIntelligence />

      {/* IMPACT INTELLIGENCE */}

      <section className="panel dashboard-impact-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              IMPACT INTELLIGENCE
            </p>

            <h3>
              Highest-Impact Infrastructure
            </h3>

            <p>
              Issues currently generating
              the strongest infrastructure
              impact signals.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadImpactIssues}
          >
            Refresh
          </button>
        </div>

        {impactError && (
          <div className="error-box">
            {impactError}
          </div>
        )}

        {!impactError &&
          highestImpactIssue && (
            <>
              <div className="top-impact-card">
                <div>
                  <span className="impact-card-label">
                    TOP IMPACT ISSUE
                  </span>

                  <h4>
                    {highestImpactIssue.title}
                  </h4>

                  <p>
                    {highestImpactIssue.category}
                    {' · '}
                    {highestImpactIssue.status}
                  </p>
                </div>

                <div className="top-impact-score">
                  <strong>
                    {highestImpactIssue.impactScore}
                  </strong>

                  <span>
                    Impact Score
                  </span>
                </div>
              </div>

              <div className="dashboard-impact-list">
                {topImpactIssues.map(
                  (issue) => (
                    <div
                      className="dashboard-impact-row"
                      key={issue.id}
                    >
                      <div className="dashboard-impact-info">
                        <strong>
                          {issue.title}
                        </strong>

                        <span>
                          {issue.category}
                        </span>
                      </div>

                      <span
                        className={getImpactClass(
                          issue.impactLevel
                        )}
                      >
                        {issue.impactLevel}
                      </span>

                      <strong className="dashboard-impact-score">
                        {issue.impactScore}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </>
          )}
      </section>

      {/* INFRASTRUCTURE HEALTH */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">
              SYSTEM OVERVIEW
            </p>

            <h3>
              Current Infrastructure Picture
            </h3>

            <p>
              A consolidated view of the
              current city infrastructure
              situation.
            </p>
          </div>
        </div>

        <div className="dashboard-health-grid">
          <div>
            <span>
              Critical / High Issues
            </span>

            <strong>
              {highPriority}
            </strong>

            <small>
              Require elevated attention
            </small>
          </div>

          <div>
            <span>
              Open Issues
            </span>

            <strong>
              {reported + inProgress}
            </strong>

            <small>
              Reported or being addressed
            </small>
          </div>

          <div>
            <span>
              Resolved Issues
            </span>

            <strong>
              {resolved}
            </strong>

            <small>
              Completed infrastructure
              actions
            </small>
          </div>

          <div>
            <span>
              Resolution Progress
            </span>

            <strong>
              {resolutionRate}%
            </strong>

            <small>
              Overall resolution rate
            </small>
          </div>
        </div>
      </section>

      {/* RECENT ISSUES */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>
              Recent Infrastructure Issues
            </h3>

            <p>
              Latest records from the
              UrbanPulse database
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadDashboard}
          >
            Refresh
          </button>
        </div>

        <div className="issue-list">
          {recentIssues.map(
            (issue) => (
              <div
                className="issue-row"
                key={issue.id}
              >
                <div>
                  <h4>
                    {issue.title}
                  </h4>

                  <p>
                    {issue.category}
                  </p>
                </div>

                <span
                  className={`badge ${issue.severity.toLowerCase()}`}
                >
                  {issue.severity}
                </span>

                <span className="status">
                  {issue.status}
                </span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;