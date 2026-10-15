const express = require('express');
const router = express.Router();

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Project & Team Management System REST API',
    version: '1.0.0',
    description:
      'Production-ready Enterprise REST API supporting Multi-Role RBAC, Project Management, Task Tracking, Activity Auditing, and AI Features.',
  },
  servers: [
    { url: '/api', description: 'Current API Gateway' },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health check and diagnostic status',
        responses: { '200': { description: 'System operational status' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  role: { type: 'string', enum: ['admin', 'project_manager', 'team_member'] },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'User registered with JWT token' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Authentication successful, returns JWT' } },
      },
    },
    '/projects': {
      get: {
        summary: 'List authorized projects with filtering and pagination',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'List of authorized projects' } },
      },
      post: {
        summary: 'Create project (Admin / Project Manager)',
        responses: { '201': { description: 'Project created' } },
      },
    },
    '/tasks': {
      get: {
        summary: 'List and filter tasks (project, assignee, priority, status, overdue)',
        responses: { '200': { description: 'Tasks list with pagination envelope' } },
      },
      post: {
        summary: 'Create a task (Admin / PM)',
        responses: { '201': { description: 'Task created and project progress updated' } },
      },
    },
    '/tasks/{id}/status': {
      patch: {
        summary: 'Update task status (Admin, PM, or assigned Team Member)',
        responses: { '200': { description: 'Task status updated' } },
      },
    },
    '/tasks/{id}/comments': {
      post: {
        summary: 'Add task comment and trigger activity log',
        responses: { '201': { description: 'Comment created' } },
      },
    },
    '/dashboard/summary': {
      get: {
        summary: 'Retrieve database-calculated dashboard metrics',
        responses: { '200': { description: 'Summary statistics' } },
      },
    },
    '/ai/suggest-task': {
      post: {
        summary: 'AI Task Breakdown, acceptance criteria, and effort estimation',
        responses: { '200': { description: 'Structured AI suggestions' } },
      },
    },
    '/ai/project-analysis/{projectId}': {
      get: {
        summary: 'AI Project Risk Assessment and recommended next actions',
        responses: { '200': { description: 'Project risk evaluation' } },
      },
    },
  },
};

router.get('/spec', (req, res) => {
  res.json(openApiSpec);
});

router.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>API Documentation - Project & Team Management System</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body style="margin: 0; background: #fafafa;">
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/spec',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ]
    });
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

module.exports = router;
