import { rateLimit } from 'express-rate-limit'

// Create a rate limit middleware for OTP verification
export const rateLimitMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: 'Too many OTP verification attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable `X-RateLimit-*` headers
})
