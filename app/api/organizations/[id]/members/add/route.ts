import { NextRequest } from 'next/server';
import { handleAddMember } from '@/app/api/modules/users/controllers';

export async function POST(request: NextRequest) {
  return handleAddMember(request);
}
