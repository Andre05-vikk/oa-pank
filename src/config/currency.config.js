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
 * Updates currency rates from an external source
 * In a real application, this should be done regularly
 */
const updateCurrencyRates = async () => {
  try {
    const axios = require('axios');
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/EUR');
    const rates = response.data.rates;
    
    // Update rates
    CURRENCY_RATES.USD = Math.round(rates.USD * 100) || CURRENCY_RATES.USD;
    CURRENCY_RATES.GBP = Math.round(rates.GBP * 100) || CURRENCY_RATES.GBP;
    CURRENCY_RATES.CHF = Math.round(rates.CHF * 100) || CURRENCY_RATES.CHF;
    CURRENCY_RATES.JPY = Math.round(rates.JPY * 100) || CURRENCY_RATES.JPY;
    CURRENCY_RATES.AUD = Math.round(rates.AUD * 100) || CURRENCY_RATES.AUD;
    CURRENCY_RATES.CAD = Math.round(rates.CAD * 100) || CURRENCY_RATES.CAD;
    CURRENCY_RATES.SEK = Math.round(rates.SEK * 100) || CURRENCY_RATES.SEK;
    CURRENCY_RATES.NOK = Math.round(rates.NOK * 100) || CURRENCY_RATES.NOK;
    CURRENCY_RATES.DKK = Math.round(rates.DKK * 100) || CURRENCY_RATES.DKK;
    CURRENCY_RATES.PLN = Math.round(rates.PLN * 100) || CURRENCY_RATES.PLN;
    CURRENCY_RATES.CZK = Math.round(rates.CZK * 100) || CURRENCY_RATES.CZK;
    
    console.log('Currency rates updated successfully');
    return true;
  } catch (error) {
    console.error('Failed to update currency rates:', error);
    return false;
  }
};

module.exports = {
  convertCurrency,
  getCurrencyRates,
  updateCurrencyRates,
  CURRENCY_RATES
};
