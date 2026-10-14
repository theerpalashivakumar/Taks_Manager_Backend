const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/projectController');
const { validateCreateProject, validateUpdateProject } = require('../validators/projectValidators');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', ProjectController.getProjects);
router.post(
  '/',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  validateCreateProject,
  ProjectController.createProject
);
router.get('/:id', ProjectController.getProjectById);
router.patch(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  validateUpdateProject,
  ProjectController.updateProject
);
router.patch(
  '/:id/members',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  ProjectController.manageMembers
);
router.patch(
  '/:id/archive',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  ProjectController.toggleArchive
);
router.delete(
  '/:id',
  authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER),
  ProjectController.deleteProject
);
router.get('/:id/activity', ProjectController.getProjectActivity);

module.exports = router;
