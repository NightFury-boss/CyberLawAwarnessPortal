import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Home({ user }) {
  const [laws, setLaws] = useState([]);
  const [crimes, setCrimes] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulation Preview State
  const [previewSelection, setPreviewSelection] = useState(null);
  const [previewFeedback, setPreviewFeedback] = useState('');

  // Intersection Observers for Viewport animations
  const [heroDraw, setHeroDraw] = useState(false);
  const [ecoAnimate, setEcoAnimate] = useState(false);
  const [anatomyAnimate, setAnatomyAnimate] = useState(false);
  const [timelineAnimate, setTimelineAnimate] = useState(false);
  const [lawMapAnimate, setLawMapAnimate] = useState(false);

  const ecoRef = useRef(null);
  const anatomyRef = useRef(null);
  const timelineRef = useRef(null);
  const lawMapRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [lawsData, crimesData, casesData] = await Promise.all([
          api.getLaws(),
          api.getCrimes(),
          api.getCases()
        ]);
        setLaws(lawsData || []);
        setCrimes(crimesData || []);
        setCases(casesData || []);
      } catch (err) {
        console.warn("Error loading dynamic data, using seeded fallbacks:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Trigger hero animation slightly delayed
    const t = setTimeout(() => setHeroDraw(true), 200);

    // Setup viewport triggers
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === ecoRef.current) setEcoAnimate(true);
          if (entry.target === anatomyRef.current) setAnatomyAnimate(true);
          if (entry.target === timelineRef.current) setTimelineAnimate(true);
          if (entry.target === lawMapRef.current) setLawMapAnimate(true);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (ecoRef.current) observer.observe(ecoRef.current);
    if (anatomyRef.current) observer.observe(anatomyRef.current);
    if (timelineRef.current) observer.observe(timelineRef.current);
    if (lawMapRef.current) observer.observe(lawMapRef.current);

    return () => {
      clearTimeout(t);
      observer.disconnect();
    };
  }, []);

  // Lookup references for seeds
  const phishingCrime = crimes.find(c => c.slug === 'phishing') || { _id: 'phishing', slug: 'phishing' };
  const vishingCase = cases.find(c => c.slug === 'fake-support-call-fraud') || { _id: 'fake-support-call-fraud', slug: 'fake-support-call-fraud' };
  const idTheftLaw = laws.find(l => l.sectionNumber === 'Section 66C') || { _id: 'Section-66C', sectionNumber: 'Section 66C' };

  // Simulation answers feedback mapper
  const handlePreviewChoice = (choice) => {
    setPreviewSelection(choice);
    if (choice === 'verify') {
      setPreviewFeedback("Feedback: Misspelled domain detected ('vvlth-bank' instead of 'wealthbank'). Excellent eye! Recognising domain anomalies is the first line of defence under Section 66D.");
    } else if (choice === 'open') {
      setPreviewFeedback("Feedback: Critical error. Opening links under urgency pressure bypasses Multi-Factor Authentication. Attackers leverage spoofed verification forms to harvest credentials.");
    } else if (choice === 'ignore') {
      setPreviewFeedback("Feedback: Good precaution, but threats should be flagged to authorities. Passive ignoring leaves other organization nodes vulnerable.");
    } else if (choice === 'report') {
      setPreviewFeedback("Feedback: Optimal response. Reporting fake alerts allows security filters to block the phishing IP across the entire gateway, preventing widespread incident impact.");
    }
  };

  return (
    <div className="page-entry" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '12px' }}>
              Cyber Law Awareness Portal
            </span>
            <h1 style={{ fontSize: '3rem', lineHeight: '1.15', color: 'var(--accent-navy)', marginBottom: '16px' }}>
              Understand the law.<br />
              Recognize the threat.<br />
              Know what to do.
            </h1>
            <p className="text-secondary" style={{ fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '550px', marginBottom: '32px' }}>
              A learning platform for Indian cyber law, cybercrime awareness, real-world incidents, prevention, and interactive cyber-safety assessment.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link to={user ? "/assessment/baseline" : "/register"} className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: '600' }}>
                {user ? "Start Your Assessment" : "Register to Start"}
              </Link>
              <Link to="/laws" className="btn btn-secondary" style={{ padding: '12px 28px', fontWeight: '600' }}>
                Explore Cyber Laws
              </Link>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '24px' }}>
              * Learn the rules. Recognize the pattern. Pause before you act.
            </p>
          </div>

          {/* Right Column: Information Flow Graphic */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="280" height="340" viewBox="0 0 280 340" style={{ maxWidth: '100%', overflow: 'visible' }}>
              {/* Path Tracing Connection line */}
              <path 
                d="M 140 30 L 140 310" 
                fill="none" 
                stroke="var(--accent-navy)" 
                strokeWidth="2.5" 
                strokeDasharray="300"
                strokeDashoffset={heroDraw ? "0" : "300"}
                style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {/* Node 1: LAW */}
              <circle cx="140" cy="30" r={heroDraw ? "14" : "0"} fill="var(--accent-navy)" style={{ transition: 'all 0.5s ease 0.2s' }} />
              <text x="140" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">L</text>
              <text x="160" y="33" textAnchor="start" fill="var(--accent-navy)" fontSize="11" fontWeight="bold" style={{ opacity: heroDraw ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>LAW</text>

              {/* Node 2: THREAT */}
              <circle cx="140" cy="100" r={heroDraw ? "14" : "0"} fill="#ef4444" style={{ transition: 'all 0.5s ease 0.5s' }} />
              <text x="140" y="104" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">T</text>
              <text x="160" y="103" textAnchor="start" fill="var(--text-main)" fontSize="11" fontWeight="bold" style={{ opacity: heroDraw ? 1 : 0, transition: 'opacity 0.5s ease 0.7s' }}>THREAT</text>

              {/* Node 3: DECISION */}
              <circle cx="140" cy="170" r={heroDraw ? "14" : "0"} fill="#f59e0b" style={{ transition: 'all 0.5s ease 0.8s' }} />
              <text x="140" y="174" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">D</text>
              <text x="160" y="173" textAnchor="start" fill="var(--text-main)" fontSize="11" fontWeight="bold" style={{ opacity: heroDraw ? 1 : 0, transition: 'opacity 0.5s ease 1s' }}>DECISION</text>

              {/* Node 4: LEARNING */}
              <circle cx="140" cy="240" r={heroDraw ? "14" : "0"} fill="#3b82f6" style={{ transition: 'all 0.5s ease 1.1s' }} />
              <text x="140" y="244" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">E</text>
              <text x="160" y="243" textAnchor="start" fill="var(--text-main)" fontSize="11" fontWeight="bold" style={{ opacity: heroDraw ? 1 : 0, transition: 'opacity 0.5s ease 1.3s' }}>LEARNING</text>

              {/* Node 5: IMPROVEMENT */}
              <circle cx="140" cy="310" r={heroDraw ? "16" : "0"} fill="#10b981" style={{ transition: 'all 0.5s ease 1.4s' }} />
              <text x="140" y="314" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">✓</text>
              <text x="160" y="313" textAnchor="start" fill="#10b981" fontSize="11" fontWeight="extrabold" style={{ opacity: heroDraw ? 1 : 0, transition: 'opacity 0.5s ease 1.6s' }}>IMPROVEMENT</text>
            </svg>
          </div>
        </div>
      </section>

      {/* 2. SECTION — HOW AWARE ARE YOU? */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '16px' }}>
              How Aware Are You?
            </h2>
            <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
              You can know the rules and still miss the warning signs. Start with a short cyber-awareness baseline and see how you respond to realistic digital situations.
            </p>
            <Link to={user ? "/assessment/baseline" : "/login"} className="btn btn-secondary" style={{ borderLeft: '4px solid var(--accent-navy)', padding: '10px 24px' }}>
              Take the Cyber Awareness Baseline &rarr;
            </Link>
          </div>

          {/* Right Column: Simulation Interactive Preview */}
          <div className="editorial-card" style={{ borderColor: 'var(--color-border-dark)', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              CYBER AWARENESS BASELINE PREVIEW
            </span>
            <div style={{ backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '12px', fontSize: '0.8rem' }}>
                <strong>From:</strong> security-alerts@vvlth-bank.com<br />
                <strong>Subject:</strong> Urgent: Verify Identity Immediately
              </div>
              <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>
                "Your online security token has expired. Verify your identity within 24 hours to prevent permanent account suspension."
              </p>
            </div>

            {/* Clickable Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={() => handlePreviewChoice('verify')} className={`btn btn-secondary ${previewSelection === 'verify' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Verify Sender
              </button>
              <button onClick={() => handlePreviewChoice('open')} className={`btn btn-secondary ${previewSelection === 'open' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Open Link
              </button>
              <button onClick={() => handlePreviewChoice('ignore')} className={`btn btn-secondary ${previewSelection === 'ignore' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Ignore
              </button>
              <button onClick={() => handlePreviewChoice('report')} className={`btn btn-secondary ${previewSelection === 'report' ? 'active' : ''}`} style={{ fontSize: '0.8rem', padding: '8px' }}>
                Report
              </button>
            </div>

            {/* Feedback presentation */}
            {previewFeedback && (
              <div className="alert alert-warning" style={{ marginTop: '16px', fontSize: '0.85rem', animation: 'fadeIn 0.3s ease' }}>
                {previewFeedback}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. SECTION — FROM READING TO RECOGNIZING */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--accent-navy-light)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Educational Philosophy
          </span>
          <h3 style={{ fontSize: '1.6rem', color: 'var(--accent-navy)', marginBottom: '16px' }}>
            From Reading to Recognizing
          </h3>
          <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Traditional content remains valuable. This portal adds an experiential layer.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.2fr 1.2fr', gap: '20px', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ color: 'var(--color-error)', display: 'block', marginBottom: '4px' }}>TRADITIONAL FLOW</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Read Provisions → Take Quiz → Move On</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>→</div>
            <div style={{ textAlign: 'left' }}>
              <strong style={{ color: 'var(--color-success)', display: 'block', marginBottom: '4px' }}>EXPERIENTIAL LEARNING</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Experience Threat → Reflect & Map → Learn Laws → Practice Safe Habits → Track Growth</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION — EXPLORE THE PORTAL */}
      <section ref={ecoRef} style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', marginBottom: '12px' }}>
            Explore the Learning Portal
          </h2>
          <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto 40px auto', fontSize: '1rem' }}>
            Click on any phase of the ecosystem to dive directly into that section.
          </p>

          {/* Ecosystem Grid Path */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', position: 'relative' }}>
            
            <Link to="/laws" className="editorial-card interactive" style={{ padding: '20px', textDecoration: 'none', borderTop: ecoAnimate ? '4px solid var(--accent-navy)' : '4px solid var(--color-border)', transition: 'all 0.5s ease 0.1s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--accent-navy)' }}>
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>CYBER LAWS</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Understand the legal framework</span>
            </Link>

            <Link to="/crimes" className="editorial-card interactive" style={{ padding: '20px', textDecoration: 'none', borderTop: ecoAnimate ? '4px solid #ef4444' : '4px solid var(--color-border)', transition: 'all 0.5s ease 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--accent-navy)' }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>CRIMES LIBRARY</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recognize common digital threats</span>
            </Link>

            <Link to="/cases" className="editorial-card interactive" style={{ padding: '20px', textDecoration: 'none', borderTop: ecoAnimate ? '4px solid #f59e0b' : '4px solid var(--color-border)', transition: 'all 0.5s ease 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--accent-navy)' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>CASE STUDIES</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>See how incidents unfold</span>
            </Link>

            <Link to="/prevention" className="editorial-card interactive" style={{ padding: '20px', textDecoration: 'none', borderTop: ecoAnimate ? '4px solid #3b82f6' : '4px solid var(--color-border)', transition: 'all 0.5s ease 0.7s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--accent-navy)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 11 11 13 15 9" />
              </svg>
              <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>PREVENTION</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Learn practical responses</span>
            </Link>

            <Link to="/dashboard" className="editorial-card interactive" style={{ padding: '20px', textDecoration: 'none', borderTop: ecoAnimate ? '4px solid #10b981' : '4px solid var(--color-border)', transition: 'all 0.5s ease 0.9s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', color: 'var(--accent-navy)' }}>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              <strong style={{ display: 'block', color: 'var(--accent-navy)' }}>ASSESSMENT</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Test decisions & measure gains</span>
            </Link>

          </div>
        </div>
      </section>

      {/* 5. SECTION — FEATURED CYBERCRIME */}
      <section ref={anatomyRef} style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              FEATURED THREAT
            </span>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '16px' }}>
              Phishing & Domain Spoofing
            </h2>
            <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
              "A convincing message does not need to look obviously fake. It only needs to make you act before you verify."
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>1. Urgency</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Threatening immediate suspension or penalty.</span>
              </div>
              <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>2. Suspicious Domain</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Domains using typo-squatting or mock subdomains.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to={`/crimes#${phishingCrime.slug}`} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Explore Phishing Details
              </Link>
              <Link to="/laws#Section-66D" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                View related law (Section 66D) &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Attack Anatomy */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.5px' }}>
              ATTACK ANATOMY FLOW
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: anatomyAnimate ? 1 : 0, transform: anatomyAnimate ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s ease 0.1s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>1</div>
                <div>
                  <strong>CONTACT:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Attacker sends spoofed alert.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: anatomyAnimate ? 1 : 0, transform: anatomyAnimate ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s ease 0.3s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>2</div>
                <div>
                  <strong>URGENCY:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Creates artificial pressure/threat.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: anatomyAnimate ? 1 : 0, transform: anatomyAnimate ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s ease 0.5s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--accent-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>3</div>
                <div>
                  <strong>DECEPTION:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Presents fake authentication portal.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: anatomyAnimate ? 1 : 0, transform: anatomyAnimate ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s ease 0.7s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>4</div>
                <div>
                  <strong>USER ACTION:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>User submits credentials.</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: anatomyAnimate ? 1 : 0, transform: anatomyAnimate ? 'translateX(0)' : 'translateX(-20px)', transition: 'all 0.5s ease 0.9s' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>5</div>
                <div>
                  <strong>IMPACT:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identity / Account compromise.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION — FEATURED CASE FILE */}
      <section ref={timelineRef} style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '40px', alignItems: 'center' }}>
          
          {/* Left Column: Timeline mapping */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.5px' }}>
              INCIDENT TIMELINE FLOW
            </h4>
            <div style={{ position: 'relative', borderLeft: '2px dashed var(--color-border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ opacity: timelineAnimate ? 1 : 0, transform: timelineAnimate ? 'translateX(0)' : 'translateX(-15px)', transition: 'all 0.5s ease 0.1s' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', display: 'block' }}>STAGE 1</span>
                <strong>CONTACT</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Scammer impersonates technical customer support.</p>
              </div>
              <div style={{ opacity: timelineAnimate ? 1 : 0, transform: timelineAnimate ? 'translateX(0)' : 'translateX(-15px)', transition: 'all 0.5s ease 0.3s' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', display: 'block' }}>STAGE 2</span>
                <strong>PRESSURE</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Forces verification claims of immediate threat/loss.</p>
              </div>
              <div style={{ opacity: timelineAnimate ? 1 : 0, transform: timelineAnimate ? 'translateX(0)' : 'translateX(-15px)', transition: 'all 0.5s ease 0.5s' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', display: 'block' }}>STAGE 3</span>
                <strong>DECISION</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Target shares access credentials under panic.</p>
              </div>
              <div style={{ opacity: timelineAnimate ? 1 : 0, transform: timelineAnimate ? 'translateX(0)' : 'translateX(-15px)', transition: 'all 0.5s ease 0.7s' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#ef4444', display: 'block' }}>STAGE 4</span>
                <strong>DISCOVERY</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Bank records reveal unauthorized transfer transactions.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Case description */}
          <div>
            <div style={{ display: 'inline-block', backgroundColor: 'var(--accent-navy)', color: 'white', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '3px', marginBottom: '12px' }}>
              CASE FILE 014
            </div>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '12px' }}>
              The Fake Customer Support Vishing
            </h2>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
              Financial Fraud · Voice Impersonation
            </span>
            <p className="text-secondary" style={{ fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px' }}>
              A routine-looking customer service interaction became risky after a series of small decisions. Attackers weaponized vishing calling numbers to mimic official banks.
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to={`/cases#${vishingCase.slug}`} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Read the Case study
              </Link>
              <Link to="/prevention" style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                Explore prevention guide &rarr;
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 7. SECTION — CYBER LAW IN CONTEXT */}
      <section ref={lawMapRef} style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              UNDERSTAND THE LAW IN CONTEXT
            </span>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '16px' }}>
              Identity Theft (Section 66C)
            </h2>
            
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '4px', borderLeft: '4px solid var(--accent-navy)', marginBottom: '24px' }}>
              <strong style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>IN SIMPLE TERMS</strong>
              <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                Section 66C specifies punishment for identity theft. If someone dishonestly uses another person's password, digital signature, or unique identification feature (like Biometrics or Aadhaar), they can be imprisoned for up to 3 years and fined up to ₹1 Lakh.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Link to={`/laws#${idTheftLaw.sectionNumber.replace(/\s+/g, '-')}`} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Explore Cyber Laws
              </Link>
              <Link to={`/crimes#identity-theft`} style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                View Identity Theft Crime &rarr;
              </Link>
            </div>
          </div>

          {/* Right Column: Connection Mapper */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '0.5px' }}>
              LAW CONNECTION RELATIONSHIP
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="editorial-card" style={{ padding: '16px', border: '1px solid var(--color-border)', backgroundColor: 'white', opacity: lawMapAnimate ? 1 : 0, transition: 'all 0.5s ease 0.1s' }}>
                <strong style={{ color: 'var(--accent-navy)' }}>Section 66C</strong>
                <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)' }}>Prohibits dishonest digital identity theft.</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)', margin: '-10px 0', opacity: lawMapAnimate ? 1 : 0, transition: 'all 0.5s ease 0.3s' }}>&darr;</div>
              <div className="editorial-card" style={{ padding: '16px', border: '1px solid var(--color-border)', backgroundColor: 'white', opacity: lawMapAnimate ? 1 : 0, transition: 'all 0.5s ease 0.5s' }}>
                <strong style={{ color: '#ef4444' }}>Credential Harvesting</strong>
                <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)' }}>Threat method used to steal profiles.</span>
              </div>
              <div style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)', margin: '-10px 0', opacity: lawMapAnimate ? 1 : 0, transition: 'all 0.5s ease 0.7s' }}>&darr;</div>
              <div className="editorial-card" style={{ padding: '16px', border: '1px solid var(--color-border)', backgroundColor: 'white', opacity: lawMapAnimate ? 1 : 0, transition: 'all 0.5s ease 0.9s' }}>
                <strong style={{ color: '#10b981' }}>Two-Factor authentication</strong>
                <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)' }}>MFA blocks compromise even if passwords leak.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION — WHAT MAKES THIS DIFFERENT */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--accent-navy)', marginBottom: '40px' }}>
            What Makes This Platform Different?
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'left' }}>
            
            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-border-dark)', display: 'block', marginBottom: '8px' }}>01</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>UNDERSTAND</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Learn legal concepts in plain language. Read provisions stripped of confusing jargon.
              </p>
            </div>

            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-border-dark)', display: 'block', marginBottom: '8px' }}>02</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>RECOGNIZE</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                See how cybercrime patterns appear in everyday situations before you interact.
              </p>
            </div>

            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-border-dark)', display: 'block', marginBottom: '8px' }}>03</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>RESPOND</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Learn what practical steps to take. Follow responsive action guides to secure files.
              </p>
            </div>

            <div style={{ padding: '10px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-border-dark)', display: 'block', marginBottom: '8px' }}>04</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>IMPROVE</strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                Measure awareness before and after learning. Keep track of specific security habit progress.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 9. SECTION — PERSONALIZED LEARNING */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          {user ? (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                RECOMMENDED FOR YOU
              </span>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-navy)' }}>
                Continue Your Learning Profile
              </h2>
              <p className="text-secondary" style={{ fontSize: '0.95rem', marginBottom: '24px' }}>
                Review recommended cybercrime models, track completed quiz results, and complete cyber awareness assessments inside your dashboard.
              </p>
              <Link to="/dashboard" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Continue Learning
              </Link>
            </div>
          ) : (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                GET STARTED
              </span>
              <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--accent-navy)' }}>
                Personalized Learning Paths
              </h2>
              <p className="text-secondary" style={{ fontSize: '0.95rem', marginBottom: '24px' }}>
                Complete your baseline assessment to receive personalized learning recommendations tailored to your security habits.
              </p>
              <Link to="/register" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                Start Assessment
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 10. SECTION — OFFICIAL RESOURCES */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.8rem', color: 'var(--accent-navy)', marginBottom: '12px' }}>
              Need Official Information?
            </h3>
            <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              This portal provides educational guidance. For authoritative legal legislation and official cyber fraud reporting, use relevant government sources.
            </p>
          </div>

          {/* Links Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <a href="https://www.indiacode.nic.in" target="_blank" rel="noopener noreferrer" className="editorial-card interactive" style={{ padding: '16px', textDecoration: 'none', borderLeft: '4px solid var(--accent-navy)' }}>
              <strong>India Code Portal</strong>
              <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>Legislative Acts repository.</span>
            </a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="editorial-card interactive" style={{ padding: '16px', textDecoration: 'none', borderLeft: '4px solid #ef4444' }}>
              <strong>National Cyber Crime Portal</strong>
              <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>Official fraud reporting helpline.</span>
            </a>
            <a href="https://www.cert-in.org.in" target="_blank" rel="noopener noreferrer" className="editorial-card interactive" style={{ padding: '16px', textDecoration: 'none', borderLeft: '4px solid #f59e0b' }}>
              <strong>CERT-In Official</strong>
              <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>National computer security advisories.</span>
            </a>
            <a href="https://www.meity.gov.in" target="_blank" rel="noopener noreferrer" className="editorial-card interactive" style={{ padding: '16px', textDecoration: 'none', borderLeft: '4px solid #3b82f6' }}>
              <strong>MeitY Government</strong>
              <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-muted)', marginTop: '4px' }}>Ministry of IT policy updates.</span>
            </a>
          </div>
        </div>
      </section>

      {/* 11. HOMEPAGE FOOTER CTA */}
      <section style={{ padding: '60px 0', textAlign: 'center', backgroundColor: 'var(--accent-navy-light)' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--accent-navy)', marginBottom: '12px' }}>
            Ready to Start?
          </h2>
          <p className="text-secondary" style={{ fontSize: '1rem', marginBottom: '24px' }}>
            Learn the law. Recognize the pattern. Pause before you act.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to={user ? "/assessment/baseline" : "/register"} className="btn btn-primary" style={{ padding: '12px 28px', fontWeight: '600' }}>
              Start Assessment
            </Link>
            <Link to="/laws" className="btn btn-secondary" style={{ padding: '12px 28px', fontWeight: '600', backgroundColor: 'white' }}>
              Explore Cyber Laws
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
