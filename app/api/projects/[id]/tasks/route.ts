import { NextRequest } from 'next/server';
import { handleGetProjectTasks } from '@/app/api/modules/tasks/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetProjectTasks(request, id);
}
