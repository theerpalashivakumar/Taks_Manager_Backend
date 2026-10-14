require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');
const ApiResponse = require('./utils/apiResponse');
const ApiError = require('./utils/apiError');

const app = express();
app.set("trust proxy", 1);

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-explanation-token'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all requests
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  }, 'System is operating normally');
});

// Root friendly welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Project & Team Management System API is live.',
    documentation: '/api/project-explanation',
    health: '/api/health',
  });
});

// Mount modular API routes
app.use('/api', routes);

// 404 Catch-All Handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
