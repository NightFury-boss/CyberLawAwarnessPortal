import React from 'react';
import { Link } from 'react-router-dom';
import HomeHero from '../components/home/HomeHero';
import DigitalMomentsSection from '../components/home/DigitalMomentsSection';
import EditorialRule from '../components/common/EditorialRule';
import Reveal from '../components/common/Reveal';
import ScrollLinkedIncidentCase from '../components/common/ScrollLinkedIncidentCase';

/**
 * Public Homepage for Cyber Law Awareness Portal.
 * 
 * Complies with Homepage Visual Revival & Refined Motion Pass:
 * 1. Editorial Hero (Headline dominant, warm off-white canvas, quiet 4-step Learning Flow)
 * 2. Everyday Digital Situations (Curated, behaviorally precise moments)
 * 3. Explore Portal Map (Editorial directory/list of 5 core public pillars with interactive hover underlines)
 * 4. Case & Prevention Value (Incident Analysis vs. Directional Three Prevention Phases)
 * 5. Trust & Authority (4 factual dimensions with settled 1930 Helpline callout)
 * 6. Closing Invitation CTA (Calm, echoing the 4-step learning path minimally)
 */
function Home({ user }) {
  return (
    <div className="homepage-wrapper">
      
      {/* 1. HERO SECTION: Dominant Headline, Warm Off-White Canvas, Quiet Learning Flow */}
      <HomeHero user={user} />

      {/* 2. DEDICATED SECTION: EVERYDAY DIGITAL SITUATIONS */}
      <DigitalMomentsSection />

      <div className="container">
        <EditorialRule spacing="lg" />
      </div>

      {/* 3. CONCRETE PORTAL MAP: EXPLORE WHAT YOU CAN LEARN (EDITORIAL DIRECTORY) */}
      <section 
        id="explore" 
        className="portal-explore-section" 
        aria-labelledby="explore-heading"
      >
        <div className="container">
          <Reveal variant="fade-up" className="explore-section-header">
            <span className="explore-eyebrow">Portal Curriculum</span>
            <h2 id="explore-heading" className="explore-title">Explore What You Can Learn</h2>
            <p className="explore-subtitle">
              Five interconnected knowledge areas designed to guide you from statutory provisions to everyday defensive habits.
            </p>
          </Reveal>

          {/* Editorial Directory / List Layout with Hover Underline & Number Movement */}
          <Reveal variant="fade-up" delay={100} className="explore-editorial-directory" role="list">
            {/* Area 1: Laws */}
            <article className="explore-directory-row" role="listitem" tabIndex={0}>
              <div className="explore-row-num" aria-hidden="true">01</div>
              <div className="explore-row-body">
                <div className="explore-row-title-wrap">
                  <h3 className="explore-row-name">Cyber Laws</h3>
                  <span className="explore-row-tag">Statutory Foundation</span>
                </div>
                <p className="explore-row-desc">
                  Understand legal rights, obligations, and statutory provisions under the Information Technology Act (2000) and Indian digital regulations in plain language.
                </p>
                <div className="explore-row-underline" aria-hidden="true" />
              </div>
              <div className="explore-row-action">
                <Link to="/laws" className="explore-row-link" aria-label="Explore Cyber Laws directory">
                  <span>Explore Laws</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>

            {/* Area 2: Cyber Crimes */}
            <article className="explore-directory-row" role="listitem" tabIndex={0}>
              <div className="explore-row-num" aria-hidden="true">02</div>
              <div className="explore-row-body">
                <div className="explore-row-title-wrap">
                  <h3 className="explore-row-name">Cyber Crimes</h3>
                  <span className="explore-row-tag">Threat Patterns & Recognition</span>
                </div>
                <p className="explore-row-desc">
                  Recognize common threat vectors including phishing, identity theft, financial fraud, impersonation, cyberstalking, and unauthorized data access.
                </p>
                <div className="explore-row-underline" aria-hidden="true" />
              </div>
              <div className="explore-row-action">
                <Link to="/crimes" className="explore-row-link" aria-label="Explore Cyber Crimes library">
                  <span>Explore Threat Library</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>

            {/* Area 3: Case Studies */}
            <article className="explore-directory-row" role="listitem" tabIndex={0}>
              <div className="explore-row-num" aria-hidden="true">03</div>
              <div className="explore-row-body">
                <div className="explore-row-title-wrap">
                  <h3 className="explore-row-name">Case Studies</h3>
                  <span className="explore-row-tag">Real Incident Analysis</span>
                </div>
                <p className="explore-row-desc">
                  Examine how real digital incidents unfold, see which warning indicators were missed, and evaluate how safer decision points change the outcome.
                </p>
                <div className="explore-row-underline" aria-hidden="true" />
              </div>
              <div className="explore-row-action">
                <Link to="/cases" className="explore-row-link" aria-label="Explore Case Studies archive">
                  <span>Explore Case Studies</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>

            {/* Area 4: Prevention */}
            <article className="explore-directory-row" role="listitem" tabIndex={0}>
              <div className="explore-row-num" aria-hidden="true">04</div>
              <div className="explore-row-body">
                <div className="explore-row-title-wrap">
                  <h3 className="explore-row-name">Prevention Centre</h3>
                  <span className="explore-row-tag">Practical Defensive Guidance</span>
                </div>
                <p className="explore-row-desc">
                  Practical guidance for what to do before, during, and after an incident. Master independent verification, containment steps, and defensive hygiene.
                </p>
                <div className="explore-row-underline" aria-hidden="true" />
              </div>
              <div className="explore-row-action">
                <Link to="/prevention" className="explore-row-link" aria-label="Explore Prevention Centre guidance">
                  <span>Explore Prevention Guides</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>

            {/* Area 5: Resources */}
            <article className="explore-directory-row" role="listitem" tabIndex={0}>
              <div className="explore-row-num" aria-hidden="true">05</div>
              <div className="explore-row-body">
                <div className="explore-row-title-wrap">
                  <h3 className="explore-row-name">Authoritative Resources</h3>
                  <span className="explore-row-tag">Verification & Reporting</span>
                </div>
                <p className="explore-row-desc">
                  Access direct links to official legislation repositories (India Code), the National Cyber Crime Reporting Portal (Helpline 1930), and CERT-In security advisories.
                </p>
                <div className="explore-row-underline" aria-hidden="true" />
              </div>
              <div className="explore-row-action">
                <Link to="/resources" className="explore-row-link" aria-label="Explore Authoritative Legal Resources">
                  <span>Explore Official Resources</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </article>
          </Reveal>
        </div>
      </section>

      <div className="container">
        <EditorialRule spacing="lg" />
      </div>

      {/* 4. CASE & PREVENTION VALUE SECTION: "From Legal Rules to Safer Decisions" */}
      <section 
        className="homepage-value-section" 
        aria-labelledby="value-heading"
      >
        <div className="container">
          <Reveal variant="fade-up" className="value-section-header">
            <span className="value-eyebrow">Practical Application</span>
            <h2 id="value-heading" className="value-title">From Legal Rules to Safer Decisions</h2>
            <p className="value-subtitle">
              Statutory provisions define what governs an incident. Prevention guidance teaches you what to do when an unexpected situation demands immediate action.
            </p>
          </Reveal>

          {/* SCROLL-LINKED INCIDENT DOSSIER: CASE FILE 014 */}
          <ScrollLinkedIncidentCase />

          {/* Defensive Protocol: The Three Phases of Incident Response */}
          <div style={{ marginTop: 'var(--space-2xl)' }}>
            <Reveal variant="fade-up" delay={80} className="prevention-protocol-panel">
              <div className="protocol-panel-header">
                <div>
                  <span className="value-col-badge">Defensive Protocol</span>
                  <h3 className="value-col-title">The Three Phases of Incident Response</h3>
                  <p className="value-col-lead" style={{ marginBottom: 0 }}>
                    Practical awareness structures your response before an attack begins, while it occurs, and after suspicion arises.
                  </p>
                </div>
                <Link to="/prevention" className="value-action-link" style={{ alignSelf: 'flex-start' }}>
                  <span>Explore Prevention Guidance</span>
                  <span className="link-arrow" aria-hidden="true">&rarr;</span>
                </Link>
              </div>

              {/* Directional Connector Rule: Before → During → After */}
              <div className="prevention-progression-connector" aria-hidden="true">
                <span className="connector-step">Before</span>
                <span className="connector-line" />
                <span className="connector-arrow">&rarr;</span>
                <span className="connector-step">During</span>
                <span className="connector-line" />
                <span className="connector-arrow">&rarr;</span>
                <span className="connector-step">After</span>
              </div>

              <div className="prevention-phases-list prevention-phases-row">
                <Link to="/prevention?phase=before" className="prevention-phase-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                  <div className="phase-header">
                    <span className="phase-indicator">BEFORE</span>
                    <h4 className="phase-name">Independent Verification</h4>
                  </div>
                  <p className="phase-desc">
                    Bookmark trusted portals directly. Assume incoming alerts claiming urgency require external verification.
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-navy)', fontWeight: '600', marginTop: 'auto', paddingTop: '8px' }}>
                    Open Protocol &rarr;
                  </span>
                </Link>

                <Link to="/prevention?phase=during" className="prevention-phase-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                  <div className="phase-header">
                    <span className="phase-indicator">DURING</span>
                    <h4 className="phase-name">Critical Pause & Refusal</h4>
                  </div>
                  <p className="phase-desc">
                    Never share one-time security codes, passwords, or remote screen-sharing access over incoming calls or messages.
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-navy)', fontWeight: '600', marginTop: 'auto', paddingTop: '8px' }}>
                    Open Protocol &rarr;
                  </span>
                </Link>

                <Link to="/prevention?phase=after" className="prevention-phase-card" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                  <div className="phase-header">
                    <span className="phase-indicator">AFTER</span>
                    <h4 className="phase-name">Containment & Official Reporting</h4>
                  </div>
                  <p className="phase-desc">
                    Freeze compromised credentials immediately with your service provider and report details to Helpline 1930.
                  </p>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-navy)', fontWeight: '600', marginTop: 'auto', paddingTop: '8px' }}>
                    Open Protocol &rarr;
                  </span>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="container">
        <EditorialRule spacing="lg" />
      </div>

      {/* 5. TRUST & AUTHORITY SECTION: Factual Dimensions & Calm Settled Callout */}
      <section 
        className="homepage-trust-section" 
        aria-labelledby="trust-heading"
      >
        <div className="container">
          <Reveal variant="fade-up" className="trust-section-header">
            <span className="trust-eyebrow">Trust & Transparency</span>
            <h2 id="trust-heading" className="trust-title">Grounded in Law, Incident Analysis, and Official Guidance</h2>
            <p className="trust-subtitle">
              Every concept on this portal is anchored in verified statutory references, documented incident records, and official government response channels.
            </p>
          </Reveal>

          <div className="trust-pillars-grid">
            <Reveal variant="fade-up" delay={60} className="trust-pillar-card">
              <div className="pillar-num">01</div>
              <h3 className="pillar-title">Legal Framework</h3>
              <p className="pillar-desc">
                Derived directly from primary legislation including the Information Technology Act (2000), digital amendment rules, and corresponding penal provisions.
              </p>
            </Reveal>

            <Reveal variant="fade-up" delay={120} className="trust-pillar-card">
              <div className="pillar-num">02</div>
              <h3 className="pillar-title">Case Studies & Incident Analysis</h3>
              <p className="pillar-desc">
                Deconstructed from documented cyber incident reports and judicial rulings to illustrate how attacks develop and how legal liabilities apply.
              </p>
            </Reveal>

            <Reveal variant="fade-up" delay={180} className="trust-pillar-card">
              <div className="pillar-num">03</div>
              <h3 className="pillar-title">Practical Prevention</h3>
              <p className="pillar-desc">
                Defensive hygiene guidelines follow standard information security best practices, zero-trust verification, and incident mitigation standards.
              </p>
            </Reveal>

            <Reveal variant="fade-up" delay={240} className="trust-pillar-card">
              <div className="pillar-num">04</div>
              <h3 className="pillar-title">Official Reporting & Response</h3>
              <p className="pillar-desc">
                Distinguishes immediate victim assistance through the National Cyber Crime Helpline (<span className="helpline-num-badge"><span className="helpline-pulse-dot" aria-hidden="true" />1930</span>) from national incident coordination via CERT-In.
              </p>
            </Reveal>
          </div>

          <Reveal variant="fade-up" delay={300} className="trust-footer-note">
            <span>Learn more about how our curriculum is structured: </span>
            <Link to="/about#method" className="trust-method-link">
              Read our educational methodology &rarr;
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 6. CLOSING INVITATION / START LEARNING CTA (Section 13) */}
      <section className="homepage-closing-cta" aria-labelledby="cta-heading">
        <div className="container">
          <Reveal variant="fade-up" className="closing-cta-card">
            <span className="closing-cta-eyebrow">Next Steps</span>

            {/* Minimal Learning Path Echo (Law → Situation → Verification → Safer Action) */}
            <div className="cta-path-echo" aria-hidden="true">
              <span className="echo-node">01 Law</span>
              <span className="echo-sep">&rarr;</span>
              <span className="echo-node">02 Real Situation</span>
              <span className="echo-sep">&rarr;</span>
              <span className="echo-node">03 Verification</span>
              <span className="echo-sep">&rarr;</span>
              <span className="echo-node echo-node-active">04 Safer Action</span>
            </div>

            <h2 id="cta-heading" className="closing-cta-title">
              Ready to learn how digital situations become safer decisions?
            </h2>
            <p className="closing-cta-desc">
              Start exploring our plain-language cyber law curriculum, or test your situational awareness with realistic decision scenarios.
            </p>

            <div className="closing-cta-buttons">
              <Link 
                to={user ? "/dashboard" : "/register"} 
                className="btn btn-primary closing-btn-primary"
              >
                <span>Start Learning</span>
                <span className="closing-btn-arrow" aria-hidden="true">&rarr;</span>
              </Link>
              <Link 
                to="/laws" 
                className="btn btn-secondary closing-btn-secondary"
              >
                Explore Cyber Laws
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}

export default Home;
