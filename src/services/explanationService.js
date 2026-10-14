const jwt = require('jsonwebtoken');
const ApiError = require('../utils/apiError');

const EXPLANATION_SECRET = process.env.JWT_SECRET || 'project_explanation_secret_key_818780';

class ExplanationService {
  /**
   * Securely verifies view password and generates a signed viewing token
   */
  static verifyPassword(submittedPassword) {
    const targetPassword = process.env.PROJECT_VIEW_PASSWORD || 'Shiv@818780';

    if (!submittedPassword || submittedPassword !== targetPassword) {
      throw ApiError.unauthorized('Incorrect project access password. Access denied.');
    }

    // Issue a short-lived signed token valid for 2 hours
    const token = jwt.sign(
      { scope: 'project_explanation_view', timestamp: Date.now() },
      EXPLANATION_SECRET,
      { expiresIn: '2h' }
    );

    return {
      verified: true,
      token,
      message: 'Access granted to Project Architectural Overview.',
    };
  }

  /**
   * Verifies the token and retrieves complete architectural details
   */
  static getExplanationContent(token) {
    if (!token) {
      throw ApiError.forbidden('Forbidden. Please provide a verified project access token.');
    }

    try {
      const decoded = jwt.verify(token, EXPLANATION_SECRET);
      if (decoded.scope !== 'project_explanation_view') {
        throw ApiError.forbidden('Invalid access token scope.');
      }
    } catch (err) {
      throw ApiError.forbidden('Access session has expired or is invalid. Please re-enter the password.');
    }

    return {
      title: 'Project & Team Management System (MERN Stack)',
      version: '1.0.0',
      introduction:
        'A complete, enterprise-grade Project & Team Management System engineered using the MERN stack (MongoDB, Express.js, React, Node.js). Designed for modern engineering and operations teams to manage project lifecycles, assign tasks, monitor deadlines, and enforce rigorous multi-role access control.',
      problemSolved:
        'Small-to-medium organizations frequently struggle with fragmented task tracking, unmonitored team bandwidth, lack of audit trails, and insecure permission leaks where members can modify critical project parameters outside their authorization scope. This system solves these issues with real-time progress calculations, role-based resource protection, and unified reporting.',
      developmentPrompt: {
        title: 'Complete Full-Stack MERN Project Development Prompt',
        objective:
          'Develop a complete, professional, production-ready Project & Team Management System using the MERN stack. The application allows an organization to manage projects, assign tasks to team members, track project progress, monitor deadlines, and manage collaboration between users with different roles (Admin, Project Manager, Team Member).',
        architectureHighlights: [
          'Modular, reusable, maintainable architecture following DRY (Don\'t Repeat Yourself) principle',
          'Independent Frontend and Backend repositories with dedicated READMEs, scripts, and .env.example files',
          'Strict server-enforced Role-Based Access Control (Admin, Project Manager, Team Member)',
          'Real database-backed statistics, pagination, search, and dynamic project completion calculations',
          'Password-protected Architecture Docs ("Shiv@818780") restricted to authenticated users only',
        ],
      },
      techStack: {
        frontend: [
          'React 18/19 with Vite for lightning-fast bundling, ES modules, and instant HMR',
          'Tailwind CSS for responsive design, custom color scales, and polished layout tokens',
          'Redux Toolkit (RTK) with async thunks for state management (auth, projects, tasks, users, dashboard, ui)',
          'React Router DOM v6 for declarative client-side routing & protected route guards',
          'Axios with interceptors for automatic JWT Bearer token injection and error handling',
          'Lucide React for consistent, high-quality iconography',
        ],
        backend: [
          'Node.js & Express.js REST API with modular Controller-Service-Repository architecture',
          'MongoDB & Mongoose ODM for structured schemas, relationships, indexing, and aggregations',
          'JSON Web Tokens (JWT) for stateless, secure user authentication with expiration',
          'bcrypt with 10 salt rounds for secure one-way password hashing',
          'express-rate-limit to protect sensitive auth and passkey verification endpoints from brute-force',
          'helmet for HTTP security headers and CORS protection',
          'Centralized error handling middleware with unified JSON error envelopes',
        ],
      },
      mainFeatures: [
        'Secure Authentication: Email/password registration, login, logout, and token validation',
        'Role-Based Access Control (RBAC): Admin, Project Manager, and Team Member roles with server-level enforcement',
        'Project Lifecycle Management: Planning, Active, On Hold, Completed with automatic progress recalculations',
        'Task Management: Priority (Low to Critical), Statuses (To Do, In Progress, In Review, Done), Due dates, and Assignees',
        'Database-Backed Pagination & Filtering: Filter tasks by project, assignee, priority, status, and overdue flags',
        'Team Collaboration: Task comments with timestamps and author details',
        'Audit & Activity Logging: Server-side tracking of project creations, task assignments, and status updates',
        'Real-time Dashboard Metrics: Dynamic database aggregation of project/task counts and status distributions',
        'User Management: Admin can view all users, activate/deactivate accounts, and update user roles',
        'Password-Protected Architecture Docs: Accessible only to authenticated users with passkey verification',
      ],
      rolesAndPermissions: [
        {
          role: 'Admin',
          scope: 'Organization-wide supervision',
          permissions: [
            'Full control over all users: activate/deactivate accounts, change user roles',
            'Full project management: create, update, delete, archive, and assign Project Managers and members',
            'Full task control: create, assign, reassign, update statuses, priorities, and deadlines',
            'Access organization-wide dashboard metrics across all database records',
          ],
        },
        {
          role: 'Project Manager',
          scope: 'Authorized project scope',
          permissions: [
            'Create new projects and manage projects where assigned as Project Manager',
            'Assign and remove team members from authorized projects',
            'Create, update, assign, and delete tasks within their authorized projects',
            'View project activity history and monitor sprint completion percentages',
          ],
        },
        {
          role: 'Team Member',
          scope: 'Assigned work scope',
          permissions: [
            'View projects where they are an active team member',
            'View tasks assigned to them and their project boards',
            'Update the status of their assigned tasks (To Do -> In Progress -> Done)',
            'Post comments and collaborate on authorized tasks',
          ],
        },
      ],
      folderStructures: {
        frontend: [
          { path: 'src/components/common/', description: 'Reusable UI primitives: Button, Input, Modal, Badge, Pagination, Toast' },
          { path: 'src/components/forms/', description: 'Form dialogs: ProjectFormModal, TaskFormModal with validation' },
          { path: 'src/components/layout/', description: 'Layout scaffolding: Navbar, Sidebar, ViewProjectModal' },
          { path: 'src/layouts/', description: 'Route wrappers: AppLayout, AuthLayout, ProtectedRoute (RBAC guards)' },
          { path: 'src/pages/', description: 'Full view pages: Dashboard, Projects, Tasks, Users, Project Explanation' },
          { path: 'src/redux/slices/', description: 'RTK slices: authSlice, projectSlice, taskSlice, userSlice, dashboardSlice, uiSlice' },
          { path: 'src/services/', description: 'API service layer with Axios interceptors: api.js, authService, projectService, etc.' },
        ],
        backend: [
          { path: 'src/config/', description: 'MongoDB connection configuration and environment validation' },
          { path: 'src/models/', description: 'Mongoose schemas: User, Project, Task, TaskComment, ActivityLog' },
          { path: 'src/controllers/', description: 'HTTP request handling, status codes, and input extraction' },
          { path: 'src/services/', description: 'Core business logic, database queries, and recalculations' },
          { path: 'src/middlewares/', description: 'JWT authentication, RBAC authorization, rate limiters, centralized errorHandler' },
          { path: 'src/validators/', description: 'Request body validation for auth, projects, tasks, and comments' },
          { path: 'src/routes/', description: 'Express endpoint routing organized by entity' },
          { path: 'tests/', description: 'Automated test suite covering auth, RBAC, domain validations, and scenarios' },
        ],
      },
      databaseModels: [
        {
          name: 'User',
          description: 'Team members, Project Managers, and Admins',
          fields: '_id, name, email (unique), password (bcrypt hash), role (enum), avatar, isActive, timestamps',
        },
        {
          name: 'Project',
          description: 'Core project workspace entity',
          fields: '_id, name, description, startDate, deadline, status (enum), projectManager (Ref User), members ([Ref User]), isArchived, completionPercentage, timestamps',
        },
        {
          name: 'Task',
          description: 'Individual work item assigned to a member',
          fields: '_id, title, description, project (Ref Project), assignedTo (Ref User), priority (Low, Medium, High, Critical), status (To Do, In Progress, In Review, Done), dueDate, createdBy (Ref User), timestamps',
        },
        {
          name: 'TaskComment',
          description: 'Chronological collaboration messages on tasks',
          fields: '_id, content, task (Ref Task), author (Ref User), timestamps',
        },
        {
          name: 'ActivityLog',
          description: 'Server-recorded audit trail of actions',
          fields: '_id, action, entityType, entityId, project (Ref Project), task (Ref Task), performedBy (Ref User), details, createdAt',
        },
      ],
      apiEndpoints: [
        { method: 'POST', endpoint: '/api/auth/register', auth: 'Public', description: 'Register a new user account' },
        { method: 'POST', endpoint: '/api/auth/login', auth: 'Public', description: 'Authenticate user and return JWT' },
        { method: 'GET', endpoint: '/api/auth/me', auth: 'Authenticated', description: 'Fetch current logged in user session' },
        { method: 'GET', endpoint: '/api/projects', auth: 'Authenticated', description: 'List projects filtered by role and permissions' },
        { method: 'POST', endpoint: '/api/projects', auth: 'Admin / PM', description: 'Create a new project' },
        { method: 'GET', endpoint: '/api/projects/:id', auth: 'Authenticated', description: 'Get project details with task counts' },
        { method: 'PATCH', endpoint: '/api/projects/:id', auth: 'Admin / PM', description: 'Update project information' },
        { method: 'PATCH', endpoint: '/api/projects/:id/members', auth: 'Admin / PM', description: 'Assign or remove project members' },
        { method: 'PATCH', endpoint: '/api/projects/:id/archive', auth: 'Admin / PM', description: 'Archive or unarchive project' },
        { method: 'DELETE', endpoint: '/api/projects/:id', auth: 'Admin / PM', description: 'Delete project and cascade associated tasks' },
        { method: 'GET', endpoint: '/api/tasks', auth: 'Authenticated', description: 'List tasks with search, pagination, and filters' },
        { method: 'POST', endpoint: '/api/tasks', auth: 'Admin / PM', description: 'Create and assign a task' },
        { method: 'GET', endpoint: '/api/tasks/:id', auth: 'Authenticated', description: 'Get task details with comments' },
        { method: 'PATCH', endpoint: '/api/tasks/:id', auth: 'Authorized', description: 'Update task details or status' },
        { method: 'DELETE', endpoint: '/api/tasks/:id', auth: 'Admin / PM', description: 'Delete task' },
        { method: 'POST', endpoint: '/api/tasks/:id/comments', auth: 'Authorized', description: 'Post collaboration comment' },
        { method: 'GET', endpoint: '/api/dashboard/summary', auth: 'Authenticated', description: 'Role-scoped dashboard analytics' },
        { method: 'GET', endpoint: '/api/users', auth: 'Admin / PM', description: 'Search and list team members' },
        { method: 'PATCH', endpoint: '/api/users/:id/role', auth: 'Admin', description: 'Update user authorization role' },
        { method: 'PATCH', endpoint: '/api/users/:id/status', auth: 'Admin', description: 'Toggle user active/inactive status' },
        { method: 'POST', endpoint: '/api/project-explanation/verify', auth: 'Authenticated', description: 'Verify passkey and issue token' },
        { method: 'GET', endpoint: '/api/project-explanation/content', auth: 'Authenticated + Token', description: 'Retrieve architecture specs' },
      ],
      authAndSecurityFlow: [
        'Registration & Login: Passwords hashed with bcrypt (10 rounds). Server returns signed JWT token.',
        'Token Verification: Express auth middleware verifies Bearer token and attaches user object to request context.',
        'Role-Based Authorization: Middleware checks user role against route permission requirements before proceeding.',
        'Resource Ownership Checks: Services verify that Project Managers only modify projects they manage, and Team Members only update assigned tasks.',
        'Automatic Progress Recalculation: Whenever a task status is updated, the project\'s completion percentage is recalculated atomically in MongoDB.',
        'Security Headers & Rate Limiting: Helmet configures CSP and CORS, while express-rate-limit prevents brute-force attacks on auth and passkey verification.',
      ],
      technicalDecisions: [
        'Controller-Service-Repository Pattern: Separation of concerns keeps controllers clean and business logic reusable and testable.',
        'Server-Side Authorization Enforcement: Frontend hides buttons for UX, but backend validates all resource permissions on every request.',
        'Database-Level Filtering & Pagination: Queries use Mongoose indexes for high-speed paging instead of in-memory array slicing.',
        'Recalculated Progress Values: Storing project completion percentage on the Project document enables O(1) reads for dashboard queries.',
      ],
      deploymentArchitecture: {
        frontend: 'Vercel / Netlify with client-side SPA routing rewrites',
        backend: 'Render / Railway / AWS ECS with environment variables configured',
        database: 'MongoDB Atlas with IP access lists and SSL/TLS encrypted connections',
      },
      liveCredentials: {
        adminDemo: { email: 'admin@taskmanager.com', password: 'Password@123', role: 'Admin' },
        pmDemo: { email: 'pm@taskmanager.com', password: 'Password@123', role: 'Project Manager' },
        memberDemo: { email: 'alex@taskmanager.com', password: 'Password@123', role: 'Team Member' },
      },
    };
  }
}

module.exports = ExplanationService;
