const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const {getById, update, getBy, insert, remove} = require('../config/database');
const {authenticate} = require('../middleware/auth.middleware');

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

// Format user for API response
const formatUserForResponse = (user) => {
    if (!user) return null;
    const camelCaseUser = toCamelCase(user);

    return {
        _id: camelCaseUser.id.toString(),
        username: camelCaseUser.username,
        firstName: camelCaseUser.firstName,
        lastName: camelCaseUser.lastName,
        email: camelCaseUser.email,
        role: camelCaseUser.role || 'user',
        isActive: true,
        lastLogin: camelCaseUser.lastLogin || new Date().toISOString(),
        createdAt: camelCaseUser.createdAt || new Date().toISOString(),
        updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
    };
};

// CREATE - Register new user
router.post(
    '/',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
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

            // Check if username already exists
            const existingUser = await getBy('users', 'username', req.body.username);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);

            // Prepare user data
            const userData = {
                username: req.body.username,
                password_hash: hashedPassword,
                first_name: req.body.firstName,
                last_name: req.body.lastName,
                email: req.body.email,
            };

            // Insert user into database
            const user = await insert('users', userData);

            // Format user for API response
            const formattedUser = formatUserForResponse(user);

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                user: formattedUser
            });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create user',
                error: error.message
            });
        }
    }
);

// READ - Get current user (self)
router.get('/me', authenticate, async (req, res) => {
    try {
        // User is attached to request by authenticate middleware
        const user = req.user;
        const formattedUser = formatUserForResponse(user);

        res.status(200).json({
            success: true,
            user: formattedUser
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message
        });
    }
});

// READ - Get user by ID (self only)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is requesting their own data
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only view your own profile'
            });
        }

        const user = await getById('users', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const formattedUser = formatUserForResponse(user);

        res.status(200).json({
            success: true,
            user: formattedUser
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// UPDATE - Update user (self)
router.put(
    '/:id',
    authenticate,
  [
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
    async (req, res) => {
        try {
            const userId = req.params.id;

            // Check if user is updating their own data
            if (req.user.id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only update your own profile'
                });
            }

            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            // Prepare update data
            const updateData = {};
            if (req.body.firstName) updateData.first_name = req.body.firstName;
            if (req.body.lastName) updateData.last_name = req.body.lastName;
            if (req.body.email) updateData.email = req.body.email;

            // Update user in database
            await update('users', userId, updateData);

            // Get updated user
            const updatedUser = await getById('users', userId);
            const formattedUser = formatUserForResponse(updatedUser);

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                user: formattedUser
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update user',
                error: error.message
            });
        }
  }
);

// UPDATE - Change password (self)
router.put(
    '/:id/password',
    authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
    async (req, res) => {
        try {
            const userId = req.params.id;

            // Check if user is updating their own password
            if (req.user.id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only change your own password'
                });
            }

            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const user = await getById('users', userId);

            // Check current password
            const isMatch = await bcrypt.compare(req.body.currentPassword, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

            // Update password in database
            await update('users', userId, {password_hash: hashedPassword});

            res.status(200).json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to change password',
                error: error.message
            });
        }
  }
);

// DELETE - Delete user (self only)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user is deleting their own account
        if (req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You can only delete your own account'
            });
        }

        // Check if user exists
        const user = await getById('users', userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get all user accounts
        const accounts = await getBy('accounts', 'user_id', userId, true);

        // Check if any accounts have non-zero balance
        const accountsWithBalance = accounts.filter(account => account.balance !== 0);
        if (accountsWithBalance.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user with accounts that have non-zero balance. Please settle all accounts first.',
                accounts: accountsWithBalance.map(acc => ({
                    accountNumber: acc.account_number,
                    balance: acc.balance,
                    currency: acc.currency
                }))
            });
        }

        // Delete all user accounts first
        for (const account of accounts) {
            await remove('accounts', account.id);
        }

        // Delete user from database
        await remove('users', userId);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

module.exports = router;