import { NextRequest } from 'next/server';
import { AddSprintTask, RemoveSprintTask } from '@/app/api/modules/sprints/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return AddSprintTask(request, id);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return RemoveSprintTask(request, id);
}
