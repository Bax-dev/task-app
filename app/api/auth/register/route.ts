import { NextRequest } from 'next/server';
import { handleRegister } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleRegister(request);
}
