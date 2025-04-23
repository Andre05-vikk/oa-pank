/**
 * Transaction Processor Service
 * Handles asynchronous processing of interbank transactions
 */

const { getDatabase } = require('../config/database');
const { sendTransactionToBank } = require('../config/interbank.config');

// In-memory queue for pending transactions
const transactionQueue = [];
let isProcessing = false;

/**
 * Add a transaction to the processing queue
 * @param {Object} transaction - Transaction data
 * @param {string} targetBankUrl - URL of the target bank
 * @param {string} transactionReference - Reference ID for the transaction
 * @returns {Promise<void>}
 */
const queueTransaction = async (transaction, targetBankUrl, transactionReference) => {
  console.log(`Queueing transaction ${transactionReference} to ${targetBankUrl}`);

  // Add to queue
  transactionQueue.push({
    transaction,
    targetBankUrl,
    transactionReference,
    retryCount: 0,
    timestamp: Date.now()
  });

  // Start processing if not already running
  if (!isProcessing) {
    processTransactionQueue();
  }
};

/**
 * Process the transaction queue
 * @returns {Promise<void>}
 */
const processTransactionQueue = async () => {
  if (isProcessing || transactionQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log(`Processing transaction queue. ${transactionQueue.length} transactions pending.`);

  try {
    // Get the next transaction from the queue
    const queueItem = transactionQueue.shift();
    const { transaction, targetBankUrl, transactionReference, retryCount } = queueItem;

    // Update transaction status to 'inProgress'
    await updateTransactionStatus(transactionReference, 'inProgress');

    try {
      // Send the transaction to the target bank
      console.log(`Processing transaction ${transactionReference} to ${targetBankUrl}`);
      await sendTransactionToBank(transaction, targetBankUrl);

      // Update transaction status to 'completed'
      await updateTransactionStatus(transactionReference, 'completed');
      console.log(`Transaction ${transactionReference} completed successfully`);
    } catch (error) {
      console.error(`Error processing transaction ${transactionReference}:`, error.message);

      // Check if we should retry
      const maxRetries = 3;
      if (retryCount < maxRetries) {
        console.log(`Retrying transaction ${transactionReference} (Attempt ${retryCount + 1}/${maxRetries})`);

        // Add back to queue with increased retry count
        transactionQueue.push({
          ...queueItem,
          retryCount: retryCount + 1,
          timestamp: Date.now()
        });

        // Update transaction status to 'retrying'
        await updateTransactionStatus(transactionReference, 'retrying', `Retry attempt ${retryCount + 1}/${maxRetries}`);
      } else {
        console.log(`Transaction ${transactionReference} failed after ${maxRetries} attempts`);

        // Update transaction status to 'failed'
        await updateTransactionStatus(transactionReference, 'failed', error.message);

        // Refund the amount to the sender's account
        await refundTransaction(transaction);
      }
    }
  } catch (error) {
    console.error('Error in transaction queue processing:', error);
  } finally {
    isProcessing = false;

    // Continue processing if there are more transactions in the queue
    if (transactionQueue.length > 0) {
      // Add a small delay to prevent overwhelming the system
      setTimeout(processTransactionQueue, 100);
    }
  }
};

/**
 * Update transaction status in the database
 * @param {string} reference - Transaction reference
 * @param {string} status - New status
 * @param {string} [errorMessage] - Optional error message
 * @returns {Promise<void>}
 */
const updateTransactionStatus = async (reference, status, errorMessage = null) => {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection is not available');
    }

    // Update transaction status
    await db.run('UPDATE transactions SET status = ? WHERE reference = ?', [status, reference]);

    // If there's an error message, update the description
    if (errorMessage) {
      await db.run(
        'UPDATE transactions SET description = description || ? WHERE reference = ?',
        [` (${status}: ${errorMessage})`, reference]
      );
    }
  } catch (error) {
    console.error(`Error updating transaction status for ${reference}:`, error);
    throw error;
  }
};

/**
 * Refund a failed transaction
 * @param {Object} transaction - Transaction data
 * @returns {Promise<void>}
 */
const refundTransaction = async (transaction) => {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection is not available');
    }

    // Get the original transaction amount
    const amount = parseFloat(transaction.amount);
    const accountFrom = transaction.accountFrom;

    // Refund the amount to the sender's account
    await db.run(
      'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
      [amount, accountFrom]
    );

    console.log(`Refunded ${amount} to account ${accountFrom}`);
  } catch (error) {
    console.error('Error refunding transaction:', error);
    throw error;
  }
};

/**
 * Retry failed transactions
 * @returns {Promise<void>}
 */
const retryFailedTransactions = async () => {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection is not available');
    }

    // Get all failed transactions that are not too old (less than 24 hours)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    const failedTransactions = await db.all(`
      SELECT * FROM transactions
      WHERE status = 'failed'
      AND created_at > ?
      AND retry_count < 3
    `, [cutoffTime.toISOString()]);

    console.log(`Found ${failedTransactions.length} failed transactions to retry`);

    // Queue each failed transaction for retry
    for (const transaction of failedTransactions) {
      // Increment retry count
      await db.run(
        'UPDATE transactions SET retry_count = retry_count + 1 WHERE id = ?',
        [transaction.id]
      );

      // Get target bank information
      const targetBankPrefix = transaction.to_account.substring(0, 3);
      const targetBank = await db.get(
        'SELECT * FROM external_banks WHERE prefix = ?',
        [targetBankPrefix]
      );

      if (targetBank && targetBank.transaction_url) {
        // Prepare transaction data
        const transactionData = {
          accountFrom: transaction.from_account,
          accountTo: transaction.to_account,
          amount: parseFloat(transaction.amount),
          currency: transaction.currency || 'EUR',
          explanation: transaction.description,
          reference: transaction.reference,
          senderName: process.env.BANK_NAME || 'OA-Pank',
          sourceBank: global.BANK_PREFIX,
          sourceBankName: process.env.BANK_NAME || 'OA-Pank'
        };

        // Queue the transaction for retry
        await queueTransaction(transactionData, targetBank.transaction_url, transaction.reference);
      } else {
        console.error(`Cannot retry transaction ${transaction.reference}: Target bank not found or missing transaction URL`);
      }
    }
  } catch (error) {
    console.error('Error retrying failed transactions:', error);
  }
};

// Export the service functions
module.exports = {
  queueTransaction,
  processTransactionQueue,
  retryFailedTransactions
};
