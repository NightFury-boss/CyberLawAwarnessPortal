import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

const JOURNEY_STAGES = [
  {
    step: '01',
    stageName: 'Understand',
    title: 'Know the Law',
    desc: 'Understand your statutory rights, data protection principles, and legal boundaries under the IT Act 2000, DPDP Act 2023, and Bharatiya Nyaya Sanhita 2023 in plain language.',
    anchor: 'IT Act § 43, 66 · DPDP Act',
    pill: 'Statutory Base',
    link: '/laws',
    linkLabel: 'Explore Cyber Laws'
  },
  {
    step: '02',
    stageName: 'Recognise',
    title: 'Identify the Threat',
    desc: 'Spot deceptive psychological triggers including manufactured panic, spoofed utility alerts, fraudulent QR codes, and impersonation pretexts before taking action.',
    anchor: 'Phishing · Spoofing · Identity Theft',
    pill: 'Threat Patterns',
    link: '/crimes',
    linkLabel: 'Explore Threat Library'
  },
  {
    step: '03',
    stageName: 'Evaluate',
    title: 'Think Critically',
    desc: 'Apply the 60-second pause rule. Step back from pressured incoming calls or messages, verify independently through official portals, and analyze real incident timelines.',
    anchor: '60-Sec Pause · Independent Channel',
    pill: 'Critical Pause',
    link: '/cases',
    linkLabel: 'Review Case Studies'
  },
  {
    step: '04',
    stageName: 'Respond',
    title: 'Take Safer Action',
    desc: 'Execute structured containment: immediately lock compromised bank credentials with your provider, preserve evidence, and coordinate response via Helpline 1930.',
    anchor: 'Helpline 1930 · cybercrime.gov.in',
    pill: 'Defensive Action',
    link: '/prevention',
    linkLabel: 'Open Prevention Guides'
  }
];

export default function LearningJourneySection() {
  return (
    <section 
      id="learning-journey" 
      className="homepage-journey-section"
      aria-labelledby="journey-heading"
    >
      <div className="container">
        <Reveal variant="fade-up" className="journey-section-header">
          <span className="journey-eyebrow">Learning Framework</span>
          <h2 id="journey-heading" className="journey-title">
            From Legal Principles to Everyday Defence
          </h2>
          <p className="journey-subtitle">
            A continuous four-stage methodology designed to bridge primary Indian cyber legislation with confident, calm digital decisions.
          </p>
        </Reveal>

        <div className="journey-cards-grid" role="list" aria-label="Four-stage learning progression">
          {JOURNEY_STAGES.map((stage, idx) => (
            <Reveal 
              key={stage.step} 
              variant="fade-up" 
              delay={idx * 80}
              className="journey-card"
              role="listitem"
            >
              <div className="journey-card-top">
                <span className="journey-card-num" aria-hidden="true">{stage.step}</span>
                <span className="journey-card-pill">{stage.pill}</span>
              </div>

              <div className="journey-card-stage-name">{stage.stageName}</div>
              <h3 className="journey-card-title">{stage.title}</h3>
              <p className="journey-card-desc">{stage.desc}</p>
              
              <div className="journey-card-anchor" aria-label={`Key focus: ${stage.anchor}`}>
                {stage.anchor}
              </div>

              <Link 
                to={stage.link} 
                className="journey-card-link"
                aria-label={`${stage.linkLabel} — Stage ${stage.step} ${stage.title}`}
              >
                <span>{stage.linkLabel}</span>
                <span className="link-arrow" aria-hidden="true">&rarr;</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

