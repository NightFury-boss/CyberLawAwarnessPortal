const AdminAuditLog = require('../models/AdminAuditLog');
const { redactSensitiveText } = require('../utils/apiErrorResponder');

// Sensitive key patterns to never persist under any circumstances
const SENSITIVE_KEY_REGEX = /(password|hash|token|secret|jwt|session|pin|otp|aadhaar|credit|card|cvv|auth|bearer)/i;
const AUDIT_EXTRA_KV_SECRET_REGEX = /\b(access_token|refresh_token|id_token|api_key|apikey|private_key|passphrase|session_id|jwt)\s*[:=]\s*(['"]?)[^\s,'";}\]]+\2/gi;
const AUDIT_QUOTED_JSON_SECRET_REGEX = /(["'])(password|passwordHash|passphrase|token|secret|jwt|jwt_secret|mongodb_uri|mongo_uri|admin_password|api_key|apikey|access_token|refresh_token)\1\s*:\s*(["'])([^"']*)\3/gi;

/**
 * Redacts connection strings, bearer tokens, JWTs, hashes, and inline secrets inside
 * arbitrary audit strings before applying length truncation.
 */
function sanitizeAuditString(rawStr, maxLength = 500) {
  const redacted = redactSensitiveText(rawStr)
    .replace(AUDIT_EXTRA_KV_SECRET_REGEX, '$1=[REDACTED]')
    .replace(AUDIT_QUOTED_JSON_SECRET_REGEX, '$1$2$1: $3[REDACTED]$3');

  return redacted.length > maxLength
    ? redacted.substring(0, maxLength) + '... [TRUNCATED]'
    : redacted;
}

/**
 * Recursively sanitizes changes objects against sensitive keys and sensitive string values.
 * Truncates oversized string values to prevent collection bloating.
 */
function sanitizeChanges(data, maxDepth = 3) {
  if (!data || maxDepth <= 0) return null;

  if (data instanceof Date) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeAuditString(data);
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
    } else if (value instanceof Date) {
      clean[key] = value;
    } else if (typeof value === 'object') {
      clean[key] = sanitizeChanges(value, maxDepth - 1);
    } else if (typeof value === 'string') {
      clean[key] = sanitizeAuditString(value);
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
  const rawUserAgent = redactSensitiveText(req.headers?.['user-agent'] || 'unknown');
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

    // 5. Create audit log document (also redact top-level text fields)
    const rawAction = action || `${actionType} ${entityType}`;
    const rawDescription = description || action || `${validOutcome}: ${actionType} on ${entityType}`;
    const auditRecord = await AdminAuditLog.create({
      adminId: effectiveAdminId,
      action: sanitizeAuditString(rawAction, 500),
      actionType,
      entityType,
      entityId: entityId || undefined,
      outcome: validOutcome,
      description: sanitizeAuditString(rawDescription, 1000),
      changes: safeChanges,
      metadata: safeMetadata,
      timestamp: new Date() // Server-derived timestamp
    });

    return { success: true, logId: auditRecord._id };
  } catch (err) {
    // Never fail silently: log redacted diagnostics to stderr, never expose DB exceptions
    const safeMsg = redactSensitiveText(err?.message || 'Audit log write failed');
    console.error('[AdminAuditLog Write Error]:', safeMsg);
    return { success: false, error: safeMsg };
  }
}

module.exports = {
  logAdminEvent,
  sanitizeChanges,
  extractSafeContext
};
