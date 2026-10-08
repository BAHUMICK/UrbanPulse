const pool = require('../config/db');

const {
  generateAlertForIssue
} = require('../services/alertService');

const VALID_SECTORS = [
  'Roads & Transportation',
  'Traffic & Road Safety',
  'Water Supply & Drainage',
  'Fire & Emergency Services',
  'Solid Waste Management',
  'Street Lighting',
  'Public Infrastructure',
  'Environment & Pollution',
  'Parks & Public Spaces',
  'Public Health & Sanitation',
  'Other Civic Services'
];

const VALID_CATEGORIES = [
  'Road Damage',
  'Road Safety',
  'Streetlight',
  'Waterlogging',
  'Garbage',
  'Drainage',
  'Other'
];

const CATEGORY_TO_SECTOR_MAP = {
  'Road Damage': 'Roads & Transportation',
  'Road Safety': 'Traffic & Road Safety',
  'Streetlight': 'Street Lighting',
  'Waterlogging': 'Water Supply & Drainage',
  'Drainage': 'Water Supply & Drainage',
  'Garbage': 'Solid Waste Management',
  'Other': 'Other Civic Services'
};

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
 * Returns all infrastructure issues with municipal sector and attached evidence.
 * Supports optional query params: ?sector=...&category=...&severity=...&status=...
 */
const getAllIssues = async (req, res) => {
  try {
    const { sector, category, severity, status } = req.query;

    const whereClauses = [];
    const values = [];

    if (sector && sector !== 'All') {
      values.push(sector);
      whereClauses.push(`i.sector = $${values.length}`);
    }

    if (category && category !== 'All') {
      values.push(category);
      whereClauses.push(`i.category = $${values.length}`);
    }

    if (severity && severity !== 'All') {
      values.push(severity);
      whereClauses.push(`i.severity = $${values.length}`);
    }

    if (status && status !== 'All') {
      values.push(status);
      whereClauses.push(`i.status = $${values.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT
        i.id,
        i.sector,
        i.title,
        i.category,
        i.description,
        i.latitude,
        i.longitude,
        i.severity,
        i.status,
        i.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'file_name', e.file_name,
              'file_path', e.file_path,
              'file_type', e.file_type,
              'file_size', e.file_size,
              'created_at', e.created_at
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS evidence
      FROM issues i
      LEFT JOIN issue_evidence e ON i.id = e.issue_id
      ${whereSql}
      GROUP BY i.id
      ORDER BY i.created_at DESC;
    `;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error('Error fetching issues:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch infrastructure issues',
      error: err.message
    });
  }
};

/**
 * GET /api/issues/:id
 * Returns a single issue by ID with sector and evidence.
 */
const getIssueById = async (req, res) => {
  try {
    const issueId = Number(req.params.id);

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID.'
      });
    }

    const query = `
      SELECT
        i.id,
        i.sector,
        i.title,
        i.category,
        i.description,
        i.latitude,
        i.longitude,
        i.severity,
        i.status,
        i.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'file_name', e.file_name,
              'file_path', e.file_path,
              'file_type', e.file_type,
              'file_size', e.file_size,
              'created_at', e.created_at
            )
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) AS evidence
      FROM issues i
      LEFT JOIN issue_evidence e ON i.id = e.issue_id
      WHERE i.id = $1
      GROUP BY i.id;
    `;

    const result = await pool.query(query, [issueId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Infrastructure issue not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching issue by ID:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch infrastructure issue details',
      error: err.message
    });
  }
};

/**
 * POST /api/issues
 * Ingests an infrastructure anomaly with civic sector and optional proof/evidence media.
 */
const createIssue = async (req, res) => {
  try {
    const {
      sector,
      title,
      category,
      description,
      latitude,
      longitude,
      severity
    } = req.body;

    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const numericLatitude = Number(latitude);
    const numericLongitude = Number(longitude);

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
        message: 'Issue title must contain at least 5 characters.'
      });
    }

    if (cleanTitle.length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Issue title must not exceed 150 characters.'
      });
    }

    // Category validation
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid issue category.'
      });
    }

    // Sector assignment & validation (auto-maps from category if omitted)
    let assignedSector = typeof sector === 'string' ? sector.trim() : '';
    if (!assignedSector || !VALID_SECTORS.includes(assignedSector)) {
      assignedSector = CATEGORY_TO_SECTOR_MAP[category] || 'Other Civic Services';
    }

    // Description validation
    if (!cleanDescription) {
      return res.status(400).json({
        success: false,
        message: 'Issue description is required.'
      });
    }

    if (cleanDescription.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Issue description must contain at least 10 characters.'
      });
    }

    if (cleanDescription.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Issue description must not exceed 2000 characters.'
      });
    }

    // Latitude validation
    if (!Number.isFinite(numericLatitude)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be a valid number.'
      });
    }

    if (numericLatitude < -90 || numericLatitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90.'
      });
    }

    // Longitude validation
    if (!Number.isFinite(numericLongitude)) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be a valid number.'
      });
    }

    if (numericLongitude < -180 || numericLongitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180.'
      });
    }

    // Severity validation
    if (!VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid severity.'
      });
    }

    // Create issue in PostgreSQL
    const query = `
      INSERT INTO issues (
        sector,
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
        $7,
        'Reported'
      )
      RETURNING
        id,
        sector,
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
      assignedSector,
      cleanTitle,
      category,
      cleanDescription,
      numericLatitude,
      numericLongitude,
      severity
    ];

    const result = await pool.query(query, values);
    const createdIssue = result.rows[0];

    // Process attached evidence / proof media files
    const evidenceRecords = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const mimeType = file.mimetype.toLowerCase();
        const fileType = mimeType.startsWith('video/') ? 'video' : 'image';
        const publicFilePath = `/uploads/${file.filename}`;

        const evQuery = `
          INSERT INTO issue_evidence (
            issue_id,
            file_name,
            file_path,
            file_type,
            file_size
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            issue_id,
            file_name,
            file_path,
            file_type,
            file_size,
            created_at;
        `;

        const evResult = await pool.query(evQuery, [
          createdIssue.id,
          file.originalname,
          publicFilePath,
          fileType,
          file.size
        ]);

        evidenceRecords.push(evResult.rows[0]);
      }
    }

    createdIssue.evidence = evidenceRecords;

    // Generate automatic municipal dispatch alert
    const alert = await generateAlertForIssue(createdIssue);

    return res.status(201).json({
      success: true,
      message: 'Infrastructure issue created successfully.',
      data: {
        issue: createdIssue,
        alert
      }
    });
  } catch (err) {
    console.error('Error creating issue:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to create infrastructure issue',
      error: err.message
    });
  }
};

/**
 * PUT /api/issues/:id/status
 * Updates issue lifecycle status and cascades to linked municipal alerts.
 */
const updateIssueStatus = async (req, res) => {
  try {
    const issueId = Number(req.params.id);
    const { status } = req.body;

    if (!Number.isInteger(issueId) || issueId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID.'
      });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue status.'
      });
    }

    const query = `
      UPDATE issues
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        sector,
        title,
        category,
        description,
        latitude,
        longitude,
        severity,
        status,
        created_at;
    `;

    const result = await pool.query(query, [status, issueId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Infrastructure issue not found.'
      });
    }

    // Synchronize linked municipal alerts lifecycle with issue status
    if (status === 'Resolved') {
      try {
        await pool.query(
          `UPDATE alerts SET status = 'Resolved' WHERE issue_id = $1 AND status != 'Resolved'`,
          [issueId]
        );
      } catch (alertSyncErr) {
        console.error(
          'Error synchronizing linked alert status on issue resolution:',
          alertSyncErr.message
        );
      }
    } else if (status === 'In Progress') {
      try {
        await pool.query(
          `UPDATE alerts SET status = 'Acknowledged' WHERE issue_id = $1 AND status = 'Active'`,
          [issueId]
        );
      } catch (alertSyncErr) {
        console.error(
          'Error updating linked alert to Acknowledged on issue in-progress:',
          alertSyncErr.message
        );
      }
    }

    // Fetch evidence to include in response
    const evQuery = `
      SELECT id, file_name, file_path, file_type, file_size, created_at
      FROM issue_evidence
      WHERE issue_id = $1
      ORDER BY created_at ASC;
    `;
    const evRes = await pool.query(evQuery, [issueId]);

    const updatedIssue = {
      ...result.rows[0],
      evidence: evRes.rows
    };

    return res.status(200).json({
      success: true,
      message: 'Issue status updated successfully.',
      data: updatedIssue
    });
  } catch (err) {
    console.error('Error updating issue status:', err.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to update issue status',
      error: err.message
    });
  }
};

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssueStatus,
  VALID_SECTORS,
  VALID_CATEGORIES,
  CATEGORY_TO_SECTOR_MAP
};
