import { NextRequest } from 'next/server';
import { handleMfaRecoveryCodes } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleMfaRecoveryCodes(request);
}
