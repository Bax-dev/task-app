import { NextRequest } from 'next/server';
import { handleMfaSetup } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleMfaSetup(request);
}
