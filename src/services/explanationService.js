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
        'Small-to-medium organizations frequently struggle with fragmented task tracking, unmonitored team bandwidth, lack of audit trails, and insecure permission leaks. This system solves these issues with real-time progress calculations, role-based resource protection, and unified reporting.',
      techStack: {
        frontend: [
          'React 18/19 with Vite for ultra-fast bundling and HMR',
          'Tailwind CSS for responsive, accessible, polished UI components',
          'Redux Toolkit (RTK) for centralized state management',
          'React Router DOM v6 for client-side routing & route guards',
          'Axios with interceptors for JWT injection and unified error handling',
          'Lucide React for crisp modern icons',
        ],
        backend: [
          'Node.js & Express.js REST API with modular Controller-Service architecture',
          'MongoDB & Mongoose ODM for resilient document schemas and indexing',
          'JSON Web Tokens (JWT) for stateless, secure user authentication',
          'bcrypt with 10 salt rounds for secure password hashing',
          'express-rate-limit to protect against brute-force attacks',
          'helmet for HTTP security headers and CORS protection',
          'Centralized error handling and operational logging',
        ],
      },
      rolesAndPermissions: [
        {
          role: 'Admin',
          scope: 'Organization-wide supervision',
          permissions: [
            'Full control over all users: activate/deactivate, role modifications',
            'Full project management: create, update, delete, archive, assign PM and members',
            'Full task control: assign, reassign, update status, priorities, deadlines',
            'Global dashboard metrics across the entire database',
          ],
        },
        {
          role: 'Project Manager',
          scope: 'Authorized project scope',
          permissions: [
            'Create projects and manage projects where assigned as Project Manager',
            'Assign and remove team members from authorized projects',
            'Create, update, assign, and delete tasks within their projects',
            'View audit logs and track project completion percentages',
          ],
        },
        {
          role: 'Team Member',
          scope: 'Assigned work scope',
          permissions: [
            'View projects where they are an active member',
            'View tasks assigned to them or their active projects',
            'Update the status of their assigned tasks (To Do -> In Progress -> Done)',
            'Post comments and collaborate on tasks',
          ],
        },
      ],
      architectureHighlights: [
        'DRY & Modular: Separation of Controllers, Services, Models, and Middlewares prevents code duplication.',
        'Dynamic Progress Calculation: Projects automatically recalculate completion percentage whenever a task status changes.',
        'Database-Backed Pagination & Filtering: All queries use Mongoose indexes for fast, scalable searching and sorting.',
        'Audit Logging: Immutable activity records log every critical action with server-verified user identity.',
        'Zero-Leak Security: Passwords stripped from responses, rate limiters on sensitive endpoints, and protected architecture views.',
      ],
      deploymentArchitecture: {
        frontend: 'Vercel / Netlify with client-side SPA redirect rewrites',
        backend: 'Render / Railway / AWS ECS with environment variables configured',
        database: 'MongoDB Atlas with IP access lists and encrypted connections',
      },
      liveCredentials: {
        adminDemo: { email: 'admin@taskmanager.com', password: 'Password@123' },
        pmDemo: { email: 'pm@taskmanager.com', password: 'Password@123' },
        memberDemo: { email: 'member@taskmanager.com', password: 'Password@123' },
      },
    };
  }
}

module.exports = ExplanationService;
