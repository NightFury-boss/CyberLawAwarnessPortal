/**
 * Rate Limiting Middleware
 * 
 * Provides memory-efficient sliding/fixed-window rate limiting for sensitive endpoints
 * (authentication and AI assistant).
 * 
 * ARCHITECTURAL NOTE:
 * This limiter maintains state in-memory per Node.js process. In single-instance
 * deployments, this provides robust, low-latency protection against brute-force attacks
 * and resource exhaustion without requiring external services.
 * In a multi-node horizontal deployment behind a load balancer, a distributed store
 * (e.g. Redis) should back this limiter instead of local process memory.
 */

function defaultKeyGenerator(req) {
  // Respect express trust proxy setting if configured
  return req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'global';
}

/**
 * Creates an in-memory rate limiting middleware instance
 * 
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests allowed in window
 * @param {string} options.message - Error message returned on 429
 * @param {Function} [options.keyGenerator] - Custom key derivation function
 * @returns {Function} Express middleware with .reset() and .getStore() methods
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const max = options.max || 60;
  const message = options.message || 'Too many requests, please try again later.';
  const keyGenerator = options.keyGenerator || defaultKeyGenerator;

  // Key -> { count: number, resetTime: number }
  const store = new Map();

  // Periodic sweeper to avoid unbounded memory growth
  const sweepInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now >= record.resetTime) {
        store.delete(key);
      }
    }
  }, Math.max(30000, windowMs));

  // Allow Node to exit cleanly without waiting on this background timer
  if (sweepInterval.unref) {
    sweepInterval.unref();
  }

  function rateLimiter(req, res, next) {
    if (process.env.DISABLE_RATE_LIMITING === 'true') {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = store.get(key);
    if (!record || now >= record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil(record.resetTime / 1000);
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', remaining);
    res.setHeader('RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message
        }
      });
    }

    next();
  }

  // Reset store for deterministic testing
  rateLimiter.reset = () => {
    store.clear();
  };

  rateLimiter.getStore = () => store;

  return rateLimiter;
}

// Pre-configured rate limiters with environment overrides
const authLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 20,                         // 20 requests per 15 min
  message: 'Too many authentication attempts. Please try again later.'
});

const assistantLimiter = createRateLimiter({
  windowMs: Number(process.env.RATE_LIMIT_ASSISTANT_WINDOW_MS) || 60 * 1000, // 1 minute
  max: Number(process.env.RATE_LIMIT_ASSISTANT_MAX) || 30,                     // 30 requests per minute
  message: 'Too many assistant queries. Please wait a moment before asking another question.'
});

module.exports = {
  createRateLimiter,
  authLimiter,
  assistantLimiter
};

