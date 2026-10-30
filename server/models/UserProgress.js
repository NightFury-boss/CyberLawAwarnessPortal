const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  completedModules: [
    {
      type: String
    }
  ],
  badgesEarned: [
    {
      type: String
    }
  ],
  currentStreak: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  completedPathways: [
    {
      pathwayId: {
        type: String,
        required: true
      },
      sourceSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentSession',
        required: true
      },
      completedAt: {
        type: Date
      },
      checkpointScore: {
        type: Number,
        min: 0,
        max: 100
      },
      stepsCompleted: {
        caseStudy: {
          type: Boolean,
          default: false
        },
        prevention: {
          type: Boolean,
          default: false
        },
        checkpointQuiz: {
          type: Boolean,
          default: false
        }
      },
      checkpointAnswers: [
        {
          questionId: {
            type: String
          },
          selectedOptionIndex: {
            type: Number
          },
          isCorrect: {
            type: Boolean
          }
        }
      ]
    }
  ],
  reinforcementsCompleted: [
    {
      pathwayId: {
        type: String,
        required: true
      },
      sourceSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentSession',
        required: true
      },
      sourceHabitState: {
        type: String,
        enum: ['continued_practice', 'emerging_gap'],
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      checkpointScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      checkpointAnswers: [
        {
          questionId: {
            type: String
          },
          selectedOptionIndex: {
            type: Number
          },
          isCorrect: {
            type: Boolean
          }
        }
      ]
    }
  ],
  spacedReviews: [
    {
      pathwayId: {
        type: String,
        required: true
      },
      sourceSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AssessmentSession',
        required: true
      },
      cycleNumber: {
        type: Number,
        default: 1
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      checkpointScore: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      },
      passed: {
        type: Boolean,
        required: true
      },
      reviewAnswers: [
        {
          questionId: {
            type: String
          },
          selectedOptionIndex: {
            type: Number
          },
          isCorrect: {
            type: Boolean
          }
        }
      ]
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
