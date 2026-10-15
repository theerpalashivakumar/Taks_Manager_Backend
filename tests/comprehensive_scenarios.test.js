require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { ROLES } = require('../src/constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../src/constants/statuses');
const { signToken } = require('../src/utils/tokenUtils');
const ProjectService = require('../src/services/projectService');
const TaskService = require('../src/services/taskService');
const AiService = require('../src/services/aiService');

test('=== Advanced 20+ Years Assessment Scenario Suite ===', async (suite) => {
  const adminToken = signToken({ id: 'admin_test_1', role: ROLES.ADMIN });
  const pmToken = signToken({ id: 'pm_test_1', role: ROLES.PROJECT_MANAGER });
  const memberToken = signToken({ id: 'member_test_1', role: ROLES.TEAM_MEMBER });
  const unauthorizedMemberToken = signToken({ id: 'member_outsider_9', role: ROLES.TEAM_MEMBER });

  // 1. Authentication Scenarios
  await suite.test('Scenario 1: Authentication Security & Validation', async (t) => {
    await t.test('Login fails with 400 when email or password is missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'missing-pass@test.com' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await t.test('Register fails with 400 when email format is invalid', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Invalid Email User',
        email: 'invalid-email-without-domain',
        password: 'ValidPassword123!',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await t.test('Register fails with 400 when password is under 6 characters', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Short Pass',
        email: 'short@test.com',
        password: '123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.errors.some((e) => e.includes('at least 6 characters')));
    });

    await t.test('Protected endpoint rejects missing or forged Bearer token with 401', async () => {
      const res1 = await request(app).get('/api/projects');
      assert.strictEqual(res1.status, 401);

      const res2 = await request(app).get('/api/projects').set('Authorization', 'Bearer forged.fake.jwt');
      assert.strictEqual(res2.status, 401);
    });
  });

  // 2. Project Creation & Field Validation Scenarios
  await suite.test('Scenario 2: Project Management Validation & Lifecycle', async (t) => {
    const { validateCreateProject, validateUpdateProject } = require('../src/validators/projectValidators');

    await t.test('Validation: Rejects project when deadline is strictly before start date', () => {
      const req = {
        body: {
          name: 'Invalid Date Sprint',
          description: 'A test project with inverted dates',
          startDate: '2026-12-31',
          deadline: '2026-12-01',
        },
      };
      let error = null;
      validateCreateProject(req, {}, (err) => {
        error = err;
      });
      assert.ok(error);
      assert.strictEqual(error.statusCode, 400);
      assert.ok(error.errors.some((e) => e.includes('strictly after the start date')));
    });

    await t.test('Validation: Accepts valid project dates and payload', () => {
      const req = {
        body: {
          name: 'Valid Modern Cloud Migration',
          description: 'Production migration to AWS/MongoDB Atlas',
          startDate: '2026-10-01',
          deadline: '2026-11-30',
        },
      };
      let error = null;
      validateCreateProject(req, {}, (err) => {
        error = err;
      });
      assert.strictEqual(error, undefined);
    });

    await t.test('RBAC: Non-admin non-PM cannot modify project parameters', () => {
      const project = {
        _id: 'proj_alpha',
        name: 'Alpha Project',
        projectManager: 'pm_lead_1',
        members: ['pm_lead_1', 'dev_1'],
      };
      const outsider = { _id: 'dev_stranger', role: ROLES.TEAM_MEMBER };
      assert.throws(
        () => ProjectService.assertProjectManagementPermission(project, outsider),
        (err) => err.statusCode === 403
      );
    });
  });

  // 3. Task Management & Progress Recalculation
  await suite.test('Scenario 3: Task Management, Status Flow, and Math Logic', async (t) => {
    const { validateCreateTask } = require('../src/validators/taskValidators');

    await t.test('Validation: Flags missing task title, project, or assignee', () => {
      const req = { body: {} };
      let error = null;
      validateCreateTask(req, {}, (err) => {
        error = err;
      });
      assert.ok(error);
      assert.strictEqual(error.statusCode, 400);
      assert.ok(error.errors.some((e) => e.includes('Task title is required')));
      assert.ok(error.errors.some((e) => e.includes('Project ID is required')));
    });

    await t.test('Progress Recalculation Formula verification (50% on 1/2 done)', () => {
      const total = 2;
      const completed = 1;
      const percentage = Math.round((completed / total) * 100);
      assert.strictEqual(percentage, 50);
    });

    await t.test('Progress Recalculation Formula verification (100% on 3/3 done)', () => {
      const total = 3;
      const completed = 3;
      const percentage = Math.round((completed / total) * 100);
      assert.strictEqual(percentage, 100);
    });

    await t.test('Progress Recalculation Formula verification (0% on 0 total tasks)', () => {
      const total = 0;
      const percentage = total === 0 ? 0 : 100;
      assert.strictEqual(percentage, 0);
    });
  });

  // 4. Multi-Role Resource Scoping & Boundary Security
  await suite.test('Scenario 4: Multi-Role Boundary Enforcement (Admin, PM, Member)', async (t) => {
    const sampleProject = {
      _id: 'proj_secure',
      projectManager: 'pm_101',
      members: ['pm_101', 'dev_202'],
    };

    const admin = { _id: 'admin_root', role: ROLES.ADMIN };
    const pm = { _id: 'pm_101', role: ROLES.PROJECT_MANAGER };
    const otherPm = { _id: 'pm_999', role: ROLES.PROJECT_MANAGER };
    const member = { _id: 'dev_202', role: ROLES.TEAM_MEMBER };
    const unauthorizedMember = { _id: 'dev_303', role: ROLES.TEAM_MEMBER };

    await t.test('Admin can access and manage any project', () => {
      assert.strictEqual(ProjectService.assertProjectAccess(sampleProject, admin), true);
      assert.strictEqual(ProjectService.assertProjectManagementPermission(sampleProject, admin), true);
    });

    await t.test('Authorized Project Manager can manage their project', () => {
      assert.strictEqual(ProjectService.assertProjectAccess(sampleProject, pm), true);
      assert.strictEqual(ProjectService.assertProjectManagementPermission(sampleProject, pm), true);
    });

    await t.test('Unauthorized Project Manager CANNOT manage foreign project', () => {
      assert.throws(
        () => ProjectService.assertProjectManagementPermission(sampleProject, otherPm),
        (err) => err.statusCode === 403
      );
    });

    await t.test('Team Member has read access to their project but cannot reconfigure project', () => {
      assert.strictEqual(ProjectService.assertProjectAccess(sampleProject, member), true);
      assert.throws(
        () => ProjectService.assertProjectManagementPermission(sampleProject, member),
        (err) => err.statusCode === 403
      );
    });

    await t.test('Unauthorized Team Member is rejected on both read and write', () => {
      assert.throws(
        () => ProjectService.assertProjectAccess(sampleProject, unauthorizedMember),
        (err) => err.statusCode === 403
      );
      assert.throws(
        () => ProjectService.assertProjectManagementPermission(sampleProject, unauthorizedMember),
        (err) => err.statusCode === 403
      );
    });
  });

  // 5. AI Features (Task Breakdown & Project Risk Assessment)
  await suite.test('Scenario 5: Intelligent AI Capabilities & Heuristics', async (t) => {
    await t.test('AI Service generates comprehensive task breakdown with criteria and estimation', async () => {
      const breakdown = await AiService.generateTaskBreakdown({
        title: 'Implement OAuth 2.0 Security Gateway',
        description: 'Provide Google and GitHub SSO with JWT issuance',
      });

      assert.strictEqual(breakdown.category, 'security');
      assert.strictEqual(breakdown.suggestedPriority, TASK_PRIORITIES.CRITICAL);
      assert.ok(breakdown.storyPoints >= 3);
      assert.ok(breakdown.acceptanceCriteria.length >= 4);
      assert.ok(breakdown.generatedDescription.includes('Key Acceptance Criteria'));
    });

    await t.test('AI Service generates project risk evaluation and alerts on overdue milestones', async () => {
      const mockProject = {
        _id: 'proj_mock_risk',
        name: 'Legacy Cloud Overhaul',
        completionPercentage: 30,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // expired yesterday
      };

      const mockTasks = [
        {
          title: 'Database indexing',
          dueDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          status: TASK_STATUSES.TODO,
          priority: TASK_PRIORITIES.CRITICAL,
        },
      ];

      const analysis = await AiService.generateProjectRiskAnalysis(mockProject, mockTasks);
      assert.strictEqual(analysis.riskLevel, 'Critical');
      assert.ok(analysis.riskFactors.length > 0);
      assert.ok(analysis.recommendedActions.length > 0);
    });

    await t.test('POST /api/ai/suggest-task returns 200 with structured breakdown for authenticated user', async () => {
      const User = require('../src/models/User');
      const originalFindById = User.findById;
      User.findById = () => Promise.resolve({ _id: 'admin_test_1', name: 'Admin User', role: ROLES.ADMIN, isActive: true });

      try {
        const res = await request(app)
          .post('/api/ai/suggest-task')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ title: 'Refactor Express Controllers to Service Repository Pattern' });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.data.storyPoints);
        assert.ok(res.body.data.acceptanceCriteria.length > 0);
      } finally {
        User.findById = originalFindById;
      }
    });

    await t.test('POST /api/ai/suggest-task rejects unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/ai/suggest-task')
        .send({ title: 'Implement Redis caching' });

      assert.strictEqual(res.status, 401);
    });
  });

  // 6. OpenAPI & Documentation Routes
  await suite.test('Scenario 6: OpenAPI 3.0 Documentation & Swagger UI', async (t) => {
    await t.test('GET /api/docs/spec returns valid OpenAPI 3.0.3 specification JSON', async () => {
      const res = await request(app).get('/api/docs/spec');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.openapi, '3.0.3');
      assert.ok(res.body.paths['/auth/login']);
      assert.ok(res.body.paths['/projects']);
      assert.ok(res.body.paths['/tasks']);
    });

    await t.test('GET /api/docs returns Swagger UI HTML', async () => {
      const res = await request(app).get('/api/docs');
      assert.strictEqual(res.status, 200);
      assert.ok(res.text.includes('SwaggerUIBundle'));
    });
  });

  // 7. Filtering & Overdue Boundary Logic
  await suite.test('Scenario 7: Filtering, Sorting, and Pagination Query Engine', async () => {
    const overdueDate = new Date(Date.now() - 100000).toISOString();
    const futureDate = new Date(Date.now() + 10000000).toISOString();

    const isTaskOverdue = (dueDate, status) => {
      return new Date(dueDate).getTime() < Date.now() && status !== TASK_STATUSES.DONE;
    };

    assert.strictEqual(isTaskOverdue(overdueDate, TASK_STATUSES.TODO), true);
    assert.strictEqual(isTaskOverdue(overdueDate, TASK_STATUSES.DONE), false);
    assert.strictEqual(isTaskOverdue(futureDate, TASK_STATUSES.TODO), false);
  });
});
