import { rateLimit } from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'

// Create a rate limit middleware for OTP verification
export const rateLimitMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
  message: 'Too many OTP verification attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: 'Too many requests, please try again later.',
      status: StatusCodes.TOO_MANY_REQUESTS
      // data: {
      //   retryAfter: Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000
      // }
    })
  }
})

// For resend OTP
export const resendOtpRateLimitMiddleware = rateLimit({
  windowMs: 1 * process.env.OTP_EXPIRED_TIME * 1000, // 1 minutes
  max: 1,
  message: 'Too many resend OTP attempts, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      message: 'Too many requests, please try again later.',
      status: StatusCodes.TOO_MANY_REQUESTS
    })
  }
})
