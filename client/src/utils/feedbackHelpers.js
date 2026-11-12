/**
 * Pure helper utilities for Public Beta feedback validation and mailto draft creation.
 *
 * Feedback is delivered via the learner's email client (`mailto:`) and never persists
 * personal email addresses, query strings, or pseudo-delivery receipts in browser storage.
 */

export const FEEDBACK_EMAIL_ADDRESS = 'feedback@cyberlawportal.org';

export const FEEDBACK_CATEGORIES = [
  { id: 'experience', label: 'Learning Experience', icon: '✦', desc: 'Flow, clarity, or comprehension' },
  { id: 'bug', label: 'Bug or Issue', icon: '⚙', desc: 'Display, navigation, or technical bug' },
  { id: 'legal', label: 'Statutory Accuracy', icon: '§', desc: 'Citations, legal terms, or precedents' },
  { id: 'general', label: 'General Thoughts', icon: '💬', desc: 'Impressions, ideas, and suggestions' }
];

/**
 * Normalizes a route path so query strings and hashes are never included in feedback context.
 */
export function sanitizeFeedbackPath(rawPath = '/') {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return '/';
  const withoutHash = rawPath.split('#')[0];
  const withoutQuery = withoutHash.split('?')[0].trim();
  return withoutQuery || '/';
}

/**
 * Validates feedback message content before constructing a delivery draft.
 */
export function validateFeedbackMessage(rawMessage) {
  const trimmed = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  if (!trimmed) {
    return {
      valid: false,
      trimmed: '',
      error: 'Please provide a short description of your observation or feedback.'
    };
  }
  if (trimmed.length < 8) {
    return {
      valid: false,
      trimmed,
      error: 'Please provide at least 8 characters so we can understand your thought.'
    };
  }
  return {
    valid: true,
    trimmed,
    error: ''
  };
}

/**
 * Builds a mailto: URL using sanitized pathname context (excluding query parameters).
 */
export function buildFeedbackMailto({
  category = 'experience',
  message = '',
  email = '',
  learnerRole = 'student',
  pathname = '/'
} = {}) {
  const catLabel = FEEDBACK_CATEGORIES.find((c) => c.id === category)?.label || 'General';
  const safePath = sanitizeFeedbackPath(pathname);
  const trimmedMsg = typeof message === 'string' ? message.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  const subject = encodeURIComponent(`[Public Beta Feedback] ${catLabel}`);
  const body = encodeURIComponent(
    `Category: ${category}\n` +
    `Page: ${safePath}\n` +
    `Role: ${learnerRole}\n\n` +
    `Feedback:\n${trimmedMsg}\n\n` +
    `Contact: ${trimmedEmail || 'Not provided'}`
  );

  return `mailto:${FEEDBACK_EMAIL_ADDRESS}?subject=${subject}&body=${body}`;
}

/**
 * Validates and initiates honest mailto feedback preparation without writing PII to localStorage.
 */
export function prepareAndLaunchMailtoFeedback({
  category = 'experience',
  message = '',
  email = '',
  learnerRole = 'student',
  pathname = '/',
  launchMailto
} = {}) {
  const validation = validateFeedbackMessage(message);
  if (!validation.valid) {
    return {
      ok: false,
      validationError: validation.error,
      deliveryError: '',
      mailtoUrl: ''
    };
  }

  const mailtoUrl = buildFeedbackMailto({
    category,
    message: validation.trimmed,
    email,
    learnerRole,
    pathname
  });

  if (typeof launchMailto !== 'function') {
    return {
      ok: false,
      validationError: '',
      deliveryError: 'No email launcher is available in this environment. Use the direct email link below to send your message.',
      mailtoUrl
    };
  }

  try {
    const launched = launchMailto(mailtoUrl);
    if (launched === false) {
      return {
        ok: false,
        validationError: '',
        deliveryError: 'Your browser blocked opening the email client. Please use the button below to email our team directly.',
        mailtoUrl
      };
    }
    return {
      ok: true,
      validationError: '',
      deliveryError: '',
      mailtoUrl
    };
  } catch {
    return {
      ok: false,
      validationError: '',
      deliveryError: 'Could not open your email client automatically. Please use the direct email link below to send your message.',
      mailtoUrl
    };
  }
}

