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
    type: mongoose.Schema.Types.Mixed
  },
  eventClassification: {
    type: String,
    enum: ['legitimate', 'malicious', 'ambiguous'],
    default: 'malicious'
  },
  measurementFocus: [
    {
      type: String,
      enum: [
        'THREAT_RECOGNITION',
        'SIGNAL_IDENTIFICATION',
        'VERIFICATION',
        'DECISION_QUALITY',
        'FALSE_POSITIVE_CONTROL',
        'UNREVIEWED_ACCEPTANCE'
      ]
    }
  ],
  targetSignals: [
    {
      type: String,
      enum: [
        'unexpected_domain',
        'urgency',
        'unexpected_payment_request',
        'unusual_permission',
        'authority_impersonation',
        'unexpected_attachment',
        'unusual_contact_method',
        'unrequested_account_action',
        'mismatched_branding',
        'unexpected_data_request'
      ]
    }
  ],
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

ScenarioStageSchema.index({ scenarioId: 1, stageOrder: 1 });

module.exports = mongoose.model('ScenarioStage', ScenarioStageSchema);
