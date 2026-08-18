const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  difficulty: {
    type: String,
    default: 'Medium'
  },
  relatedModule: {
    type: String // Slug of related learning module
  },
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', QuizSchema);
