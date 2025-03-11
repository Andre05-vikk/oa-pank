const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Account extends Model {
  // Method to return account data in a formatted way
  toJSON() {
    const values = Object.assign({}, this.get());
    values.balance = parseFloat(values.balance.toFixed(2)); // Format balance to 2 decimal places
    return values;
  }

  // Static method to generate a unique account number
  static async generateAccountNumber(bankPrefix) {
    // Generate a random 8-digit number
    const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // Combine bank prefix with random number
    const accountNumber = `${bankPrefix}${randomPart}`;
    
    // Check if account number already exists
    const existingAccount = await this.findOne({ where: { accountNumber } });
    
    // If account number exists, generate a new one recursively
    if (existingAccount) {
      return this.generateAccountNumber(bankPrefix);
    }
    
    return accountNumber;
  }
}

Account.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  balance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Balance cannot be negative' }
    }
  },
  currency: {
    type: DataTypes.ENUM('EUR', 'USD', 'GBP'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  type: {
    type: DataTypes.ENUM('checking', 'savings', 'investment'),
    allowNull: false,
    defaultValue: 'checking'
  }
}, {
  sequelize,
  modelName: 'Account',
  tableName: 'accounts',
  timestamps: true
});

module.exports = Account;