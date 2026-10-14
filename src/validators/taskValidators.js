const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const { TASK_PRIORITIES, TASK_STATUSES } = require('../constants/statuses');

const validateCreateTask = (req, res, next) => {
  const { title, description, project, assignedTo, priority, status, dueDate } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Task title is required and must be at least 2 characters long');
  }

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push('Task description is required');
  }

  if (!project || !mongoose.Types.ObjectId.isValid(project)) {
    errors.push('A valid Project ID is required');
  }

  if (!assignedTo || !mongoose.Types.ObjectId.isValid(assignedTo)) {
    errors.push('A valid Assigned User ID is required');
  }

  if (priority && !Object.values(TASK_PRIORITIES).includes(priority)) {
    errors.push(`Priority must be one of: ${Object.values(TASK_PRIORITIES).join(', ')}`);
  }

  if (status && !Object.values(TASK_STATUSES).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(TASK_STATUSES).join(', ')}`);
  }

  if (!dueDate || isNaN(Date.parse(dueDate))) {
    errors.push('A valid task due date is required');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Task validation failed', errors));
  }

  next();
};

const validateUpdateTask = (req, res, next) => {
  const { title, description, assignedTo, priority, status, dueDate } = req.body;
  const errors = [];

  if (title !== undefined && (typeof title !== 'string' || title.trim().length < 2)) {
    errors.push('Task title must be at least 2 characters long');
  }

  if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
    errors.push('Task description cannot be empty');
  }

  if (assignedTo !== undefined && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    errors.push('Invalid Assigned User ID format');
  }

  if (priority !== undefined && !Object.values(TASK_PRIORITIES).includes(priority)) {
    errors.push(`Priority must be one of: ${Object.values(TASK_PRIORITIES).join(', ')}`);
  }

  if (status !== undefined && !Object.values(TASK_STATUSES).includes(status)) {
    errors.push(`Status must be one of: ${Object.values(TASK_STATUSES).join(', ')}`);
  }

  if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
    errors.push('Invalid due date format');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest('Task update validation failed', errors));
  }

  next();
};

const validateTaskStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !Object.values(TASK_STATUSES).includes(status)) {
    return next(
      ApiError.badRequest(`Status is required and must be one of: ${Object.values(TASK_STATUSES).join(', ')}`)
    );
  }
  next();
};

const validateComment = (req, res, next) => {
  const { comment } = req.body;
  if (!comment || typeof comment !== 'string' || !comment.trim()) {
    return next(ApiError.badRequest('Comment text is required'));
  }
  if (comment.length > 1000) {
    return next(ApiError.badRequest('Comment cannot exceed 1000 characters'));
  }
  next();
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatus,
  validateComment,
};
