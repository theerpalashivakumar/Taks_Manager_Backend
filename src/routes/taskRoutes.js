const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const {
  validateCreateTask,
  validateUpdateTask,
  validateTaskStatus,
  validateComment,
} = require('../validators/taskValidators');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', TaskController.getTasks);
router.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  validateCreateTask,
  TaskController.createTask
);
router.get('/:id', TaskController.getTaskById);
router.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  validateUpdateTask,
  TaskController.updateTask
);
router.patch('/:id/status', validateTaskStatus, TaskController.updateTaskStatus);
router.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  TaskController.deleteTask
);

// Comments
router.get('/:id/comments', TaskController.getComments);
router.post('/:id/comments', validateComment, TaskController.addComment);

// Audit Activity
router.get('/:id/activity', TaskController.getTaskActivity);

module.exports = router;
