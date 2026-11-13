import { NextRequest } from 'next/server';
import { handleMfaStatus } from '@/app/api/modules/auth/controllers';

export async function GET(request: NextRequest) {
  return handleMfaStatus(request);
}
