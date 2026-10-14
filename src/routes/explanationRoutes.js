const express = require('express');
const router = express.Router();
const ExplanationController = require('../controllers/explanationController');
const { projectExplanationLimiter } = require('../middlewares/rateLimiter');

router.post('/verify', projectExplanationLimiter, ExplanationController.verifyPassword);
router.get('/content', ExplanationController.getContent);

module.exports = router;
