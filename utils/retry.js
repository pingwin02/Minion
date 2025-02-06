const { logInfo } = require("./logger");

/**
 * Retries a given function if it encounters a 5xx server error.
 * Implements an exponential backoff strategy to avoid overwhelming the server.
 *
 * @param {Function} func - The asynchronous function to execute.
 * @param {Array} args - Arguments to pass to the function.
 * @param {number} [maxRetries=6] - Maximum number of retry attempts.
 * @param {number} [baseDelay=2000] - Initial delay in milliseconds before retrying, doubles on each attempt.
 * @returns {Promise<*>} A promise that resolves with the function result or rejects with an error.
 * @throws Will throw an error if all retries fail.
 */
async function retryOnError5xx(func, args, maxRetries = 6, baseDelay = 2000) {
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      return await func(...args);
    } catch (error) {
      if (
        error.status >= 500 &&
        error.status < 600 &&
        retryCount < maxRetries
      ) {
        const delay = baseDelay * Math.pow(2, retryCount);
        logInfo(
          `retryOnError5xx: Encountered error, retrying in ${delay / 1000} seconds. ` +
            `${error.name}: ${error.response?.statusText} (${error.status})`
        );
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

module.exports = { retryOnError5xx };
