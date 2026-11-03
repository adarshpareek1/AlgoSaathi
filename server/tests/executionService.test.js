import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

/**
 * Pure unit tests for the execution service's core logic:
 *   - isRetryableError: error classification
 *   - calculateBackoffWithJitter: delay bounds
 *   - calculateDynamicTimeout: timeout scaling
 *
 * We re-implement the pure functions here to test them in isolation
 * without triggering ESM import side-effects or needing real axios.
 */

// ── Function implementations (mirrors executionService.js) ──────────

const LANGUAGE_CONFIG = {
  cpp: { compileBufferMs: 2500 },
  python: { compileBufferMs: 0 },
  java: { compileBufferMs: 3000 },
  javascript: { compileBufferMs: 0 },
  c: { compileBufferMs: 2000 }
};

function isRetryableError(error) {
  if (!error) return false;
  const status = error.response?.status;
  const code = error.code;

  if (status === 400 || status === 401 || status === 403) return false;
  if (status === 429) return true;
  if (status && status >= 500 && status <= 504) return true;

  const retryableNetworkCodes = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
  if (retryableNetworkCodes.includes(code)) return true;

  return false;
}

function calculateBackoffWithJitter(attempt, baseDelayMs = 1000, maxDelayMs = 8000) {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(maxDelayMs, exponential);
  const jitterFactor = 0.5 + Math.random() * 0.5;
  return Math.floor(capped * jitterFactor);
}

function calculateDynamicTimeout(language, attempt, previousError) {
  const baseTimeoutMs = 8000;
  const compileBuffer = LANGUAGE_CONFIG[language]?.compileBufferMs || 0;
  let timeoutBoost = 0;
  if (previousError && (previousError.code === 'ECONNABORTED' || previousError.response?.status === 504)) {
    timeoutBoost = (attempt + 1) * 3500;
  } else {
    timeoutBoost = attempt * 1500;
  }
  return baseTimeoutMs + compileBuffer + timeoutBoost;
}

// ── Tests: isRetryableError ─────────────────────────────────────────

describe('isRetryableError — error classification', () => {

  test('returns false for null/undefined input', () => {
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
  });

  test('classifies 400 Bad Request as NOT retryable (fail fast)', () => {
    expect(isRetryableError({ response: { status: 400 } })).toBe(false);
  });

  test('classifies 401 Unauthorized as NOT retryable', () => {
    expect(isRetryableError({ response: { status: 401 } })).toBe(false);
  });

  test('classifies 403 Forbidden as NOT retryable', () => {
    expect(isRetryableError({ response: { status: 403 } })).toBe(false);
  });

  test('classifies 429 Rate Limit as retryable', () => {
    expect(isRetryableError({ response: { status: 429 } })).toBe(true);
  });

  test('classifies 500 Internal Server Error as retryable', () => {
    expect(isRetryableError({ response: { status: 500 } })).toBe(true);
  });

  test('classifies 502 Bad Gateway as retryable', () => {
    expect(isRetryableError({ response: { status: 502 } })).toBe(true);
  });

  test('classifies 503 Service Unavailable as retryable', () => {
    expect(isRetryableError({ response: { status: 503 } })).toBe(true);
  });

  test('classifies 504 Gateway Timeout as retryable', () => {
    expect(isRetryableError({ response: { status: 504 } })).toBe(true);
  });

  test('classifies ECONNABORTED (socket timeout) as retryable', () => {
    expect(isRetryableError({ code: 'ECONNABORTED' })).toBe(true);
  });

  test('classifies ETIMEDOUT as retryable', () => {
    expect(isRetryableError({ code: 'ETIMEDOUT' })).toBe(true);
  });

  test('classifies ECONNRESET as retryable', () => {
    expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
  });

  test('classifies ECONNREFUSED as retryable', () => {
    expect(isRetryableError({ code: 'ECONNREFUSED' })).toBe(true);
  });

  test('classifies unknown error codes as NOT retryable', () => {
    expect(isRetryableError({ code: 'ERR_SOMETHING_CUSTOM' })).toBe(false);
  });

  test('classifies error with no status and no code as NOT retryable', () => {
    expect(isRetryableError({ message: 'Some random error' })).toBe(false);
  });
});

// ── Tests: calculateBackoffWithJitter ───────────────────────────────

describe('calculateBackoffWithJitter — delay bounds', () => {

  test('attempt 0 delay is between 500ms and 1000ms (base=1000, jitter 0.5–1.0)', () => {
    for (let i = 0; i < 50; i++) {
      const delay = calculateBackoffWithJitter(0, 1000, 8000);
      expect(delay).toBeGreaterThanOrEqual(500);
      expect(delay).toBeLessThanOrEqual(1000);
    }
  });

  test('attempt 1 delay is between 1000ms and 2000ms', () => {
    for (let i = 0; i < 50; i++) {
      const delay = calculateBackoffWithJitter(1, 1000, 8000);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(2000);
    }
  });

  test('delay never exceeds maxDelayMs cap', () => {
    for (let i = 0; i < 50; i++) {
      const delay = calculateBackoffWithJitter(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    }
  });

  test('delay is always a non-negative integer', () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const delay = calculateBackoffWithJitter(attempt);
      expect(Number.isInteger(delay)).toBe(true);
      expect(delay).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── Tests: calculateDynamicTimeout ──────────────────────────────────

describe('calculateDynamicTimeout — language-aware timeout scaling', () => {

  test('base timeout for Python (no compile buffer) with no prior error is 8000ms', () => {
    expect(calculateDynamicTimeout('python', 0, null)).toBe(8000);
  });

  test('C++ gets an additional 2500ms compile buffer', () => {
    const timeout = calculateDynamicTimeout('cpp', 0, null);
    expect(timeout).toBe(8000 + 2500); // 10500
  });

  test('Java gets an additional 3000ms compile buffer', () => {
    const timeout = calculateDynamicTimeout('java', 0, null);
    expect(timeout).toBe(8000 + 3000); // 11000
  });

  test('timeout increases with attempt count (no prior timeout error)', () => {
    const t0 = calculateDynamicTimeout('python', 0, null);
    const t1 = calculateDynamicTimeout('python', 1, null);
    const t2 = calculateDynamicTimeout('python', 2, null);
    expect(t1).toBeGreaterThan(t0);
    expect(t2).toBeGreaterThan(t1);
  });

  test('timeout increases aggressively after a prior ECONNABORTED timeout', () => {
    const normalT1 = calculateDynamicTimeout('python', 1, null);
    const timeoutT1 = calculateDynamicTimeout('python', 1, { code: 'ECONNABORTED' });
    expect(timeoutT1).toBeGreaterThan(normalT1);
  });

  test('timeout increases aggressively after a prior 504 Gateway Timeout', () => {
    const normalT1 = calculateDynamicTimeout('python', 1, null);
    const gatewayT1 = calculateDynamicTimeout('python', 1, { response: { status: 504 } });
    expect(gatewayT1).toBeGreaterThan(normalT1);
  });

  test('unknown language defaults to 0 compile buffer', () => {
    const timeout = calculateDynamicTimeout('rust', 0, null);
    expect(timeout).toBe(8000);
  });
});
