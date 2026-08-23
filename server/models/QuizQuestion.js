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
  questionType: {
    type: String,
    enum: ['knowledge', 'scenario', 'recognition', 'prevention', 'legal-context', 'sequence', 'distinction', 'myth-fact', 'situational-judgment'],
    default: 'knowledge'
  },
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  learningObjective: {
    type: String,
    default: ''
  },
  relatedLaw: {
    type: String,
    default: ''
  },
  relatedLawSection: {
    type: String,
    default: ''
  },
  relatedCrime: {
    type: String,
    default: ''
  },
  relatedModule: {
    type: String,
    default: ''
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

QuizQuestionSchema.index({ quizId: 1, published: 1 });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
