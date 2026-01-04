const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campzone_chat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  Error connecting to MongoDB: ${error.message}`);
    console.error(`⚠️  Server will continue running, but chat features require MongoDB`);
    console.error(`⚠️  Please start MongoDB and restart the server for full functionality`);
    // Don't exit - allow server to run without MongoDB for testing
  }
};

module.exports = connectDB;

