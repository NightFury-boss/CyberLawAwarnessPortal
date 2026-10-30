const mongoose = require('mongoose');

const AdminAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true // Human-readable summary e.g. "Created Section 66C"
  },
  actionType: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'SYSTEM'],
    default: 'UPDATE',
    index: true
  },
  entityType: {
    type: String,
    required: true, // e.g. "LawSection", "CyberCrime", "CaseStudy", "Quiz", "Resource"
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true
  },
  outcome: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS',
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // Safe allowlisted key-value diff or attributes
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Safe contextual metadata: ip, userAgent, entityIdentifier, failureReason
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for performant audit queries
AdminAuditLogSchema.index({ timestamp: -1 });
AdminAuditLogSchema.index({ entityType: 1, timestamp: -1 });
AdminAuditLogSchema.index({ actionType: 1, timestamp: -1 });
AdminAuditLogSchema.index({ outcome: 1, timestamp: -1 });
AdminAuditLogSchema.index({ adminId: 1, timestamp: -1 });

module.exports = mongoose.model('AdminAuditLog', AdminAuditLogSchema);
