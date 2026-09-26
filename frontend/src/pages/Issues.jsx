import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getIssues,
  getPriorityIssues,
  getImpactIssues,
  updateIssueStatus,
} from '../services/api';
import { SeverityBadge, StatusBadge, ImpactBadge } from '../components/Badges';
import {
  IconSearch,
  IconFilter,
  IconRefresh,
  IconMapPin,
  IconAlertTriangle,
} from '../components/Icons';

function Issues({ onNavigate }) {
  const [searchParams] = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [priorityIssues, setPriorityIssues] = useState([]);
  const [impactIssues, setImpactIssues] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingIssueId, setUpdatingIssueId] = useState(null);
  const [updateMsg, setUpdateMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('priority');

  // Pagination for 1366x768 screens
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Initialize severity filter from URL if present
  useEffect(() => {
    const sev = searchParams.get('severity');
    if (sev && ['Critical', 'High', 'Medium', 'Low'].includes(sev)) {
      setSeverityFilter(sev);
    }
  }, [searchParams]);

  async function loadAllData() {
    try {
      setLoading(true);
      setError('');
      const [issuesData, priorityData, impactData] = await Promise.all([
        getIssues().catch(() => []),
        getPriorityIssues().catch(() => []),
        getImpactIssues().catch(() => []),
      ]);

      setIssues(issuesData);
      setPriorityIssues(priorityData);
      setImpactIssues(impactData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  // Update status handler
  async function handleStatusChange(issueId, newStatus) {
    try {
      setUpdatingIssueId(issueId);
      setUpdateMsg('');
      const result = await updateIssueStatus(issueId, newStatus);

      setIssues((prev) =>
        prev.map((item) => (item.id === issueId ? result.data || { ...item, status: newStatus } : item))
      );
      setUpdateMsg(`Issue #${issueId} status changed to ${newStatus}`);
      setTimeout(() => setUpdateMsg(''), 4000);
    } catch (err) {
      console.error(err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingIssueId(null);
    }
  }

  // Categories list
  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(new Set(issues.map((i) => i.category).filter(Boolean))).sort(),
    ];
  }, [issues]);

  // Intelligence lookup map (priority & impact scores)
  const intelMap = useMemo(() => {
    const map = new Map();
    priorityIssues.forEach((p) => {
      map.set(p.id, { priorityScore: p.priorityScore, priorityBreakdown: p.scoreBreakdown });
    });
    impactIssues.forEach((im) => {
      const existing = map.get(im.id) || {};
      map.set(im.id, {
        ...existing,
        impactScore: im.impactScore,
        impactLevel: im.impactLevel,
      });
    });
    return map;
  }, [priorityIssues, impactIssues]);

  // Filtered & Sorted Issues
  const filteredIssues = useMemo(() => {
    let result = [...issues];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          String(i.id).includes(q)
      );
    }

    // Category
    if (categoryFilter !== 'All') {
      result = result.filter((i) => i.category === categoryFilter);
    }

    // Severity
    if (severityFilter !== 'All') {
      result = result.filter((i) => i.severity === severityFilter);
    }

    // Status
    if (statusFilter !== 'All') {
      result = result.filter((i) => i.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const intelA = intelMap.get(a.id) || {};
      const intelB = intelMap.get(b.id) || {};

      if (sortBy === 'priority') {
        return (intelB.priorityScore || 0) - (intelA.priorityScore || 0);
      }
      if (sortBy === 'impact') {
        return (intelB.impactScore || 0) - (intelA.impactScore || 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      if (sortBy === 'severity') {
        const order = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      return 0;
    });

    return result;
  }, [issues, search, categoryFilter, severityFilter, statusFilter, sortBy, intelMap]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredIssues.slice(start, start + PAGE_SIZE);
  }, [filteredIssues, page]);

  return (
    <div className="issues-page">
      {/* UPDATE NOTIFICATION */}
      {updateMsg && (
        <div className="feedback-banner feedback-success" style={{ marginBottom: 12 }}>
          {updateMsg}
        </div>
      )}

      {error && (
        <div className="feedback-banner feedback-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="table-filter-bar">
        <div className="filter-group-left">
          <div className="search-input-wrap">
            <IconSearch size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, category, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="filter-selects-wrap">
            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority">Sort: Priority Score</option>
              <option value="impact">Sort: Impact Score</option>
              <option value="newest">Sort: Newest First</option>
              <option value="severity">Sort: Severity High→Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredIssues.length}</strong> of {issues.length} Records
          </span>
          <button
            type="button"
            className="btn-ack"
            style={{ color: '#38bdf8' }}
            onClick={() => onNavigate && onNavigate('report')}
          >
            + Ingest Issue
          </button>
        </div>
      </div>

      {/* INCIDENT DATA TABLE */}
      <div className="table-panel">
        <div className="table-responsive">
          <table className="incident-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>ID</th>
                <th>Infrastructure Anomaly Details</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Priority</th>
                <th>Impact</th>
                <th>Coordinates</th>
                <th>Status Management</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading incident repository...
                  </td>
                </tr>
              ) : paginatedIssues.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No infrastructure incidents matched your active filters.
                  </td>
                </tr>
              ) : (
                paginatedIssues.map((issue) => {
                  const intel = intelMap.get(issue.id) || {};
                  return (
                    <tr key={issue.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                        #{issue.id}
                      </td>

                      <td>
                        <div className="td-title-bold">{issue.title}</div>
                        <div className="td-desc-sub">{issue.description}</div>
                      </td>

                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                          {issue.category}
                        </span>
                      </td>

                      <td>
                        <SeverityBadge severity={issue.severity} size="small" />
                      </td>

                      <td>
                        {intel.priorityScore !== undefined ? (
                          <span style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 13 }}>
                            {intel.priorityScore}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      <td>
                        {intel.impactLevel ? (
                          <ImpactBadge level={intel.impactLevel} score={intel.impactScore} size="small" />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      <td>
                        {issue.latitude && issue.longitude ? (
                          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>
                            {Number(issue.latitude).toFixed(3)}, {Number(issue.longitude).toFixed(3)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>None</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <select
                            className="status-dropdown"
                            value={issue.status}
                            disabled={updatingIssueId === issue.id}
                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                          >
                            <option value="Reported">Reported</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          {updatingIssueId === issue.id && (
                            <span style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>Saving...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--bg-card-inner)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn-ack"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <button
                type="button"
                className="btn-ack"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Issues;
