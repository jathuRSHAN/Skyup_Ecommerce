const dotenv = require("dotenv");
dotenv.config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Generate JWT Token
 * @param {Object} payload - User data (id, email, userType)
 * @param {String} expiresIn - Expiration time (e.g., "1h", "7d")
 * @returns {String} - Signed JWT token
 */

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn:'1h' });
};

module.exports = { generateToken };

