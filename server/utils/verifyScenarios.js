const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
const MONGODB_URI = process.env.MONGODB_URI;

// Import actual models
const Scenario = require('../models/Scenario');
const { auditScenario } = require('../services/scenarioIntegrityService');

async function verify() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI, { family: 4 });
  console.log('Connected to MongoDB. Starting Scenario integrity audit using scenarioIntegrityService...');

  const scenarios = await Scenario.find({});
  let totalErrors = 0;

  for (let s of scenarios) {
    console.log(`\nAuditing Scenario: "${s.title}" (slug: ${s.slug}, code: ${s.code}, id: ${s._id})`);
    const auditResult = await auditScenario(s._id);
    
    if (!auditResult.valid) {
      console.error(`  [INVALID] Integrity checks failed:`);
      auditResult.errors.forEach(err => {
        console.error(`    - [ERROR] ${err}`);
        totalErrors++;
      });
    } else {
      console.log(`  [VALID] Pass basic structure audit.`);
    }

    if (auditResult.warnings.length > 0) {
      auditResult.warnings.forEach(warn => {
        console.warn(`    - [WARNING] ${warn}`);
      });
    }
  }

  console.log(`\nAudit Complete. Found ${totalErrors} critical errors.`);
  await mongoose.disconnect();
  
  if (totalErrors > 0) {
    process.exit(1);
  } else {
    console.log('✅ ALL SCENARIO DATABASE REFERENCE PATHS ARE INTEGRITY SAFE!');
    process.exit(0);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
