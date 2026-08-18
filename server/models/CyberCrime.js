const mongoose = require('mongoose');

const CyberCrimeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  whatIsIt: {
    type: String,
    required: true
  },
  howItWorks: {
    type: String,
    required: true
  },
  warningSigns: [
    {
      type: String
    }
  ],
  actionSteps: [
    {
      type: String
    }
  ],
  avoidSteps: [
    {
      type: String
    }
  ],
  legalContext: [
    {
      type: String // Section Numbers, e.g. "Section 66C"
    }
  ],
  relatedModules: [
    {
      type: String
    }
  ],
  relatedCaseStudies: [
    {
      type: String
    }
  ],
  difficulty: {
    type: String,
    default: 'Medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CyberCrime', CyberCrimeSchema);
