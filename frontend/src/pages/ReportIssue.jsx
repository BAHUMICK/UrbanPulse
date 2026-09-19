import React, { useState } from 'react';

const INITIAL_FORM_DATA = {
  title: '',
  category: '',
  description: '',
  latitude: '',
  longitude: '',
  severity: 'Medium',
};

const VALID_CATEGORIES = [
  'Road Damage',
  'Road Safety',
  'Streetlight',
  'Waterlogging',
  'Garbage',
  'Drainage',
  'Other',
];

const VALID_SEVERITIES = [
  'Low',
  'Medium',
  'High',
  'Critical',
];

function ReportIssue() {
  const [formData, setFormData] =
    useState(INITIAL_FORM_DATA);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
    setMessage('');
  }

  function validateForm() {
    const title =
      formData.title.trim();

    const description =
      formData.description.trim();

    const latitude =
      Number(formData.latitude);

    const longitude =
      Number(formData.longitude);

    if (!title) {
      return 'Issue title is required.';
    }

    if (title.length < 5) {
      return 'Issue title must contain at least 5 characters.';
    }

    if (title.length > 150) {
      return 'Issue title must not exceed 150 characters.';
    }

    if (!formData.category) {
      return 'Please select an issue category.';
    }

    if (
      !VALID_CATEGORIES.includes(
        formData.category
      )
    ) {
      return 'Please select a valid issue category.';
    }

    if (!description) {
      return 'Issue description is required.';
    }

    if (description.length < 10) {
      return 'Issue description must contain at least 10 characters.';
    }

    if (description.length > 2000) {
      return 'Issue description must not exceed 2000 characters.';
    }

    if (formData.latitude.trim() === '') {
      return 'Latitude is required.';
    }

    if (!Number.isFinite(latitude)) {
      return 'Latitude must be a valid number.';
    }

    if (
      latitude < -90 ||
      latitude > 90
    ) {
      return 'Latitude must be between -90 and 90.';
    }

    if (formData.longitude.trim() === '') {
      return 'Longitude is required.';
    }

    if (!Number.isFinite(longitude)) {
      return 'Longitude must be a valid number.';
    }

    if (
      longitude < -180 ||
      longitude > 180
    ) {
      return 'Longitude must be between -180 and 180.';
    }

    if (
      !VALID_SEVERITIES.includes(
        formData.severity
      )
    ) {
      return 'Please select a valid severity.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage('');
    setError('');

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        'http://localhost:5000/api/issues',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            ...formData,
            title: formData.title.trim(),
            description:
              formData.description.trim(),
            latitude:
              Number(formData.latitude),
            longitude:
              Number(formData.longitude),
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Failed to create issue'
        );
      }

      setMessage(
        'Issue reported successfully.'
      );

      setFormData({
        ...INITIAL_FORM_DATA,
      });
    } catch (err) {
      setError(
        err.message ||
          'Failed to report issue.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <section className="page-heading">
        <p className="eyebrow">
          ISSUE REPORTING
        </p>

        <h2>
          Report Infrastructure Issue
        </h2>

        <p>
          Submit a new city infrastructure
          issue to UrbanPulse.
        </p>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>
              Infrastructure Issue Details
            </h3>

            <p>
              Provide accurate information
              so UrbanPulse can assess the
              issue correctly.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="report-form"
          noValidate
        >
          <div className="form-group">
            <label htmlFor="issue-title">
              Issue Title
            </label>

            <input
              id="issue-title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Example: Deep pothole near main junction"
              maxLength="150"
            />

            <small>
              {formData.title.length}/150
              characters
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="issue-category">
              Category
            </label>

            <select
              id="issue-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              <option value="">
                Select category
              </option>

              <option value="Road Damage">
                Road Damage
              </option>

              <option value="Road Safety">
                Road Safety
              </option>

              <option value="Streetlight">
                Streetlight
              </option>

              <option value="Waterlogging">
                Waterlogging
              </option>

              <option value="Garbage">
                Garbage
              </option>

              <option value="Drainage">
                Drainage
              </option>

              <option value="Other">
                Other
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="issue-description">
              Description
            </label>

            <textarea
              id="issue-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              placeholder="Describe what happened, where it happened, and the visible impact."
              maxLength="2000"
            />

            <small>
              {formData.description.length}
              /2000 characters
            </small>
          </div>

          <div className="report-coordinate-grid">
            <div className="form-group">
              <label htmlFor="issue-latitude">
                Latitude
              </label>

              <input
                id="issue-latitude"
                type="number"
                step="any"
                min="-90"
                max="90"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Example: 22.5741"
              />

              <small>
                Valid range: -90 to 90
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="issue-longitude">
                Longitude
              </label>

              <input
                id="issue-longitude"
                type="number"
                step="any"
                min="-180"
                max="180"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Example: 88.4329"
              />

              <small>
                Valid range: -180 to 180
              </small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="issue-severity">
              Severity
            </label>

            <select
              id="issue-severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
            >
              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>

              <option value="Critical">
                Critical
              </option>
            </select>
          </div>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          {message && (
            <div className="success-box">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="primary-button"
            disabled={submitting}
          >
            {submitting
              ? 'Submitting...'
              : 'Report Issue'}
          </button>
        </form>
      </section>
    </div>
  );
}

export default ReportIssue;