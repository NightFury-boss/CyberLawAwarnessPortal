const mongoose = require('mongoose');
const LawSection = require('../models/LawSection');
const LegalSource = require('../models/LegalSource');
const { escapeRegex } = require('../utils/regexUtils');
const { sendMessageError } = require('../utils/apiErrorResponder');

exports.getAllLaws = async (req, res) => {
  try {
    const laws = await LawSection.find().populate('officialSourceId');
    res.json(laws);
  } catch (error) {
    return sendMessageError(res, error, {
      contextLabel: '[getAllLaws Error]',
      defaultMessage: 'Error fetching laws',
      includeSuccessFalse: false
    });
  }
};

exports.getLawById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid law section ID format' });
    }
    const law = await LawSection.findById(req.params.id).populate('officialSourceId');
    if (!law) {
      return res.status(404).json({ message: 'Law section not found' });
    }
    res.json(law);
  } catch (error) {
    return sendMessageError(res, error, {
      contextLabel: '[getLawById Error]',
      defaultMessage: 'Error fetching law section',
      includeSuccessFalse: false
    });
  }
};

exports.searchLaws = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || !q.trim()) {
      const laws = await LawSection.find().populate('officialSourceId');
      return res.json(laws);
    }

    const safePattern = escapeRegex(q.trim());
    const regex = new RegExp(safePattern, 'i');
    const filtered = await LawSection.find({
      $or: [
        { sectionNumber: regex },
        { officialTitle: regex },
        { plainLanguageExplanation: regex },
        { whyItMatters: regex },
        { actName: regex },
        { role: regex },
        { keywords: regex },
        { relatedCyberCrimes: regex }
      ]
    }).populate('officialSourceId');

    res.json(filtered);
  } catch (error) {
    return sendMessageError(res, error, {
      contextLabel: '[searchLaws Error]',
      defaultMessage: 'Error searching laws',
      includeSuccessFalse: false
    });
  }
};
