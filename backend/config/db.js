const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/account-management-system';

    if (!process.env.MONGO_URI) {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('✅ MongoDB connected to in-memory server');
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);

    if (!process.env.MONGO_URI) {
      try {
        mongoMemoryServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoMemoryServer.getUri());
        console.log('✅ Fallback to in-memory MongoDB server succeeded');
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback MongoDB connection failed:', fallbackError.message);
      }
    }

    throw error;
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
