import React, { useState } from 'react';
import { createIssue } from '../services/api';
import { IconReport, IconMapPin, IconAlertTriangle, IconCheckCircle } from '../components/Icons';

const INITIAL_FORM = {
  title: '',
  category: '',
  description: '',
  latitude: '',
  longitude: '',
  severity: 'High',
  status: 'Reported',
};

const CATEGORIES = [
  'Road Damage',
  'Road Safety',
  'Streetlight',
  'Waterlogging',
  'Garbage',
  'Drainage',
  'Other',
];

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Metro coordinates presets for live demo & presentation
const DEMO_PRESETS = [
  { label: 'Sector 5 IT Corridor', lat: '22.580210', lng: '88.431250' },
  { label: 'EM Bypass Junction', lat: '22.565430', lng: '88.352100' },
  { label: 'Salt Lake Gate 3', lat: '22.572450', lng: '88.421890' },
  { label: 'New Town Expressway', lat: '22.591200', lng: '88.468900' },
];

function ReportIssue({ onIssueCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  }

  function applyPreset(preset) {
    setForm((prev) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng,
    }));
  }

  function validate() {
    if (!form.title.trim() || form.title.trim().length < 5) {
      return 'Incident title must be at least 5 characters.';
    }
    if (!form.category) {
      return 'Please select an infrastructure category.';
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      return 'Description must be at least 10 characters.';
    }
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!form.latitude.toString().trim() || isNaN(lat) || lat < -90 || lat > 90) {
      return 'Latitude must be a valid coordinate between -90 and 90.';
    }
    if (!form.longitude.toString().trim() || isNaN(lng) || lng < -180 || lng > 180) {
      return 'Longitude must be a valid coordinate between -180 and 180.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccessMsg('');

      const payload = {
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        severity: form.severity,
        status: form.status,
      };

      await createIssue(payload);

      setSuccessMsg('Infrastructure anomaly report filed successfully into UrbanPulse repository.');
      setForm(INITIAL_FORM);

      if (onIssueCreated) {
        setTimeout(() => onIssueCreated(), 1500);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit incident report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="report-form-container">
      {successMsg && (
        <div className="feedback-banner feedback-success">
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="feedback-banner feedback-error">
          <IconAlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="intel-card">
        <div className="intel-card-header">
          <div className="intel-header-left">
            <span className="intel-header-badge">INCIDENT INGESTION</span>
            <div>
              <div className="intel-header-title">Citizen / Telemetry Anomaly Intake</div>
              <div className="intel-header-sub">
                Capture infrastructure defects for heuristic impact evaluation
              </div>
            </div>
          </div>
        </div>

        <div className="intel-card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-two-col">
              {/* LEFT COLUMN: TITLE, CATEGORY, SEVERITY, STATUS */}
              <div>
                <div className="form-group-custom">
                  <label className="form-label" htmlFor="inp-title">
                    Anomaly Title *
                  </label>
                  <input
                    id="inp-title"
                    type="text"
                    name="title"
                    className="form-input-custom"
                    placeholder="e.g. Broken Water Main on Arterial Road"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group-custom">
                  <label className="form-label" htmlFor="inp-cat">
                    Infrastructure Category *
                  </label>
                  <select
                    id="inp-cat"
                    name="category"
                    className="form-select-custom"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Category...</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-custom">
                    <label className="form-label" htmlFor="inp-sev">
                      Severity Level *
                    </label>
                    <select
                      id="inp-sev"
                      name="severity"
                      className="form-select-custom"
                      value={form.severity}
                      onChange={handleChange}
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s} Severity
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label" htmlFor="inp-stat">
                      Initial Status
                    </label>
                    <select
                      id="inp-stat"
                      name="status"
                      className="form-select-custom"
                      value={form.status}
                      onChange={handleChange}
                    >
                      <option value="Reported">Reported</option>
                      <option value="In Progress">In Progress</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-custom">
                  <label className="form-label" htmlFor="inp-desc">
                    Incident Description *
                  </label>
                  <textarea
                    id="inp-desc"
                    name="description"
                    className="form-textarea-custom"
                    placeholder="Provide details on location specifics, risk of accidents, traffic disruption or hazard..."
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: LOCATION COORDINATES & LIVE PRESETS */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group-custom">
                    <label className="form-label" htmlFor="inp-lat">
                      Latitude (DD) *
                    </label>
                    <input
                      id="inp-lat"
                      type="text"
                      name="latitude"
                      className="form-input-custom"
                      placeholder="e.g. 22.580210"
                      value={form.latitude}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group-custom">
                    <label className="form-label" htmlFor="inp-lng">
                      Longitude (DD) *
                    </label>
                    <input
                      id="inp-lng"
                      type="text"
                      name="longitude"
                      className="form-input-custom"
                      placeholder="e.g. 88.431250"
                      value={form.longitude}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* PRESENTATION DEMO PRESETS */}
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    <IconMapPin size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                    Quick Coordinates Presets (For Live Presentation Demo):
                  </label>
                  <div className="presets-container">
                    {DEMO_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className="preset-chip"
                        onClick={() => applyPreset(p)}
                      >
                        📍 {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* INGESTION GUIDELINES HELPER CARD */}
                <div
                  style={{
                    background: 'var(--bg-card-inner)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    padding: '12px 14px',
                    fontSize: '11.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Automated Processing Pipeline:
                  </div>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    <li>
                      Coordinate validation ensures spatial clustering on the GIS Map.
                    </li>
                    <li>
                      High and Critical reports automatically generate a Municipal Alert.
                    </li>
                    <li>
                      Priority scores are dynamically computed based on severity, density, and category.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <button
                type="button"
                className="btn-ack"
                onClick={() => setForm(INITIAL_FORM)}
                disabled={submitting}
              >
                Reset Form
              </button>

              <button type="submit" className="form-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting to UrbanPulse...' : 'Submit Incident Report →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;