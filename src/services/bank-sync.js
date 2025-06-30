/**
 * Bank Synchronization Service
 * Periodically synchronizes bank data with the Central Bank
 */

const fs = require('fs');
const path = require('path');
const { getDatabase } = require('../config/database');
const { getAllBanks, validateBankRegistration } = require('../config/central-banks.config');

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
 * First checks by bank name to avoid duplicates, then compares other data
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
  const localBanksByName = new Map();

  // Map Central Bank data by name (primary key)
  centralBankData.forEach(bank => {
    if (bank.name) {
      // If we already have a bank with this name, keep only the most recent one
      const existingBank = centralBankMap.get(bank.name);
      if (!existingBank || (bank.lastUpdated && existingBank.lastUpdated && new Date(bank.lastUpdated) > new Date(existingBank.lastUpdated))) {
        centralBankMap.set(bank.name, bank);
      }
    }
  });

  // Map local data by name
  localData.forEach(bank => {
    if (bank.name) {
      // If we already have a bank with this name, keep only the most recent one
      const existingBank = localBanksByName.get(bank.name);
      if (!existingBank || (bank.lastUpdated && existingBank.lastUpdated && new Date(bank.lastUpdated) > new Date(existingBank.lastUpdated))) {
        localBanksByName.set(bank.name, bank);
      }

      // Also keep a map by bankPrefix for backward compatibility
      if (bank.bankPrefix) {
        localDataMap.set(bank.bankPrefix, bank);
      }
    }
  });

  // Find added and updated banks
  centralBankMap.forEach((centralBank, name) => {
    const localBank = localBanksByName.get(name);

    if (!localBank) {
      // Bank is new
      console.log(`Adding new bank: ${name}`);
      changes.added.push({
        ...centralBank,
        lastUpdated: new Date().toISOString()
      });
    } else {
      // Check if bank data has changed
      const hasChanged =
        centralBank.bankPrefix !== localBank.bankPrefix ||
        centralBank.transactionUrl !== localBank.transactionUrl ||
        centralBank.jwksUrl !== localBank.jwksUrl ||
        centralBank.owners !== localBank.owners;

      if (hasChanged) {
        // Check which version is newer based on lastUpdated
        const centralBankDate = centralBank.lastUpdated ? new Date(centralBank.lastUpdated) : new Date(0);
        const localBankDate = localBank.lastUpdated ? new Date(localBank.lastUpdated) : new Date(0);

        if (centralBankDate > localBankDate) {
          console.log(`Updating bank: ${name} (central bank data is newer)`);
          changes.updated.push({
            ...centralBank,
            lastUpdated: new Date().toISOString()
          });
        } else {
          console.log(`Keeping local data for bank: ${name} (local data is newer)`);
          changes.unchanged.push(localBank);
        }
      } else {
        // No changes, keep local data
        changes.unchanged.push(localBank);
      }
    }
  });

  // Find removed banks - a bank is considered removed if it's not in the central bank data by name
  localBanksByName.forEach((localBank, name) => {
    if (!centralBankMap.has(name)) {
      console.log(`Removing bank: ${name}`);
      changes.removed.push(localBank);
    }
  });

  return changes;
};

/**
 * Update the other_banks_data.json file with new data
 * Ensures there are no duplicates by bank name
 * @param {Array} updatedData - Updated banks data
 * @returns {Promise<boolean>} - Success status
 */
const updateBanksDataFile = async (updatedData) => {
  try {
    // Remove duplicates by bank name, keeping the most recent entry
    const banksByName = new Map();

    updatedData.forEach(bank => {
      if (!bank.name) return; // Skip banks without a name

      const existingBank = banksByName.get(bank.name);
      if (!existingBank) {
        // No existing bank with this name, add it
        banksByName.set(bank.name, bank);
      } else {
        // Bank with this name already exists, keep the one with the most recent lastUpdated
        const existingDate = existingBank.lastUpdated ? new Date(existingBank.lastUpdated) : new Date(0);
        const newDate = bank.lastUpdated ? new Date(bank.lastUpdated) : new Date(0);

        if (newDate > existingDate) {
          banksByName.set(bank.name, bank);
        }
      }
    });

    // Convert map back to array
    const dedupedData = Array.from(banksByName.values());

    // Sort banks by name for consistency
    const sortedData = dedupedData.sort((a, b) => a.name.localeCompare(b.name));

    // Write to file
    fs.writeFileSync(otherBanksDataPath, JSON.stringify(sortedData, null, 2));
    console.log(`Updated other_banks_data.json with ${sortedData.length} banks (removed ${updatedData.length - sortedData.length} duplicates)`);
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
 * Ensures there are no duplicates by bank name
 * @param {Array} banksData - Updated banks data
 * @returns {Promise<boolean>} - Success status
 */
const updateDatabaseWithBanksData = async (banksData) => {
  try {
    const db = getDatabase();
    if (!db) {
      throw new Error('Database connection is not available');
    }

    // Remove duplicates by bank name, keeping the most recent entry
    const banksByName = new Map();

    banksData.forEach(bank => {
      if (!bank.name) return; // Skip banks without a name

      const existingBank = banksByName.get(bank.name);
      if (!existingBank) {
        // No existing bank with this name, add it
        banksByName.set(bank.name, bank);
      } else {
        // Bank with this name already exists, keep the one with the most recent lastUpdated
        const existingDate = existingBank.lastUpdated ? new Date(existingBank.lastUpdated) : new Date(0);
        const newDate = bank.lastUpdated ? new Date(bank.lastUpdated) : new Date(0);

        if (newDate > existingDate) {
          banksByName.set(bank.name, bank);
        }
      }
    });

    // Convert map back to array
    const dedupedData = Array.from(banksByName.values());

    // Start a transaction
    await db.run('BEGIN TRANSACTION');

    try {
      // Clear existing data
      await db.run('DELETE FROM external_banks');

      // Insert new data
      for (const bank of dedupedData) {
        await db.run(
          'INSERT INTO external_banks (name, prefix, transactionUrl) VALUES (?, ?, ?)',
          bank.name,
          bank.bankPrefix,
          bank.transactionUrl
        );
      }

      // Commit the transaction
      await db.run('COMMIT');
      console.log(`Updated database with ${dedupedData.length} banks`);
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
 * Validate this bank's registration with the central bank
 * @returns {Promise<Object>} - Validation result
 */
const validateOwnBankRegistration = async () => {
  try {
    console.log('Validating bank registration with Central Bank...');
    const validationResult = await validateBankRegistration();
    console.log('Bank registration validation successful');
    return {
      success: true,
      data: validationResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Bank registration validation failed:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
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
 * Clean existing bank data to remove duplicates
 * @returns {Promise<boolean>} - Success status
 */
const cleanExistingBankData = async () => {
  try {
    console.log('Cleaning existing bank data to remove duplicates...');

    // Check if other_banks_data.json exists
    if (!fs.existsSync(otherBanksDataPath)) {
      console.log('No existing bank data file found, nothing to clean');
      return true;
    }

    // Read existing data
    const existingData = JSON.parse(fs.readFileSync(otherBanksDataPath, 'utf8'));
    console.log(`Read ${existingData.length} banks from existing data`);

    // Remove duplicates by bank name, keeping the most recent entry
    const banksByName = new Map();

    existingData.forEach(bank => {
      if (!bank.name) return; // Skip banks without a name

      const existingBank = banksByName.get(bank.name);
      if (!existingBank) {
        // No existing bank with this name, add it
        banksByName.set(bank.name, bank);
      } else {
        // Bank with this name already exists, keep the one with the most recent lastUpdated
        const existingDate = existingBank.lastUpdated ? new Date(existingBank.lastUpdated) : new Date(0);
        const newDate = bank.lastUpdated ? new Date(bank.lastUpdated) : new Date(0);

        if (newDate > existingDate) {
          console.log(`Replacing existing bank ${bank.name} with newer data`);
          banksByName.set(bank.name, bank);
        }
      }
    });

    // Convert map back to array
    const dedupedData = Array.from(banksByName.values());

    // Sort banks by name for consistency
    const sortedData = dedupedData.sort((a, b) => a.name.localeCompare(b.name));

    // Write to file
    fs.writeFileSync(otherBanksDataPath, JSON.stringify(sortedData, null, 2));
    console.log(`Cleaned bank data file: ${existingData.length} banks -> ${sortedData.length} banks (removed ${existingData.length - sortedData.length} duplicates)`);

    return true;
  } catch (error) {
    console.error('Error cleaning existing bank data:', error.message);
    return false;
  }
};

/**
 * Initialize bank synchronization with registration validation
 * Sets up periodic updates every 5 minutes
 */
const initializeBankSync = () => {
  // First clean existing data to remove duplicates
  cleanExistingBankData()
    .then(success => {
      if (success) {
        console.log('Successfully cleaned existing bank data');
      } else {
        console.warn('Failed to clean existing bank data, continuing anyway');
      }

      // Validate our own registration
      return validateOwnBankRegistration();
    })
    .then(validationResult => {
      if (validationResult.success) {
        console.log('Bank registration validation passed during initialization');
      } else {
        console.warn('Bank registration validation failed during initialization:', validationResult.error);
      }

      // Run initial update
      return updateBanksFromCentralBank();
    })
    .then(result => {
      console.log('Initial bank sync result:', result);
    })
    .catch(error => {
      console.error('Error during initial bank sync:', error);
    });

  // Set up periodic updates every 5 minutes (in milliseconds)
  const updateInterval = 5 * 60 * 1000; // 5 minutes

  setInterval(() => {
    // First validate our own registration, then update banks data
    validateOwnBankRegistration()
      .then(validationResult => {
        if (validationResult.success) {
          console.log('Periodic bank registration validation passed');
        } else {
          console.warn('Periodic bank registration validation failed:', validationResult.error);
          // Consider this a warning, not a critical error for the sync process
        }

        return updateBanksFromCentralBank();
      })
      .then(result => {
        console.log('Periodic bank sync result:', result);
      })
      .catch(error => {
        console.error('Error during periodic bank sync:', error);
      });
  }, updateInterval);

  console.log(`Bank synchronization initialized, will update every ${updateInterval / (60 * 1000)} minutes`);
};

module.exports = {
  updateBanksFromCentralBank,
  initializeBankSync,
  cleanExistingBankData,
  validateOwnBankRegistration
};
