const mongoose = require('mongoose');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');

const VALID_MEASUREMENT_FOCUS = [
  'THREAT_RECOGNITION',
  'SIGNAL_IDENTIFICATION',
  'VERIFICATION',
  'DECISION_QUALITY',
  'FALSE_POSITIVE_CONTROL',
  'UNREVIEWED_ACCEPTANCE'
];

const VALID_TARGET_SIGNALS = [
  'unexpected_domain',
  'urgency',
  'unexpected_payment_request',
  'unusual_permission',
  'authority_impersonation',
  'unexpected_attachment',
  'unusual_contact_method',
  'unrequested_account_action',
  'mismatched_branding',
  'unexpected_data_request'
];

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

      // Validate measurementFocus enums
      const focus = stage.measurementFocus || [];
      for (const item of focus) {
        if (!VALID_MEASUREMENT_FOCUS.includes(item)) {
          result.valid = false;
          result.errors.push(`Stage "${stage.title}" has invalid measurementFocus: "${item}"`);
        }
      }

      // Validate targetSignals enums
      const signals = stage.targetSignals || [];
      for (const signal of signals) {
        if (!VALID_TARGET_SIGNALS.includes(signal)) {
          result.valid = false;
          result.errors.push(`Stage "${stage.title}" has invalid targetSignal: "${signal}"`);
        }
      }
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

      // Validate nextStageId routing and effects for each decision
      for (const dec of decisions) {
        // Validate identifiedSignals belongs to parent stage's targetSignals
        const idSignals = dec.identifiedSignals || [];
        const stageSignals = stage.targetSignals || [];
        for (const sig of idSignals) {
          if (!stageSignals.includes(sig)) {
            result.valid = false;
            result.errors.push(`Decision "${dec.optionText.substring(0, 30)}" on Stage "${stage.title}" identifies signal "${sig}" which is not in the parent stage's targetSignals list.`);
          }
        }

        // Validate behaviorEffects are within range [0, 1, 2]
        if (dec.behaviorEffects) {
          const effects = dec.behaviorEffects;
          const clamp = (val) => Math.max(0, Math.min(2, Math.round(val || 0)));
          const checkMetric = (name, val) => {
            if (val < 0 || val > 2) {
              result.valid = false;
              result.errors.push(`Decision "${dec.optionText.substring(0, 30)}" has behaviorEffect "${name}" = ${val} which is outside the controlled range [0, 1, 2].`);
            }
          };
          
          checkMetric('recognition', effects.recognition);
          checkMetric('signalIdentification', effects.signalIdentification);
          checkMetric('verification', effects.verification);
          checkMetric('decisionQuality', effects.decisionQuality);
          checkMetric('falsePositive', effects.falsePositive);
          checkMetric('unreviewedAcceptance', effects.unreviewedAcceptance);
        }

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
          if (!stage.terminal && decisions.length === 1) {
            result.warnings.push(`Stage "${stage.title}" is not marked terminal but contains a decision with null nextStageId.`);
          }
        }
      }
    }

    // 3. Unreachable stages check
    for (const stage of stages) {
      if (stage.stageOrder > 1) {
        const sid = stage._id.toString();
        if (!referencedNextStages.has(sid)) {
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
