const { validateSeedExecutionTarget } = require('./seedSecurityGuard');
const { logSafeServerError } = require('../utils/apiErrorResponder');
const seed = require('./seed');

console.log('Verifying development environment safeguards...');
if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DB_RESET !== 'true') {
  console.error('\n=========================================');
  console.error('[DATABASE RESET SECURITY BLOCK]');
  console.error('Destructive database reset is ONLY allowed in a local development environment');
  console.error('and when ALLOW_DB_RESET=true is explicitly set.');
  console.error('Current Environment Configuration:');
  console.error(`- NODE_ENV: ${process.env.NODE_ENV || '<unset>'}`);
  console.error(`- ALLOW_DB_RESET: ${process.env.ALLOW_DB_RESET || '<unset>'}`);
  console.error('Action aborted safely.');
  console.error('=========================================\n');
  process.exit(1);
}

let targetCheck;
try {
  targetCheck = validateSeedExecutionTarget({ env: process.env, isReset: true, allowReset: true });
} catch (err) {
  logSafeServerError('[DATABASE RESET SECURITY BLOCK]', err);
  process.exit(1);
}

console.log(`Starting destructive database reset against local target: ${targetCheck.redactedUri}`);
seed(true)
  .then(() => {
    console.log('Database reset successfully completed.');
    process.exit(0);
  })
  .catch((err) => {
    logSafeServerError('[DATABASE RESET ERROR]', err);
    process.exit(1);
  });
