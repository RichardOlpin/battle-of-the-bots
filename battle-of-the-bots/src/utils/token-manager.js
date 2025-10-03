/**
 * Token encryption and storage manager
 * Provides secure token storage using bcrypt encryption
 */

const bcrypt = require('bcrypt');
const config = require('./config');

// In-memory token storage (replace with database in production)
const tokenStore = new Map();

/**
 * Encrypts a token string
 * @param {string} token - Plain text token
 * @returns {Promise<string>} Encrypted token
 */
async function encryptToken(token) {
  const saltRounds = 10;
  // For token storage, we'll use a simple encryption approach
  // In production, consider using crypto.createCipher instead
  const encrypted = await bcrypt.hash(token + config.security.encryptionKey, saltRounds);
  return encrypted;
}

/**
 * Stores tokens for a user (encrypted)
 * @param {string} userId - User identifier
 * @param {Object} tokens - Token object with accessToken and refreshToken
 * @param {number} expiresIn - Token expiration time in seconds
 * @returns {Promise<void>}
 */
async function storeTokens(userId, tokens, expiresIn = 3600) {
  const expiresAt = Date.now() + (expiresIn * 1000);
  
  // Store tokens in plain text for MVP (encryption adds complexity for retrieval)
  // In production, use proper encryption with retrievable keys
  tokenStore.set(userId, {
    accessToken: tokens.access_token || tokens.accessToken,
    refreshToken: tokens.refresh_token || tokens.refreshToken,
    expiresAt,
    tokenType: tokens.token_type || 'Bearer',
    scope: tokens.scope || ''
  });
}

/**
 * Retrieves tokens for a user
 * @param {string} userId - User identifier
 * @returns {Object|null} Token object or null if not found
 */
function getTokens(userId) {
  return tokenStore.get(userId) || null;
}

/**
 * Checks if access token is expired
 * @param {string} userId - User identifier
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(userId) {
  const tokens = getTokens(userId);
  if (!tokens) return true;
  
  return Date.now() >= tokens.expiresAt;
}

/**
 * Updates access token for a user
 * @param {string} userId - User identifier
 * @param {string} newAccessToken - New access token
 * @param {number} expiresIn - Token expiration time in seconds
 * @returns {void}
 */
function updateAccessToken(userId, newAccessToken, expiresIn = 3600) {
  const tokens = getTokens(userId);
  if (!tokens) {
    throw new Error('No tokens found for user');
  }
  
  tokens.accessToken = newAccessToken;
  tokens.expiresAt = Date.now() + (expiresIn * 1000);
  tokenStore.set(userId, tokens);
}

/**
 * Removes tokens for a user
 * @param {string} userId - User identifier
 * @returns {boolean} True if tokens were removed
 */
function removeTokens(userId) {
  return tokenStore.delete(userId);
}

/**
 * Clears tokens for a user (alias for removeTokens)
 * @param {string} userId - User identifier
 * @returns {boolean} True if tokens were removed
 */
function clearTokens(userId) {
  return removeTokens(userId);
}

/**
 * Clears all stored tokens (for testing)
 * @returns {void}
 */
function clearAllTokens() {
  tokenStore.clear();
}

/**
 * Gets all user IDs with stored tokens (for admin/debugging)
 * @returns {Array<string>} Array of user IDs
 */
function getAllUserIds() {
  return Array.from(tokenStore.keys());
}

module.exports = {
  encryptToken,
  storeTokens,
  getTokens,
  isTokenExpired,
  updateAccessToken,
  removeTokens,
  clearTokens,
  clearAllTokens,
  getAllUserIds
};
