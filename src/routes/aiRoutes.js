const express = require('express');
const router = express.Router();
const AiController = require('../controllers/aiController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/suggest-task', AiController.suggestTask);
router.get('/project-analysis/:projectId', AiController.analyzeProject);

module.exports = router;
