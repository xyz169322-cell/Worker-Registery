import rateLimit from 'express-rate-limit';

// For simplicity, using memory store. 
// A robust setup would use RedisStore with redis client.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
