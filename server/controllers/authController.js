const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { escapeRegex } = require('../utils/regexUtils');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || typeof fullName !== 'string') {
      return res.status(400).json({ message: 'Email, password, and full name must be valid text strings' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();

    if (!trimmedEmail || !password || !trimmedName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check duplicate (supporting case-insensitive match against legacy/raw records)
    const existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { email: new RegExp(`^${escapeRegex(trimmedEmail)}$`, 'i') }
      ]
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Non-blocking password hash
    const passwordHash = await bcrypt.hash(password, 10);

    // Enforce role = user (prevent parameter injection of admin role)
    const newUser = await User.create({
      fullName: trimmedName,
      email: trimmedEmail,
      passwordHash,
      role: 'user'
    });

    // Create progress profile
    await UserProgress.create({
      userId: newUser._id,
      completedModules: [],
      badgesEarned: ['First Step'], // auto award badge
      currentStreak: 0
    });

    const token = jwt.sign({ id: newUser._id }, getJwtSecret(), { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password must be valid text strings' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Case-insensitive lookup ensuring legacy or mixed-case records can authenticate
    const user = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { email: new RegExp(`^${escapeRegex(trimmedEmail)}$`, 'i') }
      ]
    });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getMe = (req, res) => {
  res.json(req.user);
};
