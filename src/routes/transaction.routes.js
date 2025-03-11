const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import middleware (to be implemented)
// const authMiddleware = require('../middleware/auth.middleware');

// Get all transactions for authenticated user
router.get('/', (req, res) => {
  // Temporary implementation until controller is created
  res.status(200).json({
    success: true,
    transactions: [
      {
        _id: '60d21b4667d0d8992e610c88',
        transactionId: 'OAP-1620000000000-12345',
        fromAccount: 'OAP12345678',
        toAccount: 'OAP87654321',
        amount: 100.00,
        currency: 'EUR',
        status: 'completed',
        type: 'internal',
        description: 'Test transaction',
        initiatedBy: '60d21b4667d0d8992e610c85',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  });
});

// Create new transaction
router.post(
  '/',
  [
    body('fromAccount').notEmpty().withMessage('Source account is required'),
    body('toAccount').notEmpty().withMessage('Destination account is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('currency').isIn(['EUR', 'USD', 'GBP']).withMessage('Valid currency is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
  ],
  (req, res) => {
    // Temporary implementation until controller is created
    res.status(201).json({
      success: true,
      transaction: {
        _id: '60d21b4667d0d8992e610c89',
        transactionId: 'OAP-' + Date.now() + '-' + Math.floor(10000 + Math.random() * 90000),
        fromAccount: req.body.fromAccount,
        toAccount: req.body.toAccount,
        amount: req.body.amount,
        currency: req.body.currency,
        status: 'pending',
        type: req.body.toAccount.startsWith('OAP') ? 'internal' : 'external',
        description: req.body.description || '',
        initiatedBy: '60d21b4667d0d8992e610c85', // This would be the authenticated user's ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }
);

// Get transaction by ID
router.get('/:id', (req, res) => {
  // Temporary implementation until controller is created
  res.status(200).json({
    success: true,
    transaction: {
      _id: req.params.id,
      transactionId: 'OAP-1620000000000-12345',
      fromAccount: 'OAP12345678',
      toAccount: 'OAP87654321',
      amount: 100.00,
      currency: 'EUR',
      status: 'completed',
      type: 'internal',
      description: 'Test transaction',
      initiatedBy: '60d21b4667d0d8992e610c85',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

module.exports = router;