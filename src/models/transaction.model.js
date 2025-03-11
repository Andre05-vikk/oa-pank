const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Transaction extends Model {
  // Method to return transaction data in a formatted way
  toJSON() {
    const values = Object.assign({}, this.get());
    values.amount = parseFloat(values.amount.toFixed(2)); // Format amount to 2 decimal places
    return values;
  }

  // Static method to generate a unique transaction ID
  static async generateTransactionId(bankPrefix) {
    // Generate a timestamp component (current time in milliseconds)
    const timestamp = Date.now().toString();
    
    // Generate a random component (5 digits)
    const randomPart = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Combine bank prefix with timestamp and random part
    const transactionId = `${bankPrefix}-${timestamp}-${randomPart}`;
    
    // Check if transaction ID already exists
    const existingTransaction = await this.findOne({ where: { transactionId } });
    
    // If transaction ID exists, generate a new one recursively
    if (existingTransaction) {
      return this.generateTransactionId(bankPrefix);
    }
    
    return transactionId;
  }
}

Transaction.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  fromAccount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  toAccount: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Amount must be greater than 0' }
    }
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'inProgress', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('internal', 'external'),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  initiatedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  signature: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  senderBank: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  receiverBank: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true
});

module.exports = Transaction;