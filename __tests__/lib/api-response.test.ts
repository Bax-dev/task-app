import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
} from '@/lib/api-response';

describe('API Response Helpers', () => {
  it('should create a success response', async () => {
    const res = successResponse({ id: '1', name: 'test' });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: '1', name: 'test' });
  });

  it('should create a success response with custom status', async () => {
    const res = successResponse({ id: '1' }, 201);
    expect(res.status).toBe(201);
  });

  it('should create an error response', async () => {
    const res = errorResponse('Something went wrong', 400);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Something went wrong');
  });

  it('should create an unauthorized response', async () => {
    const res = unauthorizedResponse();
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('should create a forbidden response', async () => {
    const res = forbiddenResponse();
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('should create a not found response', async () => {
    const res = notFoundResponse();
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error).toBe('Not found');
  });

  it('should create a rate limit response with retry-after header', async () => {
    const res = rateLimitResponse(30000);
    const body = await res.json();
    expect(res.status).toBe(429);
    expect(body.error).toContain('Too many requests');
    expect(res.headers.get('Retry-After')).toBe('30');
  });
});
