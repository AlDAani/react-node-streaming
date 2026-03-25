export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const withBaseUrl = (path: string) => `${API_BASE_URL}${path}`;
