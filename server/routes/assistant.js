const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { assistantLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/ask', assistantLimiter, assistantController.askAssistant);

module.exports = router;
