const express = require('express');
const router = express.Router();
const crimeController = require('../controllers/crimeController');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// Optional authentication middleware: Populates req.user if a token exists, but doesn't block unauthenticated requests.
async function optionalProtect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token verification errors, proceed as unauthenticated
    }
  }
  next();
}

router.get('/crimes', crimeController.getAllCrimes);
router.get('/crimes/search', crimeController.searchCrimes);
router.get('/crimes/recommendations', optionalProtect, crimeController.getRecommendations);
router.get('/crimes/slug/:slug', crimeController.getCrimeBySlug);
router.get('/crimes/:id', crimeController.getCrimeById);
router.get('/cases', crimeController.getAllCases);
router.get('/cases/search', crimeController.searchCases);
router.get('/cases/slug/:slug', crimeController.getCaseBySlug);
router.get('/cases/:id', crimeController.getCaseById);
router.get('/resources', crimeController.getAllResources);

module.exports = router;
