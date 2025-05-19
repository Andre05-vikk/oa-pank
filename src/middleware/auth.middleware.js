const jwt = require('jsonwebtoken');
const { getBy, getById } = require('../config/database');
const { isTokenBlacklisted } = require('../utils/token-blacklist');
const { sendProblemResponse } = require('../utils/error-handler');

const sendErrorResponse = (res, status, message, error = 'unauthorized', details = undefined) => {
  const response = {
    success: false,
    message,
    error
  };
  if (details) response.details = details;
  return res.status(status).json(response);
};

/**
 * Authentication middleware to verify JWT tokens
 * and attach user information to the request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendErrorResponse(res, 401, 'No valid authentication token provided', 'unauthorized');
    }

    const token = authHeader.split(' ')[1];
    req.token = token;

    if (isTokenBlacklisted(token)) {
      console.log('Auth middleware: Token is blacklisted, returning 401');
      return sendErrorResponse(res, 401, 'Token has been invalidated. Please log in again.', 'token_invalidated');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Auth middleware: Decoded JWT:', decoded);
      req.user = decoded;
      // Always set both id and _id as strings for compatibility
      if (decoded._id && !decoded.id) {
        req.user.id = decoded._id.toString();
      } else if (decoded.id && !decoded._id) {
        req.user._id = decoded.id.toString();
      } else if (decoded.id && decoded._id) {
        req.user.id = decoded.id.toString();
        req.user._id = decoded._id.toString();
      }
      // Debug log
      console.log('Auth middleware: Successfully authenticated user:', req.user);
      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return sendErrorResponse(res, 401, 'Invalid or expired token', 'invalid_token', error.message);
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return sendErrorResponse(res, 401, error.message || 'Invalid or expired token', 'unauthorized');
  }
};

module.exports = {
  authenticate
};
