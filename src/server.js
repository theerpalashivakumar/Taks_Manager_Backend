const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP Server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 [Server] Server running on http://localhost:${PORT}`);
    console.log(`📡 [Environment] ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 [Auth Ready] JWT and RBAC protection activated\n`);
  });

  // Handle graceful shutdown
  const handleExit = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('💤 HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleExit('SIGTERM'));
  process.on('SIGINT', () => handleExit('SIGINT'));

  process.on('unhandledRejection', (err) => {
    console.error('💥 Unhandled Rejection:', err);
  });

  process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    process.exit(1);
  });
};

startServer();
