import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WorkspaceBreadcrumb from '../components/WorkspaceBreadcrumb';
import EditorialPageHeader from '../components/common/EditorialPageHeader';
import EditorialRule from '../components/common/EditorialRule';
import {
  DIRECTORY_SECTIONS,
  VERIFIED_STATE_CYBER_POLICE
} from '../data/officialResourcesData';

function Resources() {
  const location = useLocation();
  const isWorkspaceContext = location.pathname.startsWith('/workspace');
  const getContextPath = (p) => (isWorkspaceContext ? `/workspace${p}` : p);

  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const selectedState = VERIFIED_STATE_CYBER_POLICE[selectedStateIndex] || VERIFIED_STATE_CYBER_POLICE[0];

  const handleCopyNumber = (text, id) => {
    const cleanNumber = text.replace(/[^0-9]/g, '') || text;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanNumber).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="resources-page-container">
      {/* ------------------------------------------------------------------
          PAGE HEADER
          ------------------------------------------------------------------ */}
      <EditorialPageHeader
        eyebrow="OFFICIAL ASSISTANCE DIRECTORY"
        title="Find the Right Help"
        subtitle="Official portals and support services for cybercrime, financial fraud and digital safety."
        description="Verified Indian government authorities, regulatory ombudsmen, and state cyber police desks."
      >
        <WorkspaceBreadcrumb />
      </EditorialPageHeader>

      <EditorialRule />

      {/* ------------------------------------------------------------------
          FOUR STATIC DIRECTORY SECTIONS
          ------------------------------------------------------------------ */}
      <div className="resources-sections-container">
        {DIRECTORY_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="resources-directory-section"
            aria-labelledby={`heading-${section.id}`}
          >
            <div className="resources-section-header">
              <h2 id={`heading-${section.id}`} className="resources-section-title">
                {section.title}
              </h2>
              {section.description && (
                <p className="resources-section-desc">
                  {section.description}
                </p>
              )}
            </div>

            {section.id === 'emergency-help' && (
              <div className="resources-emergency-advisory" role="region" aria-label="Emergency reporting advisory">
                <div className="resources-emergency-advisory-title">
                  <span>Golden Hour Response Protocol (First 2–3 Hours)</span>
                </div>
                <p className="resources-emergency-advisory-text">
                  In financial cyber fraud, reporting immediately through helpline <strong>1930</strong> or <strong>cybercrime.gov.in</strong> triggers automated inter-bank hold alerts via CFCFRMS across destination accounts. Time is critical: reporting within the first 2–3 hours significantly increases the probability that recipient banks can freeze suspect transfers before cash withdrawal.
                </p>
                <p className="resources-emergency-advisory-text">
                  <strong>Statutory Notice:</strong> Registration on the portal or helpline coordinates rapid alert transmission to participating banks, but does not guarantee that funds will be frozen, reversed, or recovered. Fund restitution typically requires judicial release orders under BNSS Sections 497/503.
                </p>
                <p className="resources-emergency-disclaimer">
                  <strong>Educational Awareness Disclaimer:</strong> This directory and portal are provided strictly for public educational and civic awareness purposes and do not constitute formal legal advice or institutional representation.
                </p>
              </div>
            )}

            <div className="resources-grid">
              {section.resources.map((res) => (
                <article key={res.id} className="resource-mini-card">
                  <div className="resource-card-main">
                    <span className="resource-card-authority">{res.authority}</span>
                    <h3 className="resource-card-title">{res.title}</h3>
                    <p className="resource-card-purpose">{res.purpose}</p>
                  </div>

                  <div className="resource-card-footer">
                    {res.contactText && (
                      <span className="resource-card-contact">{res.contactText}</span>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {res.isHelpline && (
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(res.contactText || '1930', res.id)}
                          className="resource-card-btn resource-card-btn-copy"
                          aria-label={`Copy ${res.contactText || '1930'}`}
                          style={{
                            cursor: 'pointer',
                            padding: '8px 14px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border, #D9CBB1)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-primary, #26352B)',
                            fontSize: '0.82rem',
                            fontWeight: '600'
                          }}
                        >
                          {copiedId === res.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                      <a
                        href={res.url}
                        target={res.isHelpline ? undefined : '_blank'}
                        rel={res.isHelpline ? undefined : 'noopener noreferrer'}
                        className={`resource-card-btn ${res.isHelpline ? 'resource-card-btn-call' : ''}`}
                      >
                        <span>
                          {res.actionLabel}{' '}
                          <span className="sr-only">for {res.title} {res.isHelpline ? '' : '(opens in a new tab)'}</span>
                        </span>
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* If this is the "Other Official Services" section, embed the State & UT Cyber Police selector */}
            {section.id === 'other-services' && (
              <div className="resources-state-section" aria-labelledby="state-police-heading">
                <div className="resources-state-header">
                  <div>
                    <h3 id="state-police-heading" className="resources-state-title">
                      State &amp; UT Cyber Police Directory
                    </h3>
                    <p className="resources-state-desc">
                      Select your state to find verified state nodal cybercrime desks and direct contact numbers.
                    </p>
                  </div>

                  <div className="resources-state-select-wrapper">
                    <label htmlFor="state-dropdown" className="sr-only">Select State or Union Territory</label>
                    <select
                      id="state-dropdown"
                      value={selectedStateIndex}
                      onChange={(e) => setSelectedStateIndex(Number(e.target.value))}
                      className="resources-state-select"
                    >
                      {VERIFIED_STATE_CYBER_POLICE.map((item, idx) => (
                        <option key={item.state} value={idx}>
                          {item.state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedState && (
                  <div className="resources-state-card">
                    <div className="resources-state-info">
                      <h4 className="resources-state-name">{selectedState.state} Cyber Police</h4>
                      <p className="resources-state-unit">{selectedState.unit}</p>
                    </div>

                    <div className="resources-state-actions">
                      <span className="resources-state-phone">
                        <span aria-hidden="true">📞</span> Contact: {selectedState.contact}
                      </span>
                      <a
                        href={selectedState.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resources-state-link"
                      >
                        <span>
                          Visit Police Portal{' '}
                          <span className="sr-only">for {selectedState.state} (opens in a new tab)</span>
                          <span aria-hidden="true">&rarr;</span>
                        </span>
                      </a>
                    </div>
                  </div>
                )}

                <p className="resources-state-note">
                  <em>Note: For any State or Union Territory without a dedicated portal, file complaints directly on the National Cyber Crime Reporting Portal (<a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="resources-inline-link">cybercrime.gov.in</a>) or call <strong>1930</strong>.</em>
                </p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* ------------------------------------------------------------------
          NEED INSTRUCTIONS? REFERRAL TO PREVENTION HANDBOOK
          ------------------------------------------------------------------ */}
      <section className="resources-instructions-referral" aria-labelledby="instructions-heading">
        <div className="resources-instructions-text">
          <h2 id="instructions-heading" className="resources-instructions-title">
            Not sure what to do after a cyber incident?
          </h2>
          <p className="resources-instructions-desc">
            For step-by-step containment playbooks (OTP shared, fraudulent debit, account hijacked), recognizing red flags, preserving digital evidence under BSA Section 63, or creating a police incident docket, visit the Prevention Handbook.
          </p>
        </div>

        <Link
          to={`${getContextPath('/prevention')}#playbooks`}
          className="resources-instructions-btn"
        >
          Open Prevention Handbook &rarr;
        </Link>
      </section>
    </div>
  );
}

export default Resources;
