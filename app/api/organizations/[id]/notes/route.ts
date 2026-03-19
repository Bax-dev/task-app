import { NextRequest } from 'next/server';
import { handleGetOrgNotes } from '@/app/api/modules/notes/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetOrgNotes(request, id);
}
