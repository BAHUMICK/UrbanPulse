import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { useNavigate } from 'react-router-dom';

import { getIssues } from '../services/api';


// =====================================================
// LEAFLET DEFAULT MARKER FIX
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


// =====================================================
// SEVERITY CONFIGURATION
// =====================================================

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
};

const SEVERITY_PRIORITY = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};


// =====================================================
// NORMALIZE SEVERITY
// =====================================================

function normalizeSeverity(severity) {
  if (!severity) {
    return 'Low';
  }

  const normalized =
    String(severity).trim();

  if (
    normalized === 'Critical' ||
    normalized === 'High' ||
    normalized === 'Medium' ||
    normalized === 'Low'
  ) {
    return normalized;
  }

  return 'Low';
}


// =====================================================
// VALIDATE COORDINATES
// =====================================================

function isValidCoordinate(
  latitude,
  longitude
) {
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


// =====================================================
// CREATE LOCATION MARKER
// =====================================================

function createLocationMarkerIcon(group) {
  const issues = group.issues;

  const highestSeverity =
    issues.reduce(
      (highest, issue) => {
        const currentSeverity =
          normalizeSeverity(
            issue.severity
          );

        if (
          SEVERITY_PRIORITY[
            currentSeverity
          ] >
          SEVERITY_PRIORITY[
            highest
          ]
        ) {
          return currentSeverity;
        }

        return highest;
      },
      'Low'
    );

  const color =
    SEVERITY_COLORS[
      highestSeverity
    ];

  // ---------------------------------------------------
  // SINGLE ISSUE MARKER
  // ---------------------------------------------------

  if (issues.length === 1) {
    return L.divIcon({
      className: 'urbanpulse-map-marker',

      html: `
        <div
          style="
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          "
        ></div>
      `,

      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9],
    });
  }

  // ---------------------------------------------------
  // MULTIPLE ISSUES AT SAME LOCATION
  // ---------------------------------------------------

  const severityDots = issues
    .slice(0, 4)
    .map((issue) => {
      const severity =
        normalizeSeverity(
          issue.severity
        );

      const severityColor =
        SEVERITY_COLORS[
          severity
        ];

      return `
        <span
          style="
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: ${severityColor};
            display: inline-block;
            border: 1px solid white;
            margin-left: 2px;
          "
        ></span>
      `;
    })
    .join('');

  return L.divIcon({
    className: 'urbanpulse-map-marker',

    html: `
      <div
        style="
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 12px;
        "
      >
        ${issues.length}

        <div
          style="
            position: absolute;
            bottom: -7px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
          "
        >
          ${severityDots}
        </div>
      </div>
    `,

    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}


// =====================================================
// AUTO CENTER MAP
// =====================================================

function AutoCenter({ issues }) {
  const map = useMap();

  useEffect(() => {
    if (!issues || issues.length === 0) {
      return;
    }

    const validIssues =
      issues.filter((issue) =>
        isValidCoordinate(
          issue.latitude,
          issue.longitude
        )
      );

    if (validIssues.length === 0) {
      return;
    }

    const bounds =
      L.latLngBounds(
        validIssues.map((issue) => [
          Number(issue.latitude),
          Number(issue.longitude),
        ])
      );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14,
    });
  }, [issues, map]);

  return null;
}


// =====================================================
// MAP VIEW
// =====================================================

function MapView() {
  const navigate = useNavigate();

  const [issues, setIssues] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [severityFilter, setSeverityFilter] =
    useState('All');

  const [categoryFilter, setCategoryFilter] =
    useState('All');


  // ===================================================
  // LOAD ISSUES
  // ===================================================

  useEffect(() => {
    async function loadIssues() {
      try {
        setLoading(true);

        const data =
          await getIssues();

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

    loadIssues();
  }, []);


  // ===================================================
  // OPEN EXISTING ISSUE PAGE
  // ===================================================

  function openSeverityIssues(
    severity
  ) {
    navigate(
      `/issues?severity=${encodeURIComponent(
        severity
      )}`
    );
  }


  // ===================================================
  // CATEGORIES
  // ===================================================

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          issues
            .map(
              (issue) =>
                issue.category
            )
            .filter(Boolean)
        )
      ).sort(),
    ];
  }, [issues]);


  // ===================================================
  // FILTERED ISSUES
  // ===================================================

  const filteredIssues =
    useMemo(() => {
      return issues.filter(
        (issue) => {
          const matchesSeverity =
            severityFilter === 'All' ||
            normalizeSeverity(
              issue.severity
            ) === severityFilter;

          const matchesCategory =
            categoryFilter === 'All' ||
            issue.category ===
              categoryFilter;

          return (
            matchesSeverity &&
            matchesCategory
          );
        }
      );
    }, [
      issues,
      severityFilter,
      categoryFilter,
    ]);


  // ===================================================
  // VALID MAP ISSUES
  // ===================================================

  const validMapIssues =
    useMemo(() => {
      return filteredIssues.filter(
        (issue) =>
          isValidCoordinate(
            issue.latitude,
            issue.longitude
          )
      );
    }, [filteredIssues]);


  // ===================================================
  // GROUP ISSUES BY LOCATION
  // ===================================================

  const groupedLocations =
    useMemo(() => {
      const groups = new Map();

      validMapIssues.forEach(
        (issue) => {
          const latitude =
            Number(issue.latitude);

          const longitude =
            Number(issue.longitude);

          const key =
            `${latitude.toFixed(
              7
            )},${longitude.toFixed(
              7
            )}`;

          if (!groups.has(key)) {
            groups.set(key, {
              latitude,
              longitude,
              issues: [],
            });
          }

          groups
            .get(key)
            .issues.push(issue);
        }
      );

      return Array.from(
        groups.values()
      );
    }, [validMapIssues]);


  // ===================================================
  // SEVERITY COUNTS
  // ===================================================

  const severityCounts =
    useMemo(() => {
      return {
        Critical:
          issues.filter(
            (issue) =>
              normalizeSeverity(
                issue.severity
              ) === 'Critical'
          ).length,

        High:
          issues.filter(
            (issue) =>
              normalizeSeverity(
                issue.severity
              ) === 'High'
          ).length,

        Medium:
          issues.filter(
            (issue) =>
              normalizeSeverity(
                issue.severity
              ) === 'Medium'
          ).length,

        Low:
          issues.filter(
            (issue) =>
              normalizeSeverity(
                issue.severity
              ) === 'Low'
          ).length,
      };
    }, [issues]);


  // ===================================================
  // RESET FILTERS
  // ===================================================

  function resetFilters() {
    setSeverityFilter('All');
    setCategoryFilter('All');
  }


  // ===================================================
  // DEFAULT MAP CENTER
  // ===================================================

  const defaultCenter = [
    17.6868,
    83.2185,
  ];


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="page-heading">

        <p className="eyebrow">
          CITY INFRASTRUCTURE MAP
        </p>

        <h2>
          Urban Infrastructure Map
        </h2>

        <p>
          Visualize reported infrastructure
          issues and explore their severity,
          location, and impact.
        </p>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {/* =================================================
          SEVERITY SUMMARY
          CLICKING OPENS EXISTING Issue.jsx PAGE
      ================================================= */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >

        {/* CRITICAL */}

        <button
          type="button"
          onClick={() =>
            openSeverityIssues(
              'Critical'
            )
          }
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            borderRadius: '12px',
            padding: '18px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >

          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#991b1b',
              marginBottom: '6px',
            }}
          >
            CRITICAL
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#dc2626',
            }}
          >
            {severityCounts.Critical}
          </div>

          <div
            style={{
              marginTop: '5px',
              fontSize: '12px',
              color: '#7f1d1d',
            }}
          >
            View Critical Issues →
          </div>

        </button>


        {/* HIGH */}

        <button
          type="button"
          onClick={() =>
            openSeverityIssues(
              'High'
            )
          }
          style={{
            border: '1px solid #fed7aa',
            background: '#fff7ed',
            borderRadius: '12px',
            padding: '18px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >

          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#9a3412',
              marginBottom: '6px',
            }}
          >
            HIGH
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#ea580c',
            }}
          >
            {severityCounts.High}
          </div>

          <div
            style={{
              marginTop: '5px',
              fontSize: '12px',
              color: '#7c2d12',
            }}
          >
            View High Issues →
          </div>

        </button>


        {/* MEDIUM */}

        <button
          type="button"
          onClick={() =>
            openSeverityIssues(
              'Medium'
            )
          }
          style={{
            border: '1px solid #fde68a',
            background: '#fefce8',
            borderRadius: '12px',
            padding: '18px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >

          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#854d0e',
              marginBottom: '6px',
            }}
          >
            MEDIUM
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#ca8a04',
            }}
          >
            {severityCounts.Medium}
          </div>

          <div
            style={{
              marginTop: '5px',
              fontSize: '12px',
              color: '#713f12',
            }}
          >
            View Medium Issues →
          </div>

        </button>


        {/* LOW */}

        <button
          type="button"
          onClick={() =>
            openSeverityIssues(
              'Low'
            )
          }
          style={{
            border: '1px solid #bbf7d0',
            background: '#f0fdf4',
            borderRadius: '12px',
            padding: '18px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >

          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#166534',
              marginBottom: '6px',
            }}
          >
            LOW
          </div>

          <div
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#16a34a',
            }}
          >
            {severityCounts.Low}
          </div>

          <div
            style={{
              marginTop: '5px',
              fontSize: '12px',
              color: '#14532d',
            }}
          >
            View Low Issues →
          </div>

        </button>

      </section>


      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="panel">

        <div className="panel-header">

          <div>

            <h3>
              Map Filters
            </h3>

            <p>
              Filter the infrastructure
              issues displayed on the map.
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

          {/* SEVERITY */}

          <div className="form-group">

            <label htmlFor="map-severity">
              Severity
            </label>

            <select
              id="map-severity"
              value={severityFilter}
              onChange={(event) =>
                setSeverityFilter(
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


          {/* CATEGORY */}

          <div className="form-group">

            <label htmlFor="map-category">
              Category
            </label>

            <select
              id="map-category"
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

        </div>

      </section>


      {/* =================================================
          MAP
      ================================================= */}

      <section
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              LIVE ISSUE LOCATIONS
            </p>

            <h3>
              Infrastructure Issue Map
            </h3>

            <p>
              {filteredIssues.length} matching
              issue
              {filteredIssues.length === 1
                ? ''
                : 's'} found.
            </p>

          </div>

        </div>


        <div
          style={{
            height: '600px',
            width: '100%',
            borderRadius: '14px',
            overflow: 'hidden',
          }}
        >

          <MapContainer
            center={defaultCenter}
            zoom={12}
            scrollWheelZoom={true}
            style={{
              height: '100%',
              width: '100%',
            }}
          >

            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            <AutoCenter
              issues={validMapIssues}
            />


            {/* ==========================================
                MARKERS
            ========================================== */}

            {groupedLocations.map(
              (group) => (

                <Marker
                  key={`${group.latitude}-${group.longitude}`}
                  position={[
                    group.latitude,
                    group.longitude,
                  ]}
                  icon={createLocationMarkerIcon(
                    group
                  )}
                >

                  <Popup>

                    <div
                      style={{
                        minWidth: '250px',
                      }}
                    >

                      <strong
                        style={{
                          display: 'block',
                          marginBottom: '10px',
                          fontSize: '15px',
                        }}
                      >
                        {group.issues.length}{' '}
                        Issue
                        {group.issues.length ===
                        1
                          ? ''
                          : 's'}{' '}
                        at this location
                      </strong>


                      {group.issues.map(
                        (issue) => {

                          const severity =
                            normalizeSeverity(
                              issue.severity
                            );

                          const color =
                            SEVERITY_COLORS[
                              severity
                            ];

                          return (
                            <div
                              key={issue.id}
                              style={{
                                padding:
                                  '10px 0',
                                borderTop:
                                  '1px solid #e5e7eb',
                              }}
                            >

                              <div
                                style={{
                                  fontWeight:
                                    '700',
                                  marginBottom:
                                    '4px',
                                }}
                              >
                                {issue.title}
                              </div>

                              <div
                                style={{
                                  fontSize:
                                    '12px',
                                  color:
                                    '#6b7280',
                                  marginBottom:
                                    '6px',
                                }}
                              >
                                {issue.category}
                              </div>

                              <span
                                style={{
                                  display:
                                    'inline-block',
                                  padding:
                                    '3px 8px',
                                  borderRadius:
                                    '999px',
                                  background:
                                    color,
                                  color:
                                    'white',
                                  fontSize:
                                    '11px',
                                  fontWeight:
                                    '700',
                                }}
                              >
                                {severity}
                              </span>

                              <div
                                style={{
                                  marginTop:
                                    '6px',
                                  fontSize:
                                    '12px',
                                }}
                              >
                                Status:{' '}
                                {issue.status}
                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </Popup>

                </Marker>

              )
            )}

          </MapContainer>

        </div>


        {/* =================================================
            INVALID COORDINATE WARNING
        ================================================= */}

        {filteredIssues.length >
          validMapIssues.length && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#fff7ed',
              border:
                '1px solid #fed7aa',
              color: '#9a3412',
              fontSize: '13px',
            }}
          >
            Some issues could not be
            displayed because their
            coordinates are invalid.
          </div>
        )}

      </section>


      {/* =================================================
          SEVERITY LEGEND
      ================================================= */}

      <section
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              MAP LEGEND
            </p>

            <h3>
              Severity Levels
            </h3>

            <p>
              Click a severity above to open
              its existing issues in Issue.jsx.
            </p>

          </div>

        </div>


        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '18px',
          }}
        >

          {[
            'Critical',
            'High',
            'Medium',
            'Low',
          ].map((severity) => (

            <button
              key={severity}
              type="button"
              onClick={() =>
                openSeverityIssues(
                  severity
                )
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                background:
                  'transparent',
                cursor: 'pointer',
                padding: '4px',
              }}
            >

              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius:
                    '50%',
                  background:
                    SEVERITY_COLORS[
                      severity
                    ],
                  display:
                    'inline-block',
                }}
              />

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {severity}
              </span>

            </button>

          ))}

        </div>

      </section>


      {/* =================================================
          MAPPED ISSUE LIST
      ================================================= */}

      <section
        className="panel"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="panel-header">

          <div>

            <p className="eyebrow">
              MAPPED ISSUES
            </p>

            <h3>
              Issues on Map
            </h3>

            <p>
              Existing infrastructure issue
              records currently matching the
              map filters.
            </p>

          </div>

        </div>


        {loading ? (

          <div className="loading">
            Loading infrastructure issues...
          </div>

        ) : filteredIssues.length ===
          0 ? (

          <div className="loading">
            No issues match the selected
            filters.
          </div>

        ) : (

          <div
            style={{
              display: 'grid',
              gap: '10px',
            }}
          >

            {filteredIssues.map(
              (issue) => {

                const severity =
                  normalizeSeverity(
                    issue.severity
                  );

                const color =
                  SEVERITY_COLORS[
                    severity
                  ];

                return (
                  <div
                    key={issue.id}
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                      gap: '15px',
                      padding:
                        '14px 16px',
                      border:
                        '1px solid #e5e7eb',
                      borderRadius:
                        '10px',
                    }}
                  >

                    <div>

                      <div
                        style={{
                          fontWeight:
                            '700',
                          marginBottom:
                            '4px',
                        }}
                      >
                        {issue.title}
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#6b7280',
                        }}
                      >
                        {issue.category}
                        {' · '}
                        {issue.status}
                      </div>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        openSeverityIssues(
                          severity
                        )
                      }
                      style={{
                        border: 'none',
                        borderRadius:
                          '999px',
                        padding:
                          '5px 10px',
                        background:
                          color,
                        color:
                          'white',
                        fontWeight:
                          '700',
                        fontSize:
                          '11px',
                        cursor:
                          'pointer',
                      }}
                    >
                      {severity}
                    </button>

                  </div>
                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}

export default MapView;