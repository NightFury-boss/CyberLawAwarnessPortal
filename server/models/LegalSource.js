const mongoose = require('mongoose');

const LegalSourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  authority: {
    type: String,
    required: true,
    trim: true // e.g. Ministry of Law and Justice, Supreme Court of India
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
    sourceType: {
      type: String,
      enum: ['legislation', 'judgment', 'government-guidance', 'official-reporting', 'official-awareness', 'other'],
      default: 'legislation'
    },
  description: {
    type: String
  },
  lastVerified: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LegalSource', LegalSourceSchema);
