# Project & Team Management System - Backend API

> **Production-grade RESTful API built with Node.js, Express.js, MongoDB (Mongoose), JWT Authentication, Role-Based Access Control (RBAC), and dynamic reporting.**

---

## 1. Overview & Core Features

The backend server powers an enterprise Project & Team Management System. It enforces strict separation of concerns, multi-role security, real-time progress calculations, audit activity logs, and a dedicated password-protected project explanation endpoint.

### Key Capabilities:
- **Stateless JWT Authentication**: Secure user registration, login, logout, and token verification with bcrypt password hashing (10 salt rounds).
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across **Admin**, **Project Manager**, and **Team Member** roles with server-side resource-level authorization.
- **Project Lifecycle Management**: Full CRUD operations, status management (`Planning`, `Active`, `On Hold`, `Completed`), team assignment, and automatic progress percentage tracking.
- **Task Workflow & Collaboration**: Task priorities (`Low`, `Medium`, `High`, `Critical`), statuses (`To Do`, `In Progress`, `In Review`, `Done`), assignment, due date overdue detection, and threaded comments.
- **Database-Driven Dashboard**: High-performance MongoDB aggregation pipelines providing real-time KPI metrics, tasks grouped by status, overdue counts, and user workload.
- **Immutable Audit Logging**: Automatic tracking of project creations, status updates, team reassignments, task completions, and comments.
- **Password-Protected Project Explanation**: Secure endpoint verifying the access key `Secrate Key` with brute-force rate limiting and signed token issuance.

---

## 2. Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js (v18+)** | JavaScript runtime environment |
| **Express.js (v4.21)** | Fast, unopinionated REST API framework |
| **MongoDB & Mongoose (v8.9)** | Document database & Object Data Modeling with validation |
| **JSON Web Tokens (JWT)** | Stateless bearer token authentication |
| **bcrypt (v5.1)** | One-way salted password hashing |
| **express-rate-limit** | Brute-force & DDoS attack protection |
| **Helmet** | HTTP security headers |
| **CORS** | Cross-Origin Resource Sharing control |
| **dotenv** | Environment configuration management |
| **Node Native Test Runner** | Automated unit and integration testing |

---

## 3. Project Directory Structure

```
Task_Manager_Backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Resilient MongoDB Atlas connection handler
│   ├── constants/
│   │   ├── roles.js              # System user roles (ADMIN, PM, TEAM_MEMBER)
│   │   ├── statuses.js           # Project and task status & priority definitions
│   │   └── activityTypes.js      # Audit log action identifiers
│   ├── models/
│   │   ├── User.js               # User schema with pre-save bcrypt hook & comparePassword
│   │   ├── Project.js            # Project schema with status, members, and progress
│   │   ├── Task.js               # Task schema with priority, status, and due dates
│   │   ├── TaskComment.js        # Chronological comments schema
│   │   └── ActivityLog.js        # Audit trail schema
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Bearer token verification and req.user attachment
│   │   ├── roleMiddleware.js     # Role enforcement guard
│   │   ├── rateLimiter.js        # API, auth, and explanation rate limiters
│   │   └── errorHandler.js       # Centralized error handler converting exceptions to standard JSON
│   ├── validators/
│   │   ├── authValidators.js     # Registration and login field validation
│   │   ├── projectValidators.js  # Project creation/update constraints
│   │   └── taskValidators.js     # Task creation/status/comment validation
│   ├── services/
│   │   ├── authService.js        # User auth business logic
│   │   ├── projectService.js     # Project operations, membership, progress calculations
│   │   ├── taskService.js        # Task lifecycle, filters, search, pagination, comments
│   │   ├── dashboardService.js   # MongoDB aggregation pipelines for metrics
│   │   ├── activityService.js    # Audit log creation and retrieval
│   │   └── explanationService.js # Secure password verification & architecture documentation
│   ├── controllers/
│   │   ├── authController.js     # Auth request dispatchers
│   │   ├── userController.js     # User management dispatchers
│   │   ├── projectController.js  # Project request dispatchers
│   │   ├── taskController.js     # Task request dispatchers
│   │   ├── dashboardController.js# Dashboard KPIs request dispatchers
│   │   └── explanationController.js # Project explanation dispatchers
│   ├── routes/
│   │   ├── index.js              # Main API router mounting all modules
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── userRoutes.js         # /api/users
│   │   ├── projectRoutes.js      # /api/projects
│   │   ├── taskRoutes.js         # /api/tasks
│   │   ├── dashboardRoutes.js    # /api/dashboard
│   │   └── explanationRoutes.js  # /api/project-explanation
│   ├── utils/
│   │   ├── apiResponse.js        # Consistent JSON response envelope
│   │   ├── apiError.js           # Custom operational error class
│   │   └── tokenUtils.js         # JWT signing & verification helpers
│   ├── seed/
│   │   └── seedData.js           # Demo database seeder
│   ├── app.js                    # Express app configuration & middleware pipeline
│   └── server.js                 # HTTP listener with graceful shutdown
├── tests/
│   ├── auth_and_explanation.test.js
│   └── rbac_and_validation.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Prerequisites & Installation

### Prerequisites:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)

### Installation Steps:
```bash
# 1. Navigate to backend directory
cd Task_Manager_Backend

# 2. Install dependencies
npm install

# 3. Create your local .env file
cp .env.example .env
```

---

## 5. Environment Variables Configuration

Configure your `.env` file according to the template in `.env.example`:

```env
# Database Connection (MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/task_manager?retryWrites=true&w=majority

# Authentication Configuration
JWT_SECRET=your_super_secret_random_jwt_key_here_minimum_32_characters
JWT_EXPIRES_IN=1d

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Password-Protected Project Explanation Feature
PROJECT_VIEW_PASSWORD=Personal_key
```

> **Security Note:** Never commit your `.env` file to version control. It is already added to `.gitignore`.

---

## 6. MongoDB Atlas Setup Guide

1. Sign up for a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (e.g. M0).
3. Under **Database Access**, create a database user with read and write permissions (e.g. `dbAdmin` and a secure password).
4. Under **Network Access**, add an IP Access List entry. For development/cloud deployment, select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers** -> Copy the connection string.
6. Replace `<password>` with your database user password and paste into `.env` as `MONGODB_URI`.

---

## 7. Database Models & Schema Relationships

```
+--------------------+            +------------------------+
|       User         |            |        Project         |
+--------------------+            +------------------------+
| _id: ObjectId      |<-----------| projectManager: Ref    |
| name: String       |<===========| members: [Ref]         |
| email: String (UQ) |<-----------| createdBy: Ref         |
| password: Hash     |            | status: Enum           |
| role: Enum         |            | completionPct: Number  |
| isActive: Boolean  |            +------------------------+
+--------------------+                        |
          ^                                   |
          |                                   |
          | 1:N Assigned                      | 1:N
          v                                   v
+--------------------+            +------------------------+
|       Task         |----------->|      TaskComment       |
+--------------------+            +------------------------+
| _id: ObjectId      |<-----------| task: Ref              |
| project: Ref       |            | author: Ref (User)     |
| assignedTo: Ref    |            | comment: String        |
| priority: Enum     |            +------------------------+
| status: Enum       |
| dueDate: Date      |
+--------------------+
          |
          v
+--------------------+
|    ActivityLog     |
+--------------------+
| action: Enum       |
| project: Ref       |
| task: Ref          |
| performedBy: Ref   |
| details: String    |
+--------------------+
```

---

## 8. Role-Based Access Control (RBAC) Matrix

| Operation | Admin | Project Manager | Team Member | Public |
| :--- | :---: | :---: | :---: | :---: |
| Register / Login / View Me | Yes | Yes | Yes | Yes |
| Password-Protected Explanation (`Personal_key`) | Yes | Yes | Yes | Yes (with pass) |
| Manage Users (Roles & Activation) | Yes | No | No | No |
| View Organization Directory | Yes | Yes | Yes | No |
| Create Project | Yes | Yes | No | No |
| Update Project / Manage Members | Yes | Authorized PM Only | No | No |
| Delete / Archive Project | Yes | Authorized PM Only | No | No |
| View Project Details | Yes | Authorized PM/Members | Assigned Members Only | No |
| Create Task / Assign Team Member | Yes | Authorized PM Only | No | No |
| Update Task Details / Deadline / Priority | Yes | Authorized PM Only | No | No |
| Update Task Status (Todo -> In Progress -> Done) | Yes | Authorized PM Only | Assigned Member Only | No |
| Delete Task | Yes | Authorized PM Only | No | No |
| Post Task Comment | Yes | Authorized PM/Members | Assigned Members Only | No |
| Organization-Wide Dashboard Metrics | Yes | Authorized Projects | Assigned Tasks Only | No |

---

## 9. API Documentation & Endpoint Reference

Standard Response Format:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 45, "totalPages": 5 }
}
```

### 9.1 Authentication (`/api/auth`)

#### Register User
- **Method:** `POST /api/auth/register`
- **Body:**
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "password": "Password@123",
    "role": "team_member"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
      "user": { "id": "660...", "name": "Alex Rivera", "email": "alex@example.com", "role": "team_member" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### Login User
- **Method:** `POST /api/auth/login`
- **Body:**
  ```json
  {
    "email": "alex@example.com",
    "password": "Password@123"
  }
  ```

#### Get Current User Profile
- **Method:** `GET /api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

---

### 9.2 Projects (`/api/projects`)

- `GET /api/projects?search=cloud&status=Active&page=1&limit=10` — List authorized projects with DB search and pagination.
- `POST /api/projects` — Create project.
- `GET /api/projects/:id` — Get project details with live member metrics.
- `PATCH /api/projects/:id` — Update project metadata.
- `PATCH /api/projects/:id/members` — Add/remove team members.
  ```json
  {
    "addMembers": ["660d..."],
    "removeMembers": []
  }
  ```
- `PATCH /api/projects/:id/archive` — Toggle project archive state.
- `DELETE /api/projects/:id` — Delete project and cascade tasks.
- `GET /api/projects/:id/activity` — Get project audit history.

---

### 9.3 Tasks (`/api/tasks`)

- `GET /api/tasks?project=660...&status=In%20Progress&priority=High&isOverdue=true&page=1` — Query tasks with multidimensional filters.
- `POST /api/tasks` — Create task within project.
  ```json
  {
    "title": "Build Authentication Middleware",
    "description": "Implement JWT and RBAC guards",
    "project": "660...",
    "assignedTo": "660...",
    "priority": "High",
    "status": "To Do",
    "dueDate": "2026-11-01"
  }
  ```
- `PATCH /api/tasks/:id` — Update task details (Admin/PM).
- `PATCH /api/tasks/:id/status` — Update task status only (Assignable by Admin, PM, or assigned Team Member).
  ```json
  { "status": "In Progress" }
  ```
- `DELETE /api/tasks/:id` — Delete task.
- `POST /api/tasks/:id/comments` — Post comment.
- `GET /api/tasks/:id/comments` — Get comments chronologically.

---

### 9.4 Dashboard (`/api/dashboard`)

- `GET /api/dashboard/summary` — Retrieves real MongoDB aggregated metrics:
  - Total projects, active projects, completed projects, average completion %
  - Total tasks, count grouped by status (`To Do`, `In Progress`, `In Review`, `Done`)
  - Overdue tasks count
  - My pending assigned tasks count
  - Upcoming tasks approaching deadline

---

### 9.5 Password-Protected Project Explanation (`/api/project-explanation`)

- `POST /api/project-explanation/verify`
  - **Body:** `{ "password": "Personal_key" }`
  - **Response:** Returns a signed short-lived verification token.
  - Protected with strict rate limiting against brute-force attacks.
- `GET /api/project-explanation/content`
  - **Headers:** `x-explanation-token: <verified-token>`
  - Returns complete system architecture documentation for recruiters and technical evaluators.

---

## 10. Database Seeding & Demo Accounts

Once your `MONGODB_URI` is placed into `.env`, run:

```bash
npm run seed
```

This populates realistic demo accounts and projects:
- **Admin**: `admin@taskmanager.com` / `Password@123`
- **Project Manager**: `pm@taskmanager.com` / `Password@123`
- **Team Member 1**: `alex@taskmanager.com` / `Password@123`
- **Team Member 2**: `priya@taskmanager.com` / `Password@123`
- **View Project Password**: `Personal_key`

---

## 11. Automated Testing

Run the test suite using Node.js's built-in test runner:

```bash
npm test
```

### Tested Workflows:
1. Token generation, claims encoding, and invalid signature rejection.
2. Project explanation password verification with `Personal_key` and rejection of incorrect passwords.
3. Access token requirement for viewing explanation architecture payload.
4. Domain enums validation (roles, project statuses, task priorities, task statuses).
5. Role-Based Access Control (Admin global access, Project Manager scoped access, Team Member restrictions, outsider rejection).

---

## 12. Deployment Guide (Node.js Hosting)

### Deploying to Render / Railway:
1. Push code to GitHub repository `project-team-management-backend`.
2. Create a new **Web Service** pointing to the repository.
3. Set the **Root Directory** to `Task_Manager_Backend` (or root if standalone repo).
4. **Build Command**: `npm install`
5. **Start Command**: `npm start`
6. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN=1d`
   - `PORT=5000`
   - `CLIENT_URL=https://your-frontend-app.vercel.app`
   - `PROJECT_VIEW_PASSWORD=Personal_key`
   - `NODE_ENV=production`

---

## 13. Git Repository Push Commands

To publish this backend into its own independent GitHub repository:

```bash
cd Task_Manager_Backend
git init
git add .
git commit -m "feat: complete production-ready project & team management backend"
git branch -M main
git remote add origin https://github.com/<your-username>/project-team-management-backend.git
git push -u origin main
```
