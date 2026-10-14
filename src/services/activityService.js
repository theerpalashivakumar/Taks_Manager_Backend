const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({ action, entityType, entityId, project, task, performedBy, details }) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      project,
      task,
      performedBy,
      details,
    });
  } catch (error) {
    // Audit logging should not crash the primary operational transaction, but log the issue
    console.error('Failed to record activity log:', error.message);
  }
};

const getProjectActivityLogs = async (projectId, limit = 20) => {
  return ActivityLog.find({ project: projectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email role avatar');
};

const getTaskActivityLogs = async (taskId, limit = 20) => {
  return ActivityLog.find({ task: taskId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('performedBy', 'name email role avatar');
};

module.exports = {
  logActivity,
  getProjectActivityLogs,
  getTaskActivityLogs,
};
