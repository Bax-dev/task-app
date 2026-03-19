import { handleGoogleAuth } from '@/app/api/modules/auth/controllers';

export async function POST(request: Request) {
  return handleGoogleAuth(request as any);
}
