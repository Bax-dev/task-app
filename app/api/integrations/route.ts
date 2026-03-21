import { NextRequest } from 'next/server';
import { CreateIntegration } from '@/app/api/modules/integrations/controllers';

export async function POST(request: NextRequest) {
  return CreateIntegration(request);
}
