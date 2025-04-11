const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// JWKS endpoint for publishing public keys
router.get('/jwks.json', (req, res) => {
  try {
    // Path to the public key file
      const publicKeyPath = path.join(__dirname, '../../keys/public.pem');

    // Check if the public key file exists
    if (!fs.existsSync(publicKeyPath)) {
      return res.status(404).json({
        success: false,
        message: 'Public key not found'
      });
    }

    // Read the public key
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

      // Parse the public key to extract components
      const publicKeyObject = crypto.createPublicKey(publicKey);
      const publicKeyJwk = publicKeyObject.export({format: 'jwk'});

      // Create a proper JWKS response with correct JWK formatting
    const jwks = {
      keys: [
        {
            kty: publicKeyJwk.kty,
          use: 'sig',
            kid: global.BANK_PREFIX || '313', // Use the bank prefix from central bank or default to '313'
          alg: 'RS256',
            n: publicKeyJwk.n,
            e: publicKeyJwk.e
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