const mongoose = require('../server/node_modules/mongoose');
const path = require('path');
require('../server/node_modules/dotenv').config({ path: path.join(__dirname, '../server/.env') });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const AssessmentDecision = require('../server/models/AssessmentDecision');
  const AssessmentSession = require('../server/models/AssessmentSession');
  const allDecisions = await AssessmentDecision.find({}, 'assessmentSessionId').lean();
  const sessionIds = [...new Set(allDecisions.map(d => d.assessmentSessionId.toString()))];
  const existingSessions = await AssessmentSession.find({ _id: { $in: sessionIds } }, '_id').lean();
  const existingSessionSet = new Set(existingSessions.map(s => s._id.toString()));
  const orphanedDecisions = allDecisions.filter(d => !existingSessionSet.has(d.assessmentSessionId.toString()));
  console.log('Total decisions:', allDecisions.length);
  console.log('Orphaned count:', orphanedDecisions.length);
  if (orphanedDecisions.length > 0) {
    console.log('Sample orphaned session IDs:', orphanedDecisions.slice(0, 5).map(d => d.assessmentSessionId));
  }
  await mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
