# OA-Pank Specifications

## Overview
This document outlines the specifications for the OA-Pank banking system, which must be compatible with the Central Bank system. The system provides secure banking services including user management, account operations, and transaction processing with both internal and external banks.

## User Management
- Users can register with a valid username and password
- Registration validates required fields (username, password, first name, last name, email) and prevents duplicates
- Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number
- Users can log in (receive a JWT session token)
- Users can log out (session token is deleted from the server)
- Users can only access their own data
- Users can update their profile information

## Account Management
- Each user can have multiple accounts in different currencies (EUR, USD, GBP, etc.)
- Accounts are created with a unique account number using the bank's prefix (format: BANK_PREFIX + random digits)
- Users can view their account balances and transaction history
- Account balances are correctly updated after transactions
- Users can close accounts with zero balance
- Account creation requires user authentication
- Each account has a creation date, last activity date, and status (active, inactive, closed)

## Transaction Processing
- Users can initiate internal transactions between accounts within the same bank
- Users can initiate external transactions to accounts at other banks
- Transactions include necessary fields (fromAccount, toAccount, amount, currency, description, timestamp)
- Transaction status is accurately tracked (pending, inProgress, completed, failed)
- Users can view their transaction history with filtering options (date range, status, amount)
- Transaction amounts must be positive and within allowed limits
- Currency conversion is handled for transactions between accounts with different currencies
- Failed transactions include detailed error messages
- Transactions are atomic - either fully completed or fully rolled back

## Central Bank Integration
- The bank is registered with the Central Bank and has a unique prefix in the bank configuration file (e.g., .env)
- The bank can process incoming transactions from other banks according to the Central Bank specifications
- The bank communicates securely with other banks using JWT-signed data packets
- The bank validates signatures of incoming transactions and rejects transactions not signed with the public key of the sending bank provided by the Central Bank
- Transactions are signed with the bank's private key, with the public key registered at the Central Bank
- The bank has a JWKS endpoint for publishing public keys, registered with the Central Bank
- The bank validates signatures of incoming transactions based on the sender's public key
- The bank periodically synchronizes with the Central Bank to get updated public keys of other banks
- The bank implements retry mechanisms for failed communications with the Central Bank
- The bank maintains a log of all communications with the Central Bank for audit purposes

## API Documentation
- SwaggerUI is available at /docs, documenting all bank API endpoints
- All API endpoints defined in the Swagger documentation are implemented and conform to the documentation
- API endpoints return appropriate HTTP status codes
- API endpoints handle errors robustly and provide descriptive error messages
- API endpoints require proper authentication when necessary
- API documentation includes request/response examples
- API versioning is implemented to ensure backward compatibility
- Rate limiting is implemented to prevent abuse
- API endpoints follow RESTful design principles
- API responses are consistent in format and structure

## Error Handling
- The application recovers gracefully from external service failures (e.g., when the Central Bank is unresponsive)
- Errors are logged with appropriate severity levels
- Critical errors trigger notifications to system administrators
- User-facing error messages are clear but do not expose sensitive system details
- The system implements circuit breakers for external service calls
- Database transaction errors are properly handled and rolled back when necessary
- Input validation errors return descriptive messages to help users correct their input

## Security
- All communications use HTTPS/TLS
- Passwords are hashed using bcrypt with appropriate salt rounds
- JWT tokens have appropriate expiration times
- The system implements protection against common attacks (SQL injection, XSS, CSRF)
- Failed login attempts are rate-limited to prevent brute force attacks
- Sensitive data is encrypted at rest
- Access control is implemented at all levels (API, service, database)

## Performance
- The system can handle at least 100 concurrent users
- API response times are under 500ms for 95% of requests
- Database queries are optimized with proper indexing
- The system implements caching where appropriate
- Long-running operations are executed asynchronously

## Currency Rates
- Exchange rates are available via the `/currencies` endpoint (RESTful API)
- Individual currency rates can be accessed via `/currencies/{code}` (e.g., `/currencies/USD`)
- Rates are stored in cents (100 = 1 EUR) for precise calculations
- Currency rates are updated from the Central Bank via GET request to `/currencies/update`

## Port Configuration
- The server starts on port 3001
- If port 3001 is already in use, the system will automatically try port 3002
- The API documentation is available at `/docs` when the server is running

## Interbank Transfers
- To make transfers to other banks, enter the account number with the bank prefix in the `toAccount` field
- For example, use "ABC12345678" for a transfer to a bank with prefix ABC
- The system automatically detects external transfers based on the account prefix
- External transfers are secured using JWT signatures

## Monitoring and Logging
- All significant events are logged (login attempts, transactions, errors)
- Logs include contextual information (user ID, request ID, timestamp)
- The system provides health check endpoints
- Performance metrics are collected and can be visualized
- Audit logs for sensitive operations are maintained