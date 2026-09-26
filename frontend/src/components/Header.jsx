import React, { useState, useEffect } from 'react';
import {
  IconRefresh,
  IconAlerts,
  IconShield,
  IconActivity,
} from './Icons';

const PAGE_META = {
  dashboard: {
    title: 'Urban Infrastructure Command Center',
    subtitle: 'Real-time municipal anomaly triage, priority intelligence & alerts',
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
    title: 'Municipal Alert Dispatch Engine',
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

  const meta = PAGE_META[currentPage] || PAGE_META.dashboard;

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-meta-wrap">
          <span className="header-sector-tag">
            <IconShield size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            {meta.sector}
          </span>
          <h1 className="header-title">{meta.title}</h1>
        </div>
      </div>

      <div className="header-right">
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
        <button
          type="button"
          className={`header-alert-btn ${activeAlertCount > 0 ? 'has-alerts' : ''}`}
          onClick={() => onNavigate('alerts')}
          title="View active infrastructure alerts"
        >
          <IconAlerts size={16} />
          <span>{activeAlertCount} Active</span>
        </button>

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
