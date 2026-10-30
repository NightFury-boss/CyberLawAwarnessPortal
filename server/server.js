const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { validateProductionConfig, validateClientUrl } = require('./config/productionSecurity');

// Fail-closed validation for production startup
if (process.env.NODE_ENV === 'production') {
  validateProductionConfig(process.env, { exitOnError: require.main === module });
}

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

// Trust reverse proxy (e.g. Nginx, Cloudflare, ALB) for accurate IP resolution and HTTPS detection
const trustProxyConfig = process.env.TRUST_PROXY || '1';
app.set('trust proxy', trustProxyConfig === 'true' ? true : (!isNaN(Number(trustProxyConfig)) ? Number(trustProxyConfig) : trustProxyConfig));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HSTS: Only emit over secure HTTPS connections in production
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  if (process.env.NODE_ENV === 'production' && isHttps) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Production-aware CORS configuration
const allowedOrigins = validateClientUrl(process.env);
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }
        const normalized = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(normalized)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy: Origin not allowed'));
        }
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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

// Root informational route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Cyber Law Awareness Portal Backend API',
    frontend: process.env.CLIENT_URL || 'http://localhost:5173',
    health: '/api/health'
  });
});

// Root test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware to prevent raw stack trace exposure
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_FORBIDDEN',
        message: err.message
      }
    });
  }
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
