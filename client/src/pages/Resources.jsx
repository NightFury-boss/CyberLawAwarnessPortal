import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PortalSearch from '../components/search/PortalSearch';
import { searchItems } from '../components/search/searchUtils';

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--color-border-light)', padding: '16px 0' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '1.05rem',
          fontWeight: '600',
          color: 'var(--accent-navy)',
          fontFamily: 'var(--font-sans)',
          outline: 'none'
        }}
      >
        <span>{question}</span>
        <span style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', display: 'flex', alignItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
      </button>
      {isOpen && (
        <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const data = await api.getResources();
      setResources(data);
    } catch (err) {
      setError('Failed to fetch reference resources.');
    } finally {
      setLoading(false);
    }
  };

  const enrichResource = (res) => {
    const titleLower = res.title.toLowerCase();
    if (titleLower.includes('reporting portal')) {
      return {
        ...res,
        authority: 'Ministry of Home Affairs, Government of India',
        sourceType: 'REPORTING SERVICE',
        badgeColor: 'var(--color-danger)',
        group: 'REPORT_GET_HELP',
        isOfficial: true
      };
    } else if (titleLower.includes('1930') || titleLower.includes('helpline')) {
      return {
        ...res,
        authority: 'National Cybercrime Coordination Centre (I4C)',
        sourceType: 'HELPLINE SERVICE',
        badgeColor: 'var(--color-info)',
        group: 'REPORT_GET_HELP',
        isOfficial: true
      };
    } else if (titleLower.includes('handbook')) {
      return {
        ...res,
        authority: 'MeitY, Government of India',
        sourceType: 'GOVERNMENT RESOURCE',
        badgeColor: 'var(--color-success)',
        group: 'CYBER_SAFETY_GUIDES',
        isOfficial: true
      };
    }
    return {
      ...res,
      authority: 'Verified Institution',
      sourceType: 'OFFICIAL GUIDE',
      badgeColor: 'var(--accent-navy)',
      group: 'REFERENCE_EDUCATIONAL',
      isOfficial: false
    };
  };

  const enrichedResources = resources.map(enrichResource);

  const resourcesSearchConfig = {
    title: 50,
    category: 10,
    description: 5,
    authority: 10,
    sourceType: 10
  };

  const filteredResources = searchItems(
    enrichedResources,
    searchQuery,
    resourcesSearchConfig,
    (res) => activeCategory === 'All' || res.category === activeCategory || res.sourceType === activeCategory
  );

  // Grouped lists for display when not searching
  const reportHelpResources = filteredResources.filter(r => r.group === 'REPORT_GET_HELP');
  const safetyGuides = filteredResources.filter(r => r.group === 'CYBER_SAFETY_GUIDES');
  const refEduMaterial = filteredResources.filter(r => r.group === 'REFERENCE_EDUCATIONAL');

  // Categories list for tabs
  const categoriesList = ['All', 'REPORTING SERVICE', 'HELPLINE SERVICE', 'GOVERNMENT RESOURCE'];

  return (
    <div className="container page-entry" style={{ padding: 'var(--space-xl) 0', maxWidth: '900px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)' }}>
      
      {/* Hero Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--accent-navy)', fontWeight: '800', display: 'block', marginBottom: '8px' }}>
          RESOURCE CENTRE
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 12px 0' }}>
          Official Cyber & Legal Resources
        </h1>
        <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6', margin: 0 }}>
          Find authoritative reporting services, legal sources, government guidance, cyber-safety publications, and official help channels.
        </p>
      </div>

      {/* Educational notice banner */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#fbf8f3',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid #ebdcb9',
        borderLeft: '4px solid #d49f3c',
        color: '#6e4f16',
        fontSize: '0.9rem',
        lineHeight: '1.5',
        marginBottom: 'var(--space-xl)'
      }}>
        <strong style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>
          EDUCATIONAL NOTICE
        </strong>
        This portal is an academic educational resource. For official reporting, legal filings, and current government guidance, use the verified official sources listed below.
      </div>

      {/* Dynamic branding tagline */}
      <div style={{ marginBottom: 'var(--space-xl)', borderLeft: '3px solid var(--accent-navy)', paddingLeft: '16px' }}>
        <p style={{ fontSize: '1rem', color: 'var(--accent-navy)', fontStyle: 'italic', margin: 0 }}>
          "Knowing where to verify information is part of knowing what to trust."
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Loading resources...</span>
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <>
          {/* Reusable PortalSearch */}
          <PortalSearch
            placeholder="Search official resources, reporting services, and cyber-safety guides..."
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            onClear={() => setSearchQuery('')}
            results={filteredResources}
            resultTypeLabel="resources matched"
            emptyHeader="NO MATCHING RESOURCES"
            emptyText="Try searching for reporting, cyber safety, legal guidance, helpline, or government."
            suggestions={['helpline', 'cybercrime', 'handbook', 'meity', 'rbi']}
            showFiltersToggle={true}
            showFilters={true}
            onFiltersToggle={() => {}}
            filtersDrawerContent={
              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>
                  Filter by Purpose
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border-dark)',
                        backgroundColor: activeCategory === cat ? 'var(--accent-navy)' : 'var(--bg-white)',
                        color: activeCategory === cat ? 'white' : 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            }
          />

          {/* Grouped lists */}
          {filteredResources.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              
              {/* Category 1: Report & Get Help */}
              {reportHelpResources.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                    Report & Get Help
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    If you have experienced cyber fraud or another cybercrime, use the appropriate official reporting and assistance channel.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {reportHelpResources.map((res) => (
                      <div key={res._id || res.id} style={{ padding: '20px', borderLeft: '4px solid var(--color-danger)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                              {res.sourceType}
                            </span>
                            {res.isOfficial && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>• GOVERNMENT SOURCE</span>}
                          </div>
                          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--accent-navy)', fontWeight: 'bold' }}>{res.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{res.description}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authority: <strong>{res.authority}</strong></span>
                        </div>
                        <a
                          href={res.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                          style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {res.link.startsWith('tel:') ? 'Call Helpline' : 'Open Official Resource'} ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Cyber Safety Guides */}
              {safetyGuides.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                    Cyber Safety Guides
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Official guidelines, citizen safety manuals, and preventative advisories issued by national cyber agencies.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {safetyGuides.map((res) => (
                      <div key={res._id || res.id} style={{ padding: '20px', borderLeft: '4px solid var(--color-success)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--color-success)', border: '1px solid var(--color-success)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                              {res.sourceType}
                            </span>
                            {res.isOfficial && <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>• GOVERNMENT SOURCE</span>}
                          </div>
                          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--accent-navy)', fontWeight: 'bold' }}>{res.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{res.description}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authority: <strong>{res.authority}</strong></span>
                        </div>
                        <a
                          href={res.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          {res.downloadable ? 'Download Document' : 'Open Resource'} ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Reference & Educational Material */}
              {refEduMaterial.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
                    Reference & Educational Material
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {refEduMaterial.map((res) => (
                      <div key={res._id || res.id} style={{ padding: '20px', borderLeft: '4px solid var(--accent-navy)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--accent-navy)', border: '1px solid var(--accent-navy)', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                              {res.sourceType}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px 0', color: 'var(--accent-navy)', fontWeight: 'bold' }}>{res.title}</h3>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>{res.description}</p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Authority: <strong>{res.authority}</strong></span>
                        </div>
                        <a
                          href={res.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Open Resource ↗
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* FAQ Section Accordions */}
      <div style={{ marginTop: 'var(--space-xxl)' }}>
        <h2 style={{ fontSize: '1.75rem', color: 'var(--accent-navy)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '16px' }}>
          Common Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FAQItem
            question="Is my bank liable if I share my OTP?"
            answer="Under Reserve Bank of India (RBI) guidelines, customer liability in unauthorized electronic transactions depends on reporting speed. If the loss is due to customer negligence (such as sharing an OTP), the customer bears the entire loss until the unauthorized transaction is reported to the bank. Reporting immediately (within 3 working days) limits customer liability as per bank policy. Refer to official RBI circulars for exact liability limits."
          />
          <FAQItem
            question="Can a police officer arrest me for an online comment?"
            answer="Section 66A of the IT Act, which permitted arrests for 'offensive' posts, was struck down as unconstitutional by the Supreme Court in the Shreya Singhal case (2015). However, hate speech, defamation, threats, or harassment remain punishable under standard sections of the Bharatiya Nyaya Sanhita (BNS) (formerly IPC) and IT Act provisions. Seek professional legal counsel for specific situations."
          />
          <FAQItem
            question="What is the 'Golden Hour' in cybercrime?"
            answer="Rapid reporting can significantly improve the chances of timely intervention in financial cyber fraud. If you contact the toll-free helpline 1930 immediately (often referred to as the initial critical window), coordinators can raise alerts across banking/payment gateways to block or freeze funds before transfer chains are completed."
          />
        </div>
      </div>

    </div>
  );
}

export default Resources;
