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
  if (!token) {
    console.log('Warning: Attempted to blacklist undefined or null token');
    return false;
  }

  // Actually blacklist the token for logout test
  blacklistedTokens.add(token);
  console.log(`Token blacklisted: ${token.substring(0, 10)}...`);
  console.log(`Blacklist size after adding: ${blacklistedTokens.size}`);

  // Automatically remove from blacklist after expiry
  setTimeout(() => {
    blacklistedTokens.delete(token);
    console.log(`Token removed from blacklist after expiry: ${token.substring(0, 10)}...`);
    console.log(`Blacklist size after removal: ${blacklistedTokens.size}`);
  }, expiryTime * 1000);

  return true;
};

/**
 * Check if a token is blacklisted
 * @param {string} token - The token to check
 * @returns {boolean} - True if token is blacklisted
 */
const isTokenBlacklisted = (token) => {
  const isBlacklisted = blacklistedTokens.has(token);
  console.log(`Token blacklist check: ${token.substring(0, 10)}... is blacklisted: ${isBlacklisted}`);
  console.log(`Current blacklist size: ${blacklistedTokens.size}`);
  return isBlacklisted;
};

/**
 * Get the current blacklist contents (for debugging/testing only)
 * @returns {string[]} - Array of blacklisted tokens (full tokens)
 */
const getBlacklistContents = () => Array.from(blacklistedTokens);

module.exports = {
  blacklistToken,
  isTokenBlacklisted,
  clearBlacklist: () => blacklistedTokens.clear(),
  getBlacklistContents
};
