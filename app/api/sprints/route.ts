import { NextRequest } from 'next/server';
import { CreateSprint } from '@/app/api/modules/sprints/controllers';

export async function POST(request: NextRequest) {
  return CreateSprint(request);
}
