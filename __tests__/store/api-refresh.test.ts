import { configureStore } from '@reduxjs/toolkit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiSlice } from '@/store/api';

describe('API access-token refresh', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes and retries /auth/me after its access token expires', async () => {
    const requests: string[] = [];
    let meAttempts = 0;

    const NativeRequest = Request;
    class AbsoluteRequest extends NativeRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        const resolved = typeof input === 'string' && input.startsWith('/')
          ? `http://localhost${input}`
          : input;
        super(resolved, init);
      }
    }
    vi.stubGlobal('Request', AbsoluteRequest);

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const request = input instanceof Request ? input : new Request(input);
      const url = new URL(request.url);
      requests.push(url.pathname);

      if (url.pathname === '/api/auth/me' && meAttempts++ === 0) {
        return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      if (url.pathname === '/api/auth/refresh') {
        return Response.json({ success: true, data: { message: 'Token refreshed successfully' } });
      }
      if (url.pathname === '/api/auth/me') {
        return Response.json({
          success: true,
          data: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
        });
      }
      return Response.json({}, { status: 404 });
    }));

    const store = configureStore({
      reducer: { [apiSlice.reducerPath]: apiSlice.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    });

    const result = await store.dispatch(apiSlice.endpoints.getMe.initiate()).unwrap();

    expect(result).toMatchObject({ id: 'user-1', email: 'user@example.com' });
    expect(requests).toEqual(['/api/auth/me', '/api/auth/refresh', '/api/auth/me']);
  });
});
