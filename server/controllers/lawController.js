const mongoose = require('mongoose');
const LawSection = require('../models/LawSection');
const LegalSource = require('../models/LegalSource');
const { escapeRegex } = require('../utils/regexUtils');

exports.getAllLaws = async (req, res) => {
  try {
    const laws = await LawSection.find().populate('officialSourceId');
    res.json(laws);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching laws', error: error.message });
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
    res.status(500).json({ message: 'Error fetching law section', error: error.message });
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
    res.status(500).json({ message: 'Error searching laws', error: error.message });
  }
};
