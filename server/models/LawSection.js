const mongoose = require('mongoose');

const LawSectionSchema = new mongoose.Schema({
  sectionNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
      type: String
    }
  ],
  relatedCaseStudies: [
    {
      type: String
    }
  ],
  relatedModules: [
    {
      type: String
    }
  ],
  penaltyOrLegalEffect: {
    type: String
  },
  legalStatus: {
    type: String,
    enum: [
      'CURRENT',
      'OMITTED',
      'AMENDED',
      'REPEALED',
      'NOT_YET_IN_FORCE',
      'PARTIALLY_IN_FORCE',
      'HISTORICAL',
      'UNDER_REVIEW'
    ],
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
