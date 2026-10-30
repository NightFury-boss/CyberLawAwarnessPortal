/**
 * Production Security & Configuration Validation Module
 * 
 * Enforces fail-closed validation for production deployments:
 * 1. Strong, high-entropy JWT_SECRET (minimum 32 characters, no known development placeholders).
 * 2. Explicitly configured trusted frontend origin (CLIENT_URL, rejecting localhost/loopback).
 * 3. Dynamic secret retrieval for testing and runtime isolation.
 */

const KNOWN_INSECURE_SECRETS = new Set([
  'cyber_portal_secret_key_12345',
  'change_this_secret_key_in_production_environments',
  'fallback_secret',
  'secret',
  'your_jwt_secret',
  'jwt_secret',
  'default_secret',
  'supersecret',
  'password'
]);

const DEV_FALLBACK_SECRET = 'cyber_portal_secret_key_12345';
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Validate JWT secret configuration
 * In production: Must be set, >= 32 chars, and not a known placeholder.
 * In development/test: Returns configured secret or DEV_FALLBACK_SECRET.
 * 
 * @param {Object} env - Environment object (defaults to process.env)
 * @returns {string} The validated JWT secret
 * @throws {Error} If production validation fails
 */
function validateJwtSecret(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const secret = env.JWT_SECRET ? env.JWT_SECRET.trim() : '';

  if (isProduction) {
    if (!secret) {
      throw new Error(
        '[FATAL SECURITY CONFIG] Production startup aborted: JWT_SECRET environment variable is missing or empty. ' +
        'Generate a strong random secret with: openssl rand -hex 32'
      );
    }

    if (KNOWN_INSECURE_SECRETS.has(secret.toLowerCase())) {
      throw new Error(
        '[FATAL SECURITY CONFIG] Production startup aborted: JWT_SECRET is set to an insecure default/sample placeholder. ' +
        'A unique, high-entropy secret must be provided.'
      );
    }

    if (secret.length < MIN_JWT_SECRET_LENGTH) {
      throw new Error(
        `[FATAL SECURITY CONFIG] Production startup aborted: JWT_SECRET is too short (${secret.length} chars). ` +
        `Minimum required length is ${MIN_JWT_SECRET_LENGTH} characters.`
      );
    }

    return secret;
  }

  // Non-production fallback
  return secret || DEV_FALLBACK_SECRET;
}

/**
 * Validate CLIENT_URL configuration
 * In production: Must be explicitly provided, must not be localhost or loopback.
 * In development/test: Returns configured URL or 'http://localhost:5173'.
 * 
 * @param {Object} env - Environment object (defaults to process.env)
 * @returns {string[]} Array of normalized allowed origins
 * @throws {Error} If production validation fails
 */
function validateClientUrl(env = process.env) {
  const isProduction = env.NODE_ENV === 'production';
  const rawUrl = env.CLIENT_URL ? env.CLIENT_URL.trim() : '';

  if (isProduction) {
    if (!rawUrl) {
      throw new Error(
        '[FATAL SECURITY CONFIG] Production startup aborted: CLIENT_URL environment variable is missing or empty. ' +
        'An explicit trusted origin (e.g. https://portal.example.com) is strictly required in production.'
      );
    }

    const origins = rawUrl.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);

    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        const hostname = parsed.hostname.toLowerCase();

        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) {
          throw new Error(
            `[FATAL SECURITY CONFIG] Production startup aborted: CLIENT_URL origin "${origin}" points to localhost or loopback.`
          );
        }

        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          throw new Error(
            `[FATAL SECURITY CONFIG] Production startup aborted: CLIENT_URL origin "${origin}" has an invalid protocol "${parsed.protocol}".`
          );
        }
      } catch (err) {
        if (err.message.includes('[FATAL SECURITY CONFIG]')) {
          throw err;
        }
        throw new Error(
          `[FATAL SECURITY CONFIG] Production startup aborted: CLIENT_URL contains invalid URL string "${origin}".`
        );
      }
    }

    return origins;
  }

  // Non-production default
  if (!rawUrl) {
    return ['http://localhost:5173'];
  }
  return rawUrl.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
}

/**
 * Comprehensive production configuration validation
 * 
 * @param {Object} env - Environment object (defaults to process.env)
 * @param {Object} options - Options { exitOnError: boolean }
 * @returns {{ jwtSecret: string, allowedOrigins: string[] }}
 */
function validateProductionConfig(env = process.env, options = { exitOnError: false }) {
  try {
    const jwtSecret = validateJwtSecret(env);
    const allowedOrigins = validateClientUrl(env);
    return { jwtSecret, allowedOrigins };
  } catch (error) {
    if (options.exitOnError) {
      console.error('\n=============================================================');
      console.error(error.message);
      console.error('=============================================================\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Dynamic getter for JWT_SECRET that always inspects current process.env
 */
function getJwtSecret() {
  return validateJwtSecret(process.env);
}

module.exports = {
  validateJwtSecret,
  validateClientUrl,
  validateProductionConfig,
  getJwtSecret,
  DEV_FALLBACK_SECRET,
  MIN_JWT_SECRET_LENGTH,
  KNOWN_INSECURE_SECRETS
};

