/**
 * Authoritative Supplementary Law Seed Definitions
 * 
 * Static seed definitions for supplementary statutory provisions cited in
 * the Cyber Crimes Directory and learning pathways, prepared for future
 * Milestone 7 database migration.
 * 
 * Conforms strictly to server/models/LawSection.js schema.
 * Note: These definitions are maintained offline without active MongoDB writes
 * to preserve wave1Integrity.test.js 32-law seed invariants.
 */

const supplementaryLawsSeedData = [
  {
    sectionNumber: 'Section 67A',
    slug: 'in-it-67a-sexually-explicit',
    actName: 'Information Technology Act, 2000',
    officialTitle: 'Punishment for publishing or transmitting of material containing sexually explicit act, etc., in electronic form',
    role: 'Core Cyber Law',
    plainLanguageExplanation: 'Strictly penalizes publishing, transmitting, or causing to be published or transmitted electronic material that contains a sexually explicit act or conduct. Distinct from Section 67 (which penalizes general obscenity or prurient material) and Section 66E (which penalizes capturing or transmitting private bodily images without consent), Section 67A specifically requires depiction of an actual sexually explicit act or conduct. Crucially, a mere threat to publish without actual transmission does not constitute a completed Section 67A offence (which is prosecuted under criminal intimidation or extortion provisions), and applicability depends strictly on the factual content of the material.',
    officialText: 'Whoever publishes or transmits or causes to be published or transmitted in the electronic form any material which contains sexually explicit act or conduct shall be punished on first conviction with imprisonment of either description for a term which may extend to five years and with fine which may extend to ten lakh rupees and in the event of second or subsequent conviction with imprisonment of either description for a term which may extend to seven years and also with fine which may extend to ten lakh rupees.',
    whyItMatters: 'Provides severe statutory deterrence against the actual electronic circulation of sexually explicit recordings and non-consensual pornography. It does not automatically apply to every intimate photograph (which may fall under Section 66E or Section 67 depending on content), nor does an unexecuted blackmail threat alone satisfy this specific completed offence.',
    exampleScenario: 'A perpetrator acquires recorded footage depicting sexually explicit acts and actually uploads or transmits it across messaging groups without consent. (Where a perpetrator only threatens to release material to coerce payment without transmitting it, charges focus on extortion and criminal intimidation rather than completed Section 67A).',
    penaltyOrLegalEffect: 'First conviction: Imprisonment of either description up to 5 years and fine up to ₹10,00,000. Second or subsequent conviction: Imprisonment up to 7 years and fine up to ₹10,00,000. Cognizable and non-bailable under CrPC/BNSS Schedule I and Section 77B IT Act.',
    legalStatus: 'CURRENT',
    commencementStatus: 'In force. Inserted by the Information Technology (Amendment) Act, 2008 (Act 10 of 2009), effective 27th October 2009 (Notification S.O. 2689(E)).',
    amendmentStatus: 'Subject to statutory exceptions under Section 67 proviso for bona fide publications in the interest of science, literature, art, learning, or religious heritage. Completed offence requires proof of actual publication or transmission of sexually explicit acts.',
    keywords: [
      'Section 67A',
      'Sexually Explicit',
      'NCII',
      'Sextortion',
      'Non-Consensual Intimate Imagery',
      'Actual Transmission',
      'Electronic Form',
      'IT Act 2000'
    ],
    relatedCyberCrimes: ['sextortion', 'ncii-image-abuse'],
    relatedCaseStudies: ['sulli-deals-bulli-bai-investigation-delays'],
    relatedModules: ['content-protection-intermediary-liability', 'citizen-digital-defense-remediation']
  },
  {
    sectionNumber: 'BNS Section 351',
    slug: 'in-bns-351-criminal-intimidation',
    actName: 'Bharatiya Nyaya Sanhita, 2023',
    officialTitle: 'Criminal intimidation',
    role: 'Related Criminal Law',
    plainLanguageExplanation: 'Defines and penalizes criminal intimidation across four distinct statutory tiers. Subsection (1) defines the offence as threatening another with injury to person, reputation, or property (or to someone they are interested in) with intent to cause alarm or force an act/omission against legal entitlement. Subsection (2) provides general punishment up to 2 years imprisonment, fine, or both. Subsection (3) prescribes aggravated punishment up to 7 years imprisonment only where the threat specifically involves death, grievous hurt, arson, an offence punishable with 7+ years, or imputes unchastity to a woman. Subsection (4) provides up to 2 years consecutive imprisonment where the perpetrator intentionally conceals their identity or communicates anonymously. Ordinary commercial debt collection reminders do not constitute criminal intimidation unless they cross into intentional threats of unlawful injury to cause alarm.',
    officialText: '(1) Whoever threatens another with any injury to his person, reputation or property, or to the person or reputation of any one in whom that person is interested, with intent to cause alarm to that person, or to cause that person to do any act which he is not legally bound to do, or to omit to do any act which that person is legally entitled to do, as the means of avoiding the execution of such threat, commits criminal intimidation. (2) Imprisonment of either description for a term which may extend to two years, or with fine, or with both. (3) If the threat be to cause death or grievous hurt, or destruction of property by fire, or to impute unchastity to a woman: Imprisonment of either description for a term which may extend to seven years, or with fine, or with both. (4) Anonymous communication or concealed identity: Imprisonment of either description for a term which may extend to two years, in addition to the punishment provided under sub-section (2) or (3).',
    whyItMatters: 'Serves as the primary penal provision against coercive digital lending recovery practices. Threatening a borrower\'s reputation with morphed images does not automatically satisfy Subsection (3) unless it specifically imputes unchastity to a woman or threatens severe bodily harm; otherwise general reputational threats fall under Subsection (2). Automated or VoIP communications do not automatically constitute Subsection (4) anonymous threats without evidence of intentional concealment of identity.',
    exampleScenario: 'Recovery callers deliberately conceal their identity and send messages threatening physical harm to a borrower and threatening to circulate obscene morphed images imputing unchastity to female family members unless exorbitant unauthorized fees are transferred.',
    penaltyOrLegalEffect: 'Section 351(2) General: Imprisonment up to 2 years, fine, or both. Section 351(3) Aggravated (threat of death, grievous hurt, arson, or imputing unchastity to a woman): Imprisonment up to 7 years, fine, or both. Section 351(4) Concealed identity / anonymous threat: Additional consecutive imprisonment up to 2 years. Requires proof of intent to cause alarm; lawful debt recovery notices are excluded.',
    legalStatus: 'CURRENT',
    commencementStatus: 'In force since 1st July 2024. Notified under Ministry of Home Affairs Notification S.O. 850(E) dated 23rd February 2024, repealing and replacing IPC Sections 503, 506, and 507.',
    amendmentStatus: 'Substantive penal provision under the Bharatiya Nyaya Sanhita, 2023. Applicable to digital harassment, extortionate messaging, and unlawful coercion.',
    keywords: [
      'BNS Section 351',
      'Criminal Intimidation',
      'Loan App Extortion',
      'Reputational Threats',
      'Imputing Unchastity',
      'Concealed Identity',
      'BNS 2023',
      'IPC 506'
    ],
    relatedCyberCrimes: ['loan-app-extortion'],
    relatedCaseStudies: ['instant-loan-app-harassment', 'cyberabad-instant-loan-app-syndicates'],
    relatedModules: ['legal-foundations-cyber-citizenship', 'citizen-digital-defense-remediation']
  }
];

module.exports = { supplementaryLawsSeedData };

