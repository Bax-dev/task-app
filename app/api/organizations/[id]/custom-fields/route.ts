import { NextRequest } from 'next/server';
import { ReadCustomFields } from '@/app/api/modules/custom-fields/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadCustomFields(request, id);
}
