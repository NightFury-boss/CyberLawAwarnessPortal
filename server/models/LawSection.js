const mongoose = require('mongoose');

const LawSectionSchema = new mongoose.Schema({
  sectionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true // e.g. "Section 66C"
  },
  actName: {
    type: String,
    default: 'Information Technology Act, 2000'
  },
  officialTitle: {
    type: String,
    required: true,
    trim: true
  },
  plainLanguageExplanation: {
    type: String,
    required: true
  },
  whyItMatters: {
    type: String,
    required: true
  },
  exampleScenario: {
    type: String,
    required: true
  },
  relatedCyberCrimes: [
    {
      type: String // Category names of related crimes
    }
  ],
  penaltyOrLegalEffect: {
    type: String
  },
  legalStatus: {
    type: String,
    enum: ['current', 'omitted', 'amended', 'historical'],
    default: 'current'
  },
  officialSourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalSource'
  },
  lastReviewed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LawSection', LawSectionSchema);
