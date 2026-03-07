import { ApiClient } from '../lib/api-client';

// Helper to create a successful fetch Response
const mockOkResponse = (body: unknown, status = 200): Response =>
  ({
    ok: true,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response);

// Helper to create a failed fetch Response where body IS valid JSON
const mockJsonErrorResponse = (status: number, body: unknown): Response =>
  ({
    ok: false,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as unknown as Response);

// Helper to create a failed fetch Response where body is NOT valid JSON
const mockNonJsonErrorResponse = (status: number): Response =>
  ({
    ok: false,
    status,
    statusText: '',
    json: () => Promise.reject(new Error('not json')),
  } as unknown as Response);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  (global as any).fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ApiClient', () => {
  describe('GET requests', () => {
    test('sends GET to /api/<path>', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse([{ id: 1 }]));

      await ApiClient.get('/product');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/product',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    test('returns parsed JSON body on success', async () => {
      const payload = { id: 42, name: 'Mango' };
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse(payload));

      const result = await ApiClient.get<typeof payload>('/product/42');

      expect(result).toEqual(payload);
    });

    test('includes Authorization header when token is stored in localStorage', async () => {
      localStorage.setItem('auth_token', 'my-jwt-token');
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({}));

      await ApiClient.get('/profile');

      const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBe('Bearer my-jwt-token');
    });

    test('omits Authorization header when no token is in localStorage', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({}));

      await ApiClient.get('/products');

      const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });

    test('always sends Content-Type: application/json', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({}));

      await ApiClient.get('/products');

      const callHeaders = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      expect(callHeaders['Content-Type']).toBe('application/json');
    });
  });

  describe('POST requests', () => {
    test('sends POST with JSON-serialized body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({ id: 1 }, 201));

      await ApiClient.post('/orders', { productId: 5, qty: 2 });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/orders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ productId: 5, qty: 2 }),
        }),
      );
    });

    test('sends POST without body when none is provided', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({}, 200));

      await ApiClient.post('/auth/logout');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });

    test('returns parsed JSON from a 201 Created response', async () => {
      const created = { id: 99, status: 'PENDING' };
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse(created, 201));

      const result = await ApiClient.post<typeof created>('/orders', {});

      expect(result).toEqual(created);
    });
  });

  describe('PUT requests', () => {
    test('sends PUT with JSON body to the specified path', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({ updated: true }));

      await ApiClient.put('/user/1', { username: 'newname' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ username: 'newname' }),
        }),
      );
    });
  });

  describe('PATCH requests', () => {
    test('sends PATCH with JSON body to the specified path', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({ patched: true }));

      await ApiClient.patch('/user/1/status', { active: false });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ active: false }),
        }),
      );
    });
  });

  describe('DELETE requests', () => {
    test('sends DELETE to the specified path', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockOkResponse({}, 200));

      await ApiClient.delete('/product/1');

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/product/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('204 No Content handling', () => {
    test('returns an empty object when the response status is 204', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.reject(new Error('No content')),
      } as unknown as Response);

      const result = await ApiClient.delete('/cart/items/42');

      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    test('throws with message from the JSON error body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonErrorResponse(422, { message: 'Validation failed: price must be positive' }),
      );

      await expect(ApiClient.post('/product', {})).rejects.toMatchObject({
        message: 'Validation failed: price must be positive',
      });
    });

    test('throws with "Bad Request" for 400 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(400));

      await expect(ApiClient.post('/bad', {})).rejects.toMatchObject({
        message: 'Bad Request',
      });
    });

    test('throws with "Resource not found" for 404 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(404));

      await expect(ApiClient.get('/missing')).rejects.toMatchObject({
        message: 'Resource not found',
      });
    });

    test('throws with "Access forbidden" for 403 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(403));

      await expect(ApiClient.get('/admin-only')).rejects.toMatchObject({
        message: 'Access forbidden',
      });
    });

    test('throws with "Resource already exists" for 409 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(409));

      await expect(ApiClient.post('/register', {})).rejects.toMatchObject({
        message: 'Resource already exists',
      });
    });

    test('throws with "Internal server error" for 500 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(500));

      await expect(ApiClient.get('/crash')).rejects.toMatchObject({
        message: 'Internal server error',
      });
    });

    test('throws with "Service unavailable" for 503 when body is not JSON', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(503));

      await expect(ApiClient.get('/down')).rejects.toMatchObject({
        message: 'Service unavailable',
      });
    });
  });

  describe('401 auth:unauthorized event', () => {
    test('dispatches auth:unauthorized event on a 401 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonErrorResponse(401, { message: 'Unauthorized' }),
      );

      const listener = jest.fn();
      window.addEventListener('auth:unauthorized', listener);

      try {
        await ApiClient.get('/protected');
      } catch {
        // expected to throw
      } finally {
        window.removeEventListener('auth:unauthorized', listener);
      }

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('does NOT dispatch auth:unauthorized for a 403 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockJsonErrorResponse(403, { message: 'Forbidden' }),
      );

      const listener = jest.fn();
      window.addEventListener('auth:unauthorized', listener);

      try {
        await ApiClient.get('/forbidden');
      } catch {
        // expected
      } finally {
        window.removeEventListener('auth:unauthorized', listener);
      }

      expect(listener).not.toHaveBeenCalled();
    });

    test('does NOT dispatch auth:unauthorized for a 404 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(404));

      const listener = jest.fn();
      window.addEventListener('auth:unauthorized', listener);

      try {
        await ApiClient.get('/missing');
      } catch {
        // expected
      } finally {
        window.removeEventListener('auth:unauthorized', listener);
      }

      expect(listener).not.toHaveBeenCalled();
    });

    test('does NOT dispatch auth:unauthorized for a 500 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockNonJsonErrorResponse(500));

      const listener = jest.fn();
      window.addEventListener('auth:unauthorized', listener);

      try {
        await ApiClient.get('/crash');
      } catch {
        // expected
      } finally {
        window.removeEventListener('auth:unauthorized', listener);
      }

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
