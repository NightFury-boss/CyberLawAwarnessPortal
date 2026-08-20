/**
 * Normalizes a string by converting it to lowercase, trimming,
 * and replacing multiple whitespaces with a single space.
 */
export const normalizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Tokenizes a query string into a list of alphanumeric terms.
 */
export const tokenize = (query) => {
  const norm = normalizeString(query);
  if (!norm) return [];
  return norm.split(/[\s,.\-;/\\()\[\]{}]+/).filter(Boolean);
};

/**
 * Calculates a weighted relevance score for an item based on search query tokens.
 * Supports string fields, arrays of strings, and arrays of objects (with depth-checking).
 * 
 * @param {Object} item The item to score.
 * @param {string} query The query string.
 * @param {Object} config Weighted configurations { fieldName: weight } (e.g. { title: 50 }).
 * @returns {number} Score calculated.
 */
export const getRelevanceScore = (item, query, config) => {
  if (!item || !query || !config) return 0;
  const qLower = normalizeString(query);
  if (!qLower) return 0;

  const tokens = tokenize(qLower);
  if (tokens.length === 0) return 0;

  let score = 0;

  // Exact Match Boost on primary key/title fields (if value matches normalized query exactly)
  const primaryFields = ['title', 'sectionNumber', 'sectionNum', 'name'];
  for (const field of primaryFields) {
    if (item[field] && config[field]) {
      const fieldValNorm = normalizeString(item[field]);
      if (fieldValNorm === qLower) {
        score += config[field] * 5; // 5x boost for exact matching title
      } else if (fieldValNorm.startsWith(qLower)) {
        score += config[field] * 2; // 2x boost for prefix matching title
      }
    }
  }

  // Iterate over configured fields for weighted token matches
  for (const [fieldName, weight] of Object.entries(config)) {
    const val = item[fieldName];
    if (val === undefined || val === null) continue;

    // Check matches for each token in query
    for (const token of tokens) {
      if (typeof val === 'string') {
        if (normalizeString(val).includes(token)) {
          score += weight;
        }
      } else if (Array.isArray(val)) {
        // Support array of strings or array of objects
        for (const element of val) {
          if (typeof element === 'string') {
            if (normalizeString(element).includes(token)) {
              score += weight;
            }
          } else if (element && typeof element === 'object') {
            // Nested field values (e.g. ws.title or tac.tactic)
            const objValuesText = Object.values(element)
              .filter(v => typeof v === 'string')
              .map(v => normalizeString(v))
              .join(' ');
            if (objValuesText.includes(token)) {
              score += weight;
            }
          }
        }
      } else if (typeof val === 'object') {
        const objValuesText = Object.values(val)
          .filter(v => typeof v === 'string')
          .map(v => normalizeString(v))
          .join(' ');
        if (objValuesText.includes(token)) {
          score += weight;
        }
      }
    }
  }

  return score;
};

/**
 * Searches a list of items using weighted field relevance ranking and an optional category filter.
 * 
 * @param {Array} items List of items to search.
 * @param {string} query Search query.
 * @param {Object} config Weighted fields configuration.
 * @param {Function} [filterFn] Additional filter callback (receives item, returns boolean).
 * @returns {Array} List of matching items sorted by relevance score.
 */
export const searchItems = (items, query, config, filterFn) => {
  if (!Array.isArray(items)) return [];

  // 1. Filter out items that fail category/status filter rules first
  let eligible = items;
  if (typeof filterFn === 'function') {
    eligible = items.filter(filterFn);
  }

  // 2. If query is empty, skip relevance scoring and return eligible list
  if (!query || !query.trim()) {
    return eligible;
  }

  // 3. Score and sort by relevance
  return eligible
    .map(item => {
      const score = getRelevanceScore(item, query, config);
      return { item, score };
    })
    .filter(wrapped => wrapped.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(wrapped => wrapped.item);
};
