const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {getBy} = require('../config/database');
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

// Login route - POST /sessions
router.post(
  '/',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
    async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Format validation errors for better readability
                const formattedErrors = errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value
                }));

                // Check for specific validation errors
                const usernameError = formattedErrors.find(e => e.field === 'username');
                const passwordError = formattedErrors.find(e => e.field === 'password');

                let message = 'Validation failed';
                if (usernameError && passwordError) {
                    message = 'Username and password are required';
                } else if (usernameError) {
                    message = 'Username is required';
                } else if (passwordError) {
                    message = 'Password is required';
                }

                return res.status(400).json({
                    success: false,
                    message: message,
                    errors: formattedErrors
                });
            }

            // Check if user exists
            const user = await getBy('users', 'username', req.body.username);
            if (!user) {
                return res.status(401)
                    .contentType('application/problem+json')
                    .json({
                        type: 'https://example.com/authentication-error',
                        title: 'Authentication Failed',
                        status: 401,
                        detail: 'No user found with the provided username',
                        instance: req.originalUrl
                    });
            }

            // Check password
            const isMatch = await bcrypt.compare(req.body.password, user.password_hash || user.passwordHash);

            if (!isMatch) {
                return res.status(401)
                    .contentType('application/problem+json')
                    .json({
                        type: 'https://example.com/authentication-error',
                        title: 'Authentication Failed',
                        status: 401,
                        detail: 'The provided password is incorrect',
                        instance: req.originalUrl
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

// Logout route - DELETE /sessions/current
router.delete('/current', authenticate, async (req, res) => {
    try {
        // Blacklist the current token
        blacklistToken(req.token);

        // Return 204 No Content status without body
        res.status(204).end();
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
            error: error.message
        });
    }
});

// Refresh token route - POST /sessions/current/refresh
router.post('/current/refresh', authenticate, async (req, res) => {
    try {
        // Get user from database to ensure they still exist and are active
        const user = await getBy('users', 'username', req.user.username);
        if (!user) {
            return res.status(401)
                .contentType('application/problem+json')
                .json({
                    type: 'https://example.com/authentication-error',
                    title: 'Authentication Failed',
                    status: 401,
                    detail: 'The user associated with this session no longer exists',
                    instance: req.originalUrl
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
