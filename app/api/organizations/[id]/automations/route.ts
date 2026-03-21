import { NextRequest } from 'next/server';
import { ReadAutomations } from '@/app/api/modules/automations/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadAutomations(request, id);
}
