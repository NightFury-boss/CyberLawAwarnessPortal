const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

/**
 * Validates a Scenario's decision graph for structural consistency.
 * Throws an Error with detailed information if validation fails.
 */
async function validateScenarioGraph(scenarioId) {
  const scenario = await Scenario.findById(scenarioId);
  if (!scenario) {
    throw new Error('Scenario not found');
  }

  // 1. Verify Category Weights total 100
  const weights = scenario.configuredWeights;
  if (!weights || weights.size === 0) {
    throw new Error('Scenario contains no category weights configuration');
  }

  let totalWeight = 0;
  for (let weight of weights.values()) {
    totalWeight += weight;
  }

  if (totalWeight !== 100) {
    throw new Error(`Scenario configured weights must sum to exactly 100. Current total: ${totalWeight}`);
  }

  // 2. Fetch all stages and decisions
  const stages = await ScenarioStage.find({ scenarioId: scenario._id });
  if (stages.length === 0) {
    throw new Error('Scenario contains no stages');
  }

  const stageIds = new Set(stages.map(s => s._id.toString()));
  const firstStage = stages.find(s => s.stageOrder === 1);
  if (!firstStage) {
    throw new Error('Scenario is missing a starting stage (stageOrder = 1)');
  }

  const terminalStages = stages.filter(s => s.terminal === true);
  if (terminalStages.length === 0) {
    throw new Error('Scenario has no terminal stages. At least one stage must be marked terminal = true');
  }

  // Check stage details and choices
  for (let stage of stages) {
    const decisions = await ScenarioDecision.find({ stageId: stage._id });

    if (stage.terminal) {
      // Terminal stages should not have any branches pointing to other stages
      for (let dec of decisions) {
        if (dec.nextStageId) {
          throw new Error(`Terminal stage "${stage.title}" contains a decision choice pointing to another stage: ${dec.nextStageId}`);
        }
      }
    } else {
      // Non-terminal stages must have decisions
      if (decisions.length === 0) {
        throw new Error(`Non-terminal stage "${stage.title}" has no decision choices (dead end)`);
      }

      // Validate every decision points to a valid stage in this scenario
      for (let dec of decisions) {
        if (!dec.nextStageId) {
          throw new Error(`Non-terminal decision in stage "${stage.title}" is missing a nextStageId path`);
        }
        if (!stageIds.has(dec.nextStageId.toString())) {
          throw new Error(`Decision in stage "${stage.title}" references a nextStageId (${dec.nextStageId}) that does not exist in this scenario`);
        }
      }
    }
  }

  // 3. Trace paths from starting stage to verify DAG connectivity (No cycles, all paths reach terminal)
  const visited = new Set();
  const pathStack = new Set();

  async function checkCyclesAndTerminalReachability(stageId) {
    if (pathStack.has(stageId)) {
      throw new Error(`Circular dependency loop detected at stage ID: ${stageId}`);
    }
    if (visited.has(stageId)) {
      return; // Already verified this subtree
    }

    pathStack.add(stageId);

    const stage = stages.find(s => s._id.toString() === stageId);
    if (!stage.terminal) {
      const decisions = await ScenarioDecision.find({ stageId: stage._id });
      for (let dec of decisions) {
        await checkCyclesAndTerminalReachability(dec.nextStageId.toString());
      }
    }

    pathStack.delete(stageId);
    visited.add(stageId);
  }

  await checkCyclesAndTerminalReachability(firstStage._id.toString());

  // 4. Check for unreachable stages
  const unreachable = stages.filter(s => !visited.has(s._id.toString()));
  if (unreachable.length > 0) {
    throw new Error(`Unreachable stages detected: [${unreachable.map(s => s.title).join(', ')}]. All stages must connect from the starting stage.`);
  }

  return true;
}

module.exports = {
  validateScenarioGraph
};
