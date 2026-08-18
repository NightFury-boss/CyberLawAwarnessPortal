const mongoose = require('mongoose');

const LearningModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    default: 'Medium'
  },
  estimatedMinutes: {
    type: Number,
    default: 5
  },
  relatedLawSections: [
    {
      type: String
    }
  ],
  relatedCyberCrimes: [
    {
      type: String
    }
  ],
  relatedScenarios: [
    {
      type: String
    }
  ],
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningModule', LearningModuleSchema);
