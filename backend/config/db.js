const mongoose = require('mongoose');

let isConnected = false;
let activeUri = '';

/**
 * Connect to MongoDB (Atlas or Local MongoDB)
 */
const connectDB = async () => {
  const envUri = process.env.MONGO_URI;

  // 1. Try remote MongoDB Atlas
  if (envUri && envUri.trim() && !envUri.includes('127.0.0.1') && !envUri.includes('localhost') && envUri !== 'memory') {
    try {
      console.log(`📡 Connecting to MongoDB Atlas (${envUri.split('@').pop() || 'Cluster'})...`);
      const conn = await mongoose.connect(envUri.trim(), {
        serverSelectionTimeoutMS: 6000,
        family: 4
      });
      isConnected = true;
      activeUri = envUri;
      console.log(`🍃 Connected to MongoDB Atlas: ${conn.connection.host} / ${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`⚠️  MongoDB Atlas IP Access Notice: ${err.message}`);
      console.warn(`💡 TIP: If you see "IP that isn't whitelisted", please add 0.0.0.0/0 in MongoDB Atlas -> Network Access.`);
    }
  }

  // 2. Try Local MongoDB on port 27017
  try {
    const localUri = 'mongodb://127.0.0.1:27017/recruitx';
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
      family: 4
    });
    isConnected = true;
    activeUri = localUri;
    console.log(`🍃 Connected to Local MongoDB on 127.0.0.1:27017`);
    return conn;
  } catch (localErr) {
    // Local MongoDB daemon not active
  }

  console.log(`⚡ MongoDB is standing by. Waiting for Atlas IP Whitelist or Local MongoDB on port 27017.`);
  isConnected = false;
  activeUri = 'standing-by';
};

const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected successfully');
  }
};

const getDBStatus = () => ({
  isConnected,
  type: isConnected ? (activeUri.includes('mongodb.net') ? 'MongoDB Atlas (Cloud Cluster)' : 'Local MongoDB (127.0.0.1:27017)') : 'Awaiting Atlas IP Whitelist / Active Connection',
  uri: isConnected ? (activeUri.includes('@') ? activeUri.split('@')[1] : activeUri) : 'mongodb.net'
});

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
  isMongoConnected: () => isConnected
};
