const request = require('supertest');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Load OpenAPI spec
const apiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'oa-pank-api-spec.json'), 'utf8'));

// Base URLs
const BASE_URL = 'http://localhost:3001'; // Kasutame kohalikku serverit testimiseks
const REFERENCE_BANK_URL = 'https://henno.cfd/henno-pank';

// Get example data from OpenAPI spec
const getExampleFromSchema = (schemaRef) => {
  const schema = schemaRef.replace('#/components/schemas/', '');
  const schemaObj = apiSpec.components.schemas[schema];

  if (!schemaObj) return null;

  const result = {};

  if (schemaObj.properties) {
    Object.keys(schemaObj.properties).forEach(prop => {
      if (schemaObj.properties[prop].example !== undefined) {
        result[prop] = schemaObj.properties[prop].example;
      } else if (schemaObj.properties[prop].$ref) {
        result[prop] = getExampleFromSchema(schemaObj.properties[prop].$ref);
      }
    });
  }

  return result;
};

// Get required fields for a schema
const getRequiredFields = (schemaRef) => {
  const schema = schemaRef.replace('#/components/schemas/', '');
  const schemaObj = apiSpec.components.schemas[schema];

  if (!schemaObj || !schemaObj.required) return [];

  return schemaObj.required;
};

// Create request body with only required fields
const createRequestBody = (schemaRef) => {
  const schema = schemaRef.replace('#/components/schemas/', '');
  const schemaObj = apiSpec.components.schemas[schema];

  if (!schemaObj) return {};

  const result = {};
  const required = schemaObj.required || [];

  required.forEach(prop => {
    if (schemaObj.properties[prop].example !== undefined) {
      result[prop] = schemaObj.properties[prop].example;
    } else if (schemaObj.properties[prop].$ref) {
      result[prop] = getExampleFromSchema(schemaObj.properties[prop].$ref);
    }
  });

  return result;
};

// Get example response for a path and method
const getExampleResponse = (path, method, statusCode) => {
  if (!apiSpec.paths[path] || !apiSpec.paths[path][method]) return null;

  const responses = apiSpec.paths[path][method].responses;
  if (!responses || !responses[statusCode]) return null;

  const content = responses[statusCode].content;
  if (!content || !content['application/json'] || !content['application/json'].schema) return null;

  const schema = content['application/json'].schema;

  if (schema.$ref) {
    return getExampleFromSchema(schema.$ref);
  } else if (schema.properties) {
    const result = {};
    Object.keys(schema.properties).forEach(prop => {
      if (schema.properties[prop].example !== undefined) {
        result[prop] = schema.properties[prop].example;
      } else if (schema.properties[prop].$ref) {
        result[prop] = getExampleFromSchema(schema.properties[prop].$ref);
      }
    });
    return result;
  }

  return null;
};

// Mutable IDs and tokens
const testData = {
  user: {
    username: `testuser_${Date.now()}`,
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
    email: `testuser_${Date.now()}@example.com`
  },
  tokens: {
    auth: null,
    referenceBank: null
  },
  ids: {
    userId: null,
    accountId: null,
    accountNumber: null,
    referenceBankAccountNumber: null
  }
};

// Helper functions
const logFailedTest = (testName, method, url, headers, body, response) => {
  console.log(`# FAIL in: ${testName}`);
  let curlCmd = `curl -X ${method} ${url}`;

  if (headers) {
    if (headers.Authorization) {
      curlCmd += ` -H "Authorization: ${headers.Authorization}"`;
    }
    if (headers['Content-Type']) {
      curlCmd += ` -H "Content-Type: ${headers['Content-Type']}"`;
    }
  }

  if (body) {
    curlCmd += ` -d '${JSON.stringify(body)}'`;
  }

  console.log(curlCmd);
  console.log('Response:', response.status, response.body);
};

// Validate response against example
const validateResponse = (response, exampleResponse) => {
  if (!exampleResponse) return true;

  const validateObject = (actual, expected, path = '') => {
    if (expected === null || expected === undefined) return true;

    if (typeof expected !== 'object') {
      if (actual === expected) return true;
      console.log(`Validation failed at ${path}: expected ${expected}, got ${actual}`);
      return false;
    }

    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        console.log(`Validation failed at ${path}: expected array, got ${typeof actual}`);
        return false;
      }

      if (expected.length > 0 && actual.length > 0) {
        return validateObject(actual[0], expected[0], `${path}[0]`);
      }

      return true;
    }

    for (const key in expected) {
      // Skip validation for _id, createdAt, updatedAt, username, email, and token fields
      if (key === '_id' || key === 'createdAt' || key === 'updatedAt' ||
          key === 'username' || key === 'email' || key === 'token') continue;

      const newPath = path ? `${path}.${key}` : key;

      if (actual[key] === undefined) {
        console.log(`Validation failed at ${newPath}: missing property`);
        return false;
      }

      if (!validateObject(actual[key], expected[key], newPath)) {
        return false;
      }
    }

    return true;
  };

  return validateObject(response, exampleResponse);
};

// Main test suite
describe('OA-Pank API Tests', () => {

  // Authentication tests
  describe('Authentication', () => {

    it('should register a new user', async () => {
      try {
        // Get required fields from UserInput schema
        const userInputSchema = apiSpec.paths['/users'].post.requestBody.content['application/json'].schema.$ref;
        const userInput = createRequestBody(userInputSchema);

        // Override with our test data for uniqueness
        userInput.username = testData.user.username;
        userInput.password = testData.user.password;
        userInput.email = testData.user.email;
        userInput.firstName = testData.user.firstName;
        userInput.lastName = testData.user.lastName;

        const res = await request(BASE_URL)
          .post('/users')
          .send(userInput)
          .expect(201);

        // Get example response
        const exampleResponse = getExampleResponse('/users', 'post', '201');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.user, 'Response should include user data');
        assert(res.body.user.username === userInput.username, 'Username should match');

        testData.ids.userId = res.body.user._id;
      } catch (error) {
        logFailedTest(
          'should register a new user',
          'POST',
          `${BASE_URL}/users`,
          { 'Content-Type': 'application/json' },
          testData.user,
          error.response || {}
        );
        throw error;
      }
    });

    it('should reject duplicate user registration with 409', async () => {
      try {
        // Get required fields from UserInput schema
        const userInputSchema = apiSpec.paths['/users'].post.requestBody.content['application/json'].schema.$ref;
        const userInput = createRequestBody(userInputSchema);

        // Override with our test data for uniqueness
        userInput.username = testData.user.username;
        userInput.password = testData.user.password;
        userInput.email = testData.user.email;
        userInput.firstName = testData.user.firstName;
        userInput.lastName = testData.user.lastName;

        const res = await request(BASE_URL)
          .post('/users')
          .send(userInput)
          .expect(409);

        assert(res.body.success === false, 'Response should indicate failure');
      } catch (error) {
        logFailedTest(
          'should reject duplicate user registration',
          'POST',
          `${BASE_URL}/users`,
          { 'Content-Type': 'application/json' },
          testData.user,
          error.response || {}
        );
        throw error;
      }
    });

    it('should reject login with missing credentials', async () => {
      try {
        // Get required fields from LoginInput schema
        const loginInputSchema = apiSpec.paths['/sessions'].post.requestBody.content['application/json'].schema.$ref;
        const loginInput = createRequestBody(loginInputSchema);

        // Remove password to test missing credentials
        delete loginInput.password;
        loginInput.username = testData.user.username;

        const res = await request(BASE_URL)
          .post('/sessions')
          .send(loginInput)
          .expect(400);

        assert(res.body.success === false, 'Response should indicate failure');
      } catch (error) {
        logFailedTest(
          'should reject login with missing credentials',
          'POST',
          `${BASE_URL}/sessions`,
          { 'Content-Type': 'application/json' },
          { username: testData.user.username },
          error.response || {}
        );
        throw error;
      }
    });

    it('should reject login with invalid credentials', async () => {
      try {
        // Get required fields from LoginInput schema
        const loginInputSchema = apiSpec.paths['/sessions'].post.requestBody.content['application/json'].schema.$ref;
        const loginInput = createRequestBody(loginInputSchema);

        // Use wrong password
        loginInput.username = testData.user.username;
        loginInput.password = 'wrongpassword';

        const res = await request(BASE_URL)
          .post('/sessions')
          .send(loginInput)
          .expect(401);

        assert(res.body.success === false, 'Response should indicate failure');
      } catch (error) {
        logFailedTest(
          'should reject login with invalid credentials',
          'POST',
          `${BASE_URL}/sessions`,
          { 'Content-Type': 'application/json' },
          { username: testData.user.username, password: 'wrongpassword' },
          error.response || {}
        );
        throw error;
      }
    });

    it('should login successfully', async () => {
      try {
        // Get required fields from LoginInput schema
        const loginInputSchema = apiSpec.paths['/sessions'].post.requestBody.content['application/json'].schema.$ref;
        const loginInput = createRequestBody(loginInputSchema);

        // Use correct credentials
        loginInput.username = testData.user.username;
        loginInput.password = testData.user.password;

        const res = await request(BASE_URL)
          .post('/sessions')
          .send(loginInput)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/sessions', 'post', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.user, 'Response should include user data');
        assert(res.body.token, 'Response should include auth token');

        testData.tokens.auth = res.body.token;
      } catch (error) {
        logFailedTest(
          'should login successfully',
          'POST',
          `${BASE_URL}/sessions`,
          { 'Content-Type': 'application/json' },
          { username: testData.user.username, password: testData.user.password },
          error.response || {}
        );
        throw error;
      }
    });

    it('should reject access to protected endpoint without token', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/users/me')
          .expect(401);

        assert(res.body.success === false, 'Response should indicate failure');
      } catch (error) {
        logFailedTest(
          'should reject access to protected endpoint without token',
          'GET',
          `${BASE_URL}/users/me`,
          {},
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should access protected endpoint with valid token', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/users/me')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/users/me', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.user, 'Response should include user data');
        assert(res.body.user.username === testData.user.username, 'Username should match');
      } catch (error) {
        logFailedTest(
          'should access protected endpoint with valid token',
          'GET',
          `${BASE_URL}/users/me`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should refresh session token', async () => {
      try {
        const res = await request(BASE_URL)
          .post('/sessions/current/refresh')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/sessions/current/refresh', 'post', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.expiresAt, 'Response should include expiration time');
      } catch (error) {
        logFailedTest(
          'should refresh session token',
          'POST',
          `${BASE_URL}/sessions/current/refresh`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should logout successfully', async () => {
      try {
        const res = await request(BASE_URL)
          .delete('/sessions/current')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/sessions/current', 'delete', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.message, 'Response should include message');
      } catch (error) {
        logFailedTest(
          'should logout successfully',
          'DELETE',
          `${BASE_URL}/sessions/current`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should reject access after logout', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/users/me')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(401);

        assert(res.body.success === false, 'Response should indicate failure');
      } catch (error) {
        logFailedTest(
          'should reject access after logout',
          'GET',
          `${BASE_URL}/users/me`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    // Login again for subsequent tests
    it('should login again for subsequent tests', async () => {
      try {
        // Get required fields from LoginInput schema
        const loginInputSchema = apiSpec.paths['/sessions'].post.requestBody.content['application/json'].schema.$ref;
        const loginInput = createRequestBody(loginInputSchema);

        // Use correct credentials
        loginInput.username = testData.user.username;
        loginInput.password = testData.user.password;

        const res = await request(BASE_URL)
          .post('/sessions')
          .send(loginInput)
          .expect(200);

        testData.tokens.auth = res.body.token;
      } catch (error) {
        logFailedTest(
          'should login again for subsequent tests',
          'POST',
          `${BASE_URL}/sessions`,
          { 'Content-Type': 'application/json' },
          { username: testData.user.username, password: testData.user.password },
          error.response || {}
        );
        throw error;
      }
    });
  });

  // Account tests
  describe('Accounts', () => {
    it('should create a new account', async () => {
      try {
        // Get required fields from AccountInput schema
        const accountInputSchema = apiSpec.paths['/accounts'].post.requestBody.content['application/json'].schema.$ref;
        const accountInput = createRequestBody(accountInputSchema);

        const res = await request(BASE_URL)
          .post('/accounts')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .send(accountInput)
          .expect(201);

        // Get example response
        const exampleResponse = getExampleResponse('/accounts', 'post', '201');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.account, 'Response should include account data');
        assert(res.body.account.currency === accountInput.currency, 'Currency should match');
        assert(res.body.account.type === accountInput.type, 'Type should match');

        testData.ids.accountId = res.body.account._id;
        testData.ids.accountNumber = res.body.account.accountNumber;
      } catch (error) {
        logFailedTest(
          'should create a new account',
          'POST',
          `${BASE_URL}/accounts`,
          {
            'Authorization': `Bearer ${testData.tokens.auth}`,
            'Content-Type': 'application/json'
          },
          accountInput,
          error.response || {}
        );
        throw error;
      }
    });

    it('should get all accounts', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/accounts')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/accounts', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(Array.isArray(res.body.accounts), 'Response should include accounts array');
        assert(res.body.accounts.length > 0, 'User should have at least one account');
      } catch (error) {
        logFailedTest(
          'should get all accounts',
          'GET',
          `${BASE_URL}/accounts`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should get account by ID', async () => {
      try {
        const res = await request(BASE_URL)
          .get(`/accounts/${testData.ids.accountId}`)
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/accounts/{id}', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.account, 'Response should include account data');
        assert(res.body.account._id === testData.ids.accountId, 'Account ID should match');
      } catch (error) {
        logFailedTest(
          'should get account by ID',
          'GET',
          `${BASE_URL}/accounts/${testData.ids.accountId}`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });
  });

  // Transaction tests
  describe('Transactions', () => {
    // Create a second account for internal transfers
    let secondAccountId;
    let secondAccountNumber;

    before(async () => {
      try {
        // Get required fields from AccountInput schema
        const accountInputSchema = apiSpec.paths['/accounts'].post.requestBody.content['application/json'].schema.$ref;
        const accountInput = createRequestBody(accountInputSchema);

        const res = await request(BASE_URL)
          .post('/accounts')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .send(accountInput)
          .expect(201);

        secondAccountId = res.body.account._id;
        secondAccountNumber = res.body.account.accountNumber;
      } catch (error) {
        console.log('Failed to create second account for transaction tests');
        throw error;
      }
    });

    it('should create an internal transaction', async () => {
      try {
        // Get required fields from TransactionInput schema
        const transactionInputSchema = apiSpec.paths['/transactions'].post.requestBody.content['application/json'].schema.$ref;
        const transactionInput = createRequestBody(transactionInputSchema);

        // Override with our test data
        transactionInput.accountFrom = testData.ids.accountNumber;
        transactionInput.accountTo = secondAccountNumber;
        transactionInput.amount = 10;
        transactionInput.currency = 'EUR';
        transactionInput.description = 'Test transaction';

        const res = await request(BASE_URL)
          .post('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .send(transactionInput)
          .expect(201);

        // Get example response
        const exampleResponse = getExampleResponse('/transactions', 'post', '201');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(res.body.transaction, 'Response should include transaction data');
        assert(res.body.transaction.accountFrom === transactionInput.accountFrom, 'Source account should match');
        assert(res.body.transaction.accountTo === transactionInput.accountTo, 'Destination account should match');
        assert(res.body.transaction.amount === transactionInput.amount, 'Amount should match');
      } catch (error) {
        logFailedTest(
          'should create an internal transaction',
          'POST',
          `${BASE_URL}/transactions`,
          {
            'Authorization': `Bearer ${testData.tokens.auth}`,
            'Content-Type': 'application/json'
          },
          {
            accountFrom: testData.ids.accountNumber,
            accountTo: secondAccountNumber,
            amount: 10,
            currency: 'EUR',
            description: 'Test transaction'
          },
          error.response || {}
        );
        throw error;
      }
    });

    it('should get all transactions', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/transactions', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.success === true, 'Response should indicate success');
        assert(Array.isArray(res.body.transactions), 'Response should include transactions array');
        assert(res.body.transactions.length > 0, 'User should have at least one transaction');
      } catch (error) {
        logFailedTest(
          'should get all transactions',
          'GET',
          `${BASE_URL}/transactions`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });
  });

  // Bank-to-bank transfer tests
  describe('Bank-to-Bank Transfers', () => {
    // Login to reference bank
    before(async () => {
      try {
        // Login to reference bank
        const loginRes = await request(REFERENCE_BANK_URL)
          .post('/sessions')
          .send({ username: 'miki', password: 'plutoonium' })
          .expect(201);

        testData.tokens.referenceBank = loginRes.body.token;

        // Get reference bank account info
        const accountRes = await request(REFERENCE_BANK_URL)
          .get('/users/current')
          .set('Authorization', `Bearer ${testData.tokens.referenceBank}`)
          .expect(200);

        testData.ids.referenceBankAccountNumber = accountRes.body.accounts[0].number;
      } catch (error) {
        console.log('Failed to setup reference bank connection');
        throw error;
      }
    });

    it('should receive funds from reference bank', async () => {
      try {
        // Send money from reference bank to our bank
        const transactionData = {
          accountFrom: testData.ids.referenceBankAccountNumber,
          accountTo: testData.ids.accountNumber,
          amount: 50,
          explanation: 'Testing external transfer'
        };

        await request(REFERENCE_BANK_URL)
          .post('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.referenceBank}`)
          .send(transactionData)
          .expect(200);

        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if transaction appears in our bank
        const res = await request(BASE_URL)
          .get('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/transactions', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');

        const receivedTransaction = res.body.transactions.find(
          t => t.accountTo === testData.ids.accountNumber &&
               t.amount === 50 &&
               t.type === 'external'
        );

        assert(receivedTransaction, 'Should find the received external transaction');
      } catch (error) {
        logFailedTest(
          'should receive funds from reference bank',
          'GET',
          `${BASE_URL}/transactions`,
          { 'Authorization': `Bearer ${testData.tokens.auth}` },
          null,
          error.response || {}
        );
        throw error;
      }
    });

    it('should send funds to reference bank', async () => {
      try {
        // Get required fields from TransactionInput schema
        const transactionInputSchema = apiSpec.paths['/transactions'].post.requestBody.content['application/json'].schema.$ref;
        const transactionInput = createRequestBody(transactionInputSchema);

        // Override with our test data
        transactionInput.accountFrom = testData.ids.accountNumber;
        transactionInput.accountTo = testData.ids.referenceBankAccountNumber;
        transactionInput.amount = 25;
        transactionInput.currency = 'EUR';
        transactionInput.description = 'Testing external transfer to reference bank';

        await request(BASE_URL)
          .post('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.auth}`)
          .send(transactionInput)
          .expect(201);

        // Wait for transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if transaction appears in reference bank
        const res = await request(REFERENCE_BANK_URL)
          .get('/transactions')
          .set('Authorization', `Bearer ${testData.tokens.referenceBank}`)
          .expect(200);

        const receivedTransaction = res.body.find(
          t => t.accountTo === testData.ids.referenceBankAccountNumber &&
               parseFloat(t.amount) === 25 &&
               t.status === 'completed'
        );

        assert(receivedTransaction, 'Should find the received transaction in reference bank');
      } catch (error) {
        logFailedTest(
          'should send funds to reference bank',
          'POST',
          `${BASE_URL}/transactions`,
          {
            'Authorization': `Bearer ${testData.tokens.auth}`,
            'Content-Type': 'application/json'
          },
          {
            accountFrom: testData.ids.accountNumber,
            accountTo: testData.ids.referenceBankAccountNumber,
            amount: 25,
            currency: 'EUR',
            description: 'Testing external transfer to reference bank'
          },
          error.response || {}
        );
        throw error;
      }
    });
  });

  // JWKS endpoint test
  describe('JWKS Endpoint', () => {
    it('should return valid JWKS', async () => {
      try {
        const res = await request(BASE_URL)
          .get('/.well-known/jwks.json')
          .expect(200);

        // Get example response
        const exampleResponse = getExampleResponse('/.well-known/jwks.json', 'get', '200');

        // Validate response structure
        assert(validateResponse(res.body, exampleResponse), 'Response structure should match example');
        assert(res.body.keys, 'Response should include keys array');
        assert(Array.isArray(res.body.keys), 'Keys should be an array');
        assert(res.body.keys.length > 0, 'Should have at least one key');
        assert(res.body.keys[0].kty === 'RSA', 'Key type should be RSA');
        assert(res.body.keys[0].use === 'sig', 'Key use should be sig');
        assert(res.body.keys[0].kid, 'Key should have a kid');
      } catch (error) {
        logFailedTest(
          'should return valid JWKS',
          'GET',
          `${BASE_URL}/.well-known/jwks.json`,
          {},
          null,
          error.response || {}
        );
        throw error;
      }
    });
  });

  // Cleanup - delete accounts and user
  after(async () => {
    if (testData.tokens.auth) {
      try {
        // Try to delete accounts (they must have zero balance)
        // This might fail if accounts have balance, which is expected
        if (secondAccountId) {
          await request(BASE_URL)
            .delete(`/accounts/${secondAccountId}`)
            .set('Authorization', `Bearer ${testData.tokens.auth}`)
            .catch(() => console.log('Could not delete second account, might have non-zero balance'));
        }

        if (testData.ids.accountId) {
          await request(BASE_URL)
            .delete(`/accounts/${testData.ids.accountId}`)
            .set('Authorization', `Bearer ${testData.tokens.auth}`)
            .catch(() => console.log('Could not delete first account, might have non-zero balance'));
        }

        // Delete user
        if (testData.ids.userId) {
          await request(BASE_URL)
            .delete(`/users/${testData.ids.userId}`)
            .set('Authorization', `Bearer ${testData.tokens.auth}`)
            .catch(() => console.log('Could not delete test user'));
        }
      } catch (error) {
        console.log('Error during cleanup:', error.message);
      }
    }
  });
});