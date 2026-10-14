const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/summary', DashboardController.getSummary);

module.exports = router;
