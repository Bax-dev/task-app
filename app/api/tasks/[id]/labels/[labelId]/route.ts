import { NextRequest } from 'next/server';
import { RemoveTaskLabel } from '@/app/api/modules/labels/controllers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  const { id, labelId } = await params;
  return RemoveTaskLabel(request, id, labelId);
}
