// Shared API client for all services
// Handles base URL, JSON headers, auth token injection, and error parsing

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Ensure we always join base and endpoint with a single slash
  private joinUrl(base: string, endpoint: string): string {
    const b = base.endsWith('/') ? base.slice(0, -1) : base;
    const e = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${b}${e}`;
  }

  // Rich error type is defined below as a standalone export

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.joinUrl(this.baseUrl, endpoint);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };

    // Only set JSON content type when we set a JSON body and caller hasn't overridden
    const hasContentType = Object.keys(headers).some(
      (h) => h.toLowerCase() === 'content-type'
    );

    const config: RequestInit = {
      ...options,
      headers: {
        ...(options.body !== undefined && !hasContentType
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...headers,
      },
      credentials: options.credentials ?? 'include',
    };

    let response: Response;
    try {
      response = await fetch(url, config);
    } catch (err) {
      throw new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR',
        err
      );
    }

    const parseJson = async () => {
      try {
        return await response.json();
      } catch {
        return {} as unknown;
      }
    };

    if (!response.ok) {
      const errorData: any = await parseJson();
      const message =
        (errorData && (errorData.message || errorData.error)) ||
        response.statusText ||
        `HTTP error ${response.status}`;
      const code = (errorData && (errorData.code || errorData.errorCode)) || 'HTTP_ERROR';
      throw new ApiError(message, response.status, code, errorData);
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

// Rich error type that preserves HTTP status, code, and payload
export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

// Default API base for versioned endpoints (unify to v1)
const ROOT_API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1`;
export const apiClient = new ApiClient(ROOT_API_BASE);