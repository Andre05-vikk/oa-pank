# OA-Pank Banking System

## Overview

OA-Pank is a modern banking system designed to be compatible with the Central Bank system. It provides secure account management, transaction processing, and integration with other banks through the Central Bank network.

> **Note:** For detailed specifications, please refer to the [SPECIFICATIONS.md](SPECIFICATIONS.md) file.

---

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Generate RSA keys for JWT signing:

```bash
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

---

## Running the Application

### Development Mode

Start the server with development settings:

```bash
npm run dev
```

Swagger UI (API documentation) will be available at:

```
http://localhost:3001/docs
```

> **Note:** The default port is 3001, but you can configure it using the `PORT` environment variable in your `.env` file.

---

### Production Deployment (PM2 + Alpine Linux)

For deploying to a production server using PM2 and Nginx:

1. Start the app using PM2 in production mode:

```bash
NODE_ENV=production pm2 start src/oa-pank.js --name oa-pank
```

2. Save the process list to enable auto-restart:

```bash
pm2 save
```

3. Enable PM2 to start on system boot (for Alpine Linux with OpenRC):

```bash
pm2 startup openrc
# Follow the command PM2 prints and run it (example):
# sudo env PATH=$PATH:/usr/bin pm2 startup openrc -u root --hp /root
```

4. Ensure Nginx proxies requests to your Node.js app:

Example Nginx config:

```nginx
location /oa-pank/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header Host $host;
    include proxy.conf;
}
```

> **Note:** Make sure the port in your Nginx config matches the `PORT` value in your server's `.env` file.

---

### Swagger UI URLs

* **Development mode:**
  [http://localhost:3001/docs](http://localhost:3001/docs)

* **Production mode:**
  [https://your-domain.com/oa-pank/docs/](https://your-domain.com/oa-pank/docs/)

---

## Testing

To run tests:

```bash
npm test
```

---

## Database Management

To reset the database:

```bash
npm run reset-db
```

To clean bank data and remove duplicates:

```bash
npm run clean-bank-data
```

> **Note:** The system automatically cleans bank data on startup and during periodic updates (every 24 hours), but you can also run this command manually if needed.
