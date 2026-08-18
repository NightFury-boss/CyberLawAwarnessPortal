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
    trim: true // e.g. "baseline", "final"
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
  difficulty: {
    type: String,
    default: 'Medium'
  },
  estimatedDuration: {
    type: Number,
    default: 5 // minutes
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
    required: true // e.g. { "Phishing awareness": 30, "Social engineering": 20 }
  }
}, {
  timestamps: true
});

// Compound unique key to enforce versioning immutability
ScenarioSchema.index({ slug: 1, version: 1 }, { unique: true });

module.exports = mongoose.model('Scenario', ScenarioSchema);
