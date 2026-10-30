const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Enforce admin authorization on all routes in this router
router.use(protect, adminOnly);

router.get('/analytics', adminController.getAnalytics);
router.get('/dashboard-summary', adminController.getDashboardSummary);
router.get('/users-progress', adminController.getUsersProgress);
router.get('/audit-logs', adminController.getAuditLogs);
router.all('/audit-logs', (req, res) => {
  res.status(405).json({ message: 'Method Not Allowed. Audit logs are immutable and cannot be created, modified, or deleted via API.' });
});

// Scenarios Inspection & Integrity Audit
router.get('/scenarios', adminController.getAdminScenarios);
router.get('/scenarios/:id', adminController.getAdminScenarioById);
router.get('/scenarios/:id/audit', adminController.auditAdminScenario);

// Laws CRUD
router.post('/laws', adminController.createLaw);
router.put('/laws/:id', adminController.updateLaw);
router.delete('/laws/:id', adminController.deleteLaw);

// Crimes CRUD
router.post('/crimes', adminController.createCrime);
router.put('/crimes/:id', adminController.updateCrime);
router.delete('/crimes/:id', adminController.deleteCrime);

// Case Studies CRUD
router.post('/cases', adminController.createCase);
router.put('/cases/:id', adminController.updateCase);
router.delete('/cases/:id', adminController.deleteCase);

// Quizzes & Questions Administration
router.get('/quizzes', adminController.getAdminQuizzes);
router.get('/quizzes/:id', adminController.getAdminQuizById);
router.post('/quizzes', adminController.createQuiz);
router.put('/quizzes/:id', adminController.updateQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);
router.post('/quizzes/:id/questions', adminController.createQuizQuestion);
router.put('/quizzes/:id/questions/:questionId', adminController.updateQuizQuestion);
router.delete('/quizzes/:id/questions/:questionId', adminController.deleteQuizQuestion);

// Resources CRUD
router.post('/resources', adminController.createResource);
router.put('/resources/:id', adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);

module.exports = router;
