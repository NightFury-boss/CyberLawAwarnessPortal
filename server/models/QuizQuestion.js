const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  options: [
    {
      type: String,
      required: true
    }
  ],
  correctOptionIndex: {
    type: Number,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  relatedLawSection: {
    type: String // Section code
  },
  difficulty: {
    type: String,
    default: 'Medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
