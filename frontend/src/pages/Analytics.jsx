import React, { useEffect, useMemo, useState } from 'react';
import { getIssues, getImpactIssues } from '../services/api';
import ImpactIntelligence from '../components/ImpactIntelligence';
import {
  IconAnalytics,
  IconShield,
  IconCheckCircle,
  IconMapPin,
  IconActivity,
  IconRefresh,
} from '../components/Icons';

function Analytics({ onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const data = await getIssues();
      setIssues(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load analytics telemetry');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const total = issues.length;

  const categoryStats = useMemo(() => {
    const counts = {};
    issues.forEach((i) => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [issues, total]);

  const severityStats = useMemo(() => {
    const order = ['Critical', 'High', 'Medium', 'Low'];
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    issues.forEach((i) => {
      if (counts[i.severity] !== undefined) counts[i.severity]++;
    });
    return order.map((name) => ({
      name,
      count: counts[name],
      pct: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
    }));
  }, [issues, total]);

  const statusStats = useMemo(() => {
    const order = ['Reported', 'In Progress', 'Resolved'];
    const counts = { Reported: 0, 'In Progress': 0, Resolved: 0 };
    issues.forEach((i) => {
      if (counts[i.status] !== undefined) counts[i.status]++;
    });
    return order.map((name) => ({
      name,
      count: counts[name],
      pct: total > 0 ? Math.round((counts[name] / total) * 100) : 0,
    }));
  }, [issues, total]);

  const highPriorityCount = useMemo(() => {
    return issues.filter((i) => i.severity === 'High' || i.severity === 'Critical').length;
  }, [issues]);

  const mappedIssuesCount = useMemo(() => {
    return issues.filter((i) => {
      const lat = Number(i.latitude);
      const lng = Number(i.longitude);
      return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    }).length;
  }, [issues]);

  const resolvedCount = useMemo(() => {
    return issues.filter((i) => i.status === 'Resolved').length;
  }, [issues]);

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div className="analytics-page">
      {/* 1. TOP METRIC SUMMARY STRIP */}
      <section className="kpi-grid">
        <div className="kpi-card kpi-total">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Total Repository</span>
            <div className="kpi-icon-wrap"><IconActivity size={15} /></div>
          </div>
          <div className="kpi-val">{total}</div>
          <div className="kpi-sub">Database Ingested</div>
        </div>

        <div className="kpi-card kpi-critical">
          <div className="kpi-card-top">
            <span className="kpi-card-label">High Priority Load</span>
            <div className="kpi-icon-wrap"><IconShield size={15} /></div>
          </div>
          <div className="kpi-val">{highPriorityCount}</div>
          <div className="kpi-sub">
            <span>{total > 0 ? Math.round((highPriorityCount / total) * 100) : 0}% of all issues</span>
          </div>
        </div>

        <div className="kpi-card kpi-high">
          <div className="kpi-card-top">
            <span className="kpi-card-label">GIS Geocoded</span>
            <div className="kpi-icon-wrap"><IconMapPin size={15} /></div>
          </div>
          <div className="kpi-val">{mappedIssuesCount}</div>
          <div className="kpi-sub">
            <span>{total > 0 ? Math.round((mappedIssuesCount / total) * 100) : 0}% Spatial Coverage</span>
          </div>
        </div>

        <div className="kpi-card kpi-resolved">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Resolved Issues</span>
            <div className="kpi-icon-wrap"><IconCheckCircle size={15} /></div>
          </div>
          <div className="kpi-val">{resolvedCount}</div>
          <div className="kpi-sub">Closed Cases</div>
        </div>

        <div className="kpi-card kpi-resolved">
          <div className="kpi-card-top">
            <span className="kpi-card-label">Resolution Rate</span>
            <div className="kpi-icon-wrap"><IconActivity size={15} /></div>
          </div>
          <div className="kpi-val">{resolutionRate}%</div>
          <div className="kpi-sub">Overall Efficiency</div>
        </div>
      </section>

      {error && (
        <div className="feedback-banner feedback-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* 2. STATISTICAL DISTRIBUTION CHARTS */}
      <div className="analytics-grid-two">
        {/* CATEGORY DISTRIBUTION */}
        <div className="intel-card">
          <div className="intel-card-header">
            <div className="intel-header-left">
              <span className="intel-header-badge">CATEGORIES</span>
              <div>
                <div className="intel-header-title">Incidents by Infrastructure Domain</div>
                <div className="intel-header-sub">Relative volume of defects reported</div>
              </div>
            </div>
          </div>

          <div className="intel-card-body">
            <div className="chart-bar-list">
              {categoryStats.map((item) => (
                <div key={item.name} className="chart-bar-item">
                  <div className="chart-bar-label-row">
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {item.count} <small style={{ color: 'var(--text-muted)' }}>({item.pct}%)</small>
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill fill-cyan"
                      style={{ width: `${Math.max(item.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEVERITY & STATUS BREAKDOWN */}
        <div className="intel-card">
          <div className="intel-card-header">
            <div className="intel-header-left">
              <span className="intel-header-badge">SEVERITY / STATUS</span>
              <div>
                <div className="intel-header-title">Severity & Triage Distribution</div>
                <div className="intel-header-sub">Risk proportion and workflow progress</div>
              </div>
            </div>
          </div>

          <div className="intel-card-body">
            <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              Severity Breakdown
            </div>
            <div className="chart-bar-list" style={{ marginBottom: 20 }}>
              {severityStats.map((item) => {
                let fillClass = 'fill-low';
                if (item.name === 'Critical') fillClass = 'fill-critical';
                if (item.name === 'High') fillClass = 'fill-high';
                if (item.name === 'Medium') fillClass = 'fill-medium';

                return (
                  <div key={item.name} className="chart-bar-item">
                    <div className="chart-bar-label-row">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                        {item.count} <small style={{ color: 'var(--text-muted)' }}>({item.pct}%)</small>
                      </span>
                    </div>
                    <div className="chart-bar-track">
                      <div
                        className={`chart-bar-fill ${fillClass}`}
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
              Workflow Resolution Status
            </div>
            <div className="chart-bar-list">
              {statusStats.map((item) => (
                <div key={item.name} className="chart-bar-item">
                  <div className="chart-bar-label-row">
                    <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                      {item.count} <small style={{ color: 'var(--text-muted)' }}>({item.pct}%)</small>
                    </span>
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill fill-cyan"
                      style={{ width: `${Math.max(item.pct, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. EMBEDDED IMPACT INTELLIGENCE COMPONENT */}
      <div style={{ marginTop: 16 }}>
        <ImpactIntelligence />
      </div>
    </div>
  );
}

export default Analytics;