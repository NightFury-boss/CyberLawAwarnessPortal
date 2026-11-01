const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', quizController.getAllQuizzes);
router.get('/modes', quizController.getQuizModes);
router.get('/topics', quizController.getQuizTopics);
router.get('/history', protect, quizController.getQuizHistory);
router.get('/recall/due', protect, quizController.getDueQuizRecallItems);
router.post('/recall/submit', protect, quizController.submitQuizRecall);
router.post('/start', protect, quizController.startQuizSession);
router.get('/:quizId/questions', protect, quizController.getQuizQuestions);
router.post('/submit', protect, quizController.submitQuiz);

module.exports = router;
