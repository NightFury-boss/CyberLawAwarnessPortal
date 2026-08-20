import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function About() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMounted, setIsMounted] = useState(false);
  const [scoreAnimate, setScoreAnimate] = useState(false);
  const [baselineVal, setBaselineVal] = useState(0);
  const [finalVal, setFinalVal] = useState(0);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.id === 'method') {
            setIsMounted(true);
          } else if (entry.target.id === 'assessment') {
            setScoreAnimate(true);
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const methodEl = document.getElementById('method');
    const assessmentEl = document.getElementById('assessment');
    if (methodEl) observer.observe(methodEl);
    if (assessmentEl) observer.observe(assessmentEl);

    return () => {
      if (methodEl) observer.unobserve(methodEl);
      if (assessmentEl) observer.unobserve(assessmentEl);
    };
  }, []);

  useEffect(() => {
    if (scoreAnimate) {
      let bStart = 0;
      const bEnd = 48;
      const bTimer = setInterval(() => {
        bStart += 2;
        if (bStart >= bEnd) {
          setBaselineVal(bEnd);
          clearInterval(bTimer);
        } else {
          setBaselineVal(bStart);
        }
      }, 20);

      let fStart = 0;
      const fEnd = 87;
      const fTimer = setInterval(() => {
        fStart += 3;
        if (fStart >= fEnd) {
          setFinalVal(fEnd);
          clearInterval(fTimer);
        } else {
          setFinalVal(fStart);
        }
      }, 20);

      return () => {
        clearInterval(bTimer);
        clearInterval(fTimer);
      };
    }
  }, [scoreAnimate]);

  const sections = [
    { id: 'overview', name: 'Overview' },
    { id: 'method', name: 'Methodology' },
    { id: 'assessment', name: 'Assessment' },
    { id: 'safety', name: 'Safety' },
    { id: 'project', name: 'Project Stack' }
  ];

  const loopSteps = [
    {
      label: 'EXPERIENCE',
      num: '01',
      summary: 'Encounter a realistic digital scenario.',
      desc: 'Users interact with controlled mock interfaces—such as clone login portals or spoofed UPI requests—observing threat indicators in real time.'
    },
    {
      label: 'UNDERSTAND',
      num: '02',
      summary: 'Examine decision warning flags.',
      desc: 'The platform highlights suspicious parameters (e.g. sender headers, urgency cues) and explains why choices were safe or unsafe.'
    },
    {
      label: 'LEARN',
      num: '03',
      summary: 'Study cybercrime and legal provisions.',
      desc: 'Users explore plain-language interpretations of Indian digital law (IT Act, BNS, DPDP) and examine investigative case archives.'
    },
    {
      label: 'PRACTICE',
      num: '04',
      summary: 'Lock in secure habits.',
      desc: 'Interactive quizzes, scenario assessments, and practical safety checklists help translate legal guidelines into digital hygiene.'
    },
    {
      label: 'IMPROVE',
      num: '05',
      summary: 'Measure baseline awareness delta.',
      desc: 'A final assessment compares threat recognition scores against initial baseline records to track growth.'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="page-entry" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* SECTION NAVIGATOR BAR */}
      <nav style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 100,
        padding: '12px 0'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Desktop Links */}
          <div style={{ display: 'flex', gap: '20px' }}>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: activeSection === sec.id ? 'var(--accent-navy)' : 'var(--text-secondary)',
                  fontWeight: activeSection === sec.id ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderBottom: activeSection === sec.id ? '2px solid var(--accent-navy)' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {sec.name}
              </button>
            ))}
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            PORTAL MANUAL
          </div>
        </div>
      </nav>

      {/* HERO / PROJECT STATEMENT */}
      <header style={{ padding: '60px 0 40px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--accent-navy)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              About the Project
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--accent-navy)', margin: '0 0 16px 0', lineHeight: '1.3' }}>
              Cyber awareness is more than knowing the rules. It is knowing what to do when the situation feels real.
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              The Cyber Law Awareness Portal combines plain-language Indian digital-law education, threat awareness profiles, incident case files, and safe interactive assessments.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/crimes" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '10px 20px', textDecoration: 'none' }}>
                Explore the Portal
              </Link>
              <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '10px 20px', textDecoration: 'none' }}>
                Start Assessment
              </Link>
            </div>
          </div>

          {/* Connected Path Minimal Graphic */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg width="240" height="200" viewBox="0 0 240 200">
              <path d="M 40 40 L 120 70 L 120 130 L 200 160" fill="none" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="4 3" />
              <path className="motion-draw" d="M 40 40 L 120 70 L 120 130 L 200 160" fill="none" stroke="var(--accent-navy)" strokeWidth="1.5" style={{ strokeDasharray: 300, strokeDashoffset: 300 }} />
              
              <circle cx="40" cy="40" r="5" fill="var(--accent-navy)" />
              <text x="50" y="44" fontSize="0.7rem" fontWeight="bold" fill="var(--text-secondary)">LAW</text>

              <circle cx="120" cy="70" r="5" fill="var(--accent-navy)" />
              <text x="130" y="74" fontSize="0.7rem" fontWeight="bold" fill="var(--text-secondary)">THREAT</text>

              <circle cx="120" cy="130" r="5" fill="var(--accent-navy)" />
              <text x="130" y="134" fontSize="0.7rem" fontWeight="bold" fill="var(--text-secondary)">DECISION</text>

              <circle cx="200" cy="160" r="5" fill="var(--color-success)" />
              <text x="180" y="180" fontSize="0.7rem" fontWeight="bold" fill="var(--color-success)">LEARNING</text>
            </svg>
          </div>
        </div>
      </header>

      {/* SECTION 1: WHY THIS PORTAL EXISTS */}
      <section id="overview" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Core Mission
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '16px' }}>
            Why This Portal Exists
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>
              Traditional cyber safety frameworks often separate technical guidelines from actual legal literacy. While reading statutory codes is vital, users frequently struggle to translate digital regulations into concrete habits when targeted under pressure by social engineering attacks.
            </p>
            <p>
              This project bridges the gap between digital law and risk decisions. By linking legislative provisions directly to threat profiles, incident case timelines, and prevention checklists, the portal empowers users to understand not just what the law states, but how to protect themselves online.
            </p>
          </div>

          {/* THE IDEA BEHIND THE PROJECT */}
          <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'var(--accent-navy-light)', borderLeft: '4px solid var(--accent-navy)', borderRadius: 'var(--radius-sm)' }}>
            <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-navy)', fontWeight: '800', letterSpacing: '1px', margin: '0 0 8px 0' }}>The Idea Behind the Project</h3>
            <h4 style={{ fontSize: '1.25rem', color: 'var(--accent-navy)', fontWeight: 'bold', margin: '0 0 12px 0' }}>"Knowing the law is only the beginning."</h4>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>A useful understanding of cyber law goes beyond remembering provisions. It means recognizing warning signs, understanding how incidents unfold, knowing what practical steps to take, and making better decisions when situations become difficult.</p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link to="/crimes" style={{ color: 'var(--accent-navy)', fontWeight: 'bold', textDecoration: 'underline', fontSize: '0.9rem' }}>
              Explore Cyber Crimes Registry &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE LEARNING LOOP */}
      <section id="method" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Methodology
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            The Experiential Learning Loop
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            The system guides users through a five-stage progress cycle designed to train rapid threat recognition and evaluate active safety responses.
          </p>

          {/* Loop horizontal visual map on desktop, stacked on mobile */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            {/* Desktop continuous path line */}
            <div 
              className="motion-progress"
              style={{
                position: 'absolute',
                top: '18px',
                left: '40px',
                zIndex: 1,
                display: 'block',
                height: '2px',
                backgroundColor: 'var(--accent-navy)',
                width: isMounted ? 'calc(100% - 80px)' : '0%',
                transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
            />

            {loopSteps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.label}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    border: 'none',
                    background: 'none',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    flex: '1 1 120px',
                    outline: 'none'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? 'var(--accent-navy)' : 'var(--bg-primary)',
                    border: isActive ? '2px solid var(--accent-navy)' : '2px solid var(--color-border)',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    marginBottom: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 0 3px rgba(10, 37, 64, 0.15)' : 'none'
                  }}>
                    {step.num}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isActive ? 'var(--accent-navy)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Details Panel card */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-navy)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Stage {loopSteps[activeStep].num} / {loopSteps[activeStep].label}
            </span>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {loopSteps[activeStep].summary}
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.6' }}>
              {loopSteps[activeStep].desc}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT MAKES THIS DIFFERENT */}
      <section id="difference" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Pedagogy Shift
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '24px', textAlign: 'center' }}>
            What Makes This Different
          </h2>

          {/* FROM vs TO Comparison Pathway */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '40px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '20px'
          }}>
            <div style={{ borderRight: '1px solid var(--color-border)', paddingRight: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-error)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Traditional Method
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                <span>Read Articles</span>
                <span>→</span>
                <span>Static Quiz</span>
                <span>→</span>
                <span>End</span>
              </div>
            </div>

            <div style={{ paddingLeft: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-success)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Portal Experience
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--accent-navy)', flexWrap: 'wrap' }}>
                <span>Experience</span>
                <span>→</span>
                <span>Reflect</span>
                <span>→</span>
                <span>Learn</span>
                <span>→</span>
                <span>Practice</span>
                <span>→</span>
                <span>Improve</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>
                Context Linkage
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                IT Act codes are taught alongside threat patterns and real-world incidents, never in isolated legal lists.
              </p>
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>
                Active Sandbox
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Encounter controlled visual threat situations to practice recognizing red flags safely.
              </p>
            </div>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>
                Quantified Growth
              </strong>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Evaluation monitors threat recognition baseline differences, delivering an action assessment score delta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: ASSESSMENT ENGINE */}
      <section id="assessment" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Signature Engine
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            Cyber Awareness Assessment Engine
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
            Instead of evaluating pure text recall, the portal monitors user actions when exposed to simulated threat vectors, providing a baseline-to-final score delta report.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', alignItems: 'center' }}>
            {/* Illustrative Journey Meter */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--color-border)',
              padding: '20px',
              borderRadius: '6px'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '16px' }}>
                Illustrative Example Journey
              </span>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Baseline Assessment</span>
                  <span>{baselineVal} / 100</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: scoreAnimate ? '48%' : '0%', height: '100%', backgroundColor: 'var(--color-error)', borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                  <span>Final Post-Learning</span>
                  <span>{finalVal} / 100</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: scoreAnimate ? '87%' : '0%', height: '100%', backgroundColor: 'var(--color-success)', borderRadius: '3px', transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                </div>
              </div>

              <div style={{
                textAlign: 'center',
                paddingTop: '12px',
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-success)',
                fontWeight: 'bold',
                fontSize: '0.85rem'
              }}>
                +39 Points Learning Delta Reported
              </div>
            </div>

            {/* Assessment Focus Dimensions */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px' }}>
                Assessment Domains Evaluated:
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Phishing Awareness</span>
                <span style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Social Engineering</span>
                <span style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Financial Safety</span>
                <span style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Credential Safety</span>
                <span style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>Digital Hygiene</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>
                *Note: These represent conceptual assessment categories configured to monitor user progression; they are not scientifically or clinically validated psychological measures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SAFE SIMULATION & PRIVACY */}
      <section id="safety" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Data Boundaries
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            Built to Teach, Not to Collect
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
            The threat recognition scenarios are built strictly for safe educational assessment. The portal is designed not to capture sensitive user secrets.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {/* Left: What we do */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-success)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>
                The Simulations Use
              </span>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Fictional banking institutions and mock sites.</li>
                <li>Controlled, client-side sandbox checks.</li>
                <li>Anonymous action choice tracker.</li>
                <li>Immediate educational feedback and red-flag reveal.</li>
              </ul>
            </div>

            {/* Right: What we exclude */}
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-error)', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>
                Excluded Safety Boundaries
              </span>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Passwords:</strong> No real credentials or logins.</li>
                <li><strong>OTP Values:</strong> No active messaging or verification.</li>
                <li><strong>Card Data:</strong> No payment portals or banking integrations.</li>
                <li><strong>Identity IDs:</strong> No Aadhaar, PAN, or government linkages.</li>
              </ul>
            </div>
          </div>
          
          {/* Subtle safety path visual */}
          <div style={{
            marginTop: '32px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            padding: '16px',
            fontSize: '0.8rem',
            textAlign: 'center'
          }}>
            <strong style={{ color: 'var(--accent-navy)', display: 'block', marginBottom: '6px' }}>Simulation Safety Pipeline</strong>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              USER INPUT → [Filter: Action Score Only] → DB STORE (Choice Metrics) → (Credentials Discarded)
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 6: COMPACT TECHNICAL & ACADEMIC VIEW */}
      <section id="project" style={{ padding: '60px 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Academic Profile
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            Academic Project Infrastructure
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '32px' }}>
            The portal uses a MERN-style architecture to support authentications, content structures, safety logs, and learning progress.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
            {/* Tech flow diagram */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '4px' }}>
                React Client Frontend SPA
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>&darr; (Secure REST API calls)</div>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '4px' }}>
                Node.js + Express Server API
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>&darr; (Mongoose Mapping Layer)</div>
              <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '4px' }}>
                MongoDB State Datastore
              </div>
            </div>

            {/* Academic focus highlights */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '10px' }}>
                Core Focus Modules:
              </h4>
              <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Indian Digital Laws:</strong> Covering IT Act provisions, BNS 2023, and DPDP 2023.</li>
                <li><strong>Threat Intelligence:</strong> Common cybercrime vectors (phishing, vishing, UPI scams).</li>
                <li><strong>Behavioral Metrics:</strong> Baseline action choices and feedback mapping.</li>
                <li><strong>Secure Implementation:</strong> Parameter isolation, role guards, and data separation.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PORTAL ECOSYSTEM CONNECTIONS */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
            Portal Ecosystem Path
          </span>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}>
            <Link to="/laws" style={{ color: 'var(--accent-navy)', textDecoration: 'none', borderBottom: '1px solid var(--accent-navy)' }}>LAW</Link>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <Link to="/crimes" style={{ color: 'var(--accent-navy)', textDecoration: 'none', borderBottom: '1px solid var(--accent-navy)' }}>CRIME</Link>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <Link to="/cases" style={{ color: 'var(--accent-navy)', textDecoration: 'none', borderBottom: '1px solid var(--accent-navy)' }}>CASE</Link>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <Link to="/prevention" style={{ color: 'var(--accent-navy)', textDecoration: 'none', borderBottom: '1px solid var(--accent-navy)' }}>PREVENTION</Link>
            <span style={{ color: 'var(--text-muted)' }}>&rarr;</span>
            <Link to="/dashboard" style={{ color: 'var(--accent-navy)', textDecoration: 'none', borderBottom: '1px solid var(--accent-navy)' }}>ASSESSMENT</Link>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            The portal connects these modules so legal codes are not studied in isolation.
          </p>
        </div>
      </section>

      {/* SECTION 8: CLOSING STATEMENT & PHILOSOPHY */}
      <section style={{ padding: '60px 0 80px 0', marginTop: 'auto' }}>
        <div className="container" style={{ maxWidth: '650px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-navy)', fontWeight: 'bold', marginBottom: '12px' }}>
            Knowing the law is only the beginning.
          </h3>
          <div style={{ fontWeight: 'bold', color: 'var(--accent-navy)', fontSize: '1.1rem', marginBottom: '24px', letterSpacing: '0.5px' }}>
            Learn. Recognize. Stay Safe.
          </div>
          
          <div style={{
            borderTop: '1px dashed var(--color-border)',
            paddingTop: '20px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: '1.5'
          }}>
            <strong>Academic Disclaimer:</strong> This portal is a MERN Academic Project developed for student educational training and general cyber-law safety awareness. It does not compile official police reports or represent legal counsel. Official provisions should be cross-referenced against legislative codes published by the Government of India.
          </div>
        </div>
      </section>

    </div>
  );
}

export default About;
