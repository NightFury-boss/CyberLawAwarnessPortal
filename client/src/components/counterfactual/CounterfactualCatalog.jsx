import React from 'react';
import { COUNTERFACTUAL_SCENARIOS } from '../../data/counterfactualScenarios';
import { isScenarioCompleted } from '../../utils/counterfactualStorage';
import EditorialPageHeader from '../common/EditorialPageHeader';
import EditorialRule from '../common/EditorialRule';

/**
 * CounterfactualCatalog
 * 
 * Displays the four calibrated educational counterfactual scenario dossiers.
 */
export default function CounterfactualCatalog({ onSelectScenario }) {
  return (
    <div className="cf-catalog-wrapper">
      <EditorialPageHeader
        title="Counterfactual Scenarios"
        subtitle="Explore consequential decision pathways in realistic cyber incidents. Test alternative choices, observe how exploits escalate, and discover defensive strategies without real-world risk."
        badge="Hypothetical Decision Lab"
      />

      <EditorialRule />

      {/* Catalog Intro Note */}
      <div className="cf-catalog-banner">
        <div className="cf-catalog-banner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 14 14"></polyline>
          </svg>
        </div>
        <div className="cf-catalog-banner-text">
          <strong>Safe Non-Graded Exploration:</strong> Counterfactual scenarios are independent educational simulations. Choices made here do not affect your diagnostic assessment scores, behavioral profiles, or verified portfolios.
        </div>
      </div>

      {/* Scenario Dossier Grid */}
      <div className="cf-scenarios-grid">
        {COUNTERFACTUAL_SCENARIOS.map((scenario, index) => {
          const completed = isScenarioCompleted(scenario.slug);

          return (
            <article key={scenario.id} className="cf-scenario-card" aria-labelledby={`cf-card-title-${scenario.id}`}>
              <div className="cf-card-topbar">
                <span className="cf-card-num">CASE 0{index + 1}</span>
                <div className="cf-card-badges">
                  <span className={`cf-diff-badge cf-diff-${scenario.difficulty.toLowerCase()}`}>
                    {scenario.difficulty}
                  </span>
                  {completed && (
                    <span className="cf-completed-pill" title="You have completed this scenario">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Completed
                    </span>
                  )}
                </div>
              </div>

              <div className="cf-card-category">{scenario.category}</div>

              <h3 id={`cf-card-title-${scenario.id}`} className="cf-card-title">
                {scenario.title}
              </h3>

              <p className="cf-card-summary">
                {scenario.incidentContext?.summary}
              </p>

              <div className="cf-card-vector-box">
                <span className="cf-vector-label">Primary Threat Vector:</span>
                <span className="cf-vector-value">{scenario.incidentContext?.targetVector}</span>
              </div>

              <div className="cf-card-footer">
                <span className="cf-card-est-time">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {scenario.estimatedMinutes} min exploration
                </span>

                <button
                  type="button"
                  className="cf-btn cf-btn-explore"
                  onClick={() => onSelectScenario(scenario.slug)}
                  aria-label={`Explore scenario: ${scenario.title}`}
                >
                  Explore Scenario
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6 }}>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
