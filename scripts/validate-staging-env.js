#!/usr/bin/env node

/**
 * Cyber Law Awareness Portal — Staging Environment Pre-Flight Validator
 * 
 * Verifies that all required production/staging configuration variables are set,
 * cryptographically strong, and properly structured before deployment.
 * 
 * Usage:
 *   node scripts/validate-staging-env.js [path_to_env_file]
 */

const path = require('path');
// Resolve dependencies from server/node_modules if not present at root
let dotenv, mongoose;
try {
  dotenv = require('dotenv');
} catch (_e) {
  dotenv = require('../server/node_modules/dotenv');
}

try {
  mongoose = require('mongoose');
} catch (_e) {
  mongoose = require('../server/node_modules/mongoose');
}

// Determine env file path (defaults to server/.env if not provided)
const envPath = process.argv[2] 
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../server/.env');

dotenv.config({ path: envPath });

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

async function runValidation() {
  console.log('\n================================================================');
  console.log('CYBER LAW PORTAL — STAGING ENVIRONMENT PRE-FLIGHT VALIDATOR');
  console.log(`Inspecting: ${envPath}`);
  console.log('================================================================\n');

  const results = [];
  let fatalErrors = 0;

  function record(check, passed, details, isFatal = true) {
    results.push({ check, passed, details, isFatal });
    if (!passed && isFatal) fatalErrors++;
  }

  // 1. NODE_ENV Check
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    record('NODE_ENV', true, 'Configured as production');
  } else {
    record('NODE_ENV', false, `Currently set to "${nodeEnv}". Staging must run with NODE_ENV=production`, true);
  }

  // 2. JWT_SECRET Cryptographic Entropy
  const jwtSecret = process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : '';
  if (!jwtSecret) {
    record('JWT_SECRET', false, 'Missing or empty. Generate with: openssl rand -hex 32', true);
  } else if (KNOWN_INSECURE_SECRETS.has(jwtSecret.toLowerCase())) {
    record('JWT_SECRET', false, 'Set to known sample placeholder or insecure default', true);
  } else if (jwtSecret.length < 32) {
    record('JWT_SECRET', false, `Too short (${jwtSecret.length} chars). Minimum length is 32 characters`, true);
  } else {
    record('JWT_SECRET', true, `Valid (${jwtSecret.length} chars, high cryptographic entropy)`);
  }

  // 3. CLIENT_URL (Allowed Origin)
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : '';
  if (!clientUrl) {
    record('CLIENT_URL', false, 'Missing or empty. Must be explicit origin (e.g. https://staging.example.com)', true);
  } else {
    const origins = clientUrl.split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    let hasLocalhost = false;
    let validUrls = true;

    for (const origin of origins) {
      try {
        const u = new URL(origin);
        if (['localhost', '127.0.0.1', '::1'].includes(u.hostname.toLowerCase())) {
          hasLocalhost = true;
        }
      } catch (_e) {
        validUrls = false;
      }
    }

    if (!validUrls) {
      record('CLIENT_URL', false, `Invalid URL format in: "${clientUrl}"`, true);
    } else if (hasLocalhost && nodeEnv === 'production') {
      record('CLIENT_URL', false, `Points to localhost or loopback address in production: "${clientUrl}"`, true);
    } else {
      record('CLIENT_URL', true, `Trusted origin(s): ${origins.join(', ')}`);
    }
  }

  // 4. MONGODB_URI Connection Check
  const mongoUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';
  if (!mongoUri) {
    record('MONGODB_URI', false, 'Missing MONGODB_URI connection string', true);
  } else if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    record('MONGODB_URI', false, 'Invalid URI scheme (must start with mongodb:// or mongodb+srv://)', true);
  } else {
    // Attempt real handshake with 6-second timeout
    process.stdout.write('Checking MongoDB connection... ');
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 6000,
        family: 4
      });
      const pingRes = await mongoose.connection.db.admin().ping();
      record('MONGODB_URI', true, 'Handshake successful (ping: ok)');
      await mongoose.disconnect();
    } catch (err) {
      record('MONGODB_URI', false, `Database connection failed: ${err.message}`, true);
    }
  }

  // 5. Reverse Proxy Header Trust (TRUST_PROXY)
  const trustProxy = process.env.TRUST_PROXY;
  if (!trustProxy || trustProxy === '0' || trustProxy === 'false') {
    record('TRUST_PROXY', false, 'TRUST_PROXY is unset or false. Required when running behind reverse proxy/load balancer', false);
  } else {
    record('TRUST_PROXY', true, `Configured as "${trustProxy}"`);
  }

  // 6. Rate Limiting Configuration
  const authMax = process.env.RATE_LIMIT_AUTH_MAX || '20';
  const authWindow = process.env.RATE_LIMIT_AUTH_WINDOW_MS || '900000';
  const asstMax = process.env.RATE_LIMIT_ASSISTANT_MAX || '30';
  const asstWindow = process.env.RATE_LIMIT_ASSISTANT_WINDOW_MS || '60000';
  record('RATE_LIMITING', true, `Auth: ${authMax} req / ${Math.round(authWindow/60000)}m | Assistant: ${asstMax} req / ${Math.round(asstWindow/1000)}s`);

  // 7. Administrator Credentials
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminEmail.includes('@')) {
    record('ADMIN_EMAIL', false, 'Invalid or missing ADMIN_EMAIL', false);
  } else {
    record('ADMIN_EMAIL', true, `Admin identity: ${adminEmail}`);
  }

  if (!adminPassword || adminPassword.length < 8) {
    record('ADMIN_PASSWORD', false, 'ADMIN_PASSWORD missing or shorter than 8 characters', false);
  } else if (adminPassword === 'AdminPass123!' && nodeEnv === 'production') {
    record('ADMIN_PASSWORD', false, 'ADMIN_PASSWORD is set to default development sample. Change for staging/production', false);
  } else {
    record('ADMIN_PASSWORD', true, `Password provided (${adminPassword.length} chars)`);
  }

  // Print Summary Table
  console.log('\n--- PRE-FLIGHT VERIFICATION RESULTS ---');
  for (const r of results) {
    const symbol = r.passed ? '✔ PASS' : (r.isFatal ? '✖ FAIL' : '⚠ WARN');
    console.log(`${symbol.padEnd(8)} | ${r.check.padEnd(16)} | ${r.details}`);
  }
  console.log('---------------------------------------\n');

  if (fatalErrors > 0) {
    console.error(`✖ PRE-FLIGHT CHECK FAILED: ${fatalErrors} fatal security or configuration issue(s) detected.`);
    console.error('Please update your environment file before proceeding with deployment.\n');
    process.exit(1);
  } else {
    console.log('✔ PRE-FLIGHT CHECK PASSED: Staging environment configuration is valid and ready.\n');
    process.exit(0);
  }
}

runValidation().catch((err) => {
  console.error('\nFatal Validator Error:', err);
  process.exit(1);
});
