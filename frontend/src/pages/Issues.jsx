import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  getIssues,
  getPriorityIssues,
  getImpactIssues,
  updateIssueStatus
} from '../services/api';

import { useSearchParams } from 'react-router-dom';

function Issues() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [priorityIssues, setPriorityIssues] = useState([]);
  const [impactIssues, setImpactIssues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [intelligenceLoading, setIntelligenceLoading] =
    useState(true);

  const [error, setError] = useState('');
  const [intelligenceError, setIntelligenceError] =
    useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState('All');

  const [severityFilter, setSeverityFilter] =
    useState('All');

  const [statusFilter, setStatusFilter] =
    useState('All');

  const [sortBy, setSortBy] =
    useState('priority');

  const [updatingIssueId, setUpdatingIssueId] =
    useState(null);

  const [updateError, setUpdateError] =
    useState('');

  // =====================================================
  // READ SEVERITY FROM URL
  // Example:
  // /issues?severity=Critical
  // /issues?severity=High
  // /issues?severity=Medium
  // /issues?severity=Low
  // =====================================================

  useEffect(() => {
    const severityFromUrl =
      searchParams.get('severity');

    const validSeverities = [
      'Critical',
      'High',
      'Medium',
      'Low'
    ];

    if (
      severityFromUrl &&
      validSeverities.includes(severityFromUrl)
    ) {
      setSeverityFilter(severityFromUrl);
    } else {
      setSeverityFilter('All');
    }
  }, [searchParams]);

  // =====================================================
  // LOAD ISSUES
  // =====================================================

  async function loadIssues() {
    try {
      setLoading(true);

      const data = await getIssues();

      setIssues(data);
      setError('');
    } catch (err) {
      setError(
        err.message ||
          'Failed to load issues'
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // LOAD INTELLIGENCE
  // =====================================================

  async function loadIntelligence() {
    try {
      setIntelligenceLoading(true);

      const [
        priorityData,
        impactData
      ] = await Promise.all([
        getPriorityIssues(),
        getImpactIssues()
      ]);

      setPriorityIssues(priorityData);
      setImpactIssues(impactData);

      setIntelligenceError('');
    } catch (err) {
      setIntelligenceError(
        err.message ||
          'Failed to load issue intelligence'
      );
    } finally {
      setIntelligenceLoading(false);
    }
  }

  // =====================================================
  // LOAD COMPLETE PAGE
  // =====================================================

  async function loadPage() {
    await Promise.all([
      loadIssues(),
      loadIntelligence()
    ]);
  }

  useEffect(() => {
    loadPage();
  }, []);

  // =====================================================
  // UPDATE ISSUE STATUS
  // =====================================================

  async function handleStatusChange(
    issueId,
    newStatus
  ) {
    try {
      setUpdatingIssueId(issueId);
      setUpdateError('');

      const result =
        await updateIssueStatus(
          issueId,
          newStatus
        );

      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === issueId
            ? result.data
            : issue
        )
      );

      await loadIntelligence();
    } catch (err) {
      setUpdateError(
        err.message ||
          'Failed to update issue status'
      );
    } finally {
      setUpdatingIssueId(null);
    }
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          issues.map(
            (issue) => issue.category
          )
        )
      ).sort()
    ];
  }, [issues]);

  // =====================================================
  // INTELLIGENCE MAP
  // =====================================================

  const intelligenceMap = useMemo(() => {
    const map = new Map();

    priorityIssues.forEach(
      (priorityIssue) => {
        map.set(priorityIssue.id, {
          priorityScore:
            priorityIssue.priorityScore,

          priorityBreakdown:
            priorityIssue.scoreBreakdown
        });
      }
    );

    impactIssues.forEach(
      (impactIssue) => {
        const existing =
          map.get(impactIssue.id) || {};

        map.set(impactIssue.id, {
          ...existing,

          impactScore:
            impactIssue.impactScore,

          impactLevel:
            impactIssue.impactLevel,

          impactBreakdown:
            impactIssue.impactBreakdown,

          impactFactors:
            impactIssue.impactFactors
        });
      }
    );

    return map;
  }, [
    priorityIssues,
    impactIssues
  ]);

  // =====================================================
  // FILTER + SORT ISSUES
  // =====================================================

  const filteredIssues = useMemo(() => {
    const searchTerm =
      search.trim().toLowerCase();

    const filtered = issues.filter(
      (issue) => {
        const matchesSearch =
          !searchTerm ||
          (issue.title || '')
            .toLowerCase()
            .includes(searchTerm) ||
          (issue.description || '')
            .toLowerCase()
            .includes(searchTerm) ||
          (issue.category || '')
            .toLowerCase()
            .includes(searchTerm);

        const matchesCategory =
          categoryFilter === 'All' ||
          issue.category ===
            categoryFilter;

        const matchesSeverity =
          severityFilter === 'All' ||
          issue.severity ===
            severityFilter;

        const matchesStatus =
          statusFilter === 'All' ||
          issue.status === statusFilter;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesSeverity &&
          matchesStatus
        );
      }
    );

    return [...filtered].sort(
      (a, b) => {
        const aIntelligence =
          intelligenceMap.get(a.id);

        const bIntelligence =
          intelligenceMap.get(b.id);

        if (sortBy === 'priority') {
          return (
            (bIntelligence?.priorityScore ||
              0) -
            (aIntelligence?.priorityScore ||
              0)
          );
        }

        if (sortBy === 'impact') {
          return (
            (bIntelligence?.impactScore ||
              0) -
            (aIntelligence?.impactScore ||
              0)
          );
        }

        if (sortBy === 'severity') {
          const severityOrder = {
            Critical: 4,
            High: 3,
            Medium: 2,
            Low: 1
          };

          return (
            (severityOrder[b.severity] ||
              0) -
            (severityOrder[a.severity] ||
              0)
          );
        }

        if (sortBy === 'recent') {
          return (
            new Date(b.created_at) -
            new Date(a.created_at)
          );
        }

        return 0;
      }
    );
  }, [
    issues,
    search,
    categoryFilter,
    severityFilter,
    statusFilter,
    sortBy,
    intelligenceMap
  ]);

  // =====================================================
  // RESET FILTERS
  // =====================================================

  function resetFilters() {
    setSearch('');
    setCategoryFilter('All');
    setSeverityFilter('All');
    setStatusFilter('All');
    setSortBy('priority');

    const newParams =
      new URLSearchParams(searchParams);

    newParams.delete('severity');

    setSearchParams(newParams);
  }

  // =====================================================
  // MANUAL SEVERITY FILTER
  // =====================================================

  function handleSeverityFilterChange(
    newSeverity
  ) {
    setSeverityFilter(newSeverity);

    const newParams =
      new URLSearchParams(searchParams);

    if (newSeverity === 'All') {
      newParams.delete('severity');
    } else {
      newParams.set(
        'severity',
        newSeverity
      );
    }

    setSearchParams(newParams);
  }

  // =====================================================
  // IMPACT CLASS
  // =====================================================

  function getImpactClass(level) {
    return `issue-impact-badge impact-${(
      level || 'Low'
    ).toLowerCase()}`;
  }

  // =====================================================
  // PRIORITY CLASS
  // =====================================================

  function getPriorityClass(score) {
    if (score >= 75) {
      return 'issue-score issue-score-critical';
    }

    if (score >= 55) {
      return 'issue-score issue-score-high';
    }

    if (score >= 35) {
      return 'issue-score issue-score-medium';
    }

    return 'issue-score issue-score-low';
  }

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const criticalCount =
    filteredIssues.filter(
      (issue) =>
        issue.severity === 'Critical'
    ).length;

  const highCount =
    filteredIssues.filter(
      (issue) =>
        issue.severity === 'High'
    ).length;

  const reportedCount =
    filteredIssues.filter(
      (issue) =>
        issue.status === 'Reported'
    ).length;

  const inProgressCount =
    filteredIssues.filter(
      (issue) =>
        issue.status === 'In Progress'
    ).length;

  const resolvedCount =
    filteredIssues.filter(
      (issue) =>
        issue.status === 'Resolved'
    ).length;

  const criticalImpactCount =
    filteredIssues.filter((issue) => {
      const intelligence =
        intelligenceMap.get(issue.id);

      return (
        intelligence?.impactLevel ===
        'Critical'
      );
    }).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="page-heading">

        <p className="eyebrow">
          ISSUE INTELLIGENCE REGISTRY
        </p>

        <h2>
          Infrastructure Issues
        </h2>

        <p>
          Search, filter, prioritize, and
          manage infrastructure issues using
          UrbanPulse intelligence scores.
        </p>

      </section>

      {/* =================================================
          ACTIVE MAP SEVERITY FILTER
      ================================================= */}

      {severityFilter !== 'All' && (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          Showing existing issues with{' '}
          <strong>
            {severityFilter}
          </strong>{' '}
          severity.
        </div>
      )}

      {/* =================================================
          FILTER PANEL
      ================================================= */}

      <section className="panel issue-filter-panel">

        <div className="panel-header">

          <div>

            <h3>
              Issue Intelligence Filters
            </h3>

            <p>
              Narrow the registry and choose
              how infrastructure issues are
              prioritized.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={resetFilters}
          >
            Reset Filters
          </button>

        </div>

        <div className="issue-filters">

          {/* SEARCH */}

          <div className="form-group search-group">

            <label htmlFor="issue-search">
              Search
            </label>

            <input
              id="issue-search"
              type="text"
              placeholder="Search title, description, or category..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          {/* CATEGORY */}

          <div className="form-group">

            <label htmlFor="issue-category">
              Category
            </label>

            <select
              id="issue-category"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(
                  event.target.value
                )
              }
            >

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category === 'All'
                      ? 'All Categories'
                      : category}
                  </option>
                )
              )}

            </select>

          </div>

          {/* SEVERITY */}

          <div className="form-group">

            <label htmlFor="issue-severity">
              Severity
            </label>

            <select
              id="issue-severity"
              value={severityFilter}
              onChange={(event) =>
                handleSeverityFilterChange(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Severities
              </option>

              <option value="Critical">
                Critical
              </option>

              <option value="High">
                High
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="Low">
                Low
              </option>

            </select>

          </div>

          {/* STATUS */}

          <div className="form-group">

            <label htmlFor="issue-status">
              Status
            </label>

            <select
              id="issue-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >

              <option value="All">
                All Statuses
              </option>

              <option value="Reported">
                Reported
              </option>

              <option value="In Progress">
                In Progress
              </option>

              <option value="Resolved">
                Resolved
              </option>

            </select>

          </div>

          {/* SORT */}

          <div className="form-group">

            <label htmlFor="issue-sort">
              Sort By
            </label>

            <select
              id="issue-sort"
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value
                )
              }
            >

              <option value="priority">
                Priority Score
              </option>

              <option value="impact">
                Impact Score
              </option>

              <option value="severity">
                Severity
              </option>

              <option value="recent">
                Most Recent
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="issue-summary-grid">

        <div className="issue-summary-card">

          <span>
            Matching Issues
          </span>

          <strong>
            {filteredIssues.length}
          </strong>

          <small>
            From {issues.length} total records
          </small>

        </div>

        <div className="issue-summary-card critical-summary">

          <span>
            Critical
          </span>

          <strong>
            {criticalCount}
          </strong>

          <small>
            Critical severity
          </small>

        </div>

        <div className="issue-summary-card high-summary">

          <span>
            High Priority
          </span>

          <strong>
            {highCount}
          </strong>

          <small>
            High severity
          </small>

        </div>

        <div className="issue-summary-card">

          <span>
            Critical Impact
          </span>

          <strong>
            {criticalImpactCount}
          </strong>

          <small>
            Critical impact signals
          </small>

        </div>

      </section>

      {/* =================================================
          WORKFLOW
      ================================================= */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              RESOLUTION WORKFLOW
            </p>

            <h3>
              Current Issue Lifecycle
            </h3>

            <p>
              Current distribution of the
              filtered infrastructure issues.
            </p>

          </div>

        </div>

        <div className="issue-workflow-grid">

          <div className="workflow-card">

            <span>
              Reported
            </span>

            <strong>
              {reportedCount}
            </strong>

            <small>
              New issues awaiting action
            </small>

          </div>

          <div className="workflow-card">

            <span>
              In Progress
            </span>

            <strong>
              {inProgressCount}
            </strong>

            <small>
              Issues being addressed
            </small>

          </div>

          <div className="workflow-card">

            <span>
              Resolved
            </span>

            <strong>
              {resolvedCount}
            </strong>

            <small>
              Completed infrastructure issues
            </small>

          </div>

        </div>

      </section>

      {/* =================================================
          INTELLIGENT ISSUE REGISTRY
      ================================================= */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              INTELLIGENT ISSUE REGISTRY
            </p>

            <h3>
              Prioritized Infrastructure Issues
            </h3>

            <p>
              Issues are ranked using
              Priority Intelligence and Impact
              Intelligence.
            </p>

          </div>

          <button
            className="secondary-button"
            onClick={loadPage}
            disabled={
              loading ||
              intelligenceLoading
            }
          >
            {loading ||
            intelligenceLoading
              ? 'Refreshing...'
              : 'Refresh Intelligence'}
          </button>

        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {intelligenceError && (
          <div className="error-box">
            {intelligenceError}
          </div>
        )}

        {updateError && (
          <div className="error-box">
            {updateError}
          </div>
        )}

        {!loading &&
          !error &&
          filteredIssues.length === 0 && (
            <div className="loading">
              No issues match the selected
              filters.
            </div>
          )}

        {!loading &&
          !error &&
          filteredIssues.length > 0 && (
            <div className="intelligence-issue-list">

              {filteredIssues.map(
                (issue, index) => {

                  const intelligence =
                    intelligenceMap.get(
                      issue.id
                    );

                  const priorityScore =
                    intelligence
                      ?.priorityScore ?? 0;

                  const impactScore =
                    intelligence
                      ?.impactScore ?? 0;

                  const impactLevel =
                    intelligence
                      ?.impactLevel ?? 'Low';

                  const isUpdating =
                    updatingIssueId ===
                    issue.id;

                  return (
                    <article
                      className="intelligence-issue-card"
                      key={issue.id}
                    >

                      <div className="intelligence-issue-top">

                        <div className="issue-rank">
                          #{index + 1}
                        </div>

                        <div className="intelligence-issue-title">

                          <span className="issue-category-label">
                            {issue.category}
                          </span>

                          <h4>
                            {issue.title}
                          </h4>

                          <p>
                            {issue.description}
                          </p>

                        </div>

                        <div className="issue-score-block">

                          <span>
                            Priority
                          </span>

                          <strong
                            className={getPriorityClass(
                              priorityScore
                            )}
                          >
                            {priorityScore}
                          </strong>

                        </div>

                        <div className="issue-score-block">

                          <span>
                            Impact
                          </span>

                          <strong className="issue-impact-score">
                            {impactScore}
                          </strong>

                        </div>

                      </div>

                      <div className="intelligence-issue-meta">

                        <span
                          className={`badge ${
                            (
                              issue.severity ||
                              ''
                            ).toLowerCase()
                          }`}
                        >
                          {issue.severity}
                        </span>

                        <span
                          className={getImpactClass(
                            impactLevel
                          )}
                        >
                          {impactLevel} Impact
                        </span>

                        <span>
                          Coordinates:{' '}
                          {issue.latitude},{' '}
                          {issue.longitude}
                        </span>

                      </div>

                      <div className="issue-intelligence-breakdown">

                        <div>

                          <span>
                            Priority Factors
                          </span>

                          <small>

                            Severity:{' '}
                            {intelligence
                              ?.priorityBreakdown
                              ?.severity ?? 0}

                            {' · '}

                            Status:{' '}
                            {intelligence
                              ?.priorityBreakdown
                              ?.status ?? 0}

                            {' · '}

                            Category:{' '}
                            {intelligence
                              ?.priorityBreakdown
                              ?.category ?? 0}

                            {' · '}

                            Density:{' '}
                            {intelligence
                              ?.priorityBreakdown
                              ?.locationDensity ?? 0}

                          </small>

                        </div>

                        <div>

                          <span>
                            Impact Factors
                          </span>

                          <small>
                            {intelligence
                              ?.impactFactors
                              ?.join(' · ') ||
                              'No additional factors'}
                          </small>

                        </div>

                      </div>

                      <div className="intelligence-issue-footer">

                        <div className="status-control">

                          <label
                            htmlFor={`status-${issue.id}`}
                          >
                            Status
                          </label>

                          <select
                            id={`status-${issue.id}`}
                            value={issue.status}
                            disabled={
                              isUpdating
                            }
                            onChange={(event) =>
                              handleStatusChange(
                                issue.id,
                                event.target.value
                              )
                            }
                          >

                            <option value="Reported">
                              Reported
                            </option>

                            <option value="In Progress">
                              In Progress
                            </option>

                            <option value="Resolved">
                              Resolved
                            </option>

                          </select>

                        </div>

                        <span className="issue-action-hint">

                          {isUpdating
                            ? 'Updating intelligence...'
                            : 'Changing status recalculates intelligence scores.'}

                        </span>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>

    </div>
  );
}

export default Issues;
