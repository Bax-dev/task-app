import { NextRequest } from 'next/server';
import { handleMoveTask } from '@/app/api/modules/tasks/controllers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleMoveTask(request, id);
}
