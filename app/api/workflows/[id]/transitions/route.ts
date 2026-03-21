import { NextRequest } from 'next/server';
import { CreateWorkflowTransition } from '@/app/api/modules/workflows/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return CreateWorkflowTransition(request, id);
}
