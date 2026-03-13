import { ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class ApiClient {
  private static getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Fire a global event so AuthContext can clear the stale session — covers Cloudflare re-auth scenarios
      // where the backend JWT is rejected but localStorage still contains the old credentials
      if (response.status === 401 && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        const statusMessages: Record<number, string> = {
          400: 'Bad Request',
          401: 'Invalid credentials',
          403: 'Access forbidden',
          404: 'Resource not found',
          409: 'Resource already exists',
          500: 'Internal server error',
          502: 'Bad gateway',
          503: 'Service unavailable'
        };
        const message = statusMessages[response.status] || response.statusText || 'Request failed';
        error = { message: `${message}` };
      }
      throw error;
    }

    // 204 No Content should return empty object
    if (response.status === 204) {
      return {} as T;
    }

    // All other successful responses (including 201 Created) should parse JSON
    return response.json();
  }

  static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  static async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = ApiClient;
