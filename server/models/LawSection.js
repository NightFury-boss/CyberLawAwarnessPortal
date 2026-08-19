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
  role: {
    type: String,
    enum: [
      'Core Cyber Law',
      'Related Criminal Law',
      'Data Protection',
      'Electronic Commerce / Digital Transactions',
      'Sector Regulation',
      'Judicial Interpretation',
      'Government Rule / Notification',
      'Official Guidance'
    ],
    default: 'Core Cyber Law'
  },
  plainLanguageExplanation: {
    type: String,
    required: true
  },
  officialText: {
    type: String,
    default: ''
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
  relatedCaseStudies: [
    {
      type: String // Slugs of related case studies
    }
  ],
  relatedModules: [
    {
      type: String // Slugs of related learning modules
    }
  ],
  penaltyOrLegalEffect: {
    type: String
  },
  legalStatus: {
    type: String,
    enum: ['CURRENT', 'OMITTED', 'AMENDED', 'REPEALED', 'NOT_YET_IN_FORCE', 'PARTIALLY_IN_FORCE', 'HISTORICAL', 'UNDER_REVIEW', 'current', 'omitted', 'amended', 'historical'],
    default: 'CURRENT'
  },
  commencementStatus: {
    type: String,
    default: ''
  },
  amendmentStatus: {
    type: String,
    default: ''
  },
  keywords: [
    {
      type: String
    }
  ],
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
