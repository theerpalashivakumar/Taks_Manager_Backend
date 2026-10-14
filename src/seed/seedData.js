require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../constants/statuses');
const { ACTIVITY_TYPES } = require('../constants/activityTypes');

const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('your_mongodb_connection_string')) {
    console.error('❌ MONGODB_URI is not set in .env. Please configure it before running seed.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB. Purging existing test data...');

    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      TaskComment.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);

    console.log('🌱 Seeding demo users...');
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@taskmanager.com',
      password: 'Password@123',
      role: ROLES.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    const pm = await User.create({
      name: 'Sarah Connor (PM)',
      email: 'pm@taskmanager.com',
      password: 'Password@123',
      role: ROLES.PROJECT_MANAGER,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    });

    const dev1 = await User.create({
      name: 'Alex Rivera',
      email: 'alex@taskmanager.com',
      password: 'Password@123',
      role: ROLES.TEAM_MEMBER,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    });

    const dev2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@taskmanager.com',
      password: 'Password@123',
      role: ROLES.TEAM_MEMBER,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    });

    console.log('🌱 Seeding sample projects...');
    const project1 = await Project.create({
      name: 'NextGen Cloud Architecture & Microservices',
      description:
        'Migrate monolithic legacy payment and order processing pipeline into scalable containerized microservices hosted on AWS ECS with zero downtime.',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days in future
      status: PROJECT_STATUSES.ACTIVE,
      projectManager: pm._id,
      members: [pm._id, dev1._id, dev2._id],
      completionPercentage: 50,
      createdBy: admin._id,
    });

    const project2 = await Project.create({
      name: 'Mobile App Redesign & Performance Optimization',
      description:
        'Overhaul mobile experience for iOS and Android with modern design tokens, reduced startup latency under 1.2s, and offline caching.',
      startDate: new Date(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: PROJECT_STATUSES.PLANNING,
      projectManager: pm._id,
      members: [pm._id, dev1._id],
      completionPercentage: 0,
      createdBy: pm._id,
    });

    console.log('🌱 Seeding project tasks...');
    const task1 = await Task.create({
      title: 'Design API Gateway & JWT Auth Filter',
      description: 'Establish unified routing, request validation schemas, and JWT inspection rate limiter.',
      project: project1._id,
      assignedTo: dev1._id,
      priority: TASK_PRIORITIES.CRITICAL,
      status: TASK_STATUSES.DONE,
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdBy: pm._id,
    });

    const task2 = await Task.create({
      title: 'Containerize Order Service with Docker',
      description: 'Write multi-stage Dockerfile and docker-compose configurations with production health probes.',
      project: project1._id,
      assignedTo: dev2._id,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.IN_PROGRESS,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: pm._id,
    });

    const task3 = await Task.create({
      title: 'Implement Database Connection Pooling & Replicas',
      description: 'Configure MongoDB read preferences, indexes, and connection auto-recovery under high load.',
      project: project1._id,
      assignedTo: dev1._id,
      priority: TASK_PRIORITIES.MEDIUM,
      status: TASK_STATUSES.TODO,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // OVERDUE TASK
      createdBy: pm._id,
    });

    const task4 = await Task.create({
      title: 'User Interface Figma Wireframes & Tokens',
      description: 'Create high-fidelity prototypes and color palette conforming to WCAG AA accessibility.',
      project: project2._id,
      assignedTo: dev1._id,
      priority: TASK_PRIORITIES.HIGH,
      status: TASK_STATUSES.TODO,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdBy: pm._id,
    });

    console.log('🌱 Seeding comments and activity logs...');
    await TaskComment.create({
      task: task1._id,
      author: dev1._id,
      comment: 'The Gateway and rate limiters have been tested with 500 req/sec load with 0 errors.',
    });

    await TaskComment.create({
      task: task2._id,
      author: pm._id,
      comment: 'Great progress Priya, let us review the image size before pushing to registry.',
    });

    await ActivityLog.create({
      action: ACTIVITY_TYPES.PROJECT_CREATED,
      entityType: 'Project',
      entityId: project1._id,
      project: project1._id,
      performedBy: admin._id,
      details: `Project "${project1.name}" was initialized.`,
    });

    await ActivityLog.create({
      action: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
      entityType: 'Task',
      entityId: task1._id,
      project: project1._id,
      task: task1._id,
      performedBy: dev1._id,
      details: `Task "${task1.title}" status changed to Done.`,
    });

    console.log('\n===========================================');
    console.log('🎉 Seed Completed Successfully!');
    console.log('===========================================');
    console.log('🔑 Demo User Logins:');
    console.log('  Admin:           admin@taskmanager.com / Password@123');
    console.log('  Project Manager: pm@taskmanager.com    / Password@123');
    console.log('  Team Member 1:   alex@taskmanager.com  / Password@123');
    console.log('  Team Member 2:   priya@taskmanager.com / Password@123');
    console.log('===========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
