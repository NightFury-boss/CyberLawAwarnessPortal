const mongoose = require('mongoose');
const User = require('../models/User');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const Resource = require('../models/Resource');
const AssessmentSession = require('../models/AssessmentSession');
const Scenario = require('../models/Scenario');
const ScenarioStage = require('../models/ScenarioStage');
const ScenarioDecision = require('../models/ScenarioDecision');
const AdminAuditLog = require('../models/AdminAuditLog');
const UserProgress = require('../models/UserProgress');
const auditService = require('../services/auditService');
const scenarioIntegrityService = require('../services/scenarioIntegrityService');

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const assessments = await AssessmentSession.find({ status: 'completed' })
      .select('userId scenarioCode scenarioVersion score categoryScores behaviourScores behaviourOpportunities')
      .lean();

    // Filter Baseline & Final
    const baselines = assessments.filter(a => a.scenarioCode === 'baseline');
    const finals = assessments.filter(a => a.scenarioCode === 'final');

    const avgBaseline = baselines.length > 0
      ? Math.round(baselines.reduce((sum, a) => sum + a.score, 0) / baselines.length)
      : 0;

    const avgFinal = finals.length > 0
      ? Math.round(finals.reduce((sum, a) => sum + a.score, 0) / finals.length)
      : 0;

    // Calculate improvement delta
    let totalDelta = 0;
    let usersWithBoth = 0;

    const userIds = [...new Set(assessments.map(a => a.userId.toString()))];
    userIds.forEach(uId => {
      const userBaselines = baselines.filter(a => a.userId.toString() === uId);
      const userFinals = finals.filter(a => a.userId.toString() === uId);

      // Only pair baseline and final belonging to the exact same scenarioVersion
      const distinctVersions = [...new Set([...userBaselines, ...userFinals].map(a => a.scenarioVersion || 1))];
      distinctVersions.forEach(v => {
        const vBases = userBaselines.filter(a => (a.scenarioVersion || 1) === v);
        const vFinals = userFinals.filter(a => (a.scenarioVersion || 1) === v);
        if (vBases.length > 0 && vFinals.length > 0) {
          const lastBase = vBases[vBases.length - 1].score;
          const lastFinal = vFinals[vFinals.length - 1].score;
          totalDelta += (lastFinal - lastBase);
          usersWithBoth++;
        }
      });
    });

    const avgImprovement = usersWithBoth > 0 ? Math.round(totalDelta / usersWithBoth) : 0;

    // Weakest Area
    const weakCategoryCounts = {};
    assessments.forEach(a => {
      if (a.categoryScores) {
        const catEntries = a.categoryScores instanceof Map
          ? Array.from(a.categoryScores.entries())
          : Object.entries(a.categoryScores);
        for (let [cat, score] of catEntries) {
          if (typeof score === 'number' && score < 70) {
            weakCategoryCounts[cat] = (weakCategoryCounts[cat] || 0) + 1;
          }
        }
      }
    });

    let weakestCategory = 'None';
    let maxCount = 0;
    for (let cat in weakCategoryCounts) {
      if (weakCategoryCounts[cat] > maxCount) {
        maxCount = weakCategoryCounts[cat];
        weakestCategory = cat;
      }
    }

    // Aggregate cohort behavioral dimensions across 6 educational defense indicators
    const dimTotals = {
      recognition: 0,
      signalIdentification: 0,
      verification: 0,
      decisionQuality: 0,
      falsePositive: 0,
      unreviewedAcceptance: 0
    };
    const dimCounts = {
      recognition: 0,
      signalIdentification: 0,
      verification: 0,
      decisionQuality: 0,
      falsePositive: 0,
      unreviewedAcceptance: 0
    };

    assessments.forEach(a => {
      if (a.behaviourScores) {
        const scores = a.behaviourScores instanceof Map ? Object.fromEntries(a.behaviourScores) : a.behaviourScores;
        const opportunities = a.behaviourOpportunities instanceof Map
          ? Object.fromEntries(a.behaviourOpportunities)
          : (a.behaviourOpportunities || {});

        for (const [key, val] of Object.entries(scores)) {
          const oppCount = opportunities[key] || 0;
          // Only tally dimensions where the learner actually encountered evaluation opportunities
          if (dimTotals[key] !== undefined && typeof val === 'number' && !isNaN(val) && oppCount > 0) {
            dimTotals[key] += val;
            dimCounts[key]++;
          }
        }
      }
    });

    // Small cohort suppression (k-anonymity protection):
    // Suppress cohort-level distribution if sample size is below 5 distinct learners
    // to prevent reverse-engineering individual student assessment outcomes.
    const MIN_COHORT_SIZE = 5;
    const distinctUsersCount = new Set(
      assessments
        .map(a => a.userId?.toString())
        .filter(Boolean)
    ).size;

    const isSufficientSample = distinctUsersCount >= MIN_COHORT_SIZE;
    let cohortBehavioralAverages = null;
    const cohortStatus = {
      sufficientSample: isSufficientSample,
      sampleSize: assessments.length,
      distinctUsers: distinctUsersCount,
      minimumRequired: MIN_COHORT_SIZE,
      message: isSufficientSample
        ? `Educational indicator averages aggregated across ${assessments.length} completed sessions from ${distinctUsersCount} learners.`
        : `Minimum cohort of ${MIN_COHORT_SIZE} distinct learners required for statistical aggregation to protect learner privacy (${distinctUsersCount} currently recorded across ${assessments.length} sessions).`
    };

    if (isSufficientSample) {
      cohortBehavioralAverages = {
        threatRecognition: dimCounts.recognition >= MIN_COHORT_SIZE ? Math.round(dimTotals.recognition / dimCounts.recognition) : null,
        signalIdentification: dimCounts.signalIdentification >= MIN_COHORT_SIZE ? Math.round(dimTotals.signalIdentification / dimCounts.signalIdentification) : null,
        verificationBehavior: dimCounts.verification >= MIN_COHORT_SIZE ? Math.round(dimTotals.verification / dimCounts.verification) : null,
        dataQuotient: dimCounts.decisionQuality >= MIN_COHORT_SIZE ? Math.round(dimTotals.decisionQuality / dimCounts.decisionQuality) : null,
        financialProtection: dimCounts.falsePositive >= MIN_COHORT_SIZE ? Math.round(dimTotals.falsePositive / dimCounts.falsePositive) : null,
        unreviewedAcceptance: dimCounts.unreviewedAcceptance >= MIN_COHORT_SIZE ? Math.round(dimTotals.unreviewedAcceptance / dimCounts.unreviewedAcceptance) : null
      };
    }

    res.json({
      totalUsers,
      assessmentsCount: assessments.length,
      avgBaselineScore: avgBaseline,
      avgFinalScore: avgFinal,
      avgImprovement,
      weakestArea: weakestCategory,
      weakestAreaCount: maxCount,
      cohortStatus,
      behavioralAverages: cohortBehavioralAverages
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

exports.getUsersProgress = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('fullName email createdAt').lean();
    const progressRecords = await UserProgress.find().select('userId badgesEarned quizAttempts').lean();
    const assessments = await AssessmentSession.find({ status: 'completed' }).select('userId scenarioCode scenarioVersion score').lean();

    const trackingList = users.map(user => {
      const prog = progressRecords.find(p => p.userId.toString() === user._id.toString()) || {};
      const userAssessments = assessments.filter(a => a.userId.toString() === user._id.toString());
      
      const userVersions = [...new Set(userAssessments.map(a => a.scenarioVersion || 1))].sort((a, b) => b - a);
      const targetVersion = userVersions.length > 0 ? userVersions[0] : 2;

      const baseline = userAssessments.find(a => a.scenarioCode === 'baseline' && (a.scenarioVersion || 1) === targetVersion)
                    || userAssessments.find(a => a.scenarioCode === 'baseline');
      const finalVal = userAssessments.find(a => a.scenarioCode === 'final' && (a.scenarioVersion || 1) === (baseline ? (baseline.scenarioVersion || 1) : targetVersion))
                    || userAssessments.find(a => a.scenarioCode === 'final');

      return {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
        badges: prog.badgesEarned || [],
        quizzesTakenCount: prog.quizAttempts ? prog.quizAttempts.length : 0,
        baselineScore: baseline ? baseline.score : null,
        finalScore: finalVal ? finalVal.score : null
      };
    });

    res.json(trackingList);
  } catch (error) {
    res.status(500).json({ message: 'Error tracking users progression', error: error.message });
  }
};

// Admin Audit log viewer with validated pagination, allowlisted filtering and bounded limits
exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter: actionType (allowlisted)
    if (req.query.actionType && ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'SYSTEM'].includes(req.query.actionType)) {
      query.actionType = req.query.actionType;
    }

    // Filter: entityType (allowlisted)
    const allowedEntities = ['LawSection', 'CyberCrime', 'CaseStudy', 'Quiz', 'Resource', 'QuizQuestion', 'User'];
    if (req.query.entityType && allowedEntities.includes(req.query.entityType)) {
      query.entityType = req.query.entityType;
    }

    // Filter: outcome (allowlisted)
    if (req.query.outcome && ['SUCCESS', 'FAILURE'].includes(req.query.outcome)) {
      query.outcome = req.query.outcome;
    }

    // Filter: adminId (must be valid 24-char ObjectId)
    if (req.query.adminId && /^[0-9a-fA-F]{24}$/.test(req.query.adminId)) {
      query.adminId = req.query.adminId;
    }

    // Filter: Date Range
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!isNaN(start.getTime())) {
          query.timestamp.$gte = start;
        }
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!isNaN(end.getTime())) {
          // If endDate is just YYYY-MM-DD, extend to end of that day
          if (/^\d{4}-\d{2}-\d{2}$/.test(req.query.endDate)) {
            end.setHours(23, 59, 59, 999);
          }
          query.timestamp.$lte = end;
        }
      }
      if (Object.keys(query.timestamp).length === 0) {
        delete query.timestamp;
      }
    }

    // Filter: Search across action or description
    if (req.query.search && typeof req.query.search === 'string') {
      const trimmed = req.query.search.trim().substring(0, 80);
      if (trimmed) {
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { action: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { entityType: { $regex: escaped, $options: 'i' } }
        ];
      }
    }

    // Sorting
    const allowedSortFields = ['timestamp', 'actionType', 'entityType', 'outcome'];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'timestamp';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    const [total, logs] = await Promise.all([
      AdminAuditLog.countDocuments(query),
      AdminAuditLog.find(query)
        .populate('adminId', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('[getAuditLogs Error]:', error.message);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit records' });
  }
};

// CRUD for Laws
exports.createLaw = async (req, res) => {
  try {
    const newLaw = await LawSection.create(req.body);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Section ${newLaw.sectionNumber}`,
      entityType: 'LawSection',
      entityId: newLaw._id,
      outcome: 'SUCCESS',
      description: `Created legal section ${newLaw.sectionNumber}: ${newLaw.officialTitle || ''}`,
      changes: req.body,
      metadata: { sectionNumber: newLaw.sectionNumber, actName: newLaw.actName }
    });
    res.status(201).json(newLaw);
  } catch (error) {
    console.error('[createLaw Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create LawSection`,
      entityType: 'LawSection',
      outcome: 'FAILURE',
      description: `Law section creation failed: ${error.message}`,
      metadata: { error: error.message }
    });
    res.status(400).json({ success: false, message: 'Error creating law section' });
  }
};

exports.updateLaw = async (req, res) => {
  try {
    const updated = await LawSection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Failed to update Section: Record not found`,
        entityType: 'LawSection',
        outcome: 'FAILURE',
        description: `Law section ID ${req.params.id} not found`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Law not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Updated Section ${updated.sectionNumber}`,
      entityType: 'LawSection',
      entityId: updated._id,
      outcome: 'SUCCESS',
      description: `Updated legal section ${updated.sectionNumber}`,
      changes: req.body,
      metadata: { sectionNumber: updated.sectionNumber }
    });
    res.json(updated);
  } catch (error) {
    console.error('[updateLaw Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update LawSection`,
      entityType: 'LawSection',
      outcome: 'FAILURE',
      description: `Law section update failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error updating law section' });
  }
};

exports.deleteLaw = async (req, res) => {
  try {
    const deleted = await LawSection.findByIdAndDelete(req.params.id);
    if (!deleted) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Failed to delete Section: Record not found`,
        entityType: 'LawSection',
        outcome: 'FAILURE',
        description: `Law section ID ${req.params.id} not found for deletion`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Law not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Section ${deleted.sectionNumber}`,
      entityType: 'LawSection',
      entityId: deleted._id,
      outcome: 'SUCCESS',
      description: `Deleted legal section ${deleted.sectionNumber}`,
      metadata: { sectionNumber: deleted.sectionNumber }
    });
    res.json({ message: 'Law section deleted successfully' });
  } catch (error) {
    console.error('[deleteLaw Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete LawSection`,
      entityType: 'LawSection',
      outcome: 'FAILURE',
      description: `Law section deletion failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error deleting law section' });
  }
};

// CRUD for Crimes
exports.createCrime = async (req, res) => {
  try {
    const newCrime = await CyberCrime.create(req.body);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Cybercrime: ${newCrime.title}`,
      entityType: 'CyberCrime',
      entityId: newCrime._id,
      outcome: 'SUCCESS',
      description: `Created cybercrime profile: ${newCrime.title} (${newCrime.category || 'General'})`,
      changes: req.body,
      metadata: { title: newCrime.title, slug: newCrime.slug, category: newCrime.category }
    });
    res.status(201).json(newCrime);
  } catch (error) {
    console.error('[createCrime Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create Cybercrime profile`,
      entityType: 'CyberCrime',
      outcome: 'FAILURE',
      description: `Cybercrime creation failed: ${error.message}`,
      metadata: { error: error.message }
    });
    res.status(400).json({ success: false, message: 'Error creating crime profile' });
  }
};

exports.updateCrime = async (req, res) => {
  try {
    const updated = await CyberCrime.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Failed to update Cybercrime: Record not found`,
        entityType: 'CyberCrime',
        outcome: 'FAILURE',
        description: `Cybercrime profile ID ${req.params.id} not found`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Crime category not found' });
    }

    let actionType = 'UPDATE';
    if (req.body.published === true) actionType = 'PUBLISH';
    else if (req.body.published === false) actionType = 'UNPUBLISH';

    await auditService.logAdminEvent({
      req,
      actionType,
      action: `Updated Cybercrime: ${updated.title}`,
      entityType: 'CyberCrime',
      entityId: updated._id,
      outcome: 'SUCCESS',
      description: `Updated cybercrime profile: ${updated.title}`,
      changes: req.body,
      metadata: { title: updated.title, slug: updated.slug }
    });
    res.json(updated);
  } catch (error) {
    console.error('[updateCrime Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update Cybercrime`,
      entityType: 'CyberCrime',
      outcome: 'FAILURE',
      description: `Cybercrime update failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error updating crime profile' });
  }
};

exports.deleteCrime = async (req, res) => {
  try {
    const deleted = await CyberCrime.findByIdAndDelete(req.params.id);
    if (!deleted) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Failed to delete Cybercrime: Record not found`,
        entityType: 'CyberCrime',
        outcome: 'FAILURE',
        description: `Cybercrime profile ID ${req.params.id} not found for deletion`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Crime not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Cybercrime: ${deleted.title}`,
      entityType: 'CyberCrime',
      entityId: deleted._id,
      outcome: 'SUCCESS',
      description: `Deleted cybercrime profile: ${deleted.title}`,
      metadata: { title: deleted.title }
    });
    res.json({ message: 'Crime category deleted successfully' });
  } catch (error) {
    console.error('[deleteCrime Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete Cybercrime`,
      entityType: 'CyberCrime',
      outcome: 'FAILURE',
      description: `Cybercrime deletion failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error deleting crime profile' });
  }
};

// CRUD for Case Studies
exports.createCase = async (req, res) => {
  try {
    const newCase = await CaseStudy.create(req.body);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Case Study: ${newCase.title}`,
      entityType: 'CaseStudy',
      entityId: newCase._id,
      outcome: 'SUCCESS',
      description: `Created case study: ${newCase.title}`,
      changes: req.body,
      metadata: { title: newCase.title, slug: newCase.slug }
    });
    res.status(201).json(newCase);
  } catch (error) {
    console.error('[createCase Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create Case Study`,
      entityType: 'CaseStudy',
      outcome: 'FAILURE',
      description: `Case study creation failed: ${error.message}`,
      metadata: { error: error.message }
    });
    res.status(400).json({ success: false, message: 'Error creating case study' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const updated = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Failed to update Case Study: Record not found`,
        entityType: 'CaseStudy',
        outcome: 'FAILURE',
        description: `Case study ID ${req.params.id} not found`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Updated Case Study: ${updated.title}`,
      entityType: 'CaseStudy',
      entityId: updated._id,
      outcome: 'SUCCESS',
      description: `Updated case study: ${updated.title}`,
      changes: req.body,
      metadata: { title: updated.title }
    });
    res.json(updated);
  } catch (error) {
    console.error('[updateCase Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update Case Study`,
      entityType: 'CaseStudy',
      outcome: 'FAILURE',
      description: `Case study update failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error updating case study' });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const deleted = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!deleted) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Failed to delete Case Study: Record not found`,
        entityType: 'CaseStudy',
        outcome: 'FAILURE',
        description: `Case study ID ${req.params.id} not found for deletion`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Case Study: ${deleted.title}`,
      entityType: 'CaseStudy',
      entityId: deleted._id,
      outcome: 'SUCCESS',
      description: `Deleted case study: ${deleted.title}`,
      metadata: { title: deleted.title }
    });
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    console.error('[deleteCase Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete Case Study`,
      entityType: 'CaseStudy',
      outcome: 'FAILURE',
      description: `Case study deletion failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error deleting case study' });
  }
};

// Quizzes & Questions Administration
exports.getAdminQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    const populated = await Promise.all(quizzes.map(async (quiz) => {
      const questionCount = await QuizQuestion.countDocuments({ quizId: quiz._id });
      const publishedQuestionCount = await QuizQuestion.countDocuments({ quizId: quiz._id, published: true });
      const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id });
      return {
        _id: quiz._id,
        id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        description: quiz.description,
        difficulty: quiz.difficulty,
        relatedModule: quiz.relatedModule,
        published: quiz.published,
        questionCount,
        publishedQuestionCount,
        attemptCount,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt
      };
    }));
    res.json(populated);
  } catch (error) {
    console.error('[getAdminQuizzes Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching quizzes for administrator' });
  }
};

exports.getAdminQuizById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format' });
    }
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ createdAt: 1 });
    const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id });

    res.json({
      quiz: {
        _id: quiz._id,
        id: quiz._id,
        title: quiz.title,
        category: quiz.category,
        description: quiz.description,
        difficulty: quiz.difficulty,
        relatedModule: quiz.relatedModule,
        published: quiz.published,
        questionCount: questions.length,
        attemptCount,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt
      },
      questions: questions.map(q => ({
        _id: q._id,
        id: q._id,
        quizId: q.quizId,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        questionType: q.questionType,
        category: q.category,
        difficulty: q.difficulty,
        cognitiveLevel: q.cognitiveLevel,
        topicTag: q.topicTag,
        learningObjective: q.learningObjective,
        relatedLawSection: q.relatedLawSection,
        relatedLaw: q.relatedLaw,
        relatedCrime: q.relatedCrime,
        relatedModule: q.relatedModule,
        published: q.published,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }))
    });
  } catch (error) {
    console.error('[getAdminQuizById Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching quiz details' });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, category, description, difficulty, relatedModule, published } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz title is required' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ success: false, message: 'Quiz category is required' });
    }

    const newQuiz = await Quiz.create({
      title: title.trim(),
      category: category.trim(),
      description: description ? description.trim() : '',
      difficulty: difficulty || 'Medium',
      relatedModule: relatedModule ? relatedModule.trim() : '',
      published: published !== undefined ? Boolean(published) : true
    });

    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Quiz Category: ${newQuiz.title}`,
      entityType: 'Quiz',
      entityId: newQuiz._id,
      outcome: 'SUCCESS',
      description: `Created quiz module: ${newQuiz.title}`,
      changes: req.body,
      metadata: { title: newQuiz.title, category: newQuiz.category }
    });

    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('[createQuiz Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create Quiz`,
      entityType: 'Quiz',
      outcome: 'FAILURE',
      description: `Quiz creation failed: ${error.message}`,
      metadata: { error: error.message }
    });
    res.status(400).json({ success: false, message: error.message || 'Error creating quiz' });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format' });
    }

    const currentQuiz = await Quiz.findById(req.params.id);
    if (!currentQuiz) {
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Failed to update Quiz: Record not found`,
        entityType: 'Quiz',
        outcome: 'FAILURE',
        description: `Quiz ID ${req.params.id} not found`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    const { title, category, description, difficulty, relatedModule, published } = req.body;
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title.trim();
    if (category !== undefined) updatePayload.category = category.trim();
    if (description !== undefined) updatePayload.description = description.trim();
    if (difficulty !== undefined) updatePayload.difficulty = difficulty;
    if (relatedModule !== undefined) updatePayload.relatedModule = relatedModule.trim();
    if (published !== undefined) updatePayload.published = Boolean(published);

    const updated = await Quiz.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });

    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Updated Quiz Category: ${updated.title}`,
      entityType: 'Quiz',
      entityId: updated._id,
      outcome: 'SUCCESS',
      description: `Updated quiz module: ${updated.title}`,
      changes: req.body,
      metadata: { title: updated.title }
    });

    res.json(updated);
  } catch (error) {
    console.error('[updateQuiz Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update Quiz`,
      entityType: 'Quiz',
      outcome: 'FAILURE',
      description: `Quiz update failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: error.message || 'Error updating quiz' });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Failed to delete Quiz: Record not found`,
        entityType: 'Quiz',
        outcome: 'FAILURE',
        description: `Quiz ID ${req.params.id} not found for deletion`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Safety guard: Protect historical learner attempts from corruption
    const attemptCount = await QuizAttempt.countDocuments({ quizId: quiz._id });
    if (attemptCount > 0) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Blocked deletion of Quiz with historical learner attempts`,
        entityType: 'Quiz',
        entityId: quiz._id,
        outcome: 'FAILURE',
        description: `Attempted to delete Quiz "${quiz.title}" with ${attemptCount} historical attempts. Mutation rejected to preserve attempt integrity.`,
        metadata: { title: quiz.title, attemptCount }
      });
      return res.status(400).json({
        success: false,
        message: `Cannot delete quiz "${quiz.title}": ${attemptCount} historical learner attempt(s) exist. Please unpublish the quiz instead to preserve assessment and score integrity.`
      });
    }

    // Delete associated questions and the quiz itself
    const deletedQuestions = await QuizQuestion.deleteMany({ quizId: quiz._id });
    await Quiz.findByIdAndDelete(quiz._id);

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Quiz Category: ${quiz.title}`,
      entityType: 'Quiz',
      entityId: quiz._id,
      outcome: 'SUCCESS',
      description: `Deleted quiz module: ${quiz.title} and ${deletedQuestions.deletedCount} associated questions`,
      metadata: { title: quiz.title, deletedQuestionsCount: deletedQuestions.deletedCount }
    });

    res.json({ success: true, message: 'Quiz and associated questions deleted successfully' });
  } catch (error) {
    console.error('[deleteQuiz Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete Quiz`,
      entityType: 'Quiz',
      outcome: 'FAILURE',
      description: `Quiz deletion failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error deleting quiz' });
  }
};

exports.createQuizQuestion = async (req, res) => {
  try {
    const { id: quizId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Parent Quiz not found' });
    }

    const {
      questionText,
      options,
      correctOptionIndex,
      explanation,
      questionType,
      category,
      difficulty,
      cognitiveLevel,
      topicTag,
      learningObjective,
      relatedLaw,
      relatedLawSection,
      relatedCrime,
      relatedModule,
      published
    } = req.body;

    if (!questionText || typeof questionText !== 'string' || !questionText.trim()) {
      return res.status(400).json({ success: false, message: 'Question text is required' });
    }

    const cleanOptions = Array.isArray(options)
      ? options.map(o => String(o).trim()).filter(Boolean)
      : (typeof options === 'string' ? options.split('\n').map(o => o.trim()).filter(Boolean) : []);

    if (cleanOptions.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 non-empty options are required' });
    }

    const numIndex = Number(correctOptionIndex);
    if (isNaN(numIndex) || numIndex < 0 || numIndex >= cleanOptions.length) {
      return res.status(400).json({ success: false, message: `correctOptionIndex must be an integer between 0 and ${cleanOptions.length - 1}` });
    }

    if (!explanation || typeof explanation !== 'string' || !explanation.trim()) {
      return res.status(400).json({ success: false, message: 'Explanation is required' });
    }

    const newQuestion = await QuizQuestion.create({
      quizId: quiz._id,
      questionText: questionText.trim(),
      options: cleanOptions,
      correctOptionIndex: numIndex,
      explanation: explanation.trim(),
      questionType: questionType || 'knowledge',
      category: (category && category.trim()) || quiz.category,
      difficulty: difficulty || quiz.difficulty || 'Intermediate',
      cognitiveLevel: cognitiveLevel || 'Level 1',
      topicTag: topicTag ? topicTag.trim() : '',
      learningObjective: learningObjective ? learningObjective.trim() : '',
      relatedLaw: relatedLaw ? relatedLaw.trim() : '',
      relatedLawSection: relatedLawSection ? relatedLawSection.trim() : '',
      relatedCrime: relatedCrime ? relatedCrime.trim() : '',
      relatedModule: relatedModule ? relatedModule.trim() : (quiz.relatedModule || ''),
      published: published !== undefined ? Boolean(published) : true
    });

    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Quiz Question for: ${quiz.title}`,
      entityType: 'QuizQuestion',
      entityId: newQuestion._id,
      outcome: 'SUCCESS',
      description: `Created quiz question in "${quiz.title}": "${newQuestion.questionText.substring(0, 40)}..."`,
      metadata: { quizId: quiz._id, quizTitle: quiz.title, questionText: newQuestion.questionText.substring(0, 50) }
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('[createQuizQuestion Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create Quiz Question`,
      entityType: 'QuizQuestion',
      outcome: 'FAILURE',
      description: `Quiz question creation failed: ${error.message}`,
      metadata: { error: error.message, quizId: req.params.id }
    });
    res.status(400).json({ success: false, message: error.message || 'Error creating question' });
  }
};

exports.updateQuizQuestion = async (req, res) => {
  try {
    const { id: quizId, questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const question = await QuizQuestion.findOne({ _id: questionId, quizId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found for this quiz' });
    }

    const {
      questionText,
      options,
      correctOptionIndex,
      explanation,
      questionType,
      category,
      difficulty,
      cognitiveLevel,
      topicTag,
      learningObjective,
      relatedLaw,
      relatedLawSection,
      relatedCrime,
      relatedModule,
      published
    } = req.body;

    const updatePayload = {};
    if (questionText !== undefined) updatePayload.questionText = questionText.trim();
    if (explanation !== undefined) updatePayload.explanation = explanation.trim();
    if (questionType !== undefined) updatePayload.questionType = questionType;
    if (category !== undefined) updatePayload.category = category.trim();
    if (difficulty !== undefined) updatePayload.difficulty = difficulty;
    if (cognitiveLevel !== undefined) updatePayload.cognitiveLevel = cognitiveLevel;
    if (topicTag !== undefined) updatePayload.topicTag = topicTag.trim();
    if (learningObjective !== undefined) updatePayload.learningObjective = learningObjective.trim();
    if (relatedLaw !== undefined) updatePayload.relatedLaw = relatedLaw.trim();
    if (relatedLawSection !== undefined) updatePayload.relatedLawSection = relatedLawSection.trim();
    if (relatedCrime !== undefined) updatePayload.relatedCrime = relatedCrime.trim();
    if (relatedModule !== undefined) updatePayload.relatedModule = relatedModule.trim();
    if (published !== undefined) updatePayload.published = Boolean(published);

    if (options !== undefined) {
      const cleanOptions = Array.isArray(options)
        ? options.map(o => String(o).trim()).filter(Boolean)
        : (typeof options === 'string' ? options.split('\n').map(o => o.trim()).filter(Boolean) : []);
      if (cleanOptions.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 non-empty options are required' });
      }
      updatePayload.options = cleanOptions;
    }

    if (correctOptionIndex !== undefined) {
      const currentOpts = updatePayload.options || question.options;
      const numIndex = Number(correctOptionIndex);
      if (isNaN(numIndex) || numIndex < 0 || numIndex >= currentOpts.length) {
        return res.status(400).json({ success: false, message: `correctOptionIndex must be between 0 and ${currentOpts.length - 1}` });
      }
      updatePayload.correctOptionIndex = numIndex;
    }

    const updatedQuestion = await QuizQuestion.findByIdAndUpdate(questionId, updatePayload, { new: true, runValidators: true });

    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Updated Quiz Question: ${updatedQuestion.questionText.substring(0, 30)}...`,
      entityType: 'QuizQuestion',
      entityId: updatedQuestion._id,
      outcome: 'SUCCESS',
      description: `Updated question in quiz ID: ${quizId}`,
      changes: req.body,
      metadata: { questionId, quizId }
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('[updateQuizQuestion Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update Quiz Question`,
      entityType: 'QuizQuestion',
      outcome: 'FAILURE',
      description: `Question update failed: ${error.message}`,
      metadata: { error: error.message, questionId: req.params.questionId }
    });
    res.status(500).json({ success: false, message: error.message || 'Error updating question' });
  }
};

exports.deleteQuizQuestion = async (req, res) => {
  try {
    const { id: quizId, questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(quizId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const question = await QuizQuestion.findOne({ _id: questionId, quizId });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Check if any learner attempts contain an answer referencing this question
    const attemptsWithQuestion = await QuizAttempt.countDocuments({ "answers.questionId": question._id });
    if (attemptsWithQuestion > 0) {
      // Soft-delete (unpublish) to avoid corrupting historical attempts
      await QuizQuestion.findByIdAndUpdate(question._id, { published: false });
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Unpublished Question with historical learner attempts`,
        entityType: 'QuizQuestion',
        entityId: question._id,
        outcome: 'SUCCESS',
        description: `Question "${question.questionText.substring(0, 40)}" has ${attemptsWithQuestion} historical learner attempts; set published = false to protect history.`,
        metadata: { questionId, attemptsWithQuestion }
      });
      return res.json({
        success: true,
        message: `Question has ${attemptsWithQuestion} historical learner attempt(s). It has been safely unpublished rather than deleted to protect learner history.`,
        unpublished: true,
        softUnpublished: true
      });
    }

    // Permanent deletion if no historical learner attempts exist
    await QuizQuestion.findByIdAndDelete(question._id);

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Quiz Question`,
      entityType: 'QuizQuestion',
      entityId: question._id,
      outcome: 'SUCCESS',
      description: `Permanently deleted question: "${question.questionText.substring(0, 40)}"`,
      metadata: { questionId, quizId }
    });

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('[deleteQuizQuestion Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete Quiz Question`,
      entityType: 'QuizQuestion',
      outcome: 'FAILURE',
      description: `Question deletion failed: ${error.message}`,
      metadata: { error: error.message, questionId: req.params.questionId }
    });
    res.status(500).json({ success: false, message: 'Error deleting question' });
  }
};

// CRUD for Resources
exports.createResource = async (req, res) => {
  try {
    const newRes = await Resource.create(req.body);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Created Resource: ${newRes.title}`,
      entityType: 'Resource',
      entityId: newRes._id,
      outcome: 'SUCCESS',
      description: `Created resource link: ${newRes.title}`,
      changes: req.body,
      metadata: { title: newRes.title, type: newRes.type }
    });
    res.status(201).json(newRes);
  } catch (error) {
    console.error('[createResource Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'CREATE',
      action: `Failed to create Resource`,
      entityType: 'Resource',
      outcome: 'FAILURE',
      description: `Resource creation failed: ${error.message}`,
      metadata: { error: error.message }
    });
    res.status(400).json({ success: false, message: 'Error creating resource link' });
  }
};

exports.updateResource = async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) {
      await auditService.logAdminEvent({
        req,
        actionType: 'UPDATE',
        action: `Failed to update Resource: Record not found`,
        entityType: 'Resource',
        outcome: 'FAILURE',
        description: `Resource ID ${req.params.id} not found`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Updated Resource: ${updated.title}`,
      entityType: 'Resource',
      entityId: updated._id,
      outcome: 'SUCCESS',
      description: `Updated resource link: ${updated.title}`,
      changes: req.body,
      metadata: { title: updated.title }
    });
    res.json(updated);
  } catch (error) {
    console.error('[updateResource Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'UPDATE',
      action: `Failed to update Resource`,
      entityType: 'Resource',
      outcome: 'FAILURE',
      description: `Resource update failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error updating resource link' });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const deleted = await Resource.findByIdAndDelete(req.params.id);
    if (!deleted) {
      await auditService.logAdminEvent({
        req,
        actionType: 'DELETE',
        action: `Failed to delete Resource: Record not found`,
        entityType: 'Resource',
        outcome: 'FAILURE',
        description: `Resource ID ${req.params.id} not found for deletion`,
        metadata: { targetId: req.params.id }
      });
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Deleted Resource: ${deleted.title}`,
      entityType: 'Resource',
      entityId: deleted._id,
      outcome: 'SUCCESS',
      description: `Deleted resource link: ${deleted.title}`,
      metadata: { title: deleted.title }
    });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('[deleteResource Error]:', error.message);
    await auditService.logAdminEvent({
      req,
      actionType: 'DELETE',
      action: `Failed to delete Resource`,
      entityType: 'Resource',
      outcome: 'FAILURE',
      description: `Resource deletion failed: ${error.message}`,
      metadata: { targetId: req.params.id, error: error.message }
    });
    res.status(500).json({ success: false, message: 'Error deleting resource link' });
  }
};

// Scenario Engine Administration & Graph Integrity Verification (Read-Only Graph & Structure Inspection)
exports.getAdminScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.find().sort({ slug: 1, version: 1 });
    const populated = await Promise.all(scenarios.map(async (s) => {
      const stageCount = await ScenarioStage.countDocuments({ scenarioId: s._id });
      const stages = await ScenarioStage.find({ scenarioId: s._id }).select('_id');
      const stageIds = stages.map(st => st._id);
      const decisionCount = await ScenarioDecision.countDocuments({ stageId: { $in: stageIds } });
      const sessionCount = await AssessmentSession.countDocuments({ scenarioId: s._id });
      return {
        _id: s._id,
        id: s._id,
        title: s.title,
        slug: s.slug,
        code: s.code || s.slug,
        version: s.version,
        assessmentType: s.assessmentType,
        status: s.status,
        type: s.type,
        domain: s.domain,
        difficulty: s.difficulty,
        estimatedDuration: s.estimatedDuration,
        active: s.active,
        stageCount,
        decisionCount,
        sessionCount,
        configuredWeights: s.configuredWeights,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      };
    }));
    res.json(populated);
  } catch (error) {
    console.error('[getAdminScenarios Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching scenarios' });
  }
};

exports.getAdminScenarioById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid scenario ID format' });
    }
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, message: 'Scenario not found' });
    }

    const stages = await ScenarioStage.find({ scenarioId: scenario._id }).sort({ stageOrder: 1 }).lean();
    const stageIds = stages.map(s => s._id);
    const decisions = await ScenarioDecision.find({ stageId: { $in: stageIds } }).lean();

    const decisionMap = new Map();
    decisions.forEach(d => {
      const sid = d.stageId.toString();
      if (!decisionMap.has(sid)) decisionMap.set(sid, []);
      decisionMap.get(sid).push(d);
    });

    const populatedStages = stages.map(st => ({
      ...st,
      decisions: decisionMap.get(st._id.toString()) || []
    }));

    const sessionCount = await AssessmentSession.countDocuments({ scenarioId: scenario._id });

    res.json({
      scenario: {
        ...scenario.toObject(),
        sessionCount,
        stageCount: stages.length,
        decisionCount: decisions.length
      },
      stages: populatedStages
    });
  } catch (error) {
    console.error('[getAdminScenarioById Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching scenario graph' });
  }
};

exports.auditAdminScenario = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid scenario ID format' });
    }
    const auditResult = await scenarioIntegrityService.auditScenario(req.params.id);
    res.json(auditResult);
  } catch (error) {
    console.error('[auditAdminScenario Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error executing scenario audit: ' + error.message });
  }
};

// Comprehensive Administrative Dashboard Overview (Decision & Overview Layer)
exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Content Operations Counts & Timestamps
    const [
      lawsCount,
      latestLaw,
      crimesCount,
      latestCrime,
      casesCount,
      latestCase,
      resourcesCount,
      latestResource,
      totalQuizzes,
      publishedQuizzes,
      draftQuizzes,
      totalQuestions,
      publishedQuestions,
      draftQuestions,
      totalQuizAttempts
    ] = await Promise.all([
      LawSection.countDocuments(),
      LawSection.findOne().sort({ updatedAt: -1 }).select('updatedAt officialTitle sectionNumber'),
      CyberCrime.countDocuments(),
      CyberCrime.findOne().sort({ updatedAt: -1 }).select('updatedAt title'),
      CaseStudy.countDocuments(),
      CaseStudy.findOne().sort({ updatedAt: -1 }).select('updatedAt title'),
      Resource.countDocuments(),
      Resource.findOne().sort({ updatedAt: -1 }).select('updatedAt title'),
      Quiz.countDocuments(),
      Quiz.countDocuments({ published: true }),
      Quiz.countDocuments({ published: false }),
      QuizQuestion.countDocuments(),
      QuizQuestion.countDocuments({ published: true }),
      QuizQuestion.countDocuments({ published: false }),
      QuizAttempt.countDocuments()
    ]);

    // 2. Assessment Scenarios & Live Graph Integrity Audit
    const scenarios = await Scenario.find().sort({ slug: 1, version: 1 }).lean();
    const scenarioSummaries = await Promise.all(scenarios.map(async (s) => {
      const stageCount = await ScenarioStage.countDocuments({ scenarioId: s._id });
      const stages = await ScenarioStage.find({ scenarioId: s._id }).select('_id');
      const stageIds = stages.map(st => st._id);
      const decisionCount = await ScenarioDecision.countDocuments({ stageId: { $in: stageIds } });
      const sessionCount = await AssessmentSession.countDocuments({ scenarioId: s._id });
      
      // Perform fast live integrity audit
      const auditResult = await scenarioIntegrityService.auditScenario(s._id);

      return {
        _id: s._id,
        title: s.title,
        slug: s.slug,
        version: s.version,
        assessmentType: s.assessmentType,
        status: s.status,
        active: s.active,
        stageCount,
        decisionCount,
        sessionCount,
        integrityValid: auditResult.valid,
        integrityErrors: auditResult.errors.length,
        integrityWarnings: auditResult.warnings.length
      };
    }));

    // 3. Recent Real Persisted Audit Events
    const recentAuditLogs = await AdminAuditLog.find()
      .sort({ timestamp: -1 })
      .limit(6)
      .populate('adminId', 'fullName email')
      .lean();

    // 4. Actionable Attention Items (Real conditions only)
    const attentionItems = [];

    // Check for draft quizzes
    if (draftQuizzes > 0) {
      const draftList = await Quiz.find({ published: false }).select('title _id').limit(3);
      attentionItems.push({
        id: 'draft-quizzes',
        severity: 'info',
        title: `${draftQuizzes} Quiz Module(s) in Draft Mode`,
        description: `Draft quizzes are hidden from learners. Review and publish when ready (${draftList.map(q => q.title).join(', ')}).`,
        targetTab: 'quizzes',
        actionLabel: 'Review Quizzes'
      });
    }

    // Check for quizzes with low question banks
    const allQuizzes = await Quiz.find().lean();
    for (const q of allQuizzes) {
      const qCount = await QuizQuestion.countDocuments({ quizId: q._id, published: true });
      if (qCount < 5) {
        attentionItems.push({
          id: `low-questions-${q._id}`,
          severity: 'warning',
          title: `Low Question Count in "${q.title}"`,
          description: `Only ${qCount} published question(s) in bank. Student quizzes select up to 10 questions dynamically.`,
          targetTab: 'quizzes',
          targetId: q._id,
          actionLabel: 'Manage Questions'
        });
      }
    }

    // Check for recent administrative failures
    const recentFailures = await AdminAuditLog.find({ outcome: 'FAILURE' })
      .sort({ timestamp: -1 })
      .limit(3)
      .lean();
    if (recentFailures.length > 0) {
      attentionItems.push({
        id: 'recent-audit-failures',
        severity: 'warning',
        title: `${recentFailures.length} Recent Administrative Mutation Failure(s)`,
        description: `Latest: "${recentFailures[0].action}" — ${recentFailures[0].description || 'Operation failed'}`,
        targetTab: 'audit',
        actionLabel: 'Inspect Audit Logs'
      });
    }

    // Check for scenario graph integrity defects
    const defectiveScenarios = scenarioSummaries.filter(s => !s.integrityValid || s.integrityErrors > 0);
    if (defectiveScenarios.length > 0) {
      attentionItems.push({
        id: 'scenario-integrity-defect',
        severity: 'critical',
        title: `Integrity Defect in Scenario Graph: ${defectiveScenarios.map(s => s.title).join(', ')}`,
        description: 'Topology check reported invalid node transitions or missing start/end nodes.',
        targetTab: 'scenarios',
        actionLabel: 'Inspect Scenarios'
      });
    }

    // 5. Operational Student Statistics
    const [totalUsers, completedAssessments] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      AssessmentSession.countDocuments({ status: 'completed' })
    ]);

    res.json({
      success: true,
      system: {
        status: 'OPERATIONAL',
        environment: process.env.NODE_ENV || 'development',
        databaseConnected: mongoose.connection.readyState === 1,
        serverTime: new Date().toISOString(),
        version: '1.0.0'
      },
      content: {
        laws: {
          total: lawsCount,
          latestUpdate: latestLaw ? latestLaw.updatedAt : null,
          latestTitle: latestLaw ? `${latestLaw.sectionNumber} - ${latestLaw.officialTitle}` : null
        },
        crimes: {
          total: crimesCount,
          latestUpdate: latestCrime ? latestCrime.updatedAt : null,
          latestTitle: latestCrime ? latestCrime.title : null
        },
        cases: {
          total: casesCount,
          latestUpdate: latestCase ? latestCase.updatedAt : null,
          latestTitle: latestCase ? latestCase.title : null
        },
        resources: {
          total: resourcesCount,
          latestUpdate: latestResource ? latestResource.updatedAt : null,
          latestTitle: latestResource ? latestResource.title : null
        },
        quizzes: {
          total: totalQuizzes,
          published: publishedQuizzes,
          draft: draftQuizzes,
          totalQuestions,
          publishedQuestions,
          draftQuestions,
          totalAttempts: totalQuizAttempts
        }
      },
      scenarios: scenarioSummaries,
      recentAuditLogs,
      attentionItems,
      operationalStats: {
        totalUsers,
        completedAssessments,
        totalQuizAttempts
      }
    });
  } catch (error) {
    console.error('[getDashboardSummary Error]:', error.message);
    res.status(500).json({ success: false, message: 'Error compiling administrative dashboard overview: ' + error.message });
  }
};


