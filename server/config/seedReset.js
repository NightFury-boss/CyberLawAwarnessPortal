const seed = require('./seed');

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
