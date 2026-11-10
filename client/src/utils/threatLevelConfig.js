/**
 * Authoritative Semantic Threat-Level Colour System & Data Mapping
 * 
 * Color Tokens (Exact Design Tokens):
 * - Low:      foreground #28613F, background #E8F1E9
 * - Moderate: foreground #86621E, background #F8F0D9
 * - High:     foreground #98502E, background #F8E9DF
 * - Critical: foreground #963D39, background #F5E5E4
 * 
 * Constraints:
 * - Authoritative mapping maps existing crime values ('Low', 'Moderate', 'High', 'Very High', 'Critical')
 *   without altering underlying database or catalogue records.
 * - Missing or invalid values return null (never invent or guess severity).
 */

export const THREAT_LEVEL_TOKENS = {
  Low: {
    tier: 'Low',
    label: 'Low',
    fullLabel: 'Low Threat',
    foreground: '#28613F',
    background: '#E8F1E9',
    border: 'rgba(40, 97, 63, 0.32)',
    borderSolid: '#B8D3BD',
    accent: '#28613F',
    pipCount: 3,
    description: 'Opportunistic or low-impact patterns with standard verification safeguards.'
  },
  Moderate: {
    tier: 'Moderate',
    label: 'Moderate',
    fullLabel: 'Moderate Threat',
    foreground: '#86621E',
    background: '#F8F0D9',
    border: 'rgba(134, 98, 30, 0.32)',
    borderSolid: '#E2D1A6',
    accent: '#86621E',
    pipCount: 5,
    description: 'Deceptive patterns requiring active citizen vigilance and secondary verification.'
  },
  High: {
    tier: 'High',
    label: 'High',
    fullLabel: 'High Threat',
    foreground: '#98502E',
    background: '#F8E9DF',
    border: 'rgba(152, 80, 46, 0.32)',
    borderSolid: '#E4BBA6',
    accent: '#98502E',
    pipCount: 7,
    description: 'Frequent predatory attacks targeting citizen finances, credentials, or personal privacy.'
  },
  Critical: {
    tier: 'Critical',
    label: 'Critical',
    fullLabel: 'Critical Threat',
    foreground: '#963D39',
    background: '#F5E5E4',
    border: 'rgba(150, 61, 57, 0.32)',
    borderSolid: '#E2B3B0',
    accent: '#963D39',
    pipCount: 10,
    description: 'Severe, urgent threat with severe financial loss, extortion, coercion, or digital arrest.'
  }
};

/**
 * Maps a raw threat level string to its authoritative tier config.
 * Returns null if the value is missing or unmapped.
 * 
 * @param {string} rawLevel
 * @returns {typeof THREAT_LEVEL_TOKENS[keyof typeof THREAT_LEVEL_TOKENS] | null}
 */
export function mapThreatLevel(rawLevel) {
  if (!rawLevel || typeof rawLevel !== 'string') return null;
  const normalized = rawLevel.trim();
  if (normalized === 'Low') return THREAT_LEVEL_TOKENS.Low;
  if (normalized === 'Moderate') return THREAT_LEVEL_TOKENS.Moderate;
  if (normalized === 'High') return THREAT_LEVEL_TOKENS.High;
  if (normalized === 'Very High' || normalized === 'Critical') return THREAT_LEVEL_TOKENS.Critical;
  return null;
}

/**
 * Resolves the tier key ('Low' | 'Moderate' | 'High' | 'Critical') for a crime.
 * 
 * @param {string} rawLevel
 * @returns {string | null}
 */
export function getThreatTierKey(rawLevel) {
  const config = mapThreatLevel(rawLevel);
  return config ? config.tier : null;
}

/**
 * Returns complete threat metadata for a crime record without modifying the record.
 * 
 * @param {object} crime
 * @returns {object | null}
 */
export function getCrimeThreatMetadata(crime) {
  if (!crime || !crime.redFlagLevel) return null;
  const config = mapThreatLevel(crime.redFlagLevel);
  if (!config) return null;

  const isVeryHigh = crime.redFlagLevel === 'Very High';
  return {
    ...config,
    rawLevel: crime.redFlagLevel,
    isMappedFromVeryHigh: isVeryHigh,
    badgeLabel: isVeryHigh ? 'Very High Threat' : `${config.label} Threat`,
    displaySubnote: isVeryHigh ? 'Very High' : null
  };
}

/**
 * Returns available threat level filter definitions with real-time counts.
 * 
 * @param {Array} crimes
 * @returns {Array}
 */
export function getThreatFilterDefinitions(crimes = []) {
  const counts = {
    All: crimes.length,
    Critical: 0,
    High: 0,
    Moderate: 0,
    Low: 0
  };

  crimes.forEach((crime) => {
    const tier = getThreatTierKey(crime?.redFlagLevel);
    if (tier && counts[tier] !== undefined) {
      counts[tier]++;
    }
  });

  return [
    { key: 'All', label: 'All Severities', count: counts.All, color: 'var(--color-text-primary, #26352B)', bg: 'transparent' },
    { key: 'Critical', label: 'Critical', fullLabel: 'Critical Threat', count: counts.Critical, color: THREAT_LEVEL_TOKENS.Critical.foreground, bg: THREAT_LEVEL_TOKENS.Critical.background },
    { key: 'High', label: 'High', fullLabel: 'High Threat', count: counts.High, color: THREAT_LEVEL_TOKENS.High.foreground, bg: THREAT_LEVEL_TOKENS.High.background },
    { key: 'Moderate', label: 'Moderate', fullLabel: 'Moderate Threat', count: counts.Moderate, color: THREAT_LEVEL_TOKENS.Moderate.foreground, bg: THREAT_LEVEL_TOKENS.Moderate.background },
    { key: 'Low', label: 'Low', fullLabel: 'Low Threat', count: counts.Low, color: THREAT_LEVEL_TOKENS.Low.foreground, bg: THREAT_LEVEL_TOKENS.Low.background }
  ];
}

