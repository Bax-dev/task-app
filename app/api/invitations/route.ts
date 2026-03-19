import { NextRequest } from 'next/server';
import { handleCreateInvitation } from '@/app/api/modules/invitations/controllers';

export async function POST(request: NextRequest) {
  return handleCreateInvitation(request);
}
