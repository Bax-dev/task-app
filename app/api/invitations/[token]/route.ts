import { NextRequest } from 'next/server';
import { handleGetInvitation } from '@/app/api/modules/invitations/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return handleGetInvitation(request, token);
}
