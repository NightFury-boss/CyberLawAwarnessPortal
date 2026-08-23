const seed = require('./seed');

console.log('Verifying development environment safeguards...');
if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_DB_RESET !== 'true') {
  console.error('\n=========================================');
  console.error('[DATABASE RESET SECURITY BLOCK]');
  console.error('Destructive database reset is ONLY allowed in a development environment');
  console.error('and when ALLOW_DB_RESET=true is explicitly set in .env.');
  console.error('Current Environment Configuration:');
  console.error(`- NODE_ENV: ${process.env.NODE_ENV}`);
  console.error(`- ALLOW_DB_RESET: ${process.env.ALLOW_DB_RESET}`);
  console.error('Action aborted safely.');
  console.error('=========================================\n');
  process.exit(1);
}

console.log('Starting destructive database reset...');
seed(true)
  .then(() => {
    console.log('Database reset successfully completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error during database reset:', err);
    process.exit(1);
  });
