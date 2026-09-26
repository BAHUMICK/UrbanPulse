import React from 'react';
import {
  IconDashboard,
  IconMap,
  IconIssues,
  IconReport,
  IconAnalytics,
  IconAlerts,
  IconActivity,
  IconDatabase,
} from './Icons';

function Sidebar({
  currentPage,
  onNavigate,
  activeAlertCount = 0,
  totalIssuesCount = 0,
  systemOnline = true,
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Command Center',
      sublabel: 'Overview & KPIs',
      icon: <IconDashboard size={18} />,
    },
    {
      id: 'map',
      label: 'Map Intelligence',
      sublabel: 'Spatial Clusters',
      icon: <IconMap size={18} />,
    },
    {
      id: 'issues',
      label: 'Incident Center',
      sublabel: 'Triage & Status',
      icon: <IconIssues size={18} />,
      badge: totalIssuesCount > 0 ? totalIssuesCount : null,
      badgeType: 'neutral',
    },
    {
      id: 'report',
      label: 'Report Anomaly',
      sublabel: 'Citizen / Sensor Ingestion',
      icon: <IconReport size={18} />,
    },
    {
      id: 'alerts',
      label: 'Municipal Alerts',
      sublabel: 'Auto Dispatch Engine',
      icon: <IconAlerts size={18} />,
      badge: activeAlertCount > 0 ? activeAlertCount : null,
      badgeType: 'critical',
    },
    {
      id: 'analytics',
      label: 'Impact Analytics',
      sublabel: 'Severity & Trends',
      icon: <IconAnalytics size={18} />,
    },
  ];

  return (
    <aside className="app-sidebar">
      {/* BRANDING */}
      <div className="sidebar-brand">
        <div className="brand-logo-wrap">
          <div className="brand-pulse-dot" />
          <IconActivity size={22} className="brand-icon" />
        </div>
        <div className="brand-text">
          <span className="brand-title">UrbanPulse</span>
          <span className="brand-tagline">Civic Anomaly Intelligence</span>
        </div>
      </div>

      {/* COMMAND SECTOR LABEL */}
      <div className="sidebar-section-title">COMMAND NAVIGATION</div>

      {/* NAVIGATION ITEMS */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="nav-item-icon">{item.icon}</div>
              <div className="nav-item-text">
                <span className="nav-item-label">{item.label}</span>
                <span className="nav-item-sub">{item.sublabel}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span className={`nav-item-badge badge-${item.badgeType}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM TELEMETRY CARD */}
      <div className="sidebar-footer">
        <div className="telemetry-card">
          <div className="telemetry-header">
            <span className="telemetry-title">TELEMETRY STATUS</span>
            <span className={`status-dot ${systemOnline ? 'dot-online' : 'dot-offline'}`} />
          </div>

          <div className="telemetry-row">
            <span className="telemetry-label">REST API</span>
            <span className="telemetry-val text-online">
              {systemOnline ? 'LIVE :5000' : 'OFFLINE'}
            </span>
          </div>

          <div className="telemetry-row">
            <span className="telemetry-label">PostgreSQL</span>
            <span className="telemetry-val">
              <IconDatabase size={11} style={{ marginRight: 3, verticalAlign: -1 }} />
              18.4 Running
            </span>
          </div>
        </div>

        <div className="sidebar-project-tag">
          <span>FINAL-YEAR PROJECT DEMO</span>
          <small>Urban Anomaly Platform</small>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
