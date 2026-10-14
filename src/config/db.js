const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('your_mongodb_connection_string')) {
    console.warn(
      '\n⚠️ [MongoDB] MONGODB_URI is not configured in .env.\n' +
      'Please update your .env file with a valid MongoDB Atlas connection string.\n' +
      'Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/task_manager\n'
    );
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`✅ [MongoDB] Connected: ${conn.connection.host} (${conn.connection.name})`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB] Connection error: ${error.message}`);
    // Do not crash server in development if DB is not connected yet; allows health checks and UI inspection
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }
};

module.exports = connectDB;
