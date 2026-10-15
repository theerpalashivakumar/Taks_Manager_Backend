const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const projectRoutes = require('./projectRoutes');
const taskRoutes = require('./taskRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const explanationRoutes = require('./explanationRoutes');
const aiRoutes = require('./aiRoutes');
const docsRoutes = require('./docsRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/project-explanation', explanationRoutes);
router.use('/ai', aiRoutes);
router.use('/docs', docsRoutes);

module.exports = router;
