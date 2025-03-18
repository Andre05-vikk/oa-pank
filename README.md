# OA-Pank Banking System

## Overview
OA-Pank is a modern banking system designed to be compatible with the Central Bank system. It provides secure account management, transaction processing, and integration with other banks through the Central Bank network.

## Features
- User registration and authentication
- Multiple currency account management (EUR, USD, GBP, CHF, JPY, AUD, CAD, SEK, NOK, DKK, PLN, CZK)
- Automatic currency conversion for transactions between accounts with different currencies
- Internal and external transaction processing
- Secure communication with other banks using JWT
- Comprehensive API with Swagger documentation

## Prerequisites
- Node.js (v14 or higher)
- MariaDB/MySQL
- npm or yarn

## Installation

1. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Generate RSA keys for JWT signing
```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

5. Set up the database
```bash
# Create a database named 'oa_pank' in your MariaDB/MySQL server
```

## Running the Application

### Development mode
```bash
npm run dev
```

### Production mode
```bash
npm start
```

## API Documentation

API documentation is available at `/docs` when the server is running.

## Currency Conversion

The system supports automatic currency conversion when transferring money between accounts with different currencies.
All conversions are based on the current exchange rates with EUR as the base currency.

### Exchange Rates

- Exchange rates are available via the `/currencies` endpoint (RESTful API)
- Individual currency rates can be accessed via `/currencies/{code}` (e.g., `/currencies/USD`)
- Rates are stored in cents (100 = 1 EUR) for precise calculations
- Administrators can update all rates via PUT request to `/currencies`
- Administrators can update individual rates via PATCH request to `/currencies/{code}`
- Legacy endpoints (`/currency-rates` and `/admin/currency-rates/update`) are maintained for backward compatibility

### Transaction Process with Currency Conversion

1. When a transaction is initiated, the system checks if the source and destination accounts use different currencies
2. If currencies differ, the amount is automatically converted using the current exchange rates
3. The transaction description includes the original and converted amounts for transparency
4. All currency conversions are performed with minimal rounding errors by using cent-based calculations

## Port Configuration

The server runs on ports 3000-3010. If port 3000 is already in use, the system will automatically try the next available
port in the range.

## API Endpoints

Once the application is running, you can access the Swagger UI documentation at:

```bash
http://localhost:3000/docs
```

## Central Bank Integration

This banking system is designed to work with the Central Bank system. Make sure to register your bank with the Central Bank and configure the appropriate settings in your .env file.



