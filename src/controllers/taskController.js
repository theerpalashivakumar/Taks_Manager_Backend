const TaskService = require('../services/taskService');
const { getTaskActivityLogs } = require('../services/activityService');
const ApiResponse = require('../utils/apiResponse');

class TaskController {
  static async createTask(req, res, next) {
    try {
      const task = await TaskService.createTask(req.body, req.user);
      return ApiResponse.created(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTasks(req, res, next) {
    try {
      const { tasks, pagination } = await TaskService.getTasks(req.query, req.user);
      return ApiResponse.success(res, tasks, 'Tasks retrieved successfully', 200, pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const result = await TaskService.getTaskById(req.params.id, req.user);
      return ApiResponse.success(res, result, 'Task details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const task = await TaskService.updateTask(req.params.id, req.body, req.user);
      return ApiResponse.success(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTaskStatus(req, res, next) {
    try {
      const { status } = req.body;
      const task = await TaskService.updateTaskStatus(req.params.id, status, req.user);
      return ApiResponse.success(res, task, 'Task status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const result = await TaskService.deleteTask(req.params.id, req.user);
      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req, res, next) {
    try {
      const { comment } = req.body;
      const newComment = await TaskService.addComment(req.params.id, comment, req.user);
      return ApiResponse.created(res, newComment, 'Comment added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req, res, next) {
    try {
      const comments = await TaskService.getComments(req.params.id, req.user);
      return ApiResponse.success(res, comments, 'Comments retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTaskActivity(req, res, next) {
    try {
      // First verify access to task
      await TaskService.getTaskById(req.params.id, req.user);
      const activities = await getTaskActivityLogs(req.params.id);
      return ApiResponse.success(res, activities, 'Task activity retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;
