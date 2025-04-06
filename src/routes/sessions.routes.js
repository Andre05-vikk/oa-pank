const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {getBy, insert} = require('../config/database');
const {authenticate} = require('../middleware/auth.middleware');
const {blacklistToken} = require('../utils/token-blacklist');

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

// Register route
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
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
                role: req.body.role || 'user', // Default to 'user' if not specified
            };

            // Insert user into database
            const user = await insert('users', userData);

            // Convert snake_case to camelCase for API response
            const camelCaseUser = toCamelCase(user);

            // Format the user object to match the documentation
            const formattedUser = {
                _id: camelCaseUser.id.toString(),
                username: camelCaseUser.username,
                firstName: camelCaseUser.firstName,
                lastName: camelCaseUser.lastName,
                email: camelCaseUser.email,
                role: camelCaseUser.role || 'user',
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: camelCaseUser.createdAt || new Date().toISOString(),
                updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
            };

            res.status(201).json({
                success: true,
                user: formattedUser
            });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to register user',
                error: error.message
            });
        }
  }
);

// Login route
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
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

            // Check if user exists
            const user = await getBy('users', 'username', req.body.username);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(req.body.password, user.password_hash || user.passwordHash);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            // Create JWT token
            const token = jwt.sign(
                {id: user.id, username: user.username},
                process.env.JWT_SECRET || 'your-secret-key',
                {expiresIn: '1d'}
            );

            // Convert snake_case to camelCase for API response
            const camelCaseUser = toCamelCase(user);

            // Format the user object to match the documentation
            const formattedUser = {
                _id: camelCaseUser.id.toString(),
                username: camelCaseUser.username,
                firstName: camelCaseUser.firstName,
                lastName: camelCaseUser.lastName,
                email: camelCaseUser.email,
                role: camelCaseUser.role || 'user',
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: camelCaseUser.createdAt || new Date().toISOString(),
                updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
            };

            res.status(200).json({
                success: true,
                token,
                user: formattedUser
            });
        } catch (error) {
            console.error('Error logging in:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to login',
                error: error.message
            });
        }
    }
);

// Logout route (DELETE method as per Swagger spec)
router.delete('/', authenticate, async (req, res) => {
    try {
        // Blacklist the current token
        blacklistToken(req.token);

        res.status(200).json({
            success: true,
            message: 'Successfully logged out'
        });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
            error: error.message
        });
    }
});

// Refresh token route
router.post('/refresh', authenticate, async (req, res) => {
    try {
        // Get user from database to ensure they still exist and are active
        const user = await getBy('users', 'username', req.user.username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Blacklist the old token
        blacklistToken(req.token);

        // Create new token
        const newToken = jwt.sign(
            {id: user.id, username: user.username},
            process.env.JWT_SECRET || 'your-secret-key',
            {expiresIn: '1d'}
        );

        res.status(200).json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: error.message
        });
    }
});

module.exports = router;