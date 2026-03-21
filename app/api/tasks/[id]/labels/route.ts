import { NextRequest } from 'next/server';
import { AddTaskLabel } from '@/app/api/modules/labels/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return AddTaskLabel(request, id);
}
