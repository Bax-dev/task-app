import { NextRequest } from 'next/server';
import { handleAddMember } from '@/app/api/modules/users/controllers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleAddMember(request, id);
}
