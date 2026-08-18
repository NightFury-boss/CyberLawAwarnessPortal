const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');

router.post('/ask', assistantController.askAssistant);

module.exports = router;
