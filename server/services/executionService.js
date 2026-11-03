import axios from 'axios';

/**
 * Supported Language Mapping for JDoodle Execution Engine
 */
export const LANGUAGE_CONFIG = {
  cpp: {
    label: 'C++',
    jdoodle: { language: 'cpp17', versionIndex: '0' },
    compileBufferMs: 2500
  },
  c: {
    label: 'C',
    jdoodle: { language: 'c', versionIndex: '4' },
    compileBufferMs: 2000
  },
  python: {
    label: 'Python',
    jdoodle: { language: 'python3', versionIndex: '3' },
    compileBufferMs: 0
  },
  java: {
    label: 'Java',
    jdoodle: { language: 'java', versionIndex: '4' },
    compileBufferMs: 3000
  },
  javascript: {
    label: 'JavaScript',
    jdoodle: { language: 'nodejs', versionIndex: '3' },
    compileBufferMs: 0
  }
};

/**
 * Calculates exponential backoff delay with full jitter
 * Formula: delay = min(maxDelay, baseDelay * 2^attempt) * (0.5 + 0.5 * random())
 * Prevents "thundering herd" spikes when remote service recovers.
 * 
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @param {number} baseDelayMs - Base delay in ms (default 1000ms)
 * @param {number} maxDelayMs - Maximum delay cap in ms (default 8000ms)
 * @returns {number} Delay in milliseconds
 */
export const calculateBackoffWithJitter = (attempt, baseDelayMs = 1000, maxDelayMs = 8000) => {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(maxDelayMs, exponential);
  const jitterFactor = 0.5 + Math.random() * 0.5;
  return Math.floor(capped * jitterFactor);
};

/**
 * Determines dynamic timeout based on language compilation overhead
 * and prior failure characteristics (timeout / 504 gateway response).
 */
export const calculateDynamicTimeout = (language, attempt, previousError) => {
  const baseTimeoutMs = 8000;
  const compileBuffer = LANGUAGE_CONFIG[language]?.compileBufferMs || 0;
  
  // If previous failure was due to timeout or gateway timeout, increase budget dynamically
  let timeoutBoost = 0;
  if (previousError && (previousError.code === 'ECONNABORTED' || previousError.response?.status === 504)) {
    timeoutBoost = (attempt + 1) * 3500;
  } else {
    timeoutBoost = attempt * 1500;
  }

  return baseTimeoutMs + compileBuffer + timeoutBoost;
};

/**
 * Classifies whether an error is transient and retryable
 */
export const isRetryableError = (error) => {
  if (!error) return false;

  const status = error.response?.status;
  const code = error.code;

  // Non-retryable: Client syntax or credentials errors (fail fast)
  if (status === 400 || status === 401 || status === 403) {
    return false;
  }

  // Rate Limit: 429 is retryable with backoff if within daily quota
  if (status === 429) {
    return true;
  }

  // Upstream server errors: 500, 502, 503, 504 (transient failures)
  if (status && status >= 500 && status <= 504) {
    return true;
  }

  // Network drops and socket timeouts
  const retryableNetworkCodes = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED'];
  if (retryableNetworkCodes.includes(code)) {
    return true;
  }

  return false;
};

/**
 * Executes code via JDoodle with smart exponential backoff and dynamic timeout
 */
export const executeWithJDoodle = async (language, source, stdin, onRetryProgress) => {
  const config = LANGUAGE_CONFIG[language];
  if (!config) throw new Error(`Unsupported language: ${language}`);

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const timeoutMs = calculateDynamicTimeout(language, attempt, lastError);
    
    try {
      const response = await axios.post('https://api.jdoodle.com/v1/execute', {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: source,
        stdin: stdin || '',
        language: config.jdoodle.language,
        versionIndex: config.jdoodle.versionIndex
      }, {
        timeout: timeoutMs,
        headers: { 'Content-Type': 'application/json' }
      });

      const { output, error, statusCode, memory, cpuTime } = response.data;
      
      // If daily quota exceeded, raise non-retryable error
      if (typeof output === 'string' && output.includes('Daily limit reached')) {
        throw new Error('JDoodle daily execution limit reached (200 executions/day on free tier).');
      }

      const hasError = !!error || statusCode >= 400;

      return {
        output: output || '',
        error: error || (statusCode >= 400 ? `Execution failed with status ${statusCode}` : null),
        code: hasError ? 1 : 0,
        memory,
        cpuTime,
        engine: 'jdoodle',
        attempts: attempt + 1
      };
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const isRetryable = isRetryableError(err);

      // If client credentials or non-retryable, abort immediately
      if (!isRetryable || attempt === maxRetries - 1) {
        break;
      }

      // Check Retry-After header if provided
      let delayMs = calculateBackoffWithJitter(attempt, 1000, 5000);
      const retryAfterHeader = err.response?.headers?.['retry-after'];
      if (retryAfterHeader) {
        const parsedRetryAfter = parseInt(retryAfterHeader, 10);
        if (!isNaN(parsedRetryAfter) && parsedRetryAfter > 0) {
          delayMs = Math.min(8000, parsedRetryAfter * 1000);
        }
      }

      if (onRetryProgress) {
        onRetryProgress({ attempt: attempt + 1, maxRetries, delayMs, errorStatus: status || err.code });
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
};

/**
 * Unified Code Execution Engine
 */
export const runCodeEngine = async ({ language, source, stdin = '' }) => {
  const startTime = Date.now();

  const result = await executeWithJDoodle(language, source, stdin);
  return {
    ...result,
    executionTimeMs: Date.now() - startTime
  };
};
