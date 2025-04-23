/**
 * Script to reset the database
 * This will delete the existing database file and create a new one
 */

const { resetDatabase } = require('../config/database');

// Reset the database
(async () => {
    try {
        console.log('Resetting database...');
        await resetDatabase();
        console.log('Database reset completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Failed to reset database:', error);
        process.exit(1);
    }
})();
