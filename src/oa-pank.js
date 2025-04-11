require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { registerWithCentralBank } = require('./config/central-banks.config');
const { initializeDatabase, getBy, insert } = require('./config/database');
const { Account } = require('./models/account.model');

// Import middleware
const { authenticate } = require('./middleware/auth.middleware');

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
app.use(function (req, res, next) {
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

// Setup Swagger UI
app.use(swaggerBasePath, swaggerUi.serve, swaggerUi.setup(swaggerDocToUse));
app.use(swaggerBasePath, express.static('node_modules/swagger-ui-dist'));


// Custom error types
class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 422; // Unprocessable Entity
    this.errors = errors;
    this.errorCode = 'validation_error';
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401; // Unauthorized
    this.errorCode = 'authentication_error';
  }
}

class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403; // Forbidden
    this.errorCode = 'authorization_error';
  }
}

// Additional error types
class DatabaseError extends Error {
  constructor(message, query) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.query = query;
    this.errorCode = 'database_error';
  }
}

class NetworkError extends Error {
  constructor(message, endpoint) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = 502; // Bad Gateway
    this.endpoint = endpoint;
    this.errorCode = 'network_error';
  }
}

class TimeoutError extends Error {
  constructor(message, endpoint) {
    super(message);
    this.name = 'TimeoutError';
    this.statusCode = 504; // Gateway Timeout
    this.endpoint = endpoint;
    this.errorCode = 'timeout_error';
  }
}

class JwtError extends Error {
  constructor(message) {
    super(message);
    this.name = 'JwtError';
    this.statusCode = 401; // Unauthorized
    this.errorCode = 'jwt_error';
  }
}

class ResourceNotFoundError extends Error {
  constructor(message, resource) {
    super(message);
    this.name = 'ResourceNotFoundError';
    this.statusCode = 404; // Not Found
    this.resource = resource;
    this.errorCode = 'resource_not_found';
  }
}

class BusinessLogicError extends Error {
  constructor(message, code = 'business_logic_error') {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = 422; // Unprocessable Entity
    this.errorCode = code;
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

      // Update global bank prefix if available from central bank
      if (centralBankData && centralBankData.bankPrefix) {
        global.BANK_PREFIX = centralBankData.bankPrefix;
        console.log(`Using bank prefix from central bank: ${global.BANK_PREFIX}`);

        // Store the bank prefix in a persistent location for future use
        process.env.LAST_CENTRAL_BANK_PREFIX = global.BANK_PREFIX;
      } else {
        console.log(`Central bank did not provide a prefix. Using last known prefix if available.`);
      }
    } catch (error) {
      console.error('Failed to register with Central Bank:', error.message);
      // Use the last known prefix from central bank if available
      if (process.env.LAST_CENTRAL_BANK_PREFIX) {
        global.BANK_PREFIX = process.env.LAST_CENTRAL_BANK_PREFIX;
        console.log(`Using last known central bank prefix: ${global.BANK_PREFIX}`);
      } else {
        // Only as a last resort, use environment variable or default
        global.BANK_PREFIX = process.env.BANK_PREFIX || '313'; // Default to our known bank prefix from central bank
        console.log(`No previous central bank prefix available. Using fallback: ${global.BANK_PREFIX}`);
      }
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
  console.error('Error:', err);

  // Log additional details for debugging
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }

  if (req.method && req.originalUrl) {
    console.error(`Request: ${req.method} ${req.originalUrl}`);
  }

  // Handle custom error types
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode,
      errors: err.errors
    });
  }

  if (err instanceof AuthenticationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode
    });
  }

  if (err instanceof DatabaseError) {
    // Log database errors with more details but don't expose query to client
    console.error('Database error:', err.message);
    if (err.query) {
      console.error('Query:', err.query);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: 'Database operation failed',
      error: err.errorCode
    });
  }

  if (err instanceof NetworkError) {
    console.error('Network error:', err.message);
    if (err.endpoint) {
      console.error('Endpoint:', err.endpoint);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: 'Failed to communicate with external service',
      error: err.errorCode
    });
  }

  if (err instanceof TimeoutError) {
    console.error('Timeout error:', err.message);
    if (err.endpoint) {
      console.error('Endpoint:', err.endpoint);
    }

    return res.status(err.statusCode).json({
      success: false,
      message: 'Request to external service timed out',
      error: err.errorCode
    });
  }

  if (err instanceof JwtError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode
    });
  }

  if (err instanceof ResourceNotFoundError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode,
      resource: err.resource
    });
  }

  if (err instanceof BusinessLogicError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode
    });
  }

  // Handle SQLite errors
  if (err.code && err.code.startsWith('SQLITE_')) {
    console.error('SQLite error:', err.code);
    let statusCode = 500;
    let message = 'Database operation failed';

    // Map specific SQLite errors to appropriate HTTP status codes
    if (err.code === 'SQLITE_CONSTRAINT') {
      statusCode = 409; // Conflict
      message = 'Database constraint violation';
    } else if (err.code === 'SQLITE_NOTFOUND') {
      statusCode = 404; // Not Found
      message = 'Resource not found';
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error: 'database_error',
      code: err.code
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: 'jwt_error',
      details: err.message
    });
  }

  // Handle network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
    return res.status(502).json({
      success: false,
      message: 'Failed to communicate with external service',
      error: 'network_error',
      code: err.code
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'server_error'
  });
});

// Initialize the application
initializeApp();
