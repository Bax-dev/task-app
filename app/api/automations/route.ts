import { NextRequest } from 'next/server';
import { CreateAutomation } from '@/app/api/modules/automations/controllers';

export async function POST(request: NextRequest) {
  return CreateAutomation(request);
}
