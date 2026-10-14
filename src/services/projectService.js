const Project = require('../models/Project');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES } = require('../constants/statuses');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');
const { logActivity } = require('./activityService');

class ProjectService {
  /**
   * Recalculates and updates project completion percentage
   */
  static async updateProjectProgress(projectId) {
    const totalTasks = await Task.countDocuments({ project: projectId });
    if (totalTasks === 0) {
      await Project.findByIdAndUpdate(projectId, { completionPercentage: 0 });
      return 0;
    }

    const completedTasks = await Task.countDocuments({
      project: projectId,
      status: TASK_STATUSES.DONE,
    });

    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    await Project.findByIdAndUpdate(projectId, { completionPercentage });
    return completionPercentage;
  }

  /**
   * Create a new project
   */
  static async createProject(projectData, user) {
    let projectManagerId = projectData.projectManager;

    if (user.role === ROLES.PROJECT_MANAGER) {
      projectManagerId = user._id;
    } else if (!projectManagerId) {
      projectManagerId = user._id;
    }

    // Ensure assigned PM exists
    const pmUser = await User.findById(projectManagerId);
    if (!pmUser) {
      throw ApiError.badRequest('Assigned Project Manager does not exist');
    }

    // Members list (ensure PM is also included in members if desired, or kept distinct)
    const members = Array.isArray(projectData.members) ? [...new Set(projectData.members)] : [];

    const project = await Project.create({
      name: projectData.name,
      description: projectData.description,
      startDate: projectData.startDate,
      deadline: projectData.deadline,
      status: projectData.status || PROJECT_STATUSES.PLANNING,
      projectManager: projectManagerId,
      members,
      createdBy: user._id,
    });

    await logActivity({
      action: ACTIVITY_TYPES.PROJECT_CREATED,
      entityType: 'Project',
      entityId: project._id,
      project: project._id,
      performedBy: user._id,
      details: `Project "${project.name}" was created by ${user.name}.`,
    });

    return Project.findById(project._id)
      .populate('projectManager', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  /**
   * Get authorized projects with search, filter, and pagination
   */
  static async getProjects(query, user) {
    const { page = 1, limit = 10, search = '', status, isArchived, sort = '-createdAt' } = query;

    const filter = {};

    // Archival status
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === 'true' || isArchived === true;
    } else {
      filter.isArchived = false;
    }

    // Role-based visibility scoping
    if (user.role === ROLES.ADMIN) {
      // Admin has full visibility
    } else if (user.role === ROLES.PROJECT_MANAGER) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [{ projectManager: user._id }, { members: user._id }],
      });
    } else {
      // Team Member: see projects where they are a member OR have an assigned task
      const assignedTaskProjects = await Task.find({ assignedTo: user._id }).distinct('project');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { members: user._id },
          { _id: { $in: assignedTaskProjects } },
        ],
      });
    }

    // Status filter
    if (status && Object.values(PROJECT_STATUSES).includes(status)) {
      filter.status = status;
    }

    // Search by name or description
    if (search.trim()) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
        ],
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('projectManager', 'name email role avatar')
        .populate('members', 'name email role avatar'),
      Project.countDocuments(filter),
    ]);

    return {
      projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get individual project details with authorization check
   */
  static async getProjectById(projectId, user) {
    const project = await Project.findById(projectId)
      .populate('projectManager', 'name email role avatar')
      .populate('members', 'name email role avatar');

    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    // Team member with an assigned task in this project always has read access
    const hasAssignedTask = await Task.exists({ project: projectId, assignedTo: user._id });
    if (!hasAssignedTask) {
      this.assertProjectAccess(project, user);
    }

    // Compute live task count breakdown
    const [totalTasks, completedTasks, inProgressTasks, todoTasks, inReviewTasks] = await Promise.all([
      Task.countDocuments({ project: projectId }),
      Task.countDocuments({ project: projectId, status: TASK_STATUSES.DONE }),
      Task.countDocuments({ project: projectId, status: TASK_STATUSES.IN_PROGRESS }),
      Task.countDocuments({ project: projectId, status: TASK_STATUSES.TODO }),
      Task.countDocuments({ project: projectId, status: TASK_STATUSES.IN_REVIEW }),
    ]);

    const projectObj = project.toObject();
    projectObj.taskMetrics = {
      total: totalTasks,
      done: completedTasks,
      inProgress: inProgressTasks,
      todo: todoTasks,
      inReview: inReviewTasks,
    };

    return projectObj;
  }

  /**
   * Update project metadata
   */
  static async updateProject(projectId, updateData, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this.assertProjectManagementPermission(project, user);

    const oldStatus = project.status;
    const allowedUpdates = ['name', 'description', 'startDate', 'deadline', 'status', 'projectManager', 'members'];
    
    allowedUpdates.forEach((field) => {
      if (updateData[field] !== undefined) {
        project[field] = updateData[field];
      }
    });

    await project.save();

    if (updateData.status && updateData.status !== oldStatus) {
      await logActivity({
        action: ACTIVITY_TYPES.PROJECT_STATUS_CHANGED,
        entityType: 'Project',
        entityId: project._id,
        project: project._id,
        performedBy: user._id,
        details: `Project status changed from "${oldStatus}" to "${project.status}" by ${user.name}.`,
      });
    } else {
      await logActivity({
        action: ACTIVITY_TYPES.PROJECT_UPDATED,
        entityType: 'Project',
        entityId: project._id,
        project: project._id,
        performedBy: user._id,
        details: `Project details updated by ${user.name}.`,
      });
    }

    return Project.findById(project._id)
      .populate('projectManager', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  /**
   * Assign or remove team members
   */
  static async manageMembers(projectId, { addMembers = [], removeMembers = [] }, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this.assertProjectManagementPermission(project, user);

    let memberIds = project.members.map((m) => m.toString());

    if (addMembers.length > 0) {
      addMembers.forEach((id) => {
        if (!memberIds.includes(id.toString())) {
          memberIds.push(id.toString());
        }
      });
      await logActivity({
        action: ACTIVITY_TYPES.MEMBER_ASSIGNED,
        entityType: 'Project',
        entityId: project._id,
        project: project._id,
        performedBy: user._id,
        details: `Added ${addMembers.length} member(s) to project by ${user.name}.`,
      });
    }

    if (removeMembers.length > 0) {
      const removeSet = new Set(removeMembers.map((id) => id.toString()));
      memberIds = memberIds.filter((id) => !removeSet.has(id));
      await logActivity({
        action: ACTIVITY_TYPES.MEMBER_REMOVED,
        entityType: 'Project',
        entityId: project._id,
        project: project._id,
        performedBy: user._id,
        details: `Removed ${removeMembers.length} member(s) from project by ${user.name}.`,
      });
    }

    project.members = memberIds;
    await project.save();

    return Project.findById(project._id)
      .populate('projectManager', 'name email role avatar')
      .populate('members', 'name email role avatar');
  }

  /**
   * Archive or unarchive project
   */
  static async toggleArchive(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this.assertProjectManagementPermission(project, user);

    project.isArchived = !project.isArchived;
    await project.save();

    await logActivity({
      action: ACTIVITY_TYPES.PROJECT_ARCHIVED,
      entityType: 'Project',
      entityId: project._id,
      project: project._id,
      performedBy: user._id,
      details: `Project "${project.name}" was ${project.isArchived ? 'archived' : 'restored'} by ${user.name}.`,
    });

    return project;
  }

  /**
   * Delete project (cascade delete related tasks and comments)
   */
  static async deleteProject(projectId, user) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw ApiError.notFound('Project not found');
    }

    this.assertProjectManagementPermission(project, user);

    const taskIds = await Task.find({ project: projectId }).distinct('_id');
    if (taskIds.length > 0) {
      await TaskComment.deleteMany({ task: { $in: taskIds } });
    }
    await Task.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);

    await logActivity({
      action: ACTIVITY_TYPES.PROJECT_DELETED,
      entityType: 'Project',
      entityId: projectId,
      performedBy: user._id,
      details: `Project "${project.name}" and its associated tasks were deleted by ${user.name}.`,
    });

    return { message: 'Project and associated tasks successfully deleted' };
  }

  /**
   * Authorization helpers
   */
  static assertProjectAccess(project, user) {
    if (user.role === ROLES.ADMIN) return true;

    const pmId = project.projectManager?._id ? project.projectManager._id.toString() : project.projectManager.toString();
    if (pmId === user._id.toString()) return true;

    const isMember = project.members.some((m) => {
      const id = m._id ? m._id.toString() : m.toString();
      return id === user._id.toString();
    });

    if (isMember) return true;

    throw ApiError.forbidden('You do not have access to view this project');
  }

  static assertProjectManagementPermission(project, user) {
    if (user.role === ROLES.ADMIN) return true;

    const pmId = project.projectManager?._id ? project.projectManager._id.toString() : project.projectManager.toString();
    if (user.role === ROLES.PROJECT_MANAGER && pmId === user._id.toString()) {
      return true;
    }

    throw ApiError.forbidden('Only an administrator or the assigned Project Manager can modify this project');
  }
}

module.exports = ProjectService;
