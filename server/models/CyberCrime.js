const mongoose = require('mongoose');

const CyberCrimeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true
  },
  whatIsIt: {
    type: String,
    required: true
  },
  howItWorks: {
    type: String,
    required: true
  },
  attackerObjective: [
    {
      type: String // e.g., "Money", "Credentials", "Identity", "Personal Information", "Device Access", "Account Access"
    }
  ],
  attackLifecycle: [
    {
      stepNumber: { type: Number, required: true },
      label: { type: String, required: true },
      description: { type: String, required: true }
    }
  ],
  warningSigns: [
    {
      type: String
    }
  ],
  attackerTactics: [
    {
      tactic: { type: String, required: true },
      example: { type: String, required: true },
      whyItWorks: { type: String, required: true }
    }
  ],
  actionSteps: [
    {
      type: String // Do this
    }
  ],
  avoidSteps: [
    {
      type: String // Avoid this
    }
  ],
  ifTargetedSteps: [
    {
      type: String // If targeted
    }
  ],
  mythFacts: [
    {
      myth: { type: String, required: true },
      fact: { type: String, required: true }
    }
  ],
  redFlagLevel: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Very High'],
    default: 'High'
  },
  attackVectors: [
    {
      type: String // e.g. "Email", "SMS", "Phone", "Social Media", "Payment", "Website", "Messaging", "Device"
    }
  ],
  legalContext: [
    {
      type: String // Related sectionNumbers (e.g. "Section 66C")
    }
  ],
  relatedModules: [
    {
      type: String
    }
  ],
  relatedCaseStudies: [
    {
      type: String // Case study slugs
    }
  ],
  relatedCrimes: [
    {
      type: String // Other crime slugs
    }
  ],
  spotTheFlags: {
    messageType: { type: String }, // e.g., "Email", "SMS"
    messageText: { type: String },
    clickableFlags: [
      {
        textSegment: { type: String, required: true },
        flagName: { type: String, required: true },
        explanation: { type: String, required: true }
      }
    ]
  },
  whatWouldYouDo: {
    questionText: { type: String },
    options: [
      {
        optionText: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String, required: true }
      }
    ]
  },
  quickCheckQuestions: [
    {
      questionText: { type: String, required: true },
      options: [{ type: String, required: true }],
      correctOptionIndex: { type: Number, required: true },
      explanation: { type: String, required: true }
    }
  ],
  published: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    default: 'Medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CyberCrime', CyberCrimeSchema);
