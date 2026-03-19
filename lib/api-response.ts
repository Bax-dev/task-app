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
