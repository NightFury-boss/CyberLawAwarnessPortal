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
  quickChecks: [
    {
      id: {
        type: String,
        trim: true
      },
      pillar: {
        type: String,
        trim: true
      },
      scenario: {
        type: String,
        trim: true
      },
      question: {
        type: String
      },
      options: [
        {
          type: String
        }
      ],
      correctIndex: {
        type: Number
      },
      correctOptionIndex: {
        type: Number
      },
      correctKey: {
        type: String,
        trim: true
      },
      explanation: {
        type: String
      }
    }
  ],
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

// Validate that whichever correct-answer index is used in quickChecks is within range of the options array
LearningModuleSchema.path('quickChecks').validate({
  validator: function(checks) {
    if (!Array.isArray(checks)) return true;
    for (const check of checks) {
      if (!check) continue;
      const effectiveIndex = (check.correctIndex !== undefined && check.correctIndex !== null)
        ? check.correctIndex
        : check.correctOptionIndex;
      if (Array.isArray(check.options) && check.options.length > 0) {
        if (typeof effectiveIndex !== 'number' || !Number.isInteger(effectiveIndex) || effectiveIndex < 0 || effectiveIndex >= check.options.length) {
          return false;
        }
      }
    }
    return true;
  },
  message: 'Quick check correctIndex or correctOptionIndex must be a valid integer within the bounds of the options array.'
});

module.exports = mongoose.model('LearningModule', LearningModuleSchema);
