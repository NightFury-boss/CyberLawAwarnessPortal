const mongoose = require('mongoose');

const AssessmentDecisionSchema = new mongoose.Schema({
  assessmentSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AssessmentSession',
    required: true
  },
  stageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScenarioStage',
    required: true
  },
  decisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScenarioDecision',
    required: true
  },
  selectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique key to prevent replaying/submitting multiple decisions for the same stage in a session
AssessmentDecisionSchema.index({ assessmentSessionId: 1, stageId: 1 }, { unique: true });

module.exports = mongoose.model('AssessmentDecision', AssessmentDecisionSchema);
