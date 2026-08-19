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
  caseNumber: {
    type: String,
    required: true,
    trim: true
  },
  caseType: {
    type: String,
    required: true,
    enum: ['documented-case', 'educational-reconstruction', 'anonymized-incident', 'fictional-training-scenario'],
    default: 'documented-case'
  },
  incidentType: {
    type: String,
    required: true,
    trim: true
  },
  attackVector: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  incidentDate: {
    type: String
  },
  publishedDate: {
    type: String
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  featured: {
    type: Boolean,
    default: false
  },
  sourceSummary: {
    type: String
  },
  narrativeSections: [
    {
      heading: { type: String, required: true },
      body: { type: String, required: true }
    }
  ],
  timeline: [
    {
      time: { type: String, required: true },
      label: { type: String, required: true },
      description: { type: String, required: true },
      type: { type: String, enum: ['contact', 'deception', 'decision', 'escalation', 'discovery', 'response'], default: 'contact' }
    }
  ],
  decisionPoints: [
    {
      questionText: { type: String, required: true },
      options: [
        {
          optionText: { type: String, required: true },
          isCorrect: { type: Boolean, required: true },
          explanation: { type: String, required: true }
        }
      ],
      explanation: { type: String }
    }
  ],
  warningSigns: [
    {
      title: { type: String, required: true },
      explanation: { type: String, required: true }
    }
  ],
  attackerObjectives: [
    {
      type: String
    }
  ],
  impact: {
    financial: { type: String, default: 'Not publicly documented.' },
    account: { type: String, default: 'Not publicly documented.' },
    privacy: { type: String, default: 'Not publicly documented.' },
    operational: { type: String, default: 'Not publicly documented.' },
    emotional: { type: String, default: 'Not publicly documented.' }
  },
  response: [
    {
      type: String
    }
  ],
  preventionLessons: [
    {
      type: String
    }
  ],
  legalContext: [
    {
      type: String // Section codes of IT Act
    }
  ],
  relatedCrimes: [
    {
      type: String // Slugs from CyberCrime
    }
  ],
  relatedModules: [
    {
      type: String // Slugs or IDs from LearningModule
    }
  ],
  sources: [
    {
      title: { type: String, required: true },
      authority: { type: String, required: true },
      url: { type: String },
      publicationDate: { type: String },
      sourceType: { type: String, enum: ['official', 'court', 'government', 'news', 'research', 'educational'], default: 'official' }
    }
  ],
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CaseStudy', CaseStudySchema);
