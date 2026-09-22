import React, { useState } from 'react';
import { createIssue } from '../services/api';

const CATEGORIES = [
  'Road Damage',
  'Road Safety',
  'Streetlight',
  'Waterlogging',
  'Garbage',
  'Drainage',
  'Other',
];

const SEVERITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

function ReportIssue() {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Road Damage',
    description: '',
    latitude: '',
    longitude: '',
    severity: 'Medium',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    const title = formData.title.trim();
    const description = formData.description.trim();

    if (!title) {
      setError('Please enter an issue title.');
      return;
    }

    if (title.length < 5) {
      setError('Issue title must contain at least 5 characters.');
      return;
    }

    if (!description) {
      setError('Please enter an issue description.');
      return;
    }

    if (description.length < 10) {
      setError(
        'Issue description must contain at least 10 characters.'
      );
      return;
    }

    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);

    if (!Number.isFinite(latitude)) {
      setError('Please enter a valid latitude.');
      return;
    }

    if (latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90 and 90.');
      return;
    }

    if (!Number.isFinite(longitude)) {
      setError('Please enter a valid longitude.');
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180 and 180.');
      return;
    }

    try {
      setLoading(true);

      const response = await createIssue({
        title,
        category: formData.category,
        description,
        latitude,
        longitude,
        severity: formData.severity,
      });

      setSuccess(
        response?.message ||
          'Infrastructure issue reported successfully.'
      );

      setFormData({
        title: '',
        category: 'Road Damage',
        description: '',
        latitude: '',
        longitude: '',
        severity: 'Medium',
      });
    } catch (err) {
      console.error('Report issue error:', err);

      setError(
        err.message ||
          'Failed to submit infrastructure issue. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* PAGE HEADER */}
      <section className="page-heading">
        <p className="eyebrow">
          CITIZEN REPORTING
        </p>

        <h2>Report Infrastructure Issue</h2>

        <p>
          Help identify abnormal conditions and infrastructure
          problems across the city.
        </p>
      </section>

      {/* REPORT FORM */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Submit New Issue</h3>

            <p>
              Provide accurate information about the
              infrastructure problem.
            </p>
          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {success && (
          <div className="success-box">
            <h3>Report Submitted</h3>
            <p>{success}</p>
            <p>
              The issue has been added to the UrbanPulse
              infrastructure database.
            </p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-box">
            <h3>Unable to Submit Report</h3>
            <p>{error}</p>
          </div>
        )}

        <form
          className="report-form"
          onSubmit={handleSubmit}
        >
          {/* TITLE */}
          <div className="form-group">
            <label htmlFor="title">
              Issue Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Example: Large pothole near main road"
              maxLength={150}
              disabled={loading}
            />

            <small>
              {formData.title.length}/150 characters
            </small>
          </div>

          {/* CATEGORY */}
          <div className="form-group">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION */}
          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what is happening, where it is located, and how it affects people."
              rows={6}
              maxLength={2000}
              disabled={loading}
            />

            <small>
              {formData.description.length}/2000 characters
            </small>
          </div>

          {/* LOCATION */}
          <div className="form-section">
            <div className="form-section-header">
              <div>
                <h3>Location</h3>

                <p>
                  Enter the geographic coordinates of
                  the reported issue.
                </p>
              </div>
            </div>

            <div className="form-grid">
              {/* LATITUDE */}
              <div className="form-group">
                <label htmlFor="latitude">
                  Latitude
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Example: 22.5802100"
                  disabled={loading}
                />

                <small>
                  Valid range: -90 to 90
                </small>
              </div>

              {/* LONGITUDE */}
              <div className="form-group">
                <label htmlFor="longitude">
                  Longitude
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Example: 88.4312500"
                  disabled={loading}
                />

                <small>
                  Valid range: -180 to 180
                </small>
              </div>
            </div>
          </div>

          {/* SEVERITY */}
          <div className="form-group">
            <label htmlFor="severity">
              Severity
            </label>

            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              disabled={loading}
            >
              {SEVERITIES.map((severity) => (
                <option
                  key={severity}
                  value={severity}
                >
                  {severity}
                </option>
              ))}
            </select>

            <small>
              Select Critical only when the infrastructure
              condition represents an immediate serious risk.
            </small>
          </div>

          {/* SUBMIT */}
          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? 'Submitting Report...'
                : 'Submit Infrastructure Report'}
            </button>
          </div>
        </form>
      </section>

      {/* INFORMATION PANEL */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>How UrbanPulse Uses Your Report</h3>

            <p>
              Submitted infrastructure issues become part
              of the city intelligence system.
            </p>
          </div>
        </div>

        <div className="issue-list">
          <div className="issue-row">
            <div>
              <h4>1. Issue Recorded</h4>
              <p>
                The reported condition is stored in the
                UrbanPulse infrastructure database.
              </p>
            </div>
          </div>

          <div className="issue-row">
            <div>
              <h4>2. Location Added to Map</h4>
              <p>
                Valid geographic coordinates allow the
                issue to appear on the infrastructure map.
              </p>
            </div>
          </div>

          <div className="issue-row">
            <div>
              <h4>3. Intelligence Analysis</h4>
              <p>
                Severity and issue information can be used
                by UrbanPulse to identify infrastructure
                risks and patterns.
              </p>
            </div>
          </div>

          <div className="issue-row">
            <div>
              <h4>4. Response Tracking</h4>
              <p>
                The issue begins with a Reported status and
                can later be moved through In Progress and
                Resolved.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ReportIssue;