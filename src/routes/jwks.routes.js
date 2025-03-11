const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// JWKS endpoint for publishing public keys
router.get('/jwks.json', (req, res) => {
  try {
    // Path to the public key file
    const publicKeyPath = process.env.PUBLIC_KEY_PATH;
    
    // Check if the public key file exists
    if (!fs.existsSync(publicKeyPath)) {
      return res.status(404).json({
        success: false,
        message: 'Public key not found'
      });
    }
    
    // Read the public key
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    // Create a simple JWKS response
    // In a production environment, this would include proper JWK formatting
    const jwks = {
      keys: [
        {
          kty: 'RSA',
          use: 'sig',
          kid: process.env.BANK_PREFIX,
          alg: 'RS256',
          n: publicKey, // This is simplified; in production, this would be the modulus of the RSA key
          e: 'AQAB' // Standard RSA exponent
        }
      ]
    };
    
    res.status(200).json(jwks);
  } catch (error) {
    console.error('Error serving JWKS:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving JWKS',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;