export async function apiRequest(url: string, options: RequestInit = {}) {
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
