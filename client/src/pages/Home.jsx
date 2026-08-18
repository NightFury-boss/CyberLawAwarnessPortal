import React from 'react';
import { Link } from 'react-router-dom';

function Home({ user }) {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1>Cyber law is easier to understand when you know how attacks actually work.</h1>
          <p>
            Learn Indian cyber law and cybersecurity preventive safety by experiencing safe, interactive digital threat simulations.
          </p>
          <div className="hero-ctas">
            <Link to={user ? "/dashboard" : "/register"} className="btn btn-primary">
              {user ? "Go to Dashboard" : "Start Learning"}
            </Link>
            <Link to="/laws" className="btn btn-secondary">
              Explore Cyber Laws
            </Link>
          </div>
        </div>
      </section>

      {/* Intro Block: "How aware are you?" */}
      <section style={{ padding: 'var(--space-xl) 0', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
            How aware are you?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            A normal portal tells you: <em>\"Here is the Information Technology Act. Read these sections.\"</em><br />
            Our platform does things differently. We first let you experience realistic digital scenarios to test your defense habits, explain your specific weak areas, and recommend only the legal provisions and guidelines you need to know.
          </p>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="pillars">
        <div className="container">
          <div className="pillars-grid">
            <div className="pillar-col">
              <span style={{ fontSize: '2rem' }}>⚖️</span>
              <h3>Understand the Law</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
                Learn the Information Technology Act, 2000 in plain English, with real-world scenarios showing how sections like 43A, 66C, and 66D protect you.
              </p>
            </div>
            
            <div className="pillar-col">
              <span style={{ fontSize: '2rem' }}>🎯</span>
              <h3>Recognize the Threat</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
                Experience interactive simulations of phishing emails, vishing calls, SIM swapping, and UPI scams in a safe environment.
              </p>
            </div>

            <div className="pillar-col">
              <span style={{ fontSize: '2rem' }}>🛡️</span>
              <h3>Know What to Do</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 'var(--space-sm)' }}>
                Equip yourself with practical safety checklists for passwords, Multi-Factor Authentication (MFA), safe browsing, and mobile security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Content & Feature Section */}
      <section style={{ padding: 'var(--space-xl) 0' }}>
        <div className="container">
          <div className="editorial-grid">
            {/* Main Area */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>
                Featured Awareness Content
              </h2>
              
              <div className="editorial-card">
                <span className="tag">Cybercrime Focus</span>
                <h3>Phishing & Mock Portals</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-md)' }}>
                  Attackers weaponize fear and urgency to bypass password safety. Learn how spoofed domain URLs are designed and how to spot them before clicking.
                </p>
                <Link to="/crimes" style={{ fontWeight: '500' }}>Read Category Details &rarr;</Link>
              </div>

              <div className="editorial-card">
                <span className="tag">Case Study</span>
                <h3>The UPI 'Scan to Receive' Escrow Scam</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 'var(--space-md)' }}>
                  Scammers on classified marketplaces send QR codes claiming they will transfer cash to you once scanned. Read our detailed breakdown of how UPI PIN authorization works.
                </p>
                <Link to="/cases" style={{ fontWeight: '500' }}>Read Timeline Analysis &rarr;</Link>
              </div>
            </div>

            {/* Sidebar Area */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: 'var(--space-lg)' }}>
                Interactive Assessment
              </h2>
              
              <div className="editorial-card" style={{ backgroundColor: 'var(--accent-navy)', color: 'var(--bg-primary)' }}>
                <h3 style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>
                  Take the Baseline Assessment
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', margin: 'var(--space-sm) 0 var(--space-lg) 0' }}>
                  Complete a 3-minute secure simulation of an account security event. Evaluate your defense reactions, find your vulnerability score, and receive a customized learning path.
                </p>
                <Link to={user ? "/dashboard" : "/login"} className="btn btn-secondary" style={{ backgroundColor: 'white', color: 'var(--accent-navy)', border: 'none', width: '100%', display: 'block', textAlign: 'center' }}>
                  {user ? "Begin Assessment" : "Login to Start"}
                </Link>
              </div>

              <div className="editorial-card" style={{ borderColor: 'var(--color-border-dark)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)' }}>📞 National Cyber Helpline</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  If you have lost money to a digital scam, call <strong>1930</strong> immediately. Local cyber authorities can block/freeze the transaction on payment gateways within the golden hour.
                </p>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', fontSize: '0.8rem' }}>
                  Visit Official Reporting Portal
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
