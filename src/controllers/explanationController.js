const ExplanationService = require('../services/explanationService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

class ExplanationController {
  static async verifyPassword(req, res, next) {
    try {
      const { password } = req.body;
      if (!password) {
        throw ApiError.badRequest('Password is required to view project explanation');
      }

      const result = await ExplanationService.verifyPassword(password);
      return ApiResponse.success(res, result, 'Password verified successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getContent(req, res, next) {
    try {
      let token = req.headers['x-explanation-token'];

      if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      const content = ExplanationService.getExplanationContent(token);
      return ApiResponse.success(res, content, 'Project explanation content retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ExplanationController;
