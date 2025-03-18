/**
 * Simple in-memory token blacklist
 * In a production environment, this would be replaced with Redis or another persistent store
 */

// In-memory store for blacklisted tokens
const blacklistedTokens = new Set();

/**
 * Add a token to the blacklist
 * @param {string} token - The token to blacklist
 * @param {number} expiryTime - Expiry time in seconds
 */
const blacklistToken = (token, expiryTime = 86400) => {
  blacklistedTokens.add(token);
  
  // Automatically remove from blacklist after expiry
  setTimeout(() => {
    blacklistedTokens.delete(token);
  }, expiryTime * 1000);
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The token to check
 * @returns {boolean} - True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

module.exports = {
  blacklistToken,
  isTokenBlacklisted
};
