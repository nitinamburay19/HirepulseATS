// This function will be called by the App component to handle automatic logout on 401.
let onUnauthorizedCallback = () => {};
export const setOnUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const API_BASE_URL = (viteEnv?.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Could not access localStorage. Auth token will not be available.');
    return null;
  }
};

const formatApiError = (status: number, errorData: any): string => {
  if (Array.isArray(errorData?.detail)) {
    const messages = errorData.detail.map((item: any) => {
      const field = Array.isArray(item?.loc) ? item.loc.join('.') : 'request';
      return `${field}: ${item?.msg || 'Invalid value'}`;
    });
    return messages.join('\n');
  }
  if (typeof errorData?.detail === 'string') {
    return errorData.detail;
  }
  if (typeof errorData?.message === 'string') {
    return errorData.message;
  }
  return `HTTP error! status: ${status}`;
};

/**
 * A centralized API client for making HTTP requests to the backend.
 * It automatically handles authentication headers, content types, and basic error handling.
 * @template T The expected response data type.
 * @param {string} endpoint The API endpoint to call (e.g., '/users').
 * @param {'GET' | 'POST' | 'PUT' | 'DELETE'} [method='GET'] The HTTP method.
 * @param {any} [payload] The data to send in the request body for POST/PUT requests.
 * @returns {Promise<T>} A promise that resolves with the response data.
 */
const apiClient = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  payload?: any
): Promise<T> => {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (payload && !isFormData) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(payload);
  } else if (payload && isFormData) {
    config.body = payload;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      onUnauthorizedCallback();
      throw new Error('Unauthorized');
    }
    if (response.status === 204) {
      return null as T;
    }
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: 'An unknown server error occurred' }));
      throw new Error(formatApiError(response.status, errorData));
    }
    return await response.json() as T;

  } catch (error) {
    console.error(`API Error on ${method} ${endpoint}:`, error);
    if (error instanceof TypeError && /Failed to fetch/i.test(error.message)) {
      throw new Error(
        `Network request failed for ${endpoint}. Check backend server status, CORS settings, and VITE_API_BASE_URL.`
      );
    }
    // Re-throw the error so component-level error handling can catch it.
    throw error;
  }
};

export default apiClient;
