const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user._id);
      return ApiResponse.success(res, user, 'User profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res) {
    // JWT is stateless; client removes stored token
    return ApiResponse.success(res, null, 'Logged out successfully');
  }
}

module.exports = AuthController;
