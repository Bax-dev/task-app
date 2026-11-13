import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = 'Not found') {
  return errorResponse(message, 404);
}

export function rateLimitResponse(resetIn: number) {
  return NextResponse.json(
    { success: false, error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
  );
}

/** An Error that knows its HTTP status. Guards throw these so generic catch blocks don't turn a 403/404 into a 500. */
export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function exceptionResponse(error: unknown) {
  if (error instanceof HttpError) return errorResponse(error.message, error.status);
  console.error('[api] unhandled error', error);
  return errorResponse(error instanceof Error ? error.message : 'Something went wrong', 500);
}
