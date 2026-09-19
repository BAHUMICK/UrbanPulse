const pool = require('../config/db');

const SEVERITY_WEIGHTS = {
  Critical: 40,
  High: 30,
  Medium: 20,
  Low: 10
};

const STATUS_WEIGHTS = {
  Reported: 20,
  'In Progress': 10,
  Resolved: 0
};

const CATEGORY_WEIGHTS = {
  'Road Safety': 20,
  Waterlogging: 20,
  'Road Damage': 15,
  Streetlight: 10,
  Other: 5
};

/**
 * Calculate location density bonus.
 * Issues within approximately 1 km increase priority.
 */
function calculateDensityBonus(issue, allIssues) {
  const issueLat = Number(issue.latitude);
  const issueLng = Number(issue.longitude);

  if (
    !Number.isFinite(issueLat) ||
    !Number.isFinite(issueLng)
  ) {
    return 0;
  }

  let nearbyCount = 0;

  for (const other of allIssues) {
    if (other.id === issue.id) {
      continue;
    }

    const otherLat = Number(other.latitude);
    const otherLng = Number(other.longitude);

    if (
      !Number.isFinite(otherLat) ||
      !Number.isFinite(otherLng)
    ) {
      continue;
    }

    const latDifference =
      issueLat - otherLat;

    const lngDifference =
      issueLng - otherLng;

    const distanceKm =
      Math.sqrt(
        Math.pow(
          latDifference * 111,
          2
        ) +
        Math.pow(
          lngDifference *
            111 *
            Math.cos(
              (issueLat * Math.PI) / 180
            ),
          2
        )
      );

    if (distanceKm <= 1) {
      nearbyCount++;
    }
  }

  return Math.min(
    nearbyCount * 5,
    20
  );
}

/**
 * Calculate priority score for one infrastructure issue.
 */
function calculatePriorityScore(
  issue,
  allIssues
) {
  const severityScore =
    SEVERITY_WEIGHTS[issue.severity] || 0;

  const statusScore =
    STATUS_WEIGHTS[issue.status] || 0;

  const categoryScore =
    CATEGORY_WEIGHTS[issue.category] || 5;

  const densityScore =
    calculateDensityBonus(
      issue,
      allIssues
    );

  const totalScore =
    severityScore +
    statusScore +
    categoryScore +
    densityScore;

  return {
    totalScore,
    severityScore,
    statusScore,
    categoryScore,
    densityScore
  };
}

/**
 * Calculate impact score.
 *
 * Impact focuses on the potential effect an issue
 * can have on the surrounding urban environment.
 */
function calculateImpactScore(
  issue,
  allIssues
) {
  const severityImpact = {
    Critical: 45,
    High: 35,
    Medium: 25,
    Low: 10
  };

  const categoryImpact = {
    'Road Safety': 25,
    Waterlogging: 25,
    'Road Damage': 20,
    Streetlight: 15,
    Other: 5
  };

  const statusImpact = {
    Reported: 15,
    'In Progress': 8,
    Resolved: 0
  };

  const severityScore =
    severityImpact[issue.severity] || 0;

  const categoryScore =
    categoryImpact[issue.category] || 5;

  const statusScore =
    statusImpact[issue.status] || 0;

  const densityScore =
    calculateDensityBonus(
      issue,
      allIssues
    );

  const totalScore = Math.min(
    severityScore +
      categoryScore +
      statusScore +
      densityScore,
    100
  );

  let impactLevel = 'Low';

  if (totalScore >= 75) {
    impactLevel = 'Critical';
  } else if (totalScore >= 55) {
    impactLevel = 'High';
  } else if (totalScore >= 30) {
    impactLevel = 'Moderate';
  }

  const factors = [];

  if (severityScore >= 35) {
    factors.push(
      'High severity'
    );
  }

  if (
    categoryScore >= 20
  ) {
    factors.push(
      'High-impact infrastructure category'
    );
  }

  if (statusScore >= 15) {
    factors.push(
      'Issue is awaiting action'
    );
  }

  if (densityScore > 0) {
    factors.push(
      'Nearby infrastructure issues detected'
    );
  }

  if (factors.length === 0) {
    factors.push(
      'Limited immediate impact indicators'
    );
  }

  return {
    totalScore,
    impactLevel,
    breakdown: {
      severity: severityScore,
      category: categoryScore,
      status: statusScore,
      locationDensity: densityScore
    },
    factors
  };
}

/**
 * Get all issues with calculated priority intelligence.
 */
async function getPriorityIssues() {
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

  const result =
    await pool.query(query);

  const issues = result.rows;

  const priorityIssues =
    issues.map((issue) => {
      const score =
        calculatePriorityScore(
          issue,
          issues
        );

      return {
        ...issue,

        priorityScore:
          score.totalScore,

        scoreBreakdown: {
          severity:
            score.severityScore,

          status:
            score.statusScore,

          category:
            score.categoryScore,

          locationDensity:
            score.densityScore
        }
      };
    });

  priorityIssues.sort(
    (a, b) =>
      b.priorityScore -
      a.priorityScore
  );

  return priorityIssues;
}

/**
 * Get all issues with calculated impact intelligence.
 */
async function getImpactIssues() {
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

  const result =
    await pool.query(query);

  const issues = result.rows;

  const impactIssues =
    issues.map((issue) => {
      const impact =
        calculateImpactScore(
          issue,
          issues
        );

      return {
        ...issue,

        impactScore:
          impact.totalScore,

        impactLevel:
          impact.impactLevel,

        impactBreakdown:
          impact.breakdown,

        impactFactors:
          impact.factors
      };
    });

  impactIssues.sort(
    (a, b) =>
      b.impactScore -
      a.impactScore
  );

  return impactIssues;
}

module.exports = {
  getPriorityIssues,
  calculatePriorityScore,
  getImpactIssues,
  calculateImpactScore
};