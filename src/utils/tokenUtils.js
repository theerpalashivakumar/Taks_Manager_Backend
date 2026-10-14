const jwt = require('jsonwebtoken');

const signToken = (payload, secret = process.env.JWT_SECRET || 'fallback_secret', expiresIn = process.env.JWT_EXPIRES_IN || '1d') => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token, secret = process.env.JWT_SECRET || 'fallback_secret') => {
  return jwt.verify(token, secret);
};

module.exports = {
  signToken,
  verifyToken,
};
