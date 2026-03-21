import { NextRequest } from 'next/server';
import { RemoveWorkflowTransition } from '@/app/api/modules/workflows/controllers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ transitionId: string }> }
) {
  const { transitionId } = await params;
  return RemoveWorkflowTransition(request, transitionId);
}
