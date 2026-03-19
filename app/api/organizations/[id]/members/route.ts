import { NextRequest } from 'next/server';
import { handleGetOrgMembers } from '@/app/api/modules/users/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetOrgMembers(request, id);
}
