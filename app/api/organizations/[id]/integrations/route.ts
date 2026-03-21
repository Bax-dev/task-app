import { NextRequest } from 'next/server';
import { ReadIntegrations } from '@/app/api/modules/integrations/controllers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return ReadIntegrations(request, id);
}
