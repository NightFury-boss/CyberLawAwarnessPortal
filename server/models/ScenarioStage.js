const mongoose = require('mongoose');

const ScenarioStageSchema = new mongoose.Schema({
  scenarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scenario',
    required: true
  },
  stageOrder: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  mockInterfaceType: {
    type: String,
    enum: ['email', 'sms', 'messaging', 'website', 'account-verification', 'checkout', 'qr_code', 'notification', 'browser', 'phone_call', 'chat', 'password_form'],
    required: true
  },
  mockInterfaceData: {
    type: mongoose.Schema.Types.Mixed // stores specific email or chat properties
  },
  eventClassification: {
    type: String,
    enum: ['legitimate', 'malicious', 'ambiguous'],
    default: 'malicious'
  },
  availableDecisionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScenarioDecision'
    }
  ],
  terminal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ScenarioStage', ScenarioStageSchema);
