import { NextRequest } from 'next/server';
import { EditWorkflowStep, RemoveWorkflowStep } from '@/app/api/modules/workflows/controllers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;
  return EditWorkflowStep(request, stepId);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stepId: string }> }
) {
  const { stepId } = await params;
  return RemoveWorkflowStep(request, stepId);
}
