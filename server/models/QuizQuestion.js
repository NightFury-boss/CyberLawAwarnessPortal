const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  // Unique stable identifier for tracking and citation (e.g. QZ-ITACT-001)
  questionId: {
    type: String,
    sparse: true,
    index: true,
    trim: true
  },
  // Parent quiz reference (optional for general pool questions)
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: false
  },
  // Question Format
  format: {
    type: String,
    enum: [
      'single_choice',
      'multiple_choice',
      'true_false',
      'matching',
      'ordering',
      'indicator_identification',
      'scenario_decision',
      'legal_application'
    ],
    default: 'single_choice'
  },
  // Question text / prompt
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  // Primary options array (for single_choice, multiple_choice, true_false, scenario_decision, legal_application)
  options: [
    {
      type: String,
      trim: true
    }
  ],
  // Correct option index (for single_choice, true_false, scenario_decision, legal_application)
  correctOptionIndex: {
    type: Number,
    required: false
  },
  // Multiple correct option indices (for multiple_choice)
  correctOptionIndices: [
    {
      type: Number
    }
  ],
  // Matching format: pairs of left and right items
  matchingPairs: [
    {
      left: { type: String, required: true },
      right: { type: String, required: true }
    }
  ],
  // Ordering format: array of items in their correct sequential order
  sequenceItems: [
    {
      type: String,
      trim: true
    }
  ],
  // Suspicious Indicator format: passage/email/message to inspect
  textToInspect: {
    type: String,
    trim: true
  },
  // Suspicious Indicator format: items within text marked as suspicious or benign
  indicators: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      isSuspicious: { type: Boolean, required: true },
      explanation: { type: String, default: '' }
    }
  ],
  // Authoritative explanation of why the correct answer is right
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  // Option-specific explanations: why each option is correct or incorrect
  optionExplanations: [
    {
      type: String,
      trim: true
    }
  ],
  // Simple, supportive explanation of why common incorrect answers fail
  whyIncorrect: {
    type: String,
    default: '',
    trim: true
  },
  // Practical takeaway: memorable rule to remember in real life
  practicalTakeaway: {
    type: String,
    default: '',
    trim: true
  },
  // Cognitive & pedagogical categorization
  questionType: {
    type: String,
    enum: [
      'knowledge',
      'scenario',
      'recognition',
      'prevention',
      'legal-context',
      'sequence',
      'distinction',
      'myth-fact',
      'situational-judgment'
    ],
    default: 'knowledge'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subtopic: {
    type: String,
    default: '',
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  cognitiveLevel: {
    type: String,
    enum: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6'],
    default: 'Level 1'
  },
  topicTag: {
    type: String,
    default: ''
  },
  learningObjective: {
    type: String,
    default: ''
  },
  // Statutory cross-references
  legalReferences: [
    {
      actName: { type: String, required: true },
      sectionNumber: { type: String, required: true },
      title: { type: String, default: '' },
      status: { type: String, default: 'active' }
    }
  ],
  sourceMetadata: {
    actName: { type: String, default: '' },
    citation: { type: String, default: '' },
    year: { type: Number },
    status: { type: String, default: '' }
  },
  reviewStatus: {
    type: String,
    enum: ['verified', 'pending_review', 'needs_update'],
    default: 'verified'
  },
  lastReviewedAt: {
    type: Date,
    default: Date.now
  },
  // Backward compatibility fields
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
QuizQuestionSchema.index({ category: 1, published: 1, difficulty: 1 });
QuizQuestionSchema.index({ format: 1, published: 1 });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
