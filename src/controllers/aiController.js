const AiService = require('../services/aiService');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const ProjectService = require('../services/projectService');

class AiController {
  static async suggestTask(req, res, next) {
    try {
      const { title, description, projectContext } = req.body;
      if (!title || !title.trim()) {
        throw ApiError.badRequest('Title is required to generate AI breakdown');
      }

      const suggestion = await AiService.generateTaskBreakdown({
        title,
        description,
        projectContext,
      });

      return ApiResponse.success(res, suggestion, 'AI task breakdown generated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async analyzeProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const project = await Project.findById(projectId);
      if (!project) {
        throw ApiError.notFound('Project not found');
      }

      ProjectService.assertProjectAccess(project, req.user);

      const tasks = await Task.find({ project: projectId });
      const analysis = await AiService.generateProjectRiskAnalysis(project, tasks);

      return ApiResponse.success(res, analysis, 'AI project risk analysis generated');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AiController;
