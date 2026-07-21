/**
 * TypeScript API Client export matching Step 3 specification.
 * Re-exports the configured Axios instance and auth helpers.
 */
import api, { clearAuthStorage, API_BASE } from "../services/api";

export { api, clearAuthStorage, API_BASE };
export default api;
