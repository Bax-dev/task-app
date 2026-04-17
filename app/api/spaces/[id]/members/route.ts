import { NextRequest } from 'next/server';
import { handleListSpaceMembers, handleAddSpaceMember } from '@/app/api/modules/spaces/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleListSpaceMembers(request, id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAddSpaceMember(request, id);
}
