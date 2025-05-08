/**
 * Script to clean bank data and remove duplicates
 * Run with: node src/scripts/clean-bank-data.js
 */

require('dotenv').config();
const { cleanExistingBankData } = require('../services/bank-sync');
const { initializeDatabase } = require('../config/database');

// Initialize database and clean bank data
async function main() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    console.log('Cleaning bank data...');
    const success = await cleanExistingBankData();
    
    if (success) {
      console.log('Bank data cleaned successfully');
      process.exit(0);
    } else {
      console.error('Failed to clean bank data');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
