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

export function SectorBadge({ sector, size = 'normal' }) {
  const cleanSector = sector || 'Other Civic Services';

  // Short label for compact layouts if needed
  const iconsMap = {
    'Roads & Transportation': '🛣️',
    'Traffic & Road Safety': '🚦',
    'Water Supply & Drainage': '💧',
    'Fire & Emergency Services': '🚒',
    'Solid Waste Management': '♻️',
    'Street Lighting': '💡',
    'Public Infrastructure': '🏛️',
    'Environment & Pollution': '🌿',
    'Parks & Public Spaces': '🌳',
    'Public Health & Sanitation': '🏥',
    'Other Civic Services': '🏙️',
  };

  const icon = iconsMap[cleanSector] || '🏙️';

  return (
    <span className={`badge-sector size-${size}`} title={cleanSector}>
      <span className="sector-icon">{icon}</span>
      <span className="sector-label">{cleanSector}</span>
    </span>
  );
}

export function EvidenceBadge({ evidence = [], size = 'normal', onClick = null }) {
  const count = Array.isArray(evidence) ? evidence.length : 0;

  if (count === 0) {
    return (
      <span className={`badge-evidence evidence-empty size-${size}`}>
        No proof
      </span>
    );
  }

  const hasVideo = evidence.some((e) => e.file_type === 'video');
  const hasImage = evidence.some((e) => e.file_type === 'image');

  let label = `${count} File${count > 1 ? 's' : ''}`;
  let icon = '📎';

  if (hasVideo && !hasImage) {
    icon = '🎥';
    label = `${count} Video${count > 1 ? 's' : ''}`;
  } else if (hasImage && !hasVideo) {
    icon = '📷';
    label = `${count} Photo${count > 1 ? 's' : ''}`;
  }

  return (
    <button
      type="button"
      className={`badge-evidence evidence-attached size-${size} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      title={`${count} evidence attachment(s) verified`}
    >
      <span className="evidence-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
