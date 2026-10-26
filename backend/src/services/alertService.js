const pool = require('../config/db');
const { calculatePriorityScore } = require('./priorityService');

function isAlertEligible(issue, score) {
  return issue.status !== 'Resolved' && !(score < 55 && !['High', 'Critical'].includes(issue.severity));
}

const generateAlertForIssue = async (issue) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize evaluations for this issue; the lock is released on commit/rollback.
    await client.query('SELECT pg_advisory_xact_lock($1, $2)', [74129, issue.id]);
  // -----------------------------------------------------
  // PREVENT DUPLICATE ALERTS
  // -----------------------------------------------------

  const existingAlertQuery = `
    SELECT
      id,
      issue_id,
      alert_type,
      title,
      message,
      priority_score,
      authority,
      status,
      created_at
    FROM alerts
    WHERE issue_id = $1
    ORDER BY created_at DESC
    LIMIT 1;
  `;

  const existingAlert = await client.query(
    existingAlertQuery,
    [issue.id]
  );

  if (existingAlert.rows.length > 0) {
    await client.query('COMMIT');
    return existingAlert.rows[0];
  }

  const allIssuesResult = await client.query('SELECT id, latitude, longitude, severity, status, category FROM issues');
  const score = calculatePriorityScore(issue, allIssuesResult.rows).totalScore;
  if (!isAlertEligible(issue, score)) {
    await client.query('COMMIT');
    return null;
  }

  // -----------------------------------------------------
  // DEFAULT ALERT VALUES
  // -----------------------------------------------------

  let alertType = 'Infrastructure Issue';
  const priorityScore = score;
  let authority = 'Municipal Corporation';

  // -----------------------------------------------------
  // -----------------------------------------------------
  // SECTOR / CATEGORY → ALERT TYPE + AUTHORITY ROUTING
  // -----------------------------------------------------

  if (issue.sector === 'Roads & Transportation') {
    alertType = 'Road Infrastructure Alert';
    authority = 'Roads Department';
  } else if (issue.sector === 'Traffic & Road Safety') {
    alertType = 'Traffic Safety Alert';
    authority = 'Traffic Authority';
  } else if (issue.sector === 'Water Supply & Drainage') {
    alertType = issue.category === 'Waterlogging' ? 'Waterlogging Alert' : 'Drainage Alert';
    authority = 'Municipal Corporation / Water & Drainage Authority';
  } else if (issue.sector === 'Fire & Emergency Services') {
    alertType = 'Emergency Services Alert';
    authority = 'Fire & Emergency Services';
  } else if (issue.sector === 'Solid Waste Management') {
    alertType = 'Waste Management Alert';
    authority = 'Waste Management Department';
  } else if (issue.sector === 'Street Lighting') {
    alertType = 'Streetlight Alert';
    authority = 'Electrical / Street Lighting Department';
  } else if (issue.sector === 'Environment & Pollution') {
    alertType = 'Environmental Alert';
    authority = 'Environment Department';
  } else if (issue.sector === 'Parks & Public Spaces') {
    alertType = 'Parks & Public Spaces Alert';
    authority = 'Parks Department';
  } else if (issue.sector === 'Public Health & Sanitation') {
    alertType = 'Public Health Alert';
    authority = 'Public Health / Sanitation Department';
  } else if (issue.sector === 'Public Infrastructure') {
    alertType = 'Public Infrastructure Alert';
    authority = 'Public Infrastructure Department';
  } else {
    // Fallback to category-based routing if sector is Other or unspecified
    if (issue.category === 'Waterlogging') {
      alertType = 'Waterlogging Alert';
      authority = 'Municipal Corporation';
    } else if (issue.category === 'Road Safety') {
      alertType = 'Road Safety Alert';
      authority = 'Traffic Authority';
    } else if (issue.category === 'Road Damage') {
      alertType = 'Road Infrastructure Alert';
      authority = 'Roads Department';
    } else if (issue.category === 'Streetlight') {
      alertType = 'Streetlight Alert';
      authority = 'Electrical Department';
    } else if (issue.category === 'Garbage') {
      alertType = 'Waste Management Alert';
      authority = 'Municipal Corporation';
    } else if (issue.category === 'Drainage') {
      alertType = 'Drainage Alert';
      authority = 'Municipal Corporation';
    }
  }

  // -----------------------------------------------------
  // ALERT CONTENT
  // -----------------------------------------------------

  const title = `${alertType}: ${issue.title}`;

  const message =
    `${issue.severity} severity ${issue.category.toLowerCase()} defect filed under ${issue.sector || 'civic services'}. ` +
    `In-app alert routed to authority label ${authority}.`;

  // -----------------------------------------------------
  // INSERT ALERT
  // -----------------------------------------------------

  const query = `
    INSERT INTO alerts (
      issue_id,
      alert_type,
      title,
      message,
      priority_score,
      authority,
      status
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      'Active'
    )
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

  const values = [
    issue.id,
    alertType,
    title,
    message,
    priorityScore,
    authority
  ];

  const result = await client.query(query, values);

  await client.query('COMMIT');

  return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  generateAlertForIssue,
  isAlertEligible
};
