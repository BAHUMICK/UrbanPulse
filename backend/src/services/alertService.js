const pool = require('../config/db');

const generateAlertForIssue = async (issue) => {
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

  const existingAlert = await pool.query(
    existingAlertQuery,
    [issue.id]
  );

  if (existingAlert.rows.length > 0) {
    return existingAlert.rows[0];
  }

  // -----------------------------------------------------
  // DEFAULT ALERT VALUES
  // -----------------------------------------------------

  let alertType = 'Infrastructure Issue';
  let priorityScore = 30;
  let authority = 'Municipal Corporation';

  // -----------------------------------------------------
  // PRIORITY SCORE
  // -----------------------------------------------------

  if (issue.severity === 'Critical') {
    priorityScore = 100;
  } else if (issue.severity === 'High') {
    priorityScore = 80;
  } else if (issue.severity === 'Medium') {
    priorityScore = 50;
  } else {
    priorityScore = 25;
  }

  // -----------------------------------------------------
  // CATEGORY → ALERT TYPE + AUTHORITY
  // -----------------------------------------------------

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

  // -----------------------------------------------------
  // ALERT CONTENT
  // -----------------------------------------------------

  const title = `${alertType}: ${issue.title}`;

  const message =
    `${issue.severity} severity ${issue.category.toLowerCase()} issue reported. ` +
    `Immediate review may be required.`;

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

  const result = await pool.query(query, values);

  return result.rows[0];
};

module.exports = {
  generateAlertForIssue
};