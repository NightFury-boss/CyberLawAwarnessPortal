/**
 * Authoritative Indian Cyber Support & Official Resources Directory
 * 
 * Simple static directory structured strictly into four sections:
 * 1. Emergency Help
 * 2. Banking & Financial Complaints
 * 3. Cybersecurity
 * 4. Other Official Services (including State & UT Cyber Police)
 * 
 * Verified against primary statutory authorities:
 * - MHA / I4C (Helpline 1930 & cybercrime.gov.in)
 * - Reserve Bank of India (CMS Ombudsman Helpline 14448 & Sachet)
 * - NPCI (UPI Dispute Redressal)
 * - CERT-In (IT Act Section 70B & Cyber Swachhta Kendra)
 * - UIDAI (Helpline 1947 & myAadhaar)
 * - DoT Sanchar Saathi (Chakshu, TAFCOP & CEIR)
 * - NALSA (National Legal Aid Helpline 15100)
 */

export const DIRECTORY_SECTIONS = [
  {
    id: 'emergency-help',
    title: 'Emergency Help',
    description: 'Immediate reporting portals and toll-free short codes for active cyber incidents and financial fraud.',
    resources: [
      {
        id: 'helpline-1930',
        title: 'National Cyber Crime Helpline (1930)',
        authority: 'Ministry of Home Affairs / I4C',
        purpose: 'Toll-free emergency hotline to report unauthorized bank transactions immediately and trigger inter-bank hold alerts.',
        actionLabel: 'Dial 1930',
        url: 'tel:1930',
        isHelpline: true,
        contactText: 'Toll-Free Short Code: 1930'
      },
      {
        id: 'ncrp-portal',
        title: 'National Cyber Crime Reporting Portal',
        authority: 'Ministry of Home Affairs (MHA)',
        purpose: 'The central government portal to lodge formal cybercrime complaints online and track police inquiry status.',
        actionLabel: 'File a Complaint ↗',
        url: 'https://cybercrime.gov.in',
        isHelpline: false,
        contactText: 'cybercrime.gov.in'
      }
    ]
  },
  {
    id: 'banking-financial',
    title: 'Banking & Financial Complaints',
    description: 'Official grievance portals for unresolved bank disputes, unauthorized debits, and payment switch issues.',
    resources: [
      {
        id: 'rbi-cms',
        title: 'RBI Complaint Management System (CMS)',
        authority: 'Reserve Bank of India (RBI)',
        purpose: 'Escalate unresolved banking, credit card, or digital payment disputes to the RBI Ombudsman after 30 days of bank inaction.',
        actionLabel: 'Lodge RBI Complaint ↗',
        url: 'https://cms.rbi.org.in',
        isHelpline: false,
        contactText: 'RBI Contact Centre: 14448'
      },
      {
        id: 'npci-dispute',
        title: 'NPCI UPI Dispute Redressal Portal',
        authority: 'National Payments Corporation of India (NPCI)',
        purpose: 'Submit transaction-level dispute tickets using your 12-digit UPI UTR number for failed or uncredited digital transfers.',
        actionLabel: 'Lodge UPI Dispute ↗',
        url: 'https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism',
        isHelpline: false,
        contactText: 'npci.org.in'
      },
      {
        id: 'rbi-sachet',
        title: 'RBI Sachet Portal',
        authority: 'Reserve Bank of India / SLCC',
        purpose: 'Verify if a financial company or lending app is legitimately regulated by RBI, and report unauthorized deposit schemes.',
        actionLabel: 'Verify Entity on Sachet ↗',
        url: 'https://sachet.rbi.org.in',
        isHelpline: false,
        contactText: 'sachet.rbi.org.in'
      }
    ]
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    description: 'National incident coordination, system vulnerability advisories, and free device disinfection tools.',
    resources: [
      {
        id: 'cert-in',
        title: 'CERT-In Incident Desk',
        authority: 'Ministry of Electronics & IT (MeitY)',
        purpose: 'National agency under IT Act Section 70B for reporting system intrusions, ransomware infections, and data breaches.',
        actionLabel: 'Report Security Incident ↗',
        url: 'https://www.cert-in.org.in',
        isHelpline: false,
        contactText: 'incident@cert-in.org.in | 1800-11-4949'
      },
      {
        id: 'cyber-swachhta-kendra',
        title: 'Cyber Swachhta Kendra (CSK)',
        authority: 'CERT-In / MeitY',
        purpose: 'Free government-verified downloadable security tools to scan and remove botnets, rootkits, and malware from your devices.',
        actionLabel: 'Download Free Tools ↗',
        url: 'https://www.csk.gov.in',
        isHelpline: false,
        contactText: 'csk.gov.in'
      }
    ]
  },
  {
    id: 'other-services',
    title: 'Other Official Services',
    description: 'Identity protection, telecom registries, and national legal aid support.',
    resources: [
      {
        id: 'uidai',
        title: 'UIDAI Aadhaar Resident Portal',
        authority: 'Unique Identification Authority of India',
        purpose: 'Lock your Aadhaar biometrics to block unauthorized AePS withdrawals, audit authentication history, and file grievances.',
        actionLabel: 'Lock Biometrics on myAadhaar ↗',
        url: 'https://myaadhaar.uidai.gov.in',
        isHelpline: false,
        contactText: 'Aadhaar Helpline: 1947'
      },
      {
        id: 'sanchar-saathi',
        title: 'Sanchar Saathi (Chakshu, TAFCOP & CEIR)',
        authority: 'Department of Telecommunications (DoT)',
        purpose: 'Report scam SMS/calls on Chakshu, check active mobile SIM connections on TAFCOP, and block lost or stolen mobile phones on CEIR.',
        actionLabel: 'Open Sanchar Saathi ↗',
        url: 'https://sancharsaathi.gov.in',
        isHelpline: false,
        contactText: 'sancharsaathi.gov.in'
      },
      {
        id: 'nalsa-telelaw',
        title: 'NALSA & Tele-Law Free Legal Aid',
        authority: 'National Legal Services Authority & DoJ',
        purpose: 'Access free, government-sponsored pre-litigation legal counseling and court representation for eligible citizens.',
        actionLabel: 'Request Legal Aid ↗',
        url: 'https://nalsa.gov.in',
        isHelpline: false,
        contactText: 'National Legal Aid Helpline: 15100'
      }
    ]
  }
];

export const VERIFIED_STATE_CYBER_POLICE = [
  {
    state: 'Delhi (NCT)',
    unit: 'Delhi Police Cyber Crime Unit (IFSO / Special Cell)',
    url: 'https://cyber.delhipolice.gov.in',
    contact: '011-20892621'
  },
  {
    state: 'Maharashtra',
    unit: 'Maharashtra Cyber (State Nodal Cyber Police)',
    url: 'https://mahacyber.gov.in',
    contact: '022-22160080'
  },
  {
    state: 'Karnataka',
    unit: 'Karnataka CID Cyber Crime Division (Bengaluru)',
    url: 'https://ksp.karnataka.gov.in',
    contact: '080-22094498'
  },
  {
    state: 'Uttar Pradesh',
    unit: 'Uttar Pradesh Police Cyber Crime Headquarters (Lucknow)',
    url: 'https://uppolice.gov.in',
    contact: '0522-2214614'
  },
  {
    state: 'Tamil Nadu',
    unit: 'Tamil Nadu Police Cyber Crime Wing (Chennai)',
    url: 'https://eservices.tnpolice.gov.in',
    contact: '044-28447701'
  },
  {
    state: 'Telangana',
    unit: 'Telangana Cyber Security Bureau (TGCSB, Hyderabad)',
    url: 'https://tspolice.gov.in',
    contact: '040-27852435'
  },
  {
    state: 'West Bengal',
    unit: 'West Bengal Police Cyber Crime Division (CID, Kolkata)',
    url: 'https://wbpolice.gov.in',
    contact: '033-24795886'
  },
  {
    state: 'Gujarat',
    unit: 'Gujarat CID Crime Cyber Cell (Cyber AASHVAST)',
    url: 'https://cidcrime.gujarat.gov.in',
    contact: '079-23250798'
  },
  {
    state: 'Kerala',
    unit: 'Kerala Police State Cyberdome (Thiruvananthapuram)',
    url: 'https://keralapolice.gov.in',
    contact: '0471-2322222'
  },
  {
    state: 'Haryana',
    unit: 'Haryana Police State Cyber Crime Cell (Panchkula)',
    url: 'https://haryanapolice.gov.in',
    contact: '1930'
  },
  {
    state: 'Madhya Pradesh',
    unit: 'Madhya Pradesh Police State Cyber Crime Cell (Bhopal)',
    url: 'https://mppolice.gov.in',
    contact: '0755-2770248'
  },
  {
    state: 'Punjab',
    unit: 'Punjab Police State Cyber Crime Division (SAS Nagar)',
    url: 'https://punjabpolice.gov.in',
    contact: '1930'
  },
  {
    state: 'Rajasthan',
    unit: 'Rajasthan Police Cyber Crime Branch (Jaipur)',
    url: 'https://police.rajasthan.gov.in',
    contact: '1930'
  },
  {
    state: 'Andhra Pradesh',
    unit: 'Andhra Pradesh Police CID Cyber Crime Wing (Mangalagiri)',
    url: 'https://appolice.gov.in',
    contact: '1930'
  }
];
