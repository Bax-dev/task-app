import { NextRequest } from 'next/server';
import { handleLogin } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
