const CyberCrime = require('../models/CyberCrime');
const CaseStudy = require('../models/CaseStudy');
const Resource = require('../models/Resource');

exports.getAllCrimes = async (req, res) => {
  try {
    const crimes = await CyberCrime.find();
    res.json(crimes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching crimes', error: error.message });
  }
};

exports.getCrimeById = async (req, res) => {
  try {
    const crime = await CyberCrime.findById(req.params.id);
    if (!crime) {
      return res.status(404).json({ message: 'Cybercrime category not found' });
    }
    res.json(crime);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cybercrime details', error: error.message });
  }
};

exports.getAllCases = async (req, res) => {
  try {
    const cases = await CaseStudy.find();
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case studies', error: error.message });
  }
};

exports.getCaseById = async (req, res) => {
  try {
    const item = await CaseStudy.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Case study not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching case study details', error: error.message });
  }
};

exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error: error.message });
  }
};
