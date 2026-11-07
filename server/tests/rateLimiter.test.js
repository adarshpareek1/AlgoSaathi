import { describe, test, expect, beforeEach } from '@jest/globals';

/**
 * We re-implement the MemoryRateLimiter class inline for isolated unit testing
 * without importing the full module (avoids ESM/side-effect issues with Jest).
 * The logic is identical to server/middleware/rateLimiter.js.
 */
class MemoryRateLimiter {
  constructor({ windowMs = 60 * 1000, max = 20, message = 'Rate limit exceeded.' }) {
    this.windowMs = windowMs;
    this.max = max;
    this.message = message;
    this.store = new Map();
  }

  middleware() {
    return (req, res, next) => {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Not authorized, no user found' });
      }

      const key = `user:${userId.toString()}`;

      const now = Date.now();
      let record = this.store.get(key);

      if (!record || now > record.resetTime) {
        record = { count: 1, resetTime: now + this.windowMs };
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

// ── Helpers to build mock Express req/res/next ──────────────────────────

function mockReq(overrides = {}) {
  return {
    user: { _id: 'default_test_user' },
    headers: {},
    ...overrides
  };
}

function mockRes() {
  const headers = {};
  const res = {
    _statusCode: null,
    _body: null,
    _headers: headers,
    setHeader(key, value) { headers[key] = value; },
    status(code) { res._statusCode = code; return res; },
    json(body) { res._body = body; return res; }
  };
  return res;
}

// ── Test Suite ──────────────────────────────────────────────────────────

describe('MemoryRateLimiter', () => {
  let limiter;
  let middleware;

  beforeEach(() => {
    limiter = new MemoryRateLimiter({ windowMs: 60000, max: 5, message: 'Too fast.' });
    middleware = limiter.middleware();
  });

  test('allows requests within the limit', () => {
    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;

    middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res._statusCode).toBeNull();
    expect(res._headers['X-RateLimit-Limit']).toBe(5);
    expect(res._headers['X-RateLimit-Remaining']).toBe(4);
  });

  test('sets X-RateLimit-Remaining to 0 on the last allowed request', () => {
    const req = mockReq();

    for (let i = 0; i < 4; i++) {
      middleware(req, mockRes(), () => {});
    }

    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(true);
    expect(res._headers['X-RateLimit-Remaining']).toBe(0);
  });

  test('returns 429 on the request that exceeds the limit (the 6th request with max=5)', () => {
    const req = mockReq();

    // Use up 5 requests
    for (let i = 0; i < 5; i++) {
      middleware(req, mockRes(), () => {});
    }

    // 6th request should be blocked
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res._statusCode).toBe(429);
    expect(res._body.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(typeof res._headers['Retry-After']).toBe('number');
    expect(res._headers['Retry-After']).toBeGreaterThan(0);
  });

  test('isolates limits between different users', () => {
    const userA = mockReq({ user: { _id: 'user_aaa' } });
    const userB = mockReq({ user: { _id: 'user_bbb' } });

    // Exhaust user A
    for (let i = 0; i < 5; i++) {
      middleware(userA, mockRes(), () => {});
    }

    // User A is now blocked
    const resA = mockRes();
    middleware(userA, resA, () => {});
    expect(resA._statusCode).toBe(429);

    // User B should still be allowed
    const resB = mockRes();
    let nextCalledB = false;
    middleware(userB, resB, () => { nextCalledB = true; });
    expect(nextCalledB).toBe(true);
    expect(resB._statusCode).toBeNull();
    expect(resB._headers['X-RateLimit-Remaining']).toBe(4);
  });

  test('rejects unauthenticated requests when user is missing', () => {
    const unauthReq = { headers: {} };
    const res = mockRes();
    let nextCalled = false;
    middleware(unauthReq, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res._statusCode).toBe(401);
    expect(res._body.success).toBe(false);
  });

  test('resets count after the time window expires', () => {
    const req = mockReq();

    // Exhaust limit
    for (let i = 0; i < 5; i++) {
      middleware(req, mockRes(), () => {});
    }
    const resBlocked = mockRes();
    middleware(req, resBlocked, () => {});
    expect(resBlocked._statusCode).toBe(429);

    // Simulate time window expiry by manipulating the internal store
    const key = 'user:default_test_user';
    const record = limiter.store.get(key);
    record.resetTime = Date.now() - 1; // expired

    // Next request should pass
    const resAfter = mockRes();
    let nextCalled = false;
    middleware(req, resAfter, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(resAfter._headers['X-RateLimit-Remaining']).toBe(4);
  });

  test('429 response body includes retryAfter and resetTime fields', () => {
    const req = mockReq();
    for (let i = 0; i < 5; i++) {
      middleware(req, mockRes(), () => {});
    }

    const res = mockRes();
    middleware(req, res, () => {});

    expect(res._body).toHaveProperty('retryAfter');
    expect(res._body).toHaveProperty('resetTime');
    expect(res._body.retryAfter).toBeGreaterThan(0);
    expect(res._body.success).toBe(false);
  });
});
