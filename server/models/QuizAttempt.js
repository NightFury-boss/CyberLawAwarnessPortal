const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Parent Quiz ID (optional for dynamic mode sessions)
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false
  },
  // Quiz Mode
  mode: {
    type: String,
    enum: ['quick_practice', 'topic_wise', 'scenario', 'challenge', 'case_based', 'standard'],
    default: 'standard'
  },
  topic: {
    type: String,
    default: 'All'
  },
  difficulty: {
    type: String,
    default: 'All'
  },
  // Submitted answers supporting all 8 question formats
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
      },
      // Single choice, true/false, scenario decision, legal application
      selectedOptionIndex: {
        type: Number,
        required: false
      },
      // Multiple choice
      selectedOptionIndices: [
        {
          type: Number
        }
      ],
      // Matching format: submitted pair associations
      selectedPairs: [
        {
          left: { type: String },
          right: { type: String }
        }
      ],
      // Ordering format: submitted sequence order
      selectedSequence: [
        {
          type: String
        }
      ],
      // Indicator identification: list of indicator IDs flagged as suspicious
      selectedIndicatorIds: [
        {
          type: String
        }
      ],
      isCorrect: {
        type: Boolean,
        default: false
      },
      partialScore: {
        type: Number,
        default: 0
      }
    }
  ],
  score: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  unansweredCount: {
    type: Number,
    default: 0
  },
  topicBreakdown: [
    {
      topic: { type: String },
      correct: { type: Number },
      total: { type: Number },
      percentage: { type: Number }
    }
  ],
  attemptNumber: {
    type: Number,
    default: 1
  },
  timeTaken: {
    type: Number
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

QuizAttemptSchema.index({ userId: 1, completedAt: -1 });
QuizAttemptSchema.index({ userId: 1, quizId: 1, completedAt: -1 });
QuizAttemptSchema.index({ userId: 1, mode: 1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
