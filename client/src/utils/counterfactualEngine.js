/**
 * @file counterfactualEngine.js
 * @description Pure state-transition and projection logic for Stage 3 Counterfactual Scenario Learning.
 * 
 * INVARIANTS:
 * - Pure functions with zero side-effects.
 * - Zero network or database operations.
 * - Deterministic branch tracking, comparison derivation, and completion gating.
 */

/**
 * Initial exploration state for a scenario session.
 * @returns {{ selectedChoiceId: string|null, exploredBranchIds: string[], viewMode: string }}
 */
export function getInitialExplorationState() {
  return {
    selectedChoiceId: null,
    exploredBranchIds: [],
    viewMode: 'junction' // 'junction' | 'timeline' | 'comparison' | 'takeaway'
  };
}

/**
 * Transition state when a learner selects a decision choice.
 * @param {object} currentState
 * @param {string} choiceId
 * @param {object} scenario
 * @returns {object} updated state
 */
export function selectChoice(currentState, choiceId, scenario) {
  if (!scenario || !scenario.decisionJunction || !Array.isArray(scenario.decisionJunction.choices)) {
    throw new Error('Invalid scenario fixture: missing decisionJunction.choices');
  }

  const validChoice = scenario.decisionJunction.choices.find(c => c.id === choiceId);

  if (!validChoice) {
    throw new Error(`Invalid choiceId '${choiceId}' for scenario '${scenario.id}'`);
  }

  const existingExplored = Array.isArray(currentState?.exploredBranchIds) 
    ? currentState.exploredBranchIds 
    : [];

  const updatedExplored = existingExplored.includes(choiceId)
    ? existingExplored
    : [...existingExplored, choiceId];

  return {
    selectedChoiceId: choiceId,
    exploredBranchIds: updatedExplored,
    viewMode: 'timeline'
  };
}

/**
 * Transition state when a learner rewinds from consequence timeline back to decision junction.
 * Crucial invariant: Preserves exploredBranchIds so previously visited choices remain tracked.
 * @param {object} currentState
 * @returns {object} updated state
 */
export function rewindToJunction(currentState) {
  const existingExplored = Array.isArray(currentState?.exploredBranchIds)
    ? currentState.exploredBranchIds
    : [];

  return {
    selectedChoiceId: null,
    exploredBranchIds: existingExplored,
    viewMode: 'junction'
  };
}

/**
 * Check if comparative synthesis matrix is unlocked.
 * Unlocks only when the learner has explored at least two distinct branches.
 * @param {string[]} exploredBranchIds
 * @returns {boolean}
 */
export function canUnlockComparison(exploredBranchIds) {
  return Array.isArray(exploredBranchIds) && exploredBranchIds.length >= 2;
}

/**
 * Filter scenario choices for the comparative matrix projection.
 * Crucial invariant: Shows ONLY the branches that the learner has actually explored.
 * @param {string[]} exploredBranchIds
 * @param {object} scenario
 * @returns {Array<object>} array of explored choice objects with consequence
 */
export function getComparisonBranches(exploredBranchIds, scenario) {
  if (!scenario || !scenario.decisionJunction || !Array.isArray(scenario.decisionJunction.choices)) {
    return [];
  }

  const exploredSet = new Set(Array.isArray(exploredBranchIds) ? exploredBranchIds : []);

  return scenario.decisionJunction.choices.filter(choice => exploredSet.has(choice.id));
}

/**
 * Transition to comparative synthesis view.
 * @param {object} currentState
 * @returns {object} updated state
 */
export function openComparisonView(currentState) {
  if (!canUnlockComparison(currentState?.exploredBranchIds)) {
    return currentState; // blocked if < 2 branches explored
  }

  return {
    ...currentState,
    viewMode: 'comparison'
  };
}

/**
 * Transition to defensive takeaway view.
 * @param {object} currentState
 * @returns {object} updated state
 */
export function openTakeawayView(currentState) {
  return {
    ...currentState,
    viewMode: 'takeaway'
  };
}

/**
 * Determine whether a scenario meets the criteria for local completion.
 * Rule: Completion is valid ONLY when the learner has explored at least one branch
 * AND has navigated to the defensive takeaway view.
 * @param {string[]} exploredBranchIds
 * @param {string} viewMode
 * @returns {boolean}
 */
export function canCompleteScenario(exploredBranchIds, viewMode) {
  const hasExploredAtLeastOne = Array.isArray(exploredBranchIds) && exploredBranchIds.length >= 1;
  const isTakeawayView = viewMode === 'takeaway';

  return hasExploredAtLeastOne && isTakeawayView;
}
