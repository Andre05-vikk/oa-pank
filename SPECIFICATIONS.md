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
- Transactions include necessary fields (accountFrom, accountTo, amount, currency, explanation, timestamp)
- Transaction status is accurately tracked (pending, inProgress, completed, failed)
- Users can view their transaction history with filtering options (date range, status, amount)
- Transaction amounts must be positive and within allowed limits
- Transactions can only be made between accounts with the same currency
- Failed transactions include detailed error messages following RFC 7807/9457 format
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
- API endpoints handle errors robustly and provide descriptive error messages using RFC 7807/9457 format
- API endpoints require proper authentication when necessary
- API documentation includes request/response examples
- API endpoints follow RESTful design principles
- API responses are consistent in format and structure
- Error responses are documented with appropriate examples and schemas

## Error Handling
- The application recovers gracefully from external service failures (e.g., when the Central Bank is unresponsive)
- Errors are logged with appropriate severity levels
- Critical errors trigger notifications to system administrators
- User-facing error messages are clear but do not expose sensitive system details
- The system implements circuit breakers for external service calls
- Database transaction errors are properly handled and rolled back when necessary
- Input validation errors return descriptive messages to help users correct their input
- All error responses follow the RFC 7807/9457 Problem Details standard format
- Error responses use the 'application/problem+json' content type
- Error responses include type, title, status, detail, and instance fields
- Error types are identified with URIs that describe the problem type

## Security
- Passwords are hashed using bcrypt with appropriate salt rounds
- JWT tokens have appropriate expiration times
- The system implements protection against common attacks (SQL injection, XSS)
- Input validation is performed on all user inputs
- Access control ensures users can only access their own data

## Performance
- Database queries use appropriate indexes for efficient data retrieval
- Transactions are processed efficiently using SQLite's transaction support
- The system is designed to handle multiple concurrent users

## Monitoring and Logging
- All significant events are logged (login attempts, transactions, errors)
- Logs include contextual information (user ID, request ID, timestamp)
- The system provides health check endpoints
- Performance metrics are collected and can be visualized
- Audit logs for sensitive operations are maintained