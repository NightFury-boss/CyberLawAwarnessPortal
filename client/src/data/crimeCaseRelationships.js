/**
 * Authoritative Crime-to-Case Relationship & Precedent Registry
 * 
 * Maps CyberCrime threat profiles to verified case studies in the dual archive:
 * 1. Landmark Precedents (Legacy Cases)
 * 2. Cases Where Justice Fell Short (Authoritative Adjudications & Investigation Audits)
 * 
 * Strict Editorial Rule:
 * - Direct judicial precedents (court/adjudicating officer rulings) are clearly distinguished
 *   from illustrative real-world investigations.
 * - Crimes without sufficiently supported matches in the 21-case archive are intentionally
 *   left unmapped (empty array). Artificial associations are rejected.
 */

export const CASE_METADATA_REGISTRY = {
  // Direct Judicial Precedents
  'harshada-bindu-dholepatil-v-vodafone-idea': {
    slug: 'harshada-bindu-dholepatil-v-vodafone-idea',
    title: 'Harshada Bindu Dholepatil v. Vodafone Idea Ltd.',
    category: 'Judicial Precedent',
    typeLabel: 'Judicial Adjudication',
    badgeClass: 'badge-judicial',
    courtOrAuthority: 'Maharashtra State IT Adjudicating Officer',
    description: 'Landmark ruling under IT Act Section 43/43A establishing telecom carrier liability for gross negligence in unauthorized franchisee SIM swap issuance.'
  },
  'jaiprakash-kulkarni-v-banking-ombudsman': {
    slug: 'jaiprakash-kulkarni-v-banking-ombudsman',
    title: 'Jaiprakash Kulkarni v. Banking Ombudsman & Anr.',
    category: 'Judicial Precedent',
    typeLabel: 'Judicial / Regulatory Precedent',
    badgeClass: 'badge-judicial',
    courtOrAuthority: 'Bombay High Court & RBI Banking Ombudsman',
    description: 'Judicial adjudication of zero customer liability directions under RBI Master Directions for unauthorized commercial electronic banking transfers.'
  },
  'pegasus-technical-committee-inquiry': {
    slug: 'pegasus-technical-committee-inquiry',
    title: 'Supreme Court of India Pegasus Technical Committee Inquiry',
    category: 'Judicial Precedent',
    typeLabel: 'Supreme Court Inquiry',
    badgeClass: 'badge-judicial',
    courtOrAuthority: 'Supreme Court of India (Justice R.V. Raveendran Committee)',
    description: 'Supreme Court-mandated technical committee inquiry into zero-click mobile spyware intrusions, forensic standards, and state surveillance bounds.'
  },

  // Documented Case Investigations & Educational Reconstructions
  'phishing-credential-takeover': {
    slug: 'phishing-credential-takeover',
    title: 'The Fake Service Warning Trap (Case File 001)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Educational Case File Reconstruction',
    description: 'Investigation of email credential harvesting through deceptive domain mimicry and subsequent 2FA account takeover.'
  },
  'classified-marketplace-qr-fraud': {
    slug: 'classified-marketplace-qr-fraud',
    title: 'The Fake Military Officer QR Trap (Case File 002)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Cybercrime Police Incident Investigation',
    description: 'Marketplace payment fraud exploiting inverted QR code mechanics and impersonation of defence personnel.'
  },
  'fake-support-call-fraud': {
    slug: 'fake-support-call-fraud',
    title: 'The Fake Banking Support Call (Case File 003)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Cybercrime Police Incident Investigation',
    description: 'Telephone social engineering and remote screen-sharing manipulation to extract one-time passwords.'
  },
  'fake-job-offer-scam': {
    slug: 'fake-job-offer-scam',
    title: 'The Telegram Part-Time Job Scam (Case File 004)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Cybercrime Police Incident Investigation',
    description: 'Prepaid task escalation scam operating through encrypted messaging channels with mule account layers.'
  },
  'digital-arrest-impersonation': {
    slug: 'digital-arrest-impersonation',
    title: 'The Digital Arrest Extortion Incident (Case File 005)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'State Cyber Cell Investigation',
    description: 'Multi-day psychological coercion involving fabricated law enforcement warrants and continuous video surveillance.'
  },
  'aeps-biometric-theft': {
    slug: 'aeps-biometric-theft',
    title: 'The Aadhaar Enabled Biometric Theft (Case File 006)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Financial Cybercrime Investigation',
    description: 'Exploitation of public deed registry biometric records to execute unauthorized AePS micro-ATM withdrawals.'
  },
  'aeps-biometric-cloned-deed-exploits': {
    slug: 'aeps-biometric-cloned-deed-exploits',
    title: 'Cloned Fingerprint Deed Registry Exploits (Case Study 005)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Cyber Crime Police Station Audit',
    description: 'Systematic analysis of land registration portals leaking high-resolution fingerprint scans used for silicon mould replays.'
  },
  'restaurant-qr-code-scam': {
    slug: 'restaurant-qr-code-scam',
    title: 'The Restaurant Table QR Code Swap (Case File 007)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Local Police & Merchant Investigation',
    description: 'Physical tampering and overlay of merchant UPI QR codes redirecting merchant settlements to fraudulent accounts.'
  },
  'sim-swap-compromise': {
    slug: 'sim-swap-compromise',
    title: 'The SIM Swap Credential Hijack (Case File 008)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Telecom & Banking Fraud Audit',
    description: 'Exploitation of carrier store identity verification loopholes to hijack phone numbers and intercept banking SMS OTPs.'
  },
  'ai-voice-cloning-family-emergency': {
    slug: 'ai-voice-cloning-family-emergency',
    title: 'The Voice Clone Kidnapping Scam (Case File 009)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'State Cyber Police Case File',
    description: 'Use of synthetic voice generation sampled from social media audio to fabricate family kidnapping emergencies.'
  },
  'instant-loan-app-harassment': {
    slug: 'instant-loan-app-harassment',
    title: 'The Instant Cash App Contact Blackmail (Case File 010)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Organized Crime Branch Investigation',
    description: 'Coercive digital lending syndicates harvesting contacts and threatening defamation through morphed imagery.'
  },
  'cyberabad-instant-loan-app-syndicates': {
    slug: 'cyberabad-instant-loan-app-syndicates',
    title: 'Cyberabad Instant Loan App Syndicate Investigation (Case Study 003)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Cyberabad Police Commissionerate Charge Sheet',
    description: 'Investigation into multi-tier call centers running predatory micro-lending apps with offshore servers and systematic harassment.'
  },
  'hospital-ransomware-certin-response': {
    slug: 'hospital-ransomware-certin-response',
    title: 'Regional Clinic Ransomware Lockdown (Case File 011)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'CERT-In Incident Response Audit',
    description: 'Critical healthcare ransomware deployment, CERT-In mandatory 6-hour reporting adherence, and backup recovery protocols.'
  },
  'aiims-new-delhi-ransomware-incident': {
    slug: 'aiims-new-delhi-ransomware-incident',
    title: 'AIIMS New Delhi Ransomware Incident (Case Study 006)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Parliamentary Committee Review & NIA Probe',
    description: 'Extensive cyberattack locking national tertiary hospital databases, forensic gaps, and delayed server recovery.'
  },
  'sulli-deals-bulli-bai-investigation-delays': {
    slug: 'sulli-deals-bulli-bai-investigation-delays',
    title: 'Sulli Deals & Bulli Bai Targeted Harassment (Case Study 001)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Delhi & Mumbai Cyber Police Intermediary Audit',
    description: 'Cross-border digital harassment involving non-consensual dissemination of women\'s images and intermediary response bottlenecks.'
  },
  'cfcfrms-1930-restitution-gap': {
    slug: 'cfcfrms-1930-restitution-gap',
    title: 'CFCFRMS 1930 Frozen Funds Restitution Gap (Case Study 009)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Inter-Bank Financial Fraud Audit',
    description: 'Systemic audit of funds successfully frozen under 1930 Golden Hour protocols but trapped in procedural release friction.'
  },
  'kudankulam-administrative-network-malware': {
    slug: 'kudankulam-administrative-network-malware',
    title: 'Kudankulam Administrative Network Malware Intrusion (Case Study 010)',
    category: 'Documented Case',
    typeLabel: 'Documented Case Investigation',
    badgeClass: 'badge-investigation',
    courtOrAuthority: 'Nuclear Power Corporation of India (NPCIL) Inquiry',
    description: 'Targeted malware infiltration of administrative IT infrastructure via specialized Dtrack variant.'
  }
};

/**
 * Authoritative Mapping: Crime Slug -> Array of Case Study Slugs
 * Only genuinely substantiated relationships are included.
 */
export const CRIME_CASE_RELATIONSHIPS = {
  'phishing': ['phishing-credential-takeover'],
  'upi-payment-fraud': ['jaiprakash-kulkarni-v-banking-ombudsman', 'cfcfrms-1930-restitution-gap'],
  'qr-code-scams': ['restaurant-qr-code-scam', 'classified-marketplace-qr-fraud'],
  'smishing': [],
  'vishing': ['fake-support-call-fraud'],
  'spear-phishing': [],
  'bec': [],
  'credential-theft': ['phishing-credential-takeover'],
  'fake-login-pages': ['phishing-credential-takeover'],
  'account-takeover': ['sim-swap-compromise'],
  'identity-theft': ['aeps-biometric-theft', 'aeps-biometric-cloned-deed-exploits'],
  'online-impersonation': ['digital-arrest-impersonation'],
  'payment-app-scams': ['classified-marketplace-qr-fraud'],
  'fake-customer-support': ['fake-support-call-fraud'],
  'fake-job-scams': ['fake-job-offer-scam'],
  'investment-scams': [],
  'romance-scams': [],
  'marketplace-scams': ['classified-marketplace-qr-fraud'],
  'tech-support-scams': [],
  'malware': ['kudankulam-administrative-network-malware'],
  'ransomware': ['hospital-ransomware-certin-response', 'aiims-new-delhi-ransomware-incident'],
  'spyware': ['pegasus-technical-committee-inquiry'],
  'sextortion': [],
  'sim-swapping': ['harshada-bindu-dholepatil-v-vodafone-idea', 'sim-swap-compromise'],
  'digital-arrest-scam': ['digital-arrest-impersonation'],
  'deepfake-ai-impersonation': ['ai-voice-cloning-family-emergency'],
  'loan-app-extortion': ['instant-loan-app-harassment', 'cyberabad-instant-loan-app-syndicates'],
  'cyberstalking-doxxing': ['sulli-deals-bulli-bai-investigation-delays'],
  'ncii-image-abuse': ['sulli-deals-bulli-bai-investigation-delays']
};

/**
 * Resolves full case metadata for a crime slug.
 * 
 * @param {string} crimeSlug
 * @returns {Array<object>}
 */
export function getRelatedCasesForCrime(crimeSlug) {
  const caseSlugs = CRIME_CASE_RELATIONSHIPS[crimeSlug] || [];
  return caseSlugs.map((slug) => {
    const meta = CASE_METADATA_REGISTRY[slug];
    if (meta) {
      return { ...meta };
    }
    return {
      slug,
      title: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      category: 'Documented Case',
      typeLabel: 'Documented Case Study',
      badgeClass: 'badge-investigation',
      courtOrAuthority: 'Case Precedent Archive',
      description: 'Review documented judicial findings, investigative obstacles, and legal outcomes.'
    };
  });
}

