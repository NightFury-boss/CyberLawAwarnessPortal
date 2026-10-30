const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, progressController.getProgress);
router.get('/portfolio', protect, progressController.getPortfolio);
router.post('/pathways/step', protect, progressController.recordPathwayStep);
router.get('/pathways/:pathwayId/checkpoint', protect, progressController.getPathwayCheckpoint);
router.get('/pathways/:pathwayId/review', protect, progressController.getPathwayCheckpointReview);
router.post('/pathways/checkpoint', protect, progressController.submitPathwayCheckpoint);
router.post('/pathways/reinforce', protect, progressController.reinforcePathway);
router.get('/pathways/spaced-retrieval/due', protect, progressController.getDueSpacedRetrievals);
router.get('/pathways/:pathwayId/spaced-retrieval', protect, progressController.getSpacedRetrievalQuestions);
router.post('/pathways/:pathwayId/spaced-retrieval', protect, progressController.submitSpacedRetrieval);

module.exports = router;
