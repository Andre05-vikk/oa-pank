# OA-Pank Banking System

## Overview
OA-Pank is a modern banking system created as a school project. It allows users to register, create accounts, transfer money, and communicate with other banks through the central bank.

## Prerequisites
- Node.js (v14 or higher)
- npm

## Installation

1. Install dependencies
```bash
npm install
```

2. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate RSA keys for JWT signing
```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
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

## Port Configuration

The server starts on port 3001. If port 3001 is already in use, the system will automatically try the next available port (3002).

## API Endpoints

Once the application is running, you can access the Swagger UI documentation at:

```
http://localhost:3001/docs
```

## Central Bank Integration

This banking system is designed to work with the Central Bank system. Make sure your bank is registered with the Central Bank and configure the appropriate settings in your .env file.

## Interbank Transfers

To make transfers to other banks, enter the account number with the bank prefix in the `toAccount` field (e.g., "ABC12345678" for a transfer to a bank with prefix ABC).



