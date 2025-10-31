import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware to prevent scraping and abuse of public endpoints
 * Designed to protect user privacy while allowing legitimate browsing
 */

// Stricter rate limit for listing endpoints (prevents bulk scraping)
export const publicListingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: "Too many requests. Please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use IP address from request
  keyGenerator: (req) => {
    // Check for forwarded IP (behind proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests from this IP. Please try again in 15 minutes.",
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// More lenient rate limit for individual profile/request views
// (Still limited to prevent automated scraping)
export const publicItemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Allow more individual views, but still limited
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests from this IP. Please try again in 15 minutes.",
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// General rate limiter for all public API endpoints
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // General limit for other public endpoints
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests from this IP. Please try again in 15 minutes.",
      retryAfter: Math.ceil(req.rateLimit?.resetTime ? (req.rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

