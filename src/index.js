require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const fs = require('fs');
const path = require('path');

// Import routes
const sessionsRoutes = require('./routes/sessions.routes');
const userRoutes = require('./routes/user.routes');
const accountRoutes = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');
const jwksRoutes = require('./routes/jwks.routes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger configuration
const YAML = require('js-yaml');
const swaggerYaml = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
const swaggerDocument = YAML.load(swaggerYaml);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/sessions', sessionsRoutes);
app.use('/users', userRoutes);
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);
app.use('/.well-known', jwksRoutes);

// Create keys directory if it doesn't exist
const keysDir = path.join(__dirname, '..', 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Import database connection
const { sequelize, testConnection } = require('./config/database');

// Test database connection and sync models
testConnection()
  .then(async (connected) => {
    try {
      // Only sync models if database connection was successful
      if (connected) {
        await sequelize.sync({ alter: true });
        console.log('Database models synchronized');
      }
      
      // Start server
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`${process.env.BANK_NAME} server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to sync database models:', error);
      process.exit(1);
    }
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});