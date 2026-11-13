import { NextRequest } from 'next/server';
import { handleMfaVerify } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleMfaVerify(request);
}
