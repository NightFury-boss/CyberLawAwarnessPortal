const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret, validateJwtSecret } = require('../config/productionSecurity');

// Validate on load if running in production
if (process.env.NODE_ENV === 'production') {
  validateJwtSecret(process.env);
}

async function protect(req, res, next) {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied, administrator privileges required' });
  }
}

module.exports = {
  protect,
  adminOnly,
  getJwtSecret,
  validateJwtSecret,
  get JWT_SECRET() {
    return getJwtSecret();
  }
};
