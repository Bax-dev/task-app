import { NextRequest } from 'next/server';
import { ReadCustomFieldValues, SetCustomFieldValue } from '@/app/api/modules/custom-fields/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadCustomFieldValues(request, id);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return SetCustomFieldValue(request, id);
}
