/**
 * Mock for reference bank API
 * This is used to mock the reference bank API for testing purposes
 */

const express = require('express');
const router = express.Router();

// Mock data with account number matching the bank prefix from central bank
const mockUsers = [
  {
    username: 'miki',
    password: 'plutoonium',
    token: 'mock-token-123',
    accounts: [
      {
        number: '61c123456789',
        balance: 1000,
        currency: 'EUR'
      }
    ]
  }
];

// Mock transactions
const mockTransactions = [];

// Login endpoint
router.post('/sessions', (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = mockUsers.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Return 201 for test compatibility
  return res.status(201).json({
    token: user.token,
    user: {
      username: user.username
    }
  });
});

// Get user info
router.get('/users/current', (req, res) => {
  // Check authorization
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Find user by token
  const user = mockUsers.find(u => u.token === token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Return user info
  return res.status(200).json({
    username: user.username,
    accounts: user.accounts
  });
});

// Get transactions
router.get('/transactions', (req, res) => {
  // Check authorization
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Find user by token
  const user = mockUsers.find(u => u.token === token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Return transactions
  return res.status(200).json(mockTransactions);
});

// Create transaction
router.post('/transactions', (req, res) => {
  // Check authorization
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  // Find user by token
  const user = mockUsers.find(u => u.token === token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Validate accountTo - reference bank only accepts existing account numbers
  const { accountTo } = req.body;

  if (!accountTo) {
    return res.status(400).json({
      error: "Missing accountTo"
    });
  }

  // Reference bank only accepts account numbers that exist in their system
  const validAccount = user.accounts.find(acc => acc.number === accountTo);

  if (!validAccount) {
    return res.status(400).json({
      error: "Invalid accountTo"
    });
  }

  // Create transaction
  const transaction = {
    ...req.body,
    id: Date.now().toString(),
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  // Add to mock transactions
  mockTransactions.push(transaction);

  // Return transaction
  return res.status(200).json(transaction);
});

module.exports = router;
