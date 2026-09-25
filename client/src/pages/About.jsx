import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MethodologyFlow from '../components/about/MethodologyFlow';
import EditorialScrollStory from '../components/common/EditorialScrollStory';
import EditorialRule from '../components/common/EditorialRule';

function About() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    const sectionIds = ['overview', 'method', 'assessment', 'safety', 'project'];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const sections = [
    { id: 'overview', name: 'Overview' },
    { id: 'method', name: 'Methodology' },
    { id: 'assessment', name: 'Assessment' },
    { id: 'safety', name: 'Safety' },
    { id: 'project', name: 'Project Stack' }
  ];

  const METHODOLOGY_STORY_SECTIONS = [
    {
      id: 'method-law',
      number: '01',
      navLabel: 'Law',
      eyebrow: 'STATUTORY FOUNDATION',
      title: 'Law: Grounding in Indian Digital Statute',
      description: 'Start with the legal rule that gives the situation its context.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Plain-language interpretations of Indian digital statutes—including the Information Technology Act, Bharatiya Nyaya Sanhita (BNS), and Digital Personal Data Protection (DPDP) Act—establish baseline rights, obligations, and jurisdictional boundaries. Knowing the law provides the essential reference point for recognizing illegal actions.
        </p>
      )
    },
    {
      id: 'method-threat',
      number: '02',
      navLabel: 'Threat',
      eyebrow: 'PATTERN RECOGNITION',
      title: 'Threat: Critical Indicators to Notice',
      description: 'Recognize how the rule appears in an everyday digital situation.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Digital threats rarely announce themselves as attacks. Attackers introduce psychological urgency, deceptive domain variations, spoofed communication headers, and authority leverage designed to rush critical reasoning. Understanding threat signatures turns statutory rules into actionable vigilance.
        </p>
      )
    },
    {
      id: 'method-case',
      number: '03',
      navLabel: 'Case',
      eyebrow: 'REAL INCIDENT ANALYSIS',
      title: 'Case: Reconstructed Incident Narratives',
      description: 'See how a real incident makes warning signs easier to understand.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Reconstructed incident timelines demonstrate how attackers construct trust, where subtle discrepancies appeared, and at which critical pivot point a safer decision would have prevented harm. Real-world incident forensics bridge abstract legal definitions with concrete events.
        </p>
      )
    },
    {
      id: 'method-prevention',
      number: '04',
      navLabel: 'Prevention',
      eyebrow: 'DEFENSIVE PROTOCOLS',
      title: 'Prevention: Practical Containment Steps',
      description: 'Turn understanding into practical defensive habits.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Clear operational guidance outlines step-by-step containment protocols across before, during, and after phases. From independent verification of financial requests to immediate incident reporting on the National Cyber Crime Reporting Portal (1930), prevention focuses on repeatable, safe actions.
        </p>
      )
    },
    {
      id: 'method-practice',
      number: '05',
      navLabel: 'Practice',
      eyebrow: 'EXPERIENTIAL SCENARIOS',
      title: 'Practice: Multi-Branching Decisions',
      description: 'Apply what you learned through realistic decisions and questions.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Multi-branching decision paths place learners in genuine scenarios to calibrate threat recognition, signal identification, and verification behaviour without real-world penalty. Immediate, educational feedback reinforces why specific actions are safer under statutory guidelines.
        </p>
      )
    },
    {
      id: 'method-improvement',
      number: '06',
      navLabel: 'Improvement',
      eyebrow: 'MEASURED GROWTH',
      title: 'Improvement: Behavioral Shifts Over Time',
      description: 'Use reflection and continued practice to strengthen safer digital behaviour.',
      content: (
        <p style={{ fontSize: '1rem', lineHeight: '1.68', color: 'var(--text-secondary)' }}>
          Defensive competence is tracked across six canonical behavioral dimensions—Threat Recognition, Signal Identification, Verification Behaviour, Decision Quality, False Positive Control, and Unreviewed Acceptance Control. Over repeated interactions, conscious caution evolves into durable defensive instincts.
        </p>
      )
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
      el.style.scrollMarginTop = 'calc(var(--header-height, 68px) + 52px)';
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="page-entry" style={{
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      '--portal-subnav-height': '49px'
    }}>
      
      {/* SECTION NAVIGATOR BAR */}
      <nav style={{
        position: 'sticky',
        top: 'var(--header-height, 68px)',
        backgroundColor: 'var(--bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 90,
        padding: '12px 0'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Desktop / Mobile Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
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
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
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
              Explore Cybercrime Library &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 2: THE LEARNING LOOP */}
      <section id="method" style={{ padding: '60px 0 0 0', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--bg-secondary)', scrollMarginTop: 'calc(var(--header-height, 68px) + 52px)' }}>
        <div className="container" style={{ maxWidth: '960px', marginBottom: '56px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Methodology
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            The Experiential Learning Loop
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
            The system guides users through a six-stage sequence designed to train rapid threat recognition, statutory grounding, and verified defensive habits.
          </p>

          {/* Progressive Reveal Methodology Flow */}
          <MethodologyFlow />
        </div>

        {/* Editorial Scroll Story */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 var(--space-md) var(--space-2xl) var(--space-md)' }}>
          <EditorialScrollStory
            contextBadge="METHODOLOGY"
            contextTitle="The Experiential Learning Sequence"
            contextSubtitle="From statutory literacy to lasting behavioral instincts"
            sections={METHODOLOGY_STORY_SECTIONS}
          />
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
        <div className="container" style={{ maxWidth: '860px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
            Measurement Model
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-navy)', marginBottom: '12px', textAlign: 'center' }}>
            Six-Dimensional Behavioral Assessment
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '32px', maxWidth: '640px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            Rather than relying on abstract test recall or misleading composite scores, the portal evaluates decision reflexes across six discrete behavioral dimensions when encountering realistic simulated threat vectors.
          </p>

          {/* Six Dimensions Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                TR · Threat Recognition
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Identifying deceptive intent, manufactured urgency, and unauthorized solicitation patterns.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                SI · Signal Identification
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Spotting counterfeit domain variations, spoofed communication headers, and anomalous links.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                VB · Verification Behaviour
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Critical pause to independently confirm unexpected notices via official, out-of-band channels.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                DQ · Decision Quality
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Selecting defensive containment and safe closure over hasty, compliance-driven action.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                FP · False Positive Control
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Differentiating legitimate institutional communications from malicious attempts without unnecessary panic.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '16px' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--accent-navy)', display: 'block', marginBottom: '4px' }}>
                UA · Unreviewed Acceptance Control
              </strong>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                Resisting habitual or rushed consent when requested for sensitive permissions, OTPs, or financial actions.
              </p>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--color-border)',
            borderLeft: '4px solid var(--accent-navy)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              <strong>No Composite Scores:</strong> Digital safety cannot be summarized as an arbitrary percentage. The portal tracks each dimension discretely across baseline diagnostics, micro-learning pathways, and post-learning evaluation so specific defensive reflexes can be recognized and strengthened.
            </p>
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
                <li><strong>Threat Directory:</strong> Common cybercrime vectors (phishing, vishing, UPI scams).</li>
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
