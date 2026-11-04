import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCounterfactualScenarioBySlug } from '../data/counterfactualScenarios';
import CounterfactualCatalog from '../components/counterfactual/CounterfactualCatalog';
import CounterfactualExplorer from '../components/counterfactual/CounterfactualExplorer';

/**
 * Counterfactuals Page Shell
 * 
 * Routes:
 * - `/workspace/counterfactuals` -> Catalog View
 * - `/workspace/counterfactuals/:slug` -> Scenario Studio View
 * 
 * RESILIENCE:
 * - Validates slug gracefully; if invalid, displays an accessible error state
 *   with an escape hatch back to the catalog.
 */
export default function Counterfactuals() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Scroll to top on slug change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Catalog View
  if (!slug) {
    return (
      <div className="desk-space page-entry">
        <CounterfactualCatalog
          onSelectScenario={(selectedSlug) => {
            navigate(`/workspace/counterfactuals/${selectedSlug}`);
          }}
        />
      </div>
    );
  }

  // Active Scenario Lookup
  const activeScenario = getCounterfactualScenarioBySlug(slug);

  // Invalid Slug Fallback
  if (!activeScenario) {
    return (
      <div className="desk-space page-entry">
        <div className="cf-not-found-card" role="alert" aria-live="polite">
          <div className="cf-not-found-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="cf-not-found-title">Scenario Not Found</h2>
          <p className="cf-not-found-text">
            The requested counterfactual scenario slug &quot;<strong>{slug}</strong>&quot; does not exist in the curriculum catalog.
          </p>
          <button
            type="button"
            className="cf-btn cf-btn-primary"
            onClick={() => navigate('/workspace/counterfactuals')}
          >
            Return to Scenarios Catalog
          </button>
        </div>
      </div>
    );
  }

  // Active Explorer Studio View
  return (
    <div className="desk-space page-entry">
      <CounterfactualExplorer
        scenario={activeScenario}
        onReturnToCatalog={() => navigate('/workspace/counterfactuals')}
      />
    </div>
  );
}
