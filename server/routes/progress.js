const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, progressController.getProgress);

module.exports = router;
