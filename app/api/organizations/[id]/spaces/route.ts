import { NextRequest } from 'next/server';
import { handleGetOrgSpaces } from '@/app/api/modules/spaces/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return handleGetOrgSpaces(request, id);
}
