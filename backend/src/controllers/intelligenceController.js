const {
  getPriorityIssues,
  getImpactIssues
} = require('../services/priorityService');

/**
 * GET /api/intelligence/priorities
 *
 * Returns infrastructure issues ranked
 * by calculated priority score.
 */
const getPriorityIssuesController =
  async (req, res) => {
    try {
      const priorityIssues =
        await getPriorityIssues();

      return res.status(200).json({
        success: true,
        count: priorityIssues.length,
        data: priorityIssues
      });
    } catch (err) {
      console.error(
        'Error calculating priority intelligence:',
        err.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to calculate infrastructure priority intelligence',
        error: err.message
      });
    }
  };

/**
 * GET /api/intelligence/impact
 *
 * Returns infrastructure issues with
 * calculated impact intelligence.
 */
const getImpactIssuesController =
  async (req, res) => {
    try {
      const impactIssues =
        await getImpactIssues();

      return res.status(200).json({
        success: true,
        count: impactIssues.length,
        data: impactIssues
      });
    } catch (err) {
      console.error(
        'Error calculating impact intelligence:',
        err.message
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to calculate infrastructure impact intelligence',
        error: err.message
      });
    }
  };

module.exports = {
  getPriorityIssuesController,
  getImpactIssuesController
};