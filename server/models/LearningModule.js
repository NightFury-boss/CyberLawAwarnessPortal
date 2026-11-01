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
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  estimatedMinutes: {
    type: Number,
    default: 5
  },
  order: {
    type: Number,
    default: 1
  },
  icon: {
    type: String,
    default: 'BookOpen'
  },
  keyTakeaways: [
    {
      type: String
    }
  ],
  sections: [
    {
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      }
    }
  ],
  quickCheck: {
    question: {
      type: String
    },
    options: [
      {
        type: String
      }
    ],
    correctIndex: {
      type: Number,
      default: 0
    },
    explanation: {
      type: String
    }
  },
  actionSteps: [
    {
      type: String
    }
  ],
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
  relatedCaseStudies: [
    {
      type: String
    }
  ],
  relatedResources: [
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
