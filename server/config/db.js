const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cyber_law_portal';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Please ensure MongoDB is running locally or provide a MONGODB_URI in your .env file.');
    process.exit(1);
  }
};

module.exports = connectDB;
