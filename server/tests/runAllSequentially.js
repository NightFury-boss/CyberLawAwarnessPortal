const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testsDir = path.join(__dirname);
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

console.log(`Starting execution of ${testFiles.length} test suites sequentially...\n`);

let passed = 0;
const failed = [];
const startTime = Date.now();

for (let i = 0; i < testFiles.length; i++) {
  const file = testFiles[i];
  const filePath = path.join(testsDir, file);
  process.stdout.write(`[${i + 1}/${testFiles.length}] Running ${file}... `);

  const startSingle = Date.now();
  const res = spawnSync(process.execPath, ['--test', filePath], {
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' }
  });
  const duration = Date.now() - startSingle;

  if (res.status === 0) {
    passed++;
    console.log(`PASS (${duration}ms)`);
  } else {
    failed.push({ file, stderr: res.stderr, stdout: res.stdout });
    console.log(`FAIL (${duration}ms)`);
    console.error(res.stdout || res.stderr);
  }
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`\n==================================================`);
console.log(`Result: ${passed}/${testFiles.length} passed in ${totalDuration}s`);
if (failed.length > 0) {
  console.log(`Failed files: ${failed.map(f => f.file).join(', ')}`);
  process.exit(1);
} else {
  console.log('ALL TEST SUITES PASSED CLEANLY.');
  process.exit(0);
}

