import { NextRequest } from 'next/server';
import { handleUpdateSubtask, handleDeleteSubtask } from '@/app/api/modules/subtasks/controllers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const { subtaskId } = await params;
  return handleUpdateSubtask(request, subtaskId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const { subtaskId } = await params;
  return handleDeleteSubtask(request, subtaskId);
}
