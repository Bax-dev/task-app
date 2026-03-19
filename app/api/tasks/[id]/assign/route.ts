import { NextRequest } from 'next/server';
import { handleToggleAssignment } from '@/app/api/modules/tasks/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleToggleAssignment(request, id);
}
