const PROJECT_STATUSES = Object.freeze({
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
});

const TASK_PRIORITIES = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
});

const TASK_STATUSES = Object.freeze({
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
});

module.exports = {
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
};
