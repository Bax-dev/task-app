import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/api-response';
import { handleRevokeInvitation } from '@/app/api/modules/invitations/controllers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId } = body;
    if (!invitationId) return errorResponse('invitationId is required');
    return handleRevokeInvitation(request, invitationId);
  } catch {
    return errorResponse('Failed to revoke invitation', 500);
  }
}
