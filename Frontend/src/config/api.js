/**
 * Centralized API configuration.
 *
 * - In development (vite dev server), we always call the local backend on
 *   http://localhost:4000/api/v1 to match Backend/index.js.
 * - In production builds, we respect VITE_API_URL (e.g. '/api/v1' behind a proxy),
 *   falling back to '/api/v1' if not explicitly set.
 */
const isProd = import.meta.env.PROD;

export const API_BASE_URL = isProd
    ? (import.meta.env.VITE_API_URL || '/api/v1')
    : 'http://localhost:3001/api/v1';

export default {
    API_BASE_URL,
};
