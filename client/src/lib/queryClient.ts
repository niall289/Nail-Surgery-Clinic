import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Create a QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// API request function
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// getQueryFn utility used by pages like admin.tsx
type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const endpoint = queryKey[0] as string;

    const res = await fetch(endpoint, {
      credentials: "include",
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as unknown as T;
    }

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return await res.json();
  };
