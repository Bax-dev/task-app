import { NextRequest } from 'next/server';
import { handleResendOTP } from '@/app/api/modules/auth/controllers';

export async function POST(request: NextRequest) {
  return handleResendOTP(request);
}
