import React, { useState, useEffect, useRef } from 'react';
import {
  createIssue,
  CIVIC_SECTORS,
  SECTOR_CATEGORIES,
  CATEGORY_TO_SECTOR,
} from '../services/api';
import {
  IconReport,
  IconMapPin,
  IconAlertTriangle,
  IconCheckCircle,
  IconUpload,
  IconImage,
  IconVideo,
  IconClose,
  IconSector,
} from '../components/Icons';

const INITIAL_FORM = {
  sector: 'Roads & Transportation',
  category: 'Road Damage',
  title: '',
  description: '',
  latitude: '',
  longitude: '',
  severity: 'High',
  status: 'Reported',
};

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

// Metro coordinates presets for live demo & presentation
const DEMO_PRESETS = [
  { label: 'Sector 5 IT Corridor', lat: '22.580210', lng: '88.431250' },
  { label: 'EM Bypass Junction', lat: '22.565430', lng: '88.352100' },
  { label: 'Salt Lake Gate 3', lat: '22.572450', lng: '88.421890' },
  { label: 'New Town Expressway', lat: '22.591200', lng: '88.468900' },
];

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function ReportIssue({ onIssueCreated }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'video'

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  // Compute available categories for the currently selected sector
  const availableCategories =
    SECTOR_CATEGORIES[form.sector] || [
      'Road Damage',
      'Road Safety',
      'Streetlight',
      'Waterlogging',
      'Garbage',
      'Drainage',
      'Other',
    ];

  // If selected category is not in the new sector's categories, reset to the first one
  useEffect(() => {
    if (!availableCategories.includes(form.category)) {
      setForm((prev) => ({
        ...prev,
        category: availableCategories[0] || 'Other',
      }));
    }
  }, [form.sector, availableCategories]);

  // Clean up preview object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
    setSuccessMsg('');
  }

  function handleSectorChange(e) {
    const selectedSector = e.target.value;
    const cats = SECTOR_CATEGORIES[selectedSector] || ['Other'];
    setForm((prev) => ({
      ...prev,
      sector: selectedSector,
      category: cats[0] || 'Other',
    }));
    setErrorMsg('');
  }

  function applyPreset(preset) {
    setForm((prev) => ({
      ...prev,
      latitude: preset.lat,
      longitude: preset.lng,
    }));
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');

    // Validate mime type
    const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isExtAllowed = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'webm', 'mov'].includes(ext);

    if (!isMimeAllowed && !isExtAllowed) {
      setErrorMsg(
        `Unsupported file type (${file.type || ext}). Please upload a photo (JPG, PNG, WEBP) or video (MP4, WEBM, MOV).`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (50MB)
    if (file.size > MAX_FILE_SIZE) {
      setErrorMsg(
        `Selected file is too large (${formatBytes(file.size)}). Maximum upload size is 50MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Revoke previous preview URL if any
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const newUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);

    setEvidenceFile(file);
    setPreviewUrl(newUrl);
    setFileType(isVideo ? 'video' : 'image');
  }

  function handleRemoveFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setEvidenceFile(null);
    setPreviewUrl(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function validate() {
    if (!form.sector) {
      return 'Please select a municipal service sector.';
    }
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
        sector: form.sector,
        title: form.title.trim(),
        category: form.category,
        description: form.description.trim(),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        severity: form.severity,
        status: form.status,
      };

      const files = evidenceFile ? [evidenceFile] : [];
      await createIssue(payload, files);

      setSuccessMsg(
        'Infrastructure anomaly report filed successfully into UrbanPulse repository.' +
          (evidenceFile ? ' Evidence proof attached.' : '')
      );

      // Clean up
      handleRemoveFile();
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
            <span className="intel-header-badge">CIVIC INGESTION</span>
            <div>
              <div className="intel-header-title">Report Civic Infrastructure Issue</div>
              <div className="intel-header-sub">
                Capture anomalies across municipal sectors with verified image/video proof
              </div>
            </div>
          </div>
        </div>

        <div className="intel-card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-two-col">
              {/* LEFT COLUMN: SECTOR, CATEGORY, TITLE, DESCRIPTION, SEVERITY */}
              <div>
                {/* 1. MUNICIPAL SECTOR */}
                <div className="form-group-custom">
                  <label className="form-label" htmlFor="inp-sector">
                    <IconSector size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                    Municipal Service Sector *
                  </label>
                  <select
                    id="inp-sector"
                    name="sector"
                    className="form-select-custom"
                    value={form.sector}
                    onChange={handleSectorChange}
                    required
                  >
                    {CIVIC_SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: 4, display: 'block' }}>
                    Defines the high-level municipal responsibility area for authority dispatch.
                  </small>
                </div>

                {/* 2. CATEGORY (FILTERED BY SECTOR) */}
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
                    {availableCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. TITLE */}
                <div className="form-group-custom">
                  <label className="form-label" htmlFor="inp-title">
                    Anomaly Title *
                  </label>
                  <input
                    id="inp-title"
                    type="text"
                    name="title"
                    className="form-input-custom"
                    placeholder="e.g. Deep Pothole on Sector 5 Arterial Road"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* 4. SEVERITY & STATUS */}
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

                {/* 5. DESCRIPTION */}
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
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* RIGHT COLUMN: LOCATION COORDINATES & EVIDENCE / PROOF UPLOAD */}
              <div>
                {/* LOCATION COORDINATES */}
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

                {/* ===================================================== */}
                {/* EVIDENCE / PROOF UPLOAD SECTION */}
                {/* ===================================================== */}
                <div className="evidence-upload-section">
                  <div className="evidence-header">
                    <div>
                      <span className="evidence-title">EVIDENCE / PROOF</span>
                      <p className="evidence-subtitle">
                        Upload photos or short videos to help verify the reported issue (Optional).
                      </p>
                    </div>
                    <span className="evidence-optional-tag">Optional</span>
                  </div>

                  {/* HIDDEN FILE INPUT */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.mov"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />

                  {/* DROPZONE / UPLOAD TRIGGER (WHEN NO FILE SELECTED) */}
                  {!evidenceFile ? (
                    <div
                      className="evidence-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon-wrap">
                        <IconUpload size={22} />
                      </div>
                      <div className="dropzone-text-bold">
                        Click or drag to attach Image or Video
                      </div>
                      <div className="dropzone-text-sub">
                        Supported: JPG, PNG, WEBP (Photos) • MP4, WEBM, MOV (Videos)
                      </div>
                      <div className="dropzone-badge">Max 50MB per file</div>
                    </div>
                  ) : (
                    /* ATTACHED EVIDENCE PREVIEW CARD */
                    <div className="evidence-preview-card">
                      <div className="preview-media-container">
                        {fileType === 'image' ? (
                          <img
                            src={previewUrl}
                            alt="Selected evidence preview"
                            className="preview-img"
                          />
                        ) : (
                          <video
                            src={previewUrl}
                            controls
                            className="preview-video"
                          />
                        )}
                      </div>

                      <div className="preview-info-row">
                        <div className="preview-meta">
                          <span className="preview-badge">
                            {fileType === 'video' ? (
                              <>
                                <IconVideo size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                                Video Evidence
                              </>
                            ) : (
                              <>
                                <IconImage size={13} style={{ marginRight: 4, verticalAlign: -1 }} />
                                Image Evidence
                              </>
                            )}
                          </span>
                          <span className="preview-filename" title={evidenceFile.name}>
                            {evidenceFile.name}
                          </span>
                          <span className="preview-filesize">
                            ({formatBytes(evidenceFile.size)})
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-remove-evidence"
                          onClick={handleRemoveFile}
                          title="Remove attached evidence"
                        >
                          <IconClose size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}
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
                    marginTop: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Automated Processing Pipeline:
                  </div>
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    <li>
                      Selected <strong>Sector</strong> determines municipal department dispatch.
                    </li>
                    <li>
                      Evidence media is securely stored and available on the incident triage desk.
                    </li>
                    <li>
                      Priority scores are computed automatically based on severity, density, and category.
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
                onClick={() => {
                  setForm(INITIAL_FORM);
                  handleRemoveFile();
                }}
                disabled={submitting}
              >
                Reset Form
              </button>

              <button type="submit" className="form-submit-btn" disabled={submitting}>
                {submitting ? 'Ingesting into UrbanPulse...' : 'Submit Incident Report →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;