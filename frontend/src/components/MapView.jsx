import React, { useEffect, useMemo, useState } from 'react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { getIssues } from '../services/api';

// Fix Leaflet marker icons when using Vite.
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create a colored marker based on severity.
function createSeverityIcon(severity) {
  const colors = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };

  const color = colors[severity] || '#38bdf8';

  return L.divIcon({
    className: 'severity-marker-wrapper',

    html: `
      <div
        class="severity-marker"
        style="
          background: ${color};
          box-shadow: 0 0 0 4px ${color}33;
        "
      ></div>
    `,

    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function MapView() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [severityFilter, setSeverityFilter] =
    useState('All');

  const [categoryFilter, setCategoryFilter] =
    useState('All');

  useEffect(() => {
    async function loadIssues() {
      try {
        setLoading(true);

        const data = await getIssues();

        setIssues(data);
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load map data');
      } finally {
        setLoading(false);
      }
    }

    loadIssues();
  }, []);

  const mapCenter = [22.5741, 88.4329];

  // Keep only issues with valid geographic coordinates.
  const mappedIssues = useMemo(() => {
    return issues.filter((issue) => {
      const latitude = Number(issue.latitude);
      const longitude = Number(issue.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    });
  }, [issues]);

  // Build category list dynamically from database data.
  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(mappedIssues.map((issue) => issue.category))
      ).sort(),
    ];
  }, [mappedIssues]);

  // Apply map filters.
  const filteredIssues = useMemo(() => {
    return mappedIssues.filter((issue) => {
      const matchesSeverity =
        severityFilter === 'All' ||
        issue.severity === severityFilter;

      const matchesCategory =
        categoryFilter === 'All' ||
        issue.category === categoryFilter;

      return matchesSeverity && matchesCategory;
    });
  }, [
    mappedIssues,
    severityFilter,
    categoryFilter,
  ]);

  // Calculate summary information from filtered data.
  const criticalCount = filteredIssues.filter(
    (issue) => issue.severity === 'Critical'
  ).length;

  const highCount = filteredIssues.filter(
    (issue) => issue.severity === 'High'
  ).length;

  const mediumCount = filteredIssues.filter(
    (issue) => issue.severity === 'Medium'
  ).length;

  const lowCount = filteredIssues.filter(
    (issue) => issue.severity === 'Low'
  ).length;

  function resetFilters() {
    setSeverityFilter('All');
    setCategoryFilter('All');
  }

  if (loading) {
    return (
      <div className="loading">
        Loading map intelligence...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <h2>Unable to load map data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* PAGE HEADER */}

      <section className="page-heading">
        <p className="eyebrow">
          GEOSPATIAL INTELLIGENCE
        </p>

        <h2>Infrastructure Map</h2>

        <p>
          Explore infrastructure issues by location,
          severity, and category.
        </p>
      </section>

      {/* MAP CONTROLS */}

      <section className="panel map-controls-panel">
        <div className="panel-header">
          <div>
            <h3>Map Intelligence Filters</h3>

            <p>
              Filter infrastructure issues displayed on
              the map.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        <div className="map-filters">
          <div className="form-group">
            <label htmlFor="severity-filter">
              Severity
            </label>

            <select
              id="severity-filter"
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(event.target.value)
              }
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category-filter">
              Category
            </label>

            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category === 'All'
                    ? 'All Categories'
                    : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* MAP SUMMARY */}

      <section className="map-summary-grid">
        <div className="map-summary-card">
          <span>Visible Issues</span>

          <strong>{filteredIssues.length}</strong>

          <small>
            Matching current filters
          </small>
        </div>

        <div className="map-summary-card critical-summary">
          <span>Critical</span>

          <strong>{criticalCount}</strong>

          <small>
            Critical severity
          </small>
        </div>

        <div className="map-summary-card high-summary">
          <span>High</span>

          <strong>{highCount}</strong>

          <small>
            High severity
          </small>
        </div>

        <div className="map-summary-card medium-summary">
          <span>Medium / Low</span>

          <strong>
            {mediumCount + lowCount}
          </strong>

          <small>
            Lower severity issues
          </small>
        </div>
      </section>

      {/* MAP */}

      <section className="map-container">
        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={true}
          style={{
            height: '600px',
            width: '100%',
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredIssues.map((issue) => (
            <Marker
              key={issue.id}
              position={[
                Number(issue.latitude),
                Number(issue.longitude),
              ]}
              icon={createSeverityIcon(
                issue.severity
              )}
            >
              <Popup>
                <div className="map-popup">
                  <strong className="map-popup-title">
                    {issue.title}
                  </strong>

                  <div className="map-popup-details">
                    <p>
                      <strong>Category:</strong>{' '}
                      {issue.category}
                    </p>

                    <p>
                      <strong>Severity:</strong>{' '}
                      {issue.severity}
                    </p>

                    <p>
                      <strong>Status:</strong>{' '}
                      {issue.status}
                    </p>

                    <p>
                      <strong>Coordinates:</strong>{' '}
                      {issue.latitude},{' '}
                      {issue.longitude}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </section>

      {/* MAP LEGEND */}

      <section className="panel map-legend-panel">
        <div className="panel-header">
          <div>
            <h3>Severity Legend</h3>

            <p>
              Marker colors represent infrastructure
              issue severity.
            </p>
          </div>
        </div>

        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-dot critical-dot"></span>
            <span>Critical</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot high-dot"></span>
            <span>High</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot medium-dot"></span>
            <span>Medium</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot low-dot"></span>
            <span>Low</span>
          </div>
        </div>
      </section>

      {/* ISSUE LIST */}

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Mapped Infrastructure Issues</h3>

            <p>
              Showing {filteredIssues.length} of{' '}
              {mappedIssues.length} mapped issues.
            </p>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="loading">
            No mapped issues match the selected
            filters.
          </div>
        ) : (
          <div className="issue-list">
            {filteredIssues.map((issue) => (
              <div
                className="issue-row"
                key={issue.id}
              >
                <div>
                  <h4>{issue.title}</h4>

                  <p>
                    {issue.category} •{' '}
                    {issue.latitude},{' '}
                    {issue.longitude}
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MapView;