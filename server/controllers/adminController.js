const User = require('../models/User');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Quiz = require('../models/Quiz');
const QuizQuestion = require('../models/QuizQuestion');
const Resource = require('../models/Resource');
const AssessmentSession = require('../models/AssessmentSession');
const AdminAuditLog = require('../models/AdminAuditLog');
const UserProgress = require('../models/UserProgress');

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const assessments = await AssessmentSession.find({ status: 'completed' });

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

      if (userBaselines.length > 0 && userFinals.length > 0) {
        const lastBase = userBaselines[userBaselines.length - 1].score;
        const lastFinal = userFinals[userFinals.length - 1].score;
        totalDelta += (lastFinal - lastBase);
        usersWithBoth++;
      }
    });

    const avgImprovement = usersWithBoth > 0 ? Math.round(totalDelta / usersWithBoth) : 0;

    // Weakest Area
    const weakCategoryCounts = {};
    assessments.forEach(a => {
      if (a.categoryScores) {
        for (let [cat, score] of a.categoryScores.entries()) {
          if (score < 70) {
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

    res.json({
      totalUsers,
      assessmentsCount: assessments.length,
      avgBaselineScore: avgBaseline,
      avgFinalScore: avgFinal,
      avgImprovement,
      weakestArea: weakestCategory,
      weakestAreaCount: maxCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

exports.getUsersProgress = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' });
    const progressRecords = await UserProgress.find();
    const assessments = await AssessmentSession.find({ status: 'completed' });

    const trackingList = users.map(user => {
      const prog = progressRecords.find(p => p.userId.toString() === user._id.toString()) || {};
      const userAssessments = assessments.filter(a => a.userId.toString() === user._id.toString());
      
      const baseline = userAssessments.find(a => a.scenarioCode === 'baseline');
      const finalVal = userAssessments.find(a => a.scenarioCode === 'final');

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

// Admin Audit log viewer
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AdminAuditLog.find().populate('adminId', 'fullName email').sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving audit logs', error: error.message });
  }
};

// CRUD for Laws
exports.createLaw = async (req, res) => {
  try {
    const newLaw = await LawSection.create(req.body);
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Section ${newLaw.sectionNumber}`,
      entityType: 'LawSection',
      entityId: newLaw._id,
      changes: req.body
    });
    res.status(201).json(newLaw);
  } catch (error) {
    res.status(500).json({ message: 'Error creating law section', error: error.message });
  }
};
exports.updateLaw = async (req, res) => {
  try {
    const updated = await LawSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Law not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Section ${updated.sectionNumber}`,
      entityType: 'LawSection',
      entityId: updated._id,
      changes: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating law section', error: error.message });
  }
};
exports.deleteLaw = async (req, res) => {
  try {
    const deleted = await LawSection.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Law not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Section ${deleted.sectionNumber}`,
      entityType: 'LawSection',
      entityId: deleted._id
    });
    res.json({ message: 'Law section deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting law section', error: error.message });
  }
};

// CRUD for Crimes
exports.createCrime = async (req, res) => {
  try {
    const newCrime = await CyberCrime.create(req.body);
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Cybercrime Category: ${newCrime.title}`,
      entityType: 'CyberCrime',
      entityId: newCrime._id,
      changes: req.body
    });
    res.status(201).json(newCrime);
  } catch (error) {
    res.status(500).json({ message: 'Error creating crime profile', error: error.message });
  }
};
exports.updateCrime = async (req, res) => {
  try {
    const updated = await CyberCrime.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Crime category not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Cybercrime Category: ${updated.title}`,
      entityType: 'CyberCrime',
      entityId: updated._id,
      changes: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating crime profile', error: error.message });
  }
};
exports.deleteCrime = async (req, res) => {
  try {
    const deleted = await CyberCrime.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Crime not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Cybercrime Category: ${deleted.title}`,
      entityType: 'CyberCrime',
      entityId: deleted._id
    });
    res.json({ message: 'Crime category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting crime profile', error: error.message });
  }
};

// CRUD for Case Studies
exports.createCase = async (req, res) => {
  try {
    const newCase = await CaseStudy.create(req.body);
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Case Study: ${newCase.title}`,
      entityType: 'CaseStudy',
      entityId: newCase._id,
      changes: req.body
    });
    res.status(201).json(newCase);
  } catch (error) {
    res.status(500).json({ message: 'Error creating case study', error: error.message });
  }
};
exports.updateCase = async (req, res) => {
  try {
    const updated = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Case not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Case Study: ${updated.title}`,
      entityType: 'CaseStudy',
      entityId: updated._id,
      changes: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating case study', error: error.message });
  }
};
exports.deleteCase = async (req, res) => {
  try {
    const deleted = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Case not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Case Study: ${deleted.title}`,
      entityType: 'CaseStudy',
      entityId: deleted._id
    });
    res.json({ message: 'Case study deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting case study', error: error.message });
  }
};

// CRUD for Quizzes
exports.createQuiz = async (req, res) => {
  try {
    const newQuiz = await Quiz.create(req.body);
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Quiz Category: ${newQuiz.title}`,
      entityType: 'Quiz',
      entityId: newQuiz._id,
      changes: req.body
    });
    res.status(201).json(newQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quiz', error: error.message });
  }
};
exports.updateQuiz = async (req, res) => {
  try {
    const updated = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Quiz not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Quiz Category: ${updated.title}`,
      entityType: 'Quiz',
      entityId: updated._id,
      changes: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quiz', error: error.message });
  }
};
exports.deleteQuiz = async (req, res) => {
  try {
    const deleted = await Quiz.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Quiz not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Quiz Category: ${deleted.title}`,
      entityType: 'Quiz',
      entityId: deleted._id
    });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quiz', error: error.message });
  }
};

// CRUD for Resources
exports.createResource = async (req, res) => {
  try {
    const newRes = await Resource.create(req.body);
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Resource Link: ${newRes.title}`,
      entityType: 'Resource',
      entityId: newRes._id,
      changes: req.body
    });
    res.status(201).json(newRes);
  } catch (error) {
    res.status(500).json({ message: 'Error creating resource link', error: error.message });
  }
};
exports.updateResource = async (req, res) => {
  try {
    const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Resource not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Resource Link: ${updated.title}`,
      entityType: 'Resource',
      entityId: updated._id,
      changes: req.body
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource link', error: error.message });
  }
};
exports.deleteResource = async (req, res) => {
  try {
    const deleted = await Resource.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Resource not found' });
    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Resource Link: ${deleted.title}`,
      entityType: 'Resource',
      entityId: deleted._id
    });
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource link', error: error.message });
  }
};
