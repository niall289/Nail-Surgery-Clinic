// Environment configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Export for use in components
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }

  // In production, use relative URLs
  return '';
};