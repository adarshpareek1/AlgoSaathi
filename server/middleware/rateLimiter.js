/**
 * AlgoSaathi In-Memory Sliding Window Rate Limiter
 * Provides per-user rate limiting with fallback to client IP.
 * Sets RFC compliant headers (X-RateLimit-*, Retry-After).
 */

class MemoryRateLimiter {
  constructor({ windowMs = 60 * 1000, max = 20, message = 'Rate limit exceeded. Please try again later.' }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.store = new Map();

    // Auto-cleanup stale entries every 5 minutes
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Unref timer so it doesn't keep node event loop alive in test runners
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  middleware() {
    return (req, res, next) => {
      // Prioritize authenticated user ID, fallback to IP address
      const key = req.user?._id 
        ? `user:${req.user._id.toString()}` 
        : `ip:${req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'}`;

      const now = Date.now();
      let record = this.store.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + this.windowMs
        };
        this.store.set(key, record);
      } else {
        record.count += 1;
      }

      const remaining = Math.max(0, this.max - record.count);
      const resetSeconds = Math.ceil(record.resetTime / 1000);
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

      res.setHeader('X-RateLimit-Limit', this.max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      if (record.count > this.max) {
        res.setHeader('Retry-After', retryAfterSeconds);
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `${this.message} (Try again in ${retryAfterSeconds}s)`,
          retryAfter: retryAfterSeconds,
          resetTime: record.resetTime
        });
      }

      next();
    };
  }
}

// 20 code executions per 60 seconds per user
export const codeExecutionLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Code execution rate limit reached. Please wait a moment before running more code.'
}).middleware();

// 10 AI queries per 60 seconds per user (protects Gemini quota)
export const aiRateLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'AI assistant rate limit reached. Please wait a moment before sending more queries.'
}).middleware();

// 60 general profile/analytics requests per 60 seconds
export const generalLimiter = new MemoryRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests. Please slow down.'
}).middleware();
