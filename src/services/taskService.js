const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const TaskComment = require('../models/TaskComment');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants/statuses');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');
const { logActivity } = require('./activityService');
const ProjectService = require('./projectService');

class TaskService {
  /**
   * Create a new task within a project
   */
  static async createTask(taskData, user) {
    const project = await Project.findById(taskData.project);
    if (!project) {
      throw ApiError.notFound('Associated project not found');
    }

    ProjectService.assertProjectManagementPermission(project, user);

    // Verify assigned user exists
    const assignee = await User.findById(taskData.assignedTo);
    if (!assignee) {
      throw ApiError.badRequest('Assigned team member does not exist');
    }

    // Auto-add assignee to project members if not already there
    if (!project.members.some((m) => m.toString() === assignee._id.toString())) {
      project.members.push(assignee._id);
      await project.save();
    }

    const task = await Task.create({
      title: taskData.title,
      description: taskData.description,
      project: project._id,
      assignedTo: assignee._id,
      priority: taskData.priority || TASK_PRIORITIES.MEDIUM,
      status: taskData.status || TASK_STATUSES.TODO,
      dueDate: taskData.dueDate,
      createdBy: user._id,
    });

    // Update project progress percentage
    await ProjectService.updateProjectProgress(project._id);

    await logActivity({
      action: ACTIVITY_TYPES.TASK_CREATED,
      entityType: 'Task',
      entityId: task._id,
      project: project._id,
      task: task._id,
      performedBy: user._id,
      details: `Task "${task.title}" was created and assigned to ${assignee.name} by ${user.name}.`,
    });

    return Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('project', 'name status deadline projectManager')
      .populate('createdBy', 'name email');
  }

  /**
   * Get tasks with DB filtering, search, sorting, and pagination
   */
  static async getTasks(query, user) {
    const {
      page = 1,
      limit = 10,
      search = '',
      project,
      assignedTo,
      priority,
      status,
      isOverdue,
      sort = 'dueDate',
    } = query;

    const filter = {};

    // Project filtering
    if (project) {
      filter.project = project;
    }

    // Assignee filtering
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Priority filtering
    if (priority && Object.values(TASK_PRIORITIES).includes(priority)) {
      filter.priority = priority;
    }

    // Status filtering
    if (status && Object.values(TASK_STATUSES).includes(status)) {
      filter.status = status;
    }

    // Overdue filter
    if (isOverdue === 'true' || isOverdue === true) {
      filter.dueDate = { $lt: new Date() };
      if (filter.status) {
        if (filter.status === TASK_STATUSES.DONE) {
          filter.status = { $in: [] }; // Completed tasks cannot be overdue
        }
      } else {
        filter.status = { $ne: TASK_STATUSES.DONE };
      }
    }

    // Search query on title or description
    if (search.trim()) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
        ],
      });
    }

    // Role-based scoping: Team members see tasks from projects they belong to or are assigned to
    if (user.role === ROLES.TEAM_MEMBER) {
      const userProjects = await Project.find({ members: user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { assignedTo: user._id },
          { project: { $in: projectIds } },
        ],
      });
    } else if (user.role === ROLES.PROJECT_MANAGER) {
      const pmProjects = await Project.find({
        $or: [{ projectManager: user._id }, { members: user._id }],
      }).select('_id');
      const projectIds = pmProjects.map((p) => p._id);

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { project: { $in: projectIds } },
          { createdBy: user._id },
          { assignedTo: user._id },
        ],
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTo', 'name email role avatar')
        .populate('project', 'name status deadline projectManager')
        .populate('createdBy', 'name email'),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get task by ID with authorization check
   */
  static async getTaskById(taskId, user) {
    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email role avatar')
      .populate('project', 'name description status deadline projectManager members')
      .populate('createdBy', 'name email');

    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Assigned team member always has read access to their own task
    const isAssignee = task.assignedTo?._id?.toString() === user._id.toString();

    // All others must be project members / PM / admin
    if (!isAssignee) {
      ProjectService.assertProjectAccess(task.project, user);
    }

    const comments = await TaskComment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email role avatar');

    return {
      task,
      comments,
    };
  }

  /**
   * Update task metadata (Admin / Project Manager)
   */
  static async updateTask(taskId, updateData, user) {
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    ProjectService.assertProjectManagementPermission(task.project, user);

    const oldStatus = task.status;
    const oldAssigneeId = task.assignedTo.toString();

    const allowedUpdates = ['title', 'description', 'assignedTo', 'priority', 'status', 'dueDate'];
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        task[field] = updateData[field];
      }
    });

    await task.save();

    // Recompute project progress if status changed
    if (updateData.status && updateData.status !== oldStatus) {
      await ProjectService.updateProjectProgress(task.project._id);
      await logActivity({
        action: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
        entityType: 'Task',
        entityId: task._id,
        project: task.project._id,
        task: task._id,
        performedBy: user._id,
        details: `Task "${task.title}" status changed to "${task.status}" by ${user.name}.`,
      });
    }

    // Log reassignment if changed
    if (updateData.assignedTo && updateData.assignedTo.toString() !== oldAssigneeId) {
      const newAssignee = await User.findById(updateData.assignedTo);
      await logActivity({
        action: ACTIVITY_TYPES.TASK_ASSIGNED,
        entityType: 'Task',
        entityId: task._id,
        project: task.project._id,
        task: task._id,
        performedBy: user._id,
        details: `Task "${task.title}" was reassigned to ${newAssignee?.name || 'team member'} by ${user.name}.`,
      });
    }

    return Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('project', 'name status deadline')
      .populate('createdBy', 'name email');
  }

  /**
   * Update Task Status only (Assignable by Admin, PM, OR the assigned Team Member)
   */
  static async updateTaskStatus(taskId, status, user) {
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Role check: Admin, PM of project, or assigned user
    const isAssignee = task.assignedTo.toString() === user._id.toString();
    const isAdmin = user.role === ROLES.ADMIN;
    const isPM =
      user.role === ROLES.PROJECT_MANAGER &&
      task.project.projectManager.toString() === user._id.toString();

    if (!isAssignee && !isAdmin && !isPM) {
      throw ApiError.forbidden('You can only update the status of tasks assigned to you');
    }

    const previousStatus = task.status;
    task.status = status;
    await task.save();

    await ProjectService.updateProjectProgress(task.project._id);

    await logActivity({
      action: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
      entityType: 'Task',
      entityId: task._id,
      project: task.project._id,
      task: task._id,
      performedBy: user._id,
      details: `Task status updated from "${previousStatus}" to "${status}" by ${user.name}.`,
    });

    return Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('project', 'name status deadline projectManager');
  }

  /**
   * Delete Task
   */
  static async deleteTask(taskId, user) {
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    ProjectService.assertProjectManagementPermission(task.project, user);

    const projectId = task.project._id;
    const taskTitle = task.title;

    await TaskComment.deleteMany({ task: taskId });
    await Task.findByIdAndDelete(taskId);

    await ProjectService.updateProjectProgress(projectId);

    await logActivity({
      action: ACTIVITY_TYPES.TASK_DELETED,
      entityType: 'Task',
      entityId: taskId,
      project: projectId,
      performedBy: user._id,
      details: `Task "${taskTitle}" was deleted by ${user.name}.`,
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Add comment to task
   */
  static async addComment(taskId, commentText, user) {
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    ProjectService.assertProjectAccess(task.project, user);

    const comment = await TaskComment.create({
      task: taskId,
      author: user._id,
      comment: commentText.trim(),
    });

    await logActivity({
      action: ACTIVITY_TYPES.COMMENT_ADDED,
      entityType: 'Comment',
      entityId: comment._id,
      project: task.project._id,
      task: task._id,
      performedBy: user._id,
      details: `Comment added to task "${task.title}" by ${user.name}.`,
    });

    return TaskComment.findById(comment._id).populate('author', 'name email role avatar');
  }

  /**
   * Get comments for a task
   */
  static async getComments(taskId, user) {
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      throw ApiError.notFound('Task not found');
    }

    // Assignee can always read comments on their own task
    const isAssignee = task.assignedTo?.toString() === user._id.toString();
    if (!isAssignee) {
      ProjectService.assertProjectAccess(task.project, user);
    }

    return TaskComment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email role avatar');
  }
}

module.exports = TaskService;
