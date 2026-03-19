import { NextRequest } from 'next/server';
import { handleGetOrgInvitations } from '@/app/api/modules/invitations/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetOrgInvitations(request, id);
}
