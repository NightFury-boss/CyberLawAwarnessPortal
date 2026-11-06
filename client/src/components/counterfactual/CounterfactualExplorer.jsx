import React, { useState } from 'react';
import {
  getInitialExplorationState,
  selectChoice,
  rewindToJunction,
  openComparisonView,
  openTakeawayView
} from '../../utils/counterfactualEngine';
import IncidentStimulusView from './IncidentStimulusView';
import DecisionJunction from './DecisionJunction';
import ConsequenceTimeline from './ConsequenceTimeline';
import ComparativeMatrix from './ComparativeMatrix';
import DefensiveTakeawayCard from './DefensiveTakeawayCard';

/**
 * CounterfactualExplorer
 * 
 * Interactive studio orchestrating the multi-phase scenario learning journey:
 * - Incident Context & Static Stimulus
 * - Decision Junction with branch tracking
 * - Causal Consequence Timeline with rewind affordance
 * - Selective Comparative Matrix (unlocked at >= 2 explored branches)
 * - Defensive Takeaway & Statutory Hook
 */
export default function CounterfactualExplorer({
  scenario,
  onReturnToCatalog
}) {
  const [explorationState, setExplorationState] = useState(getInitialExplorationState());

  if (!scenario) return null;

  const { selectedChoiceId, exploredBranchIds, viewMode } = explorationState;

  // Selected choice object
  const activeChoice = scenario.decisionJunction?.choices?.find(c => c.id === selectedChoiceId) || null;

  // Handlers
  const handleSelectChoice = (choiceId) => {
    try {
      const next = selectChoice(explorationState, choiceId, scenario);
      setExplorationState(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to select choice:', err);
    }
  };

  const handleRewind = () => {
    const next = rewindToJunction(explorationState);
    setExplorationState(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenComparison = () => {
    const next = openComparisonView(explorationState);
    setExplorationState(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTakeaway = () => {
    const next = openTakeawayView(explorationState);
    setExplorationState(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReturnToTimeline = () => {
    if (selectedChoiceId) {
      setExplorationState(prev => ({ ...prev, viewMode: 'timeline' }));
    } else {
      handleRewind();
    }
  };

  return (
    <div className="cf-explorer-wrapper">
      {/* Top Navigation & Breadcrumb */}
      <div className="cf-explorer-top-nav">
        <button
          type="button"
          className="cf-back-link-btn"
          onClick={onReturnToCatalog}
          aria-label="Back to Counterfactual Scenarios catalog"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Scenarios
        </button>

        <div className="cf-explorer-meta-pills">
          <span className="cf-meta-pill cf-pill-cat">{scenario.category}</span>
          <span className={`cf-meta-pill cf-pill-diff-${scenario.difficulty.toLowerCase()}`}>{scenario.difficulty}</span>
          <span className="cf-meta-pill cf-pill-time">{scenario.estimatedMinutes} min exploration</span>
        </div>
      </div>

      {/* Prominent Educational Simulation Disclaimer */}
      <div className="cf-disclaimer-banner" role="note" aria-label="Educational Simulation Notice">
        <div className="cf-disclaimer-badge">HYPOTHETICAL EDUCATIONAL MODEL</div>
        <p className="cf-disclaimer-text">{scenario.disclaimer}</p>
      </div>

      {/* Scenario Title & Briefing */}
      <div className="cf-scenario-header">
        <h2 className="cf-scenario-title">{scenario.title}</h2>
        <p className="cf-scenario-summary">{scenario.incidentContext?.summary}</p>
      </div>

      {/* Interactive Mode View Switcher */}
      <div className="cf-explorer-content">
        {/* VIEW 1: Decision Junction + Static Stimulus */}
        {viewMode === 'junction' && (
          <div className="cf-view-junction">
            <IncidentStimulusView incidentContext={scenario.incidentContext} />
            <DecisionJunction
              decisionJunction={scenario.decisionJunction}
              exploredBranchIds={exploredBranchIds}
              onSelectChoice={handleSelectChoice}
            />
          </div>
        )}

        {/* VIEW 2: Consequence Timeline */}
        {viewMode === 'timeline' && activeChoice && (
          <div className="cf-view-timeline">
            <ConsequenceTimeline
              choice={activeChoice}
              exploredBranchIds={exploredBranchIds}
              onRewind={handleRewind}
              onOpenComparison={handleOpenComparison}
              onOpenTakeaway={handleOpenTakeaway}
            />
          </div>
        )}

        {/* VIEW 3: Selective Comparative Matrix */}
        {viewMode === 'comparison' && (
          <div className="cf-view-comparison">
            <ComparativeMatrix
              scenario={scenario}
              exploredBranchIds={exploredBranchIds}
              onReturnToTimeline={handleReturnToTimeline}
              onRewindToJunction={handleRewind}
              onOpenTakeaway={handleOpenTakeaway}
            />
          </div>
        )}

        {/* VIEW 4: Defensive Takeaway & Law */}
        {viewMode === 'takeaway' && (
          <div className="cf-view-takeaway">
            <DefensiveTakeawayCard
              scenario={scenario}
              exploredBranchIds={exploredBranchIds}
              onReturnToCatalog={onReturnToCatalog}
              onRewindToJunction={handleRewind}
            />
          </div>
        )}
      </div>
    </div>
  );
}
