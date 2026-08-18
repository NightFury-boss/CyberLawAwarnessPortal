const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Enforce admin authorization on all routes in this router
router.use(protect, adminOnly);

router.get('/analytics', adminController.getAnalytics);
router.get('/users-progress', adminController.getUsersProgress);
router.get('/audit-logs', adminController.getAuditLogs);

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

// Quizzes CRUD
router.post('/quizzes', adminController.createQuiz);
router.put('/quizzes/:id', adminController.updateQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);

// Resources CRUD
router.post('/resources', adminController.createResource);
router.put('/resources/:id', adminController.updateResource);
router.delete('/resources/:id', adminController.deleteResource);

module.exports = router;
