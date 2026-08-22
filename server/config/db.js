const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

// Helper to safely obfuscate connection string secrets for logging
const getObfuscatedURI = (uri) => {
  try {
    if (uri.includes('@')) {
      const parts = uri.split('@');
      const credentialPart = parts[0];
      const hostPart = parts[1];
      const protocol = credentialPart.split('://')[0];
      return `${protocol}://****:****@${hostPart}`;
    }
  } catch (e) {}
  return uri;
};

const connectDB = async () => {
  console.log(`[Database] Attempting connection to target host: ${getObfuscatedURI(MONGODB_URI)}`);

  // Event Listeners for robust monitoring
  mongoose.connection.on('connected', () => {
    console.log('[Database] Mongoose successfully connected to DB cluster.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Mongoose runtime connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection lost/disconnected.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] Mongoose successfully reconnected to the cluster.');
  });

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      family: 4 // Force IPv4 resolution to prevent DNS issues on modern dual-stack networks
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('\n=========================================');
    console.error('[DATABASE CONNECTION CRITICAL FAILURE]');
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Stack: ${error.stack}`);
    console.error('-----------------------------------------');
    console.error('TROUBLESHOOTING CHECKLIST:');
    console.error('1. Whitelist Current IP: Ensure your IP is added to the Network Access whitelist in MongoDB Atlas.');
    console.error('2. Open Port 27017: Ensure outgoing port 27017 is not blocked by local firewalls or VPNs.');
    console.error('3. Check URI: Ensure the MONGODB_URI in server/.env is fully correct and contains the correct user password.');
    console.error('4. Check Local Mongo: If running locally, make sure the mongod service is running.');
    console.error('=========================================\n');
    process.exit(1);
  }
};

module.exports = connectDB;
