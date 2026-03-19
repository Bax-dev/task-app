import { NextRequest } from 'next/server';
import { handleForgotPassword } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleForgotPassword(request);
}
