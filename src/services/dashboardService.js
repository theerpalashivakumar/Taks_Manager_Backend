const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES } = require('../constants/statuses');

class DashboardService {
  /**
   * Generates live, role-scoped database summary metrics
   */
  static async getSummary(user) {
    const isMasterAdmin = user.role === ROLES.ADMIN;
    const isPM = user.role === ROLES.PROJECT_MANAGER;

    // Define project scope
    let projectScopeQuery = { isArchived: false };
    if (!isMasterAdmin) {
      if (isPM) {
        projectScopeQuery.$or = [{ projectManager: user._id }, { members: user._id }];
      } else {
        projectScopeQuery.members = user._id;
      }
    }

    // Fetch projects in scope
    const projects = await Project.find(projectScopeQuery).select('_id name status completionPercentage deadline');
    const projectIds = projects.map((p) => p._id);

    // Calculate Project Metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === PROJECT_STATUSES.ACTIVE).length;
    const completedProjects = projects.filter((p) => p.status === PROJECT_STATUSES.COMPLETED).length;
    const planningProjects = projects.filter((p) => p.status === PROJECT_STATUSES.PLANNING).length;
    const onHoldProjects = projects.filter((p) => p.status === PROJECT_STATUSES.ON_HOLD).length;

    // Calculate Average Completion Percentage
    const avgCompletion =
      totalProjects > 0
        ? Math.round(projects.reduce((acc, curr) => acc + (curr.completionPercentage || 0), 0) / totalProjects)
        : 0;

    // Task scope query
    let taskScopeQuery = { project: { $in: projectIds } };

    // Fetch tasks metrics via DB aggregation
    const [taskStatusAggregation, totalTasks, myAssignedTasks, overdueTasksCount, recentActivities] =
      await Promise.all([
        Task.aggregate([
          { $match: taskScopeQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Task.countDocuments(taskScopeQuery),
        Task.countDocuments({
          project: { $in: projectIds },
          assignedTo: user._id,
          status: { $ne: TASK_STATUSES.DONE },
        }),
        Task.countDocuments({
          project: { $in: projectIds },
          dueDate: { $lt: new Date() },
          status: { $ne: TASK_STATUSES.DONE },
        }),
        ActivityLog.find({ project: { $in: projectIds } })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate('performedBy', 'name email role avatar')
          .populate('project', 'name'),
      ]);

    // Format tasks grouped by status
    const tasksByStatus = {
      [TASK_STATUSES.TODO]: 0,
      [TASK_STATUSES.IN_PROGRESS]: 0,
      [TASK_STATUSES.IN_REVIEW]: 0,
      [TASK_STATUSES.DONE]: 0,
    };

    taskStatusAggregation.forEach((item) => {
      if (tasksByStatus[item._id] !== undefined) {
        tasksByStatus[item._id] = item.count;
      }
    });

    // Upcoming high priority or approaching deadline tasks
    const upcomingTasks = await Task.find({
      project: { $in: projectIds },
      ...(user.role === ROLES.TEAM_MEMBER ? { assignedTo: user._id } : {}),
      status: { $ne: TASK_STATUSES.DONE },
    })
      .sort({ dueDate: 1 })
      .limit(6)
      .populate('project', 'name')
      .populate('assignedTo', 'name email avatar');

    return {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        planning: planningProjects,
        onHold: onHoldProjects,
        averageCompletion: avgCompletion,
        projectList: projects.slice(0, 5),
      },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus,
        overdue: overdueTasksCount,
        myPending: myAssignedTasks,
        upcoming: upcomingTasks,
      },
      recentActivities,
    };
  }
}

module.exports = DashboardService;
