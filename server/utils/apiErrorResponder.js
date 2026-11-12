/**
 * Centralized API Error Sanitization & Safe Server Diagnostic Logger
 *
 * Security Guarantees:
 * 1. HTTP 5xx responses NEVER expose raw database error messages, driver topology
 *    internals, stack traces, hostnames, or connection strings.
 * 2. Safe, actionable validation feedback (4xx domain errors, Mongoose ValidationError,
 *    CastError, E11000 duplicates, malformed JSON) is preserved cleanly without raw stack leaks.
 * 3. Server-side logs strip credentials, JWTs, bcrypt hashes, and MongoDB URI secrets.
 */

const MONGO_URI_CRED_REGEX = /\b(mongodb(?:\+srv)?:\/\/)([^:\s/@]+):([^@\s/]+)@/gi;
const BEARER_TOKEN_REGEX = /\b(Bearer\s+)[^\s,'";}\]]+/gi;
const RAW_JWT_REGEX = /\beyJ[A-Za-z0-9\-_=]{10,}\.[A-Za-z0-9\-_=]{10,}\.[A-Za-z0-9\-_=]{6,}\b/g;
const BCRYPT_HASH_REGEX = /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g;
const INLINE_SECRET_REGEX = /(["']?)\b(password|passwordHash|jwt_secret|mongodb_uri|mongo_uri|admin_password|secret)\b\1\s*[:=]\s*(?:(["'])([^"']*)\3|([^\s,'";}]+))/gi;

/**
 * Masks connection-string credentials, JWTs, hashes, and secret tokens from diagnostic strings.
 * @param {*} input
 * @returns {string}
 */
function redactSensitiveText(input) {
  if (input === null || input === undefined) return '';
  const text = typeof input === 'string' ? input : String(input);
  return text
    .replace(MONGO_URI_CRED_REGEX, '$1****:****@')
    .replace(BEARER_TOKEN_REGEX, '$1[REDACTED_TOKEN]')
    .replace(RAW_JWT_REGEX, '[REDACTED_JWT]')
    .replace(BCRYPT_HASH_REGEX, '[REDACTED_HASH]')
    .replace(INLINE_SECRET_REGEX, (_match, q1, key, q2) => (
      q1 ? `${q1}${key}${q1}: ${q2 || '"'}[REDACTED]${q2 || '"'}` : `${key}=[REDACTED]`
    ));
}

/**
 * Writes sanitized diagnostic details to server stderr without logging raw request bodies,
 * credentials, JWTs, or database URIs.
 *
 * @param {string} contextLabel
 * @param {Error|*} error
 */
function logSafeServerError(contextLabel, error) {
  const safeName = error?.name ? String(error.name) : 'Error';
  const safeMessage = redactSensitiveText(error?.message || String(error || 'Unknown error'));
  const safeCode = error?.code ? ` code=${String(error.code)}` : '';
  console.error(`${contextLabel} [${safeName}${safeCode}]: ${safeMessage}`);

  if (error?.stack && typeof error.stack === 'string') {
    const stackLines = error.stack.split('\n').slice(1, 5).map(redactSensitiveText).join('\n');
    if (stackLines) {
      console.error(stackLines);
    }
  }
}

/**
 * Classifies an exception into a safe HTTP status, error code, and client-safe message.
 * Preserves intentional 4xx domain errors and sanitized schema validation errors;
 * collapses all internal/DB/5xx failures into generic non-leaking messages.
 *
 * @param {Error|*} error
 * @param {Object} options
 * @param {number} [options.defaultStatus=500]
 * @param {string} [options.defaultCode='INTERNAL_SERVER_ERROR']
 * @param {string} [options.defaultMessage='An internal server error occurred.']
 * @returns {{ status: number, code: string, message: string, isValidationOrClientError: boolean }}
 */
function classifySafeApiError(error, {
  defaultStatus = 500,
  defaultCode = 'INTERNAL_SERVER_ERROR',
  defaultMessage = 'An internal server error occurred.'
} = {}) {
  if (error && error.type === 'entity.parse.failed') {
    return {
      status: 400,
      code: 'INVALID_JSON',
      message: 'Malformed JSON request body.',
      isValidationOrClientError: true
    };
  }

  // Mongoose ValidationError -> extract safe schema messages only
  if (error && error.name === 'ValidationError' && error.errors && typeof error.errors === 'object') {
    const details = Object.values(error.errors)
      .map((entry) => redactSensitiveText(entry?.message || ''))
      .filter(Boolean)
      .slice(0, 4);

    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: details.length > 0 ? details.join('; ') : 'Validation failed for submitted fields.',
      isValidationOrClientError: true
    };
  }

  // Mongoose CastError (e.g. malformed ObjectId or mismatched field type)
  if (error && error.name === 'CastError') {
    return {
      status: 400,
      code: 'INVALID_IDENTIFIER',
      message: 'Invalid identifier or parameter format.',
      isValidationOrClientError: true
    };
  }

  // MongoDB duplicate unique index collision (never leak index names or keys)
  if (error && error.code === 11000) {
    return {
      status: 409,
      code: 'DUPLICATE_RECORD',
      message: 'A record with the same unique identifier already exists.',
      isValidationOrClientError: true
    };
  }

  // Intentional domain 4xx errors raised by services/sanitizers
  if (error && Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
    return {
      status: error.status,
      code: typeof error.code === 'string' && error.code ? error.code : defaultCode,
      message: redactSensitiveText(error.message || defaultMessage),
      isValidationOrClientError: true
    };
  }

  // Unhandled internal / database / driver error: strictly generic output
  return {
    status: defaultStatus >= 400 && defaultStatus < 500 ? defaultStatus : 500,
    code: defaultCode,
    message: defaultMessage,
    isValidationOrClientError: false
  };
}

/**
 * Sends a structured `{ success: false, error: { code, message } }` JSON error response.
 */
function sendStructuredError(res, error, options = {}) {
  const {
    contextLabel = '[API Error]',
    defaultStatus = 500,
    defaultCode = 'INTERNAL_SERVER_ERROR',
    defaultMessage = 'An internal server error occurred.'
  } = options;

  const classified = classifySafeApiError(error, {
    defaultStatus,
    defaultCode,
    defaultMessage
  });

  if (!classified.isValidationOrClientError) {
    logSafeServerError(contextLabel, error);
  }

  return res.status(classified.status).json({
    success: false,
    error: {
      code: classified.code,
      message: classified.message
    }
  });
}

/**
 * Sends a message-shaped JSON error response (`{ success: false, message }` or `{ message }`)
 * without ever attaching `error: error.message` or raw exception details.
 */
function sendMessageError(res, error, options = {}) {
  const {
    contextLabel = '[API Error]',
    defaultStatus = 500,
    defaultCode = 'INTERNAL_SERVER_ERROR',
    defaultMessage = 'An error occurred while processing the request.',
    includeSuccessFalse = true
  } = options;

  const classified = classifySafeApiError(error, {
    defaultStatus,
    defaultCode,
    defaultMessage
  });

  if (!classified.isValidationOrClientError) {
    logSafeServerError(contextLabel, error);
  }

  const body = { success: false, message: classified.message };

  return res.status(classified.status).json(body);
}

module.exports = {
  redactSensitiveText,
  logSafeServerError,
  classifySafeApiError,
  sendStructuredError,
  sendMessageError
};

