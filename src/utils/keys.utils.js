/**
 * Utility functions for handling cryptographic keys
 */
const fs = require('fs');
const path = require('path');

/**
 * Read private key for signing requests
 * @returns {Buffer} Private key as a buffer
 * @throws {Error} If the private key file cannot be read
 */
const getPrivateKey = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '../../keys/private.pem'));
  } catch (error) {
    console.error('Failed to read private key:', error);
    throw new Error('Private key not found. Please make sure the private.pem file exists in the keys directory.');
  }
};

/**
 * Read public key for verifying requests
 * @returns {Buffer} Public key as a buffer
 * @throws {Error} If the public key file cannot be read
 */
const getPublicKey = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '../../keys/public.pem'));
  } catch (error) {
    console.error('Failed to read public key:', error);
    throw new Error('Public key not found. Please make sure the public.pem file exists in the keys directory.');
  }
};

module.exports = {
  getPrivateKey,
  getPublicKey
};
