const express = require('express');
const router = express.Router();
const simulationController = require('../controllers/simulationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:code', simulationController.getScenario);
router.post('/start', protect, simulationController.startAssessment);
router.post('/submit-step', protect, simulationController.submitStep);

module.exports = router;
