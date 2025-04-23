# OA-Pank Banking System

## Overview

OA-Pank is a modern banking system designed to be compatible with the Central Bank system. It provides secure account management, transaction processing, and integration with other banks through the Central Bank network.

> **Note:** For detailed specifications, please refer to the [SPECIFICATIONS.md](SPECIFICATIONS.md) file.

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

API documentation is available at `/docs` when the server is running. Once the application is running, you can access the Swagger UI documentation at:

```
http://localhost:3001/docs
```

## Testing

To run tests:

```bash
npm test
```

## Database Management

To reset the database:

```bash
npm run reset-db
```
