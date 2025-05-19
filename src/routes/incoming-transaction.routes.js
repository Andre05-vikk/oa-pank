const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyIncomingTransaction } = require('../config/interbank.config');
const { getBy, getDatabase } = require('../config/database');
const { formatTransactionForResponse, toCamelCase } = require('../lib/format.util');

/**
 * Handle incoming transactions from other banks
 * This endpoint receives JWT-signed transactions from other banks
 */
router.post('/', async (req, res) => {
  try {
    // Check if the request contains a JWT token in the 'transaction' or 'jwt' field
    // or if the request body itself is the transaction data
    let signedTransaction = req.body.transaction || req.body.jwt;
    let sourceBankPrefix = req.headers['x-bank-origin'];

    // If there's no JWT token in transaction or jwt field, check if the body itself might be the transaction data
    if (!signedTransaction) {
      console.log('No JWT token found, checking if body contains direct transaction data');

      // Check if the body has typical transaction fields
      if (req.body.accountFrom || req.body.accountTo || req.body.amount) {
        console.log('Request body appears to contain direct transaction data');

        // For direct transaction data, we need to verify it differently
        // We'll handle this as a special case
        return handleDirectTransactionData(req, res);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Missing required transaction data'
        });
      }
    }

    // If source bank prefix is not in header, try to extract it from JWT payload
    let actualSourceBankPrefix = sourceBankPrefix;
    if (!actualSourceBankPrefix) {
      try {
        const decoded = jwt.decode(signedTransaction, { complete: true });
        if (decoded && decoded.payload && decoded.payload.iss) {
          actualSourceBankPrefix = decoded.payload.iss;
          console.log(`Extracted source bank prefix from JWT: ${actualSourceBankPrefix}`);
        } else {
          return res.status(400).json({
            success: false,
            message: 'Could not determine source bank'
          });
        }
      } catch (jwtError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JWT format'
        });
      }
    }

    // Verify the incoming transaction with the source bank's public key from central bank
    let transaction;
    try {
      transaction = await verifyIncomingTransaction(signedTransaction, actualSourceBankPrefix);
    } catch (verificationError) {
      console.error('Transaction verification failed:', verificationError);
      return res.status(401).json({
        success: false,
        message: 'Transaction verification failed',
        error: verificationError.message
      });
    }

    // Check if the destination account exists in our bank
    const toAccount = transaction.accountTo;
    const destinationAccount = await getBy('accounts', 'account_number', toAccount);

    if (!destinationAccount) {
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Process the incoming transaction
    // 1. Add the amount to the destination account
    const db = getDatabase();
    if (!db) {
      console.error('ERROR: Database connection is not available');
      return res.status(500).json({
        success: false,
        message: 'Database connection is not available',
        error: 'database_connection_error'
      });
    }

    await db.run(
      'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
      transaction.amount, toAccount
    );

    // 2. Record the transaction in our database
    const transactionData = {
      from_account: transaction.accountFrom,
      to_account: toAccount,
      amount: transaction.amount,
      currency: transaction.currency || 'EUR',
      description: `${transaction.explanation || 'External transaction'} (From ${transaction.sourceBankName || sourceBankPrefix})`,
      reference: transaction.reference,
      status: 'completed'
    };

    // Insert the transaction into our database
    const now = new Date().toISOString();
    await db.run(`
      INSERT INTO transactions (from_account, to_account, amount, currency, description, reference, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionData.from_account,
      transactionData.to_account,
      transactionData.amount,
      transactionData.currency,
      transactionData.description,
      transactionData.reference,
      transactionData.status,
      now,
      now
    ]);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Transaction processed successfully',
      transactionReference: transaction.reference
    });
  } catch (error) {
    console.error('Failed to process incoming transaction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process incoming transaction',
      error: error.message
    });
  }
});

/**
 * Handle direct transaction data (not wrapped in JWT)
 * This is used by banks that send transaction data directly in the request body
 */
async function handleDirectTransactionData(req, res) {
  try {
    console.log('Processing direct transaction data:', JSON.stringify(req.body, null, 2));

    // Extract transaction data from request body
    const {
      fromAccount,
      toAccount,
      amount,
      currency = 'EUR',
      explanation = 'External transaction',
      reference = `direct-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceBank,
      sourceBankName
    } = req.body;

    // Validate required fields
    if (!fromAccount || !toAccount || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required transaction fields (fromAccount, toAccount, amount)'
      });
    }

    // Check if the destination account exists in our bank
    const destinationAccount = await getBy('accounts', 'account_number', toAccount);

    if (!destinationAccount) {
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }

    // Get database connection
    const db = getDatabase();
    if (!db) {
      console.error('ERROR: Database connection is not available');
      return res.status(500).json({
        success: false,
        message: 'Database connection is not available',
        error: 'database_connection_error'
      });
    }

    // Process the transaction
    // 1. Add the amount to the destination account
    await db.run(
      'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
      parseFloat(amount), accountTo // Ensure amount is a number
    );

    // 2. Record the transaction in our database
    const transactionData = {
      from_account: accountFrom,
      to_account: accountTo,
      amount: parseFloat(amount), // Ensure amount is a number
      currency: currency,
      description: `${explanation} (From ${sourceBankName || sourceBank || 'External Bank'})`,
      reference: reference,
      status: 'completed'
    };

    // Insert the transaction into our database
    const result = await db.run(`
      INSERT INTO transactions (from_account, to_account, amount, currency, description, reference, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      transactionData.from_account,
      transactionData.to_account,
      transactionData.amount,
      transactionData.currency,
      transactionData.description,
      transactionData.reference,
      transactionData.status
    ]);

    // Get the inserted transaction
    const transaction = await db.get('SELECT * FROM transactions WHERE id = ?', result.lastID);

    // Format the transaction for API response
    const formattedTransaction = formatTransactionForResponse(transaction);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Transaction processed successfully',
      transaction: formattedTransaction
    });
  } catch (error) {
    console.error('Failed to process direct transaction data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process direct transaction',
      error: error.message
    });
  }
}

module.exports = router;
