import React, { useEffect, useState } from 'react';
import { markSlugCompleted } from '../../utils/counterfactualStorage';
import { canCompleteScenario } from '../../utils/counterfactualEngine';

/**
 * DefensiveTakeawayCard
 * 
 * Concluding educational synthesis for a counterfactual scenario:
 * 1. Authoritative Core Defensive Rule
 * 2. Actionable Prudent Steps Checklist
 * 3. Primary Statutory Framework (BNS 2023, IT Act 2000, BNSS 2023, Electricity Act, RBI Directions)
 * 4. Official Reporting Protocols (Helpline 1930 / cybercrime.gov.in) with non-guarantee disclosures
 * 
 * COMPLETION CONTRACT:
 * - Triggers completion mark if learner explored >= 1 branch.
 * - Handles Outcome A (persistent localStorage write) and Outcome B (in-memory session fallback).
 */
export default function DefensiveTakeawayCard({
  scenario,
  exploredBranchIds = [],
  onReturnToCatalog,
  onRewindToJunction
}) {
  const [completionResult, setCompletionResult] = useState(null);

  useEffect(() => {
    if (scenario && canCompleteScenario(exploredBranchIds, 'takeaway')) {
      const res = markSlugCompleted(scenario.slug);
      setCompletionResult(res);
    }
  }, [scenario, exploredBranchIds]);

  if (!scenario || !scenario.defensiveTakeaway) return null;

  const { coreRule, actionableSteps, statutoryFramework, officialReportingProtocol } = scenario.defensiveTakeaway;

  return (
    <article className="cf-takeaway-article" aria-labelledby="cf-takeaway-heading">
      {/* Header Banner */}
      <div className="cf-takeaway-header">
        <div className="cf-takeaway-badges">
          <span className="cf-takeaway-badge">Defensive Synthesis & Statutory Hook</span>
          {completionResult?.success && (
            <span className={`cf-completion-pill ${completionResult.persistent ? 'cf-pill-persistent' : 'cf-pill-session'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {completionResult.persistent ? 'Completed • Saved Locally' : 'Completed (Session)'}
            </span>
          )}
        </div>
        <h3 id="cf-takeaway-heading" className="cf-takeaway-title">
          Defensive Rule, Applicable Law & Official Recourse
        </h3>
      </div>

      {/* 1. Core Rule Card */}
      <div className="cf-core-rule-card">
        <div className="cf-core-rule-label">Core Defensive Invariant</div>
        <blockquote className="cf-core-rule-quote">
          "{coreRule}"
        </blockquote>
      </div>

      {/* 2. Actionable Steps */}
      {Array.isArray(actionableSteps) && (
        <section className="cf-actionable-section" aria-labelledby="cf-steps-heading">
          <h4 id="cf-steps-heading" className="cf-section-heading">Prudent Verification Steps</h4>
          <ol className="cf-steps-list">
            {actionableSteps.map((step, idx) => (
              <li key={idx} className="cf-step-item">
                <span className="cf-step-num">0{idx + 1}</span>
                <span className="cf-step-text">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 3. Statutory Framework Accordion / Cards */}
      {Array.isArray(statutoryFramework) && (
        <section className="cf-statutory-section" aria-labelledby="cf-statutory-heading">
          <h4 id="cf-statutory-heading" className="cf-section-heading">Applicable Statutory & Regulatory Framework</h4>
          <div className="cf-statutory-grid">
            {statutoryFramework.map((law, idx) => (
              <div key={idx} className="cf-law-card">
                <div className="cf-law-topbar">
                  <span className="cf-law-act">{law.act}</span>
                  <span className={`cf-law-status cf-status-${law.status.toLowerCase()}`}>{law.status}</span>
                </div>
                <div className="cf-law-section">{law.section}</div>
                <p className="cf-law-summary">{law.plainSummary}</p>
                <div className="cf-law-applicability">
                  <strong>Statutory Scope & Nuance:</strong> {law.applicabilityNote}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Official Reporting Protocol */}
      {officialReportingProtocol && (
        <section className="cf-reporting-section" aria-labelledby="cf-reporting-heading">
          <h4 id="cf-reporting-heading" className="cf-section-heading">Official Incident Escalation Protocol</h4>
          <div className="cf-reporting-card">
            <div className="cf-reporting-channels">
              <div className="cf-channel-badge">
                <span className="cf-channel-label">National Cybercrime Helpline:</span>
                <span className="cf-channel-val">{officialReportingProtocol.primaryChannel}</span>
              </div>
              <div className="cf-channel-badge">
                <span className="cf-channel-label">Official Portal:</span>
                <a 
                  href={officialReportingProtocol.reportingPortalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="cf-channel-link"
                >
                  {officialReportingProtocol.reportingPortalUrl}
                </a>
              </div>
            </div>

            <div className="cf-reporting-body">
              <p><strong>CFCFRMS Coordination:</strong> {officialReportingProtocol.coordinationMechanism}</p>
              <p className="cf-reporting-guidance">{officialReportingProtocol.guidance}</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer Navigation Toolbar */}
      <div className="cf-takeaway-footer-bar">
        <button
          type="button"
          className="cf-btn cf-btn-secondary"
          onClick={onRewindToJunction}
          aria-label="Rewind to decision junction to explore remaining choices"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
            <polyline points="1 4 1 10 7 10"></polyline>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
          Rewind & Explore Other Paths
        </button>

        <button
          type="button"
          className="cf-btn cf-btn-primary"
          onClick={onReturnToCatalog}
          aria-label="Return to counterfactual scenario catalog"
        >
          Return to Scenario Catalog
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 8 }}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </article>
  );
}
