const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', quizController.getAllQuizzes);
router.get('/:quizId/questions', protect, quizController.getQuizQuestions);
router.post('/submit', protect, quizController.submitQuiz);

module.exports = router;
