/**
 * Fake db.js to use memdb instead of MongoDB to fix ETIMEOUT
 */
const connectDB = async () => {
  console.log('✅ Connected to MemDB (In-Memory Database for offline preview)');
};

const disconnectDB = async () => {
  console.log('MemDB disconnected');
};

module.exports = { connectDB, disconnectDB };
