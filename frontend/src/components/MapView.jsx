import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { getIssues } from '../services/api';
import { SeverityBadge, StatusBadge } from './Badges';
import { IconMapPin, IconFilter, IconRefresh, IconSearch } from './Icons';

// =====================================================
// LEAFLET DEFAULT MARKER FIX
// =====================================================
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// =====================================================
// SEVERITY CONFIGURATION
// =====================================================
const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const SEVERITY_PRIORITY = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function normalizeSeverity(severity) {
  if (!severity) return 'Low';
  const norm = String(severity).trim();
  if (['Critical', 'High', 'Medium', 'Low'].includes(norm)) return norm;
  return 'Low';
}

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// Marker icon generator with clustering count
function createLocationMarkerIcon(group) {
  const issues = group.issues;

  const highestSeverity = issues.reduce((highest, issue) => {
    const currentSeverity = normalizeSeverity(issue.severity);
    if (SEVERITY_PRIORITY[currentSeverity] > SEVERITY_PRIORITY[highest]) {
      return currentSeverity;
    }
    return highest;
  }, 'Low');

  const color = SEVERITY_COLORS[highestSeverity];

  if (issues.length === 1) {
    return L.divIcon({
      className: 'urbanpulse-map-marker',
      html: `
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${color};
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 10px ${color}88, 0 2px 6px rgba(0,0,0,0.5);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });
  }

  return L.divIcon({
    className: 'urbanpulse-map-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: ${color};
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 12px ${color}aa, 0 3px 8px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 800;
        font-size: 11px;
      ">
        ${issues.length}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

function AutoCenter({ issues }) {
  const map = useMap();

  useEffect(() => {
    if (!issues || issues.length === 0) return;

    const validIssues = issues.filter((issue) =>
      isValidCoordinate(issue.latitude, issue.longitude)
    );

    if (validIssues.length === 0) return;

    const bounds = L.latLngBounds(
      validIssues.map((issue) => [Number(issue.latitude), Number(issue.longitude)])
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [issues, map]);

  return null;
}

function MapView({ onNavigate }) {
  const navigate = useNavigate();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    async function loadIssuesData() {
      try {
        setLoading(true);
        const data = await getIssues();
        setIssues(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load map coordinates');
      } finally {
        setLoading(false);
      }
    }
    loadIssuesData();
  }, []);

  function openSeverityIssues(severity) {
    if (onNavigate) {
      onNavigate('issues');
    } else {
      navigate(`/issues?severity=${encodeURIComponent(severity)}`);
    }
  }

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(new Set(issues.map((i) => i.category).filter(Boolean))).sort(),
    ];
  }, [issues]);

  const severityCounts = useMemo(() => {
    return {
      Critical: issues.filter((i) => normalizeSeverity(i.severity) === 'Critical').length,
      High: issues.filter((i) => normalizeSeverity(i.severity) === 'High').length,
      Medium: issues.filter((i) => normalizeSeverity(i.severity) === 'Medium').length,
      Low: issues.filter((i) => normalizeSeverity(i.severity) === 'Low').length,
    };
  }, [issues]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesSeverity =
        severityFilter === 'All' || normalizeSeverity(issue.severity) === severityFilter;
      const matchesCategory =
        categoryFilter === 'All' || issue.category === categoryFilter;
      return matchesSeverity && matchesCategory;
    });
  }, [issues, severityFilter, categoryFilter]);

  const validMapIssues = useMemo(() => {
    return filteredIssues.filter((i) => isValidCoordinate(i.latitude, i.longitude));
  }, [filteredIssues]);

  const groupedLocations = useMemo(() => {
    const groups = new Map();
    validMapIssues.forEach((issue) => {
      const latitude = Number(issue.latitude);
      const longitude = Number(issue.longitude);
      const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

      if (!groups.has(key)) {
        groups.set(key, { latitude, longitude, issues: [] });
      }
      groups.get(key).issues.push(issue);
    });
    return Array.from(groups.values());
  }, [validMapIssues]);

  // Default coordinate center (fallback: Kolkata metro coordinates from seed)
  const defaultCenter = [22.5726, 88.3639];

  return (
    <div className="map-view-page">
      {/* 1. SEVERITY SUMMARY CARDS (SLEEK DARK COMMAND THEME) */}
      <div className="map-severity-pills-row">
        <button
          type="button"
          className="map-sev-btn sev-critical"
          onClick={() => setSeverityFilter(severityFilter === 'Critical' ? 'All' : 'Critical')}
          style={{
            borderColor: severityFilter === 'Critical' ? 'var(--color-critical)' : undefined,
            background: severityFilter === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : undefined,
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fca5a5' }}>CRITICAL ANOMALIES</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ef4444' }}>
              {severityCounts.Critical}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {severityFilter === 'Critical' ? 'Filtered ✓' : 'Filter →'}
          </span>
        </button>

        <button
          type="button"
          className="map-sev-btn sev-high"
          onClick={() => setSeverityFilter(severityFilter === 'High' ? 'All' : 'High')}
          style={{
            borderColor: severityFilter === 'High' ? 'var(--color-high)' : undefined,
            background: severityFilter === 'High' ? 'rgba(249, 115, 22, 0.15)' : undefined,
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fdba74' }}>HIGH SEVERITY</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f97316' }}>
              {severityCounts.High}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {severityFilter === 'High' ? 'Filtered ✓' : 'Filter →'}
          </span>
        </button>

        <button
          type="button"
          className="map-sev-btn sev-medium"
          onClick={() => setSeverityFilter(severityFilter === 'Medium' ? 'All' : 'Medium')}
          style={{
            borderColor: severityFilter === 'Medium' ? 'var(--color-medium)' : undefined,
            background: severityFilter === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : undefined,
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fde68a' }}>MEDIUM SEVERITY</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b' }}>
              {severityCounts.Medium}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {severityFilter === 'Medium' ? 'Filtered ✓' : 'Filter →'}
          </span>
        </button>

        <button
          type="button"
          className="map-sev-btn sev-low"
          onClick={() => setSeverityFilter(severityFilter === 'Low' ? 'All' : 'Low')}
          style={{
            borderColor: severityFilter === 'Low' ? 'var(--color-low)' : undefined,
            background: severityFilter === 'Low' ? 'rgba(16, 185, 129, 0.15)' : undefined,
          }}
        >
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#86efac' }}>LOW SEVERITY</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
              {severityCounts.Low}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {severityFilter === 'Low' ? 'Filtered ✓' : 'Filter →'}
          </span>
        </button>
      </div>

      {/* 2. MAP CONTROLS & FILTER TOOLBAR */}
      <div className="map-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <IconMapPin size={15} style={{ color: '#38bdf8' }} />
            <span>
              Plotting {validMapIssues.length} of {issues.length} Coordinate Pinpoints
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="map-cat-select" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Category:
            </label>
            <select
              id="map-cat-select"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="map-sev-select" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Severity:
            </label>
            <select
              id="map-sev-select"
              className="filter-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {(severityFilter !== 'All' || categoryFilter !== 'All') && (
            <button
              type="button"
              className="btn-ack"
              onClick={() => {
                setSeverityFilter('All');
                setCategoryFilter('All');
              }}
            >
              Clear Filters
            </button>
          )}
          <button
            type="button"
            className="btn-ack"
            style={{ color: '#38bdf8' }}
            onClick={() => onNavigate && onNavigate('issues')}
          >
            Open Incident Table →
          </button>
        </div>
      </div>

      {error && (
        <div className="feedback-banner feedback-error" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}

      {/* 3. LEAFLET MAP CONTAINER (SIZED TO FIT 1366x768 VIEWPORT) */}
      <div className="map-viewport-frame">
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Loading Geospatial Telemetry...
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <AutoCenter issues={validMapIssues} />

            {/* CLUSTERED PINPOINTS */}
            {groupedLocations.map((group) => (
              <Marker
                key={`${group.latitude}-${group.longitude}`}
                position={[group.latitude, group.longitude]}
                icon={createLocationMarkerIcon(group)}
              >
                <Popup>
                  <div style={{ minWidth: 240, padding: '2px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <strong style={{ fontSize: '13px', color: '#f1f5f9' }}>
                        {group.issues.length} {group.issues.length === 1 ? 'Incident' : 'Incidents'}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {group.latitude.toFixed(4)}, {group.longitude.toFixed(4)}
                      </span>
                    </div>

                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {group.issues.map((issue) => (
                        <div
                          key={issue.id}
                          style={{
                            padding: '8px 0',
                            borderTop: '1px solid #1e2c3e',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '12px', color: '#ffffff', marginBottom: 3 }}>
                            {issue.title}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                            <SeverityBadge severity={issue.severity} size="small" />
                            <StatusBadge status={issue.status} size="small" />
                            <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>{issue.category}</span>
                          </div>
                          {issue.description && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
                              {issue.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default MapView;