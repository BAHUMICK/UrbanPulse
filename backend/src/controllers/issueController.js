const pool = require('../config/db');

const VALID_CATEGORIES = [
  'Road Damage',
  'Road Safety',
  'Streetlight',
  'Waterlogging',
  'Garbage',
  'Drainage',
  'Other'
];

const VALID_SEVERITIES = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

const VALID_STATUSES = [
  'Reported',
  'In Progress',
  'Resolved'
];

/**
 * GET /api/issues
 */
const getAllIssues = async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        title,
        category,
        description,
        latitude,
        longitude,
        severity,
        status,
        created_at
      FROM issues
      ORDER BY created_at DESC;
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error(
      'Error fetching issues:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch infrastructure issues',
      error: err.message
    });
  }
};

/**
 * POST /api/issues
 */
const createIssue = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      latitude,
      longitude,
      severity
    } = req.body;

    const cleanTitle =
      typeof title === 'string'
        ? title.trim()
        : '';

    const cleanDescription =
      typeof description === 'string'
        ? description.trim()
        : '';

    const numericLatitude =
      Number(latitude);

    const numericLongitude =
      Number(longitude);

    // Title validation
    if (!cleanTitle) {
      return res.status(400).json({
        success: false,
        message: 'Issue title is required.'
      });
    }

    if (cleanTitle.length < 5) {
      return res.status(400).json({
        success: false,
        message:
          'Issue title must contain at least 5 characters.'
      });
    }

    if (cleanTitle.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          'Issue title must not exceed 150 characters.'
      });
    }

    // Category validation
    if (
      !VALID_CATEGORIES.includes(category)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid issue category.'
      });
    }

    // Description validation
    if (!cleanDescription) {
      return res.status(400).json({
        success: false,
        message:
          'Issue description is required.'
      });
    }

    if (cleanDescription.length < 10) {
      return res.status(400).json({
        success: false,
        message:
          'Issue description must contain at least 10 characters.'
      });
    }

    if (cleanDescription.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          'Issue description must not exceed 2000 characters.'
      });
    }

    // Latitude validation
    if (
      !Number.isFinite(numericLatitude)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Latitude must be a valid number.'
      });
    }

    if (
      numericLatitude < -90 ||
      numericLatitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Latitude must be between -90 and 90.'
      });
    }

    // Longitude validation
    if (
      !Number.isFinite(numericLongitude)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Longitude must be a valid number.'
      });
    }

    if (
      numericLongitude < -180 ||
      numericLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Longitude must be between -180 and 180.'
      });
    }

    // Severity validation
    if (
      !VALID_SEVERITIES.includes(severity)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide a valid severity.'
      });
    }

    const query = `
      INSERT INTO issues (
        title,
        category,
        description,
        latitude,
        longitude,
        severity,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'Reported'
      )
      RETURNING
        id,
        title,
        category,
        description,
        latitude,
        longitude,
        severity,
        status,
        created_at;
    `;

    const values = [
      cleanTitle,
      category,
      cleanDescription,
      numericLatitude,
      numericLongitude,
      severity
    ];

    const result =
      await pool.query(
        query,
        values
      );

    return res.status(201).json({
      success: true,
      message:
        'Infrastructure issue created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(
      'Error creating issue:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to create infrastructure issue',
      error: err.message
    });
  }
};

/**
 * PUT /api/issues/:id/status
 */
const updateIssueStatus = async (
  req,
  res
) => {
  try {
    const issueId =
      Number(req.params.id);

    const { status } = req.body;

    if (
      !Number.isInteger(issueId) ||
      issueId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID.'
      });
    }

    if (
      !VALID_STATUSES.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid issue status.'
      });
    }

    const query = `
      UPDATE issues
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        title,
        category,
        description,
        latitude,
        longitude,
        severity,
        status,
        created_at;
    `;

    const result =
      await pool.query(
        query,
        [status, issueId]
      );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          'Infrastructure issue not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Issue status updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(
      'Error updating issue status:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update issue status',
      error: err.message
    });
  }
};

module.exports = {
  getAllIssues,
  createIssue,
  updateIssueStatus
};