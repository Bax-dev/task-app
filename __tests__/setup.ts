import { vi } from 'vitest';

// Mock next/server since it requires Next.js runtime internals
vi.mock('next/server', () => {
  class MockNextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      const headers = new Headers(init?.headers);
      headers.set('content-type', 'application/json');
      return new Response(JSON.stringify(body), {
        ...init,
        headers,
      });
    }
  }

  class MockNextRequest extends Request {
    nextUrl: URL;
    constructor(input: string | URL, init?: RequestInit) {
      super(input, init);
      this.nextUrl = new URL(typeof input === 'string' ? input : input.toString());
    }
  }

  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});
