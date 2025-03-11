# OA-Pank Banking System

## Overview
OA-Pank is a modern banking system designed to be compatible with the Central Bank system. It provides secure account management, transaction processing, and integration with other banks through the Central Bank network.

## Features
- User registration and authentication
- Multiple currency account management
- Internal and external transaction processing
- Secure communication with other banks using JWT
- Comprehensive API with Swagger documentation

## Prerequisites
- Node.js (v14 or higher)
- MariaDB/MySQL
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd oa-pank
```

2. Install dependencies
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
Once the application is running, you can access the Swagger UI documentation at:
```
http://localhost:3000/docs
```

## Central Bank Integration
This banking system is designed to work with the Central Bank system. Make sure to register your bank with the Central Bank and configure the appropriate settings in your .env file.

## Testing
```bash
npm test
```

## License
[MIT](LICENSE)