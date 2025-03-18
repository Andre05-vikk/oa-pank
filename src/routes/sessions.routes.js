const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {getBy, insert} = require('../config/database');
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
const toSnakeCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        newObj[newKey] = obj[key];
    });
    return newObj;
};

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
                _id: camelCaseUser.id ? `${Math.random().toString(16).substring(2)}${Date.now().toString(16)}` : null, // Generate hex string ID
                username: camelCaseUser.username,
                firstName: camelCaseUser.firstName,
                lastName: camelCaseUser.lastName,
                email: camelCaseUser.email,
                role: camelCaseUser.role || 'user', // Include role in response
                isActive: true, // Default to true for new users
                lastLogin: new Date().toISOString(),
                createdAt: camelCaseUser.createdAt || new Date().toISOString(),
                updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
            };

            // Don't return password hash for security
            delete formattedUser.passwordHash;

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

            // The user object from database might already be converted to camelCase format
            console.log('User found:', user);
            console.log('Password from request:', req.body.password);
            console.log('Password hash from DB:', user.password_hash || user.passwordHash);

            // Check password - use either password_hash or passwordHash field
            const isMatch = await bcrypt.compare(req.body.password, user.password_hash || user.passwordHash);
            console.log('Password match result:', isMatch);

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
                _id: camelCaseUser.id ? `${Math.random().toString(16).substring(2)}${Date.now().toString(16)}` : null, // Generate hex string ID
                username: camelCaseUser.username,
                firstName: camelCaseUser.firstName,
                lastName: camelCaseUser.lastName,
                email: camelCaseUser.email,
                role: camelCaseUser.role || 'user', // Include role in response
                isActive: true, // Default to true for new users
                lastLogin: new Date().toISOString(),
                createdAt: camelCaseUser.createdAt || new Date().toISOString(),
                updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
            };

            // Don't return password hash for security
            delete formattedUser.passwordHash;

            // Update last login time in database (async, don't wait for it)
            try {
                // This would be implemented in a real application
                // updateLastLogin(user.id);
            } catch (error) {
                console.error('Error updating last login time:', error);
            }

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

// READ - Get current session info
router.get('/', authenticate, async (req, res) => {
    try {
        // User is attached to request by authenticate middleware
        const user = req.user;

        // Convert snake_case to camelCase for API response
        const camelCaseUser = toCamelCase(user);

        // Format the user object to match the documentation
        const formattedUser = {
            _id: camelCaseUser.id ? `${Math.random().toString(16).substring(2)}${Date.now().toString(16)}` : null, // Generate hex string ID
            username: camelCaseUser.username,
            firstName: camelCaseUser.firstName,
            lastName: camelCaseUser.lastName,
            email: camelCaseUser.email,
            role: camelCaseUser.role || 'user', // Include role in response
            isActive: true,
            lastLogin: camelCaseUser.lastLogin || new Date().toISOString(),
            createdAt: camelCaseUser.createdAt || new Date().toISOString(),
            updatedAt: camelCaseUser.updatedAt || new Date().toISOString()
        };

        // Don't return password hash for security
        delete formattedUser.passwordHash;

        res.status(200).json({
            success: true,
            session: {
                user: formattedUser,
                isAuthenticated: true,
                // In a real implementation, we would extract the expiry from the token
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day from now
            }
        });
    } catch (error) {
        console.error('Error fetching session info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch session info',
            error: error.message
    });
  }
});

// UPDATE - Refresh token (update session)
router.put('/', authenticate, async (req, res) => {
    try {
        // User is already authenticated via middleware
        const userId = req.user.id;

        // Create a new JWT token
        const token = jwt.sign(
            {id: userId, username: req.user.username},
            process.env.JWT_SECRET || 'your-secret-key',
            {expiresIn: '1d'}
        );

        res.status(200).json({
            success: true,
            message: 'Session refreshed successfully',
            token
        });
    } catch (error) {
        console.error('Error refreshing session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh session',
            error: error.message
        });
    }
});

// DELETE - End session (logout)
router.delete('/', authenticate, async (req, res) => {
    try {
        // Log that the user has logged out
        console.log(`User ${req.user.id} logged out`);

        // Simply end the session by responding to the client
        res.status(200).json({
            success: true,
            message: 'Session ended successfully'
        });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end session',
            error: error.message
        });
    }
});

// Legacy routes for backward compatibility

// Logout (legacy) - redirects to DELETE /
router.post('/logout', authenticate, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logout successful',
            deprecated: 'This endpoint is deprecated, please use DELETE /sessions instead'
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

module.exports = router;