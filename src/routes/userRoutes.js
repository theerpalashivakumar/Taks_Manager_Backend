const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

router.get('/', authorizeRoles(ROLES.ADMIN, ROLES.PROJECT_MANAGER), UserController.getUsers);
router.get('/:id', UserController.getUserById);
router.patch('/:id/role', authorizeRoles(ROLES.ADMIN), UserController.updateUserRole);
router.patch('/:id/status', authorizeRoles(ROLES.ADMIN), UserController.toggleUserStatus);
router.delete('/:id', authorizeRoles(ROLES.ADMIN), UserController.deleteUser);

module.exports = router;
