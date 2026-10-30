import React, { useState, useEffect } from 'react';
import NotificationsDropdown from './NotificationsDropdown';
import {
  IconRefresh,
  IconAlerts,
  IconShield,
  IconActivity,
} from './Icons';

const PAGE_META = {
  dashboard: {
    title: 'Urban Infrastructure Command Center',
    subtitle: 'Rule-based issue triage, priority intelligence & in-app alerts',
    sector: 'Metro Operations • Sector 5',
  },
  map: {
    title: 'Geospatial Intelligence Map',
    subtitle: 'Interactive cluster tracking of road damage, waterlogging & electrical hazards',
    sector: 'GIS Spatial Telemetry',
  },
  issues: {
    title: 'Infrastructure Incident Center',
    subtitle: 'Full operational triage, severity classification, and municipal status tracking',
    sector: 'Incident Triage Desk',
  },
  report: {
    title: 'Ingest Infrastructure Anomaly',
    subtitle: 'Report potholes, broken streetlights, waterlogging & civic infrastructure defects',
    sector: 'Field Ingestion Intake',
  },
  alerts: {
    title: 'Municipal Alert Center',
    subtitle: 'Automated civic intelligence alerts assigned directly to relevant municipal bodies',
    sector: 'Automated Alert Feed',
  },
  analytics: {
    title: 'Urban Impact & Severity Analytics',
    subtitle: 'Comprehensive distribution metrics, priority weighting & civic health diagnostics',
    sector: 'Strategic Intelligence',
  },
};

function Header({
  currentPage,
  onNavigate,
  onRefresh,
  refreshing = false,
  activeAlertCount = 0,
  systemOnline = true,
  user,
  onLogout,
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const adminMeta = user?.role === 'admin' ? {
    dashboard: { title: 'Admin Dashboard', subtitle: 'Review reports, manage priorities, and respond to alerts', sector: 'ADMINISTRATION' },
    issues: { title: 'Issues', subtitle: 'Find reports, review evidence, and update their status', sector: 'REPORT MANAGEMENT' },
    report: { title: 'Report Issue', subtitle: 'Submit a civic infrastructure concern', sector: 'NEW REPORT' },
    map: { title: 'Map', subtitle: 'Explore reported issues by location', sector: 'ISSUE LOCATIONS' },
    alerts: { title: 'Alerts', subtitle: 'Review and manage municipal alerts', sector: 'ALERT MANAGEMENT' },
    analytics: { title: 'Analytics', subtitle: 'Review issue trends, severity, and impact', sector: 'CITY OVERVIEW' },
  }[currentPage] : null;

  const meta = user?.role === 'citizen' && currentPage === 'dashboard'
    ? { title: 'Your reports and neighborhood', subtitle: 'Track the civic issues you have reported', sector: 'CITIZEN PORTAL' }
    : user?.role === 'citizen' && currentPage === 'issues'
      ? { title: 'My reports', subtitle: 'Review the reports submitted from your account', sector: 'CITIZEN PORTAL' }
    : user?.role === 'citizen' && currentPage === 'report'
      ? { title: 'Report a civic issue', subtitle: 'Share a local infrastructure concern', sector: 'CITIZEN PORTAL' }
      : adminMeta || PAGE_META[currentPage] || PAGE_META.dashboard;

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-meta-wrap">
          <span className="header-sector-tag">
            <IconShield size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            {meta.sector}
          </span>
          <h1 className="header-title">{meta.title}</h1>
          <p className="header-subtitle">{meta.subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-account" title={user?.email}>
          <span className="header-account-name">{user?.email}</span>
          <span className="header-account-role">{user?.role === 'admin' ? 'Administrator' : 'Citizen'}</span>
          <button type="button" className="header-logout" onClick={onLogout}>Sign out</button>
        </div>
        {/* TIME TELEMETRY */}
        <div className="header-clock-pill">
          <span className="clock-pulse" />
          <span className="clock-time">{currentTime}</span>
        </div>

        {/* SYSTEM STATUS PILL */}
        <div className={`header-status-pill ${systemOnline ? 'pill-online' : 'pill-offline'}`}>
          <span className="status-ping" />
          <span>{systemOnline ? 'System Operational' : 'API Reconnecting...'}</span>
        </div>

        {/* ALERTS BADGE SHORTCUT */}
        {user?.role === 'admin' && (
          <button
            type="button"
            className={`header-alert-btn ${activeAlertCount > 0 ? 'has-alerts' : ''}`}
            onClick={() => onNavigate('alerts')}
            title="View active infrastructure alerts"
          >
            <IconAlerts size={16} />
            <span>{activeAlertCount} Active</span>
          </button>
        )}

        {/* IN-APP NOTIFICATIONS */}
        <NotificationsDropdown onNavigate={onNavigate} />

        {/* REFRESH BUTTON */}
        <button
          type="button"
          className="header-refresh-btn"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh current view telemetry"
        >
          <IconRefresh size={14} className={refreshing ? 'spin-anim' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
