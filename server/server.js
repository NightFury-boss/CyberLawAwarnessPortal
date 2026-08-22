const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const authRoutes = require('./routes/auth');
const lawRoutes = require('./routes/laws');
const crimeRoutes = require('./routes/crimes');
const quizRoutes = require('./routes/quizzes');
const simulationRoutes = require('./routes/simulations');
const progressRoutes = require('./routes/progress');
const adminRoutes = require('./routes/admin');
const assistantRoutes = require('./routes/assistant');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/laws', lawRoutes);
app.use('/api/crimes', crimeRoutes); // Contains crimes, cases, resources
app.use('/api/quizzes', quizRoutes);
app.use('/api/assessments', simulationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);

// Root test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware to prevent raw stack trace exposure
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An internal server error occurred'
    }
  });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;

// Process-level monitors for uncaught errors and rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] Promise:', promise, 'Reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception] Critical Error:', err);
  process.exit(1);
});
