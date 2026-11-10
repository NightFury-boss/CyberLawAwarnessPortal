const LearningModule = require('../models/LearningModule');
const LawSection = require('../models/LawSection');
const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const UserProgress = require('../models/UserProgress');
const AdminAuditLog = require('../models/AdminAuditLog');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../config/productionSecurity');

/**
 * Helper to get or initialize a learner's UserProgress document
 */
async function getOrCreateUserProgress(userId) {
  let progress = await UserProgress.findOne({ userId });
  if (!progress) {
    progress = await UserProgress.create({
      userId,
      completedModules: [],
      lessonProgress: [],
      badgesEarned: ['First Step'],
      currentStreak: 1,
      lastActivity: new Date()
    });
  }
  if (!Array.isArray(progress.completedModules)) {
    progress.completedModules = [];
  }
  if (!Array.isArray(progress.lessonProgress)) {
    progress.lessonProgress = [];
  }
  return progress;
}

/**
 * Helper to find or create lesson progress entry for a slug
 */
function getOrCreateLessonEntry(progress, slug) {
  let entry = progress.lessonProgress.find(lp => lp.slug === slug);
  if (!entry) {
    progress.lessonProgress.push({
      slug,
      status: 'not_started',
      readCompleted: false,
      readCompletedAt: null,
      knowledgeCheckStatus: 'unattempted',
      knowledgeCheckScore: null,
      lastAnswerIndex: null,
      checkResults: [],
      lastAccessedAt: new Date(),
      firstStartedAt: new Date()
    });
    entry = progress.lessonProgress[progress.lessonProgress.length - 1];
  }
  if (!Array.isArray(entry.checkResults)) {
    entry.checkResults = [];
  }
  return entry;
}

/**
 * Recomputes aggregate status for a lesson entry
 */
function deriveLessonStatus(entry) {
  if (entry.knowledgeCheckStatus === 'passed') {
    return 'knowledge_check_passed';
  }
  if (entry.readCompleted) {
    return 'read_completed';
  }
  if (entry.knowledgeCheckStatus === 'failed' || entry.knowledgeCheckStatus === 'attempted') {
    return 'knowledge_check_attempted';
  }
  if (entry.status === 'in_progress' || entry.firstStartedAt) {
    return 'in_progress';
  }
  return 'not_started';
}

/**
 * GET /api/modules
 * Authenticated learner route returning published modules with granular completion states
 */
exports.getModules = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const userId = req.user._id;
    const { category, difficulty, search } = req.query;
    const query = { published: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { summary: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } }
      ];
    }

    const modules = await LearningModule.find(query)
      .sort({ order: 1, createdAt: 1 })
      .select('title slug category summary difficulty estimatedMinutes order icon published keyTakeaways actionSteps relatedLawSections relatedCyberCrimes createdAt');

    const progress = await getOrCreateUserProgress(userId);
    const progressList = progress.lessonProgress || [];
    const completedSlugs = progress.completedModules || [];

    const enrichedModules = modules.map(m => {
      const mObj = m.toObject();
      const pEntry = progressList.find(p => p.slug === m.slug);
      const isLegacyCompleted = completedSlugs.includes(m.slug);

      const status = pEntry ? deriveLessonStatus(pEntry) : (isLegacyCompleted ? 'read_completed' : 'not_started');
      const readCompleted = pEntry ? Boolean(pEntry.readCompleted) : isLegacyCompleted;
      const knowledgeCheckStatus = pEntry ? (pEntry.knowledgeCheckStatus || 'unattempted') : 'unattempted';

      return {
        ...mObj,
        status,
        readCompleted,
        knowledgeCheckStatus,
        isCompleted: readCompleted || status === 'knowledge_check_passed',
        lastAccessedAt: pEntry?.lastAccessedAt || null
      };
    });

    const distinctCategories = await LearningModule.distinct('category', { published: true });

    // Derive recently accessed lesson
    const sortedAccess = enrichedModules
      .filter(m => m.lastAccessedAt)
      .sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt));
    const recentlyAccessed = sortedAccess.length > 0 ? sortedAccess[0] : null;

    const completedCount = enrichedModules.filter(m => m.readCompleted || m.status === 'knowledge_check_passed').length;
    const inProgressCount = enrichedModules.filter(m => m.status === 'in_progress' || m.status === 'knowledge_check_attempted').length;

    res.json({
      success: true,
      count: enrichedModules.length,
      categories: ['All', ...distinctCategories],
      modules: enrichedModules,
      userProgress: {
        completedCount,
        inProgressCount,
        totalCount: enrichedModules.length,
        recentlyAccessed
      }
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving modules', error: error.message });
  }
};

/**
 * GET /api/modules/:slug
 * Authenticated learner route returning detailed module content with populated cross-references
 */
exports.getModuleBySlug = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { slug } = req.params;
    const userId = req.user._id;

    const moduleDoc = await LearningModule.findOne({ slug });
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Learning module not found' });
    }

    // Only admins can see unpublished drafts
    if (!moduleDoc.published && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Learning module not found or draft under review' });
    }

    // Populate cross-referenced legal statutes
    let relatedLaws = [];
    if (Array.isArray(moduleDoc.relatedLawSections) && moduleDoc.relatedLawSections.length > 0) {
      relatedLaws = await LawSection.find({
        $or: [
          { sectionNumber: { $in: moduleDoc.relatedLawSections } },
          { slug: { $in: moduleDoc.relatedLawSections } }
        ]
      }).select('sectionNumber slug officialTitle actName plainLanguageExplanation whyItMatters penaltyOrLegalEffect legalStatus');
    }

    // Populate cross-referenced cybercrimes
    let relatedCrimes = [];
    if (Array.isArray(moduleDoc.relatedCyberCrimes) && moduleDoc.relatedCyberCrimes.length > 0) {
      relatedCrimes = await CyberCrime.find({
        slug: { $in: moduleDoc.relatedCyberCrimes }
      }).select('name slug category shortDescription severity');
    }

    // Populate cross-referenced case studies
    let relatedCases = [];
    if (Array.isArray(moduleDoc.relatedCaseStudies) && moduleDoc.relatedCaseStudies.length > 0) {
      relatedCases = await CaseStudy.find({
        slug: { $in: moduleDoc.relatedCaseStudies }
      }).select('title slug caseNumber caseType difficulty incidentType shortDescription');
    }

    // Automatically register lesson access / in-progress
    const progress = await getOrCreateUserProgress(userId);
    const entry = getOrCreateLessonEntry(progress, slug);
    entry.lastAccessedAt = new Date();
    if (entry.status === 'not_started') {
      entry.status = 'in_progress';
    }
    progress.lastActivity = new Date();
    await progress.save();

    // Previous and Next module navigation
    const allPublished = await LearningModule.find({ published: true })
      .sort({ order: 1, createdAt: 1 })
      .select('title slug order category');

    const currentIndex = allPublished.findIndex(m => m.slug === slug);
    const prevModule = currentIndex > 0 ? allPublished[currentIndex - 1] : null;
    const nextModule = (currentIndex >= 0 && currentIndex < allPublished.length - 1) ? allPublished[currentIndex + 1] : null;

    res.json({
      success: true,
      module: {
        ...moduleDoc.toObject(),
        status: deriveLessonStatus(entry),
        knowledgeCheckStatus: entry.knowledgeCheckStatus || 'not_attempted',
        lastAnswerIndex: entry.lastAnswerIndex,
        checkResults: entry.checkResults || [],
        readCompleted: Boolean(entry.readCompleted),
        learnerProgress: {
          status: deriveLessonStatus(entry),
          readCompleted: Boolean(entry.readCompleted),
          readCompletedAt: entry.readCompletedAt,
          knowledgeCheckStatus: entry.knowledgeCheckStatus || 'not_attempted',
          knowledgeCheckScore: entry.knowledgeCheckScore,
          lastAnswerIndex: entry.lastAnswerIndex,
          checkResults: entry.checkResults || [],
          lastAccessedAt: entry.lastAccessedAt
        },
        isCompleted: entry.readCompleted || entry.knowledgeCheckStatus === 'passed',
        relatedLaws,
        relatedCrimes,
        relatedCases,
        navigation: {
          prev: prevModule ? { title: prevModule.title, slug: prevModule.slug, category: prevModule.category } : null,
          next: nextModule ? { title: nextModule.title, slug: nextModule.slug, category: nextModule.category } : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching module by slug:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving module', error: error.message });
  }
};

/**
 * POST /api/modules/:slug/progress
 * Authenticated, idempotent endpoint to update lesson progress and knowledge check status
 */
exports.recordModuleProgress = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const { slug } = req.params;
    const { action, completed, selectedIndex } = req.body;
    const userId = req.user._id;

    // Verify module exists
    const moduleDoc = await LearningModule.findOne({ slug });
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Learning module not found' });
    }

    const progress = await getOrCreateUserProgress(userId);
    const entry = getOrCreateLessonEntry(progress, slug);
    entry.lastAccessedAt = new Date();
    progress.lastActivity = new Date();

    // =========================================================================
    // ACTION 1: KNOWLEDGE CHECK SUBMISSION
    // =========================================================================
    if (action === 'knowledge_check' || typeof selectedIndex === 'number') {
      const activeChecks = (Array.isArray(moduleDoc.quickChecks) && moduleDoc.quickChecks.length > 0)
        ? moduleDoc.quickChecks
        : (moduleDoc.quickCheck?.question ? [moduleDoc.quickCheck] : []);

      // Validate checkIndex as an integer within the available checks
      let checkIdx = 0;
      if (req.body.checkIndex !== undefined && req.body.checkIndex !== null) {
        if (!Number.isInteger(req.body.checkIndex) || req.body.checkIndex < 0 || req.body.checkIndex >= Math.max(1, activeChecks.length)) {
          return res.status(400).json({ success: false, message: 'Invalid checkIndex: out of range' });
        }
        checkIdx = req.body.checkIndex;
      }

      const targetCheck = activeChecks[checkIdx] || moduleDoc.quickCheck;
      if (!targetCheck) {
        return res.status(400).json({ success: false, message: 'No knowledge check found for this module' });
      }

      const optionsCount = Array.isArray(targetCheck.options) ? targetCheck.options.length : 0;
      const isIntegerIndex = typeof selectedIndex === 'number'
        ? Number.isInteger(selectedIndex)
        : (typeof selectedIndex === 'string' && selectedIndex.trim() !== '' && Number.isInteger(Number(selectedIndex)));
      const parsedIndex = Number(selectedIndex);

      if (
        selectedIndex === undefined ||
        selectedIndex === null ||
        typeof selectedIndex === 'boolean' ||
        !isIntegerIndex ||
        parsedIndex < 0 ||
        (optionsCount > 0 && parsedIndex >= optionsCount)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid selectedIndex: must be an integer within target check options range'
        });
      }

      const correctIndex = targetCheck.correctIndex ?? targetCheck.correctOptionIndex ?? 0;
      const isCorrect = parsedIndex === Number(correctIndex);

      // Initialize checkResults if not present
      if (!Array.isArray(entry.checkResults)) {
        entry.checkResults = [];
      }

      // Update only the selected check's result
      let existingCheckResult = entry.checkResults.find(cr => cr.checkIndex === checkIdx);
      if (existingCheckResult) {
        existingCheckResult.lastAnswerIndex = parsedIndex;
        existingCheckResult.isCorrect = isCorrect;
        existingCheckResult.checkId = targetCheck.id || `check-${checkIdx + 1}`;
        existingCheckResult.attemptedAt = new Date();
      } else {
        entry.checkResults.push({
          checkIndex: checkIdx,
          checkId: targetCheck.id || `check-${checkIdx + 1}`,
          lastAnswerIndex: parsedIndex,
          isCorrect: isCorrect,
          attemptedAt: new Date()
        });
      }

      entry.lastAnswerIndex = parsedIndex;

      // Derive lesson's passed status only when every configured check has passed
      const totalChecks = Math.max(1, activeChecks.length);
      const passedCount = activeChecks.filter((_, idx) => {
        const cr = entry.checkResults.find(r => r.checkIndex === idx);
        return cr && cr.isCorrect;
      }).length;

      const attemptedCount = entry.checkResults.length;
      const allPassed = passedCount === totalChecks;

      if (allPassed) {
        entry.knowledgeCheckStatus = 'passed';
        entry.knowledgeCheckScore = 100;
        entry.status = entry.readCompleted ? 'knowledge_check_passed' : 'in_progress';
      } else {
        entry.knowledgeCheckStatus = (attemptedCount > 0) ? 'attempted' : 'unattempted';
        entry.knowledgeCheckScore = Math.round((passedCount / totalChecks) * 100);
        entry.status = 'knowledge_check_attempted';
      }

      progress.markModified('lessonProgress');
      await progress.save();

      return res.json({
        success: true,
        checkIndex: checkIdx,
        isCorrect,
        explanation: targetCheck.explanation || moduleDoc.quickCheck?.explanation || '',
        knowledgeCheckStatus: entry.knowledgeCheckStatus,
        knowledgeCheckScore: entry.knowledgeCheckScore,
        checkResults: entry.checkResults,
        status: deriveLessonStatus(entry),
        readCompleted: entry.readCompleted
      });
    }

    // =========================================================================
    // ACTION 2: READ COMPLETION TOGGLE (idempotent)
    // =========================================================================
    const shouldMarkComplete = (action === 'mark_read') || (completed === true);
    const shouldMarkIncomplete = (action === 'mark_unread') || (completed === false);

    if (shouldMarkComplete) {
      entry.readCompleted = true;
      entry.readCompletedAt = entry.readCompletedAt || new Date();
      entry.status = deriveLessonStatus(entry);

      if (!progress.completedModules.includes(slug)) {
        progress.completedModules.push(slug);
      }

      // First lesson badge
      if (!progress.badgesEarned.includes('Eager Learner')) {
        progress.badgesEarned.push('Eager Learner');
      }

      // Check all modules completed
      const totalModules = await LearningModule.countDocuments({ published: true });
      if (progress.completedModules.length >= totalModules && !progress.badgesEarned.includes('Legal Scholar')) {
        progress.badgesEarned.push('Legal Scholar');
      }
    } else if (shouldMarkIncomplete) {
      entry.readCompleted = false;
      entry.readCompletedAt = null;
      entry.status = deriveLessonStatus(entry);
      progress.completedModules = progress.completedModules.filter(s => s !== slug);
    } else if (action === 'start') {
      if (entry.status === 'not_started') {
        entry.status = 'in_progress';
      }
    }

    await progress.save();

    res.json({
      success: true,
      slug,
      status: deriveLessonStatus(entry),
      readCompleted: Boolean(entry.readCompleted),
      knowledgeCheckStatus: entry.knowledgeCheckStatus,
      isCompleted: Boolean(entry.readCompleted || entry.knowledgeCheckStatus === 'passed'),
      completedModules: progress.completedModules,
      badgesEarned: progress.badgesEarned
    });
  } catch (error) {
    console.error('Error updating module progress:', error);
    res.status(500).json({ success: false, message: 'Server error updating progress', error: error.message });
  }
};

/**
 * ADMIN: GET /api/modules/admin/all
 * Returns all modules including drafts for admin governance
 */
exports.adminGetModules = async (req, res) => {
  try {
    const modules = await LearningModule.find().sort({ order: 1, createdAt: -1 });
    res.json({
      success: true,
      count: modules.length,
      modules
    });
  } catch (error) {
    console.error('Error in adminGetModules:', error);
    res.status(500).json({ success: false, message: 'Error retrieving admin modules', error: error.message });
  }
};

/**
 * ADMIN: POST /api/modules/admin
 * Creates a new learning module with audit logging
 */
exports.adminCreateModule = async (req, res) => {
  try {
    const moduleData = req.body;
    if (!moduleData.title || !moduleData.summary || !moduleData.content || !moduleData.category) {
      return res.status(400).json({ success: false, message: 'Title, summary, content, and category are required' });
    }

    if (!moduleData.slug) {
      moduleData.slug = moduleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const existing = await LearningModule.findOne({ slug: moduleData.slug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A module with this slug already exists' });
    }

    const newModule = await LearningModule.create(moduleData);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Created Learning Module "${newModule.title}"`,
      actionType: 'CREATE',
      entityType: 'LearningModule',
      entityId: newModule._id,
      outcome: 'SUCCESS',
      description: `Created new learning module in category "${newModule.category}"`,
      metadata: { slug: newModule.slug, ip: req.ip }
    });

    res.status(201).json({ success: true, module: newModule });
  } catch (error) {
    console.error('Error in adminCreateModule:', error);
    res.status(500).json({ success: false, message: 'Error creating module', error: error.message });
  }
};

/**
 * ADMIN: PUT /api/modules/admin/:id
 * Updates an existing learning module with audit logging
 */
exports.adminUpdateModule = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const moduleDoc = await LearningModule.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    const updatedModule = await LearningModule.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Updated Learning Module "${updatedModule.title}"`,
      actionType: 'UPDATE',
      entityType: 'LearningModule',
      entityId: updatedModule._id,
      outcome: 'SUCCESS',
      description: `Updated learning module properties`,
      metadata: { slug: updatedModule.slug, ip: req.ip }
    });

    res.json({ success: true, module: updatedModule });
  } catch (error) {
    console.error('Error in adminUpdateModule:', error);
    res.status(500).json({ success: false, message: 'Error updating module', error: error.message });
  }
};

/**
 * ADMIN: DELETE /api/modules/admin/:id
 * Deletes a learning module with audit logging
 */
exports.adminDeleteModule = async (req, res) => {
  try {
    const { id } = req.params;
    const moduleDoc = await LearningModule.findById(id);
    if (!moduleDoc) {
      return res.status(404).json({ success: false, message: 'Module not found' });
    }

    await LearningModule.findByIdAndDelete(id);

    await AdminAuditLog.create({
      adminId: req.user._id,
      action: `Deleted Learning Module "${moduleDoc.title}"`,
      actionType: 'DELETE',
      entityType: 'LearningModule',
      entityId: moduleDoc._id,
      outcome: 'SUCCESS',
      description: `Deleted learning module slug "${moduleDoc.slug}"`,
      metadata: { slug: moduleDoc.slug, ip: req.ip }
    });

    res.json({ success: true, message: 'Learning module successfully deleted' });
  } catch (error) {
    console.error('Error in adminDeleteModule:', error);
    res.status(500).json({ success: false, message: 'Error deleting module', error: error.message });
  }
};
