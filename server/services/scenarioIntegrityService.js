const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

/**
 * scenarioIntegrityService checks Scenario graphs for logical consistency and references.
 * It is used dynamically by validators, test suites, and admin managers.
 */
async function auditScenario(scenarioId) {
  const result = {
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      result.valid = false;
      result.errors.push(`Scenario not found for ID: ${scenarioId}`);
      return result;
    }

    const stages = await ScenarioStage.find({ scenarioId }).sort({ stageOrder: 1 });
    if (stages.length === 0) {
      result.valid = false;
      result.errors.push(`Scenario "${scenario.title}" contains zero stages.`);
      return result;
    }

    // 1. Verify stageOrder uniqueness and existence of order = 1 (start node)
    const stageOrders = new Set();
    let hasStartNode = false;
    const stageMap = new Map(); // stageId -> Stage

    for (const stage of stages) {
      stageMap.set(stage._id.toString(), stage);
      
      if (stage.stageOrder === 1) {
        hasStartNode = true;
      }
      
      if (stageOrders.has(stage.stageOrder)) {
        result.valid = false;
        result.errors.push(`Duplicate stageOrder "${stage.stageOrder}" found in stage: ${stage.title}`);
      }
      stageOrders.add(stage.stageOrder);
    }

    if (!hasStartNode) {
      result.valid = false;
      result.errors.push(`Scenario has no starting node with stageOrder = 1.`);
    }

    // 2. Audit decisions for every stage
    const allDecisions = await ScenarioDecision.find({ stageId: { $in: Array.from(stageMap.keys()) } });
    const decisionMap = new Map(); // decisionId -> Decision
    const stageDecisions = new Map(); // stageId -> Array of Decisions

    allDecisions.forEach(d => {
      decisionMap.set(d._id.toString(), d);
      const sid = d.stageId.toString();
      if (!stageDecisions.has(sid)) {
        stageDecisions.set(sid, []);
      }
      stageDecisions.get(sid).push(d);
    });

    const referencedNextStages = new Set();

    for (const stage of stages) {
      const sid = stage._id.toString();
      const decisions = stageDecisions.get(sid) || [];

      // Check availableDecisionIds sync
      const dbDecisionIds = decisions.map(d => d._id.toString());
      const schemaDecisionIds = stage.availableDecisionIds.map(id => id.toString());
      
      for (const id of schemaDecisionIds) {
        if (!dbDecisionIds.includes(id)) {
          result.valid = false;
          result.errors.push(`Stage "${stage.title}" references decision ID ${id} which is not found in database.`);
        }
      }

      // Check non-terminal stage has options (excluding Adaptive Segments)
      if (!stage.terminal && decisions.length === 0 && !stage.title.includes('Adaptive Segment')) {
        result.valid = false;
        result.errors.push(`Non-terminal stage "${stage.title}" has 0 decision options.`);
      }

      // Validate nextStageId routing for each decision
      for (const dec of decisions) {
        if (dec.nextStageId) {
          const nextIdStr = dec.nextStageId.toString();
          referencedNextStages.add(nextIdStr);

          // Self-loop check
          if (nextIdStr === sid) {
            result.valid = false;
            result.errors.push(`Self-loop detected: decision "${dec.optionText.substring(0, 30)}" on stage "${stage.title}" points to itself.`);
          }

          // Target stage existence in parent scenario
          const targetStage = stageMap.get(nextIdStr);
          if (!targetStage) {
            // Check if it belongs to another scenario altogether
            const foreignStage = await ScenarioStage.findById(dec.nextStageId);
            if (foreignStage) {
              result.valid = false;
              result.errors.push(`Decision "${dec.optionText.substring(0, 30)}" points to stage "${foreignStage.title}" which belongs to a different Scenario (${foreignStage.scenarioId}).`);
            } else {
              result.valid = false;
              result.errors.push(`Decision "${dec.optionText.substring(0, 30)}" points to invalid/missing stage ID: ${dec.nextStageId}`);
            }
          }
        } else {
          // Terminal branch check: if nextStageId is null, warn if stage is not marked terminal
          if (!stage.terminal && decisions.length === 1) {
            result.warnings.push(`Stage "${stage.title}" is not marked terminal but contains a decision with null nextStageId.`);
          }
        }
      }
    }

    // 3. Unreachable stages check (stages after order 1 that are not targets of any decision)
    // Adaptive stages (5,6,7,8) are dynamically targeted, so we can ignore warnings for them
    for (const stage of stages) {
      if (stage.stageOrder > 1) {
        const sid = stage._id.toString();
        if (!referencedNextStages.has(sid)) {
          // Check if this is an adaptive branch stage that is dynamically routed
          const isAdaptiveDiagnostic = stage.title.includes('Weakness Diagnostic');
          if (!isAdaptiveDiagnostic) {
            result.warnings.push(`Unreachable Stage detected: Stage "${stage.title}" (order ${stage.stageOrder}) is not the target of any decision.`);
          }
        }
      }
    }

  } catch (err) {
    result.valid = false;
    result.errors.push(`Audit crashed: ${err.message}`);
  }

  return result;
}

module.exports = {
  auditScenario
};
