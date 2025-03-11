const { Sequelize } = require('sequelize');

// Create a Sequelize instance for MariaDB connection
const sequelize = new Sequelize({
  dialect: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'oa_pank',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Equivalent to timestamps in Mongoose
    underscored: true, // Use snake_case for fields
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('MariaDB connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the MariaDB database:', error);
    console.log('Continuing without database connection for demonstration purposes...');
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};