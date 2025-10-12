// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Makes an API request to the configured base URL
 * @param endpoint - The API endpoint (without base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON response");
  }
}

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint
 * @returns The full API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}