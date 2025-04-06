require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { registerWithCentralBank } = require('./config/central-banks.config');
const { initializeDatabase } = require('./config/database');
const { Account } = require('./models/account.model');

// Import routes
const sessionsRoutes = require('./routes/sessions.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const incomingTransactionRoutes = require('./routes/incoming-transaction.routes');
const jwksRoutes = require('./routes/jwks.routes');

// Create Express app
const app = express();
// Set base path for serving through Nginx with prefix
app.use(function(req, res, next) {
  if (!req.baseUrl && process.env.NODE_ENV === 'production') {
    app.locals.baseUrl = '/oa-pank';
  }
  next();
});

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://hack2you.eu',
        process.env.PRODUCTION_DOMAIN,    // Allows setting domain from .env file
        process.env.PRODUCTION_IP         // Allows setting IP from .env file
      ].filter(Boolean)  // Removes empty values
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Root route handler
app.get('/', (req, res) => {
  // Redirect to Swagger docs based on environment
  res.redirect(swaggerBasePath);
});

// Swagger UI setup
const swaggerDocument = YAML.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));

// Set base path for Swagger based on environment
const isProduction = process.env.NODE_ENV === 'production';
const swaggerBasePath = isProduction ? '/oa-pank/docs' : '/docs';

// Prepare Swagger document based on environment
let swaggerDocToUse = swaggerDocument;
if (!isProduction) {
  // Remove /oa-pank prefix from paths in development
  swaggerDocToUse = JSON.parse(JSON.stringify(swaggerDocument));
  if (swaggerDocToUse.paths) {
    const newPaths = {};
    Object.keys(swaggerDocToUse.paths).forEach(path => {
      const newPath = path.replace('/oa-pank', '');
      newPaths[newPath] = swaggerDocToUse.paths[path];
    });
    swaggerDocToUse.paths = newPaths;
  }
}

// Setup Swagger UI
app.use(swaggerBasePath, swaggerUi.serve, swaggerUi.setup(swaggerDocToUse));
app.use(swaggerBasePath, express.static('node_modules/swagger-ui-dist'));

// Import currency config
const { getCurrencyRates, updateCurrencyRates } = require('./config/currency.config');

// Import authentication middleware
const { authenticate } = require('./middleware/auth.middleware');

// Currency endpoints - RESTful implementation
// GET all currencies
app.get('/currencies', async (req, res) => {
  try {
    // Use currency.config module to get currency rates
    const currencyData = getCurrencyRates();

    res.json({
      success: true,
      ...currencyData
    });
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency rates',
      error: error.message
    });
  }
});

// GET specific currency
app.get('/currencies/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { rates } = getCurrencyRates();

    if (!rates[code]) {
      return res.status(404).json({
        success: false,
        message: `Currency ${code} not found`
      });
    }

    res.json({
      success: true,
      code,
      rate: rates[code],
      displayRate: code === 'EUR' ? 1 : (rates[code] / 100).toFixed(2)
    });
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch currency rate',
      error: error.message
    });
  }
});

// PUT update all currency rates (admin only)
app.put('/admin/currencies', authenticate, async (req, res) => {
  try {
    // Check if the user is an administrator
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update currency rates'
      });
    }

    // Update all currency rates
    const updated = await updateCurrencyRates();

    if (updated) {
      res.json({
        success: true,
        message: 'Currency rates updated successfully',
        ...getCurrencyRates()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update currency rates'
      });
    }
  } catch (error) {
    console.error('Error updating currency rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency rates',
      error: error.message
    });
  }
});

// DELETE account (admin only)
app.delete('/admin/accounts/:id', authenticate, async (req, res) => {
  try {
    // Check if the user is an administrator
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete accounts'
      });
    }

    const accountId = req.params.id;

    // Get account from database
    const account = await Account.findById(accountId);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Delete the account
    await Account.findByIdAndDelete(accountId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message
    });
  }
});

// Custom error types
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

// Routes
// Set route prefixes based on environment
// In production, routes will be prefixed with '/oa-pank'
// In development, routes will have no prefix
const routePrefix = isProduction ? '/oa-pank' : '';

app.use(`${routePrefix}/sessions`, sessionsRoutes);
app.use(`${routePrefix}/users`, userRoutes);
app.use(`${routePrefix}/accounts`, accountRoutes);
app.use(`${routePrefix}/transactions`, transactionRoutes);
app.use(`${routePrefix}/api/incoming-transactions`, incomingTransactionRoutes);

// Add routes for b2b transactions that redirect to the incoming-transactions endpoint
// These are needed for central bank registration
app.use(`${routePrefix}/transactions/b2b`, incomingTransactionRoutes);
app.use(`${routePrefix}/docs/transactions/b2b`, incomingTransactionRoutes);
app.use(`${routePrefix}/.well-known`, jwksRoutes);
app.use(`${routePrefix}/docs/.well-known`, jwksRoutes);

// Create necessary directories
const dirs = ['keys', 'logs', 'data'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Initialize application
const initializeApp = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Register with central bank in all environments
    try {
      await registerWithCentralBank();
      console.log('Successfully registered with Central Bank');
    } catch (error) {
      console.error('Failed to register with Central Bank:', error.message);
      // In production, we might want to exit if we can't register
      if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_CENTRAL_BANK === 'true') {
        console.error('Exiting application due to failure to register with Central Bank');
        process.exit(1);
      } else {
        console.warn('Continuing without Central Bank registration. This is not recommended for production.');
      }
    }

    // Start server
    const startServer = (port) => {
      // Using ports in range 3001-3010
      const initialPort = parseInt(process.env.PORT) || 3001;
      const maxPort = 3010;
      const PORT = port || initialPort;

      const HOST = '0.0.0.0';

      const server = app.listen(PORT, HOST, () => {
        console.log(`${process.env.BANK_NAME || 'OA-Pank'} server running on ${HOST}:${PORT}`);
        console.log('\nApplication is available at:');

        if (isProduction) {
          console.log(`Production: https://hack2you.eu/oa-pank`);
          console.log(`API documentation: https://hack2you.eu/oa-pank/docs`);
        } else {
          console.log(`Development: http://localhost:${PORT}`);
          console.log(`API documentation: http://localhost:${PORT}/docs`);
        }
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          // If port is already in use, try the next port
          const nextPort = PORT + 1;
          if (nextPort <= maxPort) {
            console.log(`Port ${PORT} is already in use, trying ${nextPort}...`);
            startServer(nextPort);
          } else {
            console.error(`All ports in range ${initialPort}-${maxPort} are already in use. Please free up a port and try again.`);
            process.exit(1);
          }
        } else {
          console.error('Server error:', err);
          process.exit(1);
        }
      });
    };

    startServer();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof ValidationError ||
      err instanceof AuthenticationError ||
      err instanceof AuthorizationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize the application
initializeApp();
