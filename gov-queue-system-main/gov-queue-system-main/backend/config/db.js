const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gov_queue_db';
    console.log(`[DB] Attempting connection to MongoDB at: ${mongoUri}`);
    
    // Attempt standard connection with 3-second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] Successfully connected to primary MongoDB server.`);
  } catch (err) {
    console.warn(`[DB] Primary MongoDB connection failed (${err.message}).`);
    console.log(`[DB] Launching standalone MongoMemoryServer for instant execution...`);
    
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Connected to In-Memory MongoDB Server at: ${memoryUri}`);
    } catch (memErr) {
      console.error(`[DB] Fatal error initializing MongoMemoryServer:`, memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
