import { NextRequest } from 'next/server';
import { handleRemoveMember } from '@/app/api/modules/users/controllers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId } = await params;
  return handleRemoveMember(request, id, userId);
}
