const express = require('express');
const router = express.Router();
const lawController = require('../controllers/lawController');

router.get('/', lawController.getAllLaws);
router.get('/search', lawController.searchLaws);
router.get('/:id', lawController.getLawById);

module.exports = router;
