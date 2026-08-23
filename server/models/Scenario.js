const mongoose = require('mongoose');

const ScenarioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  assessmentType: {
    type: String,
    enum: ['baseline', 'final', 'practice'],
    default: 'practice'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  type: {
    type: String,
    enum: ['phishing', 'social-engineering', 'financial-fraud', 'identity-theft', 'mixed'],
    default: 'mixed'
  },
  domain: {
    type: String,
    enum: ['EMAIL', 'SMS', 'PHONE', 'PAYMENT', 'QR', 'DELIVERY', 'ACCOUNT', 'SOCIAL', 'JOB', 'WEB', 'PRIVACY'],
    default: 'WEB'
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  estimatedDuration: {
    type: Number,
    default: 5
  },
  active: {
    type: Boolean,
    default: true
  },
  learningObjectives: [
    {
      type: String
    }
  ],
  relatedModules: [
    {
      type: String
    }
  ],
  configuredWeights: {
    type: Map,
    of: Number,
    required: true
  }
}, {
  timestamps: true
});

ScenarioSchema.index({ slug: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Scenario', ScenarioSchema);
