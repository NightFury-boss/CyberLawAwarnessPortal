import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Compact Institutional Footer for Cyber Law Awareness Portal.
 * Clean, structured, and calm with verified reporting resources and approved disclaimer.
 */
export default function Footer() {
  return (
    <footer className="portal-footer" role="contentinfo" aria-label="Portal footer">
      <div className="container footer-container">
        {/* Brand & Purpose Column */}
        <div className="footer-brand-col">
          <div className="footer-logo-wrapper">
            <img src="/logo/cyber-law-logo-horizontal.svg" alt="Cyber Law Awareness Portal" className="footer-logo" />
          </div>
          <p className="footer-tagline">Learn. Recognize. Stay Safe.</p>
          <p className="footer-desc">
            An open educational awareness portal structured to turn statutory digital law into practical everyday awareness.
          </p>

          <div className="footer-emergency-box">
            <strong className="emergency-title">Cyber Crime Helpline: 1930</strong>
            <p className="emergency-detail">
              National emergency support via Toll-Free <strong>1930</strong>. File official complaints at{' '}
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="emergency-link">
                cybercrime.gov.in
              </a>
            </p>
          </div>
        </div>

        {/* Column 2: Explore */}
        <div className="footer-nav-col">
          <h4 className="footer-heading">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/laws">Cyber Laws</Link></li>
            <li><Link to="/crimes">Cyber Crimes</Link></li>
            <li><Link to="/cases">Case Studies</Link></li>
            <li><Link to="/prevention">Prevention Centre</Link></li>
            <li><Link to="/resources">Legal Resources</Link></li>
          </ul>
        </div>

        {/* Column 3: About */}
        <div className="footer-nav-col">
          <h4 className="footer-heading">About</h4>
          <ul className="footer-links">
            <li><Link to="/about">About the Portal</Link></li>
            <li><Link to="/about#method">Methodology</Link></li>
            <li><Link to="/about#project">Project Information</Link></li>
          </ul>
        </div>
      </div>

      {/* Institutional Educational Disclaimer & Copyright */}
      <div className="container footer-bottom">
        <div className="footer-disclaimer">
          <strong>Educational Awareness Disclaimer:</strong> All curriculum material, case studies, and simulated scenarios provided on this portal are developed exclusively for civic digital literacy and educational awareness. They do not constitute formal legal counsel, statutory interpretation, or personal legal advisory services.
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Cyber Law Awareness Portal. Built for Academic and Awareness purposes.
        </div>
      </div>
    </footer>
  );
}
