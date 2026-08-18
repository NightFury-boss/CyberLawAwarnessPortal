const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const { JWT_SECRET } = require('../middleware/authMiddleware');

exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check duplicate
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = bcrypt.hashSync(password, 10);

    // Enforce role = user (prevent parameter injection of admin role)
    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
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

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

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

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

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
