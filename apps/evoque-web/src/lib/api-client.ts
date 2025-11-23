const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async getAuthToken(): Promise<string | null> {
    // Try to get token from non-httpOnly cookie (set by login for client-side access)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      
      // First try auth-token-client (non-httpOnly cookie)
      let authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth-token-client='));
      if (authCookie) {
        const token = authCookie.split('=')[1];
        if (token && token.trim()) {
          return token.trim();
        }
      }
      
      // Fallback to auth-token
      authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth-token='));
      if (authCookie) {
        const token = authCookie.split('=')[1];
        if (token && token.trim()) {
          return token.trim();
        }
      }
    }
    return null;
  }

  private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized gracefully
      if (response.status === 401) {
        let errorMessage = 'Unauthorized';
        try {
          const text = await response.text();
          if (text) {
            const errorData = JSON.parse(text);
            errorMessage = String(errorData?.error || errorData?.message || 'Unauthorized');
          }
        } catch {
          // If parsing fails, use default error message
        }
        const error = new Error(errorMessage);
        (error as any).status = 401;
        (error as any).isAuthError = true;
        throw error;
      }
      
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const text = await response.text();
        if (text) {
          const errorData = JSON.parse(text);
          errorMessage = String(errorData?.error || errorData?.message || errorMessage);
        }
      } catch {
        // If parsing fails, use default error message
      }
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      throw error;
    }

    try {
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      return JSON.parse(text) as T;
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Failed to parse response';
      throw new Error(`Failed to parse response as JSON: ${errorMessage}`);
    }
  }

  private shouldUseNextJsDirectly(endpoint: string): boolean {
    // Use Next.js API routes directly for admin endpoints
    return endpoint.startsWith('/admin/');
  }

  async get<T>(endpoint: string, options?: { auth?: boolean }): Promise<T> {
    // Check if endpoint should use Next.js API directly
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers = await this.getHeaders(options?.auth !== false);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    // Otherwise use external API
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = await this.getHeaders(options?.auth !== false);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any, options?: { auth?: boolean }): Promise<T> {
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers = await this.getHeaders(options?.auth !== false);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = await this.getHeaders(options?.auth !== false);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async put<T>(endpoint: string, data?: any, options?: { auth?: boolean }): Promise<T> {
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers = await this.getHeaders(options?.auth !== false);

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = await this.getHeaders(options?.auth !== false);

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async patch<T>(endpoint: string, data?: any, options?: { auth?: boolean }): Promise<T> {
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers = await this.getHeaders(options?.auth !== false);

      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(data),
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = await this.getHeaders(options?.auth !== false);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(endpoint: string, options?: { auth?: boolean }): Promise<T> {
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers = await this.getHeaders(options?.auth !== false);

      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = await this.getHeaders(options?.auth !== false);

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }

  async upload<T>(endpoint: string, formData: FormData, options?: { auth?: boolean }): Promise<T> {
    if (this.shouldUseNextJsDirectly(endpoint)) {
      const url = `/api${endpoint}`;
      const headers: HeadersInit = {};

      if (options?.auth !== false) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          credentials: 'include',
        });

        return this.handleResponse<T>(response);
      } catch (error) {
        throw error;
      }
    }

    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers: HeadersInit = {};

    if (options?.auth !== false) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export default apiClient;

