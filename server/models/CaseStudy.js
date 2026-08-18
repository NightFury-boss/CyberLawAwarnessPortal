const mongoose = require('mongoose');

const CaseStudySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  incidentDescription: {
    type: String,
    required: true
  },
  incidentType: {
    type: String,
    required: true,
    trim: true
  },
  victimImpact: {
    type: String,
    required: true
  },
  warningSigns: [
    {
      type: String
    }
  ],
  legalContext: [
    {
      type: String // Section codes
    }
  ],
  preventionTips: [
    {
      type: String
    }
  ],
  lessonsLearned: {
    type: String
  },
  relatedModules: [
    {
      type: String
    }
  ],
  sources: [
    {
      type: String
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('CaseStudy', CaseStudySchema);
