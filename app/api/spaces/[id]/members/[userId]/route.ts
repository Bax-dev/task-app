import { NextRequest } from 'next/server';
import { handleRemoveSpaceMember } from '@/app/api/modules/spaces/controllers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return handleRemoveSpaceMember(request, id, userId);
}
