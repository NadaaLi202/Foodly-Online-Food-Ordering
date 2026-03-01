/**
 * logError — logs an error to console.
 * Centralized logging utility for the backend.
 *
 * @param {string} message - Label for the error
 * @param {any} error - The caught error
 */
const logError = (message, error) => {
    console.error(message, error);
};

export default logError;
