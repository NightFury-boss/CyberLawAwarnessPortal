const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  completedModules: [
    {
      type: String // Slugs of completed learning modules
    }
  ],
  badgesEarned: [
    {
      type: String
    }
  ],
  currentStreak: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);
