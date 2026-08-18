const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true // e.g. "Admin updated Section 66C"
  },
  entityType: {
    type: String,
    required: true // e.g. "LawSection", "QuizQuestion"
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // JSON showing diff or values changed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
