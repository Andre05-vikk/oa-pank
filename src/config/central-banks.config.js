const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const CENTRAL_BANK_URL = process.env.CENTRAL_BANK_URL || 'https://henno.cfd/central-bank';

// Read private key for signing requests
const getPrivateKey = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '../../keys/private.pem'));
  } catch (error) {
    console.error('Failed to read private key:', error);
    throw error;
  }
};

// Register bank with the central bank with retry logic
const registerWithCentralBank = async (retryCount = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempt ${attempt} to register with central bank`);
      const privateKey = getPrivateKey();
      // Determine the base URL based on environment
      const baseUrl = process.env.NODE_ENV === 'production'
        ? (process.env.PROD_BASE_URL || 'https://hack2you.eu/oa-pank')
        : (process.env.DEV_BASE_URL || 'http://localhost:3001');

      // Construct bank data for registration
      // Note: transactionUrl must match the endpoint expected by the central bank
      // and must be a valid URL according to express-validator isURL()
      const bankData = {
        name: process.env.BANK_NAME || 'OA-Pank',
        owners: process.env.BANK_OWNERS || 'Andre Park',
        jwksUrl: 'https://hack2you.eu/oa-pank/docs/.well-known/jwks.json',
        transactionUrl: 'https://hack2you.eu/oa-pank/docs/transactions/b2b'
      };

      const response = await axios.post(`${CENTRAL_BANK_URL}/banks`, bankData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt.sign(bankData, privateKey, { algorithm: 'RS256' })}`
        },
        timeout: 5000 // 5 second timeout
      });

      console.log('Successfully registered with central bank');
      return response.data;
    } catch (error) {
      console.error(`Attempt ${attempt} to register with central bank failed:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }

      // If we've tried the maximum number of times, throw the error
      if (attempt === retryCount) {
        console.error(`All ${retryCount} attempts to register with central bank failed.`);
        throw error;
      }

      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // Increase delay for next attempt (exponential backoff)
      retryDelay *= 2;
    }
  }
};

// Verify transaction with central bank
const verifyTransaction = async (transaction) => {
  try {
    const privateKey = getPrivateKey();
    const signedTransaction = jwt.sign(transaction, privateKey, { algorithm: 'RS256' });

    const response = await axios.post(`${CENTRAL_BANK_URL}/transactions/verify`, transaction, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${signedTransaction}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Transaction verification failed:', error);
    throw error;
  }
};

// Get bank's public key from central bank with retry logic
const getBankPublicKey = async (bankPrefix, retryCount = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempt ${attempt} to get public key for bank ${bankPrefix} from central bank`);
      const response = await axios.get(`${CENTRAL_BANK_URL}/banks/${bankPrefix}/jwks`, {
        timeout: 5000 // 5 second timeout
      });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${attempt} failed to get public key for bank ${bankPrefix}:`, error.message);

      // If we've tried the maximum number of times, throw the error
      if (attempt === retryCount) {
        console.error(`All ${retryCount} attempts to get public key for bank ${bankPrefix} failed.`);
        throw error;
      }

      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // Increase delay for next attempt (exponential backoff)
      retryDelay *= 2;
    }
  }
};

module.exports = {
  registerWithCentralBank,
  verifyTransaction,
  getBankPublicKey,
  CENTRAL_BANK_URL
};