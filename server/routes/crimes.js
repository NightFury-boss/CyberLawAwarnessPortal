const express = require('express');
const router = express.Router();
const crimeController = require('../controllers/crimeController');

router.get('/crimes', crimeController.getAllCrimes);
router.get('/crimes/:id', crimeController.getCrimeById);
router.get('/cases', crimeController.getAllCases);
router.get('/cases/:id', crimeController.getCaseById);
router.get('/resources', crimeController.getAllResources);

module.exports = router;
