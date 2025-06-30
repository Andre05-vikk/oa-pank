require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');

const { registerWithCentralBank, validateBankRegistration } = require('./config/central-banks.config');
const { initializeDatabase } = require('./config/database');

const { processTransactionQueue } = require('./services/transaction-processor');
const { initializeBankSync } = require('./services/bank-sync');



// Import routes
const sessionsRoutes = require('./routes/sessions.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const incomingTransactionRoutes = require('./routes/incoming-transaction.routes');
const jwksRoutes = require('./routes/jwks.routes');
const statusRoutes = require('./routes/status.routes');
const referenceBankMock = require('./services/reference-bank-mock');

// Create Express app
const app = express();
// Set base path for serving through Nginx with prefix
app.use(function (req, _, next) {
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
app.get('/', (_, res) => {
  // Redirect to Swagger docs based on environment
  res.redirect(swaggerBasePath);
});

// Swagger UI setup
const swaggerDocument = YAML.load(fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'));

// Set base path for Swagger based on environment
const isProduction = process.env.NODE_ENV === 'production';
const swaggerBasePath = isProduction ? '/oa-pank/docs' : '/docs';

// Prepare Swagger document based on environment
let swaggerDocToUse = JSON.parse(JSON.stringify(swaggerDocument));

// Set the current server based on environment
const port = process.env.PORT || 3000;
const currentUrl = isProduction ? 'https://hack2you.eu/oa-pank' : `http://localhost:${port}`;

// Update servers list to put the current environment first
if (swaggerDocToUse.servers && swaggerDocToUse.servers.length > 0) {
  // Find the matching server or create a new one
  const currentServerIndex = swaggerDocToUse.servers.findIndex(server => server.url === currentUrl);

  if (currentServerIndex >= 0) {
    // If server exists, move it to the first position
    const currentServer = swaggerDocToUse.servers.splice(currentServerIndex, 1)[0];
    currentServer.description = isProduction ? 'Production server (current)' : `Development server (port ${port}) (current)`;
    swaggerDocToUse.servers.unshift(currentServer);
  } else {
    // If server doesn't exist, add it as the first one
    swaggerDocToUse.servers.unshift({
      url: currentUrl,
      description: isProduction ? 'Production server (current)' : `Development server (port ${port}) (current)`
    });
  }
}

// Remove /oa-pank prefix from paths in development
if (!isProduction && swaggerDocToUse.paths) {
  const newPaths = {};
  Object.keys(swaggerDocToUse.paths).forEach(path => {
    const newPath = path.replace('/oa-pank', '');
    newPaths[newPath] = swaggerDocToUse.paths[path];
  });
  swaggerDocToUse.paths = newPaths;
}

// Setup Swagger UI with cache disabled
app.use(swaggerBasePath, swaggerUi.serve, swaggerUi.setup(swaggerDocToUse, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    docExpansion: 'list',
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));
app.use(swaggerBasePath, express.static('node_modules/swagger-ui-dist'));




// Routes
// Set route prefixes based on environment
// In production, routes will be prefixed with '/oa-pank'
// In development, routes will have no prefix
const routePrefix = isProduction ? '/oa-pank' : '';

app.use(`${routePrefix}/sessions`, sessionsRoutes);
app.use(`${routePrefix}/users`, userRoutes);
app.use(`${routePrefix}/accounts`, accountRoutes);
app.use(`${routePrefix}/transactions`, transactionRoutes);
app.use(`${routePrefix}/incoming-transactions`, incomingTransactionRoutes);
app.use(`${routePrefix}/status`, statusRoutes);

// Add routes for b2b transactions that redirect to the incoming-transactions endpoint
// These are needed for central bank registration
app.use(`${routePrefix}/transactions/b2b`, incomingTransactionRoutes);
app.use(`${routePrefix}/docs/transactions/b2b`, incomingTransactionRoutes);
app.use(`${routePrefix}/.well-known`, jwksRoutes);
app.use(`${routePrefix}/docs/.well-known`, jwksRoutes);

// Add mock for reference bank API for testing
// This is needed for the reference bank test to pass
app.use('/henno-pank', referenceBankMock);

// Create necessary directories
const dirs = ['keys', 'logs', 'data'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Global variable to store bank prefix from central bank
// Initialize with null - will be set properly after central bank registration
global.BANK_PREFIX = null;

// Initialize application
const initializeApp = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Register with central bank in all environments
    try {
      const centralBankData = await registerWithCentralBank();
      console.log('Successfully registered with Central Bank');

      // Validate registration status with central bank
      try {
        const validatedData = await validateBankRegistration();
        console.log('Bank registration validated with Central Bank');
        
        // Update global bank prefix if available from central bank
        if (validatedData && validatedData.bankPrefix) {
          global.BANK_PREFIX = validatedData.bankPrefix;
          console.log(`Using validated bank prefix from central bank: ${global.BANK_PREFIX}`);
          
          // Store the bank prefix in a persistent location for future use
          process.env.LAST_CENTRAL_BANK_PREFIX = global.BANK_PREFIX;
        }
      } catch (validationError) {
        console.warn('Bank registration validation failed:', validationError.message);
        
        // Still use the data from registration if validation fails
        if (centralBankData && centralBankData.bankPrefix) {
          global.BANK_PREFIX = centralBankData.bankPrefix;
          console.log(`Using bank prefix from registration (validation failed): ${global.BANK_PREFIX}`);
          
          // Store the bank prefix in a persistent location for future use
          process.env.LAST_CENTRAL_BANK_PREFIX = global.BANK_PREFIX;
        }
        
        // In production, consider this a critical error if we can't validate
        if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_BANK_VALIDATION === 'true') {
          console.error('Exiting application due to failure to validate bank registration with Central Bank');
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Failed to register with Central Bank:', error.message);
      
      // Try to validate existing registration if registration fails
      try {
        const validatedData = await validateBankRegistration();
        console.log('Bank registration validated with Central Bank (registration failed but validation succeeded)');
        
        if (validatedData && validatedData.bankPrefix) {
          global.BANK_PREFIX = validatedData.bankPrefix;
          console.log(`Using validated bank prefix from central bank: ${global.BANK_PREFIX}`);
          
          // Store the bank prefix in a persistent location for future use
          process.env.LAST_CENTRAL_BANK_PREFIX = global.BANK_PREFIX;
        }
      } catch (validationError) {
        console.error('Both registration and validation failed:', validationError.message);
        
        // Use the last known prefix from central bank if available
        if (process.env.LAST_CENTRAL_BANK_PREFIX) {
          global.BANK_PREFIX = process.env.LAST_CENTRAL_BANK_PREFIX;
          console.log(`Using last known central bank prefix: ${global.BANK_PREFIX}`);
        } else {
          // Only as a last resort, use environment variable or default
          global.BANK_PREFIX = process.env.BANK_PREFIX || '313'; // Default to our known bank prefix from central bank
          console.log(`No previous central bank prefix available. Using fallback: ${global.BANK_PREFIX}`);
        }
        
        // In production, we might want to exit if we can't register or validate
        if (process.env.NODE_ENV === 'production' && process.env.REQUIRE_CENTRAL_BANK === 'true') {
          console.error('Exiting application due to failure to register with Central Bank');
          process.exit(1);
        } else {
          console.warn('Continuing without Central Bank registration/validation. This is not recommended for production.');
        }
      }
    }

    // Start transaction processor
    // Process any pending transactions in the queue
    processTransactionQueue();
    console.log('Transaction processor started');

    // Initialize bank synchronization
    // This will update bank data from Central Bank every 5 minutes
    initializeBankSync();
    console.log('Bank synchronization initialized');

    // Start server
    const startServer = () => {
      const PORT = process.env.PORT || 3001;
      const HOST = process.env.HOST || '0.0.0.0';

      app.listen(PORT, HOST, () => {
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
        console.error('Server error:', err);
        process.exit(1);
      });
    };

    startServer();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};


// TEST-ONLY: Endpoint to clear the in-memory token blacklist
// TEST-ONLY: Endpoint to get the current blacklist status
if (process.env.NODE_ENV === 'test' || process.env.CLEAR_BLACKLIST_ENDPOINT === 'true') {
  const { clearBlacklist, isTokenBlacklisted } = require('./utils/token-blacklist');
  // Existing clear-blacklist endpoint
  app.post('/test/clear-blacklist', (req, res) => {
    clearBlacklist();
    console.log('[DEBUG] Token blacklist cleared via /test/clear-blacklist');
    res.status(200).json({ success: true, message: 'Token blacklist cleared' });
  });
  // New blacklist-status endpoint
  app.get('/test/blacklist-status', (req, res) => {
    // Expose the current blacklist for debugging
    const { getBlacklistContents } = require('./utils/token-blacklist');
    const contents = getBlacklistContents();
    console.log('[DEBUG] Blacklist status requested:', contents);
    res.status(200).json({ blacklist: contents });
  });
}

// Import error handler
const { errorHandler, sendProblemResponse } = require('./utils/error-handler');

// Add 404 handler for routes that don't exist
app.use((req, res) => {
  sendProblemResponse(res, {
    status: 404,
    type: 'https://example.com/not-found',
    title: 'Not Found',
    detail: `Cannot ${req.method} ${req.path}`,
    instance: req.originalUrl
  });
});

// Use RFC 7807/9457 compliant error handler
app.use(errorHandler);

// Initialize the application
initializeApp();
