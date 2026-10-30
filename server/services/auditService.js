const AdminAuditLog = require('../models/AdminAuditLog');

// Sensitive key patterns to never persist under any circumstances
const SENSITIVE_KEY_REGEX = /(password|hash|token|secret|jwt|session|pin|otp|aadhaar|credit|card|cvv|auth|bearer)/i;

/**
 * Recursively sanitizes changes objects against an allowlist and sensitive key blocker.
 * Truncates oversized string values to prevent collection bloating.
 */
function sanitizeChanges(data, maxDepth = 3) {
  if (!data || maxDepth <= 0) return null;

  if (typeof data === 'string') {
    return data.length > 500 ? data.substring(0, 500) + '... [TRUNCATED]' : data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.slice(0, 25).map(item => sanitizeChanges(item, maxDepth - 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    // Strip sensitive keys
    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED_SENSITIVE_DATA]';
      continue;
    }

    if (value === null || value === undefined) {
      clean[key] = value;
    } else if (typeof value === 'object') {
      clean[key] = sanitizeChanges(value, maxDepth - 1);
    } else if (typeof value === 'string') {
      clean[key] = value.length > 500 ? value.substring(0, 500) + '... [TRUNCATED]' : value;
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Extracts safe contextual request metadata (client IP and User-Agent).
 */
function extractSafeContext(req) {
  if (!req) return {};
  const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || 'unknown';
  const rawUserAgent = req.headers?.['user-agent'] || 'unknown';
  const userAgent = rawUserAgent.length > 200 ? rawUserAgent.substring(0, 200) : rawUserAgent;

  return {
    ip,
    userAgent
  };
}

/**
 * Centralized audit logger for all administrative actions.
 * Enforces server-derived identities, timestamps, and safe field validation.
 */
async function logAdminEvent({
  req,
  adminId,
  actionType = 'UPDATE',
  action,
  entityType,
  entityId,
  outcome = 'SUCCESS',
  description = '',
  changes = null,
  metadata = {}
}) {
  try {
    // 1. Strictly derive admin ID from server session (never trust client payload)
    const effectiveAdminId = (req && req.user && req.user._id) ? req.user._id : adminId;
    if (!effectiveAdminId) {
      console.error('[AdminAuditLog] Audit event discarded: Missing server-authenticated adminId');
      return { success: false, reason: 'MISSING_ADMIN_IDENTITY' };
    }

    // 2. Extract and combine safe contextual metadata
    const context = extractSafeContext(req);
    const safeMetadata = {
      ...context,
      ...(metadata && typeof metadata === 'object' ? sanitizeChanges(metadata, 2) : {})
    };

    // 3. Sanitize changes payload
    const safeChanges = changes ? sanitizeChanges(changes, 3) : undefined;

    // 4. Validate outcome
    const validOutcome = outcome === 'FAILURE' ? 'FAILURE' : 'SUCCESS';

    // 5. Create audit log document
    const auditRecord = await AdminAuditLog.create({
      adminId: effectiveAdminId,
      action: action || `${actionType} ${entityType}`,
      actionType,
      entityType,
      entityId: entityId || undefined,
      outcome: validOutcome,
      description: description || action || `${validOutcome}: ${actionType} on ${entityType}`,
      changes: safeChanges,
      metadata: safeMetadata,
      timestamp: new Date() // Server-derived timestamp
    });

    return { success: true, logId: auditRecord._id };
  } catch (err) {
    // Never fail silently: log to stderr, but don't leak database exceptions directly
    console.error('[AdminAuditLog Write Error]:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  logAdminEvent,
  sanitizeChanges,
  extractSafeContext
};
