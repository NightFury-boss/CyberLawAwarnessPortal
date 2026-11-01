const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Authenticated Learner Lesson Routes
router.get('/', protect, moduleController.getModules);
router.get('/:slug', protect, moduleController.getModuleBySlug);
router.post('/:slug/progress', protect, moduleController.recordModuleProgress);

// Admin Governance Routes
router.get('/admin/all', protect, adminOnly, moduleController.adminGetModules);
router.post('/admin', protect, adminOnly, moduleController.adminCreateModule);
router.put('/admin/:id', protect, adminOnly, moduleController.adminUpdateModule);
router.delete('/admin/:id', protect, adminOnly, moduleController.adminDeleteModule);

module.exports = router;

