const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
      },
      selectedOptionIndex: {
        type: Number,
        required: true
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

QuizAttemptSchema.index({ userId: 1, quizId: 1, completedAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
