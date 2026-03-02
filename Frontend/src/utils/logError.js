/**
 * logError — logs an error to console, silently skipping 403 Forbidden responses.
 * Use this instead of console.error/console.warn for API catch blocks.
 *
 * @param {string} message - Label for the error
 * @param {any} error - The caught error
 */
const logError = (message, error) => {
    if (error?.response?.status === 403) return;
    console.error(message, error);
};

export default logError;
