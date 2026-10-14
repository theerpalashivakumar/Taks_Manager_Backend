const ProjectService = require('../services/projectService');
const { getProjectActivityLogs } = require('../services/activityService');
const ApiResponse = require('../utils/apiResponse');

class ProjectController {
  static async createProject(req, res, next) {
    try {
      const project = await ProjectService.createProject(req.body, req.user);
      return ApiResponse.created(res, project, 'Project created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req, res, next) {
    try {
      const { projects, pagination } = await ProjectService.getProjects(req.query, req.user);
      return ApiResponse.success(res, projects, 'Projects retrieved successfully', 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req, res, next) {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user);
      return ApiResponse.success(res, project, 'Project details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req, res, next) {
    try {
      const project = await ProjectService.updateProject(req.params.id, req.body, req.user);
      return ApiResponse.success(res, project, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async manageMembers(req, res, next) {
    try {
      const project = await ProjectService.manageMembers(req.params.id, req.body, req.user);
      return ApiResponse.success(res, project, 'Project members updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleArchive(req, res, next) {
    try {
      const project = await ProjectService.toggleArchive(req.params.id, req.user);
      return ApiResponse.success(
        res,
        project,
        `Project ${project.isArchived ? 'archived' : 'restored'} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req, res, next) {
    try {
      const result = await ProjectService.deleteProject(req.params.id, req.user);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getProjectActivity(req, res, next) {
    try {
      // First verify access
      await ProjectService.getProjectById(req.params.id, req.user);
      const activities = await getProjectActivityLogs(req.params.id);
      return ApiResponse.success(res, activities, 'Project activity retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProjectController;
