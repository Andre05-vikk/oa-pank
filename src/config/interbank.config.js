const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { getBy } = require('./database');

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
    const privateKey = getPrivateKey();

    // Create a JWT-signed transaction payload
    const signedTransaction = jwt.sign(transaction, privateKey, {
      algorithm: 'RS256',
      expiresIn: '5m', // Short expiration for security
      issuer: process.env.BANK_PREFIX || 'OAP'
    });

    // Send the transaction to the target bank
    const response = await axios.post(`${targetBankUrl}/api/incoming-transactions`,
      { transaction: signedTransaction },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Bank-Signature': signedTransaction.split('.')[2], // Use signature part as additional verification
          'X-Bank-Origin': process.env.BANK_PREFIX || 'OAP'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to send transaction to bank:', error);
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
    // Get the source bank information
    const sourceBank = await getBy('external_banks', 'prefix', sourceBankPrefix);
    if (!sourceBank) {
      throw new Error(`Unknown bank with prefix ${sourceBankPrefix}`);
    }

    // Get the source bank's public key from the central bank
    const { getBankPublicKey } = require('./central-banks.config');

    try {
      // Fetch the public key from the central bank with retry logic
      let bankPublicKey;
      try {
        bankPublicKey = await getBankPublicKey(sourceBankPrefix);
      } catch (centralBankError) {
        console.error(`Could not connect to central bank to verify transaction from ${sourceBankPrefix}:`, centralBankError.message);
        // Kui keskpank ei vasta, siis lükkame tehingu tagasi turvalisuse kaalutlustel
        throw new Error(`Could not verify transaction from ${sourceBankPrefix} due to central bank service unavailability. Please try again later.`);
      }

      if (!bankPublicKey || !bankPublicKey.keys || !bankPublicKey.keys.length) {
        throw new Error(`Could not retrieve public key for bank ${sourceBankPrefix} from central bank`);
      }

      // Extract the public key from the JWKS response
      const publicKey = bankPublicKey.keys[0];

      // Kontrollime, et keskpank on andnud korraliku avaliku võtme
      if (!publicKey.n || !publicKey.e) {
        throw new Error(`Central bank provided invalid public key format for bank ${sourceBankPrefix}. Transaction rejected for security reasons.`);
      }

      // Verify the JWT signature using the public key
      const decodedTransaction = jwt.verify(signedTransaction, publicKey, {
        algorithms: ['RS256'],
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
 * Logib tehingu valideerimise vea ja viskab erindi
 * @param {string} sourceBankPrefix - Lähtekoodi panga prefiks
 * @param {string} errorMessage - Veateade
 * @throws {Error} - Alati viskab erindi koos täiendava infoga
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
