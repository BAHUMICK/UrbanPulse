const pool = require('../config/db');

/**
 * GET /api/alerts
 */
const getAllAlerts = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        a.issue_id,
        a.alert_type,
        a.title,
        a.message,
        a.priority_score,
        a.authority,
        a.status,
        a.created_at,
        i.category,
        i.severity,
        i.latitude,
        i.longitude
      FROM alerts a
      INNER JOIN issues i
        ON a.issue_id = i.id
      ORDER BY a.created_at DESC;
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error(
      'Error fetching alerts:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: err.message
    });
  }
};

/**
 * GET /api/alerts/active
 */
const getActiveAlerts = async (req, res) => {
  try {
    const query = `
      SELECT
        a.id,
        a.issue_id,
        a.alert_type,
        a.title,
        a.message,
        a.priority_score,
        a.authority,
        a.status,
        a.created_at,
        i.category,
        i.severity,
        i.latitude,
        i.longitude
      FROM alerts a
      INNER JOIN issues i
        ON a.issue_id = i.id
      WHERE a.status = 'Active'
      ORDER BY a.priority_score DESC, a.created_at DESC;
    `;

    const result = await pool.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (err) {
    console.error(
      'Error fetching active alerts:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active alerts',
      error: err.message
    });
  }
};

/**
 * PUT /api/alerts/:id/status
 */
const updateAlertStatus = async (req, res) => {
  try {
    const alertId = Number(req.params.id);
    const { status } = req.body;

    const VALID_ALERT_STATUSES = [
      'Active',
      'Acknowledged',
      'Resolved'
    ];

    if (
      !Number.isInteger(alertId) ||
      alertId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID.'
      });
    }

    if (!VALID_ALERT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert status.'
      });
    }

    const query = `
      UPDATE alerts
      SET status = $1
      WHERE id = $2
      RETURNING
        id,
        issue_id,
        alert_type,
        title,
        message,
        priority_score,
        authority,
        status,
        created_at;
    `;

    const result = await pool.query(
      query,
      [status, alertId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Alert status updated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(
      'Error updating alert status:',
      err.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update alert status',
      error: err.message
    });
  }
};

module.exports = {
  getAllAlerts,
  getActiveAlerts,
  updateAlertStatus
};