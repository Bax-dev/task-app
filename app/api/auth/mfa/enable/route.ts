import { NextRequest } from 'next/server';
import { handleMfaEnable } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleMfaEnable(request);
}
