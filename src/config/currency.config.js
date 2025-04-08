/**
 * Currency conversion configuration
 * Base currency is EUR, all conversions are performed through the base currency
 */

// Currency rates in cents (100 = 1 EUR)
// These are static rates, in a real application they should be updated regularly
const CURRENCY_RATES = {
  EUR: 100,    // 1 EUR = 1 EUR
  USD: 109,    // 1 EUR = 1.09 USD
  GBP: 86,     // 1 EUR = 0.86 GBP
  CHF: 105,    // 1 EUR = 1.05 CHF
  JPY: 15850,  // 1 EUR = 158.50 JPY
  AUD: 165,    // 1 EUR = 1.65 AUD
  CAD: 147,    // 1 EUR = 1.47 CAD
  SEK: 1127,   // 1 EUR = 11.27 SEK
  NOK: 1147,   // 1 EUR = 11.47 NOK
  DKK: 745,    // 1 EUR = 7.45 DKK
  PLN: 431,    // 1 EUR = 4.31 PLN
  CZK: 2530    // 1 EUR = 25.30 CZK
};

/**
 * Converts an amount from one currency to another
 * @param {number} amount - Amount in cents
 * @param {string} fromCurrency - Source currency (e.g. 'EUR')
 * @param {string} toCurrency - Target currency (e.g. 'USD')
 * @returns {number} Converted amount in cents
 */
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  // If currencies are the same, no need to convert
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Check if currencies are supported
  if (!CURRENCY_RATES[fromCurrency] || !CURRENCY_RATES[toCurrency]) {
    throw new Error(`Unsupported currency: ${!CURRENCY_RATES[fromCurrency] ? fromCurrency : toCurrency}`);
  }

  // Convert source currency to EUR
  const amountInEur = amount / (CURRENCY_RATES[fromCurrency] / 100);

  // Convert EUR to target currency
  const amountInTargetCurrency = Math.round(amountInEur * (CURRENCY_RATES[toCurrency] / 100));

  return amountInTargetCurrency;
};

/**
 * Returns all currency rates
 * @returns {Object} Currency rates
 */
const getCurrencyRates = () => {
  return {
    base: 'EUR',
    rates: CURRENCY_RATES,
    displayRates: Object.entries(CURRENCY_RATES).reduce((acc, [currency, rate]) => {
      acc[currency] = currency === 'EUR' ? 1 : (rate / 100).toFixed(2);
      return acc;
    }, {})
  };
};

/**
 * Updates currency rates from the central bank
 * This is called automatically when the application starts
 */
const updateCurrencyRates = async () => {
  try {
    const axios = require('axios');
    // Use the central bank API to get currency rates
    // In a real application, this would be the actual central bank API
    // For this school project, we're using a mock or the teacher's API
    const centralBankUrl = process.env.CENTRAL_BANK_URL || 'https://henno.cfd/keskpank';
    const response = await axios.get(`${centralBankUrl}/currencies`);

    if (response.data && response.data.rates) {
      const rates = response.data.rates;

      // Update rates for all supported currencies
      Object.keys(CURRENCY_RATES).forEach(currency => {
        if (rates[currency]) {
          CURRENCY_RATES[currency] = Math.round(rates[currency] * 100) || CURRENCY_RATES[currency];
        }
      });

      console.log('Currency rates updated successfully from central bank');
      return true;
    } else {
      console.warn('Central bank did not provide valid currency rates, using default rates');
      return false;
    }
  } catch (error) {
    console.error('Failed to update currency rates from central bank:', error.message);
    console.warn('Using default currency rates');
    return false;
  }
};

module.exports = {
  convertCurrency,
  getCurrencyRates,
  updateCurrencyRates,
  CURRENCY_RATES
};
