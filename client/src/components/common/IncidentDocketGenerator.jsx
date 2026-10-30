import React, { useState, useEffect } from 'react';

const COMMON_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Punjab National Bank (PNB)',
  'Axis Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Kotak Mahindra Bank',
  'Union Bank of India',
  'Airtel Payments Bank',
  'Paytm Payments Bank',
  'Other Bank / Payment Institution'
];

const INCIDENT_CATEGORIES = [
  { id: 'unauthorized_upi', label: 'Unauthorized UPI Transfer / Debit', defaultPretext: 'Unauthorized debit occurred without valid authorization or after fraudulent prompt.' },
  { id: 'qr_marketplace', label: 'Marketplace / QR Code Scam (OLX/Buyer)', defaultPretext: 'Fraudster claimed to send money by sending a QR code, which actually debited my account.' },
  { id: 'digital_arrest', label: 'Digital Arrest / Police Impersonation', defaultPretext: 'Caller impersonated CBI / Police / Customs officer claiming a package had illegal drugs or SIM card was implicated in a crime.' },
  { id: 'remote_screen', label: 'Remote Access / Malicious App (AnyDesk/TeamViewer/APK)', defaultPretext: 'Fraudster induced downloading a remote support app or malicious APK under pretext of KYC / bill payment, capturing credentials.' },
  { id: 'fake_customer_care', label: 'Fake Customer Care / Helpline Spoof', defaultPretext: 'Dialed a fake customer service number found on search engine, caller induced transferring money for a refund.' },
  { id: 'part_time_job', label: 'Part-Time Job / Task / Investment Scam', defaultPretext: 'Fraudster offered online task/review work on Telegram, lured into depositing money for higher returns that were frozen.' },
  { id: 'sextortion_blackmail', label: 'Online Blackmail / Video Call Extortion', defaultPretext: 'Video call initiated, morphed intimate imagery created and used to extort money through immediate UPI demands.' },
  { id: 'other', label: 'Other Cyber Fraud / Unauthorized Transfer', defaultPretext: 'Fraudulent transaction executed through deception or unauthorized computer resource access.' }
];

export default function IncidentDocketGenerator({ initialCategory = 'unauthorized_upi' }) {
  const SESSION_STORAGE_KEY = 'cyber_portal_incident_docket_session';
  const OPTIN_STORAGE_KEY = 'cyber_portal_incident_docket_optin';

  // Privacy Architecture: In-memory React state is the strict default.
  // Optional opt-in to tab-session storage only if the user explicitly checks the box.
  const [persistSession, setPersistSession] = useState(() => {
    try {
      return sessionStorage.getItem(OPTIN_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const getDefaultFormData = () => ({
    incidentType: initialCategory,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    financialLoss: '',
    debitedBank: 'State Bank of India (SBI)',
    debitedBankCustom: '',
    accountLast4: '',
    transactionUtr: '',
    transferMode: 'UPI (GPay / PhonePe / Paytm / BHIM)',
    suspectBeneficiary: '',
    suspectPhone: '',
    suspectChannel: 'WhatsApp / Phone Call',
    suspectPretext: 'Unauthorized debit occurred without valid authorization or after fraudulent prompt.',
    evidenceChecklist: {
      smsSaved: true,
      statementSaved: false,
      qrSaved: false,
      callLogSaved: false,
      chatSaved: false,
      accountBlocked: false
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      if (sessionStorage.getItem(OPTIN_STORAGE_KEY) === 'true') {
        const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      // Fallback to in-memory defaults
    }
    return getDefaultFormData();
  });

  const [activeTab, setActiveTab] = useState('callScript'); // 'callScript' | 'writtenDocket'
  const [copyFeedback, setCopyFeedback] = useState({ success: false, error: false, message: '' });
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync to sessionStorage ONLY if explicitly opted in; otherwise purge sessionStorage
  useEffect(() => {
    try {
      if (persistSession) {
        sessionStorage.setItem(OPTIN_STORAGE_KEY, 'true');
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(formData));
      } else {
        sessionStorage.removeItem(OPTIN_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      // Ignore quota/disabled sessionStorage
    }
  }, [formData, persistSession]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (catId) => {
    const selected = INCIDENT_CATEGORIES.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      incidentType: catId,
      suspectPretext: selected ? selected.defaultPretext : prev.suspectPretext
    }));
  };

  const toggleEvidence = (key) => {
    setFormData(prev => ({
      ...prev,
      evidenceChecklist: {
        ...prev.evidenceChecklist,
        [key]: !prev.evidenceChecklist[key]
      }
    }));
  };

  const setTimeNow = () => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      incidentDate: now.toISOString().split('T')[0],
      incidentTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const handleReset = () => {
    if (window.confirm('Clear all entered incident details? This will immediately purge memory and any tab draft.')) {
      try {
        sessionStorage.removeItem(OPTIN_STORAGE_KEY);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {}
      setPersistSession(false);
      setFormData(getDefaultFormData());
      setCopyFeedback({ success: false, error: false, message: '' });
    }
  };

  const bankDisplayName = formData.debitedBank === 'Other Bank / Payment Institution'
    ? (formData.debitedBankCustom || 'Bank / Payment Institution')
    : formData.debitedBank;

  // Format UTR with spaced groups for telephone readability
  const formattedUtrForSpeech = formData.transactionUtr
    ? formData.transactionUtr.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim()
    : '[UTR / Ref Number]';

  // Generate 1930 Phone Script
  const generateCallScript = () => {
    const lossText = formData.financialLoss ? `₹${Number(formData.financialLoss).toLocaleString('en-IN')}` : '[Amount in ₹]';
    const accText = formData.accountLast4 ? `ending in XX${formData.accountLast4}` : '[Account last 4 digits]';
    const utrText = formData.transactionUtr ? formData.transactionUtr.trim() : '[Transaction Reference / UTR]';
    const benefText = formData.suspectBeneficiary ? formData.suspectBeneficiary.trim() : '[Fraudulent UPI ID / Beneficiary Account]';
    const suspectPhoneText = formData.suspectPhone ? formData.suspectPhone.trim() : '[Suspect Phone / Handle]';

    return `1930 OPERATOR BRIEFING SCRIPT:
-------------------------------------------------------
"Hello Officer, I am calling the National Cybercrime Helpline 1930 to urgently report an unauthorized financial cyber fraud transaction for CFCFRMS hold action.

1. INCIDENT OCCURRENCE:
   - Date: ${formData.incidentDate}
   - Time: Approximately ${formData.incidentTime}

2. DEBITED BANK & ACCOUNT:
   - Bank: ${bankDisplayName}
   - Account / Card Identifier: ${accText} (Last 4 digits only)
   - Transfer Mode: ${formData.transferMode}

3. TOTAL AMOUNT DEBITED:
   - ${lossText}

4. TRANSACTION REFERENCE / UTR:
   - UTR Number: ${utrText}
   - (Phonetic Breakdown: ${formattedUtrForSpeech})

5. FRAUDULENT BENEFICIARY / DESTINATION:
   - Beneficiary Account / UPI ID: ${benefText}

6. SUSPECT CONTACT & MODUS OPERANDI:
   - Contact / Handle: ${suspectPhoneText} (${formData.suspectChannel})
   - Summary: ${formData.suspectPretext}

7. ACTION REQUESTED:
   - Please log this transaction in the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) and issue an immediate inter-bank freeze / hold alert to the recipient bank's nodal desk before the stolen funds are moved across secondary mule accounts."

-------------------------------------------------------
CALL OPERATOR GUIDANCE NOTE:
Reporting within the first 2-3 hours ("Golden Hour") optimizes CFCFRMS inter-bank hold alerts. However, reporting at any subsequent time remains vital and accepted 24/7 on 1930. Account freezing depends on transaction clearance velocity; recovery cannot be guaranteed.`;
  };

  // Generate Written Formal Grievance Letter (for cybercrime.gov.in & Bank Branch Manager)
  const generateWrittenDocket = () => {
    const lossText = formData.financialLoss ? `₹${Number(formData.financialLoss).toLocaleString('en-IN')}` : '[Amount in ₹]';
    const accText = formData.accountLast4 ? `XX${formData.accountLast4}` : '[Last 4 digits]';
    const utrText = formData.transactionUtr ? formData.transactionUtr.trim() : '[Transaction Reference / UTR]';
    const benefText = formData.suspectBeneficiary ? formData.suspectBeneficiary.trim() : '[Fraudulent UPI ID / Account Number]';
    const suspectPhoneText = formData.suspectPhone ? formData.suspectPhone.trim() : '[Suspect Contact Number]';

    const evidenceItems = [];
    if (formData.evidenceChecklist.smsSaved) evidenceItems.push('Bank SMS debit alert containing transaction UTR and timestamp preserved.');
    if (formData.evidenceChecklist.statementSaved) evidenceItems.push('Screenshot of banking app debit entry / mini-statement extracted.');
    if (formData.evidenceChecklist.qrSaved) evidenceItems.push('Screenshot of fraudulent UPI QR code / beneficiary profile recorded.');
    if (formData.evidenceChecklist.callLogSaved) evidenceItems.push('Call log screenshot verifying incoming suspect call time and duration preserved.');
    if (formData.evidenceChecklist.chatSaved) evidenceItems.push('Complete WhatsApp / Telegram / SMS chat transcript exported and retained.');
    if (formData.evidenceChecklist.accountBlocked) evidenceItems.push('Compromised banking credentials / UPI ID / debit card blocked through official bank helpline.');

    return `FORMAL CYBER FRAUD INCIDENT REPORT & GRIEVANCE DOCKET
Document Generated: ${new Date().toLocaleString('en-IN')}
Submission Targets:
1. National Cybercrime Reporting Portal (cybercrime.gov.in / CFCFRMS Module)
2. Branch Manager & Nodal Grievance Officer, ${bankDisplayName}

================================================================================
I. INCIDENT SUMMARY & TRANSACTION PARTICULARS
================================================================================
- Nature of Cybercrime: ${INCIDENT_CATEGORIES.find(c => c.id === formData.incidentType)?.label || formData.incidentType}
- Date & Time of Occurrence: ${formData.incidentDate} at ${formData.incidentTime}
- Total Defrauded Amount: ${lossText}
- Transaction Mode: ${formData.transferMode}
- Debited Bank: ${bankDisplayName}
- Debited Account / Card Identification: ${accText} (Last 4 digits only)
- Transaction Reference Number (UTR / Ref ID): ${utrText}
- Destination Beneficiary / Recipient Account: ${benefText}

================================================================================
II. SUSPECT CONTACT DETAILS & MODUS OPERANDI
================================================================================
- Suspect Communication Channel: ${formData.suspectChannel}
- Suspect Phone Number / Social Handle: ${suspectPhoneText}
- Factual Chronology / Modus Operandi:
  "${formData.suspectPretext}"

================================================================================
III. EVIDENCE PRESERVATION INVENTORY
================================================================================
${evidenceItems.length > 0 ? evidenceItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n') : '1. Digital SMS transaction logs and timestamps preserved for forensic verification.'}

================================================================================
IV. STATUTORY PROVISIONS & STATUTORY REFERENCES (FOR LAW ENFORCEMENT & BANK)
================================================================================
The acts described above constitute cognizable offences and formal dispute grounds under:
1. Information Technology Act, 2000:
   - Section 66D: Cheating by personation by using computer resource (up to 3 years imprisonment and fine).
   - Section 66C: Identity theft and fraudulent use of electronic passwords / access codes.
   - Section 43: Unauthorized access and extraction of computer data.
2. Bharatiya Nyaya Sanhita, 2023 (BNS) [in force from 1 July 2024]:
   - Section 318: Cheating and dishonestly inducing delivery of property (replacing IPC Section 420).
   - Section 319: Cheating by personation (replacing IPC Section 419).
   - Section 336: Forgery of electronic record / document (replacing IPC Section 468).
3. Reserve Bank of India Regulatory Mandate:
   - RBI Circular DBR.No.Leg.BC.78/09.07.005/2017-18 dated July 6, 2017: Customer Protection – Limiting Liability of Customers in Unauthorised Electronic Banking Transactions. Mandates zero or limited liability when third-party unauthorized transactions are reported promptly.

================================================================================
V. FORMAL PRAYER & URGENT RELIEF SOUGHT
================================================================================
1. To National Cybercrime Coordination Centre (I4C) & Police:
   Issue an immediate CFCFRMS inter-bank hold alert to the destination bank nodal desk to freeze the fraudulent beneficiary account (${benefText}) and halt subsequent mule dissemination.
2. To ${bankDisplayName}:
   Initiate an immediate chargeback / recall request through the National Payments Corporation of India (NPCI) / clearing channel, log this unauthorized debit grievance, and protect customer liability under RBI regulations.

================================================================================
OPERATIONAL & PRIVACY DISCLAIMER:
- Reporting Window: While reporting during the initial 2-3 hour "Golden Hour" maximizes CFCFRMS inter-bank hold alert speed, reporting at any subsequent time remains legally valid, officially processed 24/7 on 1930 / cybercrime.gov.in, and necessary for formal police investigation and bank dispute protection.
- Recovery Realities: Inter-bank holds depend on transaction routing speed; fund recovery cannot be guaranteed.
- Strict Privacy: This docket was generated client-side through the Cyber Law Awareness Portal. Zero personal data or transaction digits were transmitted to or stored on any web server.
================================================================================`;
  };

  const copyToClipboard = async (text, successMsg) => {
    try {
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        copied = true;
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        copied = document.execCommand('copy');
        textArea.remove();
      }

      if (copied) {
        setCopyFeedback({ success: true, error: false, message: successMsg });
        setTimeout(() => setCopyFeedback({ success: false, error: false, message: '' }), 2500);
      } else {
        throw new Error('Clipboard copy command was not permitted by browser');
      }
    } catch (_err) {
      setCopyFeedback({
        success: false,
        error: true,
        message: 'Browser restricted automatic copying. Please select and copy the text manually from the preview box below.'
      });
      setTimeout(() => setCopyFeedback({ success: false, error: false, message: '' }), 6000);
    }
  };

  const downloadTextFile = () => {
    const content = activeTab === 'callScript' ? generateCallScript() : generateWrittenDocket();
    const filename = activeTab === 'callScript' ? '1930-helpline-call-script.txt' : 'cybercrime-incident-docket.txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="emergency-incident-docket"
      style={{
        backgroundColor: 'var(--bg-white)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        marginTop: '20px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-primary)'
      }}
    >
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: '0.68rem',
              fontWeight: '800',
              padding: '3px 8px',
              borderRadius: '3px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              Zero-Telemetry Emergency Tool
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: '600' }}>
              🔒 In-Memory Privacy by Default
            </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '4px 0', color: 'var(--text-primary)' }}>
            Golden Hour Incident Docket & 1930 Call Guide
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Compile structured evidence to read over <strong>1930</strong> or paste into <strong>cybercrime.gov.in</strong> during the critical 2–3 hour window.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              backgroundColor: isExpanded ? 'var(--bg-secondary)' : 'var(--color-primary)',
              color: isExpanded ? 'var(--text-primary)' : 'white',
              border: '1px solid var(--color-border-dark)',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isExpanded ? 'Collapse Form ▲' : 'Open Evidence Form ▼'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset and clear all entered details"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--color-border)',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Strict Privacy & Safety Notice */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '4px solid var(--color-warning)',
        padding: '14px 18px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '0.84rem',
        lineHeight: '1.6',
        color: 'var(--text-secondary)'
      }}>
        <strong style={{ color: 'var(--color-warning)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem' }}>
          ⚠️ Critical Safety & Operational Guidelines
        </strong>
        1. <strong>Strict Data Privacy (In-Memory by Default):</strong> All entered data remains strictly in your local browser memory. Zero information is transmitted over the internet, sent to our servers, or tracked.<br />
        2. <strong>Security Warning:</strong> Never enter complete 16-digit debit/credit card numbers or CVV codes. <strong>NEVER share your OTP, ATM PIN, or Netbanking passwords</strong> with anyone — genuine police officers, bank staff, and 1930 operators will NEVER request your PIN or OTP.<br />
        3. <strong>Golden Hour is NOT a Cutoff:</strong> Reporting within the first 2–3 hours (&quot;Golden Hour&quot;) maximizes the probability that coordinating desk officers can dispatch inter-bank hold alerts via CFCFRMS before funds cross into secondary mule accounts. However, <strong>it is not an exclusion deadline</strong>. You can and should report fraud at any time on 1930 or cybercrime.gov.in — late complaints are actively registered, investigated, and essential for legal remedies and banking dispute claims under RBI regulations.<br />
        4. <strong>Inter-Bank Hold Realities:</strong> While CFCFRMS hold alerts freeze destination bank accounts where transactions remain pending, <strong>fund recovery cannot be guaranteed</strong> and depends on transaction routing speeds.
      </div>

      {/* Interactive Form Section */}
      {isExpanded && (
        <div style={{ marginBottom: '24px', backgroundColor: 'var(--bg-primary)', padding: '20px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
          {/* Storage Persistence Opt-in Toggle */}
          <div style={{ marginBottom: '18px', padding: '10px 14px', backgroundColor: 'var(--bg-white)', borderRadius: '4px', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={persistSession}
                onChange={(e) => setPersistSession(e.target.checked)}
              />
              <span>Preserve draft across tab navigation during this browsing session (stored strictly in this tab&apos;s memory; purged when tab closes).</span>
            </label>
            <span style={{ fontSize: '0.72rem', color: persistSession ? 'var(--color-primary)' : 'var(--text-muted)' }}>
              {persistSession ? '✓ Tab Session Active' : 'Default: Pure In-Memory'}
            </span>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', marginTop: 0, marginBottom: '16px' }}>
            Step 1: Incident & Financial Identifiers
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Incident Type */}
            <div>
              <label htmlFor="docket-incident-type" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Incident Category:
              </label>
              <select
                id="docket-incident-type"
                value={formData.incidentType}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              >
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Total Stolen Amount */}
            <div>
              <label htmlFor="docket-financial-loss" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Total Amount Debited (₹):
              </label>
              <input
                id="docket-financial-loss"
                type="number"
                placeholder="e.g. 25000"
                value={formData.financialLoss}
                onChange={(e) => handleInputChange('financialLoss', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              />
            </div>

            {/* Incident Date & Time */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label htmlFor="docket-incident-date" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Date & Time of Debit:
                </label>
                <button
                  type="button"
                  onClick={setTimeNow}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Set to Just Now
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  id="docket-incident-date"
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                  style={{ flex: 1, padding: '7px 8px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.82rem' }}
                />
                <input
                  type="time"
                  value={formData.incidentTime}
                  aria-label="Incident time"
                  onChange={(e) => handleInputChange('incidentTime', e.target.value)}
                  style={{ width: '90px', padding: '7px 8px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.82rem' }}
                />
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', marginTop: '20px', marginBottom: '16px' }}>
            Step 2: Debited Account & Bank Details (Your Bank)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Debited Bank */}
            <div>
              <label htmlFor="docket-debited-bank" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Your Debited Bank:
              </label>
              <select
                id="docket-debited-bank"
                value={formData.debitedBank}
                onChange={(e) => handleInputChange('debitedBank', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              >
                {COMMON_BANKS.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
              {formData.debitedBank === 'Other Bank / Payment Institution' && (
                <input
                  type="text"
                  placeholder="Enter specific bank or payment bank name"
                  value={formData.debitedBankCustom}
                  onChange={(e) => handleInputChange('debitedBankCustom', e.target.value)}
                  style={{ width: '100%', marginTop: '6px', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', fontSize: '0.82rem' }}
                />
              )}
            </div>

            {/* Account / Card Last 4 Digits */}
            <div>
              <label htmlFor="docket-acc-digits" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Debited Account / Card (Last 4 digits only):
              </label>
              <input
                id="docket-acc-digits"
                type="text"
                maxLength={4}
                placeholder="e.g. 8492 (Do NOT enter full number)"
                value={formData.accountLast4}
                onChange={(e) => handleInputChange('accountLast4', e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              />
            </div>

            {/* Transaction UTR / Ref Number */}
            <div>
              <label htmlFor="docket-transaction-utr" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Transaction ID / 12-Digit UTR Number:
              </label>
              <input
                id="docket-transaction-utr"
                type="text"
                placeholder="e.g. 423984719283 (from bank SMS)"
                value={formData.transactionUtr}
                onChange={(e) => handleInputChange('transactionUtr', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem', fontFamily: 'monospace' }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Found in debit SMS (e.g., &quot;Ref: 4239...&quot; or &quot;UPI Ref: 4239...&quot;)
              </span>
            </div>

            {/* Transfer Mode */}
            <div>
              <label htmlFor="docket-transfer-mode" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Payment Transfer Mode:
              </label>
              <select
                id="docket-transfer-mode"
                value={formData.transferMode}
                onChange={(e) => handleInputChange('transferMode', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              >
                <option value="UPI (GPay / PhonePe / Paytm / BHIM)">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                <option value="IMPS / NEFT Net Banking">IMPS / NEFT Net Banking</option>
                <option value="Debit Card / Credit Card Online">Debit Card / Credit Card Online</option>
                <option value="ATM Cash Withdrawal">ATM Cash Withdrawal</option>
                <option value="Payment Gateway / Wallet">Payment Gateway / Wallet</option>
              </select>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', marginTop: '20px', marginBottom: '16px' }}>
            Step 3: Suspect & Destination Details (Fraudster)
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            {/* Beneficiary UPI / Account */}
            <div>
              <label htmlFor="docket-suspect-beneficiary" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Destination UPI ID / Beneficiary Account:
              </label>
              <input
                id="docket-suspect-beneficiary"
                type="text"
                placeholder="e.g. fraudster@okhdfcbank or 98210XXXX"
                value={formData.suspectBeneficiary}
                onChange={(e) => handleInputChange('suspectBeneficiary', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              />
            </div>

            {/* Suspect Phone / Handle */}
            <div>
              <label htmlFor="docket-suspect-phone" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Suspect Phone Number / WhatsApp / Telegram:
              </label>
              <input
                id="docket-suspect-phone"
                type="text"
                placeholder="e.g. +91 98765 43210 or @scam_handle"
                value={formData.suspectPhone}
                onChange={(e) => handleInputChange('suspectPhone', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              />
            </div>

            {/* Communication Vector */}
            <div>
              <label htmlFor="docket-suspect-channel" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Communication Channel:
              </label>
              <select
                id="docket-suspect-channel"
                value={formData.suspectChannel}
                onChange={(e) => handleInputChange('suspectChannel', e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem' }}
              >
                <option value="WhatsApp / Phone Call">WhatsApp / Direct Phone Call</option>
                <option value="Telegram Group / Direct Message">Telegram Group / Direct Message</option>
                <option value="SMS / Text Alert Link">SMS / Text Alert Link</option>
                <option value="Online Marketplace (OLX / Quikr / FB Marketplace)">Online Marketplace (OLX / Facebook)</option>
                <option value="Fake Search Engine Listing / Phishing Website">Fake Search Engine Listing / Phishing Website</option>
                <option value="Instagram / Dating App">Instagram / Dating App</option>
              </select>
            </div>
          </div>

          {/* Factual Chronology */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="docket-suspect-pretext" style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>
              Brief Modus Operandi (What did the fraudster claim or do?):
            </label>
            <textarea
              id="docket-suspect-pretext"
              rows={3}
              value={formData.suspectPretext}
              onChange={(e) => handleInputChange('suspectPretext', e.target.value)}
              placeholder="e.g. Scammer called claiming electricity bill was overdue, sent APK link that installed remote screen software..."
              style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--color-border-dark)', backgroundColor: 'var(--bg-white)', fontSize: '0.85rem', lineHeight: '1.4' }}
            />
          </div>

          {/* Evidence Checklist */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-primary)', marginTop: '20px', marginBottom: '12px' }}>
            Step 4: Rapid Evidence & Security Checklist
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.smsSaved}
                onChange={() => toggleEvidence('smsSaved')}
              />
              Bank SMS debit alert containing UTR saved
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.statementSaved}
                onChange={() => toggleEvidence('statementSaved')}
              />
              Screenshot of banking app debit entry saved
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.callLogSaved}
                onChange={() => toggleEvidence('callLogSaved')}
              />
              Call log showing caller number & time saved
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.chatSaved}
                onChange={() => toggleEvidence('chatSaved')}
              />
              WhatsApp / Telegram chat transcript saved
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.qrSaved}
                onChange={() => toggleEvidence('qrSaved')}
              />
              Fraudulent QR code / payment link saved
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer', color: 'var(--color-danger)', fontWeight: '600' }}>
              <input
                type="checkbox"
                checked={formData.evidenceChecklist.accountBlocked}
                onChange={() => toggleEvidence('accountBlocked')}
              />
              Compromised card/account blocked via official bank helpline
            </label>
          </div>
        </div>
      )}

      {/* Output Tabs & Action Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '2px solid var(--color-border)', paddingBottom: '12px', marginBottom: '16px' }}>
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('callScript')}
              aria-pressed={activeTab === 'callScript'}
              style={{
                backgroundColor: activeTab === 'callScript' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'callScript' ? 'white' : 'var(--text-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📞 1930 Call Briefing Script
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('writtenDocket')}
              aria-pressed={activeTab === 'writtenDocket'}
              style={{
                backgroundColor: activeTab === 'writtenDocket' ? 'var(--color-primary)' : 'var(--bg-secondary)',
                color: activeTab === 'writtenDocket' ? 'white' : 'var(--text-primary)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              📝 NCRP & Bank Dispute Docket
            </button>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => copyToClipboard(activeTab === 'callScript' ? generateCallScript() : generateWrittenDocket(), activeTab === 'callScript' ? '✓ Call Script Copied!' : '✓ Complaint Text Copied!')}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '4px',
                fontWeight: '600',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              📋 {activeTab === 'callScript' ? 'Copy Call Script' : 'Copy Complaint Text'}
            </button>

            <button
              type="button"
              onClick={downloadTextFile}
              title="Download formatted docket as a .txt file"
              style={{
                backgroundColor: 'var(--bg-white)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-border-dark)',
                padding: '7px 12px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              💾 Save .txt
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print formatted docket for bank or police visit"
              style={{
                backgroundColor: 'var(--bg-white)',
                color: 'var(--text-primary)',
                border: '1px solid var(--color-border-dark)',
                padding: '7px 12px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {/* Dynamic Copy Feedback Banner */}
        {copyFeedback.message && (
          <div style={{
            padding: '8px 14px',
            marginBottom: '12px',
            borderRadius: '4px',
            fontSize: '0.82rem',
            backgroundColor: copyFeedback.error ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${copyFeedback.error ? '#f87171' : '#86efac'}`,
            color: copyFeedback.error ? '#991b1b' : '#166534'
          }} role="alert">
            {copyFeedback.message}
          </div>
        )}

        {/* Live Output View */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: '6px',
          padding: '16px',
          fontFamily: 'monospace',
          fontSize: '0.84rem',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflowY: 'auto',
          color: 'var(--text-primary)'
        }}>
          {activeTab === 'callScript' ? generateCallScript() : generateWrittenDocket()}
        </div>

        {/* Call-to-Action Bar for Immediate Dialing */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Keep this script on screen while calling <strong>1930</strong> or filing at <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>cybercrime.gov.in</a>.
          </div>
          <a
            href="tel:1930"
            style={{
              backgroundColor: 'var(--color-danger, #dc2626)',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📞 Dial 1930 Helpline Now
          </a>
        </div>
      </div>
    </div>
  );
}
