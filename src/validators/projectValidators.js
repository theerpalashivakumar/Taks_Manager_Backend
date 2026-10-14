const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { PROJECT_STATUSES } = require('../constants/statuses');

const validateCreateProject = (req, res, next) => {
  const { name, description, startDate, deadline, projectManager, status, members } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Project name is required and must be at least 2 characters long');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Project description is required');
  }

  if (!startDate || isNaN(Date.parse(startDate))) {
    errors.push('A valid project start date is required');
  }

  if (!deadline || isNaN(Date.parse(deadline))) {
    errors.push('A valid project deadline is required');
  }

  if (startDate && deadline && new Date(deadline) <= new Date(startDate)) {
    errors.push('Project deadline must be strictly after the start date');
  }

  // If user is Admin, projectManager can be passed; if PM, projectManager can default to PM self
  if (projectManager && !mongoose.Types.ObjectId.isValid(projectManager)) {
    errors.push('Invalid Project Manager ID format');
  }

  if (status && !Object.values(PROJECT_STATUSES).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(PROJECT_STATUSES).join(', ')}`);
  }

  if (members && (!Array.isArray(members) || members.some((id) => !mongoose.Types.ObjectId.isValid(id)))) {
    errors.push('Members must be an array of valid User IDs');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Project validation failed', errors));
  }

  next();
};

const validateUpdateProject = (req, res, next) => {
  const { name, description, startDate, deadline, status, members, projectManager } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || name.trim().length < 2)) {
    errors.push('Project name must be at least 2 characters long');
  }

  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    errors.push('Project description cannot be empty');
  }

  if (startDate !== undefined && isNaN(Date.parse(startDate))) {
    errors.push('Invalid start date format');
  }

  if (deadline !== undefined && isNaN(Date.parse(deadline))) {
    errors.push('Invalid deadline format');
  }

  if (status !== undefined && !Object.values(PROJECT_STATUSES).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(PROJECT_STATUSES).join(', ')}`);
  }

  if (projectManager !== undefined && !mongoose.Types.ObjectId.isValid(projectManager)) {
    errors.push('Invalid Project Manager ID format');
  }

  if (members !== undefined && (!Array.isArray(members) || members.some((id) => !mongoose.Types.ObjectId.isValid(id)))) {
    errors.push('Members must be an array of valid User IDs');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Project update validation failed', errors));
  }

  next();
};

module.exports = {
  validateCreateProject,
  validateUpdateProject,
};
