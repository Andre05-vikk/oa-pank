const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { verifyIncomingTransaction } = require('../config/interbank.config');
const { getBy, db } = require('../config/database');

/**
 * Handle incoming transactions from other banks
 * This endpoint receives JWT-signed transactions from other banks
 */
router.post('/', async (req, res) => {
  try {
    // Extract the JWT-signed transaction and source bank information
    const { transaction: signedTransaction } = req.body;
    const sourceBankPrefix = req.headers['x-bank-origin'];
    
    if (!signedTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Missing required transaction data'
      });
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
    const toAccount = transaction.toAccount;
    const destinationAccount = await getBy('accounts', 'account_number', toAccount);
    
    if (!destinationAccount) {
      return res.status(404).json({
        success: false,
        message: 'Destination account not found'
      });
    }
    
    // Process the incoming transaction
    // 1. Add the amount to the destination account
    await db.run(
      'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
      transaction.amount, toAccount
    );
    
    // 2. Record the transaction in our database
    const transactionData = {
      from_account: transaction.fromAccount,
      to_account: toAccount,
      amount: transaction.amount,
      currency: transaction.currency || 'EUR',
      description: `${transaction.description || 'External transaction'} (From ${transaction.sourceBankName || sourceBankPrefix})`,
      reference: transaction.reference,
      status: 'completed'
    };
    
    // Insert the transaction into our database
    await db.run(`
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

module.exports = router;
