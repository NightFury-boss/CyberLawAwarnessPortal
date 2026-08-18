const UserProgress = require('../models/UserProgress');
const AssessmentSession = require('../models/AssessmentSession');
const QuizAttempt = require('../models/QuizAttempt');

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user._id;

    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = await UserProgress.create({
        userId,
        completedModules: [],
        badgesEarned: ['First Step'],
        currentStreak: 0
      });
    }

    // Fetch assessment history
    const assessments = await AssessmentSession.find({ userId, status: 'completed' }).sort({ completedAt: 1 });
    const baseline = assessments.find(a => a.scenarioCode === 'baseline');
    const finalVal = assessments.find(a => a.scenarioCode === 'final');

    // Fetch quiz stats
    const quizAttempts = await QuizAttempt.find({ userId });
    const distinctQuizzes = [...new Set(quizAttempts.map(qa => qa.quizId.toString()))];

    res.json({
      userId,
      fullName: req.user.fullName,
      email: req.user.email,
      badges: progress.badgesEarned || [],
      completedModules: progress.completedModules || [],
      quizzesTaken: distinctQuizzes,
      baselineScore: baseline ? baseline.score : null,
      baselineLevel: baseline ? getAwarenessLevel(baseline.score) : null,
      finalScore: finalVal ? finalVal.score : null,
      finalLevel: finalVal ? getAwarenessLevel(finalVal.score) : null,
      assessmentsCount: assessments.length,
      streak: progress.currentStreak
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user progress', error: error.message });
  }
};

function getAwarenessLevel(score) {
  if (score >= 90) return 'Cyber Guardian';
  if (score >= 75) return 'Cyber Defender';
  if (score >= 60) return 'Cyber Aware';
  if (score >= 40) return 'Needs Improvement';
  return 'High Risk Awareness Gap';
}
