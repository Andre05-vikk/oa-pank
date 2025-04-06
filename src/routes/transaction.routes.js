const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const {v4: uuidv4} = require('uuid');
const {sendTransactionToBank} = require('../config/interbank.config');
const {getAll, getById, createTransaction, processIncomingTransaction, getBy, db} = require('../config/database');
const {convertCurrency} = require('../config/currency.config');

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[newKey] = obj[key];
    });
    return newObj;
};

// Helper function to convert camelCase to snake_case
// Not currently used, but kept for future use
/*
const toSnakeCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        newObj[newKey] = obj[key];
    });
    return newObj;
};
*/

// Import authentication middleware
const {authenticate} = require('../middleware/auth.middleware');

// Format transaction for API response
const formatTransactionForResponse = (transaction) => {
    if (!transaction) return null;
    const camelCaseTransaction = toCamelCase(transaction);

    return {
        _id: camelCaseTransaction.id.toString(),
        transactionId: camelCaseTransaction.reference || `${process.env.BANK_PREFIX || 'OAP'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        fromAccount: camelCaseTransaction.fromAccount,
        toAccount: camelCaseTransaction.toAccount,
        amount: parseFloat(camelCaseTransaction.amount || 0).toFixed(2),
        currency: camelCaseTransaction.currency,
        status: camelCaseTransaction.status || 'pending',
        type: camelCaseTransaction.toAccount.startsWith(process.env.BANK_PREFIX || 'OAP') ? 'internal' : 'external',
        description: camelCaseTransaction.description,
        errorMessage: camelCaseTransaction.errorMessage,
        initiatedBy: camelCaseTransaction.initiatedBy ? camelCaseTransaction.initiatedBy.toString() : null,
        signature: camelCaseTransaction.signature,
        senderBank: camelCaseTransaction.senderBank || process.env.BANK_PREFIX || 'OAP',
        receiverBank: camelCaseTransaction.receiverBank || camelCaseTransaction.toAccount.substring(0, 3),
        createdAt: camelCaseTransaction.createdAt || new Date().toISOString(),
        updatedAt: camelCaseTransaction.updatedAt || new Date().toISOString()
    };
};

// READ ALL - Get all transactions for authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        // Filter transactions by user accounts
        const userId = req.user.id;

        // Get user accounts
        const accounts = await getBy('accounts', 'user_id', userId, true);

        // Ensure accounts is an array
        const accountsArray = Array.isArray(accounts) ? accounts : [accounts].filter(Boolean);
        const accountNumbers = accountsArray.map(account => account.account_number);

        // Get transactions where user is sender or receiver
        let transactions = await getAll('transactions');
        transactions = transactions.filter(transaction => {
            return accountNumbers.includes(transaction.from_account) ||
                accountNumbers.includes(transaction.to_account);
        });

        // Format transactions for API response
        const formattedTransactions = transactions.map(formatTransactionForResponse);

        res.status(200).json({
            success: true,
            transactions: formattedTransactions || []
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
            error: error.message
        });
    }
});

// CREATE - Create new transaction
router.post(
  '/',
    authenticate,
  [
    body('fromAccount').notEmpty().withMessage('Source account is required'),
    body('toAccount').notEmpty().withMessage('Destination account is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
      body('currency').isIn(['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']).withMessage('Valid currency is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
  ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {fromAccount, toAccount, amount, currency, description} = req.body;
            const reference = req.body.reference || uuidv4();

            // Check if source account exists and belongs to the authenticated user
            const sourceAccount = await getBy('accounts', 'account_number', fromAccount);
            if (!sourceAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Source account not found'
                });
            }

            // Verify account ownership
            // getBy funktsioon teisendab user_id välja userId-ks
            console.log('Source account userId:', sourceAccount.userId, 'Type:', typeof sourceAccount.userId);
            console.log('Request user id:', req.user.id, 'Type:', typeof req.user.id);

            // Convert userId to number for proper comparison
            const sourceUserId = parseInt(sourceAccount.userId);
            const requestUserId = parseInt(req.user.id);

            console.log('After parsing - Source userId:', sourceUserId, 'Request user id:', requestUserId);

            if (sourceUserId !== requestUserId) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to transfer from this account'
                });
            }

            // Konverteeri summa konto valuutasse, kui need on erinevad
            let amountInAccountCurrency = amount;
            if (currency !== sourceAccount.currency) {
                try {
                    amountInAccountCurrency = convertCurrency(amount, currency, sourceAccount.currency);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: error.message
                    });
                }
            }

            // Check if source account has sufficient funds
            if (sourceAccount.balance < amountInAccountCurrency) {
                return res.status(400).json({
                    success: false,
                    message: 'Insufficient funds',
                    available: sourceAccount.balance,
                    availableCurrency: sourceAccount.currency,
                    required: amountInAccountCurrency,
                    requiredCurrency: sourceAccount.currency,
                    originalAmount: amount,
                    originalCurrency: currency
                });
            }

            // Determine if this is an internal or external transaction
            const bankPrefix = process.env.BANK_PREFIX || 'OAP';
            const isInternal = toAccount.startsWith(bankPrefix);

            if (isInternal) {
                // Check if target account exists and verify currency
                const targetAccount = await getBy('accounts', 'account_number', toAccount);
                if (!targetAccount) {
                    return res.status(404).json({
                        success: false,
                        message: 'Target account not found'
                    });
                }

                // Convert amount from source account currency to target account currency
                let transactionAmount = amount;
                let fromCurrency = currency;
                let toCurrency = targetAccount.currency;

                // If currencies are different, convert the amount
                if (fromCurrency !== toCurrency) {
                    try {
                        transactionAmount = convertCurrency(amount, fromCurrency, toCurrency);
                    } catch (error) {
                        return res.status(400).json({
                            success: false,
                            message: error.message
                        });
                    }
                }

                // Internal transaction - process directly
                const transaction = await createTransaction(
                    fromAccount,
                    toAccount,
                    transactionAmount,
                    `${description || ''} (Converted: ${amount} ${fromCurrency} → ${transactionAmount} ${toCurrency})`,
                    reference
                );

                // Convert snake_case to camelCase for API response
                const camelCaseTransaction = toCamelCase(transaction);
                // Rename id to _id for consistency with the API
                camelCaseTransaction._id = camelCaseTransaction.id;
                delete camelCaseTransaction.id;

                return res.status(201).json({
                    success: true,
                    transaction: camelCaseTransaction
                });
            } else {
                // External transaction - need to determine the target bank
                // Extract bank prefix from account number (e.g., 'KP' from 'KP12345678')
                const targetBankPrefix = toAccount.substring(0, 2); // Assuming 2-letter prefix

                // Get the bank information from our database
                const targetBank = await getBy('external_banks', 'prefix', targetBankPrefix);

                if (!targetBank) {
                    return res.status(400).json({
                        success: false,
                        message: `Unknown bank with prefix ${targetBankPrefix}`
                    });
                }

                try {
                    // Generate a unique reference if not provided
                    const transactionReference = reference || uuidv4();

                    // Deduct the amount from the sender's account
                    await db.run(
                        'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
                        amountInAccountCurrency, fromAccount
                    );

                    // Create a transaction record with 'pending' status
                    const transactionData = {
                        from_account: fromAccount,
                        to_account: toAccount,
                        amount,
                        currency,
                        description: description || 'External transaction',
                        reference: transactionReference,
                        status: 'pending'
                    };

                    // Insert the transaction into our database
                    const transaction = await db.run(`
                        INSERT INTO transactions (from_account, to_account, amount, currency, description, reference,
                                                  status)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `, [fromAccount, toAccount, amount, currency, transactionData.description, transactionReference, 'pending']);

                    // Prepare the data packet for the target bank
                    const externalTransactionData = {
                        fromAccount,
                        toAccount,
                        amount,
                        currency,
                        description: transactionData.description,
                        reference: transactionReference,
                        timestamp: new Date().toISOString(),
                        sourceBank: process.env.BANK_PREFIX || 'OAP',
                        sourceBankName: process.env.BANK_NAME || 'OA-Pank'
                    };

                    // Send the transaction to the target bank using JWT-signed data packet
                    try {
                        // In a real implementation, we would verify with the central bank first
                        // const verificationResult = await verifyTransaction(externalTransactionData);

                        // Send the transaction to the target bank
                        await sendTransactionToBank(externalTransactionData, targetBank.api_url);

                        // Update the transaction status to 'completed'
                        await db.run('UPDATE transactions SET status = ? WHERE reference = ?', ['completed', transactionReference]);

                        // Return successful transaction response
                        return res.status(201).json({
                            success: true,
                            transaction: {
                                fromAccount,
                                toAccount,
                                amount,
                                currency,
                                description: transactionData.description,
                                reference: transactionReference,
                                status: 'completed',
                                externalBankName: targetBank.name,
                                message: `Transaction to ${targetBank.name} (${toAccount}) was successful`,
                                _id: transaction.lastID || Date.now()
                            }
                        });
                    } catch (externalError) {
                        // If the external transaction fails, update the status to 'failed'
                        await db.run('UPDATE transactions SET status = ? WHERE reference = ?', ['failed', transactionReference]);

                        // Refund the amount to the sender's account
                        await db.run(
                            'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
                            amountInAccountCurrency, fromAccount
                        );

                        throw externalError;
                    }
                } catch (error) {
                    console.error('External transaction failed:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to process external transaction',
                        error: error.message
                    });
                }
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create transaction',
                error: error.message
            });
        }
    }
);

// Endpoint to receive transactions from other banks
router.post('/incoming', async (req, res) => {
    try {
        const {fromAccount, toAccount, amount, description, reference} = req.body;

        // Validate the incoming transaction
        if (!fromAccount || !toAccount || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction data'
            });
        }

        // Check if the target account exists in our bank
        const bankPrefix = process.env.BANK_PREFIX || 'OAP';
        if (!toAccount.startsWith(bankPrefix)) {
            return res.status(400).json({
                success: false,
                message: `Account ${toAccount} does not belong to this bank`
            });
        }

        // Process the incoming transaction
        const transaction = await processIncomingTransaction(
            fromAccount,
            toAccount,
            amount,
            description,
            reference
        );

        // Convert snake_case to camelCase for API response
        const camelCaseTransaction = toCamelCase(transaction);
        // Rename id to _id for consistency with the API
        camelCaseTransaction._id = camelCaseTransaction.id;
        delete camelCaseTransaction.id;

        return res.status(200).json({
            success: true,
            message: 'Transaction processed successfully',
            transaction: camelCaseTransaction
        });
    } catch (error) {
        console.error('Error processing incoming transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process incoming transaction',
            error: error.message
        });
    }
});

// READ - Get transaction by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const transaction = await getById('transactions', req.params.id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Check if the transaction involves user's accounts
        const userId = req.user.id;
        const accounts = await getBy('accounts', 'user_id', userId, true);
        const accountNumbers = accounts.map(account => account.account_number);

        const userInvolved = accountNumbers.includes(transaction.from_account) ||
            accountNumbers.includes(transaction.to_account);

        if (!userInvolved && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this transaction'
            });
        }

        // Format transaction for API response
        const formattedTransaction = formatTransactionForResponse(transaction);

        res.status(200).json({
            success: true,
            transaction: formattedTransaction
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transaction',
            error: error.message
        });
    }
});

// UPDATE - Update transaction status (if possible)
router.put(
    '/:id',
    authenticate,
    [
        body('status').isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Valid status is required'),
    ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const transactionId = req.params.id;
            const transaction = await getById('transactions', transactionId);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            // Check if the transaction is from user's account
            const userId = req.user.id;
            const accounts = await getBy('accounts', 'user_id', userId, true);
            const accountNumbers = accounts.map(account => account.account_number);

            if (!accountNumbers.includes(transaction.from_account) && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this transaction'
                });
            }

            // Check if transaction can be updated
            if (transaction.status === 'completed' || transaction.status === 'failed') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot update transaction with status: ${transaction.status}`
                });
            }

            // Update transaction in database
            const updateData = {
                status: req.body.status
            };

            // In a real application, this would involve more complex logic
            // For example, if cancelling a transaction, you might need to refund the amount

            const updatedTransaction = await update('transactions', transactionId, updateData);

            // Format transaction for API response
            const formattedTransaction = formatTransactionForResponse(updatedTransaction);

            res.status(200).json({
                success: true,
                message: 'Transaction updated successfully',
                transaction: formattedTransaction
            });
        } catch (error) {
            console.error('Error updating transaction:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update transaction',
                error: error.message
            });
        }
    }
);

// DELETE - Cancel transaction (if possible)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const transactionId = req.params.id;
        const transaction = await getById('transactions', transactionId);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
    }

        // Check if the transaction is from user's account
        const userId = req.user.id;
        const accounts = await getBy('accounts', 'user_id', userId, true);
        const accountNumbers = accounts.map(account => account.account_number);

        if (!accountNumbers.includes(transaction.from_account) && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to cancel this transaction'
            });
        }

        // Check if transaction can be cancelled
        if (transaction.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel transaction with status: ${transaction.status}`
            });
        }

        // In a real application, this would involve more complex logic
        // For now, we'll just update the status to 'cancelled'
        const updateData = {
            status: 'cancelled'
        };

        await update('transactions', transactionId, updateData);

        res.status(200).json({
            success: true,
            message: 'Transaction cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel transaction',
            error: error.message
        });
    }
});

module.exports = router;