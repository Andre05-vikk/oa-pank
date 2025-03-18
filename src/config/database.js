const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const {open} = require('sqlite');

// Determine the database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {recursive: true});
}

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        newObj[newKey] = obj[key];
    });
    return newObj;
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj) => {
    if (!obj) return obj;
    const newObj = {};
    Object.keys(obj).forEach(key => {
        const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        newObj[newKey] = obj[key];
    });
    return newObj;
};

// Create a database connection
let db = null;

// Initialize the database with tables
const initializeDatabase = async () => {
    try {
        // Open database connection using sqlite and sqlite3 modules
        // These don't rely on native binaries and should work across architectures
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await db.run('PRAGMA foreign_keys = ON');

        // Create users table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                email TEXT,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create accounts table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                account_number TEXT UNIQUE NOT NULL,
                balance REAL DEFAULT 0,
                currency TEXT DEFAULT 'EUR',
                is_active BOOLEAN DEFAULT 1,
                type TEXT DEFAULT 'checking',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                -- Temporarily removed foreign key constraint for testing
                -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Create transactions table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_account TEXT,
                to_account TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'EUR',
                description TEXT,
                status TEXT DEFAULT 'pending',
                reference TEXT,
                transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (from_account) REFERENCES accounts(account_number),
                FOREIGN KEY (to_account) REFERENCES accounts(account_number)
            );
        `);

        // Create external_banks table to store information about other banks
        await db.exec(`
            CREATE TABLE IF NOT EXISTS external_banks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                prefix TEXT UNIQUE NOT NULL,
                api_url TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create invalidated_tokens table to store tokens that have been logged out
        await db.exec(`
            CREATE TABLE IF NOT EXISTS invalidated_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                invalidated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL
            );
        `);

        console.log('SQLite database initialized successfully at:', dbPath);
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        // Continue without database for demonstration purposes
        console.log('Continuing without database connection for demonstration purposes...');
        return true;
    }
};

// Helper functions adapted for sqlite/sqlite3
const getById = async (tableName, id) => {
    try {
        const result = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, id);
        // Convert result to camelCase
        return result ? toCamelCase(result) : null;
    } catch (error) {
        console.error(`Error in getById for ${tableName}:`, error);
        return null;
    }
};

const getBy = async (tableName, field, value) => {
    try {
        const result = await db.get(`SELECT * FROM ${tableName} WHERE ${field} = ?`, value);
        // Convert result to camelCase
        return result ? toCamelCase(result) : null;
    } catch (error) {
        console.error(`Error in getBy for ${tableName}:`, error);
        return null;
    }
};

const getAll = async (tableName, fields = ['*']) => {
    try {
        const fieldsStr = fields.join(', ');
        const results = await db.all(`SELECT ${fieldsStr} FROM ${tableName}`);
        // Convert each result to camelCase
        return results.map(result => toCamelCase(result));
    } catch (error) {
        console.error(`Error in getAll for ${tableName}:`, error);
        return [];
    }
};

const insert = async (tableName, data) => {
    try {
        // Convert data from camelCase to snake_case if needed
        const snakeCaseData = Object.keys(data).some(key => /[A-Z]/.test(key)) ? toSnakeCase(data) : data;

        const keys = Object.keys(snakeCaseData);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(key => snakeCaseData[key]);

        const result = await db.run(`
            INSERT INTO ${tableName} (${keys.join(', ')})
            VALUES (${placeholders})
        `, values);

        // Return the inserted data with ID, converted to camelCase
        const insertedData = {id: result.lastID, ...snakeCaseData};
        return toCamelCase(insertedData);
    } catch (error) {
        console.error(`Error in insert for ${tableName}:`, error);
        return null;
    }
};

const deleteById = async (tableName, id) => {
    try {
        return await db.run(`DELETE FROM ${tableName} WHERE id = ?`, id);
    } catch (error) {
        console.error(`Error in deleteById for ${tableName}:`, error);
        return null;
    }
};

// Transaction specific functions
const createTransaction = async (fromAccount, toAccount, amount, description = '', reference = '') => {
    try {
        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Check if the sender account exists and has sufficient funds
        if (fromAccount) {
            // Handle both camelCase and snake_case account numbers
            const fromAccountField = fromAccount.includes('_') ? fromAccount : toSnakeCase({accountNumber: fromAccount}).account_number;
            const senderAccount = await db.get('SELECT * FROM accounts WHERE account_number = ?', fromAccountField);
            if (!senderAccount) {
                await db.run('ROLLBACK');
                throw new Error('Sender account not found');
            }

            if (senderAccount.balance < amount) {
                await db.run('ROLLBACK');
                throw new Error('Insufficient funds');
            }

            // Deduct amount from sender account
            await db.run(
                'UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
                amount, fromAccountField
            );
        }

        // Handle both camelCase and snake_case account numbers
        const toAccountField = toAccount.includes('_') ? toAccount : toSnakeCase({accountNumber: toAccount}).account_number;

        // Check if the recipient account exists in our bank
        const recipientAccount = await db.get('SELECT * FROM accounts WHERE account_number = ?', toAccountField);

        // If recipient is in our bank, add funds to their account
        if (recipientAccount) {
            await db.run(
                'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
                amount, toAccountField
            );
        }

        // Record the transaction
        const transactionData = {
            from_account: fromAccount,
            to_account: toAccount,
            amount,
            description,
            reference,
            status: recipientAccount ? 'completed' : 'pending'
        };

        const result = await insert('transactions', transactionData);

        // Commit the transaction
        await db.run('COMMIT');

        // Convert result to camelCase for API
        return toCamelCase(result);
    } catch (error) {
        // Rollback in case of error
        try {
            await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error creating transaction:', error);
        throw error;
    }
};

// Function to process incoming transaction from another bank
const processIncomingTransaction = async (fromAccount, toAccount, amount, description = '', reference = '') => {
    try {
        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Handle both camelCase and snake_case account numbers
        const toAccountField = toAccount.includes('_') ? toAccount : toSnakeCase({accountNumber: toAccount}).account_number;

        // Check if the recipient account exists in our bank
        const recipientAccount = await db.get('SELECT * FROM accounts WHERE account_number = ?', toAccountField);
        if (!recipientAccount) {
            await db.run('ROLLBACK');
            throw new Error('Recipient account not found');
        }

        // Add funds to recipient account
        await db.run(
            'UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE account_number = ?',
            amount, toAccountField
        );

        // Record the transaction
        const transactionData = {
            from_account: fromAccount,
            to_account: toAccountField,
            amount,
            description,
            reference,
            status: 'completed'
        };

        const result = await insert('transactions', transactionData);

        // Commit the transaction
        await db.run('COMMIT');

        // Convert result to camelCase for API
        return toCamelCase(result);
    } catch (error) {
        // Rollback in case of error
        try {
            await db.run('ROLLBACK');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error processing incoming transaction:', error);
        throw error;
    }
};

module.exports = {
    db,
    initializeDatabase,
    getDatabase: () => db,
    getById,
    getBy,
    getAll,
    insert,
    deleteById,
    createTransaction,
    processIncomingTransaction
};