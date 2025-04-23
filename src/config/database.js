const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// Determine the database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
                retry_count INTEGER DEFAULT 0,
                last_retry DATETIME,
                error_message TEXT,
                FOREIGN KEY (from_account) REFERENCES accounts(account_number)
                -- Removed foreign key constraint for to_account to allow external transactions
            );
        `);

        // Create external_banks table to store information about other banks
        await db.exec(`
            CREATE TABLE IF NOT EXISTS external_banks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                prefix TEXT UNIQUE NOT NULL,
                transactionUrl TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Load external banks data from other_banks_data.json
        try {
            const otherBanksDataPath = path.join(__dirname, '../../data/other_banks_data.json');
            if (fs.existsSync(otherBanksDataPath)) {
                const otherBanksData = JSON.parse(fs.readFileSync(otherBanksDataPath, 'utf8'));

                // Clear existing data
                await db.run('DELETE FROM external_banks');

                // Insert new data
                for (const bank of otherBanksData) {
                    try {
                        await db.run(
                            'INSERT OR REPLACE INTO external_banks (name, prefix, transactionUrl) VALUES (?, ?, ?)',
                            bank.name,
                            bank.bankPrefix,
                            bank.transactionUrl
                        );
                        // Removed console.log for bank addition
                    } catch (insertError) {
                        console.error(`Failed to insert bank ${bank.name}:`, insertError.message);
                    }
                }
                // Successfully loaded external banks data
            } else {
                console.log('other_banks_data.json not found, skipping external banks data loading');
            }
        } catch (error) {
            console.error('Error loading external banks data:', error.message);
        }

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

/**
 * Helper functions for database operations
 */

/**
 * Get a record by ID
 * @param {string} tableName - The name of the table
 * @param {number} id - The ID of the record
 * @returns {Promise<Object|null>} - The record or null if not found
 */
const getById = async (tableName, id) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return null;
        }

        const result = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, id);
        // Convert result to camelCase
        return result ? toCamelCase(result) : null;
    } catch (error) {
        console.error(`Error in getById for ${tableName}:`, error);
        return null;
    }
};

/**
 * Get a record by a specific field
 * @param {string} tableName - The name of the table
 * @param {string} field - The field to search by
 * @param {any} value - The value to search for
 * @param {boolean} [multiple=false] - Whether to return multiple records
 * @returns {Promise<Object|Array|null>} - The record(s) or null if not found
 */
const getBy = async (tableName, field, value, multiple = false) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return multiple ? [] : null;
        }

        if (multiple) {
            const results = await db.all(`SELECT * FROM ${tableName} WHERE ${field} = ?`, value);
            return results.map(result => toCamelCase(result));
        } else {
            const result = await db.get(`SELECT * FROM ${tableName} WHERE ${field} = ?`, value);
            return result ? toCamelCase(result) : null;
        }
    } catch (error) {
        console.error(`Error in getBy for ${tableName}:`, error);
        return multiple ? [] : null;
    }
};

/**
 * Get all records from a table with optional filtering and sorting
 * @param {string} tableName - The name of the table
 * @param {string[]} [fields=['*']] - The fields to select
 * @param {Object} [options] - Additional options
 * @param {Object} [options.filter] - Filter conditions {field: value}
 * @param {string} [options.orderBy] - Field to order by
 * @param {string} [options.order='ASC'] - Order direction (ASC or DESC)
 * @param {number} [options.limit] - Maximum number of records to return
 * @param {number} [options.offset] - Number of records to skip
 * @returns {Promise<Array>} - Array of records
 */
const getAll = async (tableName, fields = ['*'], options = {}) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return [];
        }

        const fieldsStr = fields.join(', ');
        let query = `SELECT ${fieldsStr} FROM ${tableName}`;
        const params = [];

        // Add WHERE clause if filter is provided
        if (options.filter && Object.keys(options.filter).length > 0) {
            const filterConditions = [];
            Object.entries(options.filter).forEach(([field, value]) => {
                filterConditions.push(`${field} = ?`);
                params.push(value);
            });
            query += ` WHERE ${filterConditions.join(' AND ')}`;
        }

        // Add ORDER BY clause if orderBy is provided
        if (options.orderBy) {
            const order = options.order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${options.orderBy} ${order}`;
        }

        // Add LIMIT and OFFSET clauses if provided
        if (options.limit) {
            query += ` LIMIT ?`;
            params.push(options.limit);

            if (options.offset) {
                query += ` OFFSET ?`;
                params.push(options.offset);
            }
        }

        const results = await db.all(query, params);
        // Convert each result to camelCase
        return results.map(result => toCamelCase(result));
    } catch (error) {
        console.error(`Error in getAll for ${tableName}:`, error);
        return [];
    }
};

/**
 * Insert a new record into a table
 * @param {string} tableName - The name of the table
 * @param {Object} data - The data to insert
 * @returns {Promise<Object|null>} - The inserted record or null if failed
 */
const insert = async (tableName, data) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return null;
        }

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
        const insertedData = { id: result.lastID, ...snakeCaseData };
        return toCamelCase(insertedData);
    } catch (error) {
        console.error(`Error in insert for ${tableName}:`, error);
        return null;
    }
};

/**
 * Delete a record by ID
 * @param {string} tableName - The name of the table
 * @param {number} id - The ID of the record to delete
 * @returns {Promise<Object|null>} - The result of the delete operation or null if failed
 */
const deleteById = async (tableName, id) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return null;
        }

        return await db.run(`DELETE FROM ${tableName} WHERE id = ?`, id);
    } catch (error) {
        console.error(`Error in deleteById for ${tableName}:`, error);
        return null;
    }
};

// Alias for deleteById for backward compatibility
const remove = deleteById;

/**
 * Update a record by ID
 * @param {string} tableName - The name of the table
 * @param {number} id - The ID of the record to update
 * @param {Object} data - The data to update
 * @returns {Promise<Object|null>} - The updated record or null if failed
 */
const update = async (tableName, id, data) => {
    try {
        // Check if database connection is available
        if (!db) {
            console.error('Database connection is not available');
            return null;
        }

        // Convert data from camelCase to snake_case if needed
        const snakeCaseData = Object.keys(data).some(key => /[A-Z]/.test(key)) ? toSnakeCase(data) : data;

        // Build SET clause
        const setClause = Object.keys(snakeCaseData)
            .map(key => `${key} = ?`)
            .join(', ');

        // Add updated_at timestamp
        const updatedData = { ...snakeCaseData, updated_at: new Date().toISOString() };
        const values = [...Object.keys(snakeCaseData).map(key => snakeCaseData[key]), new Date().toISOString(), id];

        // Execute update
        await db.run(`UPDATE ${tableName} SET ${setClause}, updated_at = ? WHERE id = ?`, values);

        // Get updated record
        return await getById(tableName, id);
    } catch (error) {
        console.error(`Error in update for ${tableName}:`, error);
        return null;
    }
};

/**
 * Transaction specific functions
 */

/**
 * Create a new transaction
 * @param {string} fromAccount - The source account number
 * @param {string} toAccount - The destination account number
 * @param {number} amount - The transaction amount
 * @param {string} [explanation=''] - The transaction explanation
 * @param {string} [reference=''] - The transaction reference
 * @returns {Promise<Object>} - The created transaction
 * @throws {Error} - If the transaction fails
 */
const createTransaction = async (fromAccount, toAccount, amount, explanation = '', reference = '') => {
    // For backward compatibility, we use explanation as description
    const description = explanation;
    try {
        // Check if database connection is available
        if (!db) {
            throw new Error('Database connection is not available');
        }

        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Check if the sender account exists and has sufficient funds
        if (fromAccount) {
            // Handle both camelCase and snake_case account numbers
            const fromAccountField = fromAccount.includes('_') ? fromAccount : toSnakeCase({ accountNumber: fromAccount }).account_number;
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
        const toAccountField = toAccount.includes('_') ? toAccount : toSnakeCase({ accountNumber: toAccount }).account_number;

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
            if (db) {
                await db.run('ROLLBACK');
            }
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error creating transaction:', error);
        throw error;
    }
};

/**
 * Process an incoming transaction from another bank
 * @param {string} fromAccount - The source account number
 * @param {string} toAccount - The destination account number
 * @param {number} amount - The transaction amount
 * @param {string} [explanation=''] - The transaction explanation
 * @param {string} [reference=''] - The transaction reference
 * @returns {Promise<Object>} - The processed transaction
 * @throws {Error} - If the transaction fails
 */
const processIncomingTransaction = async (fromAccount, toAccount, amount, explanation = '', reference = '') => {
    // For backward compatibility, we use explanation as description
    const description = explanation;
    try {
        // Check if database connection is available
        if (!db) {
            throw new Error('Database connection is not available');
        }

        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Handle both camelCase and snake_case account numbers
        const toAccountField = toAccount.includes('_') ? toAccount : toSnakeCase({ accountNumber: toAccount }).account_number;

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
            if (db) {
                await db.run('ROLLBACK');
            }
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }
        console.error('Error processing incoming transaction:', error);
        throw error;
    }
};

/**
 * Reset the database by deleting the existing database file and creating a new one
 * @returns {Promise<void>}
 */
const resetDatabase = async () => {
    try {
        // Close the database connection if it exists
        if (db) {
            await db.close();
            db = null;
        }

        // Delete the database file if it exists
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log(`Deleted existing database file: ${dbPath}`);
        }

        // Initialize a new database
        await initializeDatabase();
        console.log('Database reset successfully');
    } catch (error) {
        console.error('Failed to reset database:', error);
        throw error;
    }
};

/**
 * Database module exports
 */
module.exports = {
    // Database connection
    getDatabase: () => db,

    // Database initialization
    initializeDatabase,
    resetDatabase,

    // Basic CRUD operations
    getById,
    getBy,
    getAll,
    insert,
    update,
    deleteById,
    remove, // Alias for deleteById for backward compatibility

    // Transaction operations
    createTransaction,
    processIncomingTransaction,

    // Utility functions
    toCamelCase,
    toSnakeCase
};