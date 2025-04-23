/**
 * Bank Synchronization Service
 * Periodically synchronizes bank data with the Central Bank
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');
const { getAllBanks } = require('../config/central-banks.config');

// Paths to data files
const otherBanksDataPath = path.join(__dirname, '../../data/other_banks_data.json');
const lastUpdatePath = path.join(__dirname, '../../data/last_update.json');

/**
 * Fetch all banks from the Central Bank
 * @returns {Promise<Array>} - List of banks
 */
const fetchBanksFromCentralBank = async () => {
  try {
    console.log('Fetching banks from Central Bank...');
    const banks = await getAllBanks();
    console.log(`Fetched ${banks.length} banks from Central Bank`);
    return banks;
  } catch (error) {
    console.error('Error fetching banks from Central Bank:', error.message);
    return [];
  }
};

/**
 * Compare Central Bank data with local data to find changes
 * @param {Array} centralBankData - Banks data from Central Bank
 * @param {Array} localData - Local banks data
 * @returns {Object} - Changes to be applied
 */
const compareBanksData = (centralBankData, localData) => {
  const changes = {
    added: [],
    updated: [],
    removed: [],
    unchanged: []
  };

  // Create maps for easier lookup
  const centralBankMap = new Map();
  const localDataMap = new Map();

  // Map Central Bank data by bankPrefix
  centralBankData.forEach(bank => {
    if (bank.bankPrefix) {
      centralBankMap.set(bank.bankPrefix, bank);
    }
  });

  // Map local data by bankPrefix
  localData.forEach(bank => {
    if (bank.bankPrefix) {
      localDataMap.set(bank.bankPrefix, bank);
    }
  });

  // Find added and updated banks
  centralBankMap.forEach((centralBank, prefix) => {
    const localBank = localDataMap.get(prefix);

    if (!localBank) {
      // Bank is new
      changes.added.push({
        ...centralBank,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Check if bank data has changed
      const hasChanged =
        centralBank.name !== localBank.name ||
        centralBank.transactionUrl !== localBank.transactionUrl ||
        centralBank.jwksUrl !== localBank.jwksUrl ||
        centralBank.owners !== localBank.owners;

      if (hasChanged) {
        changes.updated.push({
          ...centralBank,
          lastUpdated: new Date().toISOString()
        });
      } else {
        changes.unchanged.push(localBank);
      }
    }
  });

  // Find removed banks
  localDataMap.forEach((localBank, prefix) => {
    if (!centralBankMap.has(prefix)) {
      changes.removed.push(localBank);
    }
  });

  return changes;
};

/**
 * Update the other_banks_data.json file with new data
 * @param {Array} updatedData - Updated banks data
 * @returns {Promise<boolean>} - Success status
 */
const updateBanksDataFile = async (updatedData) => {
  try {
    // Sort banks by name for consistency
    const sortedData = updatedData.sort((a, b) => a.name.localeCompare(b.name));

    // Write to file
    fs.writeFileSync(otherBanksDataPath, JSON.stringify(sortedData, null, 2));
    console.log(`Updated other_banks_data.json with ${updatedData.length} banks`);
    return true;
  } catch (error) {
    console.error('Error updating other_banks_data.json:', error.message);
    return false;
  }
};

/**
 * Update the last_update.json file with new timestamp and count
 * @param {number} count - Number of banks
 * @returns {Promise<boolean>} - Success status
 */
const updateLastUpdateFile = async (count) => {
  try {
    const updateData = {
      lastUpdate: new Date().toISOString(),
      count
    };

    fs.writeFileSync(lastUpdatePath, JSON.stringify(updateData, null, 2));
    console.log(`Updated last_update.json with timestamp ${updateData.lastUpdate} and count ${count}`);
    return true;
  } catch (error) {
    console.error('Error updating last_update.json:', error.message);
    return false;
  }
};

/**
 * Update the database with new banks data
 * @param {Array} banksData - Updated banks data
 * @returns {Promise<boolean>} - Success status
 */
const updateDatabaseWithBanksData = async (banksData) => {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection is not available');
    }

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Clear existing data
      await db.run('DELETE FROM external_banks');

      // Insert new data
      for (const bank of banksData) {
        await db.run(
          'INSERT INTO external_banks (name, prefix, transactionUrl) VALUES (?, ?, ?)',
          bank.name,
          bank.bankPrefix,
          bank.transactionUrl
        );
      }

      // Commit the transaction
      await db.run('COMMIT');
      console.log(`Updated database with ${banksData.length} banks`);
      return true;
    } catch (error) {
      // Rollback in case of error
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating database with banks data:', error.message);
    return false;
  }
};

/**
 * Main function to update banks from Central Bank
 * @returns {Promise<Object>} - Update results
 */
const updateBanksFromCentralBank = async () => {
  try {
    console.log('Starting bank data update from Central Bank...');

    // Check if other_banks_data.json exists
    let localData = [];
    if (fs.existsSync(otherBanksDataPath)) {
      try {
        localData = JSON.parse(fs.readFileSync(otherBanksDataPath, 'utf8'));
        console.log(`Loaded ${localData.length} banks from other_banks_data.json`);
      } catch (readError) {
        console.error('Error reading other_banks_data.json:', readError.message);
        // Continue with empty local data
      }
    } else {
      console.log('other_banks_data.json not found, will create new file');
    }

    // Fetch banks from Central Bank
    const centralBankData = await fetchBanksFromCentralBank();
    if (!centralBankData.length) {
      console.error('No banks data received from Central Bank, aborting update');
      return { success: false, message: 'No banks data received from Central Bank' };
    }

    // Compare data and find changes
    const changes = compareBanksData(centralBankData, localData);
    console.log(`Changes detected: ${changes.added.length} added, ${changes.updated.length} updated, ${changes.removed.length} removed, ${changes.unchanged.length} unchanged`);

    // If no changes, no need to update
    if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
      console.log('No changes detected, skipping update');
      return {
        success: true,
        message: 'No changes detected',
        changes: { added: 0, updated: 0, removed: 0, unchanged: changes.unchanged.length }
      };
    }

    // Prepare updated data (added + updated + unchanged)
    const updatedData = [
      ...changes.added,
      ...changes.updated,
      ...changes.unchanged
    ];

    // Update other_banks_data.json
    const fileUpdateSuccess = await updateBanksDataFile(updatedData);
    if (!fileUpdateSuccess) {
      return { success: false, message: 'Failed to update other_banks_data.json' };
    }

    // Update last_update.json
    const lastUpdateSuccess = await updateLastUpdateFile(updatedData.length);
    if (!lastUpdateSuccess) {
      console.warn('Failed to update last_update.json, continuing anyway');
    }

    // Update database
    const dbUpdateSuccess = await updateDatabaseWithBanksData(updatedData);
    if (!dbUpdateSuccess) {
      console.warn('Failed to update database, continuing anyway');
    }

    console.log('Bank data update completed successfully');
    return {
      success: true,
      message: 'Bank data updated successfully',
      changes: {
        added: changes.added.length,
        updated: changes.updated.length,
        removed: changes.removed.length,
        unchanged: changes.unchanged.length
      }
    };
  } catch (error) {
    console.error('Error updating banks from Central Bank:', error.message);
    return { success: false, message: `Error updating banks: ${error.message}` };
  }
};

/**
 * Initialize bank synchronization
 * Sets up periodic updates every 24 hours
 */
const initializeBankSync = () => {
  // Run initial update
  updateBanksFromCentralBank()
    .then(result => {
      console.log('Initial bank sync result:', result);
    })
    .catch(error => {
      console.error('Error during initial bank sync:', error);
    });

  // Set up periodic updates every 24 hours (in milliseconds)
  const updateInterval = 24 * 60 * 60 * 1000; // 24 hours

  setInterval(() => {
    updateBanksFromCentralBank()
      .then(result => {
        console.log('Periodic bank sync result:', result);
      })
      .catch(error => {
        console.error('Error during periodic bank sync:', error);
      });
  }, updateInterval);

  console.log(`Bank synchronization initialized, will update every ${updateInterval / (60 * 60 * 1000)} hours`);
};

module.exports = {
  updateBanksFromCentralBank,
  initializeBankSync
};
