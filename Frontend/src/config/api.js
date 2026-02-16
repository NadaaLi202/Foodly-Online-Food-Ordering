/**
 * Centralized API configuration.
 * Uses Vite environment variables to determine the base URL.
 */
// export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1');;
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default {
    API_BASE_URL
};
