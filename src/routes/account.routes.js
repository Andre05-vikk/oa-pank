const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import middleware (to be implemented)
// const authMiddleware = require('../middleware/auth.middleware');

// Get all accounts for authenticated user
router.get('/', (req, res) => {
  // Temporary implementation until controller is created
  res.status(200).json({
    success: true,
    accounts: [
      {
        _id: '60d21b4667d0d8992e610c86',
        accountNumber: 'OAP12345678',
        user: '60d21b4667d0d8992e610c85',
        balance: 1000.00,
        currency: 'EUR',
        isActive: true,
        type: 'checking',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Create new account
router.post(
  '/',
  [
    body('currency').isIn(['EUR', 'USD', 'GBP']).withMessage('Valid currency is required'),
    body('type').isIn(['checking', 'savings', 'investment']).withMessage('Valid account type is required'),
  ],
  (req, res) => {
    // Temporary implementation until controller is created
    res.status(201).json({
      success: true,
      account: {
        _id: '60d21b4667d0d8992e610c87',
        accountNumber: 'OAP87654321',
        user: '60d21b4667d0d8992e610c85',
        balance: 0.00,
        currency: req.body.currency || 'EUR',
        isActive: true,
        type: req.body.type || 'checking',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }
);

// Get account by ID
router.get('/:id', (req, res) => {
  // Temporary implementation until controller is created
  res.status(200).json({
    success: true,
    account: {
      _id: req.params.id,
      accountNumber: 'OAP12345678',
      user: '60d21b4667d0d8992e610c85',
      balance: 1000.00,
      currency: 'EUR',
      isActive: true,
      type: 'checking',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

module.exports = router;