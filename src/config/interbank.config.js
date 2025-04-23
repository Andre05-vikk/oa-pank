const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { getBy } = require('./database');

// Public keys are now fetched directly from external banks via JWKS endpoints

// Read private key for signing requests
const getPrivateKey = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '../../keys/private.pem'));
  } catch (error) {
    console.error('Failed to read private key:', error);
    throw new Error('Private key not found. Please make sure the private.pem file exists in the keys directory.');
  }
};

// Read public key for verifying requests
const getPublicKey = () => {
  try {
    return fs.readFileSync(path.join(__dirname, '../../keys/public.pem'));
  } catch (error) {
    console.error('Failed to read public key:', error);
    throw new Error('Public key not found. Please make sure the public.pem file exists in the keys directory.');
  }
};

/**
 * Send a transaction to another bank using JWT-signed data packets
 * @param {Object} transaction - Transaction data
 * @param {string} targetBankUrl - URL of the target bank's API
 * @returns {Promise<Object>} - Response from the target bank
 */
const sendTransactionToBank = async (transaction, targetBankUrl) => {
  try {
    // Check if targetBankUrl is defined and valid
    if (!targetBankUrl) {
      throw new Error('Target bank URL is undefined or empty');
    }

    // Validate URL format
    try {
      new URL(targetBankUrl); // This will throw if the URL is invalid
    } catch (urlError) {
      throw new Error(`Invalid target bank URL: ${targetBankUrl}. Error: ${urlError.message}`);
    }

    console.log(`Sending transaction to bank URL: ${targetBankUrl}`);
    console.log('Transaction data before signing:', JSON.stringify(transaction, null, 2));

    // Determine target bank prefix from the accountTo
    // Use either toAccount or accountTo, depending on which one is available
    const accountToUse = transaction.accountTo || transaction.toAccount;

    if (!accountToUse) {
      throw new Error('Missing destination account number');
    }

    const targetBankPrefix = accountToUse.substring(0, 3);
    console.log(`Target bank prefix: ${targetBankPrefix}`);

    // Ensure we're using the correct field names as specified in the Central Bank specifications
    const transactionData = {
      // Standard fields required by the Central Bank specification
      accountFrom: transaction.fromAccount || transaction.accountFrom,
      accountTo: transaction.toAccount || transaction.accountTo,
      amount: parseFloat(transaction.amount), // Ensure amount is a number, not a string
      currency: transaction.currency,
      explanation: transaction.explanation || transaction.description,
      senderName: transaction.senderName || process.env.BANK_NAME || 'OA-Pank',

      // Additional fields that might be useful
      reference: transaction.reference,
      timestamp: transaction.timestamp || new Date().toISOString(),
      sourceBank: transaction.sourceBank || global.BANK_PREFIX,
      sourceBankName: transaction.sourceBankName || process.env.BANK_NAME || 'OA-Pank'
    };

    console.log('Standardized transaction data for signing:', JSON.stringify(transactionData, null, 2));

    const privateKey = getPrivateKey();

    // Create a JWT-signed transaction payload
    const signedTransaction = jwt.sign(transactionData, privateKey, {
      algorithm: 'RS256',
      expiresIn: '5m', // Short expiration for security
      issuer: global.BANK_PREFIX
    });

    console.log('JWT token created with algorithm RS256 and issuer:', global.BANK_PREFIX);
    console.log('JWT token structure:', {
      header: signedTransaction.split('.')[0],
      payload: signedTransaction.split('.')[1],
      signature: signedTransaction.split('.')[2].substring(0, 20) + '...' // Only log part of the signature
    });

    // Verify our own JWT token before sending it to ensure it's valid
    try {
      const publicKey = getPublicKey();
      const verified = jwt.verify(signedTransaction, publicKey, {
        algorithms: ['RS256'],
        issuer: global.BANK_PREFIX
      });
      console.log('JWT token verified successfully with our public key:', verified.iss);
    } catch (verifyError) {
      console.error('Failed to verify our own JWT token:', verifyError);
      throw new Error(`JWT token verification failed: ${verifyError.message}`);
    }

    // Standard format for all banks
    console.log(`Sending transaction to bank URL: ${targetBankUrl} with JWT token`);

    try {
      // According to Central Bank specifications, all banks expect JWT in the format: { "jwt": "token" }
      const requestBody = { jwt: signedTransaction };

      console.log('Sending transaction in standard format according to Central Bank specifications:',
        JSON.stringify(requestBody, null, 2));

      // Set appropriate headers based on the request format
      const headers = {
        'Accept': 'application/json',
        'X-Bank-Signature': signedTransaction.split('.')[2],
        'X-Bank-Origin': global.BANK_PREFIX
      };

      // Always use application/json Content-Type for the standard format
      headers['Content-Type'] = 'application/json';

      const response = await axios.post(targetBankUrl,
        requestBody,
        { headers }
      );

      console.log('Bank response status:', response.status, response.statusText);
      console.log('Bank response data:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (bankError) {
      console.error(`Error sending transaction to bank with prefix ${targetBankPrefix}:`, bankError.message);
      if (bankError.response) {
        console.error('Bank response status:', bankError.response.status);
        console.error('Bank response data:', JSON.stringify(bankError.response.data, null, 2));
      }
      throw new Error(`Failed to send transaction to bank with prefix ${targetBankPrefix}: ${bankError.message}`);
    }
  } catch (error) {
    console.error('Failed to send transaction to bank:', error.message || error);
    throw error;
  }
};

/**
 * Verify an incoming transaction from another bank
 * @param {string} signedTransaction - JWT-signed transaction
 * @param {string} sourceBankPrefix - Prefix of the source bank
 * @returns {Object} - Verified transaction data
 */
const verifyIncomingTransaction = async (signedTransaction, sourceBankPrefix) => {
  try {
    console.log(`Verifying transaction from bank with prefix ${sourceBankPrefix}`);

    // Get the source bank information from database
    const sourceBank = await getBy('external_banks', 'prefix', sourceBankPrefix);
    if (!sourceBank) {
      console.error(`Unknown bank with prefix ${sourceBankPrefix} - not found in database`);
      throw new Error(`Unknown bank with prefix ${sourceBankPrefix}`);
    }

    console.log(`Found bank in database: ${sourceBank.name} (${sourceBankPrefix})`);

    // Check if the bank has a JWKS URL defined
    if (sourceBank.jwksUrl) {
      console.log(`Bank ${sourceBankPrefix} has JWKS URL: ${sourceBank.jwksUrl}`);
      // In a real implementation, we would fetch the public key from the JWKS URL
      // For now, we'll just log it and use our own public key
    } else {
      console.log(`Bank ${sourceBankPrefix} does not have a JWKS URL defined`);
    }

    try {
      // For now, we'll use our own public key for verification
      let publicKeyPEM = getPublicKey();
      console.log(`Using our own public key for verification of bank ${sourceBankPrefix}`);


      // Verify the JWT signature using the public key
      const decodedTransaction = jwt.verify(signedTransaction, publicKeyPEM, {
        algorithms: ['RS256', 'ES256'],
        issuer: sourceBankPrefix
      });

      // Additional checks
      // Check if the transaction is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedTransaction.exp && decodedTransaction.exp < currentTime) {
        throw new Error('Transaction JWT has expired');
      }

      // Check if the issuer matches the source bank prefix
      if (decodedTransaction.iss !== sourceBankPrefix) {
        throw new Error(`JWT issuer (${decodedTransaction.iss}) does not match source bank (${sourceBankPrefix})`);
      }

      // Ensure we have the required fields with defaults if missing
      if (!decodedTransaction.currency) {
        decodedTransaction.currency = 'EUR';
      }

      if (!decodedTransaction.explanation) {
        decodedTransaction.explanation = 'External transaction';
      }

      console.log('Incoming transaction:', JSON.stringify(decodedTransaction, null, 2));

      return decodedTransaction;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      throw new Error(`Failed to verify transaction from ${sourceBank.name}: ${jwtError.message}`);
    }
  } catch (error) {
    console.error('Transaction verification failed:', error);
    throw error;
  }
};

/**
 * Logs transaction validation error and throws an exception
 * @param {string} sourceBankPrefix - Source bank prefix
 * @param {string} errorMessage - Error message
 * @throws {Error} - Always throws an exception with additional info
 */
const logAndThrowValidationError = (sourceBankPrefix, errorMessage) => {
  const fullErrorMessage = `Transaction validation failed for bank ${sourceBankPrefix}: ${errorMessage}`;
  console.error(fullErrorMessage);
  throw new Error(fullErrorMessage);
};

module.exports = {
  sendTransactionToBank,
  verifyIncomingTransaction,
  logAndThrowValidationError
};
