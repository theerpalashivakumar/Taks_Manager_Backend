const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production mode.');
    }
    return 'fallback_secret_development_only';
  }
  return secret;
};

const signToken = (payload, secret = getJwtSecret(), expiresIn = process.env.JWT_EXPIRES_IN || '1d') => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, secret = getJwtSecret()) => {
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
