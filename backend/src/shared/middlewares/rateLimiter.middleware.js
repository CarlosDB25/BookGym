const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts - max 5 attempts per 15 minutes per IP
// In test environment, set a very high limit to effectively disable it
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // High limit in test env
  message: {
    error: 'Demasiados intentos de inicio de sesión, por favor intente nuevamente después de 15 minutos'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

module.exports = { loginLimiter };