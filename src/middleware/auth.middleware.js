const jwt = require('jsonwebtoken');
const { getBy } = require('../config/database');
const { isTokenBlacklisted } = require('../utils/token-blacklist');
const { sendProblemResponse } = require('../utils/error-handler');

/**
 * Authentication middleware to verify JWT tokens
 * and attach user information to the request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendProblemResponse(res, {
        status: 401,
        type: 'https://example.com/authentication-error',
        title: 'Authentication Required',
        detail: 'No valid authentication token provided',
        instance: req.originalUrl
      });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted (logged out)
    if (isTokenBlacklisted(token)) {
      return sendProblemResponse(res, {
        status: 401,
        type: 'https://example.com/authentication-error',
        title: 'Invalid Token',
        detail: 'Token has been invalidated. Please log in again.',
        instance: req.originalUrl
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from database
    const user = await getBy('users', 'username', decoded.username);
    if (!user) {
      return sendProblemResponse(res, {
        status: 401,
        type: 'https://example.com/authentication-error',
        title: 'User Not Found',
        detail: 'The user associated with this token no longer exists',
        instance: req.originalUrl
      });
    }

    // Attach user and token to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return sendProblemResponse(res, {
      status: 401,
      type: 'https://example.com/authentication-error',
      title: 'Authentication Failed',
      detail: error.message || 'Invalid or expired token',
      instance: req.originalUrl,
      extensions: {
        errorCode: 'jwt_error'
      }
    });
  }
};

module.exports = {
  authenticate
};
