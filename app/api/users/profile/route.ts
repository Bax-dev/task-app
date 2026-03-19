import { NextRequest } from 'next/server';
import { handleGetProfile, handleUpdateProfile } from '@/app/api/modules/users/controllers';

export async function GET(request: NextRequest) {
  return handleGetProfile(request);
}

export async function PATCH(request: NextRequest) {
  return handleUpdateProfile(request);
}
