// Shared API client for all services
// Handles base URL, JSON headers, auth token injection, and error parsing

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    const parseJson = async () => {
      try {
        return await response.json();
      } catch {
        return {} as unknown;
      }
    };

    if (!response.ok) {
      const errorData: any = await parseJson();
      const message = (errorData && (errorData.message || errorData.error)) || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }

    return (await parseJson()) as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Default API base for non-versioned endpoints
const ROOT_API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;
export const apiClient = new ApiClient(ROOT_API_BASE);