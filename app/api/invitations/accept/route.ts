import { NextRequest } from 'next/server';
import { handleAcceptInvitation } from '@/app/api/modules/invitations/controllers';

export async function POST(request: NextRequest) {
  return handleAcceptInvitation(request);
}
