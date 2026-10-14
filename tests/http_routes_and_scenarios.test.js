const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/tokenUtils');
const { ROLES } = require('../src/constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../src/constants/statuses');
const ProjectService = require('../src/services/projectService');
const TaskService = require('../src/services/taskService');

test('Scenario Suite 1: Health & System Diagnostics', async (t) => {
  await t.test('GET /api/health returns 200 and operational status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'online');
  });

  await t.test('GET / returns API welcome message', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message.includes('Project & Team Management System'));
  });

  await t.test('GET /api/undefined-endpoint returns standard 404 error envelope', async () => {
    const res = await request(app).get('/api/non-existent-route-123');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Endpoint not found'));
  });
});

test('Scenario Suite 2: Authentication Input Validation & Error Handling', async (t) => {
  await t.test('POST /api/auth/register fails with 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad-email' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(Array.isArray(res.body.errors));
    assert.ok(res.body.errors.length > 0);
  });

  await t.test('POST /api/auth/register rejects invalid role', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'super_hacker',
      });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.some((err) => err.includes('Role must be one of')));
  });

  await t.test('POST /api/auth/login fails with 400 when password or email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.errors.some((err) => err.includes('Password is required')));
  });
});

test('Scenario Suite 3: Protected Routes & JWT Verification', async (t) => {
  await t.test('GET /api/projects rejects request without Authorization header (401)', async () => {
    const res = await request(app).get('/api/projects');
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Authentication required'));
  });

  await t.test('GET /api/tasks rejects request with malformed token (401)', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid.token.payload');

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Invalid authentication token'));
  });

  await t.test('GET /api/dashboard/summary rejects unauthenticated visitor (401)', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    assert.strictEqual(res.status, 401);
  });

  await t.test('GET /api/users rejects unauthenticated visitor (401)', async () => {
    const res = await request(app).get('/api/users');
    assert.strictEqual(res.status, 401);
  });
});

test('Scenario Suite 4: Password-Protected Project Explanation (Shiv@818780)', async (t) => {
  let verifiedToken = '';

  await t.test('POST /api/project-explanation/verify rejects missing password with 400', async () => {
    const res = await request(app)
      .post('/api/project-explanation/verify')
      .send({});

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('POST /api/project-explanation/verify rejects incorrect password with 401', async () => {
    const res = await request(app)
      .post('/api/project-explanation/verify')
      .send({ password: 'WrongPassword999' });

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('Incorrect project access password'));
  });

  await t.test('POST /api/project-explanation/verify succeeds with "Shiv@818780" and returns signed token', async () => {
    const res = await request(app)
      .post('/api/project-explanation/verify')
      .send({ password: 'Shiv@818780' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.verified, true);
    assert.ok(res.body.data.token, 'Must return signed token');
    verifiedToken = res.body.data.token;
  });

  await t.test('GET /api/project-explanation/content rejects direct access without token (403)', async () => {
    const res = await request(app).get('/api/project-explanation/content');
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('GET /api/project-explanation/content returns full architecture when verified token provided', async () => {
    const res = await request(app)
      .get('/api/project-explanation/content')
      .set('x-explanation-token', verifiedToken);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.title);
    assert.ok(res.body.data.techStack.frontend.length > 0);
    assert.ok(res.body.data.techStack.backend.length > 0);
    assert.ok(res.body.data.rolesAndPermissions.length >= 3);
  });
});

test('Scenario Suite 5: Domain Validation Constraints (Projects, Tasks, Comments)', async (t) => {
  const { validateCreateProject } = require('../src/validators/projectValidators');
  const { validateCreateTask, validateComment } = require('../src/validators/taskValidators');

  await t.test('Project validator flags deadline before start date', () => {
    const req = {
      body: {
        name: 'Invalid Date Project',
        description: 'Test description',
        startDate: '2026-11-15',
        deadline: '2026-11-01', // Before start date
      },
    };
    let capturedError = null;
    validateCreateProject(req, {}, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError, 'Should generate an error');
    assert.strictEqual(capturedError.statusCode, 400);
    assert.ok(capturedError.errors.some((e) => e.includes('strictly after the start date')));
  });

  await t.test('Task validator flags missing project or assignee', () => {
    const req = {
      body: {
        title: 'Complete Gateway',
        description: 'Implement auth',
        dueDate: '2026-12-01',
      },
    };
    let capturedError = null;
    validateCreateTask(req, {}, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError);
    assert.strictEqual(capturedError.statusCode, 400);
    assert.ok(capturedError.errors.some((e) => e.includes('Project ID is required')));
    assert.ok(capturedError.errors.some((e) => e.includes('Assigned User ID is required')));
  });

  await t.test('Comment validator rejects empty comments', () => {
    const req = { body: { comment: '   ' } };
    let capturedError = null;
    validateComment(req, {}, (err) => {
      capturedError = err;
    });

    assert.ok(capturedError);
    assert.strictEqual(capturedError.statusCode, 400);
  });
});

test('Scenario Suite 6: Resource-Level Access & Multi-Role Scoping', async (t) => {
  const project = {
    _id: 'proj_alpha',
    name: 'Alpha System',
    projectManager: 'user_pm_10',
    members: ['user_pm_10', 'user_dev_20'],
  };

  const admin = { _id: 'user_admin_1', role: ROLES.ADMIN };
  const authorizedPM = { _id: 'user_pm_10', role: ROLES.PROJECT_MANAGER };
  const unauthorizedPM = { _id: 'user_pm_99', role: ROLES.PROJECT_MANAGER };
  const assignedMember = { _id: 'user_dev_20', role: ROLES.TEAM_MEMBER };
  const unauthorizedMember = { _id: 'user_dev_88', role: ROLES.TEAM_MEMBER };

  await t.test('Admin can access and manage any project', () => {
    assert.doesNotThrow(() => ProjectService.assertProjectAccess(project, admin));
    assert.doesNotThrow(() => ProjectService.assertProjectManagementPermission(project, admin));
  });

  await t.test('Assigned Project Manager has full project management access', () => {
    assert.doesNotThrow(() => ProjectService.assertProjectAccess(project, authorizedPM));
    assert.doesNotThrow(() => ProjectService.assertProjectManagementPermission(project, authorizedPM));
  });

  await t.test('Unauthorized Project Manager is denied management rights', () => {
    assert.throws(
      () => ProjectService.assertProjectManagementPermission(project, unauthorizedPM),
      (err) => err.statusCode === 403
    );
  });

  await t.test('Assigned team member has read access but cannot manage or reconfigure project', () => {
    assert.doesNotThrow(() => ProjectService.assertProjectAccess(project, assignedMember));
    assert.throws(
      () => ProjectService.assertProjectManagementPermission(project, assignedMember),
      (err) => err.statusCode === 403
    );
  });

  await t.test('Unauthorized team member is completely rejected (403)', () => {
    assert.throws(
      () => ProjectService.assertProjectAccess(project, unauthorizedMember),
      (err) => err.statusCode === 403
    );
  });
});
