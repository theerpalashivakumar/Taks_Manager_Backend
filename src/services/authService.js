const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/tokenUtils');
const { ROLES } = require('../constants/roles');

class AuthService {
  static async register({ name, email, password, role = ROLES.TEAM_MEMBER }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    // Role safety guard: Prevent admin privilege escalation during public registration in production
    let assignedRole = role || ROLES.TEAM_MEMBER;
    if (process.env.NODE_ENV === 'production' && assignedRole === ROLES.ADMIN) {
      assignedRole = ROLES.TEAM_MEMBER;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
    });

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account has been deactivated. Please contact an administrator.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const token = signToken({ id: user._id, role: user.role });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found');
    }
    return user;
  }
}

module.exports = AuthService;
