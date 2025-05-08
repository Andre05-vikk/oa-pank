const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { getAll, getById, insert, getBy, update, remove } = require('../config/database');

// Import authentication middleware
const { authenticate } = require('../middleware/auth.middleware');

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


// Format account for API response
const formatAccountForResponse = (account) => {
    if (!account) return null;
    const camelCaseAccount = toCamelCase(account);

    return {
        _id: camelCaseAccount.id.toString(),
        accountNumber: camelCaseAccount.accountNumber,
        user: camelCaseAccount.userId.toString(),
        balance: parseFloat(camelCaseAccount.balance || 0).toFixed(2),
        currency: camelCaseAccount.currency,
        isActive: camelCaseAccount.isActive !== undefined ? camelCaseAccount.isActive : true,
        type: camelCaseAccount.type || 'checking',
        createdAt: camelCaseAccount.createdAt || new Date().toISOString(),
        updatedAt: camelCaseAccount.updatedAt || new Date().toISOString()
    };
};

// Get all accounts for authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        // Filter accounts by user ID from authentication
        const userId = req.user.id;
        // Use getAll and filter manually since getBy only returns a single result
        const allAccounts = await getAll('accounts');
        const accounts = allAccounts.filter(account => account.userId === userId);

        // Convert snake_case to camelCase for API response
        const formattedAccounts = accounts.map(account => {
            const camelCaseAccount = toCamelCase(account);
            // Rename id to _id for consistency with the API
            camelCaseAccount._id = camelCaseAccount.id;
            delete camelCaseAccount.id;
            return camelCaseAccount;
        });

        res.status(200).json({
            success: true,
            accounts: formattedAccounts || []
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accounts',
            error: error.message
        });
    }
});

// Create new account
router.post(
    '/',
    authenticate,
    [
        body('currency').isIn(['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']).withMessage('Valid currency is required'),
        body('type').isIn(['checking', 'savings', 'investment']).withMessage('Valid account type is required'),
        body('accountNumber').optional().isString().withMessage('Account number must be a string'),
        body('userId').optional().isString().withMessage('User ID must be a string'),
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

            // Get bank prefix from global variable set during central bank registration
            const bankPrefix = global.BANK_PREFIX;

            // Generate account number if not provided
            const accountNumber = req.body.accountNumber || `${bankPrefix}${Math.floor(10000000 + Math.random() * 90000000)}`;

            // Check if account number already exists
            const existingAccount = await getBy('accounts', 'account_number', accountNumber);
            if (existingAccount) {
                return res.status(409)
                    .contentType('application/problem+json')
                    .json({
                        type: 'https://example.com/conflict',
                        title: 'Resource Conflict',
                        status: 409,
                        detail: 'An account with this account number already exists in the system',
                        instance: req.originalUrl,
                        accountNumber: accountNumber
                    });
            }

            // Prepare account data
            const accountData = {
                user_id: req.user.id, // Get user ID from authenticated user
                account_number: accountNumber,
                balance: req.body.balance || 1000,
                currency: req.body.currency || 'EUR',
                is_active: true,
                type: req.body.type || 'checking'
            };

            // Insert account into database
            const account = await insert('accounts', accountData);

            // Convert snake_case to camelCase for API response
            const camelCaseAccount = toCamelCase(account);
            // Rename id to _id for consistency with the API
            camelCaseAccount._id = camelCaseAccount.id;
            delete camelCaseAccount.id;

            res.status(201).json({
                success: true,
                account: camelCaseAccount
            });
        } catch (error) {
            console.error('Error creating account:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create account',
                error: error.message
            });
        }
    }
);

// READ - Get account by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const account = await getById('accounts', req.params.id);

        if (!account) {
            return res.status(404)
                .contentType('application/problem+json')
                .json({
                    type: 'https://example.com/not-found',
                    title: 'Resource Not Found',
                    status: 404,
                    detail: 'No account found with the provided ID',
                    instance: req.originalUrl,
                    accountId: req.params.id
                });
        }

        // Check if the account belongs to the authenticated user
        // getBy funktsioon teisendab user_id välja userId-ks
        if (parseInt(account.userId) !== parseInt(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this account'
            });
        }

        // Format account for API response
        const formattedAccount = formatAccountForResponse(account);

        res.status(200).json({
            success: true,
            account: formattedAccount
        });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account',
            error: error.message
        });
    }
});

// UPDATE - Update account by ID
router.put(
    '/:id',
    authenticate,
    [
        body('currency').optional().isIn(['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']).withMessage('Valid currency is required'),
        body('type').optional().isIn(['checking', 'savings', 'investment']).withMessage('Valid account type is required'),
        body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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

            const accountId = req.params.id;
            const account = await getById('accounts', accountId);

            if (!account) {
                return res.status(404)
                    .contentType('application/problem+json')
                    .json({
                        type: 'https://example.com/not-found',
                        title: 'Resource Not Found',
                        status: 404,
                        detail: 'No account found with the provided ID',
                        instance: req.originalUrl,
                        accountId: accountId
                    });
            }

            // Check if the account belongs to the authenticated user
            // getBy funktsioon teisendab user_id välja userId-ks
            if (parseInt(account.userId) !== parseInt(req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this account'
                });
            }

            // Prepare update data (convert camelCase to snake_case)
            const updateData = {};
            if (req.body.currency) updateData.currency = req.body.currency;
            if (req.body.type) updateData.type = req.body.type;
            if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;

            // Update account in database
            const updatedAccount = await update('accounts', accountId, updateData);

            // Format account for API response
            const formattedAccount = formatAccountForResponse(updatedAccount);

            res.status(200).json({
                success: true,
                message: 'Account updated successfully',
                account: formattedAccount
            });
        } catch (error) {
            console.error('Error updating account:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update account',
                error: error.message
            });
        }
    }
);

// GET - Get account balance with transaction sectors
router.get('/:id/balance', authenticate, async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await getById('accounts', accountId);

        if (!account) {
            return res.status(404)
                .contentType('application/problem+json')
                .json({
                    type: 'https://example.com/not-found',
                    title: 'Resource Not Found',
                    status: 404,
                    detail: 'No account found with the provided ID',
                    instance: req.originalUrl,
                    accountId: accountId
                });
        }

        // Check if the account belongs to the authenticated user
        if (parseInt(account.userId) !== parseInt(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this account'
            });
        }

        // Get all transactions for this account
        const allTransactions = await getAll('transactions');
        const accountTransactions = allTransactions.filter(transaction =>
            transaction.from_account === account.account_number ||
            transaction.to_account === account.account_number
        );

        // Calculate transaction sectors
        const incomingTransactions = accountTransactions.filter(
            transaction => transaction.to_account === account.account_number
        );

        const outgoingTransactions = accountTransactions.filter(
            transaction => transaction.from_account === account.account_number
        );

        // Calculate totals
        const incomingTotal = incomingTransactions.reduce(
            (sum, transaction) => sum + parseFloat(transaction.amount || 0),
            0
        ).toFixed(2);

        const outgoingTotal = outgoingTransactions.reduce(
            (sum, transaction) => sum + parseFloat(transaction.amount || 0),
            0
        ).toFixed(2);

        // Calculate percentages
        const totalTransactions = accountTransactions.length;
        const incomingPercentage = totalTransactions > 0
            ? Math.round((incomingTransactions.length / totalTransactions) * 100)
            : 0;

        const outgoingPercentage = totalTransactions > 0
            ? Math.round((outgoingTransactions.length / totalTransactions) * 100)
            : 0;

        res.status(200).json({
            success: true,
            balance: {
                amount: parseFloat(account.balance || 0).toFixed(2),
                currency: account.currency,
                sectors: {
                    incoming: {
                        total: incomingTotal,
                        count: incomingTransactions.length,
                        percentage: incomingPercentage
                    },
                    outgoing: {
                        total: outgoingTotal,
                        count: outgoingTransactions.length,
                        percentage: outgoingPercentage
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching account balance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch account balance',
            error: error.message
        });
    }
});

// DELETE - Delete account by ID
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const accountId = req.params.id;
        const account = await getById('accounts', accountId);

        if (!account) {
            return res.status(404)
                .contentType('application/problem+json')
                .json({
                    type: 'https://example.com/not-found',
                    title: 'Resource Not Found',
                    status: 404,
                    detail: 'No account found with the provided ID',
                    instance: req.originalUrl,
                    accountId: accountId
                });
        }

        // Check if the account belongs to the authenticated user
        // getBy funktsioon teisendab user_id välja userId-ks
        if (parseInt(account.userId) !== parseInt(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this account'
            });
        }

        // Check if account has non-zero balance
        if (account.balance !== 0) {
            return res.status(409)
                .contentType('application/problem+json')
                .json({
                    type: 'https://example.com/conflict',
                    title: 'Resource Conflict',
                    status: 409,
                    detail: 'The account has a non-zero balance which conflicts with the deletion request',
                    instance: req.originalUrl,
                    accountId: accountId,
                    balance: account.balance,
                    currency: account.currency
                });
        }

        // Delete account from database
        await remove('accounts', accountId);

        // Return 204 No Content status without body
        res.status(204).end();
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: error.message
        });
    }
});

module.exports = router;
