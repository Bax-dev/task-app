import { NextRequest } from 'next/server';
import { handleGetSpaceProjects } from '@/app/api/modules/projects/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetSpaceProjects(request, id);
}
