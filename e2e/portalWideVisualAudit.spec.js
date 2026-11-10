// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const AxeBuilder = require('@axe-core/playwright').default;

const SCREENSHOT_DIR = process.env.AUDIT_SCREENSHOT_DIR || path.resolve(__dirname, '../screenshots/design-audit');
const AUDIT_DATA_PATH = path.join(SCREENSHOT_DIR, 'audit_collected_metrics.json');

// Ensure output directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Global audit results collector
const auditResults = {
  timestamp: new Date().toISOString(),
  viewports: {},
  axeResults: {},
  computedStyles: {},
  overflows: [],
  screenshotsCaptured: []
};

// Rich mock data for all portal areas
const MOCK_LAWS = [
  {
    _id: 'law_1',
    sectionNumber: 'Section 43A',
    actName: 'Information Technology Act, 2000',
    officialTitle: 'Compensation for failure to protect data',
    role: 'Core Cyber Law',
    status: 'CURRENT',
    plainLanguageExplanation: 'Bodies corporate possessing sensitive personal data must maintain reasonable security practices or pay compensation for negligence causing wrongful loss.',
    officialText: 'Where a body corporate, possessing, dealing or handling any sensitive personal data or information in a computer resource which it owns, controls or operates, is negligent in implementing and maintaining reasonable security practices and procedures...',
    whyItMatters: 'Establishes financial liability for data controllers failing to protect user information.',
    exampleScenario: 'An e-commerce company leaves its database unencrypted and exposed to the public internet.',
    penalty: 'Compensation by way of damages to the person affected (historically capped; transitioning under DPDP Act).',
    relatedCrime: 'Identity & Credential Theft',
    relatedModules: ['digital-identity-foundations']
  },
  {
    _id: 'law_2',
    sectionNumber: 'Section 66C',
    actName: 'Information Technology Act, 2000',
    officialTitle: 'Punishment for identity theft',
    role: 'Core Cyber Law',
    status: 'CURRENT',
    plainLanguageExplanation: 'Fraudulent or dishonest use of another person’s electronic signature, password, or unique identification feature.',
    officialText: 'Whoever, fraudulently or dishonestly make use of the electronic signature, password or any other unique identification feature of any other person, shall be punished...',
    whyItMatters: 'Protects citizens from stolen credentials, spoofed profiles, and impersonation fraud.',
    exampleScenario: 'Logging into a coworker’s email without permission and forwarding private communications.',
    penalty: 'Imprisonment up to 3 years and fine up to ₹1,00,000.',
    relatedCrime: 'Identity & Credential Theft',
    relatedModules: ['passwords-mfa-passkeys']
  },
  {
    _id: 'law_3',
    sectionNumber: 'Section 66D',
    actName: 'Information Technology Act, 2000',
    officialTitle: 'Punishment for cheating by personation by using computer resource',
    role: 'Core Cyber Law',
    status: 'CURRENT',
    plainLanguageExplanation: 'Cheating someone by pretending to be someone else using a computer, phone, or internet account.',
    officialText: 'Whoever, by means of any communication device or computer resource, cheats by personating, shall be punished...',
    whyItMatters: 'Primary statutory defense against caller spoofing, fake police calls, and bank imposters.',
    exampleScenario: 'A fraudster poses as an electricity board officer over WhatsApp to demand immediate bill payment.',
    penalty: 'Imprisonment up to 3 years and fine up to ₹1,00,000.',
    relatedCrime: 'Phishing & Messaging Scams',
    relatedModules: ['phishing-social-engineering', 'digital-arrest-impersonation-scams']
  },
  {
    _id: 'law_4',
    sectionNumber: 'Section 66A',
    actName: 'Information Technology Act, 2000',
    officialTitle: 'Punishment for sending offensive messages through communication service, etc.',
    role: 'Core Cyber Law',
    status: 'OMITTED',
    plainLanguageExplanation: 'Struck down by the Supreme Court in Shreya Singhal v. Union of India (2015) as unconstitutional under Article 19(1)(a). Cannot be invoked for prosecutions.',
    officialText: 'Any person who sends, by means of a computer resource or a communication device,- (a) any information that is grossly offensive...',
    whyItMatters: 'Landmark constitutional protection for free speech in digital spaces.',
    exampleScenario: 'Citizens cannot be arrested under Section 66A for social media commentary or political critiques.',
    penalty: 'Unconstitutional and void ab initio; no legal force.',
    relatedCrime: 'Online Harassment & Abuse',
    relatedModules: ['it-act-fundamentals']
  },
  {
    _id: 'law_5',
    sectionNumber: 'Section 6',
    actName: 'Digital Personal Data Protection Act, 2023',
    officialTitle: 'Consent for processing digital personal data',
    role: 'Data Protection',
    status: 'NOT_YET_IN_FORCE',
    plainLanguageExplanation: 'Consent must be free, specific, informed, unconditional, and unambiguous with clear affirmative action before personal data can be collected.',
    officialText: 'Consent given by the Data Principal shall be free, specific, informed, unconditional and unambiguous with a clear affirmative action...',
    whyItMatters: 'Establishes user autonomy over personal data collection by digital platforms.',
    exampleScenario: 'An app cannot force users to accept advertising tracking as a condition for functioning as a flashlight.',
    penalty: 'Penalties up to ₹250 crore adjudicated by the Data Protection Board of India.',
    relatedCrime: 'Online Deception',
    relatedModules: ['privacy-dpdp-act-2023']
  }
];

const MOCK_CRIMES = [
  {
    _id: 'crime_1',
    name: 'Phishing & Impersonation Scams',
    category: 'Phishing & Messaging Scams',
    severity: 'High',
    summary: 'Deceptive messages and phone calls claiming official authority to extract credentials and OTPs.',
    threatVectors: ['SMS spoofing', 'WhatsApp urgency lures', 'Fake bank websites'],
    statutoryProvisions: ['IT Act §66D', 'BNS §318(4)'],
    preventativeActions: ['Never share OTPs', 'Verify via official website', 'Report to 1930']
  },
  {
    _id: 'crime_2',
    name: 'UPI QR Code Collect-Call Fraud',
    category: 'Financial Fraud',
    severity: 'Critical',
    summary: 'Fraudulent sellers sending QR codes claiming they are required to "receive" funds or refunds.',
    threatVectors: ['Marketplace buyer fraud', 'Reversed payment claims', 'Dynamic QR lures'],
    statutoryProvisions: ['IT Act §66C', 'IT Act §66D'],
    preventativeActions: ['UPI PIN is only used for sending money, never receiving']
  },
  {
    _id: 'crime_3',
    name: 'Digital Arrest Threat Schemes',
    category: 'Online Deception',
    severity: 'Critical',
    summary: 'Coercive video calls with fake police officers demanding immediate funds transfer to clear names.',
    threatVectors: ['Skype / WhatsApp video calls', 'Forged warrant letters', 'Isolation demands'],
    statutoryProvisions: ['IT Act §66D', 'BNS §204 (Impersonating public servant)'],
    preventativeActions: ['Police never arrest via video call; disconnect and call 1930']
  }
];

const MOCK_CASES = [
  {
    _id: 'case_1',
    slug: 'classified-marketplace-qr-fraud',
    title: 'The Second-Hand Furniture QR Code Trap',
    category: 'Financial Fraud',
    incidentDate: '2025-11-12',
    summary: 'A citizen listing used furniture received an immediate buyer offering full advance payment via QR code.',
    detailedNarrative: 'The buyer contacted the seller within 10 minutes of the listing going live. The buyer claimed to be an army officer posted out of state...',
    criticalIndicators: [
      'Buyer refused in-person inspection or phone calls.',
      'Insisted on scanning a QR code to "receive" the payment.',
      'Created artificial urgency claiming transfer expires in 15 minutes.'
    ],
    statutoryApplication: [
      { statute: 'IT Act, 2000', section: 'Section 66D', application: 'Cheating by personation over digital communications.' },
      { statute: 'Bharatiya Nyaya Sanhita, 2023', section: 'Section 318(4)', application: 'Cheating and dishonestly inducing delivery of property.' }
    ],
    interactiveDecision: {
      question: 'The buyer sends you a QR code on WhatsApp titled "COLLECT ₹15,000" and asks you to enter your UPI PIN. What is your safest action?',
      options: [
        'Scan and enter your PIN immediately so the buyer can verify the payment account.',
        'Refuse: UPI PIN is never entered to receive funds, only to authorize outgoing money transfers.',
        'Ask the buyer to send ₹1 first and enter your PIN for that smaller amount.',
        'Forward the QR code to your bank branch manager via email.'
      ],
      correctIndex: 1,
      explanation: 'Under NPCI and RBI standards, a UPI PIN is only required to deduct funds from your account. Scanning a QR code and entering your PIN authorizes an outgoing debit, not a receipt.'
    }
  }
];

const MOCK_RESOURCES = [
  {
    _id: 'res_1',
    title: 'National Cyber Crime Reporting Portal',
    category: 'Official Government Portals',
    url: 'https://cybercrime.gov.in',
    description: 'Official citizen portal maintained by the Ministry of Home Affairs to file formal cybercrime complaints.',
    isEmergency: true
  },
  {
    _id: 'res_2',
    title: 'National Cybercrime Helpline: 1930',
    category: 'Emergency Helplines',
    url: 'tel:1930',
    description: 'Toll-free 24x7 helpline for reporting financial fraud within the 2-3 hour Golden Hour to coordinate inter-bank fund holds.',
    isEmergency: true
  }
];

const MOCK_MODULES = [
  {
    order: 1,
    slug: 'digital-identity-foundations',
    title: 'Understanding Your Digital Identity',
    category: 'Foundations of Digital Law',
    difficulty: 'Beginner',
    estimatedMinutes: 6,
    summary: 'Explore electronic records, legal rights, and fundamental obligations under Indian cyber statutes.',
    published: true,
    sections: [
      { title: 'The Legal Definition of Digital Identity', content: 'Under Section 2(t) of the Information Technology Act, an electronic record encompasses data generated, sent, received, or stored in digital form.' },
      { title: 'Passkeys and Cryptographic Trust', content: 'Digital trust relies on verifiable public key infrastructure and cryptographic authentication.' }
    ],
    quickChecks: [
      {
        id: 'qc_1',
        scenario: 'A person receives an SMS requesting login credentials to update their KYC.',
        question: 'What principle governs legal digital identification?',
        options: [
          'Official authorities never demand credentials via SMS or unverified links.',
          'Always respond within 10 minutes to avoid legal penalties.',
          'KYC updates must be performed exclusively over phone calls.'
        ],
        correctIndex: 0,
        explanation: 'Statutory regulators such as RBI and CERT-In strictly prohibit banks from requesting passwords or OTPs over SMS or unsolicited links.'
      }
    ]
  },
  {
    order: 4,
    slug: 'phishing-social-engineering',
    title: 'Phishing, Social Engineering & Deceptive Urgency',
    category: 'Threat Recognition & Mitigation',
    difficulty: 'Intermediate',
    estimatedMinutes: 8,
    summary: 'Recognize cognitive urgency triggers, spoofed sender domains, and psychological authority levers.',
    published: true,
    sections: [
      { title: 'Manufactured Panic', content: 'Threat actors fabricate imminent consequences (account locks, electricity power cuts) to suppress critical thinking.' },
      { title: 'The 60-Second Pause Protocol', content: 'Taking a 60-second pause and independently navigating to official websites neutralizes over 94% of social engineering attacks.' }
    ],
    quickChecks: [
      {
        id: 'qc_2',
        scenario: 'You receive a text claiming your electricity will be disconnected tonight due to an unpaid bill.',
        question: 'What is the recommended defensive action?',
        options: [
          'Call the number in the SMS immediately to clear the bill.',
          'Verify your account directly through the official utility provider app or monthly physical bill.',
          'Download the quick-support app linked in the message.'
        ],
        correctIndex: 1,
        explanation: 'Utility providers never demand immediate payment through personal mobile numbers or third-party APK links.'
      }
    ]
  }
];

const setupMockApi = async (page) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock_jwt_audit_learner_token');
    window.localStorage.setItem('user', JSON.stringify({
      _id: 'usr_audit_learner',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@cyberlawportal.test',
      role: 'user'
    }));
  });

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    // 1. Auth profile
    if (url.includes('/api/auth/me')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            _id: 'usr_audit_learner',
            fullName: 'Aarav Sharma',
            email: 'aarav.sharma@cyberlawportal.test',
            role: 'user'
          }
        })
      });
      return;
    }

    // 2. Progress
    if (url.includes('/api/progress') && method === 'GET' && !url.includes('/portfolio')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          userId: 'usr_audit_learner',
          fullName: 'Aarav Sharma',
          currentStreak: 4,
          completedModules: ['digital-identity-foundations', 'phishing-social-engineering'],
          lessons: {
            completedCount: 4,
            totalPublished: 18,
            inProgressCount: 1,
            recentlyAccessed: {
              slug: 'digital-identity-foundations',
              title: 'Understanding Your Digital Identity',
              estimatedMinutes: 6,
              difficulty: 'Beginner',
              status: 'knowledge_check_passed'
            }
          },
          completedPathways: [
            {
              pathwayId: 'pathway-ua-upi-consent',
              habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
              completedAt: new Date(Date.now() - 86400000).toISOString(),
              checkpointScore: 100,
              stepsCompleted: { caseStudy: true, prevention: true, checkpointQuiz: true }
            }
          ],
          reinforcementsCompleted: [],
          quizRecallItems: [],
          latestSessionId: 'sess_baseline_audit',
          baselineScore: 78,
          finalScore: null
        })
      });
      return;
    }

    // 3. Assessment status baseline
    if (url.includes('/api/assessments/status/baseline') || url.includes('/api/simulation/assessment-status/baseline')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          hasCompletedSession: true,
          hasActiveSession: false,
          stage: null,
          sessionId: 'sess_baseline_audit',
          completedSession: {
            _id: 'sess_baseline_audit',
            mode: 'baseline',
            status: 'completed',
            overallScore: 78,
            completedAt: new Date(Date.now() - 172800000).toISOString(),
            dimensions: {
              TR: { score: 82, label: 'Threat Recognition' },
              SI: { score: 75, label: 'Signal Identification' },
              VB: { score: 80, label: 'Verification Behavior' },
              DQ: { score: 70, label: 'Decision Quality' },
              FP: { score: 88, label: 'Financial Protection' },
              UA: { score: 85, label: 'Unreviewed Acceptance' }
            },
            remediationRecommendations: [
              {
                pathwayId: 'pathway-ua-upi-consent',
                habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
                pedagogicalFocus: 'Never enter a UPI PIN to receive money.',
                coreRule: 'PIN is exclusively for debit authorization.',
                estimatedMinutes: 4,
                habitShiftState: 'in_progress'
              }
            ]
          }
        })
      });
      return;
    }

    // 4. Assessment status final
    if (url.includes('/api/assessments/status/final') || url.includes('/api/simulation/assessment-status/final')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          hasCompletedSession: false,
          hasActiveSession: false,
          stage: null
        })
      });
      return;
    }

    // 5. Remediation
    if (url.includes('/api/assessments/remediation/') || url.includes('/api/simulation/remediation/')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recommendations: [
            {
              pathwayId: 'pathway-ua-upi-consent',
              habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
              pedagogicalFocus: 'Never enter a UPI PIN to receive money.',
              coreRule: 'PIN is exclusively for debit authorization.',
              estimatedMinutes: 4,
              habitShiftState: 'in_progress'
            }
          ]
        })
      });
      return;
    }

    // 6. Portfolio
    if (url.includes('/api/progress/portfolio')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          interventions: {
            completedPathways: [
              {
                pathwayId: 'pathway-ua-upi-consent',
                habitTitle: 'Unreviewed Acceptance & UPI PIN Safety',
                completedAt: new Date(Date.now() - 86400000).toISOString(),
                checkpointScore: 100
              }
            ],
            reinforcementsCompleted: [],
            spacedReviews: [],
            summary: {
              totalPathwaysCompleted: 1,
              totalReinforcementsCompleted: 0,
              totalSpacedReviews: 0,
              passedSpacedReviews: 0
            }
          },
          knowledgePractice: {
            quizAttempts: [
              {
                quizTitle: 'UPI & Payment Safety Checkpoint',
                category: 'UPI, banking and financial fraud',
                percentage: 100,
                attemptNumber: 1,
                completedAt: new Date().toISOString()
              }
            ]
          },
          behavioralEvolution: {
            dimensions: {
              TR: { baseline: 82, final: null },
              SI: { baseline: 75, final: null },
              VB: { baseline: 80, final: null },
              DQ: { baseline: 70, final: null },
              FP: { baseline: 88, final: null },
              UA: { baseline: 85, final: null }
            }
          }
        })
      });
      return;
    }

    // 7. Trajectory
    if (url.includes('/api/assessments/trajectory') || url.includes('/api/simulation/trajectory')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          hasReassessment: false,
          dimensions: {
            TR: { baseline: 82, final: null },
            SI: { baseline: 75, final: null },
            VB: { baseline: 80, final: null },
            DQ: { baseline: 70, final: null },
            FP: { baseline: 88, final: null },
            UA: { baseline: 85, final: null }
          }
        })
      });
      return;
    }

    // 8. Quiz history
    if (url.includes('/api/quizzes/history')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAttempts: 5,
          overallAccuracyPercent: 88,
          recentAttempts: [
            { quizTitle: 'UPI & Banking Safeguards', percentage: 100, completedAt: new Date().toISOString() }
          ],
          frequentlyMissedTopics: [
            { topic: 'UPI, banking and financial fraud', accuracy: 50 }
          ]
        })
      });
      return;
    }

    // 9. Due recalls
    if (url.includes('/api/quizzes/due-recalls') || url.includes('/api/quizzes/recall/due')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({ dueItems: [], totalDue: 0 })
      });
      return;
    }

    // 10. Quiz modes
    if (url.includes('/api/quizzes/modes')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          modes: [
            { id: 'quick_practice', title: 'Quick Practice', badge: '5 Questions', timed: false },
            { id: 'topic_wise', title: 'Topic-wise Practice', badge: '10 Questions', timed: false },
            { id: 'scenario', title: 'Real-world Scenarios', badge: '8 Dilemmas', timed: false },
            { id: 'challenge', title: 'Challenge Quiz', badge: 'Timed Challenge', timed: true, defaultDurationSeconds: 600 },
            { id: 'case_based', title: 'Case-based & Legal Application', badge: 'Evidence & Law', timed: false }
          ]
        })
      });
      return;
    }

    // 11. Laws API
    if (url.includes('/api/laws')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LAWS)
      });
      return;
    }

    // 12. Crimes API
    if (url.includes('/api/crimes')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CRIMES)
      });
      return;
    }

    // 13. Cases API
    if (url.includes('/api/cases/classified-marketplace-qr-fraud') || (url.includes('/api/cases') && url.includes('slug=classified-marketplace-qr-fraud'))) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CASES[0])
      });
      return;
    }

    if (url.includes('/api/cases')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_CASES)
      });
      return;
    }

    // 14. Resources API
    if (url.includes('/api/resources')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_RESOURCES)
      });
      return;
    }

    // 15. Modules API
    if (url.includes('/api/modules/phishing-social-engineering')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          module: MOCK_MODULES[1]
        })
      });
      return;
    }

    if (url.includes('/api/modules')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          modules: MOCK_MODULES,
          categories: ['All', 'Foundations of Digital Law', 'Threat Recognition & Mitigation'],
          userProgress: {
            completedModules: ['digital-identity-foundations'],
            moduleProgress: {
              'digital-identity-foundations': { status: 'completed' },
              'phishing-social-engineering': { status: 'in_progress' }
            }
          }
        })
      });
      return;
    }

    // Fallback for simulation start / questions
    if (url.includes('/api/quizzes/start')) {
      await route.fulfill({
        status: 200,
        headers: corsHeaders,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sessionId: 'quiz_sess_audit',
          title: 'Quick Practice: Rapid 5-Question Session',
          mode: 'quick_practice',
          questions: [
            {
              id: 'q1',
              questionId: 'Q-01',
              format: 'single_choice',
              questionText: 'Under Section 66D of the IT Act, which act is punishable?',
              category: 'Indian Cyber Law and IT Act',
              options: [
                'Identity theft using computer resources',
                'Cheating by personation using a communication device',
                'Installing an ad blocker on personal devices',
                'Refusing to accept digital transactions'
              ]
            }
          ]
        })
      });
      return;
    }

    // Default 200 OK for other API calls
    await route.fulfill({
      status: 200,
      headers: corsHeaders,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    });
  });
};

// Helper: Inspect page computed styles and measure layout metrics
const inspectPageMetrics = async (page, routeName, viewportLabel) => {
  return await page.evaluate(({ routeName, viewportLabel }) => {
    const docEl = document.documentElement;
    const body = document.body;

    const scrollWidth = docEl.scrollWidth;
    const clientWidth = docEl.clientWidth;
    const innerWidth = window.innerWidth;
    const hasHorizontalOverflow = scrollWidth > clientWidth;
    const overflowDelta = Math.max(0, scrollWidth - clientWidth);

    // Sample typography and computed styles
    const bodyStyles = window.getComputedStyle(body);
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const h3 = document.querySelector('h3');
    const btn = document.querySelector('button, .btn, .button, a.story-action-link, a.explore-row-link');
    const card = document.querySelector('.card, .desk-studio-panel, .story-phone-mock, .atelier-journey-step');

    return {
      route: routeName,
      viewport: viewportLabel,
      viewportWidth: innerWidth,
      scrollWidth,
      clientWidth,
      hasHorizontalOverflow,
      overflowDelta,
      body: {
        fontFamily: bodyStyles.fontFamily,
        backgroundColor: bodyStyles.backgroundColor,
        color: bodyStyles.color,
        fontSize: bodyStyles.fontSize,
        lineHeight: bodyStyles.lineHeight
      },
      h1: h1 ? {
        fontFamily: window.getComputedStyle(h1).fontFamily,
        fontSize: window.getComputedStyle(h1).fontSize,
        fontWeight: window.getComputedStyle(h1).fontWeight,
        color: window.getComputedStyle(h1).color,
        letterSpacing: window.getComputedStyle(h1).letterSpacing
      } : null,
      h2: h2 ? {
        fontFamily: window.getComputedStyle(h2).fontFamily,
        fontSize: window.getComputedStyle(h2).fontSize,
        fontWeight: window.getComputedStyle(h2).fontWeight,
        color: window.getComputedStyle(h2).color
      } : null,
      h3: h3 ? {
        fontSize: window.getComputedStyle(h3).fontSize,
        fontWeight: window.getComputedStyle(h3).fontWeight,
        color: window.getComputedStyle(h3).color
      } : null,
      primaryButton: btn ? {
        fontFamily: window.getComputedStyle(btn).fontFamily,
        fontSize: window.getComputedStyle(btn).fontSize,
        fontWeight: window.getComputedStyle(btn).fontWeight,
        backgroundColor: window.getComputedStyle(btn).backgroundColor,
        color: window.getComputedStyle(btn).color,
        borderRadius: window.getComputedStyle(btn).borderRadius,
        padding: window.getComputedStyle(btn).padding
      } : null,
      cardSurface: card ? {
        backgroundColor: window.getComputedStyle(card).backgroundColor,
        borderColor: window.getComputedStyle(card).borderColor,
        borderRadius: window.getComputedStyle(card).borderRadius,
        boxShadow: window.getComputedStyle(card).boxShadow
      } : null
    };
  }, { routeName, viewportLabel });
};

test.describe('Portal-Wide Visual, Responsive & Accessibility Audit', () => {

  // Test 1: Desktop (1440px) Public & Authenticated Comprehensive Tour
  test('Audit 1: Desktop 1440px — Public & Workspace Visual Tour', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupMockApi(page);

    const routesToVisit = [
      { path: '/', label: 'public_home_1440' },
      { path: '/about', label: 'public_about_1440' },
      { path: '/login', label: 'public_login_1440' },
      { path: '/register', label: 'public_register_1440' },
      { path: '/laws', label: 'public_laws_1440' },
      { path: '/crimes', label: 'public_crimes_1440' },
      { path: '/cases', label: 'public_cases_1440' },
      { path: '/cases?slug=classified-marketplace-qr-fraud', label: 'public_case_detail_1440' },
      { path: '/prevention', label: 'public_prevention_1440' },
      { path: '/resources', label: 'public_resources_1440' },
      { path: '/dashboard', label: 'workspace_dashboard_1440' },
      { path: '/modules', label: 'workspace_modules_catalog_1440' },
      { path: '/modules/phishing-social-engineering', label: 'workspace_lesson_reading_1440' },
      { path: '/assessment/baseline', label: 'assessment_profile_1440' },
      { path: '/quizzes', label: 'workspace_quizzes_1440' },
      { path: '/workspace/counterfactuals', label: 'workspace_counterfactuals_1440' },
      { path: '/workspace/counterfactuals/cf-parcel-scam', label: 'workspace_counterfactual_studio_1440' }
    ];

    for (const r of routesToVisit) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const metrics = await inspectPageMetrics(page, r.path, 'desktop_1440');
      auditResults.computedStyles[`${r.label}`] = metrics;
      if (metrics.hasHorizontalOverflow) {
        auditResults.overflows.push({ route: r.path, viewport: '1440px', delta: metrics.overflowDelta });
      }

      const shotPath = path.join(SCREENSHOT_DIR, `${r.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshotsCaptured.push(path.basename(shotPath));
    }
  });

  // Test 2: Desktop (1280px) Core Journey Tour
  test('Audit 2: Desktop 1280px — Core Journey Tour', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await setupMockApi(page);

    const routes = [
      { path: '/', label: 'public_home_1280' },
      { path: '/dashboard', label: 'workspace_dashboard_1280' },
      { path: '/laws', label: 'public_laws_1280' },
      { path: '/assessment/baseline', label: 'assessment_profile_1280' },
      { path: '/quizzes', label: 'workspace_quizzes_1280' }
    ];

    for (const r of routes) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);

      const metrics = await inspectPageMetrics(page, r.path, 'desktop_1280');
      if (metrics.hasHorizontalOverflow) {
        auditResults.overflows.push({ route: r.path, viewport: '1280px', delta: metrics.overflowDelta });
      }

      const shotPath = path.join(SCREENSHOT_DIR, `${r.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshotsCaptured.push(path.basename(shotPath));
    }
  });

  // Test 3: Tablet (768px) Inspection
  test('Audit 3: Tablet 768px — Responsive Layout & Drawer Inspection', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupMockApi(page);

    const routes = [
      { path: '/', label: 'public_home_768' },
      { path: '/dashboard', label: 'workspace_dashboard_768' },
      { path: '/about', label: 'public_about_768' },
      { path: '/laws', label: 'public_laws_768' },
      { path: '/crimes', label: 'public_crimes_768' },
      { path: '/prevention', label: 'public_prevention_768' },
      { path: '/modules', label: 'workspace_modules_catalog_768' },
      { path: '/assessment/baseline', label: 'assessment_profile_768' },
      { path: '/quizzes', label: 'workspace_quizzes_768' }
    ];

    for (const r of routes) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const metrics = await inspectPageMetrics(page, r.path, 'tablet_768');
      if (metrics.hasHorizontalOverflow) {
        auditResults.overflows.push({ route: r.path, viewport: '768px', delta: metrics.overflowDelta });
      }

      const shotPath = path.join(SCREENSHOT_DIR, `${r.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshotsCaptured.push(path.basename(shotPath));
    }
  });

  // Test 4: Mobile (390px & 375px) Inspection & Overflow Safety
  test('Audit 4: Mobile 390px & 375px — Viewport Safety & Layout Stress', async ({ page }) => {
    await setupMockApi(page);

    // 390px Viewport (iPhone 12/13/14)
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileRoutes390 = [
      { path: '/', label: 'public_home_390' },
      { path: '/dashboard', label: 'workspace_dashboard_390' },
      { path: '/about', label: 'public_about_390' },
      { path: '/login', label: 'public_login_390' },
      { path: '/laws', label: 'public_laws_390' },
      { path: '/crimes', label: 'public_crimes_390' },
      { path: '/cases', label: 'public_cases_390' },
      { path: '/prevention', label: 'public_prevention_390' },
      { path: '/resources', label: 'public_resources_390' },
      { path: '/modules', label: 'workspace_modules_catalog_390' },
      { path: '/modules/phishing-social-engineering', label: 'workspace_lesson_reading_390' },
      { path: '/assessment/baseline', label: 'assessment_profile_390' },
      { path: '/quizzes', label: 'workspace_quizzes_390' },
      { path: '/workspace/counterfactuals', label: 'workspace_counterfactuals_390' }
    ];

    for (const r of mobileRoutes390) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const metrics = await inspectPageMetrics(page, r.path, 'mobile_390');
      if (metrics.hasHorizontalOverflow) {
        auditResults.overflows.push({ route: r.path, viewport: '390px', delta: metrics.overflowDelta });
      }

      const shotPath = path.join(SCREENSHOT_DIR, `${r.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshotsCaptured.push(path.basename(shotPath));
    }

    // 375px Viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileRoutes375 = [
      { path: '/', label: 'public_home_375' },
      { path: '/dashboard', label: 'workspace_dashboard_375' },
      { path: '/login', label: 'public_login_375' },
      { path: '/laws', label: 'public_laws_375' },
      { path: '/crimes', label: 'public_crimes_375' },
      { path: '/cases', label: 'public_cases_375' },
      { path: '/prevention', label: 'public_prevention_375' },
      { path: '/modules', label: 'workspace_modules_catalog_375' },
      { path: '/assessment/baseline', label: 'assessment_profile_375' }
    ];

    for (const r of mobileRoutes375) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      const metrics = await inspectPageMetrics(page, r.path, 'mobile_375');
      if (metrics.hasHorizontalOverflow) {
        auditResults.overflows.push({ route: r.path, viewport: '375px', delta: metrics.overflowDelta });
      }

      const shotPath = path.join(SCREENSHOT_DIR, `${r.label}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      auditResults.screenshotsCaptured.push(path.basename(shotPath));
    }
  });

  // Test 5: Automated Axe Core Accessibility Scans
  test('Audit 5: Automated Axe Accessibility Scans Across Key Surfaces', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await setupMockApi(page);

    const routesToScan = [
      { path: '/', name: 'Homepage' },
      { path: '/about', name: 'About' },
      { path: '/login', name: 'AuthSignIn' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/laws', name: 'Laws' },
      { path: '/crimes', name: 'Crimes' },
      { path: '/cases', name: 'Cases' },
      { path: '/prevention', name: 'Prevention' },
      { path: '/resources', name: 'Resources' },
      { path: '/modules', name: 'ModulesCatalog' },
      { path: '/modules/phishing-social-engineering', name: 'LessonReading' },
      { path: '/assessment/baseline', name: 'DigitalAwarenessProfile' },
      { path: '/quizzes', name: 'QuizStudio' }
    ];

    for (const r of routesToScan) {
      await page.goto(r.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      try {
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        auditResults.axeResults[r.name] = {
          route: r.path,
          violationsCount: axeResults.violations.length,
          violations: axeResults.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodesCount: v.nodes.length,
            sampleTarget: v.nodes[0]?.target || [],
            sampleHtml: v.nodes[0]?.html ? v.nodes[0].html.slice(0, 150) : ''
          }))
        };
      } catch (err) {
        auditResults.axeResults[r.name] = {
          route: r.path,
          error: err.message
        };
      }
    }

    // Write final collected metrics to disk
    fs.writeFileSync(AUDIT_DATA_PATH, JSON.stringify(auditResults, null, 2), 'utf-8');
  });

});

