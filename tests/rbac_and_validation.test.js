const test = require('node:test');
const assert = require('node:assert');
const { ROLES } = require('../src/constants/roles');
const { PROJECT_STATUSES, TASK_STATUSES, TASK_PRIORITIES } = require('../src/constants/statuses');
const ProjectService = require('../src/services/projectService');

test('Role Constants and Enums Validation', async (t) => {
  await t.test('Roles should contain ADMIN, PROJECT_MANAGER, TEAM_MEMBER', () => {
    assert.strictEqual(ROLES.ADMIN, 'admin');
    assert.strictEqual(ROLES.PROJECT_MANAGER, 'project_manager');
    assert.strictEqual(ROLES.TEAM_MEMBER, 'team_member');
  });

  await t.test('Project statuses should match required lifecycle', () => {
    assert.strictEqual(PROJECT_STATUSES.PLANNING, 'Planning');
    assert.strictEqual(PROJECT_STATUSES.ACTIVE, 'Active');
    assert.strictEqual(PROJECT_STATUSES.ON_HOLD, 'On Hold');
    assert.strictEqual(PROJECT_STATUSES.COMPLETED, 'Completed');
  });

  await t.test('Task priorities should match required levels', () => {
    assert.strictEqual(TASK_PRIORITIES.LOW, 'Low');
    assert.strictEqual(TASK_PRIORITIES.MEDIUM, 'Medium');
    assert.strictEqual(TASK_PRIORITIES.HIGH, 'High');
    assert.strictEqual(TASK_PRIORITIES.CRITICAL, 'Critical');
  });

  await t.test('Task statuses should match required columns', () => {
    assert.strictEqual(TASK_STATUSES.TODO, 'To Do');
    assert.strictEqual(TASK_STATUSES.IN_PROGRESS, 'In Progress');
    assert.strictEqual(TASK_STATUSES.IN_REVIEW, 'In Review');
    assert.strictEqual(TASK_STATUSES.DONE, 'Done');
  });
});

test('RBAC Access Scoping Assertion', async (t) => {
  const adminUser = { _id: 'admin_1', role: ROLES.ADMIN };
  const pmUser = { _id: 'pm_1', role: ROLES.PROJECT_MANAGER };
  const otherPmUser = { _id: 'pm_2', role: ROLES.PROJECT_MANAGER };
  const memberUser = { _id: 'dev_1', role: ROLES.TEAM_MEMBER };
  const outsiderUser = { _id: 'dev_2', role: ROLES.TEAM_MEMBER };

  const project = {
    _id: 'proj_1',
    name: 'Apollo Project',
    projectManager: 'pm_1',
    members: ['pm_1', 'dev_1'],
  };

  await t.test('Admin should have access to any project', () => {
    assert.doesNotThrow(() => {
      ProjectService.assertProjectAccess(project, adminUser);
    });
  });

  await t.test('Assigned Project Manager should have management permission', () => {
    assert.doesNotThrow(() => {
      ProjectService.assertProjectManagementPermission(project, pmUser);
    });
  });

  await t.test('Unassigned Project Manager should NOT have management permission', () => {
    assert.throws(() => {
      ProjectService.assertProjectManagementPermission(project, otherPmUser);
    });
  });

  await t.test('Assigned team member should have view access but NOT management permission', () => {
    assert.doesNotThrow(() => {
      ProjectService.assertProjectAccess(project, memberUser);
    });
    assert.throws(() => {
      ProjectService.assertProjectManagementPermission(project, memberUser);
    });
  });

  await t.test('Outsider user should be denied access completely', () => {
    assert.throws(() => {
      ProjectService.assertProjectAccess(project, outsiderUser);
    });
  });
});
