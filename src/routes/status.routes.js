/**
 * Status Routes
 * Provides system status and health check endpoints
 */

const express = require('express');
const { validateBankRegistration } = require('../config/central-banks.config');
const { validateOwnBankRegistration } = require('../services/bank-sync');
const { sendProblemResponse } = require('../utils/error-handler');

const router = express.Router();

/**
 * @swagger
 * /status/registration:
 *   get:
 *     summary: Check bank registration status with central bank
 *     description: Validates that the bank is still registered and active with the central bank
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: Bank registration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [valid, invalid]
 *                 bankPrefix:
 *                   type: string
 *                 name:
 *                   type: string
 *                 lastValidated:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   description: Error message if validation failed
 *       500:
 *         description: Server error
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 */
router.get('/registration', async (req, res) => {
  try {
    const validationResult = await validateOwnBankRegistration();
    
    if (validationResult.success) {
      res.json({
        status: 'valid',
        bankPrefix: validationResult.data.bankPrefix,
        name: validationResult.data.name,
        lastValidated: validationResult.timestamp
      });
    } else {
      res.status(200).json({
        status: 'invalid',
        error: validationResult.error,
        lastValidated: validationResult.timestamp
      });
    }
  } catch (error) {
    console.error('Error checking registration status:', error);
    sendProblemResponse(res, {
      status: 500,
      type: 'https://example.com/internal-server-error',
      title: 'Internal Server Error',
      detail: 'Failed to check registration status',
      instance: req.originalUrl
    });
  }
});

/**
 * @swagger
 * /status/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns basic health status of the bank system
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 bankPrefix:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [ok, error]
 *                     centralBank:
 *                       type: string
 *                       enum: [ok, error, unknown]
 */
router.get('/health', async (req, res) => {
  try {
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bankPrefix: global.BANK_PREFIX,
      services: {
        database: 'ok',
        centralBank: 'unknown'
      }
    };

    // Quick validation check (don't retry on failure to keep health check fast)
    try {
      await validateBankRegistration(1, 500); // 1 retry, 500ms delay
      status.services.centralBank = 'ok';
    } catch (error) {
      status.services.centralBank = 'error';
      status.status = 'degraded';
    }

    res.json(status);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

module.exports = router;
