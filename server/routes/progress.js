const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, progressController.getProgress);
router.get('/portfolio', protect, progressController.getPortfolio);
router.post('/pathways/step', protect, progressController.recordPathwayStep);
router.get('/pathways/:pathwayId/checkpoint', protect, progressController.getPathwayCheckpoint);
router.post('/pathways/checkpoint', protect, progressController.submitPathwayCheckpoint);
router.post('/pathways/reinforce', protect, progressController.reinforcePathway);

module.exports = router;
