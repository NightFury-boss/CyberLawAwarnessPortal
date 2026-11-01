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
  lessonProgress: [
    {
      slug: {
        type: String,
        required: true
      },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'read_completed', 'knowledge_check_attempted', 'knowledge_check_passed'],
        default: 'not_started'
      },
      readCompleted: {
        type: Boolean,
        default: false
      },
      readCompletedAt: {
        type: Date
      },
      knowledgeCheckStatus: {
        type: String,
        enum: ['unattempted', 'attempted', 'passed', 'failed'],
        default: 'unattempted'
      },
      knowledgeCheckScore: {
        type: Number,
        default: null
      },
      lastAnswerIndex: {
        type: Number,
        default: null
      },
      lastAccessedAt: {
        type: Date,
        default: Date.now
      },
      firstStartedAt: {
        type: Date,
        default: Date.now
      }
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
  ],
  // Separate, isolated queue for missed standalone quiz concepts
  quizRecallItems: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
      },
      sourceAttemptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizAttempt'
      },
      category: {
        type: String,
        default: 'General'
      },
      missedCount: {
        type: Number,
        default: 1
      },
      mastered: {
        type: Boolean,
        default: false
      },
      lastAttemptedAt: {
        type: Date,
        default: Date.now
      },
      nextReviewDue: {
        type: Date,
        default: Date.now
      },
      reviewHistory: [
        {
          reviewedAt: {
            type: Date,
            default: Date.now
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
