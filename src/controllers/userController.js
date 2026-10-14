const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

class UserController {
  static async getUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, search = '', isActive } = req.query;
      const filter = {};

      if (role && Object.values(ROLES).includes(role)) {
        filter.role = role;
      }

      if (isActive !== undefined) {
        filter.isActive = isActive === 'true' || isActive === true;
      }

      if (search.trim()) {
        filter.$or = [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } },
        ];
      }

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [users, total] = await Promise.all([
        User.find(filter).sort('-createdAt').skip(skip).limit(limitNum),
        User.countDocuments(filter),
      ]);

      return ApiResponse.success(
        res,
        users,
        'Users retrieved successfully',
        200,
        {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  static async getUserById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw ApiError.notFound('User not found');
      }
      return ApiResponse.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role || !Object.values(ROLES).includes(role)) {
        throw ApiError.badRequest(`Role must be one of: ${Object.values(ROLES).join(', ')}`);
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      return ApiResponse.success(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleUserStatus(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      // Prevent admin from locking their own account
      if (user._id.toString() === req.user._id.toString()) {
        throw ApiError.badRequest('You cannot deactivate your own administrative account');
      }

      user.isActive = !user.isActive;
      await user.save();

      return ApiResponse.success(
        res,
        user,
        `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw ApiError.notFound('User not found');
      }

      if (user._id.toString() === req.user._id.toString()) {
        throw ApiError.badRequest('You cannot delete your own administrative account');
      }

      await User.findByIdAndDelete(req.params.id);
      return ApiResponse.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
