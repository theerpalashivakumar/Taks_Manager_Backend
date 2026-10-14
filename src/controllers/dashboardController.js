const DashboardService = require('../services/dashboardService');
const ApiResponse = require('../utils/apiResponse');

class DashboardController {
  static async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary(req.user);
      return ApiResponse.success(res, summary, 'Dashboard summary metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
