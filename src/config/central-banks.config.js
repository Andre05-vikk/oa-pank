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
  // Check if central_bank_data.json file exists
  const centralBankDataPath = path.join(__dirname, '../../data/central_bank_data.json');

  if (fs.existsSync(centralBankDataPath)) {
    try {
      // Read existing central bank registration info
      const centralBankData = JSON.parse(fs.readFileSync(centralBankDataPath, 'utf8'));

      // Check if the file contains necessary information
      if (centralBankData && centralBankData.id && centralBankData.bankPrefix) {
        console.log('Using existing central bank registration data');
        return centralBankData;
      }
    } catch (error) {
      console.error('Error reading central bank data file:', error.message);
      // Continue with registration if file reading fails
    }
  }

  // If the file doesn't exist or doesn't contain necessary info, register again
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

      // Save central bank registration info as a file
      try {
        fs.writeFileSync(centralBankDataPath, JSON.stringify(response.data, null, 2));
        console.log('Central bank registration data saved to file');
      } catch (saveError) {
        console.error('Error saving central bank data to file:', saveError.message);
      }

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

/**
 * Get all banks from the Central Bank
 * @param {number} retryCount - Number of retry attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<Array>} - List of all banks
 */
const getAllBanks = async (retryCount = 3, retryDelay = 1000) => {
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempt ${attempt} to get all banks from central bank`);
      const response = await axios.get(`${CENTRAL_BANK_URL}/banks`, {
        timeout: 10000 // 10 second timeout
      });

      if (response.data && Array.isArray(response.data)) {
        console.log(`Successfully retrieved ${response.data.length} banks from central bank`);
        return response.data;
      } else {
        console.error('Invalid response format from central bank');
        throw new Error('Invalid response format from central bank');
      }
    } catch (error) {
      console.error(`Attempt ${attempt} failed to get all banks from central bank:`, error.message);

      // If we've tried the maximum number of times, throw the error
      if (attempt === retryCount) {
        console.error(`All ${retryCount} attempts to get all banks from central bank failed.`);
        throw error;
      }

      // Wait before the next retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      // Increase delay for next attempt (exponential backoff)
      retryDelay *= 2;
    }
  }
};

/**
 * Validate bank registration status with the central bank
 * This function checks if the bank is still registered and active with the central bank
 * @param {number} retryCount - Number of retry attempts
 * @param {number} retryDelay - Delay between retries in milliseconds
 * @returns {Promise<Object>} - Bank registration data from central bank
 */
const validateBankRegistration = async (retryCount = 3, retryDelay = 1000) => {
  // First, try to get our bank data from the local file
  const centralBankDataPath = path.join(__dirname, '../../data/central_bank_data.json');
  let localBankData = null;

  if (fs.existsSync(centralBankDataPath)) {
    try {
      localBankData = JSON.parse(fs.readFileSync(centralBankDataPath, 'utf8'));
    } catch (error) {
      console.warn('Failed to read local central bank data:', error.message);
    }
  }

  // If we don't have local data, we can't validate
  if (!localBankData || !localBankData.bankPrefix) {
    throw new Error('No local bank registration data found. Bank must register first.');
  }

  const bankPrefix = localBankData.bankPrefix;
  const bankName = localBankData.name;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Attempt ${attempt} to validate bank registration with central bank`);
      
      // Get all banks from the central bank and find ours
      const allBanks = await getAllBanks();
      
      // Find our bank by prefix and name
      const ourBank = allBanks.find(bank => 
        bank.bankPrefix === bankPrefix || 
        (bank.name && bankName && bank.name.toLowerCase() === bankName.toLowerCase())
      );

      if (ourBank && ourBank.bankPrefix === bankPrefix) {
        console.log('Bank registration validated successfully with central bank');
        
        // Update local file with latest data from central bank if different
        try {
          const currentData = JSON.stringify(ourBank, null, 2);
          const localData = JSON.stringify(localBankData, null, 2);
          
          if (currentData !== localData) {
            fs.writeFileSync(centralBankDataPath, currentData);
            console.log('Updated local central bank data with latest from central bank');
          }
        } catch (saveError) {
          console.warn('Failed to update local central bank data:', saveError.message);
        }
        
        return ourBank;
      } else {
        throw new Error('Bank registration validation failed: bank not found or data mismatch');
      }
    } catch (error) {
      console.error(`Attempt ${attempt} to validate bank registration failed:`, error.message);
      
      if (error.message.includes('bank not found')) {
        throw new Error('Bank registration not found in central bank. Bank may have been deregistered.');
      }

      // If we've tried the maximum number of times, throw the error
      if (attempt === retryCount) {
        console.error(`All ${retryCount} attempts to validate bank registration failed.`);
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
  getAllBanks,
  validateBankRegistration,
  CENTRAL_BANK_URL
};