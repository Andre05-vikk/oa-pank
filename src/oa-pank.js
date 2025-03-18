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

// Import routes
const sessionsRoutes = require('./routes/sessions.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const incomingTransactionRoutes = require('./routes/incoming-transaction.routes');
const jwksRoutes = require('./routes/jwks.routes');

// Create Express app
const app = express();

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
app.put('/currencies', authenticate, async (req, res) => {
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

// PATCH update specific currency rate (admin only)
app.patch('/currencies/:code', authenticate, async (req, res) => {
  try {
    // Check if the user is an administrator
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update currency rates'
      });
    }
    
    const { code } = req.params;
    const { rate } = req.body;
    
    if (!rate || isNaN(parseInt(rate))) {
      return res.status(400).json({
        success: false,
        message: 'Rate must be a valid number'
      });
    }
    
    // Check if currency exists
    const { rates } = getCurrencyRates();
    if (!rates[code]) {
      return res.status(404).json({
        success: false,
        message: `Currency ${code} not found`
      });
    }
    
    // Update specific currency rate
    const { updateSpecificCurrencyRate } = require('./config/currency.config');
    const updated = await updateSpecificCurrencyRate(code, parseInt(rate));
    
    if (updated) {
      res.json({
        success: true,
        message: `Currency rate for ${code} updated successfully`,
        code,
        rate: parseInt(rate),
        displayRate: code === 'EUR' ? 1 : (parseInt(rate) / 100).toFixed(2)
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to update currency rate for ${code}`
      });
    }
  } catch (error) {
    console.error('Error updating currency rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update currency rate',
      error: error.message
    });
  }
});

// Legacy endpoints for backward compatibility
app.get('/currency-rates', (req, res) => {
  res.redirect(301, '/currencies');
});

app.post('/admin/currency-rates/update', authenticate, (req, res) => {
  res.redirect(307, '/currencies');
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

// Swagger configuration
const swaggerYaml = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
const swaggerDocument = YAML.load(swaggerYaml);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    urls: [
      {
        url: '/swagger.yaml',
        name: 'OA-Pank API'
      }
    ],
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showCommonExtensions: true,
    syntaxHighlight: {
      activated: true,
      theme: 'monokai'
    }
  }
};

// Serve swagger.yaml directly
app.get('/swagger.yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(swaggerYaml);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Routes
app.use('/sessions', sessionsRoutes);
app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/api/incoming-transactions', incomingTransactionRoutes);
app.use('/.well-known', jwksRoutes);

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
      // Using ports in range 3000-3010
      const initialPort = 3000;
      const maxPort = 3010;
      const PORT = parseInt(port || process.env.PORT || initialPort, 10);
      
      // Check that port is in the allowed range
      if (PORT < initialPort || PORT > maxPort) {
        console.error(`Port ${PORT} is not in the allowed range ${initialPort}-${maxPort}. Using default port ${initialPort}.`);
        return startServer(initialPort);
      }
      
      const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
      
      const server = app.listen(PORT, HOST, () => {
        console.log(`${process.env.BANK_NAME || 'OA-Pank'} server running on ${HOST}:${PORT}`);
        if (process.env.NODE_ENV === 'development') {
          console.log(`API documentation available at http://${HOST}:${PORT}/docs`);
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