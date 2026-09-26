import React from 'react';

export function SeverityBadge({ severity, size = 'normal' }) {
  const norm = String(severity || 'Low').trim();
  const lower = norm.toLowerCase();

  return (
    <span className={`badge-severity badge-${lower} size-${size}`}>
      <span className="badge-bullet" />
      {norm}
    </span>
  );
}

export function StatusBadge({ status, size = 'normal' }) {
  const norm = String(status || 'Reported').trim();
  let statusClass = 'status-reported';
  if (norm === 'In Progress') statusClass = 'status-inprogress';
  if (norm === 'Resolved') statusClass = 'status-resolved';

  return (
    <span className={`badge-status ${statusClass} size-${size}`}>
      {norm}
    </span>
  );
}

export function ImpactBadge({ level, score = null, size = 'normal' }) {
  const norm = String(level || 'Moderate').trim();
  const lower = norm.toLowerCase();

  return (
    <span className={`badge-impact impact-${lower} size-${size}`}>
      {score !== null && <strong>{score} • </strong>}
      {norm} Impact
    </span>
  );
}
