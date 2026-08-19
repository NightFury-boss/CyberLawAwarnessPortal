const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Resource = require('../models/Resource');
const AssessmentSession = require('../models/AssessmentSession');

exports.getAllCrimes = async (req, res) => {
  try {
    const crimes = await CyberCrime.find({ published: { $ne: false } });
    res.json(crimes);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CRIME_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getCrimeById = async (req, res) => {
  try {
    const crime = await CyberCrime.findById(req.params.id);
    if (!crime) {
      return res.status(404).json({
        success: false,
        error: { code: 'CRIME_NOT_FOUND', message: 'Cybercrime category not found' }
      });
    }
    res.json(crime);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CRIME_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getCrimeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const crime = await CyberCrime.findOne({ slug, published: { $ne: false } });
    if (!crime) {
      return res.status(404).json({
        success: false,
        error: { code: 'CRIME_NOT_FOUND', message: 'Cybercrime threat profile not found' }
      });
    }
    res.json(crime);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CRIME_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getAllCases = async (req, res) => {
  try {
    const cases = await CaseStudy.find({ published: { $ne: false } });
    res.json(cases);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CASE_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const item = await CaseStudy.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: 'Case study not found' }
      });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CASE_FETCH_ERROR', message: error.message }
    });
  }
};

exports.getCaseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const item = await CaseStudy.findOne({ slug, published: { $ne: false } });
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'CASE_NOT_FOUND', message: 'Incident case file not found' }
      });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'CASE_FETCH_ERROR', message: error.message }
    });
  }
};

exports.searchCases = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const cases = await CaseStudy.find({ published: { $ne: false } });
      return res.json(cases);
    }

    const regex = new RegExp(q, 'i');
    const filtered = await CaseStudy.find({
      published: { $ne: false },
      $or: [
        { title: regex },
        { incidentType: regex },
        { attackVector: regex },
        { shortDescription: regex },
        { sourceSummary: regex },
        { legalContext: regex },
        { 'warningSigns.title': regex },
        { 'warningSigns.explanation': regex }
      ]
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: error.message }
    });
  }
};

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'RESOURCE_FETCH_ERROR', message: error.message }
    });
  }
};

exports.searchCrimes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      const crimes = await CyberCrime.find({ published: { $ne: false } });
      return res.json(crimes);
    }

    const regex = new RegExp(q, 'i');
    const filtered = await CyberCrime.find({
      published: { $ne: false },
      $or: [
        { title: regex },
        { category: regex },
        { shortDescription: regex },
        { whatIsIt: regex },
        { warningSigns: regex },
        { attackVectors: regex },
        { attackerObjective: regex }
      ]
    });

    res.json(filtered);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: error.message }
    });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      // Unauthenticated, return default popular threats
      const defaults = await CyberCrime.find({ 
        slug: { $in: ['phishing', 'upi-payment-fraud', 'online-impersonation'] }, 
        published: { $ne: false } 
      });
      return res.json({
        hasAssessment: false,
        reason: 'Start with the most common threats.',
        recommendations: defaults
      });
    }

    // Load user's latest baseline assessment session
    const session = await AssessmentSession.findOne({
      userId,
      scenarioCode: 'baseline',
      status: 'completed'
    }).sort({ completedAt: -1 });

    if (!session) {
      // No assessment completed yet, show default popular threats
      const defaults = await CyberCrime.find({ 
        slug: { $in: ['phishing', 'upi-payment-fraud', 'online-impersonation'] }, 
        published: { $ne: false } 
      });
      return res.json({
        hasAssessment: false,
        reason: 'Start with the most common threats.',
        recommendations: defaults
      });
    }

    // Evaluate lowest scores from assessment categories
    let lowestScore = 100;
    let weakestCategory = '';
    
    if (session.categoryScores) {
      for (let [cat, score] of session.categoryScores.entries()) {
        if (score < lowestScore) {
          lowestScore = score;
          weakestCategory = cat;
        }
      }
    }

    // Map category weaknesses to database query search parameters
    let queryConditions = { published: { $ne: false } };
    let reasonText = 'Start exploring recommended threats.';

    if (weakestCategory) {
      const lowerCat = weakestCategory.toLowerCase();
      if (lowerCat.includes('phish') || lowerCat.includes('url') || lowerCat.includes('credential')) {
        queryConditions.category = 'Phishing';
        reasonText = `Your baseline assessment showed a gap in phishing & URL recognition (Score: ${lowestScore}/100).`;
      } else if (lowerCat.includes('social') || lowerCat.includes('impersonation')) {
        queryConditions.category = 'Social Engineering';
        reasonText = `Your baseline assessment identified vulnerable habits in social engineering scenarios (Score: ${lowestScore}/100).`;
      } else if (lowerCat.includes('financial') || lowerCat.includes('pay') || lowerCat.includes('qr')) {
        queryConditions.category = 'UPI/Payment Scams';
        reasonText = `Your baseline assessment showed a gap in payment app safety habits (Score: ${lowestScore}/100).`;
      } else {
        queryConditions.category = 'Identity & Credential Theft';
        reasonText = `Your baseline assessment identified a need to improve credential protection (Score: ${lowestScore}/100).`;
      }
    }

    let recommendations = await CyberCrime.find(queryConditions).limit(3);
    if (recommendations.length === 0) {
      // Fallback
      recommendations = await CyberCrime.find({ published: { $ne: false } }).limit(3);
      reasonText = 'Start with the most common threats.';
    }

    res.json({
      hasAssessment: true,
      reason: reasonText,
      recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'RECOMMENDATION_ERROR', message: error.message }
    });
  }
};
